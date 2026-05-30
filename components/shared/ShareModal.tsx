import { useState } from 'react'

export type ShareContext =
  | { type: 'profile'; name: string; instruments: string[]; city: string; userId: string }
  | { type: 'match';   name: string; instrument: string; city: string }
  | { type: 'collab';  name: string; instrument: string; city: string; genre: string }
  | { type: 'app' }

interface Props {
  context: ShareContext
  onClose: () => void
}

const BASE_URL = 'https://vibz-zeta.vercel.app'
const font = 'Nunito, sans-serif'

// Génère le texte et l'URL selon le contexte
function buildShare(ctx: ShareContext): { text: string; url: string; card: React.ReactNode } {
  switch (ctx.type) {
    case 'profile':
      return {
        text: `🎵 Je suis ${ctx.name}${ctx.instruments.length ? `, ${ctx.instruments[0]}` : ''}${ctx.city ? ` à ${ctx.city}` : ''} — retrouve-moi sur Vibz, l'appli de rencontre musicale 🦋`,
        url: `${BASE_URL}/profil/${ctx.userId}`,
        card: (
          <div style={{ background:'linear-gradient(135deg,#1C2233,#2A1830)', borderRadius:20, padding:24, textAlign:'center', border:'1.5px solid rgba(224,122,154,0.3)' }}>
            <div style={{ fontSize:48, marginBottom:8 }}>🦋</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#E2E8F8', marginBottom:4 }}>{ctx.name}</div>
            {ctx.instruments.length > 0 && <div style={{ fontSize:13, color:'#E07A9A', fontWeight:700, marginBottom:4 }}>{ctx.instruments.map(i => `🎵 ${i}`).join(' · ')}</div>}
            {ctx.city && <div style={{ fontSize:12, color:'#9BA8C0' }}>📍 {ctx.city}</div>}
            <div style={{ marginTop:16, fontSize:11, color:'#5A6A8A', fontWeight:700 }}>vibz-zeta.vercel.app</div>
          </div>
        ),
      }
    case 'match':
      return {
        text: `💑 J'ai matchée avec ${ctx.name} sur Vibz${ctx.instrument ? ` — on adore tous les deux ${ctx.instrument}` : ''} ! Rejoins-nous sur l'appli de rencontre musicale 🎶`,
        url: BASE_URL,
        card: (
          <div style={{ background:'linear-gradient(135deg,#2A1020,#1C2233)', borderRadius:20, padding:24, textAlign:'center', border:'1.5px solid rgba(224,122,154,0.5)' }}>
            <div style={{ fontSize:44, marginBottom:8 }}>💑</div>
            <div style={{ fontSize:15, fontWeight:800, color:'#E2E8F8', marginBottom:6 }}>Nouveau match sur Vibz !</div>
            <div style={{ fontSize:13, color:'#E07A9A', fontWeight:700 }}>Avec {ctx.name} {ctx.instrument ? `· ${ctx.instrument}` : ''}</div>
            {ctx.city && <div style={{ fontSize:12, color:'#9BA8C0', marginTop:4 }}>📍 {ctx.city}</div>}
            <div style={{ marginTop:16, padding:'8px 16px', borderRadius:20, background:'rgba(224,122,154,0.15)', display:'inline-block', fontSize:11, color:'#E07A9A', fontWeight:800 }}>🦋 vibz-zeta.vercel.app</div>
          </div>
        ),
      }
    case 'collab':
      return {
        text: `🎵 Je cherche un·e ${ctx.instrument} pour collaborer${ctx.genre ? ` sur du ${ctx.genre}` : ''}${ctx.city ? ` à ${ctx.city}` : ''} ! Trouve-moi sur Vibz 🦋`,
        url: BASE_URL,
        card: (
          <div style={{ background:'linear-gradient(135deg,#0D1A10,#1C2233)', borderRadius:20, padding:24, textAlign:'center', border:'1.5px solid rgba(82,192,122,0.4)' }}>
            <div style={{ fontSize:44, marginBottom:8 }}>🎵</div>
            <div style={{ fontSize:15, fontWeight:800, color:'#E2E8F8', marginBottom:6 }}>Recherche collab musicale</div>
            <div style={{ fontSize:13, color:'#52C07A', fontWeight:700 }}>{ctx.name} cherche un·e {ctx.instrument}</div>
            {ctx.genre && <div style={{ fontSize:12, color:'#9BA8C0', marginTop:4 }}>🎼 {ctx.genre}</div>}
            {ctx.city && <div style={{ fontSize:12, color:'#9BA8C0' }}>📍 {ctx.city}</div>}
            <div style={{ marginTop:16, fontSize:11, color:'#5A6A8A', fontWeight:700 }}>vibz-zeta.vercel.app</div>
          </div>
        ),
      }
    case 'app':
    default:
      return {
        text: `🦋 Je viens de rejoindre Vibz — l'appli de rencontre et de collab musicale ! Retrouve des musiciens près de chez toi, crée des salons Mix, match avec des artistes qui vibrent comme toi 🎵`,
        url: BASE_URL,
        card: (
          <div style={{ background:'linear-gradient(135deg,#1C2233,#1A1030)', borderRadius:20, padding:24, textAlign:'center', border:'1.5px solid rgba(107,184,232,0.3)' }}>
            <div style={{ fontSize:52, marginBottom:8 }}>🦋</div>
            <div style={{ fontSize:20, fontWeight:800, color:'#E2E8F8', marginBottom:6 }}>Vibz</div>
            <div style={{ fontSize:13, color:'#6BB8E8', fontWeight:700, marginBottom:4 }}>Rencontre · Musique · Collab</div>
            <div style={{ fontSize:11, color:'#9BA8C0' }}>L'appli où les musiciens se rencontrent</div>
            <div style={{ marginTop:16, fontSize:11, color:'#5A6A8A', fontWeight:700 }}>vibz-zeta.vercel.app · Gratuit 🎁</div>
          </div>
        ),
      }
  }
}

