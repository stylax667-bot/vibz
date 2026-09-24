// ══════════════════════════════════════════════════════════════════
//  Outils de l'assistant : ce qu'il peut consulter et proposer.
//  Chaque outil = une définition (lue par Claude) + une fonction run().
//  Les requêtes passent par la session du membre : la base applique ses
//  propres règles d'accès (RLS), l'assistant ne voit rien de plus que lui.
//  Pour ajouter un outil : l'ajouter à TOOLS, puis son nom à ENABLED_TOOLS (config.ts).
// ══════════════════════════════════════════════════════════════════
import type Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CATALOG_BY_ID, searchCatalog, norm, matchTerms } from '../musicCatalog'
import { salonFacts, tagLabels, type SalonInfo } from '../salons'
import { KNOWLEDGE, KNOWLEDGE_TOPICS } from './knowledge'
import { ENABLED_TOOLS } from './config'

export type AssistantActions = {
  salons: { id: string; name: string; icon: string | null; facts: string }[]
  mixes: { tags: string[]; label: string }[]
  profiles: { id: string; name: string }[]
}

export type ToolContext = {
  db: SupabaseClient        // client connecté avec la session du membre
  userId: string
  actions: AssistantActions
  seenSalons: Map<string, SalonInfo>
  seenProfiles: Map<string, string>
}

type ToolDef = {
  definition: Anthropic.Beta.BetaTool
  run: (input: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>
}

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '')
const strList = (v: unknown, max = 10) => (Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(0, max) as string[] : [])

async function loadSalons(ctx: ToolContext) {
  const { data, error } = await ctx.db.rpc('salon_list')
  if (error) throw new Error('Liste des salons indisponible')
  const list = (data as SalonInfo[]) || []
  list.forEach(s => ctx.seenSalons.set(s.id, s))
  return list
}

