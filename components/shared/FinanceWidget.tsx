import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

// ══════════════════════════════════════════════════════════════════
//  💰 Vibz Finance Widget — Transparence financière en temps réel
//  Draggable · Réductible · Fermable · Anonyme
// ══════════════════════════════════════════════════════════════════

interface Finances {
  id:               number
  balance:          number   // solde actuel en €
  monthly_cost:     number   // coûts mensuels serveur
  goal:             number   // objectif cagnotte
  message:          string | null
  donations_paused: boolean
  updated_at:       string
}

// ── Seuils de la jauge ─────────────────────────────────────────────
const GAUGE_MIN = -250
const GAUGE_MAX = 500

function getStatus(f: Finances) {
  const { balance, goal, donations_paused: paused } = f
  if (paused || balance >= GAUGE_MAX * 0.85)
    return { color:'#A855F7', emoji:'🟣', label:'Maximum atteint',      sub:'Dons suspendus — merci à tous !',        glow:'168,85,247' }
  if (balance >= goal * 2)
    return { color:'#3B82F6', emoji:'🔵', label:'Surplus important',     sub:'Le projet est très bien financé',         glow:'59,130,246' }
  if (balance >= 0)
    return { color:'#22C55E', emoji:'🟢', label:'Bonne santé',           sub:'Le projet couvre ses coûts ✓',            glow:'34,197,94'  }
  if (balance >= -50)
    return { color:'#EAB308', emoji:'🟡', label:'Équilibre fragile',     sub:'Un coup de pouce serait bienvenu',        glow:'234,179,8'  }
  if (balance >= -150)
    return { color:'#F97316', emoji:'🟠', label:'Déficit',               sub:'Le projet perd de l\'argent',             glow:'249,115,22' }
  return   { color:'#EF4444', emoji:'🔴', label:'Déficit critique',      sub:'Le projet est en difficulté',             glow:'239,68,68'  }
}

function toPct(value: number) {
  return Math.min(100, Math.max(0, ((value - GAUGE_MIN) / (GAUGE_MAX - GAUGE_MIN)) * 100))
}

function fmtBalance(n: number) {
  return (n >= 0 ? '+' : '') + n.toFixed(0) + '€'
}

function timeAgo(iso: string) {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 2)  return 'À l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24)    return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

const FONT = 'Nunito, sans-serif'

const DEFAULT: Finances = {
  id: 1, balance: 0, monthly_cost: 30, goal: 100,
  message: null, donations_paused: false, updated_at: '',
}

