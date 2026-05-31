import { useState, useEffect, useMemo } from 'react'

// ── Catalogue complet styles + instruments ────────────────────────────────────
const ALL_STYLES = [
  { label:'Rock',                emoji:'🎸', color:'#E8395A', cat:'Styles' },
  { label:'Métal',               emoji:'🤘', color:'#CC2200', cat:'Styles' },
  { label:'Punk · Hardcore',     emoji:'⚡', color:'#FF5722', cat:'Styles' },
  { label:'Grunge · Alternative',emoji:'🌧️', color:'#795548', cat:'Styles' },
  { label:'Indie Rock',          emoji:'🌿', color:'#9C27B0', cat:'Styles' },
  { label:'Blues',               emoji:'🎵', color:'#1565C0', cat:'Styles' },
  { label:'Soul · Gospel',       emoji:'🎤', color:'#FF8F00', cat:'Styles' },
  { label:'R&B · Funk',          emoji:'🕺', color:'#7B1FA2', cat:'Styles' },
  { label:'Disco · Groove',      emoji:'🪩', color:'#E91E63', cat:'Styles' },
  { label:'House · Deep House',  emoji:'🏠', color:'#FF4081', cat:'Styles' },
  { label:'Techno · Industrial', emoji:'🔊', color:'#546E7A', cat:'Styles' },
  { label:'Trance · Psytrance',  emoji:'🌌', color:'#7C4DFF', cat:'Styles' },
  { label:'Drum & Bass',         emoji:'🥁', color:'#FF6D00', cat:'Styles' },
  { label:'Dubstep · Bass',      emoji:'🔈', color:'#64DD17', cat:'Styles' },
  { label:'Ambient · Drone',     emoji:'🌊', color:'#80CBC4', cat:'Styles' },
  { label:'Synthwave',           emoji:'🌆', color:'#CE93D8', cat:'Styles' },
  { label:'Lo-fi · Chillhop',    emoji:'☁️', color:'#A5D6A7', cat:'Styles' },
  { label:'Trap · Cloud Rap',    emoji:'🎤', color:'#607D8B', cat:'Styles' },
  { label:'Pop · Dance Pop',     emoji:'🌸', color:'#F06292', cat:'Styles' },
  { label:'K-Pop · J-Pop',       emoji:'💫', color:'#FF80AB', cat:'Styles' },
  { label:'Classique · Opéra',   emoji:'🎻', color:'#A1887F', cat:'Styles' },
  { label:'Folk · Acoustique',   emoji:'🪕', color:'#8BC34A', cat:'Styles' },
  { label:'Country · Bluegrass', emoji:'🤠', color:'#FFA726', cat:'Styles' },
  { label:'Reggae · Ska · Dub',  emoji:'🌴', color:'#4CAF50', cat:'Styles' },
  { label:'Latin · Bossa Nova',  emoji:'💃', color:'#F44336', cat:'Styles' },
  { label:'World · Afrobeat',    emoji:'🌍', color:'#E65100', cat:'Styles' },
  { label:'Jazz',                emoji:'🎷', color:'#6BB8E8', cat:'Styles' },
  { label:'Hip-Hop',             emoji:'🎤', color:'#A78BDB', cat:'Styles' },
]

