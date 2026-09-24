import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import Avatar from './Avatar'
import {
  AVATAR_ACCEPTED_TYPES, AVATAR_MAX_FILE_MB, AVATAR_MIN_SIDE, AVATAR_MAX_SIDE,
  AVATAR_OUTPUT_SIDE, AVATAR_MAX_UPLOAD_KB, AVATAR_LOCK_MONTHS,
  type AvatarFields, AVATAR_EVENT, isAvatarLocked, formatBytes, formatLockDate,
} from '../../lib/avatar'

interface Props {
  profile: AvatarFields & { display_name?: string }
  onChange: (fields: Partial<AvatarFields>) => void
  size?: number
}

type Picked = { src: string; w: number; h: number; bytes: number; type: string }
type Notice = { tone: 'ok' | 'error' | 'info'; text: string } | null

const VIEW = 240   // côté de la zone de recadrage, en px
const font = 'Nunito, sans-serif'
const TYPE_LABEL: Record<string, string> = { 'image/jpeg': 'JPEG', 'image/png': 'PNG', 'image/webp': 'WebP', 'image/gif': 'GIF' }

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default function AvatarUpload({ profile, onChange, size = 96 }: Props) {
  const { theme: tk } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<Picked | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [busy, setBusy] = useState(false)
  const [lockInfo, setLockInfo] = useState<{ emoji: string; until: string; fresh: boolean } | null>(null)

  // Cadrage : zoom (1 = l'image couvre juste le carré) et position du coin haut-gauche
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)

  const locked = isAvatarLocked(profile)
  const scale = picked ? (VIEW / Math.min(picked.w, picked.h)) * zoom : 1

  const clamp = useCallback((x: number, y: number, s: number, p: Picked) => ({
    x: Math.min(0, Math.max(VIEW - p.w * s, x)),
    y: Math.min(0, Math.max(VIEW - p.h * s, y)),
  }), [])

  useEffect(() => () => { if (picked) URL.revokeObjectURL(picked.src) }, [picked])

  const openPicker = () => {
    if (busy) return
    if (locked) {
      setLockInfo({ emoji: profile.avatar_emoji || '🎵', until: profile.avatar_locked_until!, fresh: false })
      return
    }
    inputRef.current?.click()
  }

  // ── 1. Vérification du fichier choisi ──
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setNotice(null)

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      setNotice({ tone: 'error', text: `Format non accepté${file.type ? ` (${file.type.replace('image/', '').toUpperCase()})` : ''}. Utilise une image JPEG, PNG, WebP ou GIF.` })
      return
    }
    if (file.size > AVATAR_MAX_FILE_MB * 1024 * 1024) {
      setNotice({ tone: 'error', text: `Image trop lourde : ${formatBytes(file.size)}. Le maximum est ${AVATAR_MAX_FILE_MB} Mo.` })
      return
    }
    const src = URL.createObjectURL(file)
    let img: HTMLImageElement
    try {
      img = await loadImage(src)
    } catch {
      URL.revokeObjectURL(src)
      setNotice({ tone: 'error', text: 'Cette image est illisible. Essaie avec une autre.' })
      return
    }
    const w = img.naturalWidth, h = img.naturalHeight
    if (w < AVATAR_MIN_SIDE || h < AVATAR_MIN_SIDE) {
      URL.revokeObjectURL(src)
      setNotice({ tone: 'error', text: `Image trop petite : ${w} × ${h} px. Il faut au moins ${AVATAR_MIN_SIDE} × ${AVATAR_MIN_SIDE} px pour un avatar net.` })
      return
    }
    if (w > AVATAR_MAX_SIDE || h > AVATAR_MAX_SIDE) {
      URL.revokeObjectURL(src)
      setNotice({ tone: 'error', text: `Image trop grande : ${w} × ${h} px. Le maximum est ${AVATAR_MAX_SIDE} px de côté.` })
      return
    }

    const p = { src, w, h, bytes: file.size, type: file.type }
    const s = VIEW / Math.min(w, h)
    setZoom(1)
    setPos({ x: (VIEW - w * s) / 2, y: (VIEW - h * s) / 2 })
    setPicked(p)
  }

  // ── 2. Recadrage ──
  const setZoomCentered = (z: number) => {
    if (!picked) return
    const s0 = VIEW / Math.min(picked.w, picked.h)
    const cx = (VIEW / 2 - pos.x) / scale, cy = (VIEW / 2 - pos.y) / scale
    const s = s0 * z
    setZoom(z)
    setPos(clamp(VIEW / 2 - cx * s, VIEW / 2 - cy * s, s, picked))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !picked) return
    const d = drag.current
    setPos(clamp(d.x + e.clientX - d.px, d.y + e.clientY - d.py, scale, picked))
  }
  const onPointerUp = () => { drag.current = null }
  const onWheel = (e: React.WheelEvent) => {
    setZoomCentered(Math.min(4, Math.max(1, zoom - e.deltaY * 0.002)))
  }

  // Met à jour la page Profil et prévient le reste de l'app (barre du haut)
  const publish = (fields: Partial<AvatarFields>) => {
    onChange(fields)
    window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: fields }))
  }

  const closeEditor = () => { setPicked(null); setBusy(false) }

  // ── 3. Export en carré + envoi pour vérification ──
  const confirm = async () => {
    if (!picked) return
    setBusy(true)
    setNotice({ tone: 'info', text: 'Vérification de l\'image…' })
    try {
      const img = await loadImage(picked.src)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = AVATAR_OUTPUT_SIDE
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'   // fond blanc pour les PNG transparents
      ctx.fillRect(0, 0, AVATAR_OUTPUT_SIDE, AVATAR_OUTPUT_SIDE)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, -pos.x / scale, -pos.y / scale, VIEW / scale, VIEW / scale, 0, 0, AVATAR_OUTPUT_SIDE, AVATAR_OUTPUT_SIDE)

      let blob: Blob | null = null
      for (const q of [0.9, 0.8, 0.65, 0.5]) {
        blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', q))
        if (blob && blob.size <= AVATAR_MAX_UPLOAD_KB * 1024) break
      }
      if (!blob || blob.size > AVATAR_MAX_UPLOAD_KB * 1024) throw new Error('export')

      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg', Authorization: `Bearer ${session?.access_token || ''}` },
        body: blob,
      })
      const out = await res.json().catch(() => ({ status: 'error', message: 'Réponse inattendue du serveur.' }))

      if (out.status === 'ok') {
        publish({ avatar_url: out.url, avatar_emoji: null })
        setNotice({ tone: 'ok', text: '✅ Avatar valide et enregistré : il est déjà visible par les autres membres. Tu peux en changer quand tu veux.' })
        closeEditor()
      } else if (out.status === 'locked') {
        publish({ avatar_url: null, avatar_emoji: out.emoji, avatar_locked_until: out.locked_until })
        setLockInfo({ emoji: out.emoji, until: out.locked_until, fresh: out.just_locked })
        setNotice(null)
        closeEditor()
      } else {
        setNotice({ tone: 'error', text: out.message || 'L\'envoi a échoué, réessaie.' })
        setBusy(false)
      }
    } catch {
      setNotice({ tone: 'error', text: 'Impossible de préparer cette image. Essaie avec une autre.' })
      setBusy(false)
    }
  }

  const noticeColor = notice?.tone === 'ok' ? tk.greenDark : notice?.tone === 'error' ? '#ef4444' : tk.textSub
  const btn = (primary: boolean): React.CSSProperties => ({
    padding: '10px 18px', borderRadius: 12, fontFamily: font, fontWeight: 800, fontSize: 14, cursor: busy ? 'wait' : 'pointer',
    border: primary ? 'none' : `1.5px solid ${tk.border}`,
    background: primary ? tk.pink : 'transparent', color: primary ? 'white' : tk.text,
    opacity: busy && !primary ? 0.5 : 1,
  })
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 1000, background: tk.overlay,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: font,
  }
  const card: React.CSSProperties = {
    background: tk.surface, color: tk.text, borderRadius: 20, border: `1px solid ${tk.border}`,
    boxShadow: `0 12px 40px ${tk.shadow}`, width: '100%', maxWidth: 400, maxHeight: '100%', overflowY: 'auto', padding: 20,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: Math.max(size, 180) }}>
      <div style={{ position: 'relative' }}>
        <Avatar p={profile} size={size} ring={tk.pink} onClick={openPicker}
          title={locked ? 'Avatar fixé temporairement' : 'Changer mon avatar'} />
        <button onClick={openPicker} aria-label={locked ? 'Avatar fixé' : 'Changer mon avatar'}
          style={{
            position: 'absolute', right: -6, bottom: -6, width: 30, height: 30, borderRadius: 10,
            border: `2px solid ${tk.surface}`, background: locked ? tk.textMuted : tk.pink, color: 'white',
            fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>{locked ? '🔒' : '📷'}</button>
      </div>
      <input ref={inputRef} type="file" accept={AVATAR_ACCEPTED_TYPES.join(',')} style={{ display: 'none' }} onChange={handleFile} />
      {!picked && notice && (
        <span role="status" style={{ fontSize: 12, lineHeight: 1.4, color: noticeColor, fontFamily: font, textAlign: 'center' }}>{notice.text}</span>
      )}

      {/* ── Éditeur de recadrage ── */}
      {picked && (
        <div style={overlay} onClick={() => !busy && closeEditor()}>
          <div style={card} onClick={e => e.stopPropagation()} role="dialog" aria-label="Recadrer mon avatar">
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Recadre ton avatar</div>
            <div style={{ fontSize: 13, color: tk.textSub, marginBottom: 14 }}>Fais glisser l'image et règle le zoom pour choisir la partie visible.</div>

            <div style={{ fontSize: 12.5, lineHeight: 1.45, color: tk.greenDark, background: tk.greenLight, borderRadius: 12, padding: '9px 12px', marginBottom: 14 }}>
              ✅ Image valide : {picked.w} × {picked.h} px, {formatBytes(picked.bytes)}, {TYPE_LABEL[picked.type]}.
              Elle sera enregistrée en carré de {AVATAR_OUTPUT_SIDE} × {AVATAR_OUTPUT_SIDE} px.
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
                onWheel={onWheel}
                style={{
                  width: VIEW, height: VIEW, position: 'relative', overflow: 'hidden', borderRadius: 16,
                  cursor: 'grab', touchAction: 'none', userSelect: 'none', background: tk.bg2,
                  outline: `2px solid ${tk.pink}`, outlineOffset: 2,
                }}>
                <img src={picked.src} alt="" draggable={false} style={{
                  position: 'absolute', left: pos.x, top: pos.y,
                  width: picked.w * scale, height: picked.h * scale, maxWidth: 'none', pointerEvents: 'none',
                }} />
              </div>
              {/* Aperçus aux tailles réelles du site */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                {[56, 36].map(s => (
                  <div key={s} style={{ width: s, height: s, borderRadius: Math.round(s * 0.18), overflow: 'hidden', position: 'relative', border: `1.5px solid ${tk.border}` }}>
                    <img src={picked.src} alt="" draggable={false} style={{
                      position: 'absolute', left: pos.x * s / VIEW, top: pos.y * s / VIEW,
                      width: picked.w * scale * s / VIEW, height: picked.h * scale * s / VIEW, maxWidth: 'none',
                    }} />
                  </div>
                ))}
                <span style={{ fontSize: 11, color: tk.textMuted }}>Aperçu</span>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, fontSize: 13, fontWeight: 700, color: tk.textSub }}>
              <span aria-hidden>➖</span>
              <input type="range" min={1} max={4} step={0.01} value={zoom} aria-label="Zoom"
                onChange={e => setZoomCentered(Number(e.target.value))} style={{ flex: 1, accentColor: tk.pink }} />
              <span aria-hidden>➕</span>
            </label>

            {notice && (
              <div role="status" style={{ fontSize: 13, color: noticeColor, marginTop: 12, lineHeight: 1.4 }}>{notice.text}</div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, flexWrap: 'wrap' }}>
              <button onClick={closeEditor} disabled={busy} style={btn(false)}>Annuler</button>
              <button onClick={confirm} disabled={busy} style={btn(true)}>{busy ? 'Vérification…' : 'Utiliser cette image'}</button>
            </div>
            <div style={{ fontSize: 11, color: tk.textMuted, marginTop: 12, lineHeight: 1.4 }}>
              Les images à caractère sexuel sont interdites : elles fixent l'avatar sur un instrument pendant {AVATAR_LOCK_MONTHS} mois.
            </div>
          </div>
        </div>
      )}

      {/* ── Avatar fixé (image explicite) ── */}
      {lockInfo && (
        <div style={overlay} onClick={() => setLockInfo(null)}>
          <div style={{ ...card, textAlign: 'center' }} onClick={e => e.stopPropagation()} role="alertdialog" aria-label="Avatar fixé">
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>{lockInfo.emoji}</div>
            {lockInfo.fresh ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Cette image ne peut pas être ton avatar</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: tk.textSub, margin: '0 0 10px' }}>
                  Notre vérification l'a reconnue comme une image à caractère sexuel explicite.
                  Vibz est un lieu de rencontre bienveillant et ce type de contenu n'y a pas sa place.
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: tk.textSub, margin: '0 0 10px' }}>
                  Ton avatar est donc fixé sur <strong style={{ color: tk.text }}>{lockInfo.emoji}</strong>, l'instrument de ton parcours,
                  jusqu'au <strong style={{ color: tk.text }}>{formatLockDate(lockInfo.until)}</strong>. Tu ne pourras pas le changer d'ici là.
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: tk.textMuted, margin: 0 }}>
                  On compte sur toi pour que Vibz reste agréable pour tout le monde. Merci 🎶
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Ton avatar est fixé</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: tk.textSub, margin: 0 }}>
                  Suite à l'envoi d'une image à caractère sexuel, ton avatar reste sur {lockInfo.emoji} jusqu'au{' '}
                  <strong style={{ color: tk.text }}>{formatLockDate(lockInfo.until)}</strong>. Tu pourras de nouveau choisir une image après cette date.
                </p>
              </>
            )}
            <button onClick={() => setLockInfo(null)} style={{ ...btn(true), marginTop: 18 }}>J'ai compris</button>
          </div>
        </div>
      )}
    </div>
  )
}
