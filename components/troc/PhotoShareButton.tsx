import { useRef, useState } from 'react'
import { useTheme } from '../../lib/theme'
import { sharePhoto, type PhotoShare } from '../../lib/troc'

// Bouton 📸 des tchats et salons : photo prise sur le vif (le navigateur demande l'accès
// à l'appareil photo) ou depuis la galerie. Le destinataire devra accepter de la voir.
export default function PhotoShareButton({ userId, where, onSent, onError, recipientLabel }: {
  userId: string
  where: { conversation_id?: string; salon_id?: string } | (() => Promise<{ conversation_id?: string; salon_id?: string } | null>)
  onSent: (s: PhotoShare) => void
  onError: (msg: string) => void
  recipientLabel: string
}) {
  const { theme: t } = useTheme()
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [isTroc, setIsTroc] = useState(false)
  const [busy, setBusy] = useState(false)
  const f = 'Nunito, sans-serif'

  const pick = (fl: FileList | null) => {
    const x = fl?.[0]
    if (!x) return
    if (!x.type.startsWith('image/')) { onError('Ce fichier n’est pas une image.'); return }
    if (preview) URL.revokeObjectURL(preview)
    setFile(x); setPreview(URL.createObjectURL(x)); setOpen(true)
  }
  const close = () => { if (preview) URL.revokeObjectURL(preview); setOpen(false); setFile(null); setPreview(null); setCaption(''); setIsTroc(false) }

  const send = async () => {
    if (!file) return
    setBusy(true)
    try {
      const w = typeof where === 'function' ? await where() : where
      if (!w) throw new Error('Impossible de démarrer la conversation.')
      onSent(await sharePhoto(userId, file, w, caption, isTroc))
      close()
    } catch (e) { onError((e as Error).message) }
    setBusy(false)
  }

  const btn: React.CSSProperties = { width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${t.border}`, background: 'transparent', fontSize: 18, cursor: 'pointer', flexShrink: 0 }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Partager une photo" title="Partager une photo (matos, troc…)" style={btn}>📸</button>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { pick(e.target.files); e.target.value = '' }} />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={e => { pick(e.target.files); e.target.value = '' }} />

      {open && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 600, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: f }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.surface, color: t.text, borderRadius: 22, padding: 20, width: '100%', maxWidth: 400, border: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>📸 Partager une photo</div>
            <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.55, marginBottom: 14 }}>
              {recipientLabel} verra d’abord « tu veux lui montrer une photo » et choisira de l’afficher ou non. La photo reste privée.
            </div>

            {preview ? (
              <img src={preview} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 14, background: t.bg2, marginBottom: 12 }} />
            ) : (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => camRef.current?.click()} style={{ flex: 1, padding: '18px 8px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#E07A9A,#6BB8E8)', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: f }}>📷 Prendre une photo</button>
                <button onClick={() => galRef.current?.click()} style={{ flex: 1, padding: '18px 8px', borderRadius: 14, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: f }}>🖼️ Galerie</button>
              </div>
            )}

            {preview && (
              <>
                <input value={caption} onChange={e => setCaption(e.target.value)} maxLength={200} placeholder="Légende (facultatif)"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: t.inputBg, color: t.text, fontFamily: f, fontSize: 14, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.45, padding: 10, borderRadius: 12, background: isTroc ? '#FCEBD7' : t.bg2, color: isTroc ? '#A35A12' : t.textSub, cursor: 'pointer', marginBottom: 14 }}>
                  <input type="checkbox" checked={isTroc} onChange={e => setIsTroc(e.target.checked)} style={{ marginTop: 2, accentColor: '#D9822B' }} />
                  <span><strong>🔁 C’est du matos à troquer, donner ou vendre.</strong> Tu pourras ensuite publier cette photo en annonce sur Vibz Troc (toi seul peux le faire).</span>
                </label>
              </>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={close} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1.5px solid ${t.border}`, background: 'transparent', color: t.textMuted, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: f }}>Annuler</button>
              {preview && (
                <button disabled={busy} onClick={send} style={{ flex: 1, padding: 11, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#E07A9A,#6BB8E8)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: f, opacity: busy ? 0.6 : 1 }}>
                  {busy ? 'Envoi…' : 'Proposer la photo'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
