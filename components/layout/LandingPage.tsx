import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// ── CAPTCHA helpers ──────────────────────────────────────────────────────────
type CaptchaChallenge = { a: number; b: number; op: '+' | '-'; answer: number }

function generateCaptcha(): CaptchaChallenge {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const op = Math.random() > 0.5 ? '+' : '-'
  const [lo, hi] = op === '-' ? [Math.min(a, b), Math.max(a, b)] : [a, b]
  return op === '+'
    ? { a, b, op, answer: a + b }
    : { a: hi, b: lo, op, answer: hi - lo }
}

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

  // CAPTCHA — signup
  const [captcha, setCaptcha]       = useState<CaptchaChallenge>(generateCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')
  const captchaValid = captchaInput.trim() !== '' && parseInt(captchaInput, 10) === captcha.answer

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha())
    setCaptchaInput('')
  }, [])

  // CAPTCHA — brute-force protection on login (shown after 3 failures)
  const [loginFailCount, setLoginFailCount] = useState(0)
  const [loginCaptcha, setLoginCaptcha]       = useState<CaptchaChallenge>(generateCaptcha)
  const [loginCaptchaInput, setLoginCaptchaInput] = useState('')
  const loginCaptchaValid = loginCaptchaInput.trim() !== '' && parseInt(loginCaptchaInput, 10) === loginCaptcha.answer
  const showLoginCaptcha = loginFailCount >= 3

  // Feature modals (landing page)
  const [featureModal, setFeatureModal] = useState<'security' | 'international' | 'gratuit' | null>(null)
  const [showReportDemo, setShowReportDemo] = useState(false)

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
  const canSignup = usernameOk && email.includes('@') && password.length >= 8 && acceptedTerms && captchaValid

  // ── Auth handlers ────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!captchaValid) { setMessage('Résous le défi de sécurité d\'abord.'); setIsError(true); return }
    setLoading(true); setMessage(''); setIsError(false)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } }
    })
    if (error) { setMessage(error.message); setIsError(true) }
    else setMessage('✅ Vérifie ton email pour confirmer ton compte !')
    setLoading(false)
    refreshCaptcha()
  }

  const handleLogin = async () => {
    if (showLoginCaptcha && !loginCaptchaValid) {
      setMessage('Résous le défi de sécurité avant de continuer.'); setIsError(true); return
    }
    setLoading(true); setMessage(''); setIsError(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage('Email ou mot de passe incorrect.'); setIsError(true)
      setLoginFailCount(c => c + 1)
      setLoginCaptcha(generateCaptcha())
      setLoginCaptchaInput('')
    }
    setLoading(false)
  }

  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const handleOAuth = async (provider: 'google' | 'discord' | 'facebook' | 'azure') => {
    setOauthLoading(provider)
    setMessage(''); setIsError(false)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : '',
      },
    })
    if (error) {
      setMessage(`Erreur de connexion : ${error.message}`)
      setIsError(true)
      setOauthLoading(null)
    }
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const font = 'Nunito, sans-serif'
  const pink  = '#E07A9A'
  const green = '#52C07A'
  const blue  = '#6BB8E8'

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh',
      background: '#FFFFFF',
      display: 'flex', flexDirection: 'column', fontFamily: font,
    },
    nav: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 40px',
      background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(14px)',
      borderBottom: '1px solid #F0EEF6',
      boxShadow: '0 2px 16px rgba(110,150,220,0.08)',
    },
    logo: { display:'flex', alignItems:'center', gap:10, fontSize:24, fontWeight:800, letterSpacing:-1 },
    logoBox: {
      width:38, height:38, borderRadius:12,
      background: 'linear-gradient(135deg, #FADADD 0%, #C8E6F5 50%, #C8EFD4 100%)',
      border: '1.5px solid rgba(224,122,154,0.25)',
      display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
    },
    hero: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 20px', textAlign:'center' },
    formCard: {
      background:'#FFFFFF', borderRadius:24, padding:32, width:'100%', maxWidth:420,
      border:'1px solid #EEF0F8',
      boxShadow:'0 8px 40px rgba(107,184,232,0.12), 0 2px 8px rgba(224,122,154,0.08)',
    },
    input: {
      width:'100%', padding:'12px 16px',
      border:'1.5px solid #EEF0F8', borderRadius:12,
      fontSize:14, fontFamily:font, outline:'none',
      marginBottom:12, background:'#F8FBFF', color:'#1E2535', boxSizing:'border-box',
    },
    btnPrimary: {
      width:'100%', padding:'13px',
      background: `linear-gradient(135deg, ${pink} 0%, ${blue} 100%)`,
      color:'white', border:'none', borderRadius:32,
      fontSize:15, fontWeight:800, fontFamily:font, cursor:'pointer',
      boxShadow:'0 4px 18px rgba(107,184,232,0.3)', transition:'opacity 0.15s',
    },
    btnDisabled: {
      width:'100%', padding:'13px',
      background:'#F0F2F8', color:'#B0B8CC',
      border:'none', borderRadius:32, fontSize:15, fontWeight:800, fontFamily:font, cursor:'not-allowed',
    },
    btnOAuth: {
      width:'100%', padding:'11px 16px', borderRadius:32,
      border:'1.5px solid #EEF0F8',
      background:'#FAFBFF', fontFamily:font, fontSize:14, fontWeight:700,
      color:'#1E2535',
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      transition:'background 0.15s, box-shadow 0.15s',
      boxShadow:'0 1px 4px rgba(107,184,232,0.08)',
    },
    divider: {
      display:'flex', alignItems:'center', gap:12, margin:'16px 0',
      color:'#B0B8CC', fontSize:12, fontWeight:700,
    },
    switchLink: { textAlign:'center' as const, marginTop:14, fontSize:13, color:'#9BA8C0' },
    captchaBox: {
      display:'flex', alignItems:'center', gap:10, marginBottom:14,
      padding:'12px 14px', borderRadius:14,
      background:'linear-gradient(135deg,#F8FBFF,#FFF5F9)',
      border:'1.5px solid #EEF0F8',
    },
    captchaQuestion: { flex:1, fontSize:13, fontWeight:800, color:'#1E2535' },
    captchaInput: {
      width:64, padding:'8px 10px', textAlign:'center' as const,
      border:'1.5px solid #EEF0F8', borderRadius:10,
      fontSize:15, fontWeight:800, fontFamily: 'Nunito, sans-serif',
      background:'white', color:'#1E2535', outline:'none',
    },
    captchaRefresh: {
      background:'none', border:'none', cursor:'pointer',
      fontSize:18, color:'#B0B8CC', padding:4, lineHeight:1,
    },
  }

  const msgBox = (err: boolean): React.CSSProperties => ({
    marginTop:12, padding:'10px 14px', borderRadius:12, fontSize:13, fontWeight:700,
    background: err ? '#FFF0F4' : '#F0FBF4',
    color: err ? '#C0345A' : '#2A7A4A',
    border: `1px solid ${err ? 'rgba(224,122,154,0.25)' : 'rgba(82,192,122,0.25)'}`,
  })

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
              <div style={{ fontSize:12, color:'#9B7A8A', marginTop:2, display:'flex', gap:12 }}>
                <a href="/conditions" target="_blank" rel="noopener noreferrer" style={{ color:'#E07A9A', fontWeight:700, textDecoration:'none' }}>CGU →</a>
                <a href="/confidentialite" target="_blank" rel="noopener noreferrer" style={{ color:'#6BB8E8', fontWeight:700, textDecoration:'none' }}>Confidentialité →</a>
              </div>
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
            Pour accéder à l&apos;app, vous devez confirmer votre adresse email via le lien envoyé à l&apos;inscription. Cela garantit l&apos;authenticité des comptes et protège la communauté. La connexion via Google, Facebook, Microsoft ou Discord dispense de cette étape.
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

  // ── Feature modals ──────────────────────────────────────────────────────
  const modalOverlay: React.CSSProperties = {
    position:'fixed', inset:0, zIndex:1000,
    background:'rgba(45,26,37,0.65)', backdropFilter:'blur(4px)',
    display:'flex', alignItems:'center', justifyContent:'center', padding:20,
  }
  const modalCard: React.CSSProperties = {
    background:'white', borderRadius:28, maxWidth:620, width:'100%',
    maxHeight:'88vh', display:'flex', flexDirection:'column',
    border:'1px solid rgba(196,84,122,0.15)',
    boxShadow:'0 32px 80px rgba(196,84,122,0.2)',
    animation:'slideUp 0.35s ease',
  }
  const modalClose = (onClick: () => void) => (
    <button onClick={onClick} style={{
      width:32, height:32, borderRadius:10, border:'1px solid rgba(196,84,122,0.15)',
      background:'#FFF5F8', color:'#9B7A8A', cursor:'pointer', fontSize:18,
      display:'flex', alignItems:'center', justifyContent:'center', fontFamily:font,
    }}>×</button>
  )

  const SecurityModal = () => (
    <div style={modalOverlay} onClick={() => setFeatureModal(null)}>
      <div onClick={e => e.stopPropagation()} style={modalCard}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'#2D1A25' }}>🛡️ Sécurité & Confidentialité</div>
              <div style={{ fontSize:12, color:'#9B7A8A', marginTop:2 }}>Protection des données & non-divulgation</div>
            </div>
            {modalClose(() => setFeatureModal(null))}
          </div>
        </div>
        <div style={{ overflowY:'auto', padding:'20px 28px', flex:1, fontSize:13, lineHeight:1.75, color:'#2D1A25' }}>
          <Section title="🔐 Non-divulgation des données personnelles">
            Vibz applique une politique stricte : votre adresse email n&apos;est <strong>jamais affichée</strong> publiquement. Votre ville, vos réseaux sociaux et vos coordonnées ne sont visibles que si vous les activez explicitement dans vos paramètres de confidentialité. Aucune donnée n&apos;est transmise à un tiers sans votre consentement explicite.
          </Section>
          <Section title="🤖 IA Guard — Protection en temps réel">
            Notre IA surveille les conversations en continu pour détecter le harcèlement, les tentatives d&apos;extorsion d&apos;informations personnelles et les contenus toxiques. Les messages bloqués ne sont <strong>jamais transmis</strong> au destinataire et sont examinés par notre équipe de modération sous 24h.
          </Section>
          <Section title="🚩 Signalement — Vous décidez">
            Lorsqu&apos;un comportement inapproprié est détecté ou signalé, une notification s&apos;affiche chez la victime. Elle choisit librement de <strong>bloquer définitivement</strong> l&apos;auteur ou de <strong>continuer la discussion</strong>. Aucune action n&apos;est imposée sans votre accord.
          </Section>
          <Section title="💾 Hébergement & RGPD">
            Toutes vos données sont hébergées en <strong>Europe</strong>, chiffrées en transit (TLS) et au repos (AES-256). Vous exercez votre droit à l&apos;oubli à tout moment depuis votre profil — la suppression est immédiate et irréversible.
          </Section>
          <Section title="🚫 Informations jamais partagées">
            <ul style={{ paddingLeft:16, margin:'6px 0' }}>
              {['Adresse email (invisible publiquement)','Historique complet des conversations','Données de géolocalisation précises','Adresse IP','Données de paiement (dons)'].map(item => (
                <li key={item} style={{ marginBottom:4 }}>{item}</li>
              ))}
            </ul>
          </Section>
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <button onClick={() => { setFeatureModal(null); setMode('signup') }} style={s.btnPrimary}>
            Rejoindre Vibz en sécurité →
          </button>
        </div>
      </div>
    </div>
  )

  const MAP_DOTS = [
    { x:'18%', y:'32%', flag:'🇫🇷', city:'Paris', color:'#C4547A' },
    { x:'15%', y:'24%', flag:'🇬🇧', city:'Londres', color:'#7F77DD' },
    { x:'3%',  y:'30%', flag:'🇺🇸', city:'New York', color:'#3BAD7A' },
    { x:'5%',  y:'58%', flag:'🇧🇷', city:'São Paulo', color:'#E8A06A' },
    { x:'65%', y:'28%', flag:'🇯🇵', city:'Tokyo', color:'#C4547A' },
    { x:'36%', y:'46%', flag:'🇳🇬', city:'Lagos', color:'#7F77DD' },
    { x:'70%', y:'60%', flag:'🇦🇺', city:'Sydney', color:'#3BAD7A' },
    { x:'42%', y:'20%', flag:'🇩🇪', city:'Berlin', color:'#E8A06A' },
    { x:'55%', y:'22%', flag:'🇷🇺', city:'Moscou', color:'#C4547A' },
    { x:'50%', y:'42%', flag:'🇮🇳', city:'Mumbai', color:'#7F77DD' },
  ]

  const InternationalModal = () => (
    <div style={modalOverlay} onClick={() => setFeatureModal(null)}>
      <div onClick={e => e.stopPropagation()} style={{ ...modalCard, maxWidth:680 }}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'#2D1A25' }}>🌍 Vibz International</div>
              <div style={{ fontSize:12, color:'#9B7A8A', marginTop:2 }}>Traduction IA en temps réel · Sans frontières</div>
            </div>
            {modalClose(() => setFeatureModal(null))}
          </div>
        </div>

        {/* Carte du monde */}
        <div style={{ margin:'20px 28px 0', position:'relative', height:200, borderRadius:18, overflow:'hidden', background:'linear-gradient(135deg, #0EA5E9 0%, #0284C7 50%, #0369A1 100%)', flexShrink:0 }}>
          {/* Continents (blobs CSS) */}
          <div style={{ position:'absolute', left:'2%', top:'18%', width:'22%', height:'55%', background:'rgba(134,239,172,0.6)', borderRadius:'35% 65% 55% 45% / 40% 35% 65% 60%' }}/>
          <div style={{ position:'absolute', left:'6%', top:'55%', width:'12%', height:'35%', background:'rgba(134,239,172,0.6)', borderRadius:'45% 55% 40% 60% / 50% 40% 60% 50%' }}/>
          <div style={{ position:'absolute', left:'35%', top:'12%', width:'18%', height:'40%', background:'rgba(134,239,172,0.6)', borderRadius:'40% 60% 50% 50% / 35% 45% 55% 65%' }}/>
          <div style={{ position:'absolute', left:'35%', top:'40%', width:'14%', height:'42%', background:'rgba(134,239,172,0.6)', borderRadius:'38% 62% 48% 52%' }}/>
          <div style={{ position:'absolute', left:'47%', top:'8%', width:'38%', height:'50%', background:'rgba(134,239,172,0.6)', borderRadius:'30% 70% 45% 55% / 40% 35% 65% 60%' }}/>
          <div style={{ position:'absolute', left:'65%', top:'54%', width:'12%', height:'24%', background:'rgba(134,239,172,0.6)', borderRadius:'50%' }}/>
          {/* Overlay gradient */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 60%, rgba(2,132,199,0.3) 100%)' }}/>
          {/* Dots membres */}
          {MAP_DOTS.map(dot => (
            <div key={dot.city} style={{ position:'absolute', left:dot.x, top:dot.y, transform:'translate(-50%,-50%)' }}>
              <div className="map-ping" style={{ position:'absolute', inset:'-4px', borderRadius:'50%', background:dot.color, opacity:0.4 }}/>
              <div style={{ width:10, height:10, borderRadius:'50%', background:dot.color, border:'2px solid white', position:'relative', zIndex:1 }}/>
              <div style={{ position:'absolute', top:12, left:'50%', transform:'translateX(-50%)', fontSize:9, fontWeight:800, color:'white', whiteSpace:'nowrap', background:'rgba(0,0,0,0.45)', padding:'1px 5px', borderRadius:4 }}>
                {dot.flag} {dot.city}
              </div>
            </div>
          ))}
        </div>

        <div style={{ overflowY:'auto', padding:'16px 28px 20px', flex:1, fontSize:13, lineHeight:1.7, color:'#2D1A25' }}>
          <Section title="🤖 Traduction IA instantanée">
            Dans le salon <strong>International</strong>, chaque message est automatiquement détecté et traduit dans votre langue. Un musicien japonais peut parler à un artiste brésilien sans barrière — la conversation se déroule naturellement pour les deux.
          </Section>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
            {[
              { flag:'🇯🇵', from:'こんにちは！ギターを弾きます', to:'Bonjour ! Je joue de la guitare 🎸' },
              { flag:'🇧🇷', from:'Vamos fazer uma jam !', to:'On fait un jam session ! 🎵' },
            ].map(ex => (
              <div key={ex.flag} style={{ background:'#F5F0FF', borderRadius:12, padding:'10px 14px', fontSize:12 }}>
                <div style={{ color:'#9B7A8A', marginBottom:4 }}>{ex.flag} Message original :</div>
                <div style={{ fontWeight:700, marginBottom:6, color:'#2D1A25' }}>{ex.from}</div>
                <div style={{ color:'#9B7A8A', marginBottom:4 }}>🌍 Traduit :</div>
                <div style={{ fontWeight:700, color:'#3BAD7A' }}>{ex.to}</div>
              </div>
            ))}
          </div>
          <Section title="🌐 10 langues supportées">
            Français, Anglais, Espagnol, Portugais, Japonais, Allemand, Arabe, Hindi, Coréen, Russe — et plus à venir selon les besoins de la communauté.
          </Section>
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <button onClick={() => { setFeatureModal(null); setMode('signup') }} style={s.btnPrimary}>
            Rejoindre le salon International →
          </button>
        </div>
      </div>
    </div>
  )

  const GratuitModal = () => (
    <div style={modalOverlay} onClick={() => { setFeatureModal(null); setShowReportDemo(false) }}>
      <div onClick={e => e.stopPropagation()} style={modalCard}>
        <div style={{ padding:'24px 28px 16px', borderBottom:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:'#2D1A25' }}>🆓 Gratuit pour toujours</div>
              <div style={{ fontSize:12, color:'#9B7A8A', marginTop:2 }}>Pas d&apos;abonnement · Dons libres · Sécurité maximale</div>
            </div>
            {modalClose(() => { setFeatureModal(null); setShowReportDemo(false) })}
          </div>
        </div>
        <div style={{ overflowY:'auto', padding:'20px 28px', flex:1, fontSize:13, lineHeight:1.75, color:'#2D1A25' }}>
          <Section title="💸 Modèle économique transparent">
            Vibz ne vend <strong>aucun forfait</strong>, aucun abonnement premium, aucun accès payant. Toutes les fonctionnalités sont accessibles à 100% gratuitement. Si Vibz vous apporte de la valeur, vous pouvez contribuer librement via un don — mais ce n&apos;est jamais obligatoire.
          </Section>
          {/* Boutons de don */}
          <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
            {[
              { label:'☕ 1 café — 3€', color:'#FAEEDA', text:'#633806' },
              { label:'🎵 1 mois de soutien — 5€', color:'#EDE8F8', text:'#3C3489' },
              { label:'🏆 Grand contributeur — libre', color:'#D6F5E6', text:'#1A6645' },
            ].map(d => (
              <div key={d.label} style={{ padding:'10px 14px', borderRadius:12, background:d.color, color:d.text, fontWeight:800, fontSize:12, cursor:'pointer', border:`1px solid ${d.color}` }}>
                {d.label}
              </div>
            ))}
          </div>
          <Section title="🚩 Contrôle de sécurité — Signalement de harcèlement">
            Lorsqu&apos;un membre est signalé pour harcèlement, une fenêtre s&apos;affiche immédiatement chez la victime. Elle décide elle-même de la suite — Vibz ne prend aucune décision à sa place.
          </Section>
          {/* Demo de la modale de signalement */}
          {!showReportDemo ? (
            <button onClick={() => setShowReportDemo(true)} style={{
              ...s.btnPrimary, width:'auto', padding:'10px 20px', fontSize:13, marginBottom:16,
              background:'linear-gradient(135deg,#7F77DD,#A78BDB)',
            }}>
              👁️ Voir la fenêtre de signalement
            </button>
          ) : (
            <div className="animate-slide-up" style={{ border:'1px solid rgba(196,84,122,0.2)', borderRadius:18, padding:20, marginBottom:16, background:'#FFF5F8' }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:16 }}>
                <div style={{ fontSize:32 }}>🚨</div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>Signalement reçu</div>
                  <div style={{ fontSize:12, color:'#9B7A8A', lineHeight:1.6 }}>
                    <strong>Tom K.</strong> a été signalé pour comportement inapproprié par notre IA Guard.<br/>
                    Que souhaitez-vous faire ?
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button style={{ ...s.btnPrimary, flex:1, padding:'11px', fontSize:13, background:'linear-gradient(135deg,#E07A7A,#C4547A)' }}>
                  🚫 Bloquer définitivement Tom K.
                </button>
                <button style={{ ...s.btnPrimary, flex:1, padding:'11px', fontSize:13, background:'linear-gradient(135deg,#3BAD7A,#1D9E75)' }}>
                  ✅ Continuer la discussion
                </button>
              </div>
              <button style={{ marginTop:10, background:'none', border:'1px solid rgba(196,84,122,0.2)', borderRadius:20, padding:'7px 16px', cursor:'pointer', fontSize:12, color:'#9B7A8A', width:'100%', fontFamily:font }} onClick={() => setShowReportDemo(false)}>
                Fermer la démo
              </button>
            </div>
          )}
          <Section title="🛡️ Ce qui se passe après un signalement">
            <ul style={{ paddingLeft:16, margin:'6px 0' }}>
              {[
                'L\'IA Guard détecte ou reçoit un signalement',
                'Une notification ponctuelle s\'affiche chez la victime',
                'La victime choisit : bloquer définitivement ou continuer',
                'Si bloqué : le membre harceleur ne peut plus vous contacter',
                'La modération Vibz examine le cas sous 24h',
                'En cas de récidive : exclusion permanente de la plateforme',
              ].map(item => (
                <li key={item} style={{ marginBottom:4 }}>{item}</li>
              ))}
            </ul>
          </Section>
        </div>
        <div style={{ padding:'16px 28px', borderTop:'1px solid rgba(196,84,122,0.1)', flexShrink:0 }}>
          <button onClick={() => { setFeatureModal(null); setShowReportDemo(false); setMode('signup') }} style={s.btnPrimary}>
            Rejoindre Vibz gratuitement →
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
          <div style={{ ...s.logo, cursor:'pointer' }} onClick={() => { setMode('landing'); setMessage('') }}>
            <div style={s.logoBox}>🦋</div>
            Vib<span style={{ color:pink }}>z</span>
          </div>
          <button onClick={() => { setMode('landing'); setMessage('') }} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:13, color:'#9B7A8A', fontFamily:font, fontWeight:700 }}>
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

            {/* Boutons OAuth — colonne verticale */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:4 }}>

              {/* Google */}
              <button
                style={{ ...s.btnOAuth, opacity: oauthLoading ? 0.6 : 1 }}
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading}
              >
                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                {oauthLoading === 'google' ? 'Connexion…' : 'Google'}
              </button>

              {/* Facebook */}
              <button
                style={{ ...s.btnOAuth, background:'#1877F2', color:'white', border:'none', opacity: oauthLoading ? 0.6 : 1 }}
                onClick={() => handleOAuth('facebook')}
                disabled={!!oauthLoading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                {oauthLoading === 'facebook' ? 'Connexion…' : 'Facebook'}
              </button>

              {/* Microsoft */}
              <button
                style={{ ...s.btnOAuth, background:'#0078D4', color:'white', border:'none', opacity: oauthLoading ? 0.6 : 1 }}
                onClick={() => handleOAuth('azure')}
                disabled={!!oauthLoading}
              >
                <svg width="16" height="16" viewBox="0 0 23 23" fill="none">
                  <rect x="1"  y="1"  width="10" height="10" fill="#F25022"/>
                  <rect x="12" y="1"  width="10" height="10" fill="#7FBA00"/>
                  <rect x="1"  y="12" width="10" height="10" fill="#00A4EF"/>
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
                </svg>
                {oauthLoading === 'azure' ? 'Connexion…' : 'Microsoft'}
              </button>

              {/* Discord */}
              <button
                style={{ ...s.btnOAuth, background:'#5865F2', color:'white', border:'none', opacity: oauthLoading ? 0.6 : 1 }}
                onClick={() => handleOAuth('discord')}
                disabled={!!oauthLoading}
              >
                <svg width="16" height="13" viewBox="0 0 71 55" fill="white"><path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.2.2 0 0 0-.2.1 40.7 40.7 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0A37.3 37.3 0 0 0 25.5.5a.2.2 0 0 0-.2-.1A58.4 58.4 0 0 0 10.7 4.9a.2.2 0 0 0-.1.1C1.5 18.5-1 31.7.3 44.8a.2.2 0 0 0 .1.1 58.8 58.8 0 0 0 17.7 9 .2.2 0 0 0 .2-.1 42 42 0 0 0 3.6-5.9.2.2 0 0 0-.1-.3 38.7 38.7 0 0 1-5.5-2.6.2.2 0 0 1 0-.4c.4-.3.7-.5 1.1-.8a.2.2 0 0 1 .2 0c11.6 5.3 24.1 5.3 35.5 0a.2.2 0 0 1 .2 0c.4.3.7.5 1.1.8a.2.2 0 0 1 0 .4 36.2 36.2 0 0 1-5.5 2.6.2.2 0 0 0-.1.3 47 47 0 0 0 3.6 5.9.2.2 0 0 0 .2.1 58.6 58.6 0 0 0 17.8-9 .2.2 0 0 0 .1-.1c1.5-15.4-2.5-28.6-10.6-40a.2.2 0 0 0-.1-.1zM23.7 37.3c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.2 6.4 7.2 0 4-2.8 7.2-6.4 7.2z"/></svg>
                {oauthLoading === 'discord' ? 'Connexion…' : 'Discord'}
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

            {/* CAPTCHA — login brute-force protection */}
            {mode === 'login' && showLoginCaptcha && (
              <div style={s.captchaBox}>
                <span style={{ fontSize:20 }}>🔒</span>
                <span style={s.captchaQuestion}>
                  Combien font {loginCaptcha.a} {loginCaptcha.op} {loginCaptcha.b} ?
                </span>
                <input
                  style={{ ...s.captchaInput, borderColor: loginCaptchaInput && !loginCaptchaValid ? '#E07A7A' : undefined }}
                  type="number" inputMode="numeric" placeholder="?"
                  value={loginCaptchaInput}
                  onChange={e => setLoginCaptchaInput(e.target.value)}
                />
                <button style={s.captchaRefresh} title="Nouveau défi"
                  onClick={() => { setLoginCaptcha(generateCaptcha()); setLoginCaptchaInput('') }}>
                  🔄
                </button>
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
                  <a
                    href="/conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color:pink, fontWeight:800, textDecoration:'underline', cursor:'pointer' }}
                  >
                    Conditions Générales d&apos;Utilisation &amp; Charte Vibz
                  </a>
                  {' '}— <strong style={{ color:'#7A1F40' }}>lecture obligatoire avant inscription</strong>
                </span>
              </label>
            )}

            {/* CAPTCHA — signup anti-bot */}
            {mode === 'signup' && (
              <div style={s.captchaBox}>
                <span style={{ fontSize:20 }}>🤖</span>
                <span style={s.captchaQuestion}>
                  Combien font {captcha.a} {captcha.op} {captcha.b} ?
                </span>
                <input
                  style={{ ...s.captchaInput, borderColor: captchaInput && !captchaValid ? '#E07A7A' : captchaValid ? '#3BAD7A' : undefined }}
                  type="number" inputMode="numeric" placeholder="?"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                />
                <button style={s.captchaRefresh} title="Nouveau défi" onClick={refreshCaptcha}>
                  🔄
                </button>
              </div>
            )}

            <button
              style={mode === 'signup' ? (canSignup ? s.btnPrimary : s.btnDisabled) : s.btnPrimary}
              onClick={mode === 'login' ? handleLogin : handleSignup}
              disabled={loading || (mode === 'signup' && !canSignup)}
            >
              {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>

            {message && <div style={msgBox(isError)}>{message}</div>}

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

  // ── Landing page — skin Blanc / Rose pastel / Vert clair / Bleu ciel ───
  type Star = { top:string; left?:string; right?:string; size:number; delay:string; color:string }
  const STARS: Star[] = [
    { top:'10%', left:'5%',  size:20, delay:'0s',    color:'#F4A8BF' },
    { top:'22%', left:'2%',  size:13, delay:'0.8s',  color:'#A8D8F0' },
    { top:'52%', left:'6%',  size:15, delay:'1.5s',  color:'#A8E8C0' },
    { top:'72%', left:'3%',  size:11, delay:'0.4s',  color:'#F4A8BF' },
    { top:'88%', left:'8%',  size:14, delay:'1.2s',  color:'#A8D8F0' },
    { top:'8%',  right:'7%', size:17, delay:'0.6s',  color:'#A8E8C0' },
    { top:'32%', right:'4%', size:21, delay:'1.3s',  color:'#F4A8BF' },
    { top:'60%', right:'5%', size:12, delay:'0.9s',  color:'#A8D8F0' },
    { top:'80%', right:'8%', size:16, delay:'0.2s',  color:'#A8E8C0' },
  ]

  const FRIENDS = ['🎸','🎹','🎤','🥁','🎷','🎻','🪕','🎺']

  return (
    <div style={s.page}>
      {featureModal === 'security' && <SecurityModal />}
      {featureModal === 'international' && <InternationalModal />}
      {featureModal === 'gratuit' && <GratuitModal />}

      {/* Étoiles flottantes */}
      <div aria-hidden style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        {STARS.map((st, i) => (
          <div key={i} className="animate-float" style={{
            position:'absolute',
            top: st.top, left: st.left, right: st.right,
            fontSize: st.size, color: st.color,
            animationDelay: st.delay, opacity: 0.65, userSelect: 'none',
          }}>✦</div>
        ))}
        {/* Papillon Vibz watermark */}
        <div className="animate-float" style={{
          position:'absolute', bottom:'8%', left:'50%', transform:'translateX(-50%)',
          fontSize:120, opacity:0.05, animationDelay:'1s', pointerEvents:'none',
        }}>🦋</div>
        {/* Cercles décoratifs pastel */}
        <div style={{ position:'absolute', top:'15%', left:'-4%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(224,122,154,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'20%', right:'-5%', width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(107,184,232,0.10) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'50%', left:'10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(82,192,122,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>
      </div>

      {/* Nav */}
      <nav style={{ ...s.nav, position:'relative', zIndex:10 }}>
        <div style={{ ...s.logo, cursor:'pointer' }} onClick={() => setMode('landing')}>
          <div style={s.logoBox}>🦋</div>
          Vib<span style={{ color:pink }}>z</span>
        </div>

        {/* Barre de statut */}
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700, color:'#2A7A5A', background:'rgba(200,239,212,0.5)', padding:'5px 14px', borderRadius:20, border:'1px solid rgba(82,192,122,0.25)' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:green }} className="pulse-dot"/>
          247 membres en ligne
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => setMode('login')} style={{ ...s.btnPrimary, width:'auto', padding:'9px 20px', fontSize:13, background:'white', color:'#2D1A25', border:'1px solid rgba(212,83,126,0.2)', boxShadow:'none' }}>
            Se connecter
          </button>
          <button onClick={() => setMode('signup')} style={{ ...s.btnPrimary, width:'auto', padding:'9px 20px', fontSize:13 }}>
            S&apos;inscrire — gratuit
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ ...s.hero, position:'relative', zIndex:1 }}>

        {/* Papillon animé + icône */}
        <div className="animate-float" style={{ fontSize:72, marginBottom:8, filter:'drop-shadow(0 8px 24px rgba(212,83,126,0.2))' }}>🦋</div>
        <div style={{ fontSize:11, fontWeight:800, letterSpacing:3, textTransform:'uppercase', color:green, marginBottom:20, opacity:0.8 }}>
          Dans l&apos;esprit des années 2000 — réinventé
        </div>

        <h1 style={{ fontSize:56, fontWeight:800, letterSpacing:-2, lineHeight:1.1, marginBottom:20, color:'#1A1E2E' }}>
          La rencontre qui<br />
          <span style={{ background:`linear-gradient(90deg, ${pink}, ${blue})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>vibre</span> vraiment
        </h1>

        <p style={{ fontSize:18, color:'#7A88AA', maxWidth:520, lineHeight:1.6, marginBottom:40 }}>
          Amoureuse ou musicale — Vibz connecte des gens qui se ressemblent, sans frontières géographiques, avec la nostalgie du tchat des années 2000 et l&apos;énergie des salons à thèmes.
        </p>

        {/* Cartes features — rose / vert / bleu en rotation */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center', marginBottom:48 }}>
          {([
            { icon:'💬', label:'Messagerie rétro', sub:'Wizz & émoticônes',      action: () => setMode('login'),                accent: pink,  bg:'#FFF5F8' },
            { icon:'🎸', label:'Salons à thèmes',  sub:'Collabs & instruments',  action: () => setMode('signup'),               accent: green, bg:'#F4FBF6' },
            { icon:'❤️', label:'Rencontres',      sub:'Amour & collabs',        action: () => setMode('signup'),               accent: blue,  bg:'#F2F8FD' },
            { icon:'🛡️', label:'IA Guard',        sub:'Anti-harcèlement',       action: () => setFeatureModal('security'),     accent: pink,  bg:'#FFF5F8' },
            { icon:'🌍', label:'International',   sub:'Sans frontières',        action: () => setFeatureModal('international'),accent: green, bg:'#F4FBF6' },
            { icon:'🆓', label:'100% gratuit',    sub:'Pour toujours',          action: () => setFeatureModal('gratuit'),      accent: blue,  bg:'#F2F8FD' },
          ] as const).map(f => (
            <div key={f.label} className="feature-card" onClick={f.action}
              style={{ background: f.bg, borderTop:`3px solid ${f.accent}`, boxShadow:`0 4px 16px ${f.accent}18` }}>
              <div style={{ fontSize:28, marginBottom:8 }} className="animate-float">{f.icon}</div>
              <div style={{ fontSize:13, fontWeight:800, color:'#1A1E2E' }}>{f.label}</div>
              <div style={{ fontSize:11, color:'#9BA8C0', marginTop:2 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setMode('signup')} style={{ ...s.btnPrimary, width:'auto', padding:'16px 48px', fontSize:18, borderRadius:32 }}>
          Rejoindre Vibz gratuitement →
        </button>
        <p style={{ marginTop:14, fontSize:12, color:'#9BA8C0' }}>
          Aucune carte bancaire · Gratuit pour toujours · Sécurisé par IA
        </p>

        {/* Rangée d'avatars */}
        <div style={{ marginTop:48, display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:'uppercase', color:'#9BA8C0' }}>
            Connectés maintenant
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {FRIENDS.map((icon, i) => {
              const colors = [
                { bg:'rgba(224,122,154,0.12)', border:'rgba(224,122,154,0.3)' },
                { bg:'rgba(107,184,232,0.12)', border:'rgba(107,184,232,0.3)' },
                { bg:'rgba(82,192,122,0.12)',  border:'rgba(82,192,122,0.3)'  },
              ]
              const c = colors[i % 3]
              return (
                <div key={i} style={{
                  width:40, height:40, borderRadius:'50%',
                  background: c.bg, border:`2px solid ${c.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:20, position:'relative', cursor:'default',
                }}>
                  {icon}
                  <div style={{
                    position:'absolute', bottom:0, right:0,
                    width:10, height:10, borderRadius:'50%',
                    background: green, border:'2px solid white',
                  }}/>
                </div>
              )
            })}
            <div style={{ fontSize:12, color:'#9BA8C0', marginLeft:8, fontWeight:800 }}>
              + 239 musiciens
            </div>
          </div>
        </div>
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
