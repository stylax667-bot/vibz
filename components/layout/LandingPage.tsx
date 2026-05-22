import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LandingPage() {
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignup = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })
    if (error) setMessage(error.message)
    else setMessage('✅ Vérifie ton email pour confirmer ton compte !')
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage('Email ou mot de passe incorrect.')
    setLoading(false)
  }

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FBEAF0 0%, #EEEDFE 50%, #E1F5EE 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Syne, sans-serif',
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 40px',
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '0.5px solid rgba(0,0,0,0.06)',
    },
    logo: {
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 24, fontWeight: 800, letterSpacing: -1,
    },
    logoEnv: {
      width: 36, height: 28,
      background: '#D4537E',
      borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: 16,
    },
    hero: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    },
    headline: {
      fontSize: 56,
      fontWeight: 800,
      letterSpacing: -2,
      lineHeight: 1.1,
      marginBottom: 20,
      color: '#1a1a1a',
    },
    sub: {
      fontSize: 18,
      color: '#6b7280',
      maxWidth: 520,
      lineHeight: 1.6,
      marginBottom: 40,
    },
    features: {
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 48,
    },
    feat: {
      background: 'white',
      border: '0.5px solid rgba(0,0,0,0.08)',
      borderRadius: 14,
      padding: '16px 20px',
      textAlign: 'center',
      minWidth: 140,
    },
    featIcon: { fontSize: 28, marginBottom: 8 },
    featLabel: { fontSize: 13, fontWeight: 700, color: '#1a1a1a' },
    featSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
    formCard: {
      background: 'white',
      borderRadius: 20,
      padding: 32,
      width: '100%',
      maxWidth: 400,
      border: '0.5px solid rgba(0,0,0,0.08)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '0.5px solid rgba(0,0,0,0.12)',
      borderRadius: 10,
      fontSize: 14,
      fontFamily: 'Syne, sans-serif',
      outline: 'none',
      marginBottom: 12,
      background: '#f9f8f7',
    },
    btnPrimary: {
      width: '100%',
      padding: '13px',
      background: '#D4537E',
      color: 'white',
      border: 'none',
      borderRadius: 10,
      fontSize: 15,
      fontWeight: 700,
      fontFamily: 'Syne, sans-serif',
      cursor: 'pointer',
      marginTop: 4,
    },
    switchLink: {
      textAlign: 'center' as const,
      marginTop: 16,
      fontSize: 13,
      color: '#6b7280',
    },
    msgBox: {
      marginTop: 12,
      padding: '10px 14px',
      background: '#E1F5EE',
      color: '#085041',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
    }
  }

  if (mode === 'login' || mode === 'signup') {
    return (
      <div style={s.page}>
        <nav style={s.nav}>
          <div style={s.logo}>
            <div style={s.logoEnv}>✉️</div>
            Vib<span style={{ color: '#D4537E' }}>z</span>
          </div>
          <button onClick={() => setMode('landing')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6b7280', fontFamily: 'Syne, sans-serif' }}>
            ← Retour
          </button>
        </nav>
        <div style={s.hero}>
          <div style={s.formCard}>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>
              {mode === 'login' ? '👋 Bon retour !' : '🎉 Rejoindre Vibz'}
            </h2>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
              {mode === 'login' ? 'Connecte-toi à ton compte Vibz' : 'Gratuit, rapide, sans prise de tête'}
            </p>

            {mode === 'signup' && (
              <input
                style={s.input}
                type="text"
                placeholder="Ton pseudo (ex: guitare_hero_42)"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            )}
            <input
              style={s.input}
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              style={s.input}
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            />

            <button
              style={s.btnPrimary}
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading}
            >
              {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>

            {message && <div style={s.msgBox}>{message}</div>}

            <div style={s.switchLink}>
              {mode === 'login' ? (
                <>Pas encore de compte ? <span style={{ color: '#D4537E', cursor: 'pointer', fontWeight: 700 }} onClick={() => setMode('signup')}>S&apos;inscrire</span></>
              ) : (
                <>Déjà inscrit ? <span style={{ color: '#D4537E', cursor: 'pointer', fontWeight: 700 }} onClick={() => setMode('login')}>Se connecter</span></>
              )}
            </div>

            {mode === 'signup' && (
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
                En créant un compte tu acceptes notre charte de respect et notre politique de confidentialité. Tes données sont sécurisées et ne sont jamais vendues.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={s.logoEnv}>✉️</div>
          Vib<span style={{ color: '#D4537E' }}>z</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setMode('login')} style={{ ...s.btnPrimary, width: 'auto', padding: '9px 20px', fontSize: 13, background: 'transparent', color: '#1a1a1a', border: '0.5px solid rgba(0,0,0,0.12)' }}>
            Se connecter
          </button>
          <button onClick={() => setMode('signup')} style={{ ...s.btnPrimary, width: 'auto', padding: '9px 20px', fontSize: 13 }}>
            S&apos;inscrire — gratuit
          </button>
        </div>
      </nav>

      <div style={s.hero}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>✉️</div>
        <h1 style={s.headline}>
          La rencontre qui<br />
          <span style={{ color: '#D4537E' }}>vibre</span> vraiment
        </h1>
        <p style={s.sub}>
          Amoureuse ou musicale — Vibz connecte des gens qui se ressemblent, sans frontières géographiques, avec la nostalgie de MSN et l&apos;énergie de Caramail.
        </p>

        <div style={s.features}>
          {[
            { icon: '💬', label: 'Messagerie MSN', sub: 'Wizz & émoticônes' },
            { icon: '🎸', label: 'Salons Caramail', sub: 'Par instrument & style' },
            { icon: '❤️', label: 'Rencontres', sub: 'Amour & collabs' },
            { icon: '🛡️', label: 'IA Guard', sub: 'Anti-harcèlement' },
            { icon: '🌍', label: 'International', sub: 'Sans frontières' },
            { icon: '🆓', label: '100% gratuit', sub: 'Pour toujours' },
          ].map(f => (
            <div key={f.label} style={s.feat}>
              <div style={s.featIcon}>{f.icon}</div>
              <div style={s.featLabel}>{f.label}</div>
              <div style={s.featSub}>{f.sub}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setMode('signup')} style={{ ...s.btnPrimary, width: 'auto', padding: '16px 48px', fontSize: 18, borderRadius: 16 }}>
          Rejoindre Vibz gratuitement →
        </button>
        <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
          Aucune carte bancaire · Gratuit pour toujours · Sécurisé par IA
        </p>
      </div>
    </div>
  )
}
