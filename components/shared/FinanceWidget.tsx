import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ══════════════════════════════════════════════════════════════════
//  💰 Vibz Finance Widget — Transparence financière
//  Affiche uniquement les dons réellement reçus via Ko-fi (webhook
//  supabase/functions/kofi-webhook). Tant que Ko-fi n'est pas branché,
//  le widget reste masqué : aucun chiffre inventé.
//  Draggable · Réductible · Fermable
// ══════════════════════════════════════════════════════════════════

const KOFI_URL = 'https://ko-fi.com/vibzapp'

interface Config {
  kofi_connected: boolean
  monthly_cost:   number   // coûts mensuels déclarés par l'équipe
  message:        string | null
}

interface Totals {
  month_total:      number
  all_time_total:   number
  donations_count:  number
  last_donation_at: string | null
}

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

function timeAgo(iso: string | null) {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 2)  return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24)    return `il y a ${h} h`
  return `il y a ${Math.floor(h / 24)} j`
}

// Garde le widget entièrement visible dans la fenêtre
function clampPos(p: { x: number; y: number }, w = 280, h = 56) {
  if (typeof window === 'undefined') return p
  const maxX = Math.max(8, window.innerWidth  - Math.min(w, window.innerWidth - 16) - 8)
  const maxY = Math.max(8, window.innerHeight - h - 8)
  return { x: Math.min(Math.max(8, p.x), maxX), y: Math.min(Math.max(8, p.y), maxY) }
}

const FONT = 'Nunito, sans-serif'
const ACCENT = '#52C07A'

