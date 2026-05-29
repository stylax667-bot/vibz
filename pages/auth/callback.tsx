import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')

    if (!code) {
      router.replace('/')
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError(error.message)
      } else {
        router.replace('/')
      }
    })
  }, [router])

  const font = 'Nunito, sans-serif'

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: font, background: 'linear-gradient(150deg,#FFD6E8 0%,#FAFFFE 48%,#BDEABD 100%)',
        padding: 20,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#D4537E', marginBottom: 8 }}>
            Échec de la connexion
          </div>
          <div style={{ fontSize: 13, color: '#9B7A8A', marginBottom: 24, lineHeight: 1.6 }}>
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
        <div style={{ fontSize: 18, fontWeight: 800, color: '#D4537E' }}>Connexion en cours…</div>
        <div style={{ fontSize: 13, color: '#9B7A8A', marginTop: 8 }}>Vérification de votre compte</div>
      </div>
    </div>
  )
}
