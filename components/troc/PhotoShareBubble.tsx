import { useEffect, useState } from 'react'
import { useTheme } from '../../lib/theme'
import { decidePhoto, photoUrl, removeShare, trocLinks, type PhotoConsent, type PhotoShare } from '../../lib/troc'

// Une photo partagée dans le fil : floutée/masquée tant que le destinataire n'a pas dit « Voir ».
export default function PhotoShareBubble({ share, userId, consents, senderName, onDecided, onPublish, onError, accent }: {
  share: PhotoShare
  userId: string
  consents: PhotoConsent[]               // décisions sur CE partage
  senderName: string
  onDecided: (c: PhotoConsent) => void
  onPublish: (s: PhotoShare) => void     // l'auteur en fait une annonce Troc
  onError: (m: string) => void
  accent: string
}) {
  const { theme: t } = useTheme()
  const mine = share.sender_id === userId
  const myDecision = consents.find(c => c.user_id === userId)?.decision
  const canView = mine || myDecision === 'accepted'
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(false)

  useEffect(() => {
    if (!canView) { setUrl(null); return }
    let alive = true
    photoUrl(share.path).then(u => { if (alive) setUrl(u) })
    return () => { alive = false }
  }, [canView, share.path])

  const decide = async (d: 'accepted' | 'declined') => {
    setBusy(true)
    try { await decidePhoto(share.id, userId, d); onDecided({ share_id: share.id, user_id: userId, decision: d }) }
    catch (e) { onError((e as Error).message) }
    setBusy(false)
  }

  const accepted = consents.filter(c => c.decision === 'accepted').length
  const declined = consents.filter(c => c.decision === 'declined').length
  const box: React.CSSProperties = { width: 240, maxWidth: '100%', borderRadius: 16, overflow: 'hidden', border: `1.5px solid ${share.is_troc ? '#D9822B66' : t.border}`, background: t.surface }
  const small: React.CSSProperties = { padding: '7px 12px', borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }

  return (
    <div style={box}>
      {share.is_troc && (
        <div style={{ padding: '5px 10px', background: '#FCEBD7', color: '#A35A12', fontSize: 11, fontWeight: 800 }}>🔁 Matos à troquer</div>
      )}

      {canView ? (
        url
          ? <img src={url} alt={share.caption || 'Photo partagée'} onClick={() => setZoom(true)} style={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'cover', cursor: 'zoom-in' }} />
          : <div style={{ height: 160, display: 'grid', placeItems: 'center', color: t.textMuted, fontSize: 12 }}>Chargement…</div>
      ) : (
        <div style={{ padding: 14, textAlign: 'center', background: `repeating-linear-gradient(45deg, ${t.bg2}, ${t.bg2} 8px, ${t.surface2} 8px, ${t.surface2} 16px)` }}>
          <div style={{ fontSize: 30 }}>📸</div>
          {myDecision === 'declined' ? (
            <>
              <div style={{ fontSize: 12, color: t.textMuted, margin: '6px 0 8px' }}>Tu as choisi de ne pas voir cette photo.</div>
              <button disabled={busy} onClick={() => decide('accepted')} style={{ ...small, border: `1px solid ${t.border}`, background: 'transparent', color: t.textSub }}>Finalement, la voir</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, margin: '6px 0 10px', lineHeight: 1.4 }}>{senderName} veut te montrer une photo{share.is_troc ? ' de matos' : ''}.</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                <button disabled={busy} onClick={() => decide('accepted')} style={{ ...small, border: 'none', background: accent, color: 'white' }}>👀 Voir</button>
                <button disabled={busy} onClick={() => decide('declined')} style={{ ...small, border: `1px solid ${t.border}`, background: t.surface, color: t.textMuted }}>Non merci</button>
              </div>
            </>
          )}
        </div>
      )}

      {(share.caption || mine || share.listing_id) && (
        <div style={{ padding: '8px 10px', fontSize: 12, color: t.textSub, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {share.caption && canView && <div style={{ color: t.text, fontSize: 13 }}>{share.caption}</div>}
          {mine && (
            <div style={{ fontSize: 11, color: t.textMuted }}>
              {accepted || declined ? `👀 vue par ${accepted}${declined ? ` · ${declined} refus` : ''}` : '⏳ en attente d’acceptation'}
            </div>
          )}
          {share.listing_id ? (
            <a href={trocLinks.listing(share.listing_id)} target="_blank" rel="noopener noreferrer" style={{ ...small, display: 'block', textAlign: 'center', textDecoration: 'none', border: 'none', background: '#D9822B', color: 'white' }}>Voir l’annonce sur Vibz Troc ↗</a>
          ) : mine && share.is_troc ? (
            <button onClick={() => onPublish(share)} style={{ ...small, border: 'none', background: '#D9822B', color: 'white' }}>📦 Publier en annonce Troc</button>
          ) : null}
          {mine && (
            <button onClick={() => { if (confirm('Retirer cette photo pour tout le monde ?')) removeShare(share) }} style={{ ...small, padding: 0, border: 'none', background: 'transparent', color: t.textMuted, textAlign: 'left', fontWeight: 700 }}>Retirer la photo</button>
          )}
        </div>
      )}

      {zoom && url && (
        <div onClick={() => setZoom(false)} style={{ position: 'fixed', inset: 0, zIndex: 650, background: 'rgba(0,0,0,0.88)', display: 'grid', placeItems: 'center', padding: 16, cursor: 'zoom-out' }}>
          <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  )
}
