import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// ── Styles musicaux ───────────────────────────────────────────────────────────
export const GALAXY_STYLES = [
  { id:'rock',      label:'Rock',               color:'#E8395A' },
  { id:'metal',     label:'Métal',              color:'#CC2200' },
  { id:'punk',      label:'Punk',               color:'#FF5722' },
  { id:'grunge',    label:'Grunge',             color:'#795548' },
  { id:'indie',     label:'Indie Rock',         color:'#9C27B0' },
  { id:'blues',     label:'Blues',              color:'#1565C0' },
  { id:'soul',      label:'Soul · Gospel',      color:'#FF8F00' },
  { id:'rnb',       label:'R&B · Funk',         color:'#7B1FA2' },
  { id:'disco',     label:'Disco',              color:'#E91E63' },
  { id:'house',     label:'House',              color:'#FF4081' },
  { id:'techno',    label:'Techno',             color:'#546E7A' },
  { id:'trance',    label:'Trance',             color:'#7C4DFF' },
  { id:'dnb',       label:'Drum & Bass',        color:'#FF6D00' },
  { id:'dubstep',   label:'Dubstep',            color:'#64DD17' },
  { id:'ambient',   label:'Ambient',            color:'#80CBC4' },
  { id:'synthwave', label:'Synthwave',          color:'#CE93D8' },
  { id:'lofi',      label:'Lo-fi',              color:'#A5D6A7' },
  { id:'trap',      label:'Trap',               color:'#607D8B' },
  { id:'pop',       label:'Pop',                color:'#F06292' },
  { id:'kpop',      label:'K-Pop',              color:'#FF80AB' },
  { id:'classique', label:'Classique',          color:'#A1887F' },
  { id:'folk',      label:'Folk',               color:'#8BC34A' },
  { id:'country',   label:'Country',            color:'#FFA726' },
  { id:'reggae',    label:'Reggae',             color:'#4CAF50' },
  { id:'latin',     label:'Latin',              color:'#F44336' },
  { id:'world',     label:'Afrobeat',           color:'#E65100' },
  { id:'jazz',      label:'Jazz',               color:'#6BB8E8' },
  { id:'hiphop',    label:'Hip-Hop',            color:'#A78BDB' },
]

// ── Instruments ───────────────────────────────────────────────────────────────
export const GALAXY_INSTRUMENTS = [
  { id:'guit_e',      label:'Guitare élec.',      color:'#52C07A' },
  { id:'guit_a',      label:'Guitare acous.',     color:'#6DBF6D' },
  { id:'basse',       label:'Basse',              color:'#3DAD7A' },
  { id:'violon',      label:'Violon',             color:'#8BC34A' },
  { id:'violonc',     label:'Violoncelle',        color:'#558B2F' },
  { id:'uke',         label:'Ukulélé',            color:'#9CCC65' },
  { id:'piano',       label:'Piano',              color:'#29B6F6' },
  { id:'piano_d',     label:'Claviers',           color:'#0288D1' },
  { id:'synth',       label:'Synthétiseur',       color:'#7C4DFF' },
  { id:'orgue',       label:'Orgue',              color:'#5E35B1' },
  { id:'accordeon',   label:'Accordéon',          color:'#AB47BC' },
  { id:'beatmaking',  label:'Beatmaking',         color:'#8E24AA' },
  { id:'batt',        label:'Batterie',           color:'#EF5350' },
  { id:'batt_e',      label:'Batterie élec.',     color:'#E53935' },
  { id:'cajon',       label:'Cajon · Djembé',     color:'#FF7043' },
  { id:'sax',         label:'Saxophone',          color:'#FF8F00' },
  { id:'trompette',   label:'Trompette',          color:'#FFA000' },
  { id:'clarinette',  label:'Clarinette',         color:'#6D4C41' },
  { id:'flute',       label:'Flûte',              color:'#80CBC4' },
  { id:'chant_class', label:'Chant lyrique',      color:'#EC407A' },
  { id:'chant_pop',   label:'Chant pop',          color:'#E91E63' },
  { id:'rap',         label:'Rap · Slam',         color:'#AD1457' },
  { id:'beatbox',     label:'Beatbox',            color:'#880E4F' },
  { id:'choeurs',     label:'Chœurs',             color:'#F06292' },
  { id:'dj',          label:'DJ · Platines',      color:'#546E7A' },
  { id:'prod',        label:'Producteur',         color:'#37474F' },
  { id:'harpe',       label:'Harpe · Sitar',      color:'#AED581' },
  { id:'perc_lat',    label:'Percus. latines',    color:'#FF5722' },
]

