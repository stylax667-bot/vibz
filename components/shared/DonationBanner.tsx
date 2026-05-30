import { useState } from 'react'

type Variant = 'footer' | 'match' | 'profile' | 'inline'

interface Props {
  variant?: Variant
  onDismiss?: () => void
}

const KOFI_URL = 'https://ko-fi.com/vibz'

export default function DonationBanner({ variant = 'inline', onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const font = 'Nunito, sans-serif'

  const dismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  // ── Variante footer : ultra-discret dans la barre du bas ──────────────────
  if (variant === 'footer') {
    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display:'flex', alignItems:'center', gap:5, textDecoration:'none', opacity:0.65, transition:'opacity 0.2s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.65')}
        title="Soutenir Vibz gratuitement avec un café ☕"
      >
        <span style={{ fontSize:12 }}>☕</span>
        <span style={{ fontSize:11, fontWeight:700, color:'#E07A9A', fontFamily:font }}>Soutenir Vibz</span>
      </a>
    )
  }

  // ── Variante match : popup émotionnel après un match ──────────────────────
  if (variant === 'match') {
    return (
      <div style={{
        position:'fixed', bottom:24, right:24, zIndex:300,
        background:'linear-gradient(135deg,#1C2233,#2A1020)',
        border:'1.5px solid rgba(224,122,154,0.3)',
        borderRadius:20, padding:'16px 20px', maxWidth:280,
        boxShadow:'0 16px 48px rgba(0,0,0,0.4)',
        fontFamily:font, animation:'slideInRight 0.4s ease',
      }}>
        <button onClick={dismiss} style={{ position:'absolute', top:8, right:10, background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:14, fontFamily:font }}>✕</button>
        <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F8', marginBottom:6 }}>
          🎉 Belle rencontre !
        </div>
        <div style={{ fontSize:11, color:'#9BA8C0', lineHeight:1.5, marginBottom:12 }}>
          Vibz est gratuit et le restera. Un petit café pour continuer l'aventure ?
        </div>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:'block', textAlign:'center', padding:'9px',
            borderRadius:12, background:'linear-gradient(135deg,#E07A9A,#F9A8C9)',
            color:'white', fontWeight:800, fontSize:12, textDecoration:'none',
            boxShadow:'0 4px 12px rgba(224,122,154,0.3)',
          }}
        >☕ Offrir un café à Vibz</a>
      </div>
    )
  }

  // ── Variante profile : bloc discret dans la page profil ──────────────────
  if (variant === 'profile') {
    return (
      <div style={{
        background:'linear-gradient(135deg,rgba(224,122,154,0.08),rgba(107,184,232,0.08))',
        border:'1.5px solid rgba(224,122,154,0.15)',
        borderRadius:16, padding:'14px 18px',
        display:'flex', alignItems:'center', gap:14, fontFamily:font,
      }}>
        <span style={{ fontSize:28, flexShrink:0 }}>☕</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F8', marginBottom:2 }}>Vibz est et restera gratuit</div>
          <div style={{ fontSize:11, color:'#9BA8C0', lineHeight:1.5 }}>
            Si l'app te plaît, un don aide à maintenir les serveurs et développer de nouvelles fonctionnalités.
          </div>
        </div>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding:'9px 16px', borderRadius:12, flexShrink:0,
            background:'rgba(224,122,154,0.15)',
            border:'1.5px solid rgba(224,122,154,0.3)',
            color:'#E07A9A', fontWeight:800, fontSize:12, textDecoration:'none',
            whiteSpace:'nowrap', transition:'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,122,154,0.25)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,122,154,0.15)' }}
        >☕ Soutenir</a>
      </div>
    )
  }

  // ── Variante inline : bandeau discret ────────────────────────────────────
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'10px 16px', borderRadius:14,
      background:'rgba(224,122,154,0.06)',
      border:'1px solid rgba(224,122,154,0.12)',
      fontFamily:font,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:16 }}>☕</span>
        <span style={{ fontSize:12, color:'#9BA8C0', fontWeight:600 }}>
          Vibz est <strong style={{ color:'#E2E8F8' }}>100% gratuit</strong> — si tu apprécies, un café est toujours bienvenu 🙏
        </span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding:'6px 14px', borderRadius:20, background:'rgba(224,122,154,0.15)', border:'1px solid rgba(224,122,154,0.3)', color:'#E07A9A', fontSize:11, fontWeight:800, textDecoration:'none', whiteSpace:'nowrap' }}
        >☕ Donner</a>
        <button onClick={dismiss} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.2)', cursor:'pointer', fontSize:14, padding:'0 4px', fontFamily:font }}>✕</button>
      </div>
    </div>
  )
}