export default function FinanceWidget() {
  const [config,   setConfig]   = useState<Config | null>(null)
  const [totals,   setTotals]   = useState<Totals | null>(null)
  const [open,     setOpen]     = useState(true)
  const [visible,  setVisible]  = useState(true)
  const [pos,      setPos]      = useState({ x: 20, y: 80 })
  const [dragging, setDragging] = useState(false)

  const dragRef = useRef({ active:false, sx:0, sy:0, ox:0, oy:0 })

  const load = useCallback(async () => {
    const [{ data: cfg }, { data: tot }] = await Promise.all([
      supabase.from('project_finances').select('kofi_connected, monthly_cost, message').eq('id', 1).maybeSingle(),
      supabase.rpc('kofi_totals'),
    ])
    if (cfg) setConfig(cfg as Config)
    const row = Array.isArray(tot) ? tot[0] : tot
    if (row) setTotals({
      month_total:      Number(row.month_total) || 0,
      all_time_total:   Number(row.all_time_total) || 0,
      donations_count:  Number(row.donations_count) || 0,
      last_donation_at: row.last_donation_at ?? null,
    })
  }, [])

  // ── Init ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Sur mobile : replié par défaut, en bas à gauche (au-dessus de la barre d'onglets)
    const small = window.innerWidth <= 768
    if (small) setOpen(false)

    try {
      const saved = localStorage.getItem('vibz-fin-pos')
      const fallback = small
        ? { x: 12, y: window.innerHeight - 130 }
        : { x: 20, y: window.innerHeight - 360 }
      setPos(clampPos(saved ? JSON.parse(saved) : fallback))
    } catch { setPos({ x: 12, y: 400 }) }

    try { if (sessionStorage.getItem('vibz-fin-closed')) setVisible(false) } catch {}

    load()

    // Le webhook met à jour project_finances à chaque don → on recharge les totaux
    const ch = supabase.channel('vibz-fin-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_finances' }, () => load())
      .subscribe()

    const onResize = () => setPos(p => clampPos(p))
    window.addEventListener('resize', onResize)
    return () => { supabase.removeChannel(ch); window.removeEventListener('resize', onResize) }
  }, [load])

  // ── Drag (souris + tactile) ───────────────────────────────────────
  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current.active) return
      const pt = 'touches' in e ? e.touches[0] : e
      if ('touches' in e) e.preventDefault()
      setPos(clampPos({
        x: dragRef.current.ox + pt.clientX - dragRef.current.sx,
        y: dragRef.current.oy + pt.clientY - dragRef.current.sy,
      }))
    }
    const up = () => {
      if (!dragRef.current.active) return
      dragRef.current.active = false
      setDragging(false)
      setPos(prev => {
        try { localStorage.setItem('vibz-fin-pos', JSON.stringify(prev)) } catch {}
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
    if ('button' in e) e.preventDefault()
    const pt = 'touches' in e ? e.touches[0] : e
    dragRef.current = { active:true, sx:pt.clientX, sy:pt.clientY, ox:pos.x, oy:pos.y }
    setDragging(true)
  }

  const close = () => {
    setVisible(false)
    try { sessionStorage.setItem('vibz-fin-closed', '1') } catch {}
  }

  // Rien d'affiché tant que les vrais chiffres Ko-fi ne sont pas disponibles
  if (!visible || !config?.kofi_connected || !totals) return null

  const cost = Number(config.monthly_cost) || 0
  const pct  = cost > 0 ? Math.min(100, (totals.month_total / cost) * 100) : 0
  const monthName = new Date().toLocaleDateString('fr-FR', { month: 'long' })

  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
      width: open ? 'min(280px, calc(100vw - 16px))' : 'auto',
      fontFamily: FONT, userSelect: 'none',
      filter: 'drop-shadow(0 6px 20px rgba(82,192,122,0.25))',
      transition: dragging ? 'none' : 'filter 0.3s',
    }}>

      {/* ─── En-tête (poignée de déplacement) ─────────────────────── */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: open ? '10px 12px' : '8px 12px',
          borderRadius: open ? '16px 16px 0 0' : 14,
          background: 'rgba(8,12,24,0.88)',
          border: '1.5px solid rgba(82,192,122,0.38)',
          borderBottom: open ? '1px solid rgba(82,192,122,0.18)' : '1.5px solid rgba(82,192,122,0.38)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none',
        }}
      >
        <span style={{ fontSize: 14 }}>☕</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: ACCENT, flex: 1, whiteSpace: 'nowrap' }}>
          {fmtEur(totals.month_total)}{!open && <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 10 }}> en {monthName}</span>}
        </span>
        <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
          onClick={() => setOpen(v => !v)} title={open ? 'Réduire' : 'Agrandir'} style={iconBtn}>
          {open ? '–' : '⊞'}
        </button>
        <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}
          onClick={close} title="Fermer (réapparaît à la prochaine visite)" style={iconBtn}>
          ×
        </button>
      </div>

      {/* ─── Corps ─────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          background: 'rgba(8,12,24,0.92)',
          border: '1.5px solid rgba(82,192,122,0.28)', borderTop: 'none',
          borderRadius: '0 0 16px 16px',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Dons reçus en {monthName}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: ACCENT, lineHeight: 1.1, letterSpacing: -1 }}>
              {fmtEur(totals.month_total)}
            </div>
          </div>

          {cost > 0 && (
            <div>
              <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 5, background: 'linear-gradient(90deg, #52C07A, #6BB8E8)', transition: 'width 0.7s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 5, fontWeight: 700 }}>
                <span>{Math.round(pct)} % des coûts du mois</span>
                <span>{fmtEur(cost)} / mois</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: '💰 Total depuis le lancement', val: fmtEur(totals.all_time_total) },
              { label: '🙏 Nombre de dons',           val: String(totals.donations_count) },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#E2E8F8' }}>{row.val}</span>
              </div>
            ))}
          </div>

          {config.message && (
            <div style={{ padding: '9px 12px', borderRadius: 12, background: 'rgba(82,192,122,0.10)', border: '1px solid rgba(82,192,122,0.22)', fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, fontStyle: 'italic' }}>
              &ldquo;{config.message}&rdquo;
            </div>
          )}

          <a href={KOFI_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', padding: '10px 14px', borderRadius: 12, background: 'rgba(82,192,122,0.18)', border: '1px solid rgba(82,192,122,0.40)', color: ACCENT, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
            ☕ Contribuer sur Ko-fi
          </a>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
            <span>🦋 Chiffres Ko-fi en temps réel</span>
            {totals.last_donation_at && <span>Dernier don {timeAgo(totals.last_donation_at)}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Style boutons icône ─────────────────────────────────────────────
const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: 'none',
  background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.60)',
  cursor: 'pointer', fontSize: 13, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONT, lineHeight: 1, padding: 0, flexShrink: 0,
}
