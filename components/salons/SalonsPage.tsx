import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { moderateMessage, getIAGuardMessage } from '../../lib/moderation'
import { useTheme } from '../../lib/theme'
import MusicCard, { extractMusicUrl } from '../shared/MusicCard'

interface Props { user: User | null }

const font = 'Nunito, sans-serif'
const pink  = '#E07A9A'
const green = '#52C07A'
const blue  = '#6BB8E8'

// ── Arborescence des 12 salons Vibz ──────────────────────────────────────────
// 4 branches racines × 3 sous-thèmes = 12 salons interconnectés
//
//  🎼 STYLES MUSICAUX    🎵 INSTRUMENTS    🎤 CONCERTS & ÉVÉNEMENTS    💑 RENCONTRES
//  ├─ Rock·Metal·Punk    ├─ Cordes         ├─ Concerts live             ├─ Coup de foudre
//  ├─ Jazz·Blues·Soul    ├─ Rythme & Perc  ├─ Festivals & Scènes        ├─ Collabs & Duos
//  └─ Électro·Hip-Hop    └─ Claviers·Voix  └─ Casting & Annonces        └─ International
// ─────────────────────────────────────────────────────────────────────────────

const SALONS = [
  // 🎼 Branche 1 — Styles musicaux
  { id:'1',  icon:'🎸', name:'Rock · Metal · Punk',      count:47,  cat:'Styles',     branch:'🎼 Styles musicaux',       color:'#E07A9A', hasMod:true  },
  { id:'2',  icon:'🎷', name:'Jazz · Blues · Soul',       count:23,  cat:'Styles',     branch:'🎼 Styles musicaux',       color:'#6BB8E8', hasMod:false },
  { id:'3',  icon:'🎧', name:'Électro · Hip-Hop · Urbain',count:56,  cat:'Styles',     branch:'🎼 Styles musicaux',       color:'#A78BDB', hasMod:true  },

  // 🎵 Branche 2 — Instruments pratiqués
  { id:'4',  icon:'🎸', name:'Cordes',                   count:31,  cat:'Instruments', branch:'🎵 Instruments pratiqués', color:'#52C07A', hasMod:false },
  { id:'5',  icon:'🥁', name:'Rythme & Percussions',     count:19,  cat:'Instruments', branch:'🎵 Instruments pratiqués', color:'#E07A9A', hasMod:false },
  { id:'6',  icon:'🎹', name:'Claviers · Voix · Chœurs', count:28,  cat:'Instruments', branch:'🎵 Instruments pratiqués', color:'#6BB8E8', hasMod:true  },

  // 🎤 Branche 3 — Concerts & Événements
  { id:'7',  icon:'🎪', name:'Concerts à ne pas louper', count:88,  cat:'Événements',  branch:'🎤 Concerts & Événements', color:'#52C07A', hasMod:true  },
  { id:'8',  icon:'🏟️', name:'Festivals & Scènes ouvertes',count:62, cat:'Événements', branch:'🎤 Concerts & Événements', color:'#6BB8E8', hasMod:false },
  { id:'9',  icon:'📢', name:'Casting & Annonces',        count:38,  cat:'Événements',  branch:'🎤 Concerts & Événements', color:'#E07A9A', hasMod:true  },

  // 💑 Branche 4 — Rencontres musicales
  { id:'10', icon:'❤️', name:'Coup de foudre musical',   count:74,  cat:'Rencontres',  branch:'💑 Rencontres musicales',  color:'#E07A9A', hasMod:true  },
  { id:'11', icon:'🤝', name:'Collabs & Duos',            count:44,  cat:'Rencontres',  branch:'💑 Rencontres musicales',  color:'#52C07A', hasMod:true  },
  { id:'12', icon:'🌍', name:'International & Multilingue',count:201,cat:'Rencontres',  branch:'💑 Rencontres musicales',  color:'#6BB8E8', hasMod:true  },
]

