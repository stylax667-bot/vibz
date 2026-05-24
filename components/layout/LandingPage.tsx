import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function LandingPage() {
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')
  const [isError, setIsError]   = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showCharter, setShowCharter]     = useState(false)
  const [showPass, setShowPass] = useState(false)

  // ── Validation ──────────────────────────────────────────────────────────
  const usernameOk   = /^[a-zA-Z0-9_]{3,20}$/.test(username)
  const passwordStrength = (() => {
    if (password.length === 0) return 0
    let score = 0
    if (password.length >= 8)  score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    return score
  })()
  const strengthLabel  = ['','Faible','Moyen','Bon','Fort'][passwordStrength]
  const strengthColor  = ['','#E07A7A','#E8A06A','#A78BDB','#3BAD7A'][passwordStrength]
  const canSignup = usernameOk && email.includes('@') && password.length >= 8 && acceptedTerms

  // ── Auth handlers ────────────────────────────────────────────────────────
  const handleSignup = async () => {
    setLoading(true); setMessage(''); setIsError(false)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })
    if (error) { setMessage(error.message); setIsError(true) }
    else setMessage('✅ Vérifie ton email pour confirmer ton compte !')
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true); setMessage(''); setIsError(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage('Email ou mot de passe incorrect.'); setIsError(true) }
    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'discord') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' }
    })
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const font = 'Nunito, sans-serif'
  const pink = '#C4547A'
  const green = '#3BAD7A'

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FDE8F2 0%, #EDE8F8 50%, #D6F5E6 100%)',
      display: 'flex', flexDirection: 'column', fontFamily: font,
    },
    nav: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 40px',
      background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(196,84,122,0.1)',
    },
    logo: { display:'flex', alignItems:'center', gap:10, fontSize:24, fontWeight:800, letterSpacing:-1 },
    logoBox: { width:36, height:28, background:pink, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:16 },
    hero: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center' },
    formCard: {
      background:'white', borderRadius:28, padding:32, width:'100%', maxWidth:420,
      border:'1px solid rgba(196,84,122,0.12)',
      boxShadow:'0 24px 64px rgba(196,84,122,0.12)',
    },
    input: {
      width:'100%', padding:'12px 16px',
      border:'1px solid rgba(196,84,122,0.15)', borderRadius:12,
      fontSize:14, fontFamily:font, outline:'none',
      marginBottom:12, background:'#FFF5F8', color:'#2D1A25', boxSizing:'border-box',
    },
    btnPrimary: {
      width:'100%', padding:'13px',
      background:`linear-gradient(135deg,${pink},#F9A8C9)`,
      color:'white', border:'none', borderRadius:32,
      fontSize:15, fontWeight:800, fontFamily:font, cursor:'pointer',
      boxShadow:'0 4px 16px rgba(196,84,122,0.3)', transition:'opacity 0.15s',
    },
    btnDisabled: {
      width:'100%', padding:'13px',
      background:'#F0E8EC', color:'#C4A0AE',
      border:'none', borderRadius:32, fontSize:15, fontWeight:800, fontFamily:font, cursor:'not-allowed',
    },
    btnOAuth: {
      width:'100%', padding:'11px 16px', borderRadius:32, border:'1px solid rgba(0,0,0,0.1)',
      background:'white', fontFamily:font, fontSize:14, fontWeight:700,
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      transition:'background 0.1s',
    },
    divider: {
      display:'flex', alignItems:'center', gap:12, margin:'16px 0',
      color:'#9B7A8A', fontSize:12, fontWeight:700,
    },
    switchLink: { textAlign:'center' as const, marginTop:14, fontSize:13, color:'#9B7A8A' },
    msgBox: (err: boolean): React.CSSProperties => ({
      marginTop:12, padding:'10px 14px', borderRadius:12, fontSize:13, fontWeight:700,
      background: err ? '#FDE8F2' : '#D6F5E6',
      color: err ? '#7A1F40' : '#1A6645',
    }),
  }

  // ── Charte modal ────────────────────────────────────────────────────────
  const CharterModal = () => (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(45,26,37,0.6)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={() => setShowCharter(false)}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'white', borderRadius:28, maxWidth:600, width:'100%',
        maxHeight:'85vh', display:'flex', flexDirection:'column',
        border:'1px solid rgba(196,84,122,0.15)',
        boxShadow:'0 32px 80px rgba(196,84,122,0.2)',
      }}>
        {/* Header modal */}
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'#2D1A25' }}>Charte Vibz</div>
              <div style={{ fontSize:12, color:'#9B7A8A', marginTop:2 }}>Conditions générales & politique de confidentialité</div>
            </div>
            <button onClick={() => setShowCharter(false)} style={{
              width:32, height:32, borderRadius:10, border:'1px solid rgba(196,84,122,0.15)',
              background:'#FFF5F8', color:'#9B7A8A', cursor:'pointer', fontSize:16,
              display:'flex', alignItems:'center', justifyContent:'center', fontFamily:font,
            }}>×</button>
          </div>
        </div>

        {/* Corps scrollable */}
        <div style={{ overflowY:'auto', padding:'20px 28px', fontSize:13, lineHeight:1.7, color:'#2D1A25', flex:1 }}>
          <Section title="🤝 1. Respect mutuel">
            Vibz est un espace bienveillant. Tout membre s&apos;engage à traiter les autres avec respect, sans discrimination de genre, d&apos;origine, d&apos;orientation ou de pratique musicale. Le harcèlement, les insultes et les comportements intimidants sont strictement interdits et entraînent une exclusion immédiate.
          </Section>
          <Section title="🚫 2. Contenus interdits">
            Il est interdit de publier ou partager : contenus sexuels explicites, images non consenties, incitations à la haine, spam commercial, liens malveillants, coordonnées personnelles de tiers sans leur accord. L&apos;IA Guard surveille les échanges en temps réel.
          </Section>
          <Section title="🔒 3. Vos données personnelles">
            Vos données sont hébergées en Europe, chiffrées et ne sont <strong>jamais vendues</strong> à des tiers. Nous collectons uniquement ce qui est nécessaire au fonctionnement du service : pseudo, email (jamais affiché publiquement), et les informations de profil que vous choisissez de partager. Vos coordonnées (email public, réseaux sociaux) ne sont visibles que si vous l&apos;activez explicitement dans vos paramètres de confidentialité.
          </Section>
          <Section title="👁️ 4. Maîtrise de votre visibilité">
            Vous choisissez ce que les autres voient de vous. Vous pouvez à tout moment activer le <em>mode caché</em>, masquer individuellement chaque réseau social, votre ville, et limiter qui peut vous contacter (tout le monde / vos matchs / personne). Ces réglages sont modifiables à tout moment depuis votre profil.
          </Section>
          <Section title="✉️ 5. Confirmation d'email">
            Pour accéder à l&apos;app, vous devez confirmer votre adresse email via le lien envoyé à l&apos;inscription. Cela garantit l&apos;authenticité des comptes et protège la communauté. La connexion via Google ou Discord dispense de cette étape.
          </Section>
          <Section title="🗑️ 6. Droit à l'oubli">
            Vous pouvez supprimer définitivement votre compte et toutes vos données depuis les paramètres de votre profil. La suppression est immédiate et irréversible. Nous ne conservons aucune donnée au-delà de ce délai légal minimal.
          </Section>
          <Section title="🛡️ 7. Modération IA">
            Notre système d&apos;IA Guard analyse les messages pour détecter les comportements toxiques et protéger les membres. Les messages signalés ou détectés comme problématiques sont examinés par notre équipe. Aucune analyse n&apos;est utilisée à des fins publicitaires.
          </Section>
          <Section title="🔄 8. Modifications">
            Vibz se réserve le droit de modifier ces conditions. En cas de changement important, vous serez notifié par email et devrez accepter les nouvelles conditions pour continuer à utiliser le service.
          </Section>
          <div style={{ marginTop:16, padding:'12px 16px', background:'#FFF5F8', borderRadius:14, fontSize:12, color:'#9B7A8A', fontWeight:600 }}>
            En vous inscrivant, vous certifiez avoir plus de 16 ans et acceptez l&apos;intégralité de cette charte. Pour toute question : contact@vibz.app
          </div>
        </div>

        {/* Footer modal */}
        <div style={{ padding:'16px 28px', borderTop:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <button onClick={() => { setAcceptedTerms(true); setShowCharter(false) }} style={{
            ...s.btnPrimary, marginBottom:0,
          }}>
            J&apos;ai lu et j&apos;accepte la charte ✓
          </button>
        </div>
      </div>
    </div>
  )

  // ── Form (login / signup) ────────────────────────────────────────────────
  if (mode === 'login' || mode === 'signup') {
    return (
      <div style={s.page}>
        {showCharter && <CharterModal />}
        <nav style={s.nav}>
          <div style={s.logo}>
            <div style={s.logoBox}>✉️</div>
            Vib<span style={{ color:pink }}>z</span>
          </div>
          <button onClick={() => setMode('landing')} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:13, color:'#9B7A8A', fontFamily:font, fontWeight:700 }}>
            ← Retour
          </button>
        </nav>

        <div style={s.hero}>
          <div style={s.formCard}>
            <h2 style={{ fontSize:22, fontWeight:800, marginBottom:6, letterSpacing:-0.5, color:'#2D1A25' }}>
              {mode === 'login' ? '👋 Bon retour !' : '🎉 Rejoindre Vibz'}
            </h2>
            <p style={{ fontSize:13, color:'#9B7A8A', marginBottom:20 }}>
              {mode === 'login' ? 'Connecte-toi à ton compte Vibz' : 'Gratuit · Simple · Sécurisé'}
            </p>

            {/* Boutons OAuth */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:4 }}>
              <button style={s.btnOAuth} onClick={() => handleOAuth('google')}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continuer avec Google
              </button>
              <button style={{ ...s.btnOAuth, background:'#5865F2', color:'white', border:'none' }} onClick={() => handleOAuth('discord')}>
                <svg width="18" height="14" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.3 37.3 0 0 0 25.5.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.7 4.9a.2.2 0 0 0-.1.1C1.5 18.5-1 31.7.3 44.8a.2.2 0 0 0 .1.1 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4c.4-.3.7-.5 1.1-.8a.2.2 0 0 1 .2 0c11.6 5.3 24.1 5.3 35.5 0a.2.2 0 0 1 .2 0c.4.3.7.5 1.1.8a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.1c1.5-15.4-2.5-28.6-10.6-40a.2.2 0 0 0-.1-.1zM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2z"/></svg>
                Continuer avec Discord
              </button>
            </div>

            <div style={s.divider}>
              <div style={{ flex:1, height:1, background:'rgba(196,84,122,0.12)' }}/>
              ou
              <div style={{ flex:1, height:1, background:'rgba(196,84,122,0.12)' }}/>
            </div>

            {/* Champs formulaire */}
            {mode === 'signup' && (
              <div style={{ position:'relative', marginBottom:4 }}>
                <input
                  style={{ ...s.input, marginBottom:4, borderColor: username && !usernameOk ? '#E07A7A' : undefined }}
                  type="text" placeholder="Ton pseudo (ex: guitar_hero_42)"
                  value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                />
                {username && (
                  <div style={{ fontSize:11, fontWeight:700, marginBottom:8, color: usernameOk ? green : '#E07A7A' }}>
                    {usernameOk ? '✓ Pseudo disponible' : '✗ 3–20 caractères, lettres/chiffres/_ uniquement'}
                  </div>
                )}
              </div>
            )}

            <input style={s.input} type="email" placeholder="Email"
              value={email} onChange={e => setEmail(e.target.value)} />

            <div style={{ position:'relative', marginBottom:12 }}>
              <input
                style={{ ...s.input, marginBottom:0, paddingRight:48 }}
                type={showPass ? 'text' : 'password'}
                placeholder="Mot de passe (8 caractères min.)"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : canSignup && handleSignup())}
              />
              <button onClick={() => setShowPass(v => !v)} style={{
                position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none', cursor:'pointer', color:'#9B7A8A', fontSize:16, padding:0,
              }}>{showPass ? '🙈' : '👁️'}</button>
            </div>

            {/* Indicateur de force mot de passe */}
            {mode === 'signup' && password.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:4, borderRadius:4, background: i <= passwordStrength ? strengthColor : '#F0E8EC', transition:'background 0.2s' }}/>
                  ))}
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:strengthColor }}>{strengthLabel}</div>
              </div>
            )}

            {/* Checkbox conditions */}
            {mode === 'signup' && (
              <label style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:16, cursor:'pointer' }}>
                <div
                  onClick={() => setAcceptedTerms(v => !v)}
                  style={{
                    width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
                    border: `2px solid ${acceptedTerms ? pink : 'rgba(196,84,122,0.3)'}`,
                    background: acceptedTerms ? pink : 'white',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all 0.15s', cursor:'pointer',
                  }}
                >
                  {acceptedTerms && <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize:12, color:'#9B7A8A', lineHeight:1.5 }}>
                  J&apos;accepte les{' '}
                  <span
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setShowCharter(true) }}
                    style={{ color:pink, fontWeight:800, textDecoration:'underline', cursor:'pointer' }}
                  >
                    conditions générales & la charte Vibz
                  </span>
                  {' '}(lecture recommandée avant d&apos;accepter)
                </span>
              </label>
            )}

            <button
              style={mode === 'signup' ? (canSignup ? s.btnPrimary : s.btnDisabled) : s.btnPrimary}
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading || (mode === 'signup' && !canSignup)}
            >
              {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>

            {message && <div style={s.msgBox(isError)}>{message}</div>}

            <div style={s.switchLink}>
              {mode === 'login' ? (
                <>Pas encore de compte ?{' '}
                  <span style={{ color:pink, cursor:'pointer', fontWeight:800 }} onClick={() => { setMode('signup'); setMessage('') }}>S&apos;inscrire</span>
                </>
              ) : (
                <>Déjà inscrit ?{' '}
                  <span style={{ color:pink, cursor:'pointer', fontWeight:800 }} onClick={() => { setMode('login'); setMessage('') }}>Se connecter</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Landing page ─────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={s.logo}>
          <div style={s.logoBox}>✉️</div>
          Vib<span style={{ color:pink }}>z</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setMode('login')} style={{ ...s.btnPrimary, width:'auto', padding:'9px 20px', fontSize:13, background:'white', color:'#2D1A25', border:'1px solid rgba(196,84,122,0.2)', boxShadow:'none' }}>
            Se connecter
          </button>
          <button onClick={() => setMode('signup')} style={{ ...s.btnPrimary, width:'auto', padding:'9px 20px', fontSize:13 }}>
            S&apos;inscrire — gratuit
          </button>
        </div>
      </nav>

      <div style={s.hero}>
        <div style={{ fontSize:64, marginBottom:24 }}>✉️</div>
        <h1 style={{ fontSize:56, fontWeight:800, letterSpacing:-2, lineHeight:1.1, marginBottom:20, color:'#2D1A25' }}>
          La rencontre qui<br />
          <span style={{ color:pink }}>vibre</span> vraiment
        </h1>
        <p style={{ fontSize:18, color:'#9B7A8A', maxWidth:520, lineHeight:1.6, marginBottom:40 }}>
          Amoureuse ou musicale — Vibz connecte des gens qui se ressemblent, sans frontières géographiques, avec la nostalgie de MSN et l&apos;énergie de Caramail.
        </p>

        <div style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center', marginBottom:48 }}>
          {[
            {icon:'💬', label:'Messagerie MSN', sub:'Wizz & émoticônes'},
            {icon:'🎸', label:'Salons Caramail', sub:'Par instrument & style'},
            {icon:'❤️', label:'Rencontres', sub:'Amour & collabs'},
            {icon:'🛡️', label:'IA Guard', sub:'Anti-harcèlement'},
            {icon:'🌍', label:'International', sub:'Sans frontières'},
            {icon:'🆓', label:'100% gratuit', sub:'Pour toujours'},
          ].map(f => (
            <div key={f.label} style={{ background:'white', border:'1px solid rgba(196,84,122,0.1)', borderRadius:18, padding:'16px 20px', textAlign:'center', minWidth:140 }}>
              <div style={{ fontSize:28, marginBottom:8 }}>{f.icon}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#2D1A25' }}>{f.label}</div>
              <div style={{ fontSize:11, color:'#9B7A8A', marginTop:2 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setMode('signup')} style={{ ...s.btnPrimary, width:'auto', padding:'16px 48px', fontSize:18, borderRadius:32 }}>
          Rejoindre Vibz gratuitement →
        </button>
        <p style={{ marginTop:16, fontSize:12, color:'#9B7A8A' }}>
          Aucune carte bancaire · Gratuit pour toujours · Sécurisé par IA
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontWeight:800, fontSize:14, color:'#2D1A25', marginBottom:6 }}>{title}</div>
      <div style={{ color:'#6B5560', fontSize:13 }}>{children}</div>
    </div>
  )
}
