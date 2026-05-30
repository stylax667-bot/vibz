import { useState } from 'react'
import ShareModal from './ShareModal'

interface Props {
  userId: string
  compact?: boolean
}

const BASE_URL = 'https://vibz-zeta.vercel.app'
const font = 'Nunito, sans-serif'

export default function InviteWidget({ userId, compact = false }: Props) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const inviteLink = `${BASE_URL}?ref=${userId.slice(0, 8)}`

  const copy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const QUICK_SHARES = [
    {
      label: 'WhatsApp',
      emoji: '💬',
      color: '#25D366',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`🦋 Rejoins-moi sur Vibz — l'appli de rencontre musicale ! ${inviteLink}`)}`,
    },
    {
      label: 'X',
      emoji: '𝕏',
      color: '#E2E8F8',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`🦋 Je suis sur Vibz, l'appli de rencontre et de collab musicale ! Rejoins-moi 🎵`)}&url=${encodeURIComponent(inviteLink)}`,
    },
    {
      label: 'Telegram',
      emoji: '✈️',
      color: '#0088cc',
      href: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('🦋 Rejoins-moi sur Vibz !')}`,
    },
  ]

  if (compact) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:font }}>
        <button
          onClick={copy}
          style={{ padding:'6px 12px', borderRadius:20, border:'1.5px solid rgba(224,122,154,0.3)', background:'rgba(224,122,154,0.08)', color:'#E07A9A', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:font }}
        >
          {copied ? '✅ Copié !' : '🔗 Inviter des amis'}
        </button>
        {QUICK_SHARES.map(s => (
          <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
            style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.06)', border:`1.5px solid ${s.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, textDecoration:'none', color:s.color, flexShrink:0 }}
            title={`Partager sur ${s.label}`}
          >{s.emoji}</a>
        ))}
      </div>
    )
  }

  return (
    <>
      <div style={{ background:'linear-gradient(135deg,rgba(107,184,232,0.08),rgba(167,139,219,0.08))', border:'1.5px solid rgba(107,184,232,0.15)', borderRadius:16, padding:'16px 18px', fontFamily:font }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <span style={{ fontSize:22 }}>🎯</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'#E2E8F8' }}>Invite des amis musiciens</div>
            <div style={{ fontSize:11, color:'#9BA8C0' }}>Plus on est de fous, plus Vibz vibre !</div>
          </div>
        </div>

        {/* Lien d'invitation */}
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          <div style={{ flex:1, padding:'9px 12px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1.5px solid rgba(255,255,255,0.08)', fontSize:11, color:'#9BA8C0', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {inviteLink}
          </div>
          <button
            onClick={copy}
            style={{ padding:'9px 14px', borderRadius:10, border:'none', background: copied ? 'rgba(82,192,122,0.2)' : 'rgba(107,184,232,0.15)', color: copied ? '#52C07A' : '#6BB8E8', fontWeight:800, fontSize:11, cursor:'pointer', fontFamily:font, whiteSpace:'nowrap', transition:'all 0.2s', flexShrink:0 }}
          >{copied ? '✅' : '📋 Copier'}</button>
        </div>

        {/* Boutons de partage rapide */}
        <div style={{ display:'flex', gap:8 }}>
          {QUICK_SHARES.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex:1, padding:'9px', borderRadius:10, border:`1.5px solid ${s.color}33`, background:`${s.color}11`, color:s.color, fontSize:12, fontWeight:800, textDecoration:'none', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.15s', fontFamily:font }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${s.color}22` }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${s.color}11` }}
            >
              <span>{s.emoji}</span> {s.label}
            </a>
          ))}
          <button
            onClick={() => setShowShare(true)}
            style={{ flex:1, padding:'9px', borderRadius:10, border:'1.5px solid rgba(224,122,154,0.3)', background:'rgba(224,122,154,0.1)', color:'#E07A9A', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:font, transition:'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224,122,154,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224,122,154,0.1)' }}
          >🚀 Plus</button>
        </div>
      </div>

      {showShare && (
        <ShareModal context={{ type:'app' }} onClose={() => setShowShare(false)} />
      )}
    </>
  )
}
