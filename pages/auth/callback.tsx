import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'

export default function AuthCallback() {
  const { theme: tk } = useTheme()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Au retour de Google / Discord, Supabase renvoie soit ?code=… (flux PKCE),
    // soit #access_token=… (flux implicite, celui du site). Ne rien effacer de
    // l'adresse avant que la session soit enregistrée.
    const query = new URLSearchParams(window.location.search)
    const hash  = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const refused = query.get('error_description') || hash.get('error_description')
    if (refused) { setError(refused.replace(/\+/g, ' ')); return }

    const code = query.get('code')
    if (!code && !hash.get('access_token')) { router.replace('/'); return }

    const finish = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        // Le client a pu échanger le code tout seul : on vérifie la session avant d'afficher l'erreur
        if (error) {
          const { data } = await supabase.auth.getSession()
          if (!data.session) { setError(error.message); return }
        }
      }
      // getSession() attend que le client ait lu le jeton présent dans l'adresse
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.replace('/')
      else setError('La connexion n’a pas abouti. Réessaie, ou utilise ton e-mail.')
    }
    finish()
  }, [router])

  const font = 'Nunito, sans-serif'

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: font, background: tk.bg2,
        padding: 20,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: tk.pink, marginBottom: 8 }}>
            Échec de la connexion
          </div>
          <div style={{ fontSize: 13, color: tk.textMuted, marginBottom: 24, lineHeight: 1.6 }}>
            {error}
          </div>
          <button
            onClick={() => router.replace('/')}
            style={{
              padding: '12px 28px', borderRadius: 32, border: 'none',
              background: 'linear-gradient(135deg,#D4537E,#F9A8C9)',
              color: 'white', fontFamily: font, fontWeight: 800, fontSize: 14, cursor: 'pointer',
            }}
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: font, background: 'linear-gradient(150deg,#FFD6E8 0%,#FAFFFE 48%,#BDEABD 100%)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔐</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: tk.pink }}>Connexion en cours…</div>
        <div style={{ fontSize: 13, color: tk.textMuted, marginTop: 8 }}>Vérification de votre compte</div>
      </div>
    </div>
  )
}
