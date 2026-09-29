// Invitation : lien personnel (rattache les nouveaux venus à ton réseau, voir six degrés),
// raccourcis vers les messageries, lien pour la bio Instagram / TikTok, et partage complet.
import { useState } from 'react'
import ShareModal from './ShareModal'
import { useTheme } from '../../lib/theme'
import { SITE_HOST } from '../../lib/site'
import { PLATFORMS, payload, withTracking, copyText } from '../../lib/share'

interface Props {
  userId: string
  compact?: boolean
}

const font = 'Nunito, sans-serif'
const QUICK = ['whatsapp', 'telegram', 'x']

export default function InviteWidget({ userId, compact = false }: Props) {
  const { theme: t } = useTheme()
  const [copied, setCopied] = useState<'' | 'lien' | 'bio'>('')
  const [showShare, setShowShare] = useState(false)

  const shortLink = `${SITE_HOST}/?ref=${userId.slice(0, 8)}`
  const quick = PLATFORMS.filter(p => QUICK.includes(p.id))

  const copy = async (what: 'lien' | 'bio') => {
    // Lien pour la bio : court, stable, et compté comme source « bio »
    const url = withTracking('/', { ref: userId, source: what === 'bio' ? 'bio' : 'lien', campaign: 'app' })
    if (await copyText(url)) { setCopied(what); setTimeout(() => setCopied(''), 2500) }
  }

  const open = (id: string) => {
    const p = PLATFORMS.find(x => x.id === id)
    if (p?.build) window.open(p.build(payload({ type: 'app' }, userId, id)), '_blank', 'noopener,noreferrer,width=640,height=640')
  }

  const pill = (color: string): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 8, background: color, color: 'white', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0,
  })

  if (compact) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: font, flexWrap: 'wrap' }}>
          <button onClick={() => copy('lien')}
            style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${t.pink}55`, background: t.pinkLight, color: t.pinkDark, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: font }}>
            {copied === 'lien' ? '✅ Lien copié !' : '🔗 Inviter des amis'}
          </button>
          {quick.map(p => <button key={p.id} onClick={() => open(p.id)} title={`Inviter via ${p.name}`} style={pill(p.color)}>{p.icon}</button>)}
          <button onClick={() => setShowShare(true)} title="Plus de façons de partager" style={pill(t.pink)}>+</button>
        </div>
        {showShare && <ShareModal context={{ type: 'app' }} onClose={() => setShowShare(false)} />}
      </>
    )
  }

  return (
    <>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 18, padding: 16, fontFamily: font }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 22 }}>🌱</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Invite tes amis musiciens</div>
            <div style={{ fontSize: 12, color: t.textMuted }}>Chaque inscription par ton lien agrandit ton réseau à 6 degrés</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0, padding: '9px 12px', borderRadius: 10, background: t.bg2, border: `1px solid ${t.border}`, fontSize: 12, color: t.textMuted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shortLink}
          </div>
          <button onClick={() => copy('lien')}
            style={{ padding: '9px 14px', borderRadius: 10, border: 'none', background: copied === 'lien' ? t.greenLight : t.blueLight, color: t.text, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {copied === 'lien' ? '✅ Copié' : '📋 Copier'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quick.map(p => (
            <button key={p.id} onClick={() => open(p.id)}
              style={{ flex: '1 1 90px', padding: 9, borderRadius: 10, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ ...pill(p.color), width: 20, height: 20, borderRadius: 6, fontSize: 11 }}>{p.icon}</span>{p.name}
            </button>
          ))}
          <button onClick={() => setShowShare(true)}
            style={{ flex: '1 1 90px', padding: 9, borderRadius: 10, border: `1px solid ${t.pink}55`, background: t.pinkLight, color: t.pinkDark, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: font }}>
            🚀 Plus
          </button>
        </div>

        <button onClick={() => copy('bio')}
          style={{ marginTop: 10, width: '100%', padding: 9, borderRadius: 10, border: `1px dashed ${t.border}`, background: 'transparent', color: t.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
          {copied === 'bio' ? '✅ Lien copié : colle-le dans ta bio' : '✨ Lien pour ta bio Instagram, TikTok, SoundCloud…'}
        </button>
      </div>

      {showShare && <ShareModal context={{ type: 'app' }} onClose={() => setShowShare(false)} />}
    </>
  )
}