export const GALAXY_ITEMS = [...GALAXY_STYLES, ...GALAXY_INSTRUMENTS]

// ── Distribution sur 3 anneaux sans chevauchement ─────────────────────────────
// Les items sont distribués en remplissant d'abord l'anneau externe (plus d'espace)
function assignOrbits(items: (typeof GALAXY_STYLES)) {
  const n = items.length
  // Répartition : anneau 0 (inner) : n/5, anneau 1 : 2n/5, anneau 2 (outer) : 2n/5
  const r0 = Math.round(n * 0.25)   // ~25% sur l'anneau intérieur
  const r1 = Math.round(n * 0.38)   // ~38% sur l'anneau médian
  // r2 = reste sur l'anneau extérieur

  return items.map((item, i) => {
    let ring: number, posInRing: number, countInRing: number
    if (i < r0) {
      ring = 0; posInRing = i; countInRing = r0
    } else if (i < r0 + r1) {
      ring = 1; posInRing = i - r0; countInRing = r1
    } else {
      ring = 2; posInRing = i - r0 - r1; countInRing = n - r0 - r1
    }
    const radius = ring === 0 ? 82 : ring === 1 ? 130 : 175
    // Décalage en quinconce entre anneaux pour éviter l'alignement radial
    const offset = ring === 1 ? Math.PI / r1 : ring === 2 ? Math.PI / (n - r0 - r1) * 0.5 : 0
    const angle = offset + (posInRing / countInRing) * Math.PI * 2 - Math.PI / 2
    return { ...item, radius, angle }
  })
}

interface Props {
  onCreateSalon: (name: string, selections: string[]) => void
  onFilterChange: (selections: string[]) => void
}

type GalaxyMode = 'styles' | 'instruments'