const ALL_INSTRUMENTS = [
  { label:'Guitare électrique',         emoji:'🎸', color:'#52C07A', cat:'Instruments' },
  { label:'Guitare acoustique',         emoji:'🎸', color:'#6DBF6D', cat:'Instruments' },
  { label:'Guitare basse',              emoji:'🎸', color:'#3DAD7A', cat:'Instruments' },
  { label:'Violon · Alto',              emoji:'🎻', color:'#8BC34A', cat:'Instruments' },
  { label:'Violoncelle',                emoji:'🎻', color:'#558B2F', cat:'Instruments' },
  { label:'Ukulélé · Mandoline',        emoji:'🪕', color:'#9CCC65', cat:'Instruments' },
  { label:'Harpe · Sitar',              emoji:'🎵', color:'#AED581', cat:'Instruments' },
  { label:'Piano acoustique',           emoji:'🎹', color:'#29B6F6', cat:'Instruments' },
  { label:'Piano numérique',            emoji:'🎹', color:'#0288D1', cat:'Instruments' },
  { label:'Synthétiseur · Modulaire',   emoji:'🎛️', color:'#7C4DFF', cat:'Instruments' },
  { label:'Orgue · Hammond',            emoji:'🎹', color:'#5E35B1', cat:'Instruments' },
  { label:'Accordéon · Harmonica',      emoji:'🪗', color:'#AB47BC', cat:'Instruments' },
  { label:'Beatmaking · MPC',           emoji:'🎧', color:'#8E24AA', cat:'Instruments' },
  { label:'Batterie acoustique',        emoji:'🥁', color:'#EF5350', cat:'Instruments' },
  { label:'Batterie électronique',      emoji:'🥁', color:'#E53935', cat:'Instruments' },
  { label:'Cajon · Djembé · Congas',    emoji:'🪘', color:'#FF7043', cat:'Instruments' },
  { label:'Percussions latines',        emoji:'🪘', color:'#FF5722', cat:'Instruments' },
  { label:'Marimba · Xylophone',        emoji:'🎵', color:'#FFCA28', cat:'Instruments' },
  { label:'Hang drum · Handpan',        emoji:'🎵', color:'#FFB300', cat:'Instruments' },
  { label:'Saxophone',                  emoji:'🎷', color:'#FF8F00', cat:'Instruments' },
  { label:'Trompette · Bugle',          emoji:'🎺', color:'#FFA000', cat:'Instruments' },
  { label:'Trombone · Tuba',            emoji:'🎺', color:'#F57F17', cat:'Instruments' },
  { label:'Clarinette · Hautbois',      emoji:'🎵', color:'#6D4C41', cat:'Instruments' },
  { label:'Flûte traversière',          emoji:'🎵', color:'#80CBC4', cat:'Instruments' },
  { label:'Cor · Cor anglais',          emoji:'🎵', color:'#26A69A', cat:'Instruments' },
  { label:'Cornemuse · Flûte irlandaise',emoji:'🎵',color:'#00897B', cat:'Instruments' },
  { label:'Chant classique · Lyrique',  emoji:'🎤', color:'#EC407A', cat:'Instruments' },
  { label:'Chant pop · Rock · Indie',   emoji:'🎤', color:'#E91E63', cat:'Instruments' },
  { label:'Rap · Slam · Spoken word',   emoji:'🎤', color:'#AD1457', cat:'Instruments' },
  { label:'Beatbox',                    emoji:'🎤', color:'#880E4F', cat:'Instruments' },
  { label:'Chœurs · Harmonies vocales', emoji:'🎶', color:'#F06292', cat:'Instruments' },
  { label:'DJ · Platines · Mixage',     emoji:'🎧', color:'#546E7A', cat:'Instruments' },
  { label:'Producteur · DAW · Studio',  emoji:'💻', color:'#37474F', cat:'Instruments' },
  { label:'Theremin · Instruments rares',emoji:'🎵',color:'#90A4AE', cat:'Instruments' },
]

const ALL_ITEMS = [...ALL_STYLES, ...ALL_INSTRUMENTS]

// Clé de déduplication : tri alphabétique des labels sélectionnés
const mixKey = (labels: string[]) => [...labels].sort().join('|')

export type MixSalon = {
  id: string
  name: string
  key: string
  selections: string[]
  color: string
  memberCount: number
  hasMod: true
}

interface Props {
  onClose: () => void
  existingSalons: MixSalon[]
  onCreateSalon: (name: string, selections: string[], key: string) => void
  onJoinSalon: (salon: MixSalon) => void
}

