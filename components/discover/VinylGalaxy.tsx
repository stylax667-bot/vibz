import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { STYLES, INSTRUMENTS, CATALOG_BY_ID, searchCatalog, type CatalogItem } from '../../lib/musicCatalog'

// ── Distribution sur 3 anneaux sans chevauchement ─────────────────────────────
function assignOrbits(items: CatalogItem[]) {
  const n = items.length
  // Peu d'éléments (résultats de recherche) : on les garde près du vinyle
  const r0 = n <= 6 ? n : n <= 14 ? Math.ceil(n / 2) : Math.round(n * 0.25)   // anneau intérieur
  const r1 = n <= 6 ? 0 : n <= 14 ? n - r0 : Math.round(n * 0.38)              // anneau médian
  return items.map((item, i) => {
    let ring: number, posInRing: number, countInRing: number
    if (i < r0)           { ring = 0; posInRing = i;           countInRing = r0 }
    else if (i < r0 + r1) { ring = 1; posInRing = i - r0;      countInRing = r1 }
    else                  { ring = 2; posInRing = i - r0 - r1; countInRing = n - r0 - r1 }
    // Peu d'éléments : anneaux plus larges pour que les étiquettes ne touchent pas le disque
    const radii = n <= 14 ? [150, 205, 210] : [100, 158, 210]
    const radius = radii[ring]
    // Décalage en quinconce entre anneaux pour éviter l'alignement radial
    const offset = ring === 1 ? Math.PI / Math.max(1, r1) : ring === 2 ? Math.PI / Math.max(1, n - r0 - r1) * 0.5 : 0
    const angle = offset + (posInRing / Math.max(1, countInRing)) * Math.PI * 2 - Math.PI / 2
    return { ...item, radius, angle }
  })
}

interface Props {
  // Crée (ou rejoint) le salon de cette combinaison — renvoie un message d'erreur éventuel
  onCreateSalon: (ids: string[], name: string) => Promise<string | null>
  onFilterChange: (ids: string[]) => void
  isDark?: boolean
}

type GalaxyMode = 'styles' | 'instruments'

const SIZE = 460