// Branches racines pour l'affichage en arborescence
const BRANCHES = [
  { id:'styles',      label:'🎼 Styles musicaux',       ids:['1','2','3'],     color:'#E07A9A' },
  { id:'instruments', label:'🎵 Instruments pratiqués', ids:['4','5','6'],     color:'#52C07A' },
  { id:'evenements',  label:'🎤 Concerts & Événements', ids:['7','8','9'],     color:'#6BB8E8' },
  { id:'rencontres',  label:'💑 Rencontres musicales',  ids:['10','11','12'],  color:'#E07A9A' },
]

const CATS = ['Tous', 'Styles', 'Instruments', 'Événements', 'Rencontres']

type Msg = {
  id: string
  author: string
  avatar: string
  content: string
  isMod?: boolean
  isBot?: boolean
  isMatch?: boolean
  lang?: string
  translated?: string
  time: string
}

const INIT_MSGS: Record<string, Msg[]> = {
  '1': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Rock·Metal·Punk — Partagez votre passion, restez bienveillants. Charte Vibz active.',isBot:true,time:''},
    {id:'2',author:'Éric (Modo)',avatar:'🎸',content:'Bonsoir ! Quelqu\'un connaît de bons concerts metal à Lyon ce mois-ci ? 🤘',isMod:true,time:'20:14'},
    {id:'3',author:'Léa R.',avatar:'🎵',content:'Ouais ! Gojira passe au Transbordeur le 12 novembre, fonce 🔥',time:'20:15'},
  ],
  '2': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Jazz·Blues·Soul — Le salon des âmes fines et des improvisateurs.',isBot:true,time:''},
    {id:'2',author:'Pierre M.',avatar:'🎷',content:'Cherche jam session sur Paris ce week-end, saxophone alto 🎷',time:'21:10'},
  ],
  '3': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Électro·Hip-Hop·Urbain — Beats, flows et drops bienvenus.',isBot:true,time:''},
    {id:'2',author:'Nico B.',avatar:'🎧',content:'Qui connaît des événements drum & bass en région parisienne ? 🎧',time:'19:30'},
    {id:'3',author:'Malia K.',avatar:'🎤',content:'Le Concrete ce samedi ! Lineup de folie 🔊',time:'19:31'},
  ],
  '4': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Cordes — Guitaristes, bassistes, violonistes, violoncellistes… à vos cordes !',isBot:true,time:''},
    {id:'2',author:'Sam G.',avatar:'🎸',content:'Quelqu\'un bosse le fingerstyle ? J\'ai du mal avec les arpèges en Am 🎸',time:'17:00'},
    {id:'3',author:'Éric (Modo)',avatar:'🎸',content:'Justin Guitar a une super série là-dessus, check YouTube !',isMod:true,time:'17:02'},
  ],
  '5': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Rythme & Percussions — Batteurs, percussionnistes, beatmakers : le temple du groove.',isBot:true,time:''},
    {id:'2',author:'Tom R.',avatar:'🥁',content:'Je cherche un pad Alesis pour m\'entraîner en appart, vous conseillez quoi ? 🥁',time:'18:30'},
  ],
  '6': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Claviers·Voix·Chœurs — Piano, synthé, orgue, chant lyrique ou pop : tous les timbres ici.',isBot:true,time:''},
    {id:'2',author:'Clara M.',avatar:'🎹',content:'Qui fait du chant choral sur Bordeaux ? Je monte un quatuor 🎵',time:'20:00'},
    {id:'3',author:'Léa R.',avatar:'🎤',content:'Je suis soprano, j\'adorerais ! DM moi 🎶',time:'20:03'},
  ],
  '7': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Concerts à ne pas louper — Partagez vos dates, découvertes, coups de cœur live !',isBot:true,time:''},
    {id:'2',author:'Marie F.',avatar:'🎪',content:'Coldplay à Saint-Denis en juillet — quelqu\'un veut y aller en groupe ? 🎪',time:'15:00'},
    {id:'3',author:'Théo V.',avatar:'🎵',content:'Moi ! J\'en cherchais encore 🙌',time:'15:04'},
  ],
  '8': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Festivals & Scènes ouvertes — Bons plans, lineups, open mics, scènes amateurs.',isBot:true,time:''},
    {id:'2',author:'Nico B.',avatar:'🎧',content:'Les Vieilles Charrues — qui y va cette année ? 🏟️',time:'14:00'},
    {id:'3',author:'Sophie L.',avatar:'🎤',content:'On y est chaque année ! On monte un petit groupe pour y aller 🎉',time:'14:05'},
  ],
  '9': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Casting & Annonces — Cherche musicien, groupe qui recrute, session live : postez ici.',isBot:true,time:''},
    {id:'2',author:'Éric (Modo)',avatar:'🎸',content:'Groupe punk lyonnais cherche un chanteur avec expérience scène 🎤',isMod:true,time:'10:00'},
    {id:'3',author:'Marco D.',avatar:'🎹',content:'Je cherche un pianiste pour enregistrer un EP jazz-folk à Paris 🎹',time:'10:30'},
  ],
  '10': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'💑 Coup de foudre musical — Bienveillance, respect, authenticité. Ici on se rencontre vraiment.',isBot:true,time:''},
    {id:'2',author:'Sophie L.',avatar:'🎤',content:'Bonjour ! Qui est musicien(ne) ici ? Je cherche quelqu\'un qui vibre comme moi 😊',time:'19:30'},
    {id:'3',author:'Marco D.',avatar:'🎹',content:'Moi ! Pianiste depuis 12 ans, passionné de jazz et de promenades au coucher du soleil 🌅',time:'19:31'},
  ],
  '11': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🤝 Collabs & Duos — Créez ensemble : duo, EP, collab en ligne ou en studio.',isBot:true,time:''},
    {id:'2',author:'Nico B.',avatar:'🎧',content:'Beatmaker cherche voix féminine pour EP R&B/soul — prod dispo à écouter 🎵',time:'17:45'},
    {id:'3',author:'Léa R.',avatar:'🎤',content:'Je suis chanteuse soul ! Je t\'envoie un MP 🎶',time:'17:48'},
  ],
  '12': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🌍 International — Traduction IA activée ! Parlez votre langue, tout le monde vous comprend.',isBot:true,time:''},
    {id:'2',author:'Yuki 🇯🇵',avatar:'🎸',content:'こんにちは！ギターを弾く人いますか？',lang:'🇯🇵 Japonais',translated:'Bonjour ! Y a-t-il des guitaristes ici ?',time:'18:00'},
    {id:'3',author:'Carlos 🇧🇷',avatar:'🥁',content:'Olá! Sou baterista, procuro colaborar!',lang:'🇧🇷 Portugais',translated:'Salut ! Je suis batteur, je cherche à collaborer !',time:'18:01'},
    {id:'4',author:'Anna 🇩🇪',avatar:'🎹',content:'Hallo! Ich spiele Klavier und suche eine Band.',lang:'🇩🇪 Allemand',translated:'Bonjour ! Je joue du piano et cherche un groupe.',time:'18:03'},
  ],
}

