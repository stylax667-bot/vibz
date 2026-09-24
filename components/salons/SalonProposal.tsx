import { useState } from 'react'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import { CATALOG_BY_ID } from '../../lib/musicCatalog'
import { matchSalons, salonFacts, defaultSalonName, type SalonInfo } from '../../lib/salons'

interface Props {
  tags: string[]
  initialName?: string
  salons: SalonInfo[]
  busy?: boolean
  error?: string
  onJoin: (s: SalonInfo) => void
  onCreate: (opts: { name: string; parentId: string | null; isPrivate: boolean }) => void
  onChangeIngredients: () => void
  onClose: () => void
}

const font = 'Nunito, sans-serif'

// Proposée après chaque mélange d'ingrédients : rejoindre un salon qui existe,
// en créer une annexe (ramification du thème), changer d'ingrédients ou créer un salon.
export default function SalonProposal({ tags, initialName, salons, busy, error, onJoin, onCreate, onChangeIngredients, onClose }: Props) {
  const { theme: tk } = useTheme()
  const isMobile = useIsMobile()
  const [name, setName] = useState(initialName || '')
  const [isPrivate, setIsPrivate] = useState(false)
  const { exact, close } = matchSalons(tags, salons)
  const byId = Object.fromEntries(salons.map(s => [s.id, s]))
  const exactRoot = exact.find(s => !s.parent_id)
  const items = tags.map(t => CATALOG_BY_ID[t]).filter(Boolean)

  const btn = (kind: 'main' | 'soft' | 'ghost', color = tk.pink): React.CSSProperties => ({
    padding: '9px 14px', borderRadius: 12, fontFamily: font, fontWeight: 800, fontSize: 13, cursor: busy ? 'wait' : 'pointer',
    border: kind === 'ghost' ? `1.5px solid ${tk.border}` : kind === 'soft' ? `1.5px solid ${color}55` : 'none',
    background: kind === 'main' ? color : kind === 'soft' ? `${color}14` : 'transparent',
    color: kind === 'main' ? 'white' : kind === 'soft' ? color : tk.text, whiteSpace: 'nowrap',
  })

  const card = (s: SalonInfo, highlight: boolean) => {
    const parent = s.parent_id ? byId[s.parent_id] : undefined
    const full = s.member_count >= s.max_members
    return (
      <div key={s.id} style={{ padding: 12, borderRadius: 14, border: `1.5px solid ${highlight ? (s.color || tk.blue) : tk.border}`, background: highlight ? `${s.color || tk.blue}10` : tk.surface2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>{s.icon || '🎛️'}</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: tk.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
          {s.is_locked && <span title="Salon privé">🔒</span>}
        </div>
        <div style={{ fontSize: 11.5, color: tk.textSub, marginBottom: 4 }}>
          {s.tags.map(t => CATALOG_BY_ID[t]).filter(Boolean).map(i => `${i.emoji} ${i.label}`).join(' · ')}
        </div>
        <div style={{ fontSize: 11, color: tk.textMuted, lineHeight: 1.5, marginBottom: 8 }}>{salonFacts(s, parent?.name).join(' · ')}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {s.is_member ? (
            <button disabled={busy} onClick={() => onJoin(s)} style={btn('main', tk.green)}>Ouvrir mon salon</button>
          ) : s.request_pending ? (
            <button disabled style={{ ...btn('soft', tk.textMuted), cursor: 'default' }}>⏳ Demande envoyée</button>
          ) : s.is_locked ? (
            <button disabled={busy} onClick={() => onJoin(s)} style={btn('main', tk.blue)}>🔑 Demander à entrer</button>
          ) : full ? (
            <button disabled style={{ ...btn('soft', tk.textMuted), cursor: 'default' }}>Complet</button>
          ) : (
            <button disabled={busy} onClick={() => onJoin(s)} style={btn('main', tk.green)}>🔀 Rejoindre</button>
          )}
          <button disabled={busy} onClick={() => onCreate({ name, parentId: s.parent_id || s.id, isPrivate })} style={btn('soft', s.color || tk.pink)}>
            🌿 Créer une annexe
          </button>
        </div>
      </div>
    )
  }

  return (
    <div onClick={() => !busy && onClose()} style={{ position: 'fixed', inset: 0, zIndex: 500, background: tk.overlay, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16, fontFamily: font }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Rejoindre ou créer un salon"
        style={{ background: tk.surface, color: tk.text, width: '100%', maxWidth: 560, maxHeight: isMobile ? '92dvh' : '88vh', overflowY: 'auto', borderRadius: isMobile ? '22px 22px 0 0' : 22, padding: isMobile ? '18px 16px calc(18px + env(safe-area-inset-bottom))' : 22, border: `1px solid ${tk.border}` }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Ton mélange</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {items.map(i => (
            <span key={i.id} style={{ padding: '4px 10px', borderRadius: 14, fontSize: 12, fontWeight: 800, background: `${i.color}1A`, color: i.color }}>{i.emoji} {i.label}</span>
          ))}
        </div>

        {exact.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: tk.blueDark, marginBottom: 6 }}>🔀 Un salon existe déjà avec ces ingrédients</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{exact.map(s => card(s, true))}</div>
          </div>
        )}

        {close.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: tk.textSub, marginBottom: 6 }}>Salons proches (ingrédients en commun)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{close.slice(0, 5).map(s => card(s, false))}</div>
          </div>
        )}

        {exact.length === 0 && close.length === 0 && (
          <div style={{ fontSize: 13, color: tk.textSub, marginBottom: 14, lineHeight: 1.5 }}>
            Aucun salon ouvert avec ces ingrédients pour l&apos;instant. Lance le premier !
          </div>
        )}

        <div style={{ borderTop: `1px solid ${tk.border}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={80}
            placeholder={`Nom du salon (optionnel) · ${defaultSalonName(tags)}`}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${tk.border}`, background: tk.inputBg, color: tk.text, fontSize: 13, fontFamily: font, outline: 'none' }} />
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: tk.textSub, cursor: 'pointer', lineHeight: 1.45 }}>
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} style={{ marginTop: 2, accentColor: tk.pink }} />
            <span><strong style={{ color: tk.text }}>🔒 Salon privé</strong> : il reste visible dans la liste, mais on y entre seulement si tu acceptes la demande.</span>
          </label>
          {exactRoot && (
            <div style={{ fontSize: 11.5, color: tk.textMuted, lineHeight: 1.45 }}>
              Ce mélange a déjà son salon principal : rejoins-le, crée une annexe rangée sous son thème, ou change tes ingrédients.
            </div>
          )}
          {error && <div style={{ fontSize: 12.5, color: '#ef4444', fontWeight: 700 }}>⚠️ {error}</div>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button disabled={busy} onClick={onClose} style={btn('ghost')}>Annuler</button>
            <button disabled={busy} onClick={onChangeIngredients} style={btn('soft', tk.blue)}>✏️ Changer mes ingrédients</button>
            {!exactRoot && (
              <button disabled={busy} onClick={() => onCreate({ name, parentId: null, isPrivate })} style={btn('main')}>
                {busy ? '…' : '🎛️ Créer ce salon'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