export default function VinylMixCreator({ onClose, existingSalons, onCreateSalon, onJoinSalon }: Props) {
  const [selected, setSelected]   = useState<string[]>([])
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<'Styles' | 'Instruments' | 'Tous'>('Tous')
  const [salonName, setSalonName] = useState('')
  const [angle, setAngle]         = useState(0)
  const [dragOver, setDragOver]   = useState(false)

  // Rotation vinyle
  useEffect(() => {
    if (selected.length === 0) return
    const id = setInterval(() => setAngle(a => (a + 1.5) % 360), 16)
    return () => clearInterval(id)
  }, [selected.length])

  // Résultats filtrés
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return ALL_ITEMS.filter(item => {
      const matchTab = tab === 'Tous' || item.cat === tab
      const matchSearch = !q || item.label.toLowerCase().includes(q)
      return matchTab && matchSearch
    })
  }, [search, tab])

  // Salon existant avec la même combinaison
  const duplicate = useMemo(() => {
    if (selected.length === 0) return null
    const k = mixKey(selected)
    return existingSalons.find(s => s.key === k) || null
  }, [selected, existingSalons])

  const toggle = (label: string) =>
    setSelected(p => p.includes(label) ? p.filter(x => x !== label) : [...p, label])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const label = e.dataTransfer.getData('mix-item')
    if (label && !selected.includes(label)) setSelected(p => [...p, label])
  }

  const handleCreate = () => {
    if (selected.length === 0) return
    if (duplicate) { onJoinSalon(duplicate); onClose(); return }
    const name = salonName.trim() || selected.slice(0, 3).join(' · ')
    onCreateSalon(name, selected, mixKey(selected))
    onClose()
  }

  const firstColor = selected.length > 0
    ? ALL_ITEMS.find(i => i.label === selected[0])?.color || '#A78BDB'
    : '#5A6A8A'

  const font = 'Nunito, sans-serif'

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:font }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'#161B26', borderRadius:28, width:'100%', maxWidth:740, maxHeight:'90vh', display:'flex', flexDirection:'column', border:`1.5px solid ${firstColor}44`, boxShadow:`0 32px 80px ${firstColor}22`, overflow:'hidden' }}
      >
        {/* ── Header ── */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1.5px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:'#E2E8F8' }}>🎛️ Créer un salon Mix</div>
              <div style={{ fontSize:11, color:'#5A6A8A', marginTop:2 }}>
                Sélectionne des styles et instruments · Le vinyle tourne avec ton mix
              </div>
            </div>
            <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.1)', background:'transparent', color:'#9BA8C0', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>

          {/* Barre de recherche */}
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, padding:'9px 14px', background:'rgba(255,255,255,0.05)', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize:14, color:'#5A6A8A' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un style ou un instrument..."
                style={{ flex:1, border:'none', background:'transparent', color:'#E2E8F8', fontSize:13, fontFamily:font, outline:'none' }}
              />
              {search && <span onClick={() => setSearch('')} style={{ cursor:'pointer', color:'#5A6A8A', fontSize:14 }}>✕</span>}
            </div>
            {/* Tabs */}
            {(['Tous','Styles','Instruments'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'8px 14px', borderRadius:12, border:`1.5px solid ${tab===t ? firstColor : 'rgba(255,255,255,0.08)'}`,
                background: tab===t ? `${firstColor}22` : 'transparent',
                color: tab===t ? firstColor : '#5A6A8A',
                fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:font, whiteSpace:'nowrap',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* ── Corps : vinyle + panel ── */}
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'200px 1fr', overflow:'hidden' }}>

          {/* Vinyle central */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, borderRight:'1.5px solid rgba(255,255,255,0.06)', gap:12 }}>
            {/* Disque */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ width:140, height:140, borderRadius:'50%', position:'relative', cursor:'crosshair', flexShrink:0, boxShadow:`0 0 ${dragOver?48:24}px ${firstColor}${dragOver?'88':'33'}`, transition:'box-shadow 0.3s' }}
            >
              {/* Corps vinyle */}
              <div style={{
                width:'100%', height:'100%', borderRadius:'50%',
                background:`conic-gradient(from ${angle}deg, #0d1117 0deg, #1c2233 60deg, #0d1117 120deg, #161b26 180deg, #0d1117 240deg, #1c2233 300deg, #0d1117 360deg)`,
                border:`2.5px solid ${dragOver ? firstColor : selected.length > 0 ? firstColor+'88' : '#2A3350'}`,
                position:'relative', transition:'border-color 0.3s',
              }}>
                {/* Sillons */}
                {[38,52,66,80].map(r => (
                  <div key={r} style={{ position:'absolute', top:`${50-r/2}%`, left:`${50-r/2}%`, width:`${r}%`, height:`${r}%`, borderRadius:'50%', border:`1px solid rgba(255,255,255,${selected.length>0?'0.07':'0.04'})` }} />
                ))}
                {/* Centre */}
                <div style={{
                  position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
                  width:44, height:44, borderRadius:'50%',
                  background:'radial-gradient(circle at 38% 35%, #ff4040, #990000)',
                  boxShadow:'0 2px 10px rgba(160,0,0,0.7), inset 0 1px 3px rgba(255,100,100,0.35)',
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
                }}>
                  <div style={{ width:9, height:9, borderRadius:'50%', background:'#0a0a0a', boxShadow:'inset 0 1px 2px rgba(0,0,0,0.9)' }} />
                  <span style={{ fontSize:6, fontWeight:900, color:'rgba(255,255,255,0.8)', fontFamily:'Nunito, sans-serif', letterSpacing:0.8, textTransform:'uppercase', lineHeight:1 }}>Vibz</span>
                </div>
              </div>

              {/* Tags orbitaux */}
              {selected.slice(0, 5).map((label, i) => {
                const total = Math.min(selected.length, 5)
                const a = (i / total) * 360 - 90
                const r = 82
                const x = 70 + r * Math.cos(a * Math.PI / 180)
                const y = 70 + r * Math.sin(a * Math.PI / 180)
                const item = ALL_ITEMS.find(s => s.label === label)
                return (
                  <div key={label} onClick={() => toggle(label)} style={{
                    position:'absolute', top:y-10, left:x-20,
                    background: item?.color || '#A78BDB',
                    color:'white', fontSize:9, fontWeight:800,
                    padding:'2px 6px', borderRadius:8, whiteSpace:'nowrap',
                    cursor:'pointer', userSelect:'none',
                    boxShadow:`0 2px 8px ${item?.color||'#A78BDB'}66`,
                    zIndex:10,
                  }}>
                    {item?.emoji} {label.split(' ')[0]}
                  </div>
                )
              })}
            </div>

            {/* Indicateur */}
            <div style={{ fontSize:10, color: dragOver ? firstColor : '#5A6A8A', fontWeight:700, textAlign:'center', transition:'color 0.2s', lineHeight:1.4 }}>
              {dragOver
                ? '⬇️ Lâche ici !'
                : selected.length > 0
                  ? `${selected.length} sélectionné${selected.length>1?'s':''}`
                  : 'Glisse ou clique\nun style / instrument'}
            </div>

            {/* Tags sélectionnés */}
            {selected.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, justifyContent:'center' }}>
                {selected.map(label => {
                  const item = ALL_ITEMS.find(i => i.label === label)
                  return (
                    <div key={label} onClick={() => toggle(label)} style={{
                      padding:'2px 8px', borderRadius:20, fontSize:9, fontWeight:700, cursor:'pointer',
                      background:`${item?.color||'#A78BDB'}22`,
                      border:`1px solid ${item?.color||'#A78BDB'}66`,
                      color: item?.color || '#A78BDB',
                    }}>
                      {item?.emoji} {label.split(' · ')[0]} ✕
                    </div>
                  )
                })}
              </div>
            )}

            {/* Badge modération */}
            <div style={{ padding:'5px 10px', borderRadius:20, background:'rgba(82,192,122,0.12)', border:'1px solid rgba(82,192,122,0.3)', fontSize:10, fontWeight:700, color:'#52C07A', textAlign:'center' }}>
              🛡️ VibzGuard + Modérateur IA
            </div>
          </div>

          {/* Panel scrollable */}
          <div style={{ overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>

            {/* Alerte fusion si doublon */}
            {duplicate && (
              <div style={{ padding:'12px 16px', borderRadius:14, background:'rgba(107,184,232,0.12)', border:'1.5px solid rgba(107,184,232,0.3)', marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#6BB8E8', marginBottom:4 }}>
                  🔀 Ce mix existe déjà !
                </div>
                <div style={{ fontSize:11, color:'#9BA8C0', marginBottom:8 }}>
                  <strong style={{ color:'#E2E8F8' }}>{duplicate.name}</strong> · {duplicate.memberCount} membre{duplicate.memberCount>1?'s':''} · VibzGuard actif
                </div>
                <div style={{ fontSize:10, color:'#5A6A8A' }}>
                  Clique sur "Rejoindre" pour fusionner avec ce salon existant.
                </div>
              </div>
            )}

            {/* Catégorie Styles */}
            {(tab === 'Tous' || tab === 'Styles') && (
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'#E07A9A', letterSpacing:1, textTransform:'uppercase', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                  🎼 Styles musicaux
                  <span style={{ fontSize:9, color:'#5A6A8A', fontWeight:600, textTransform:'none', letterSpacing:0 }}>
                    {filtered.filter(i=>i.cat==='Styles').length} résultats
                  </span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {filtered.filter(i => i.cat === 'Styles').map(item => {
                    const on = selected.includes(item.label)
                    return (
                      <div
                        key={item.label}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('mix-item', item.label)}
                        onClick={() => toggle(item.label)}
                        style={{
                          padding:'6px 12px', borderRadius:20, cursor:'pointer', userSelect:'none',
                          background: on ? `${item.color}28` : 'rgba(255,255,255,0.04)',
                          border:`1.5px solid ${on ? item.color : 'rgba(255,255,255,0.07)'}`,
                          color: on ? item.color : '#9BA8C0',
                          fontSize:12, fontWeight:700,
                          display:'flex', alignItems:'center', gap:5,
                          transition:'all 0.12s',
                          boxShadow: on ? `0 0 10px ${item.color}33` : 'none',
                        }}
                      >
                        <span style={{ fontSize:13 }}>{item.emoji}</span>
                        {item.label}
                        {on && <span style={{ fontSize:10, opacity:0.8 }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Séparateur */}
            {tab === 'Tous' && <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />}

            {/* Catégorie Instruments */}
            {(tab === 'Tous' || tab === 'Instruments') && (
              <div>
                <div style={{ fontSize:10, fontWeight:800, color:'#52C07A', letterSpacing:1, textTransform:'uppercase', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                  🎵 Instruments
                  <span style={{ fontSize:9, color:'#5A6A8A', fontWeight:600, textTransform:'none', letterSpacing:0 }}>
                    {filtered.filter(i=>i.cat==='Instruments').length} résultats
                  </span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {filtered.filter(i => i.cat === 'Instruments').map(item => {
                    const on = selected.includes(item.label)
                    return (
                      <div
                        key={item.label}
                        draggable
                        onDragStart={e => e.dataTransfer.setData('mix-item', item.label)}
                        onClick={() => toggle(item.label)}
                        style={{
                          padding:'6px 12px', borderRadius:20, cursor:'pointer', userSelect:'none',
                          background: on ? `${item.color}28` : 'rgba(255,255,255,0.04)',
                          border:`1.5px solid ${on ? item.color : 'rgba(255,255,255,0.07)'}`,
                          color: on ? item.color : '#9BA8C0',
                          fontSize:12, fontWeight:700,
                          display:'flex', alignItems:'center', gap:5,
                          transition:'all 0.12s',
                          boxShadow: on ? `0 0 10px ${item.color}33` : 'none',
                        }}
                      >
                        <span style={{ fontSize:13 }}>{item.emoji}</span>
                        {item.label}
                        {on && <span style={{ fontSize:10, opacity:0.8 }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:32, color:'#5A6A8A', fontSize:13 }}>
                Aucun résultat pour « {search} »
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'16px 24px', borderTop:'1.5px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:10 }}>
          {/* Nom du salon */}
          {selected.length > 0 && !duplicate && (
            <input
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              placeholder={`Nom du salon · ex: ${selected.slice(0,2).join(' × ')}`}
              style={{
                width:'100%', padding:'10px 14px', borderRadius:12,
                border:`1.5px solid ${firstColor}44`, background:'rgba(255,255,255,0.04)',
                color:'#E2E8F8', fontSize:13, fontFamily:font, outline:'none', boxSizing:'border-box',
              }}
            />
          )}

          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {/* Info politique */}
            <div style={{ flex:1, fontSize:10, color:'#5A6A8A', lineHeight:1.5 }}>
              🛡️ Chaque salon Mix est protégé par <strong style={{ color:'#52C07A' }}>VibzGuard</strong> + modérateur IA automatique. Règles de la charte Vibz appliquées.
            </div>
            <button onClick={onClose} style={{ padding:'11px 18px', borderRadius:14, border:'1.5px solid rgba(255,255,255,0.1)', background:'transparent', color:'#9BA8C0', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:font, whiteSpace:'nowrap' }}>
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={selected.length === 0}
              style={{
                padding:'11px 22px', borderRadius:14, border:'none',
                background: selected.length === 0
                  ? 'rgba(255,255,255,0.05)'
                  : duplicate
                    ? 'linear-gradient(135deg,#6BB8E8,#52C07A)'
                    : `linear-gradient(135deg,${firstColor},#A78BDB)`,
                color: selected.length === 0 ? '#5A6A8A' : 'white',
                fontWeight:800, fontSize:13, cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily:font, whiteSpace:'nowrap',
                boxShadow: selected.length > 0 ? `0 6px 20px ${firstColor}44` : 'none',
                transition:'all 0.2s',
              }}
            >
              {selected.length === 0
                ? 'Sélectionne des éléments'
                : duplicate
                  ? `🔀 Rejoindre "${duplicate.name}"`
                  : `🎛️ Créer le salon`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
