// Fenêtre de partage : chaque réseau reçoit le format qu'il attend (lien, texte, image story),
// chaque lien porte l'invitation (?ref=) et sa source (utm) — voir lib/share.ts.
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import {
  PLATFORMS, payload, isMobileDevice, storyFile, copyText,
  type ShareContext, type Platform,
} from '../../lib/share'

export type { ShareContext }

interface Props {
  context: ShareContext
  onClose: () => void
}

const font = 'Nunito, sans-serif'

const SUBTITLE: Record<ShareContext['type'], string> = {
  app:     'Fais découvrir Vibz à tes amis musiciens',
  profile: 'Ton profil, prêt à circuler',
  collab:  'Trouve avec qui jouer',
  member:  'Présente ce membre à quelqu’un',
  match:   'Sans nommer personne : ton match reste privé',
  mix:     'Invite du monde dans ton mélange',
  badge:   'Montre jusqu’où va ton réseau',
}

export default function ShareModal({ context, onClose }: Props) {
  const { theme: t } = useTheme()
  const [me, setMe] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const [qr, setQr] = useState<string | null>(null)
  const [mobile, setMobile] = useState(false)
  const [canNative, setCanNative] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMe(data.session?.user.id ?? null))
    setMobile(isMobileDevice())
    setCanNative(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  const preview = useMemo(() => payload(context, me, 'apercu'), [context, me])
  const platforms = PLATFORMS.filter(p => (mobile ? !p.desktopOnly : !p.mobileOnly))

  const flash = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(n => (n === msg ? '' : n)), 4500) }

  const share = async (p: Platform) => {
    const s = payload(context, me, p.id)
    if (p.mode === 'link' && p.build) {
      const href = p.build(s)
      if (/^(https?:)/.test(href)) window.open(href, '_blank', 'noopener,noreferrer,width=640,height=640')
      else window.location.href = href        // sms:, mailto:, fb-messenger:
      return
    }
    if (p.mode === 'copy') {
      await copyText(`${s.text}\n${s.url}`)
      flash(`✅ ${p.hint}`)
      return
    }
    // Image (Instagram, TikTok, Snapchat) : story 1080×1920 + lien dans le presse-papiers
    setBusy(p.id)
    await copyText(s.url)
    const file = await storyFile(s)
    setBusy('')
    if (file && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: s.title }) } catch { /* annulé */ }
      flash(`🔗 Lien copié. ${p.hint}`)
    } else if (file) {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(file); a.download = 'vibz-story.png'; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      flash(`⬇️ Image téléchargée et lien copié. ${p.hint}`)
    } else {
      flash('🔗 Lien copié (image indisponible pour le moment)')
    }
  }

  const nativeShare = async () => {
    const s = payload(context, me, 'natif')
    try { await navigator.share({ title: s.title, text: s.text, url: s.url }) } catch { /* annulé */ }
  }

  const copyLink = async () => {
    const s = payload(context, me, 'lien')
    flash((await copyText(s.url)) ? '✅ Lien copié' : 'Copie impossible : sélectionne le lien à la main')
  }

  const showQr = async () => {
    if (qr) { setQr(null); return }
    const s = payload(context, me, 'qr')
    setQr(await QRCode.toDataURL(s.url, { width: 480, margin: 2, color: { dark: '#1A1E2E', light: '#FFFFFF' } }))
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: t.overlay, backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, fontFamily: font }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Partager"
        style={{ background: t.surface, borderRadius: 22, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', border: `1px solid ${t.border}`, boxShadow: `0 24px 70px ${t.shadow}` }}>

        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>🚀 Partager</div>
            <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{SUBTITLE[context.type]}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>✕</button>
        </div>

        {/* Aperçu : l'image exacte que verront tes contacts */}
        <div style={{ padding: '0 18px' }}>
          <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${t.border}`, background: t.bg2 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.image.replace(/^https?:\/\/[^/]+/, '')} alt="Aperçu du lien partagé" width={1200} height={630} style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '1200 / 630' }} />
            <div style={{ padding: '8px 12px', fontSize: 12, color: t.textMuted, lineHeight: 1.45 }}>{preview.text}</div>
          </div>
        </div>

        {mobile && canNative && (
          <div style={{ padding: '12px 18px 0' }}>
            <button onClick={nativeShare}
              style={{ width: '100%', padding: 13, borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${t.pink}, ${t.blue})`, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: font }}>
              📲 Partager avec une appli du téléphone
            </button>
          </div>
        )}

        <div style={{ padding: '12px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8 }}>
            {platforms.map(p => (
              <button key={p.id} onClick={() => share(p)} title={p.hint || `Partager sur ${p.name}`} disabled={busy === p.id}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 14, border: `1px solid ${t.border}`, background: t.bg2, cursor: 'pointer', fontFamily: font, opacity: busy === p.id ? 0.5 : 1 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: p.color, color: p.id === 'snapchat' ? '#111' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{p.icon}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: t.text }}>{busy === p.id ? '…' : p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div role="status" style={{ margin: '0 18px 10px', padding: '9px 12px', borderRadius: 12, background: t.greenLight, color: t.text, fontSize: 12.5, fontWeight: 700, lineHeight: 1.45 }}>{notice}</div>
        )}

        <div style={{ padding: '0 18px 16px', display: 'flex', gap: 8 }}>
          <button onClick={copyLink} style={{ flex: 1, padding: 11, borderRadius: 14, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font }}>🔗 Copier le lien</button>
          <button onClick={showQr} style={{ flex: 1, padding: 11, borderRadius: 14, border: `1px solid ${t.border}`, background: qr ? t.pinkLight : 'transparent', color: t.text, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font }}>▦ QR code</button>
        </div>

        {qr && (
          <div style={{ padding: '0 18px 18px', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code du lien" width={220} height={220} style={{ borderRadius: 12, border: `1px solid ${t.border}` }} />
            <div style={{ fontSize: 12, color: t.textMuted, margin: '6px 0 8px' }}>À faire scanner en répète, en concert ou en jam : on arrive sur Vibz invité par toi.</div>
            <a href={qr} download="vibz-qr.png" style={{ fontSize: 12, fontWeight: 800, color: t.pink }}>Télécharger le QR code (pour une affiche, un flyer…)</a>
          </div>
        )}
      </div>
    </div>
  )
}
