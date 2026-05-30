import { useState, useEffect } from 'react'

interface Props {
  onClose: () => void
  onCreateSalon: (name: string, styles: string[]) => void
}

const STYLES = [
  { label: 'Rock',       emoji: '🎸', color: '#E07A9A' },
  { label: 'Jazz',       emoji: '🎷', color: '#6BB8E8' },
  { label: 'Hip-Hop',    emoji: '🎤', color: '#A78BDB' },
  { label: 'Électro',    emoji: '🎧', color: '#52C07A' },
  { label: 'Pop',        emoji: '🎵', color: '#F4A261' },
  { label: 'Metal',      emoji: '🤘', color: '#E07A9A' },
  { label: 'Soul',       emoji: '🎶', color: '#F4A261' },
  { label: 'Classique',  emoji: '🎻', color: '#6BB8E8' },
  { label: 'Folk',       emoji: '🪕', color: '#52C07A' },
  { label: 'R&B',        emoji: '🎙️', color: '#A78BDB' },
  { label: 'Reggae',     emoji: '🌿', color: '#52C07A' },
  { label: 'Blues',      emoji: '🎺', color: '#6BB8E8' },
]

export default function VinylMixCreator({ onClose, onCreateSalon }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [spinning, setSpinning] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [salonName, setSalonName] = useState('')
  const [angle, setAngle] = useState(0)

  // Rotation continue du vinyle
  useEffect(() => {
    if (!spinning) return
    const interval = setInterval(() => setAngle(a => a + 2), 16)
    return () => clearInterval(interval)
  }, [spinning])

  // Spin quand des styles sont sélectionnés
  useEffect(() => {
    setSpinning(selected.length > 0)
  }, [selected])

  const toggle = (label: string) => {
    setSelected(p => p.includes(label) ? p.filter(x => x !== label) : [...p, label])
  }

  const handleDragStart = (e: React.DragEvent, label: string) => {
    e.dataTransfer.setData('style', label)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const label = e.dataTransfer.getData('style')
    if (label && !selected.includes(label)) {
      setSelected(p => [...p, label])
    }
  }

  const handleCreate = () => {
    if (selected.length === 0) return
    const name = salonName.trim() || selected.join(' · ')
    onCreateSalon(name, selected)
    onClose()
  }

  const mixColor = selected.length > 0
    ? STYLES.find(s => s.label === selected[0])?.color || '#E07A9A'
    : '#9BA8C0'

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Nunito, sans-serif' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#1C2233', borderRadius: 28, width: '100%', maxWidth: 600, padding: 32, boxShadow: `0 32px 80px ${mixColor}33`, border: `1.5px solid ${mixColor}44` }}
      >
        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#E2E8F8', marginBottom: 4 }}>🎛️ Créer un salon Mix</div>
          <div style={{ fontSize: 12, color: '#5A6A8A' }}>Clique ou glisse des styles sur le vinyle pour créer ton salon</div>
        </div>

        {/* Zone centrale — vinyle + styles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 24 }}>

          {/* Styles à gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 130 }}>
            {STYLES.slice(0, 6).map(s => (
              <div
                key={s.label}
                draggable
                onDragStart={e => handleDragStart(e, s.label)}
                onClick={() => toggle(s.label)}
                style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer', userSelect: 'none',
                  background: selected.includes(s.label) ? `${s.color}33` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${selected.includes(s.label) ? s.color : 'rgba(255,255,255,0.08)'}`,
                  color: selected.includes(s.label) ? s.color : '#9BA8C0',
                  fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                  boxShadow: selected.includes(s.label) ? `0 0 12px ${s.color}44` : 'none',
                }}
              >
                <span>{s.emoji}</span> {s.label}
              </div>
            ))}
          </div>

          {/* Vinyle central */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {/* Drop zone vinyle */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                width: 160, height: 160, borderRadius: '50%', position: 'relative', cursor: 'pointer',
                boxShadow: `0 0 ${dragOver ? 40 : 20}px ${mixColor}${dragOver ? '88' : '44'}`,
                transition: 'box-shadow 0.3s',
              }}
            >
              {/* Disque vinyle */}
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: `conic-gradient(from ${angle}deg, #1a1a2e, #2d2d4e, #1a1a2e, #16213e, #1a1a2e)`,
                transform: `rotate(${angle}deg)`,
                position: 'relative',
                border: `3px solid ${dragOver ? mixColor : '#2A3350'}`,
              }}>
                {/* Sillons */}
                {[40, 55, 70, 85].map(r => (
                  <div key={r} style={{
                    position: 'absolute',
                    top: `${50 - r/2}%`, left: `${50 - r/2}%`,
                    width: `${r}%`, height: `${r}%`,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }} />
                ))}
                {/* Centre du vinyle */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  width: 36, height: 36, borderRadius: '50%',
                  background: selected.length > 0 ? `radial-gradient(circle, ${mixColor}, #1C2233)` : '#2A3350',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, transition: 'background 0.3s',
                  boxShadow: selected.length > 0 ? `0 0 16px ${mixColor}88` : 'none',
                }}>
                  {selected.length > 0 ? '🎵' : '⭕'}
                </div>
              </div>

              {/* Labels des styles sélectionnés autour du vinyle */}
              {selected.slice(0, 4).map((label, i) => {
                const a = (i / Math.max(selected.length, 1)) * 360 - 90
                const r = 88
                const x = 80 + r * Math.cos(a * Math.PI / 180)
                const y = 80 + r * Math.sin(a * Math.PI / 180)
                const style = STYLES.find(s => s.label === label)
                return (
                  <div key={label} style={{
                    position: 'absolute', top: y - 12, left: x - 24,
                    background: style?.color || '#E07A9A',
                    color: 'white', fontSize: 9, fontWeight: 800,
                    padding: '2px 6px', borderRadius: 10, whiteSpace: 'nowrap',
                    boxShadow: `0 2px 8px ${style?.color || '#E07A9A'}66`,
                    pointerEvents: 'none',
                  }}>
                    {style?.emoji} {label}
                  </div>
                )
              })}
            </div>

            {/* Indicateur drop */}
            <div style={{ fontSize: 11, color: dragOver ? mixColor : '#5A6A8A', fontWeight: 700, transition: 'color 0.2s' }}>
              {dragOver ? '⬇️ Lâche ici !' : selected.length > 0 ? `${selected.length} style${selected.length > 1 ? 's' : ''} sélectionné${selected.length > 1 ? 's' : ''}` : 'Glisse ou clique un style'}
            </div>
          </div>

          {/* Styles à droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 130 }}>
            {STYLES.slice(6).map(s => (
              <div
                key={s.label}
                draggable
                onDragStart={e => handleDragStart(e, s.label)}
                onClick={() => toggle(s.label)}
                style={{
                  padding: '6px 12px', borderRadius: 20, cursor: 'pointer', userSelect: 'none',
                  background: selected.includes(s.label) ? `${s.color}33` : 'rgba(255,255,255,0.05)',
                  border: `1.5px solid ${selected.includes(s.label) ? s.color : 'rgba(255,255,255,0.08)'}`,
                  color: selected.includes(s.label) ? s.color : '#9BA8C0',
                  fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                  boxShadow: selected.includes(s.label) ? `0 0 12px ${s.color}44` : 'none',
                }}
              >
                <span>{s.emoji}</span> {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Nom du salon */}
        {selected.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <input
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              placeholder={`Nom du salon (ex: ${selected.join(' · ')})`}
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 14,
                border: `1.5px solid ${mixColor}44`, background: 'rgba(255,255,255,0.05)',
                color: '#E2E8F8', fontSize: 13, fontFamily: 'Nunito, sans-serif',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9BA8C0', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}
          >Annuler</button>
          <button
            onClick={handleCreate}
            disabled={selected.length === 0}
            style={{
              flex: 2, padding: '12px', borderRadius: 14, border: 'none',
              background: selected.length > 0 ? `linear-gradient(135deg, ${mixColor}, #6BB8E8)` : 'rgba(255,255,255,0.05)',
              color: selected.length > 0 ? 'white' : '#5A6A8A',
              fontWeight: 800, fontSize: 14, cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
              fontFamily: 'Nunito, sans-serif',
              boxShadow: selected.length > 0 ? `0 6px 20px ${mixColor}44` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {selected.length > 0 ? `🎛️ Créer "${salonName || selected.join(' · ')}"` : 'Sélectionne des styles'}
          </button>
        </div>
      </div>
    </div>
  )
}