const TOOLS: Record<string, ToolDef> = {
  search_salons: {
    definition: {
      name: 'search_salons',
      description: 'Liste les salons réellement ouverts sur Vibz (créés par les membres), avec leurs ingrédients, nombre de membres, membres en ligne, statut privé et activité. Filtre facultatif par mots-clés et/ou par identifiants d\'ingrédients du catalogue. Ne renvoie jamais le contenu des messages.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Mots-clés libres (nom, style, instrument). Vide = tous les salons.' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Identifiants d\'ingrédients (voir search_catalog).' },
        },
      },
    },
    async run(input, ctx) {
      const list = await loadSalons(ctx)
      const words = norm(str(input.query)).split(/[\s,;]+/).filter(w => w.length > 1)
      const tags = strList(input.tags, 12)
      const scored = list.map(s => {
        const text = norm([s.name, ...s.tags.map(t => CATALOG_BY_ID[t]?.label || t)].join(' '))
        const wordHits = words.filter(w => text.includes(w)).length
        const tagHits = s.tags.filter(t => tags.includes(t)).length
        return { s, score: wordHits + tagHits * 2 }
      })
      const filtered = words.length || tags.length ? scored.filter(x => x.score > 0) : scored
      const top = filtered.sort((a, b) => b.score - a.score || b.s.online_count - a.s.online_count).slice(0, 10)
      return {
        total_open: list.length,
        results: top.map(({ s }) => ({
          id: s.id, name: s.name, ingredients: tagLabels(s.tags), tag_ids: s.tags,
          annexe_de: s.parent_id ? ctx.seenSalons.get(s.parent_id)?.name || null : null,
          prive: s.is_locked, deja_membre: s.is_member, complet: s.member_count >= s.max_members,
          details: salonFacts(s).join(' · '),
        })),
      }
    },
  },

  search_catalog: {
    definition: {
      name: 'search_catalog',
      description: 'Cherche dans le catalogue des ingrédients de salon (styles musicaux et instruments) et renvoie leurs identifiants, à utiliser dans search_salons ou propose_actions.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Un ou plusieurs mots (ex. « guitare jazz », « électro »). Vide = tout le catalogue.' },
          kind: { type: 'string', enum: ['style', 'instrument'] },
        },
      },
    },
    async run(input) {
      const kind = input.kind === 'style' || input.kind === 'instrument' ? input.kind : undefined
      const words = str(input.query).split(/[\s,;]+/).filter(Boolean)
      const found = new Map<string, { id: string; label: string; type: string }>()
      ;(words.length ? words : ['']).forEach(w => searchCatalog(w, kind).forEach(i => found.set(i.id, { id: i.id, label: `${i.emoji} ${i.label}`, type: i.kind })))
      return { results: Array.from(found.values()).slice(0, 30) }
    },
  },

  search_members: {
    definition: {
      name: 'search_members',
      description: 'Cherche des profils publics de membres par instrument, style, ville ou mots-clés. Renvoie uniquement des informations publiques (pseudo, instruments, styles, ville si le membre l\'affiche, début de bio). Exclut les membres bloqués.',
      input_schema: {
        type: 'object',
        properties: {
          instruments: { type: 'array', items: { type: 'string' } },
          genres: { type: 'array', items: { type: 'string' } },
          city: { type: 'string' },
          text: { type: 'string', description: 'Mots-clés cherchés dans la bio ou le pseudo' },
        },
      },
    },
    async run(input, ctx) {
      const [{ data: profiles }, { data: blockedMe }, { data: myBlocks }] = await Promise.all([
        ctx.db.from('profiles')
          .select('id, display_name, username, instruments, music_genres, city, show_location, bio, looking_for, is_banned')
          .neq('id', ctx.userId).order('last_seen', { ascending: false }).limit(300),
        ctx.db.rpc('blocked_me'),
        ctx.db.from('blocks').select('blocked_id').eq('blocker_id', ctx.userId),
      ])
      const hidden = new Set<string>([
        ...((blockedMe as unknown as string[] | null) || []).map(x => (typeof x === 'string' ? x : (x as { blocked_me?: string }).blocked_me || '')),
        ...((myBlocks as { blocked_id: string }[] | null) || []).map(b => b.blocked_id),
      ])
      const inst = strList(input.instruments).map(norm)
      const gen = strList(input.genres).map(norm)
      const city = norm(str(input.city, 80))
      const words = norm(str(input.text)).split(/\s+/).filter(w => w.length > 2)
      const has = (list: string[] | null, wanted: string[]) =>
        wanted.every(w => (list || []).some(x => norm(x).includes(w) || w.includes(norm(x))))
      type P = { id: string; display_name: string | null; username: string | null; instruments: string[] | null; music_genres: string[] | null; city: string | null; show_location: boolean | null; bio: string | null; looking_for: string[] | null; is_banned: boolean | null }
      const results = ((profiles as P[] | null) || [])
        .filter(p => !p.is_banned && !hidden.has(p.id))
        .filter(p => has(p.instruments, inst) && has(p.music_genres, gen))
        .filter(p => !city || (p.show_location !== false && norm(p.city || '').includes(city)))
        .filter(p => !words.length || words.some(w => norm(`${p.display_name} ${p.username} ${p.bio}`).includes(w)))
        .slice(0, 8)
        .map(p => {
          const name = p.display_name || p.username || 'Membre'
          ctx.seenProfiles.set(p.id, name)
          return {
            id: p.id, pseudo: name,
            instruments: p.instruments || [], styles: p.music_genres || [],
            ville: p.show_location === false ? null : p.city || null,
            recherche: p.looking_for || [],
            bio: (p.bio || '').slice(0, 140),
          }
        })
      return { results }
    },
  },

  site_info: {
    definition: {
      name: 'site_info',
      description: `Informations officielles sur le fonctionnement et les règles de Vibz. Sujets : ${KNOWLEDGE_TOPICS.join(', ')}, ou « all ».`,
      input_schema: {
        type: 'object',
        properties: { topic: { type: 'string', enum: [...KNOWLEDGE_TOPICS, 'all'] } },
        required: ['topic'],
      },
    },
    async run(input) {
      const t = str(input.topic, 40)
      if (t === 'all') return KNOWLEDGE
      return { [t]: KNOWLEDGE[t] || 'Sujet inconnu.' }
    },
  },

  propose_actions: {
    definition: {
      name: 'propose_actions',
      description: 'Affiche au membre des boutons cliquables sous ta réponse : salons à ouvrir (identifiants renvoyés par search_salons), mélanges d\'ingrédients pour créer ou rejoindre un salon (identifiants du catalogue), profils à voir (identifiants renvoyés par search_members). N\'utilise que des identifiants obtenus par les autres outils.',
      input_schema: {
        type: 'object',
        properties: {
          salon_ids: { type: 'array', items: { type: 'string' } },
          mixes: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: 'Chaque mélange = liste d\'identifiants du catalogue' },
          profile_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    async run(input, ctx) {
      const refused: string[] = []
      strList(input.salon_ids, 6).forEach(id => {
        const s = ctx.seenSalons.get(id)
        if (!s) { refused.push(id); return }
        if (!ctx.actions.salons.some(x => x.id === id)) ctx.actions.salons.push({ id, name: s.name, icon: s.icon, facts: salonFacts(s).slice(0, 2).join(' · ') })
      })
      ;(Array.isArray(input.mixes) ? input.mixes : []).slice(0, 4).forEach(m => {
        const tags = strList(m, 8).filter(t => CATALOG_BY_ID[t])
        if (tags.length) ctx.actions.mixes.push({ tags, label: tagLabels(tags).join(' + ') })
      })
      strList(input.profile_ids, 6).forEach(id => {
        const name = ctx.seenProfiles.get(id)
        if (!name) { refused.push(id); return }
        if (!ctx.actions.profiles.some(x => x.id === id)) ctx.actions.profiles.push({ id, name })
      })
      return { ok: true, ignores: refused.length ? `Identifiants inconnus ignorés : ${refused.join(', ')}` : undefined }
    },
  },
}

export const activeTools = (): ToolDef[] =>
  (ENABLED_TOOLS as readonly string[]).map(n => TOOLS[n]).filter(Boolean)

export const toolDefinitions = (): Anthropic.Beta.BetaTool[] => activeTools().map(t => t.definition)

export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<{ content: string; isError: boolean }> {
  const tool = (ENABLED_TOOLS as readonly string[]).includes(name) ? TOOLS[name] : undefined
  if (!tool) return { content: `Outil inconnu : ${name}`, isError: true }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { content: 'Paramètres invalides.', isError: true }
  try {
    return { content: JSON.stringify(await tool.run(input as Record<string, unknown>, ctx)), isError: false }
  } catch (e) {
    return { content: e instanceof Error ? e.message : 'Erreur de l\'outil.', isError: true }
  }
}

// Petit rappel des termes du catalogue, utile pour relier les mots d'un membre aux ingrédients
export const catalogHint = () => Object.values(CATALOG_BY_ID).map(i => `${i.id}=${i.label}${i.match ? ` (${matchTerms(i).join('/')})` : ''}`).join(', ')