// ── Système de match dans les salons ─────────────────────────────────────────
const MATCH_PROFILES = [
  { pseudo:'Léa R.', avatar:'🎸', instrument:'Guitare', city:'Lyon', looking:'collaboration' },
  { pseudo:'Marco D.', avatar:'🎹', instrument:'Piano', city:'Paris', looking:'rencontre' },
  { pseudo:'Sophie L.', avatar:'🎤', instrument:'Chant', city:'Bordeaux', looking:'rencontre' },
  { pseudo:'Nico B.', avatar:'🎧', instrument:'DJ', city:'Marseille', looking:'collaboration' },
]

// ── Visiteur : profils couleurs ───────────────────────────────────────────────
const VISITOR_COLORS = [
  { bg:'#FFF0F5', color:'#C0345A', border:'#E07A9A' },
  { bg:'#F0F7FD', color:'#2A6090', border:'#6BB8E8' },
  { bg:'#F0FBF4', color:'#2A7A4A', border:'#52C07A' },
  { bg:'#F5F0FC', color:'#5040A0', border:'#A78BDB' },
]

export default function SalonsPage({ user }: Props) {
  const { theme: tk } = useTheme()

  // Alias thème — simplifie le JSX
  const BG      = tk.bg2        // fond de page
  const SURF    = tk.surface    // cartes / panneaux
  const BDR     = tk.border     // bordures
  const TXT     = tk.text       // texte principal
  const MUT     = tk.textMuted  // texte secondaire

  const now = () => { const d = new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}` }

  // ── Mode visiteur ou membre ────────────────────────────────────────────────
  const [visitorPseudo, setVisitorPseudo] = useState('')
  const [visitorInput,  setVisitorInput]  = useState('')
  const [isVisitor,     setIsVisitor]     = useState(!user)
  const [visitorReady,  setVisitorReady]  = useState(!!user)
  const visitorColor = VISITOR_COLORS[visitorPseudo.length % 4]

  const myPseudo = user ? (user.email?.split('@')[0] || 'Moi') : visitorPseudo
  const myAvatar = user ? '🎵' : '👤'

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [salon,    setSalon]    = useState(SALONS[0])
  const [catFilter,setCatFilter]= useState('Tous')
  const [allMsgs,  setAllMsgs]  = useState<Record<string,Msg[]>>(INIT_MSGS)
  const [input,    setInput]    = useState('')
  const [warning,  setWarning]  = useState('')
  const [translateOn, setTranslateOn] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  // ── Matching ─────────────────────────────────────────────────────────────
  const [matchSuggestion, setMatchSuggestion] = useState<typeof MATCH_PROFILES[0]|null>(null)
  const [matchDismissed,  setMatchDismissed]  = useState(false)
  const [showSignupPrompt,setShowSignupPrompt]= useState(false)

  // ── Panneau inscription depuis salon ──────────────────────────────────────
  const [showInscription, setShowInscription] = useState(false)

  const messages = allMsgs[salon.id] || [{id:'1',author:'VibzGuard',avatar:'🤖',content:`🛡️ Bienvenue dans ${salon.name} !`,isBot:true,time:''}]

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages, salon])

  useEffect(() => {
    // Suggestion de match après 3 messages dans les salons rencontres
    const MATCH_SALONS = ['10','11','12']
    const userMsgs = (allMsgs[salon.id]||[]).filter(m=>m.author===myPseudo)
    if (userMsgs.length >= 3 && !matchDismissed && !matchSuggestion && MATCH_SALONS.includes(salon.id)) {
      const idx = Math.floor(Math.random()*MATCH_PROFILES.length)
      setMatchSuggestion(MATCH_PROFILES[idx])
    }
  }, [allMsgs, salon, myPseudo, matchDismissed, matchSuggestion])

  const selectSalon = (s: typeof SALONS[0]) => {
    setSalon(s)
    setMatchSuggestion(null)
    setMatchDismissed(false)
    if (s.id==='12') setTranslateOn(true) // salon International = id 12
  }

  const addMsg = (msg: Omit<Msg,'id'>) => {
    setAllMsgs(prev => ({
      ...prev,
      [salon.id]: [...(prev[salon.id]||[]), { ...msg, id:Date.now().toString() }]
    }))
  }

  const send = () => {
    if (!input.trim()) return
    // Visiteur limité à 10 messages → invite à s'inscrire
    const myMsgsCount = (allMsgs[salon.id]||[]).filter(m=>m.author===myPseudo).length
    if (isVisitor && myMsgsCount >= 10) { setShowSignupPrompt(true); return }

    const result = moderateMessage(input)
    if (result.isBlocked) { setWarning(result.suggestion||''); setTimeout(()=>setWarning(''),4000); return }

    addMsg({ author:myPseudo, avatar:myAvatar, content:input, time:now() })
    setInput('')

    if (result.isWarning) {
      setTimeout(() => addMsg({author:'VibzGuard',avatar:'🤖',content:getIAGuardMessage(result),isBot:true,time:now()}), 600)
    }
  }

  const filteredSalons = catFilter==='Tous' ? SALONS : SALONS.filter(s=>s.cat===catFilter)

  // ── ÉCRAN VISITEUR ────────────────────────────────────────────────────────
  if (!visitorReady) {
    return (
      <div style={{ minHeight:'calc(100vh - 60px)', background:BG, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:font }}>
        <div style={{ background:SURF, borderRadius:24, padding:36, width:'100%', maxWidth:440, boxShadow:`0 8px 40px ${blue}18`, border:`1.5px solid ${BDR}` }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>💬</div>
            <div style={{ fontSize:22, fontWeight:800, color:TXT, marginBottom:6 }}>Rejoindre les Salons</div>
            <div style={{ fontSize:13, color:MUT, lineHeight:1.6 }}>
              Entre un pseudo pour accéder aux salons en mode visiteur, ou connecte-toi pour accéder à toutes les fonctionnalités.
            </div>
          </div>

          {/* Connexion visiteur */}
          <div style={{ background:BG, borderRadius:16, padding:20, marginBottom:16, border:`1.5px solid ${BDR}` }}>
            <div style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:12 }}>👤 Entrer en visiteur</div>
            <input
              value={visitorInput}
              onChange={e=>setVisitorInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&visitorInput.trim().length>=2&&(setVisitorPseudo(visitorInput.trim()),setIsVisitor(true),setVisitorReady(true))}
              placeholder="Ton pseudo (ex: guitar_fan)"
              style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${BDR}`, borderRadius:12, fontSize:14, fontFamily:font, outline:'none', background:SURF, color:TXT, boxSizing:'border-box', marginBottom:10 }}
            />
            <div style={{ fontSize:11, color:MUT, marginBottom:12 }}>Limité à 10 messages par salon · Sans inscription</div>
            <button
              disabled={visitorInput.trim().length < 2}
              onClick={() => { setVisitorPseudo(visitorInput.trim()); setIsVisitor(true); setVisitorReady(true) }}
              style={{
                width:'100%', padding:'12px', borderRadius:14, border:'none', cursor: visitorInput.trim().length<2 ? 'not-allowed' : 'pointer',
                background: visitorInput.trim().length<2 ? '#F0F2F8' : `linear-gradient(135deg,${blue},${green})`,
                color: visitorInput.trim().length<2 ? '#B0B8CC' : 'white',
                fontWeight:800, fontSize:14, fontFamily:font,
              }}
            >Entrer dans les salons →</button>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0', color:MUT, fontSize:12, fontWeight:700 }}>
            <div style={{ flex:1, height:1, background:BDR }}/> ou <div style={{ flex:1, height:1, background:BDR }}/>
          </div>

          {/* Connexion membre */}
          <button
            onClick={() => window.location.href='/'}
            style={{ width:'100%', padding:'12px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:14, fontFamily:font }}
          >🔑 Se connecter / S&apos;inscrire à Vibz</button>
          <div style={{ fontSize:11, color:MUT, textAlign:'center', marginTop:10 }}>
            Accès illimité · Matchs · Messagerie privée · Profil complet
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', minHeight:'calc(100vh - 60px)', background:BG, fontFamily:font }}>

      {/* ── SIDEBAR SALONS — Arborescence ── */}
      <div style={{ borderRight:`1.5px solid ${BDR}`, background:SURF, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'12px 10px 8px', borderBottom:`1.5px solid ${BDR}` }}>
          <div style={{ fontSize:12, fontWeight:800, color:TXT, marginBottom:8 }}>🎵 Salons Vibz</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
            {CATS.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                border: catFilter===cat ? `1.5px solid ${pink}` : `1.5px solid ${BDR}`,
                background: catFilter===cat ? `${pink}18` : '#F8FBFF',
                color: catFilter===cat ? pink : '#9BA8C0',
                cursor:'pointer', fontFamily:font,
              }}>{cat}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'6px 6px' }}>
          {BRANCHES.map(branch => {
            const branchSalons = SALONS.filter(s => branch.ids.includes(s.id))
            const visible = catFilter==='Tous' || branchSalons.some(s=>s.cat===catFilter)
            if (!visible) return null
            return (
              <div key={branch.id} style={{ marginBottom:6 }}>
                {/* Racine de branche */}
                <div style={{
                  padding:'5px 8px', fontSize:10, fontWeight:800,
                  color: branch.color, letterSpacing:0.3,
                  borderLeft:`3px solid ${branch.color}`,
                  background:`${branch.color}0D`,
                  borderRadius:'0 8px 8px 0',
                  marginBottom:3,
                }}>{branch.label}</div>

                {/* Sous-thèmes (feuilles) */}
                {branchSalons.filter(s=> catFilter==='Tous'||s.cat===catFilter).map((s,i,arr) => {
                  const active = salon.id===s.id
                  const isLast = i===arr.length-1
                  return (
                    <div key={s.id} style={{ display:'flex', alignItems:'flex-start', paddingLeft:6, marginBottom:isLast?0:2 }}>
                      {/* Connecteur arbre */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:4, paddingTop:4, width:12, flexShrink:0 }}>
                        <div style={{ width:1, height:8, background:'#DEE4F0' }}/>
                        <div style={{ width:10, height:1, background:'#DEE4F0' }}/>
                        {!isLast && <div style={{ width:1, flex:1, background:'#DEE4F0' }}/>}
                      </div>
                      <div
                        style={{
                          flex:1, padding:'7px 8px', borderRadius:10, marginBottom:0,
                          border: active ? `1.5px solid ${s.color}` : '1.5px solid transparent',
                          background: active ? `${s.color}13` : 'transparent',
                          cursor:'pointer', transition:'all 0.1s',
                        }}
                        onClick={() => selectSalon(s)}
                        onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background='#F8FBFF' }}
                        onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background='transparent' }}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                          <span style={{ fontSize:14 }}>{s.icon}</span>
                          <div style={{ fontSize:11, fontWeight:700, color: active ? s.color : '#1A1E2E', lineHeight:1.2 }}>{s.name}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:3, paddingLeft:1 }}>
                          <div style={{ width:5, height:5, borderRadius:'50%', background:active?s.color:'#52C07A', opacity:0.7 }}/>
                          <span style={{ fontSize:9, color:MUT }}>{s.count} en ligne</span>
                          {s.hasMod && <span style={{ fontSize:8, fontWeight:700, padding:'0 4px', borderRadius:4, background:'#FBF3EA', color:'#C07040' }}>MOD</span>}
                          <span style={{ fontSize:8, fontWeight:700, padding:'0 4px', borderRadius:4, background:'#F0FBF4', color:'#2A7A4A' }}>IA</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Bannière inscription depuis sidebar */}
        {isVisitor && (
          <div style={{ padding:12, borderTop:`1.5px solid ${BDR}`, background:`${pink}08` }}>
            <div style={{ fontSize:11, fontWeight:700, color:TXT, marginBottom:4 }}>✨ Profil complet + matchs</div>
            <div style={{ fontSize:10, color:MUT, marginBottom:8 }}>Inscris-toi pour accéder à tout Vibz</div>
            <button onClick={() => setShowInscription(true)} style={{
              width:'100%', padding:'9px', borderRadius:12, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font,
            }}>Rejoindre Vibz →</button>
          </div>
        )}
      </div>

      {/* ── ZONE CHAT ── */}
      <div style={{ display:'flex', flexDirection:'column' }}>

        {/* Header salon */}
        <div style={{
          padding:'12px 20px', borderBottom:`1.5px solid ${BDR}`,
          background:SURF, display:'flex', alignItems:'center', gap:10,
          boxShadow:'0 2px 8px rgba(107,184,232,0.06)',
        }}>
          <span style={{ fontSize:26 }}>{salon.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:TXT }}>{salon.name}</div>
            <div style={{ fontSize:11, color:MUT }}>
              {salon.count} connectés · {salon.hasMod ? 'Modéré humain + IA' : 'Modéré par IA'} · {salon.cat}
            </div>
          </div>

          {/* Visiteur badge + limite */}
          {isVisitor && (
            <div style={{ padding:'5px 12px', borderRadius:20, background:`${blue}18`, border:`1px solid ${blue}44`, fontSize:11, fontWeight:700, color:blue }}>
              👤 Visiteur · {10 - ((allMsgs[salon.id]||[]).filter(m=>m.author===myPseudo).length)} msg restants
            </div>
          )}

          {/* Traduction salon international */}
          {salon.id==='12' && (
            <button onClick={() => setTranslateOn(v=>!v)} style={{
              padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:font,
              border: `1.5px solid ${translateOn?green:'#EEF2FA'}`,
              background: translateOn ? `${green}18` : 'white',
              color: translateOn ? green : '#9BA8C0',
            }}>🌍 Traduction {translateOn?'ON':'OFF'}</button>
          )}

          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', background:`${green}18`, borderRadius:20, fontSize:11, fontWeight:700, color:green }}>
            <div style={{ width:7, height:7, background:green, borderRadius:'50%' }}/>
            IA Guard
          </div>
        </div>

        {/* Suggestion de match */}
        {matchSuggestion && !matchDismissed && (
          <div className="animate-slide-up" style={{
            margin:'12px 20px 0', padding:'14px 18px', borderRadius:16,
            background:`linear-gradient(135deg,${pink}18,${blue}18)`,
            border:`1.5px solid ${pink}33`, display:'flex', alignItems:'center', gap:14,
          }}>
            <div style={{ fontSize:32 }}>{matchSuggestion.avatar}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:2 }}>
                💘 Match potentiel : <span style={{ color:pink }}>{matchSuggestion.pseudo}</span>
              </div>
              <div style={{ fontSize:11, color:MUT }}>
                {matchSuggestion.instrument} · {matchSuggestion.city} · Cherche {matchSuggestion.looking}
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {isVisitor ? (
                <button onClick={() => setShowInscription(true)} style={{
                  padding:'8px 14px', borderRadius:12, border:'none', cursor:'pointer',
                  background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font,
                }}>❤️ S&apos;inscrire pour matcher</button>
              ) : (
                <button style={{
                  padding:'8px 14px', borderRadius:12, border:'none', cursor:'pointer',
                  background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font,
                }}>❤️ Liker</button>
              )}
              <button onClick={() => setMatchDismissed(true)} style={{ padding:'8px 12px', borderRadius:12, border:`1.5px solid ${BDR}`, background:SURF, cursor:'pointer', fontSize:12, color:MUT, fontFamily:font }}>✕</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex:1, padding:'16px 20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:10, maxHeight:'calc(100vh - 280px)' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              {/* Avatar */}
              <div style={{
                width:32, height:32, borderRadius:'50%', flexShrink:0, fontSize:msg.isBot?16:14,
                background: msg.isBot ? '#FBF3EA' : `${salon.color}18`,
                border: msg.isBot ? '1.5px solid #E8A06A44' : `1.5px solid ${salon.color}33`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {msg.avatar}
              </div>

              <div style={{ maxWidth:520 }}>
                {/* Auteur */}
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:12, fontWeight:700, color: msg.isBot?'#C07040':msg.isMod?salon.color:TXT }}>
                    {msg.author}
                  </span>
                  {msg.isMod && <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:6, background:'#FBF3EA', color:'#C07040' }}>MOD</span>}
                  {msg.isBot && <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:6, background:'#F0FBF4', color:'#2A7A4A' }}>IA</span>}
                  {msg.time && <span style={{ fontSize:10, color:MUT }}>{msg.time}</span>}
                </div>

                {/* Contenu */}
                <div style={{
                  padding: msg.isBot ? '8px 12px' : '8px 12px',
                  background: msg.isBot ? '#FBF3EA' : 'white',
                  borderLeft: msg.isBot ? '3px solid #E8A06A' : 'none',
                  borderRadius: msg.isBot ? '0 10px 10px 0' : '4px 12px 12px 12px',
                  border: msg.isBot ? undefined : `1.5px solid ${BDR}`,
                  fontSize:13, lineHeight:1.5, color: msg.isBot ? tk.modText : TXT,
                }}>
                  {msg.content}
                  {/* Carte musicale si le message contient un lien reconnu */}
                  {!msg.isBot && extractMusicUrl(msg.content) && (
                    <MusicCard url={extractMusicUrl(msg.content)!} compact />
                  )}
                </div>

                {/* Traduction */}
                {salon.id==='12' && translateOn && msg.lang && msg.translated && (
                  <div style={{ marginTop:5, padding:'6px 10px', background:`${blue}18`, borderRadius:'0 8px 8px 0', borderLeft:`3px solid ${blue}`, fontSize:12, color:'#2A6090' }}>
                    <span style={{ fontSize:9, fontWeight:700, opacity:0.7 }}>{msg.lang} → 🌍 Traduit</span>
                    <div style={{ fontWeight:700, marginTop:2 }}>{msg.translated}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        {/* Zone saisie */}
        <div style={{ padding:'12px 16px', borderTop:`1.5px solid ${BDR}`, background:SURF, display:'flex', flexDirection:'column', gap:8 }}>
          {warning && (
            <div style={{ padding:'10px 14px', background:'#FBF3EA', color:'#7A4A20', borderRadius:10, fontSize:13, fontWeight:600, borderLeft:`3px solid #E8A06A` }}>
              🛡️ VibzGuard : {warning}
            </div>
          )}

          {showSignupPrompt && (
            <div className="animate-slide-up" style={{ padding:'12px 16px', background:`${pink}11`, borderRadius:12, border:`1.5px solid ${pink}33`, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:20 }}>⚡</span>
              <div style={{ flex:1, fontSize:12, color:TXT, fontWeight:600 }}>Tu as atteint la limite visiteur (10 messages). Inscris-toi gratuitement pour continuer !</div>
              <button onClick={() => setShowInscription(true)} style={{ padding:'8px 14px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font, whiteSpace:'nowrap' }}>
                S&apos;inscrire →
              </button>
            </div>
          )}

          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:`${salon.color}18`, border:`1.5px solid ${salon.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
              {myAvatar}
            </div>
            <input
              style={{ flex:1, padding:'10px 16px', border:`1.5px solid ${BDR}`, borderRadius:24, fontSize:13, fontFamily:font, outline:'none', background:BG, color:TXT }}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&send()}
              placeholder={`Écrire dans ${salon.name}... (en tant que ${myPseudo})`}
            />
            <button onClick={send} style={{
              width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer',
              background:`linear-gradient(135deg,${salon.color},${blue})`,
              color:'white', fontSize:16,
              boxShadow:`0 4px 12px ${salon.color}44`,
            }}>➤</button>
          </div>
        </div>
      </div>

      {/* ── MODAL INSCRIPTION depuis salon ── */}
      {showInscription && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(26,30,46,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setShowInscription(false)}>
          <div onClick={e=>e.stopPropagation()} className="animate-slide-up" style={{
            background:SURF, borderRadius:24, width:'100%', maxWidth:440, padding:32,
            boxShadow:`0 24px 64px ${pink}22`, border:`1.5px solid ${BDR}`, textAlign:'center',
          }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🦋</div>
            <div style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:6 }}>Rejoins Vibz gratuitement</div>
            <div style={{ fontSize:13, color:MUT, lineHeight:1.7, marginBottom:24 }}>
              Crée ton profil complet, accès illimité aux salons, messagerie privée, likes, matchs musicaux et bien plus.
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
              {[
                { icon:'❤️', label:'Matchs musicaux illimités' },
                { icon:'💬', label:'Messagerie privée rétro années 2000' },
                { icon:'🎸', label:'Profil avec tes instruments' },
                { icon:'🛡️', label:'IA Guard anti-harcèlement' },
              ].map(f => (
                <div key={f.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:BG, borderRadius:12, border:`1.5px solid ${BDR}` }}>
                  <span style={{ fontSize:18 }}>{f.icon}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:TXT }}>{f.label}</span>
                </div>
              ))}
            </div>

            <button onClick={() => window.location.href='/'} style={{
              width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer',
              background:`linear-gradient(135deg,${pink},${blue})`, color:'white',
              fontWeight:800, fontSize:15, fontFamily:font,
              boxShadow:`0 6px 20px ${pink}33`,
            }}>S&apos;inscrire gratuitement →</button>

            <div style={{ marginTop:12, fontSize:11, color:MUT }}>
              Déjà inscrit ? <span style={{ color:pink, cursor:'pointer', fontWeight:700 }} onClick={() => window.location.href='/'}>Se connecter</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