export default function VinylGalaxy({ onCreateSalon, onFilterChange }: Props) {
  const [mode, setMode]           = useState<GalaxyMode>('styles')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<string[]>([])
  const [dragOver, setDragOver]   = useState(false)
  const [salonName, setSalonName] = useState('')
  const [vinylAngle, setVinylAngle] = useState(0)
  const [hovered, setHovered]     = useState<string | null>(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const rafRef  = useRef<number>(0)
  const lastRef = useRef<number>(0)

  // Catalogue selon le mode actif
  const catalog = mode === 'styles' ? GALAXY_STYLES : GALAXY_INSTRUMENTS

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

  // Changer de mode → vide la sélection
  const switchMode = (m: GalaxyMode) => {
    setMode(m)
    setSelected([])
    setSalonName('')
    setShowNameInput(false)
    setSearch('')
  }

  // Filtrage
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return catalog
    return catalog.filter(i => i.label.toLowerCase().includes(q))
  }, [search, catalog])

  // Positions fixes
  const orbitItems = useMemo(() => assignOrbits(filtered), [filtered])

  // Sync filtres parent
  useEffect(() => { onFilterChange(selected) }, [selected, onFilterChange])

  const toggle = useCallback((id: string) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData('galaxy-item')
    if (id && !selected.includes(id)) setSelected(p => [...p, id])
  }

  const handleCreate = () => {
    if (selected.length === 0) return
    const names = selected.map(id => catalog.find(i => i.id === id)?.label || id)
    const name = salonName.trim() || names.slice(0, 3).join(' · ')
    onCreateSalon(name, selected)
    setSelected([])
    setSalonName('')
    setShowNameInput(false)
  }

  const selectedItems = selected
    .map(id => GALAXY_ITEMS.find(i => i.id === id))
    .filter(Boolean) as typeof GALAXY_ITEMS

  const SIZE = 390
  const CX = SIZE / 2
  const CY = SIZE / 2
  const font = 'Nunito, sans-serif'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%' }}>

      {/* ── Onglets Styles / Instruments ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: '4px', border: '1px solid rgba(255,255,255,0.07)' }}>
        {(['styles', 'instruments'] as GalaxyMode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontFamily: font, fontSize: 11, fontWeight: 800,
              background: mode === m ? (m === 'styles' ? '#E07A9A' : '#52C07A') : 'transparent',
              color: mode === m ? 'white' : '#9BA8C0',
              transition: 'all 0.2s',
              boxShadow: mode === m ? `0 2px 12px ${m === 'styles' ? '#E07A9A' : '#52C07A'}66` : 'none',
            }}
          >
            {m === 'styles' ? '🎼 Styles musicaux' : '🎵 Instruments'}
          </button>
        ))}
      </div>

      {/* ── Barre de recherche ── */}
      <div style={{ width: '100%', maxWidth: 360, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 12, opacity: 0.45 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={mode === 'styles' ? 'Jazz, Soul, Techno...' : 'Guitare, Piano, Batterie...'}
            style={{ flex: 1, border: 'none', background: 'transparent', color: '#E2E8F8', fontSize: 11, fontFamily: font, outline: 'none' }}
          />
          {search && <span onClick={() => setSearch('')} style={{ cursor: 'pointer', opacity: 0.35, fontSize: 11, color: '#E2E8F8' }}>✕</span>}
          {search && <span style={{ fontSize: 9, color: '#5A6A8A', fontWeight: 700 }}>{filtered.length}</span>}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>

        {/* Halos */}
        {[180, 135, 88].map((r, i) => (
          <div key={r} style={{
            position: 'absolute',
            top: CY - r, left: CX - r,
            width: r * 2, height: r * 2,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.025 - i * 0.005})`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Bulles fixes */}
        {orbitItems.map(item => {
          const x = CX + item.radius * Math.cos(item.angle)
          const y = CY + item.radius * Math.sin(item.angle)
          const isSel = selected.includes(item.id)
          const isHov = hovered === item.id

          return (
            <div
              key={item.id}
              draggable
              onDragStart={e => e.dataTransfer.setData('galaxy-item', item.id)}
              onClick={() => toggle(item.id)}
              onMouseEnter={() => setHovered(item.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'absolute',
                left: x, top: y,
                transform: `translate(-50%, -50%) scale(${isSel ? 1.12 : isHov ? 1.06 : 1})`,
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px',
                borderRadius: 20,
                cursor: 'pointer',
                userSelect: 'none',
                background: isSel ? `${item.color}28` : isHov ? `${item.color}12` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSel ? item.color : isHov ? item.color + '55' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isSel ? `0 0 14px ${item.color}55` : isHov ? `0 0 8px ${item.color}33` : 'none',
                transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s',
                zIndex: isSel ? 20 : isHov ? 15 : 10,
                whiteSpace: 'nowrap',
              }}
            >
              {/* Point diffus */}
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: item.color,
                boxShadow: `0 0 5px ${item.color}, 0 0 10px ${item.color}66`,
              }} />
              <span style={{
                fontSize: 10, fontWeight: isSel ? 800 : 600,
                color: isSel ? item.color : '#9BA8C0',
                fontFamily: font, transition: 'color 0.15s',
              }}>
                {item.label}
              </span>
            </div>
          )
        })}

        {/* ── Vinyle central ── */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            position: 'absolute',
            top: CY - 48, left: CX - 48,
            width: 96, height: 96,
            borderRadius: '50%', zIndex: 30, cursor: 'crosshair',
            boxShadow: dragOver
              ? '0 0 50px rgba(224,122,154,0.9)'
              : selected.length > 0
                ? '0 0 30px rgba(224,122,154,0.45)'
                : '0 0 16px rgba(107,184,232,0.18)',
            transition: 'box-shadow 0.3s',
          }}
        >
          {/* Corps vinyle */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: `conic-gradient(from ${vinylAngle}deg, #080c10 0deg, #19243a 50deg, #080c10 100deg, #111826 160deg, #080c10 200deg, #19243a 260deg, #080c10 310deg, #111826 340deg, #080c10 360deg)`,
            border: `2.5px solid ${dragOver ? '#E07A9A' : selected.length > 0 ? '#E07A9A77' : '#22304a'}`,
            position: 'relative', transition: 'border-color 0.3s',
          }}>
            {/* Sillons */}
            {[36, 52, 68, 82].map(r => (
              <div key={r} style={{
                position: 'absolute',
                top: `${50 - r / 2}%`, left: `${50 - r / 2}%`,
                width: `${r}%`, height: `${r}%`,
                borderRadius: '50%',
                border: `1px solid rgba(255,255,255,${selected.length > 0 ? 0.07 : 0.03})`,
              }} />
            ))}

            {/* Étiquette rouge centrale */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 34, height: 34, borderRadius: '50%',
              background: 'radial-gradient(circle at 38% 35%, #ff4040, #990000)',
              boxShadow: '0 2px 10px rgba(160,0,0,0.7), inset 0 1px 3px rgba(255,100,100,0.35)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0a0a0a', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9)' }} />
              <span style={{ fontSize: 5.5, fontWeight: 900, color: 'rgba(255,255,255,0.8)', fontFamily: font, letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 1 }}>Vibz</span>
            </div>
          </div>

          {dragOver && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 11, fontWeight: 800, color: '#E07A9A', fontFamily: font, pointerEvents: 'none', zIndex: 40, textShadow: '0 0 10px rgba(224,122,154,0.9)' }}>⬇️</div>
          )}
        </div>

        {/* Texte aide */}
        {selected.length === 0 && !dragOver && (
          <div style={{ position: 'absolute', top: CY + 52, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#4A5A7A', fontWeight: 700, fontFamily: font, textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            Clique ou glisse sur le vinyle
          </div>
        )}
      </div>

      {/* ── Sélection + créer salon ── */}
      {selected.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 380, marginTop: -16,
          padding: '10px 14px',
          background: 'rgba(18,22,36,0.97)', backdropFilter: 'blur(12px)',
          borderRadius: 16, border: '1.5px solid rgba(224,122,154,0.25)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          zIndex: 50, position: 'relative', fontFamily: font,
        }}>
          {/* Tags sélectionnés */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {selectedItems.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)} style={{
                padding: '3px 9px', borderRadius: 20, cursor: 'pointer',
                background: `${item.color}1A`, border: `1px solid ${item.color}55`,
                color: item.color, fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, boxShadow: `0 0 5px ${item.color}` }} />
                {item.label} <span style={{ opacity: 0.5, fontSize: 10 }}>✕</span>
              </div>
            ))}
          </div>

          {showNameInput && (
            <input
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={`Nom · ex: ${selectedItems.slice(0, 2).map(i => i.label).join(' × ')}`}
              autoFocus
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(224,122,154,0.35)', background: 'rgba(255,255,255,0.04)', color: '#E2E8F8', fontSize: 11, fontFamily: font, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
            />
          )}

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#3A4A6A', flex: 1 }}>🛡️ VibzGuard · {selected.length} sélectionné{selected.length > 1 ? 's' : ''}</span>
            <button onClick={() => { setSelected([]); setSalonName(''); setShowNameInput(false) }}
              style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#9BA8C0', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>✕</button>
            {!showNameInput && (
              <button onClick={() => setShowNameInput(true)}
                style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(224,122,154,0.25)', background: 'rgba(224,122,154,0.08)', color: '#E07A9A', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>✏️</button>
            )}
            <button onClick={handleCreate}
              style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#E07A9A,#A78BDB)', color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: font, boxShadow: '0 3px 12px rgba(224,122,154,0.4)' }}>
              🎛️ Créer →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
