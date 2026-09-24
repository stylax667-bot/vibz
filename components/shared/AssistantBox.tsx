import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import { ASSISTANT_NAME } from '../../lib/assistant/config'
import type { AssistantActions } from '../../lib/assistant/tools'

type Turn = { role: 'user' | 'assistant'; content: string; actions?: AssistantActions }
type Handlers = {
  onOpenSalon: (id: string) => void
  onMix: (tags: string[]) => void
}

const font = 'Nunito, sans-serif'

async function ask(messages: Turn[], mode: 'chat' | 'search'): Promise<{ text: string; actions?: AssistantActions; error?: string }> {
  const { data: { session } } = await supabase.auth.getSession()
  try {
    const res = await fetch('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ mode, messages: messages.map(m => ({ role: m.role, content: m.content })) }),
    })
    const out = await res.json().catch(() => ({ error: 'Réponse inattendue.' }))
    if (!res.ok || out.error) return { text: '', error: out.error || 'L’assistant n’a pas pu répondre.' }
    return { text: out.text, actions: out.actions }
  } catch {
    return { text: '', error: 'Connexion impossible. Vérifie ton réseau.' }
  }
}

// Boutons proposés par l'assistant
function Actions({ actions, onOpenSalon, onMix }: { actions?: AssistantActions } & Handlers) {
  const { theme: tk } = useTheme()
  if (!actions) return null
  const b = (color: string): React.CSSProperties => ({
    display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 10, marginTop: 5, cursor: 'pointer',
    border: `1.5px solid ${color}55`, background: `${color}12`, color: tk.text, fontFamily: font, fontSize: 12,
  })
  return (
    <div>
      {actions.salons.map(s => (
        <button key={s.id} onClick={() => onOpenSalon(s.id)} style={b(tk.green)}>
          <strong>{s.icon || '🎛️'} {s.name}</strong>
          <span style={{ display: 'block', fontSize: 10.5, color: tk.textMuted }}>{s.facts}</span>
        </button>
      ))}
      {actions.mixes.map((m, i) => (
        <button key={i} onClick={() => onMix(m.tags)} style={b(tk.pink)}>
          <strong>🎛️ Rejoindre ou créer :</strong> {m.label}
        </button>
      ))}
      {actions.profiles.map(p => (
        <a key={p.id} href={`/profil/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ ...b(tk.blue), textDecoration: 'none' }}>
          <strong>👤 {p.name}</strong> <span style={{ fontSize: 10.5, color: tk.textMuted }}>voir le profil ↗</span>
        </a>
      ))}
    </div>
  )
}

// ── Réponse de l'assistant à une recherche (barre des salons) ────────────────
export default function AssistantBox({ question, mode = 'search', onOpenSalon, onMix, onClose }: {
  question: string; mode?: 'chat' | 'search'; onClose: () => void
} & Handlers) {
  const { theme: tk } = useTheme()
  const [state, setState] = useState<{ loading: boolean; text?: string; actions?: AssistantActions; error?: string }>({ loading: true })

  useEffect(() => {
    let alive = true
    ask([{ role: 'user', content: question }], mode).then(r => { if (alive) setState({ loading: false, ...r }) })
    return () => { alive = false }
  }, [question, mode])

  return (
    <div style={{ padding: 10, borderRadius: 12, border: `1.5px solid ${tk.blue}44`, background: tk.blueLight, fontFamily: font }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ flex: 1, fontSize: 11.5, fontWeight: 800, color: tk.blueDark }}>🤖 {ASSISTANT_NAME}</span>
        <button onClick={onClose} aria-label="Fermer la réponse" style={{ border: 'none', background: 'none', color: tk.textMuted, cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
      {state.loading ? (
        <div style={{ fontSize: 12.5, color: tk.textSub }}>Je cherche parmi les salons ouverts…</div>
      ) : state.error ? (
        <div style={{ fontSize: 12.5, color: '#ef4444' }}>{state.error}</div>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: tk.text, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{state.text}</div>
          <Actions actions={state.actions} onOpenSalon={onOpenSalon} onMix={onMix} />
        </>
      )}
    </div>
  )
}

// ── Bulle de discussion disponible partout ───────────────────────────────────
export function AssistantChat({ onOpenSalon, onMix, bottomOffset = 20 }: Handlers & { bottomOffset?: number }) {
  const { theme: tk } = useTheme()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [turns, loading])

  const send = async (text?: string) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    const next: Turn[] = [...turns, { role: 'user', content: q }]
    setTurns(next); setInput(''); setLoading(true); setError('')
    const r = await ask(next, 'chat')
    setLoading(false)
    if (r.error) { setError(r.error); return }
    setTurns([...next, { role: 'assistant', content: r.text, actions: r.actions }])
  }

  const act = (fn: () => void) => { fn(); if (isMobile) setOpen(false) }
  const suggestions = ['Quel salon me correspond ?', 'Trouve des guitaristes près de chez moi', 'Comment privatiser un salon ?']

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label={`Ouvrir ${ASSISTANT_NAME}`}
          style={{ position: 'fixed', right: 16, bottom: bottomOffset, zIndex: 300, width: 52, height: 52, borderRadius: 18, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6BB8E8,#A78BDB)', color: 'white', fontSize: 24, boxShadow: '0 6px 20px rgba(107,184,232,0.45)' }}>
          🤖
        </button>
      )}
      {open && (
        <div role="dialog" aria-label={ASSISTANT_NAME}
          style={{
            position: 'fixed', zIndex: 450, fontFamily: font, background: tk.surface, color: tk.text, border: `1px solid ${tk.border}`,
            boxShadow: `0 16px 50px ${tk.shadow}`, display: 'flex', flexDirection: 'column',
            ...(isMobile ? { inset: 0, borderRadius: 0 } : { right: 16, bottom: bottomOffset, width: 380, height: 540, maxHeight: 'calc(100vh - 100px)', borderRadius: 20 }),
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: `1px solid ${tk.border}`, paddingTop: isMobile ? 'calc(12px + env(safe-area-inset-top))' : 12 }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{ASSISTANT_NAME}</div>
              <div style={{ fontSize: 11, color: tk.textMuted }}>Salons, profils, fonctionnement du site, questions générales</div>
            </div>
            {turns.length > 0 && <button onClick={() => { setTurns([]); setError('') }} title="Nouvelle conversation" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, color: tk.textMuted }}>↺</button>}
            <button onClick={() => setOpen(false)} aria-label="Fermer" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: tk.textMuted }}>✕</button>
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {turns.length === 0 && (
              <div style={{ fontSize: 13, color: tk.textSub, lineHeight: 1.55 }}>
                Salut ! Dis-moi ce que tu cherches : je trouve les salons ouverts, les musiciens qui te correspondent, ou je t’explique le site.
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                  {suggestions.map(s => (
                    <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.surface2, color: tk.text, cursor: 'pointer', fontFamily: font, fontSize: 12.5 }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} style={{ alignSelf: t.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                <div style={{
                  padding: '9px 12px', borderRadius: t.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px', fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-line',
                  background: t.role === 'user' ? 'linear-gradient(135deg,#6BB8E8,#A78BDB)' : tk.surface2, color: t.role === 'user' ? 'white' : tk.text,
                }}>{t.content}</div>
                {t.role === 'assistant' && (
                  <Actions actions={t.actions} onOpenSalon={id => act(() => onOpenSalon(id))} onMix={tags => act(() => onMix(tags))} />
                )}
              </div>
            ))}
            {loading && <div style={{ fontSize: 12.5, color: tk.textMuted }}>{ASSISTANT_NAME} réfléchit…</div>}
            {error && <div style={{ fontSize: 12.5, color: '#ef4444' }}>{error}</div>}
          </div>

          <div style={{ padding: 10, borderTop: `1px solid ${tk.border}`, display: 'flex', gap: 8, paddingBottom: isMobile ? 'calc(10px + env(safe-area-inset-bottom))' : 10 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Pose ta question…" maxLength={1000} enterKeyHint="send"
              style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 20, border: `1.5px solid ${tk.border}`, background: tk.inputBg, color: tk.text, fontSize: 14, fontFamily: font, outline: 'none' }} />
            <button onClick={() => send()} disabled={loading} aria-label="Envoyer"
              style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: loading ? 'wait' : 'pointer', background: 'linear-gradient(135deg,#6BB8E8,#A78BDB)', color: 'white', fontSize: 15, flexShrink: 0 }}>➤</button>
          </div>
          <div style={{ fontSize: 10, color: tk.textMuted, textAlign: 'center', padding: '0 10px 8px' }}>
            Réponses générées par IA (Claude), à vérifier. Ne partage pas d’informations personnelles.
          </div>
        </div>
      )}
    </>
  )
}
