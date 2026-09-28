// Suppression définitive du compte, depuis le profil (exigence Google Play).
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'

const WORD = 'SUPPRIMER'

export default function DeleteAccount() {
  const { theme: t } = useTheme()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const confirm = async () => {
    setBusy(true); setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ confirm: WORD }),
      })
      const reply = await res.json().catch(() => ({ status: 'error', message: 'Réponse illisible du serveur.' }))
      if (reply.status !== 'ok') { setError(reply.message); setBusy(false); return }
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch {
      setError('Pas de connexion. Réessaie dans un instant.')
      setBusy(false)
    }
  }

  const f = 'Nunito,sans-serif'
  return (
    <div style={{ marginTop: 28, padding: 16, borderRadius: 18, border: `1px solid ${t.border}`, fontFamily: f }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>Supprimer mon compte</div>
      <div style={{ fontSize: 12, color: t.textMuted, margin: '4px 0 12px', lineHeight: 1.5 }}>
        Ton profil, tes messages, tes likes et ton avatar sont effacés tout de suite et pour de bon.
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)}
          style={{ padding: '10px 18px', borderRadius: 24, border: `1px solid ${t.pink}`, background: 'transparent', color: t.pink, fontSize: 13, fontWeight: 800, fontFamily: f, cursor: 'pointer' }}>
          Supprimer mon compte
        </button>
      ) : (
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 6 }}>
            Tape {WORD} pour confirmer
          </label>
          <input value={typed} onChange={e => setTyped(e.target.value)} autoCapitalize="characters" autoComplete="off"
            style={{ width: '100%', maxWidth: 260, padding: '10px 12px', borderRadius: 12, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text, fontSize: 14, fontFamily: f, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button onClick={confirm} disabled={typed.trim().toUpperCase() !== WORD || busy}
              style={{ padding: '10px 18px', borderRadius: 24, border: 'none', background: t.pink, color: 'white', fontSize: 13, fontWeight: 800, fontFamily: f, cursor: 'pointer', opacity: typed.trim().toUpperCase() !== WORD || busy ? 0.5 : 1 }}>
              {busy ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
            <button onClick={() => { setOpen(false); setTyped(''); setError('') }} disabled={busy}
              style={{ padding: '10px 18px', borderRadius: 24, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: 13, fontWeight: 700, fontFamily: f, cursor: 'pointer' }}>
              Annuler
            </button>
          </div>
          {error && <div style={{ fontSize: 12, color: t.pink, marginTop: 8, fontWeight: 700 }}>{error}</div>}
        </div>
      )}
    </div>
  )
}
