import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import AppLayout from '../components/layout/AppLayout'
import LandingPage from '../components/layout/LandingPage'
import { rememberTrocIntent } from '../lib/troc'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Lien venu de Vibz Troc (?tab=troc&chat=…&troc=…) : gardé le temps de la connexion, puis retiré de l'adresse
  const router = useRouter()
  const [cleanUrl, setCleanUrl] = useState<string | null>(null)
  useEffect(() => {
    if (router.isReady && cleanUrl) { router.replace(cleanUrl, undefined, { shallow: true }); setCleanUrl(null) }
  }, [router.isReady, cleanUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCleanUrl(rememberTrocIntent())   // mémorisé AVANT de lire la session (AppLayout le lit au montage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Syne, sans-serif',
        background: '#f9f8f7'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#D4537E' }}>Vibz</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>Chargement...</div>
        </div>
      </div>
    )
  }

  if (!user) return <LandingPage />
  return <AppLayout user={user} />
}