export default function VinylGalaxy({ onCreateSalon, onFilterChange, isDark = true }: Props) {
  const [mode, setMode]           = useState<GalaxyMode>('styles')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<string[]>([])
  const [dragOver, setDragOver]   = useState(false)
  const [salonName, setSalonName] = useState('')
  const [vinylAngle, setVinylAngle] = useState(0)
  const [hovered, setHovered]     = useState<string | null>(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const [creating, setCreating]   = useState(false)
  const [error, setError]         = useState('')
  const [scale, setScale]         = useState(1)
  const rafRef  = useRef<number>(0)
  const lastRef = useRef<number>(0)
  const boxRef  = useRef<HTMLDivElement>(null)

  const muted = isDark ? '#9BA8C0' : '#6B7A9A'
  const text  = isDark ? '#E2E8F8' : '#1A1E2E'
  const glass = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,30,46,0.04)'
  const line  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,30,46,0.10)'

  // Le disque (460px) se réduit pour tenir dans la colonne / l'écran
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / SIZE)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Animation RAF — disque vinyle uniquement
  useEffect(() => {
    const speed = selected.length > 0 ? 45 : 7
    const animate = (ts: number) => {
      if (lastRef.current) {
        const dt = (ts - lastRef.current) / 1000
        setVinylAngle(a => (a + speed * dt) % 360)
      }
      lastRef.current = ts
      rafRef.current = requestAnimationFrame(animate)
    }
    lastRef.current = 0
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [selected.length])

  // Recherche : porte sur les styles ET les instruments.
  // Sans recherche, l'orbite affiche la catégorie de l'onglet actif.
  // La sélection est conservée d'un onglet à l'autre → toute combinaison est possible.
  const filtered = useMemo(
    () => search.trim() ? searchCatalog(search) : (mode === 'styles' ? STYLES : INSTRUMENTS),
    [search, mode],
  )
  const orbitItems = useMemo(() => assignOrbits(filtered.slice(0, 40)), [filtered])

  useEffect(() => { onFilterChange(selected) }, [selected, onFilterChange])

  const toggle = useCallback((id: string) => {
    setError('')
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData('galaxy-item')
    if (id && !selected.includes(id)) setSelected(p => [...p, id])
  }

  const reset = () => { setSelected([]); setSalonName(''); setShowNameInput(false); setError('') }

  const handleCreate = async () => {
    if (selected.length === 0 || creating) return
    setCreating(true); setError('')
    const err = await onCreateSalon(selected, salonName.trim())
    setCreating(false)
    if (err) setError(err)
    else reset()
  }

  const selectedItems = selected.map(id => CATALOG_BY_ID[id]).filter(Boolean)
  const nStyles = selectedItems.filter(i => i.kind === 'style').length
  const nInstr  = selectedItems.length - nStyles

  const CX = SIZE / 2
  const CY = SIZE / 2
  const font = 'Nunito, sans-serif'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%' }}>

      {/* ── Onglets Styles / Instruments ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, background: glass, borderRadius: 24, padding: 4, border: `1px solid ${line}` }}>
        {(['styles', 'instruments'] as GalaxyMode[]).map(m => {
          const n = m === 'styles' ? nStyles : nInstr
          return (
            <button key={m} onClick={() => { setMode(m); setSearch('') }}
              style={{
                padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontFamily: font, fontSize: 12, fontWeight: 800,
                background: mode === m && !search ? (m === 'styles' ? '#E07A9A' : '#52C07A') : 'transparent',
                color: mode === m && !search ? 'white' : muted,
                transition: 'all 0.2s',
              }}>
              {m === 'styles' ? '🎼 Styles' : '🎵 Instruments'}{n > 0 ? ` · ${n}` : ''}
            </button>
          )
        })}
      </div>

      {/* ── Barre de recherche (styles + instruments) ── */}
      <div style={{ width: '100%', maxWidth: 360, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 13px', borderRadius: 20, background: glass, border: `1px solid ${line}` }}>
          <span style={{ fontSize: 12, opacity: 0.55 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) { toggle(filtered[0].id); setSearch('') } }}
            placeholder="Jazz, piano, techno… (Entrée pour ajouter)"
            aria-label="Rechercher un style ou un instrument"
            style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: text, fontSize: 12, fontFamily: font, outline: 'none' }}
          />
          {search && <span style={{ fontSize: 10, color: muted, fontWeight: 700 }}>{filtered.length}</span>}
          {search && <button onClick={() => setSearch('')} aria-label="Effacer" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: muted, fontSize: 12, padding: 2 }}>✕</button>}
        </div>
      </div>

      {/* ── Canvas (mis à l'échelle) ── */}
      <div ref={boxRef} style={{ width: '100%', maxWidth: SIZE, height: SIZE * scale, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', width: SIZE, height: SIZE, transform: `translateX(-50%) scale(${scale})`, transformOrigin: 'top center' }}>

          {/* Halos */}
          {[218, 165, 106].map((r, i) => (
            <div key={r} style={{
              position: 'absolute', top: CY - r, left: CX - r, width: r * 2, height: r * 2,
              borderRadius: '50%', border: `1px solid ${isDark ? `rgba(255,255,255,${0.025 - i * 0.005})` : `rgba(26,30,46,${0.06 - i * 0.012})`}`,
              pointerEvents: 'none',
            }} />
          ))}

          {filtered.length === 0 && (
            <div style={{ position: 'absolute', top: 40, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: muted, fontFamily: font }}>
              Aucun style ni instrument pour « {search} »
            </div>
          )}

          {/* Bulles */}
          {orbitItems.map(item => {
            const x = CX + item.radius * Math.cos(item.angle)
            const y = CY + item.radius * Math.sin(item.angle)
            const isSel = selected.includes(item.id)
            const isHov = hovered === item.id
            return (
              <div
                key={item.id}
                role="button"
                aria-pressed={isSel}
                draggable
                onDragStart={e => e.dataTransfer.setData('galaxy-item', item.id)}
                onClick={() => toggle(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute', left: x, top: y,
                  transform: `translate(-50%, -50%) scale(${isSel ? 1.12 : isHov ? 1.06 : 1})`,
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 10px', borderRadius: 20, cursor: 'pointer', userSelect: 'none',
                  background: isSel ? `${item.color}28` : isHov ? `${item.color}12` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.85)'),
                  border: `1px solid ${isSel ? item.color : isHov ? item.color + '55' : line}`,
                  boxShadow: isSel ? `0 0 14px ${item.color}55` : 'none',
                  transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s',
                  zIndex: isSel ? 20 : isHov ? 15 : 10, whiteSpace: 'nowrap',
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
                <span style={{ fontSize: 11, fontWeight: isSel ? 800 : 700, color: isSel ? item.color : muted, fontFamily: font }}>
                  {item.label}
                </span>
              </div>
            )
          })}

          {/* ── Vinyle central (déposer ici) ── */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              position: 'absolute', top: CY - 60, left: CX - 60, width: 120, height: 120,
              borderRadius: '50%', zIndex: 30,
              boxShadow: dragOver ? '0 0 50px rgba(224,122,154,0.9)'
                : selected.length > 0 ? '0 0 30px rgba(224,122,154,0.45)' : '0 0 16px rgba(107,184,232,0.18)',
              transition: 'box-shadow 0.3s',
            }}
          >
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: `conic-gradient(from ${vinylAngle}deg, #080c10 0deg, #19243a 50deg, #080c10 100deg, #111826 160deg, #080c10 200deg, #19243a 260deg, #080c10 310deg, #111826 340deg, #080c10 360deg)`,
              border: `2.5px solid ${dragOver ? '#E07A9A' : selected.length > 0 ? '#E07A9A77' : '#22304a'}`,
              position: 'relative', transition: 'border-color 0.3s',
            }}>
              {[36, 52, 68, 82].map(r => (
                <div key={r} style={{
                  position: 'absolute', top: `${50 - r / 2}%`, left: `${50 - r / 2}%`, width: `${r}%`, height: `${r}%`,
                  borderRadius: '50%', border: `1px solid rgba(255,255,255,${selected.length > 0 ? 0.07 : 0.03})`,
                }} />
              ))}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 42, height: 42, borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 35%, #ff4040, #990000)',
                boxShadow: '0 2px 10px rgba(160,0,0,0.7), inset 0 1px 3px rgba(255,100,100,0.35)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
              }}>
                {selected.length > 0
                  ? <span style={{ fontSize: 14, fontWeight: 900, color: 'white', fontFamily: font }}>{selected.length}</span>
                  : <>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0a0a0a' }} />
                      <span style={{ fontSize: 5.5, fontWeight: 900, color: 'rgba(255,255,255,0.8)', fontFamily: font, letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 1 }}>Vibz</span>
                    </>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Petit écran : mêmes choix en boutons faciles à toucher ── */}
      {scale < 0.9 && filtered.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', width: '100%', marginTop: 8 }}>
          {filtered.map(item => {
            const on = selected.includes(item.id)
            return (
              <button key={item.id} onClick={() => toggle(item.id)} aria-pressed={on}
                style={{
                  padding: '7px 11px', borderRadius: 18, cursor: 'pointer', fontFamily: font, fontSize: 12, fontWeight: 700,
                  border: `1px solid ${on ? item.color : line}`, background: on ? `${item.color}22` : (isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF'),
                  color: on ? item.color : muted,
                }}>
                {item.emoji} {item.label}{on ? ' ✓' : ''}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Sélection + créer salon ── */}
      {selected.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 380, marginTop: 8, padding: '12px 14px',
          background: isDark ? 'rgba(18,22,36,0.97)' : '#FFFFFF',
          borderRadius: 16, border: '1.5px solid rgba(224,122,154,0.3)',
          boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 8px 28px rgba(224,122,154,0.15)',
          // Sur petit écran, le panneau reste visible en bas pendant le défilement
          position: scale < 0.9 ? 'sticky' : 'relative', bottom: 8, zIndex: 50, fontFamily: font,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {selectedItems.map(item => (
              <button key={item.id} onClick={() => toggle(item.id)} aria-label={`Retirer ${item.label}`} style={{
                padding: '4px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: font,
                background: `${item.color}1A`, border: `1px solid ${item.color}55`,
                color: item.color, fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {item.emoji} {item.label} <span style={{ opacity: 0.6 }}>✕</span>
              </button>
            ))}
          </div>

          {showNameInput && (
            <input
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={`Nom du salon (optionnel) · ${selectedItems.slice(0, 2).map(i => i.label).join(' × ')}`}
              maxLength={80}
              autoFocus
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid rgba(224,122,154,0.35)', background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FBFF', color: text, fontSize: 12, fontFamily: font, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />
          )}

          {error && <div style={{ fontSize: 11, color: '#E07A7A', fontWeight: 700, marginBottom: 8 }}>⚠️ {error}</div>}

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: muted, flex: 1, fontWeight: 700 }}>
              {nStyles} style{nStyles > 1 ? 's' : ''} · {nInstr} instrument{nInstr > 1 ? 's' : ''}
            </span>
            <button onClick={reset} aria-label="Tout désélectionner"
              style={{ padding: '7px 10px', borderRadius: 10, border: `1px solid ${line}`, background: 'transparent', color: muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>✕</button>
            {!showNameInput && (
              <button onClick={() => setShowNameInput(true)} aria-label="Nommer le salon"
                style={{ padding: '7px 10px', borderRadius: 10, border: '1px solid rgba(224,122,154,0.25)', background: 'rgba(224,122,154,0.08)', color: '#E07A9A', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>✏️</button>
            )}
            <button onClick={handleCreate} disabled={creating}
              style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#E07A9A,#A78BDB)', color: 'white', fontSize: 12, fontWeight: 800, cursor: creating ? 'wait' : 'pointer', fontFamily: font, opacity: creating ? 0.7 : 1 }}>
              {creating ? '…' : '🎛️ Ouvrir le salon →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
