// POST /api/assistant — l'assistant IA de Vibz (Claude, avec outils).
// Corps : { messages: [{ role: 'user' | 'assistant', content: string }], mode?: 'chat' | 'search' }
// Réponse : { text, actions } — actions = boutons proposés (salons, mélanges, profils).
// Réglages et évolution : lib/assistant/config.ts, knowledge.ts, tools.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import {
  ASSISTANT_ENABLED, MODEL, EFFORT, USE_FALLBACKS, MAX_OUTPUT_TOKENS, MAX_TOOL_ROUNDS, MAX_HISTORY,
  MAX_QUESTION_CHARS, RATE_LIMIT_PER_MIN, PERSONA, RULES, SEARCH_MODE_HINT,
} from '../../lib/assistant/config'
import { toolDefinitions, runTool, catalogHint, type AssistantActions, type ToolContext } from '../../lib/assistant/tools'
import type { SalonInfo } from '../../lib/salons'

export const config = { maxDuration: 60 }

type ChatTurn = { role: 'user' | 'assistant'; content: string }
type Reply = { text: string; actions: AssistantActions } | { error: string }

// Limite simple par membre (par instance du serveur)
const hits = new Map<string, number[]>()
function tooMany(userId: string) {
  const now = Date.now()
  const recent = (hits.get(userId) || []).filter(t => now - t < 60000)
  recent.push(now)
  hits.set(userId, recent)
  return recent.length > RATE_LIMIT_PER_MIN
}

// Partie fixe du prompt système (mise en cache par Anthropic)
const SYSTEM_STATIC = `${PERSONA}

${RULES}

Ingrédients du catalogue (identifiant=libellé) : ${catalogHint()}`

let client: Anthropic | null = null

export default async function handler(req: NextApiRequest, res: NextApiResponse<Reply>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }
  if (!ASSISTANT_ENABLED || !process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'L’assistant n’est pas encore activé sur Vibz.' })
  }

  // ── Membre connecté ──
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Connecte-toi pour utiliser l’assistant.' })
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: auth } = await db.auth.getUser(token)
  if (!auth.user) return res.status(401).json({ error: 'Session expirée, reconnecte-toi.' })
  if (tooMany(auth.user.id)) return res.status(429).json({ error: 'Doucement 🙂 Réessaie dans une minute.' })

  // ── Conversation ──
  const body = (req.body || {}) as { messages?: ChatTurn[]; mode?: string }
  const turns = (Array.isArray(body.messages) ? body.messages : [])
    .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_QUESTION_CHARS) }))
  while (turns.length && turns[0].role !== 'user') turns.shift()
  if (!turns.length || turns[turns.length - 1].role !== 'user') return res.status(400).json({ error: 'Question manquante.' })

  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map(t => ({ role: t.role, content: t.content }))
  if (body.mode === 'search') {
    const last = messages[messages.length - 1]
    last.content = `${SEARCH_MODE_HINT}\n\nRecherche : « ${last.content} »`
  }

  const ctx: ToolContext = {
    db, userId: auth.user.id,
    actions: { salons: [], mixes: [], profiles: [] },
    seenSalons: new Map<string, SalonInfo>(),
    seenProfiles: new Map<string, string>(),
  }
  const tools = toolDefinitions()
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

  client ||= new Anthropic()
  let text = ''
  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: [
          { type: 'text', text: SYSTEM_STATIC, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `Nous sommes le ${today}.` },
        ],
        thinking: { type: 'adaptive' },
        output_config: { effort: EFFORT },
        // Dernière consultation autorisée : on demande une réponse sans outil
        tool_choice: round === MAX_TOOL_ROUNDS ? { type: 'none' } : { type: 'auto' },
        tools,
        messages,
        ...(USE_FALLBACKS ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      })

      if (response.stop_reason === 'refusal') {
        text = 'Je ne peux pas t’aider sur ce point. Je reste disponible pour les salons, les profils et le fonctionnement de Vibz.'
        break
      }
      const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
      text = response.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map(b => b.text).join('\n').trim()
      if (response.stop_reason !== 'tool_use' || !toolUses.length) break

      messages.push({ role: 'assistant', content: response.content })
      const results = await Promise.all(toolUses.map(async (t): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
        const r = await runTool(t.name, t.input, ctx)
        return { type: 'tool_result', tool_use_id: t.id, content: r.content, is_error: r.isError }
      }))
      messages.push({ role: 'user', content: results })
    }
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'L’assistant est très sollicité, réessaie dans un instant.' })
    if (e instanceof Anthropic.AuthenticationError) {
      console.error('[assistant] clé Anthropic refusée')
      return res.status(503).json({ error: 'L’assistant est momentanément indisponible.' })
    }
    if (e instanceof Anthropic.APIError) {
      console.error('[assistant] API', e.status, e.message)
      return res.status(502).json({ error: 'L’assistant n’a pas pu répondre, réessaie.' })
    }
    console.error('[assistant]', e)
    return res.status(500).json({ error: 'L’assistant n’a pas pu répondre, réessaie.' })
  }

  return res.status(200).json({
    text: text || (ctx.actions.salons.length || ctx.actions.mixes.length ? 'Voici ce que j’ai trouvé :' : 'Je n’ai pas trouvé de réponse, reformule ta question ?'),
    actions: ctx.actions,
  })
}