export default function FinanceWidget() {
  const [data,     setData]     = useState<Finances | null>(null)
  const [open,     setOpen]     = useState(true)
  const [visible,  setVisible]  = useState(true)
  const [mounted,  setMounted]  = useState(false)
  const [pos,      setPos]      = useState({ x: 20, y: 80 })
  const [dragging, setDragging] = useState(false)

  const dragRef = useRef({ active:false, sx:0, sy:0, ox:0, oy:0 })

  // ── Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true)

    // Position sauvegardée
    try {
      const saved = localStorage.getItem('vibz-fin-pos')
      if (saved) setPos(JSON.parse(saved))
      else setPos({ x: 20, y: window.innerHeight - 440 })
    } catch { setPos({ x: 20, y: 400 }) }

    // Fermé pour cette session ?
    if (sessionStorage.getItem('vibz-fin-closed')) setVisible(false)

    // Chargement DB
    supabase.from('project_finances').select('*').eq('id', 1).single()
      .then(({ data: d }) => { if (d) setData(d as Finances) })

    // Realtime
    const ch = supabase.channel('vibz-fin-rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'project_finances' },
        (p) => setData(p.new as Finances)
      )
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  // ── Drag (mouse + touch) ──────────────────────────────────────────
  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current.active) return
      const pt = 'touches' in e ? e.touches[0] : e
      const nx = dragRef.current.ox + pt.clientX - dragRef.current.sx
      const ny = dragRef.current.oy + pt.clientY - dragRef.current.sy
      setPos({ x: nx, y: ny })
    }
    const up = () => {
      if (!dragRef.current.active) return
      dragRef.current.active = false
      setDragging(false)
      setPos(prev => {
        localStorage.setItem('vibz-fin-pos', JSON.stringify(prev))
        return prev
      })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup',   up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend',  up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup',   up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend',  up)
    }
  }, [])

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pt = 'touches' in e ? e.touches[0] : e
    dragRef.current = { active:true, sx:pt.clientX, sy:pt.clientY, ox:pos.x, oy:pos.y }
    setDragging(true)
  }

  const close = () => {
    setVisible(false)
    sessionStorage.setItem('vibz-fin-closed', '1')
  }

  if (!mounted || !visible) return null

  const f   = data ?? DEFAULT
  const st  = getStatus(f)
  const pct = toPct(f.balance)
  const zeroPct = toPct(0)
  const canDonate = !f.donations_paused && f.balance < GAUGE_MAX * 0.85

  return (
    <div
      style={{
        position:   'fixed',
        left:        pos.x,
        top:         pos.y,
        zIndex:      9999,
        width:       open ? 296 : 'auto',
        minWidth:    open ? 296 : 0,
        fontFamily:  FONT,
        userSelect: 'none',
        cursor:      dragging ? 'grabbing' : 'default',
        filter:     `drop-shadow(0 6px 20px rgba(${st.glow},0.30))`,
        transition:  dragging ? 'none' : 'width 0.2s, filter 0.3s',
      }}
    >

      {/* ─── HEADER ───────────────────────────────────────────────── */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:             8,
          padding:         open ? '10px 12px' : '8px 12px',
          borderRadius:    open ? '16px 16px 0 0' : 14,
          background:     'rgba(8,12,24,0.88)',
          border:         `1.5px solid rgba(${st.glow},0.38)`,
          borderBottom:    open ? `1px solid rgba(${st.glow},0.18)` : `1.5px solid rgba(${st.glow},0.38)`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          cursor:          dragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Voyant pulsant */}
        <div style={{
          width:9, height:9, borderRadius:'50%', flexShrink:0,
          background: st.color,
          boxShadow: `0 0 0 0 ${st.color}`,
          animation: 'finPulse 2s ease-in-out infinite',
        }}/>

        {/* Valeur */}
        <span style={{ fontSize:14, fontWeight:800, color:st.color, letterSpacing:-0.5, flex:1 }}>
          {fmtBalance(f.balance)}
        </span>

        {/* Statut (visible seulement si réduit) */}
        {!open && (
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.50)', fontWeight:700, whiteSpace:'nowrap' }}>
            {st.label}
          </span>
        )}

        {/* Bouton réduire / agrandir */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={() => setOpen(v => !v)}
          title={open ? 'Réduire' : 'Agrandir'}
          style={iconBtn}
        >{open ? '–' : '⊞'}</button>

        {/* Bouton fermer */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={close}
          title="Fermer (réapparaît à la prochaine visite)"
          style={iconBtn}
        >×</button>
      </div>

      {/* ─── CORPS ────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          background:     'rgba(8,12,24,0.92)',
          border:         `1.5px solid rgba(${st.glow},0.28)`,
          borderTop:       'none',
          borderRadius:   '0 0 16px 16px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding:        '14px 16px',
          display:        'flex',
          flexDirection:  'column',
          gap:             12,
        }}>

          {/* Montant + statut */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:40, fontWeight:800, color:st.color, lineHeight:1, letterSpacing:-2 }}>
              {fmtBalance(f.balance)}
            </div>
            <div style={{ fontSize:12, fontWeight:800, color:st.color, marginTop:3, letterSpacing:0.2 }}>
              {st.emoji} {st.label}
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.42)', marginTop:3, lineHeight:1.4 }}>
              {st.sub}
            </div>
          </div>

          {/* ── Jauge gradient ─────────────────────────────────────── */}
          <div>
            {/* Étiquettes émoji */}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, marginBottom:4, padding:'0 2px' }}>
              {['🔴','🟠','🟡','🟢','🔵','🟣'].map(e => (
                <span key={e} style={{ opacity:0.65 }}>{e}</span>
              ))}
            </div>

            {/* Barre */}
            <div style={{
              height:10, borderRadius:5, position:'relative',
              background:'linear-gradient(90deg,#EF4444 0%,#F97316 18%,#EAB308 32%,#22C55E 50%,#3B82F6 72%,#A855F7 100%)',
              border:'1px solid rgba(255,255,255,0.06)',
              overflow:'visible',
            }}>
              {/* Ligne zéro */}
              <div style={{
                position:'absolute', left:`${zeroPct}%`,
                top:-5, bottom:-5, width:1.5,
                background:'rgba(255,255,255,0.55)',
                borderRadius:2, transform:'translateX(-50%)',
                pointerEvents:'none',
              }}/>

              {/* Curseur */}
              <div style={{
                position:'absolute',
                left:`${pct}%`, top:'50%',
                transform:'translate(-50%,-50%)',
                width:16, height:16, borderRadius:'50%',
                background: st.color,
                border:'2px solid rgba(255,255,255,0.9)',
                boxShadow:`0 0 12px ${st.color}, 0 0 24px rgba(${st.glow},0.45)`,
                transition:'left 0.7s cubic-bezier(0.34,1.56,0.64,1)',
                zIndex:2,
              }}/>
            </div>

            {/* Axe */}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:8.5, color:'rgba(255,255,255,0.22)', marginTop:5, fontWeight:700 }}>
              <span>{GAUGE_MIN}€</span>
              <span>0€</span>
              <span>+{GAUGE_MAX}€</span>
            </div>
          </div>

          {/* ── Détails ──────────────────────────────────────────────── */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, padding:'10px 12px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {[
              { icon:'⚙️', label:'Coûts serveur / mois', val:`−${f.monthly_cost.toFixed(0)}€`, col:'#F97316' },
              { icon:'🎯', label:'Objectif cagnotte',      val:`${f.goal.toFixed(0)}€`,           col:'#3B82F6' },
              { icon:'💰', label:'Solde actuel',            val: fmtBalance(f.balance),            col: st.color },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', fontWeight:600 }}>
                  {row.icon} {row.label}
                </span>
                <span style={{ fontSize:12, fontWeight:800, color:row.col }}>{row.val}</span>
              </div>
            ))}
          </div>

          {/* ── Message du projet ─────────────────────────────────── */}
          {f.message && (
            <div style={{
              padding:'9px 12px', borderRadius:12,
              background:`rgba(${st.glow},0.10)`,
              border:`1px solid rgba(${st.glow},0.22)`,
              fontSize:11, color:'rgba(255,255,255,0.68)',
              lineHeight:1.55, fontStyle:'italic',
            }}>
              "{f.message}"
            </div>
          )}

          {/* ── Bouton action ─────────────────────────────────────── */}
          {canDonate ? (
            <a
              href="https://ko-fi.com/vibzapp"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:'block', textAlign:'center',
                padding:'10px 14px', borderRadius:12,
                background:`linear-gradient(135deg,rgba(${st.glow},0.22),rgba(${st.glow},0.12))`,
                border:`1px solid rgba(${st.glow},0.40)`,
                color: st.color, fontSize:13, fontWeight:800,
                textDecoration:'none', transition:'opacity 0.15s',
              }}
              onMouseEnter={e=>(e.currentTarget.style.opacity='0.75')}
              onMouseLeave={e=>(e.currentTarget.style.opacity='1')}
            >☕ Contribuer à la cagnotte</a>
          ) : (
            <div style={{
              textAlign:'center', padding:'10px', borderRadius:12,
              background:'rgba(168,85,247,0.10)', border:'1px solid rgba(168,85,247,0.28)',
              color:'#A855F7', fontSize:12, fontWeight:700,
            }}>
              🟣 Dons suspendus — cagnotte pleine, merci !
            </div>
          )}

          {/* ── Pied ──────────────────────────────────────────────── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:2 }}>
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.20)', fontWeight:700 }}>
              🦋 Transparence financière Vibz
            </span>
            {f.updated_at && (
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.20)' }}>
                ↻ {timeAgo(f.updated_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── CSS keyframe pulsé ────────────────────────────────────── */}
      <style>{`
        @keyframes finPulse {
          0%, 100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
          50%       { box-shadow: 0 0 0 5px transparent; opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

// ── Style boutons icône ─────────────────────────────────────────────
const iconBtn: React.CSSProperties = {
  width:22, height:22, borderRadius:7, border:'none',
  background:'rgba(255,255,255,0.07)',
  color:'rgba(255,255,255,0.60)',
  cursor:'pointer', fontSize:13, fontWeight:700,
  display:'flex', alignItems:'center', justifyContent:'center',
  fontFamily: FONT, lineHeight:1, padding:0,
  transition:'background 0.1s',
}
