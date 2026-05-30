import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  userId: string
  currentUrl?: string | null
  displayName?: string
  onUpload: (url: string) => void
}

export default function AvatarUpload({ userId, currentUrl, displayName, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = (displayName || '?').slice(0, 2).toUpperCase()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      setError('Image trop lourde (max 3 Mo)')
      return
    }

    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Erreur upload, réessaie')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${data.publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)

    onUpload(url)
    setUploading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: 80, height: 80, borderRadius: '50%', cursor: uploading ? 'wait' : 'pointer',
          background: currentUrl ? 'transparent' : '#FDE8F2',
          border: '2px solid #C4547A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative', flexShrink: 0,
        }}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 26, fontWeight: 800, color: '#C4547A' }}>{initials}</span>
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(0,0,0,0.45)', color: 'white',
          fontSize: 11, textAlign: 'center', padding: '3px 0',
          fontFamily: 'Nunito, sans-serif', fontWeight: 700,
        }}>
          {uploading ? '...' : '📷'}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleFile} />
      {error && <span style={{ fontSize: 11, color: '#ef4444', fontFamily: 'Nunito, sans-serif' }}>{error}</span>}
    </div>
  )
}