export default function ShareModal({ context, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const { text, url, card } = buildShare(context)
  const encoded = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(url)

  const PLATFORMS = [
    {
      name: 'X · Twitter',
      emoji: '𝕏',
      color: '#000000',
      bg: '#1a1a1a',
      href: `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`,
    },
    {
      name: 'WhatsApp',
      emoji: '💬',
      color: '#25D366',
      bg: '#0a1f0f',
      href: `https://api.whatsapp.com/send?text=${encoded}%20${encodedUrl}`,
    },
    {
      name: 'Facebook',
      emoji: 'f',
      color: '#1877F2',
      bg: '#0a0f1f',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`,
    },
    {
      name: 'Instagram',
      emoji: '📸',
      color: '#C13584',
      bg: '#1a0a12',
      action: 'instagram',
      href: '',
    },
    {
      name: 'TikTok',
      emoji: '🎵',
      color: '#FF0050',
      bg: '#1a0a0a',
      action: 'tiktok',
      href: '',
    },
    {
      name: 'Telegram',
      emoji: '✈️',
      color: '#0088cc',
      bg: '#0a121a',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encoded}`,
    },
    {
      name: 'Reddit',
      emoji: '🤖',
      color: '#FF4500',
      bg: '#1a0f08',
      href: `https://reddit.com/submit?url=${encodedUrl}&title=${encoded}`,
    },
    {
      name: 'LinkedIn',
      emoji: 'in',
      color: '#0A66C2',
      bg: '#0a101a',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ]

  const handleShare = (p: typeof PLATFORMS[0]) => {
    if (p.action === 'instagram' || p.action === 'tiktok') {
      handleCopy()
      return
    }
    if (p.href) window.open(p.href, '_blank', 'width=600,height=500')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${text}\n${url}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Web Share API (mobile natif)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vibz 🦋', text, url })
      } catch {/* annulé */}
    }
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:font }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#161B26', borderRadius:24, width:'100%', maxWidth:520, border:'1.5px solid rgba(255,255,255,0.08)', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:'1.5px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#E2E8F8' }}>🚀 Partager sur la toile</div>
            <div style={{ fontSize:11, color:'#5A6A8A', marginTop:2 }}>Fais vibrer ton réseau avec Vibz</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.1)', background:'transparent', color:'#9BA8C0', cursor:'pointer', fontSize:14 }}>✕</button>
        </div>

        {/* Carte preview */}
        <div style={{ padding:'16px 24px 0' }}>{card}</div>

        {/* Plateformes */}
        <div style={{ padding:'16px 24px' }}>
          <div style={{ fontSize:10, fontWeight:800, color:'#5A6A8A', letterSpacing:1, textTransform:'uppercase', marginBottom:10 }}>Partager sur</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {PLATFORMS.map(p => (
              <button
                key={p.name}
                onClick={() => handleShare(p)}
                style={{
                  padding:'10px 14px', borderRadius:12, border:`1.5px solid ${p.color}33`,
                  background:`${p.bg}`, color:p.color,
                  fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:font,
                  display:'flex', alignItems:'center', gap:8, transition:'all 0.15s',
                  textAlign:'left',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${p.color}18` }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = p.bg }}
              >
                <span style={{ fontSize:16, minWidth:20, textAlign:'center' }}>{p.emoji}</span>
                {p.name}
                {(p.action === 'instagram' || p.action === 'tiktok') && (
                  <span style={{ fontSize:9, color:'#5A6A8A', marginLeft:'auto' }}>copier lien</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{ padding:'0 24px 20px', display:'flex', gap:8 }}>
          {/* Copier lien */}
          <button
            onClick={handleCopy}
            style={{
              flex:1, padding:'11px', borderRadius:14, border:'1.5px solid rgba(255,255,255,0.1)',
              background: copied ? 'rgba(82,192,122,0.15)' : 'rgba(255,255,255,0.04)',
              color: copied ? '#52C07A' : '#9BA8C0',
              fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:font, transition:'all 0.2s',
            }}
          >
            {copied ? '✅ Lien copié !' : '🔗 Copier le lien'}
          </button>

          {/* Web Share API si dispo (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              style={{
                flex:1, padding:'11px', borderRadius:14, border:'none',
                background:'linear-gradient(135deg,#E07A9A,#6BB8E8)',
                color:'white', fontWeight:800, fontSize:13, cursor:'pointer', fontFamily:font,
                boxShadow:'0 4px 16px rgba(224,122,154,0.3)',
              }}
            >📲 Partager</button>
          )}
        </div>
      </div>
    </div>
  )
}
