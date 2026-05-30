import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  userId: string
  email: string
  notifMatch: boolean
  notifMessage: boolean
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(196,84,122,0.08)' }}>
      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Nunito, sans-serif' }}>{label}</span>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 42, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s',
          background: value ? '#1D9E75' : '#d1d5db', position: 'relative', flexShrink: 0,
        }}
      >
        <div style={{
          width: 18, height: 18, background: 'white', borderRadius: '50%',
          position: 'absolute', top: 3,
          left: value ? 21 : 3, transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </div>
    </div>
  )
}

export default function NotificationSettings({ userId, email, notifMatch: initMatch, notifMessage: initMessage }: Props) {
  const [match, setMatch] = useState(initMatch)
  const [message, setMessage] = useState(initMessage)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await supabase.from('profiles').update({
      notif_new_match: match,
      notif_new_message: message,
      notif_email: email,
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9B7A8A', marginBottom: 4, display: 'block' }}>
        📧 Notifications email
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, fontFamily: 'Nunito, sans-serif' }}>
        Envoyées à <strong>{email}</strong>
      </p>
      <Toggle value={match} onChange={setMatch} label="🎉 Nouveau match" />
      <Toggle value={message} onChange={setMessage} label="💬 Nouveau message reçu" />
      <button
        onClick={save}
        style={{
          marginTop: 14, width: '100%', padding: '10px', borderRadius: 12,
          background: saved ? '#1D9E75' : 'linear-gradient(135deg,#C4547A,#F9A8C9)',
          color: 'white', border: 'none', fontWeight: 800, fontSize: 13,
          cursor: 'pointer', fontFamily: 'Nunito, sans-serif', transition: 'background 0.2s',
          boxShadow: saved ? '0 4px 12px rgba(29,158,117,0.3)' : '0 4px 12px rgba(196,84,122,0.25)',
        }}
      >
        {saving ? 'Sauvegarde...' : saved ? '✅ Préférences sauvegardées' : 'Enregistrer les préférences'}
      </button>
    </div>
  )
}
