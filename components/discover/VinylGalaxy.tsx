import { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react'

// ── Catalogue complet : styles + instruments + intentions ─────────────────────
export const GALAXY_ITEMS = [
  // Styles musicaux
  { id:'rock',        label:'Rock',               emoji:'🎸', color:'#E8395A', cat:'Style'      },
  { id:'metal',       label:'Métal',              emoji:'🤘', color:'#CC2200', cat:'Style'      },
  { id:'punk',        label:'Punk · Hardcore',    emoji:'⚡', color:'#FF5722', cat:'Style'      },
  { id:'grunge',      label:'Grunge',             emoji:'🌧️', color:'#795548', cat:'Style'      },
  { id:'indie',       label:'Indie Rock',         emoji:'🌿', color:'#9C27B0', cat:'Style'      },
  { id:'blues',       label:'Blues',              emoji:'🎵', color:'#1565C0', cat:'Style'      },
  { id:'soul',        label:'Soul · Gospel',      emoji:'🎤', color:'#FF8F00', cat:'Style'      },
  { id:'rnb',         label:'R&B · Funk',         emoji:'🕺', color:'#7B1FA2', cat:'Style'      },
  { id:'disco',       label:'Disco · Groove',     emoji:'🪩', color:'#E91E63', cat:'Style'      },
  { id:'house',       label:'House · Deep House', emoji:'🏠', color:'#FF4081', cat:'Style'      },
  { id:'techno',      label:'Techno',             emoji:'🔊', color:'#546E7A', cat:'Style'      },
  { id:'trance',      label:'Trance · Psytrance', emoji:'🌌', color:'#7C4DFF', cat:'Style'      },
  { id:'dnb',         label:'Drum & Bass',        emoji:'🥁', color:'#FF6D00', cat:'Style'      },
  { id:'dubstep',     label:'Dubstep · Bass',     emoji:'🔈', color:'#64DD17', cat:'Style'      },
  { id:'ambient',     label:'Ambient · Drone',    emoji:'🌊', color:'#80CBC4', cat:'Style'      },
  { id:'synthwave',   label:'Synthwave',          emoji:'🌆', color:'#CE93D8', cat:'Style'      },
  { id:'lofi',        label:'Lo-fi · Chillhop',   emoji:'☁️', color:'#A5D6A7', cat:'Style'      },
  { id:'trap',        label:'Trap · Cloud Rap',   emoji:'🎤', color:'#607D8B', cat:'Style'      },
  { id:'pop',         label:'Pop · Dance Pop',    emoji:'🌸', color:'#F06292', cat:'Style'      },
  { id:'kpop',        label:'K-Pop · J-Pop',      emoji:'💫', color:'#FF80AB', cat:'Style'      },
  { id:'classique',   label:'Classique · Opéra',  emoji:'🎻', color:'#A1887F', cat:'Style'      },
  { id:'folk',        label:'Folk · Acoustique',  emoji:'🪕', color:'#8BC34A', cat:'Style'      },
  { id:'country',     label:'Country',            emoji:'🤠', color:'#FFA726', cat:'Style'      },
  { id:'reggae',      label:'Reggae · Ska',       emoji:'🌴', color:'#4CAF50', cat:'Style'      },
  { id:'latin',       label:'Latin · Bossa Nova', emoji:'💃', color:'#F44336', cat:'Style'      },
  { id:'world',       label:'World · Afrobeat',   emoji:'🌍', color:'#E65100', cat:'Style'      },
  { id:'jazz',        label:'Jazz',               emoji:'🎷', color:'#6BB8E8', cat:'Style'      },
  { id:'hiphop',      label:'Hip-Hop',            emoji:'🎤', color:'#A78BDB', cat:'Style'      },
  // Instruments
  { id:'guit_e',      label:'Guitare électrique', emoji:'🎸', color:'#52C07A', cat:'Instrument' },
  { id:'guit_a',      label:'Guitare acoustique', emoji:'🎸', color:'#6DBF6D', cat:'Instrument' },
  { id:'basse',       label:'Guitare basse',      emoji:'🎸', color:'#3DAD7A', cat:'Instrument' },
  { id:'violon',      label:'Violon · Alto',      emoji:'🎻', color:'#8BC34A', cat:'Instrument' },
  { id:'violonc',     label:'Violoncelle',        emoji:'🎻', color:'#558B2F', cat:'Instrument' },
  { id:'uke',         label:'Ukulélé · Banjo',    emoji:'🪕', color:'#9CCC65', cat:'Instrument' },
  { id:'piano',       label:'Piano acoustique',   emoji:'🎹', color:'#29B6F6', cat:'Instrument' },
  { id:'piano_d',     label:'Piano numérique',    emoji:'🎹', color:'#0288D1', cat:'Instrument' },
  { id:'synth',       label:'Synthétiseur',       emoji:'🎛️', color:'#7C4DFF', cat:'Instrument' },
  { id:'orgue',       label:'Orgue · Hammond',    emoji:'🎹', color:'#5E35B1', cat:'Instrument' },
  { id:'acccordeon',  label:'Accordéon',          emoji:'🪗', color:'#AB47BC', cat:'Instrument' },
  { id:'beatmaking',  label:'Beatmaking · MPC',   emoji:'🎧', color:'#8E24AA', cat:'Instrument' },
  { id:'batt',        label:'Batterie acoustique',emoji:'🥁', color:'#EF5350', cat:'Instrument' },
  { id:'batt_e',      label:'Batterie électro',   emoji:'🥁', color:'#E53935', cat:'Instrument' },
  { id:'cajon',       label:'Cajon · Djembé',     emoji:'🪘', color:'#FF7043', cat:'Instrument' },
  { id:'sax',         label:'Saxophone',          emoji:'🎷', color:'#FF8F00', cat:'Instrument' },
  { id:'trompette',   label:'Trompette',          emoji:'🎺', color:'#FFA000', cat:'Instrument' },
  { id:'clarinette',  label:'Clarinette',         emoji:'🎵', color:'#6D4C41', cat:'Instrument' },
  { id:'flute',       label:'Flûte traversière',  emoji:'🎵', color:'#80CBC4', cat:'Instrument' },
  { id:'chant_class', label:'Chant classique',    emoji:'🎤', color:'#EC407A', cat:'Instrument' },
  { id:'chant_pop',   label:'Chant pop · Rock',   emoji:'🎤', color:'#E91E63', cat:'Instrument' },
  { id:'rap',         label:'Rap · Slam',         emoji:'🎤', color:'#AD1457', cat:'Instrument' },
  { id:'beatbox',     label:'Beatbox',            emoji:'🎤', color:'#880E4F', cat:'Instrument' },
  { id:'choeurs',     label:'Chœurs · Harmonies', emoji:'🎶', color:'#F06292', cat:'Instrument' },
  { id:'dj',          label:'DJ · Platines',      emoji:'🎧', color:'#546E7A', cat:'Instrument' },
  { id:'prod',        label:'Producteur · DAW',   emoji:'💻', color:'#37474F', cat:'Instrument' },
  // Intentions / rencontres
  { id:'rencontre',   label:'Rencontre amoureuse',emoji:'💑', color:'#E07A9A', cat:'Intention'  },
  { id:'collab',      label:'Collab musicale',    emoji:'🤝', color:'#52C07A', cat:'Intention'  },
  { id:'amis',        label:'Amis · Réseau',      emoji:'👥', color:'#6BB8E8', cat:'Intention'  },
  { id:'concert',     label:'Concert · Live',     emoji:'🎪', color:'#FF8F00', cat:'Intention'  },
  { id:'studio',      label:'Session studio',     emoji:'🎙️', color:'#9C27B0', cat:'Intention'  },
]

// Distribue les items sur 3 anneaux — positions FIXES
function assignOrbits(items: typeof GALAXY_ITEMS) {
  // Compte par anneau
  const rings = [0, 0, 0]
  const ringCap = [Math.ceil(items.length / 3), Math.ceil(items.length / 3), items.length]
  return items.map((item, i) => {
    const ring = i % 3
    const radius = ring === 0 ? 155 : ring === 1 ? 220 : 285
    // Angle fixe calculé une seule fois selon la position dans le catalogue global
    const globalIdx = GALAXY_ITEMS.findIndex(g => g.id === item.id)
    const countInRing = Math.ceil(GALAXY_ITEMS.length / 3)
    const posInRing = Math.floor(globalIdx / 3)
    const angle = (posInRing / countInRing) * Math.PI * 2 - Math.PI / 2
    return { ...item, radius, angle }
  })
}

interface Props {
  onCreateSalon: (name: string, selections: string[]) => void
  onFilterChange: (selections: string[]) => void
}

export default function VinylGalaxy({ onCreateSalon, onFilterChange }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [salonName, setSalonName] = useState('')
  const [vinylAngle, setVinylAngle] = useState(0)   // seul le vinyle tourne
  const [hovered, setHovered] = useState<string | null>(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(0)

  // Animation RAF — uniquement pour le disque vinyle
  useEffect(() => {
    const speed = selected.length > 0 ? 40 : 8   // tourne plus vite si sélection
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

  // Filtrage des items
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return GALAXY_ITEMS
    return GALAXY_ITEMS.filter(i =>
      i.label.toLowerCase().includes(q) ||
      i.cat.toLowerCase().includes(q) ||
      i.emoji.includes(q)
    )
  }, [search])

  // Items avec positions orbitales
  const orbitItems = useMemo(() => assignOrbits(filtered), [filtered])

  // Synchroniser les filtres vers le parent
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
    const names = selected.map(id => GALAXY_ITEMS.find(i => i.id === id)?.label || id)
    const name = salonName.trim() || names.slice(0, 3).join(' · ')
    onCreateSalon(name, selected)
    setSelected([])
    setSalonName('')
    setShowNameInput(false)
  }

  const selectedItems = selected.map(id => GALAXY_ITEMS.find(i => i.id === id)).filter(Boolean) as typeof GALAXY_ITEMS

  // Taille du canvas
  const SIZE = 660
  const CX = SIZE / 2
  const CY = SIZE / 2

  // (vinylAngle est géré dans le state via RAF)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, width: '100%', position: 'relative' }}>

      {/* ── Barre de recherche ── */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: 16, position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', borderRadius: 28, background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontSize: 16, opacity: 0.5 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un style, instrument, intention... (ex: Jazz, Guitare, Collab)"
            style={{ flex: 1, border: 'none', background: 'transparent', color: '#E2E8F8', fontSize: 13, fontFamily: 'Nunito, sans-serif', outline: 'none' }}
          />
          {search && (
            <span onClick={() => setSearch('')} style={{ cursor: 'pointer', opacity: 0.4, fontSize: 14, color: '#E2E8F8' }}>✕</span>
          )}
          {search && (
            <span style={{ fontSize: 10, color: '#5A6A8A', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Galaxy canvas ── */}
      <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>

        {/* Halos de fond */}
        {[320, 240, 165].map((r, i) => (
          <div key={r} style={{
            position: 'absolute',
            top: CY - r, left: CX - r,
            width: r * 2, height: r * 2,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.03 - i * 0.005})`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Bulles — positions FIXES autour du vinyle */}
        {orbitItems.map(item => {
          const x = CX + item.radius * Math.cos(item.angle)
          const y = CY + item.radius * Math.sin(item.angle)
          const isSelected = selected.includes(item.id)
          const isHovered = hovered === item.id
          const scale = isSelected ? 1.15 : isHovered ? 1.08 : 1

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
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${scale})`,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px',
                borderRadius: 20,
                cursor: 'pointer',
                userSelect: 'none',
                background: isSelected
                  ? `${item.color}28`
                  : isHovered
                    ? `${item.color}14`
                    : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? item.color : isHovered ? item.color + '66' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isSelected
                  ? `0 0 16px ${item.color}66, 0 0 32px ${item.color}22`
                  : isHovered
                    ? `0 0 10px ${item.color}44`
                    : 'none',
                transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s',
                zIndex: isSelected ? 20 : isHovered ? 15 : 10,
                whiteSpace: 'nowrap',
              }}
            >
              {/* Point diffus de couleur */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: item.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${item.color}, 0 0 12px ${item.color}88`,
              }} />
              <span style={{
                fontSize: 11, fontWeight: isSelected ? 800 : 600,
                color: isSelected ? item.color : '#9BA8C0',
                fontFamily: 'Nunito, sans-serif',
                transition: 'color 0.15s',
              }}>
                {item.label}
              </span>
              {isSelected && (
                <span style={{ fontSize: 9, color: item.color, opacity: 0.8 }}>✓</span>
              )}
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
            top: CY - 90, left: CX - 90,
            width: 180, height: 180,
            borderRadius: '50%',
            zIndex: 30,
            cursor: 'crosshair',
            boxShadow: dragOver
              ? `0 0 60px rgba(224,122,154,0.8), 0 0 100px rgba(224,122,154,0.3)`
              : selected.length > 0
                ? `0 0 40px rgba(224,122,154,0.4), 0 0 80px rgba(224,122,154,0.15)`
                : `0 0 20px rgba(107,184,232,0.2)`,
            transition: 'box-shadow 0.4s',
          }}
        >
          {/* Corps du vinyle */}
          <div style={{
            width: '100%', height: '100%', borderRadius: '50%',
            background: `conic-gradient(from ${vinylAngle}deg, #0d1117 0deg, #1c2233 45deg, #0d1117 90deg, #141922 135deg, #0d1117 180deg, #1c2233 225deg, #0d1117 270deg, #141922 315deg, #0d1117 360deg)`,
            border: `3px solid ${dragOver ? '#E07A9A' : selected.length > 0 ? '#E07A9A88' : '#2A3350'}`,
            position: 'relative',
            transition: 'border-color 0.3s',
          }}>
            {/* Sillons */}
            {[38, 52, 66, 80].map(r => (
              <div key={r} style={{
                position: 'absolute',
                top: `${50 - r / 2}%`, left: `${50 - r / 2}%`,
                width: `${r}%`, height: `${r}%`,
                borderRadius: '50%',
                border: `1px solid rgba(255,255,255,${selected.length > 0 ? 0.08 : 0.04})`,
                transition: 'border-color 0.4s',
              }} />
            ))}

            {/* Étiquette centrale */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 52, height: 52, borderRadius: '50%',
              background: selected.length > 0
                ? `radial-gradient(circle at 40% 40%, #E07A9A, #7B1FA2)`
                : '#1C2233',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontSize: selected.length > 0 ? 20 : 14,
              boxShadow: selected.length > 0 ? '0 0 24px rgba(224,122,154,0.8)' : 'none',
              transition: 'all 0.4s',
            }}>
              {selected.length > 0 ? '🎵' : '💿'}
            </div>
          </div>

          {/* Indication hover */}
          {dragOver && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 12, fontWeight: 800, color: '#E07A9A',
              fontFamily: 'Nunito, sans-serif',
              pointerEvents: 'none', zIndex: 40,
              textShadow: '0 0 12px rgba(224,122,154,0.8)',
            }}>⬇️ Drop !</div>
          )}
        </div>

        {/* Texte d'aide central quand rien de sélectionné */}
        {selected.length === 0 && !dragOver && (
          <div style={{
            position: 'absolute',
            top: CY + 100, left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11, color: '#5A6A8A', fontWeight: 700,
            fontFamily: 'Nunito, sans-serif',
            textAlign: 'center', whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            Clique ou glisse un style sur le vinyle
          </div>
        )}
      </div>

      {/* ── Sélection active + création salon ── */}
      {selected.length > 0 && (
        <div style={{
          width: '100%', maxWidth: 600,
          marginTop: -40,
          padding: '16px 20px',
          background: 'rgba(26,30,46,0.95)',
          backdropFilter: 'blur(12px)',
          borderRadius: 20,
          border: '1.5px solid rgba(224,122,154,0.3)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          zIndex: 50, position: 'relative',
          fontFamily: 'Nunito, sans-serif',
        }}>
          {/* Tags sélectionnés */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {selectedItems.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)} style={{
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                background: `${item.color}22`,
                border: `1.5px solid ${item.color}66`,
                color: item.color, fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'opacity 0.15s',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                {item.emoji} {item.label}
                <span style={{ opacity: 0.6, fontSize: 11 }}>✕</span>
              </div>
            ))}
          </div>

          {/* Nom du salon */}
          {showNameInput ? (
            <input
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder={`Nom du salon · ex: ${selectedItems.slice(0, 2).map(i => i.label).join(' × ')}`}
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1.5px solid rgba(224,122,154,0.4)',
                background: 'rgba(255,255,255,0.05)',
                color: '#E2E8F8', fontSize: 13, fontFamily: 'Nunito, sans-serif',
                outline: 'none', boxSizing: 'border-box', marginBottom: 10,
              }}
            />
          ) : null}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#5A6A8A', flex: 1 }}>
              🛡️ VibzGuard actif · {selected.length} élément{selected.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setSelected([]); setSalonName(''); setShowNameInput(false) }}
              style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9BA8C0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
            >Effacer</button>
            {!showNameInput && (
              <button
                onClick={() => setShowNameInput(true)}
                style={{ padding: '8px 14px', borderRadius: 12, border: '1.5px solid rgba(224,122,154,0.3)', background: 'rgba(224,122,154,0.1)', color: '#E07A9A', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
              >✏️ Nommer</button>
            )}
            <button
              onClick={handleCreate}
              style={{
                padding: '9px 20px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#E07A9A,#A78BDB)',
                color: 'white', fontSize: 13, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
                boxShadow: '0 4px 16px rgba(224,122,154,0.4)',
              }}
            >🎛️ Créer le salon →</button>
          </div>
        </div>
      )}
    </div>
  )
}
