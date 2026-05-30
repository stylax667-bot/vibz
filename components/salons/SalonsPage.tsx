import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { moderateMessage, getIAGuardMessage } from '../../lib/moderation'
import { useTheme } from '../../lib/theme'
import MusicCard, { extractMusicUrl } from '../shared/MusicCard'
import VinylMixCreator, { type MixSalon } from '../shared/VinylMixCreator'

interface Props { user: User | null; initialSalonId?: string | null }

const font  = 'Nunito, sans-serif'
const pink  = '#E07A9A'
const green = '#52C07A'
const blue  = '#6BB8E8'

// ── 12 salons principaux ──────────────────────────────────────────────────────
const MAIN_SALONS = [
  { id:'1',  icon:'🎸', name:'Rock · Metal · Punk',       count:47,  cat:'Styles',      color:'#E07A9A', hasMod:true  },
  { id:'2',  icon:'🎷', name:'Jazz · Blues · Soul',        count:23,  cat:'Styles',      color:'#6BB8E8', hasMod:false },
  { id:'3',  icon:'🎧', name:'Électro · Hip-Hop · Urbain', count:56,  cat:'Styles',      color:'#A78BDB', hasMod:true  },
  { id:'4',  icon:'🎸', name:'Cordes',                    count:31,  cat:'Instruments', color:'#52C07A', hasMod:false },
  { id:'5',  icon:'🥁', name:'Rythme & Percussions',      count:19,  cat:'Instruments', color:'#E07A9A', hasMod:false },
  { id:'6',  icon:'🎹', name:'Claviers · Voix · Chœurs',  count:28,  cat:'Instruments', color:'#6BB8E8', hasMod:true  },
  { id:'7',  icon:'🎪', name:'Concerts à ne pas louper',  count:88,  cat:'Événements',  color:'#52C07A', hasMod:true  },
  { id:'8',  icon:'🏟️', name:'Festivals & Scènes',        count:62,  cat:'Événements',  color:'#6BB8E8', hasMod:false },
  { id:'9',  icon:'📢', name:'Casting & Annonces',         count:38,  cat:'Événements',  color:'#E07A9A', hasMod:true  },
  { id:'10', icon:'❤️', name:'Coup de foudre musical',    count:74,  cat:'Rencontres',  color:'#E07A9A', hasMod:true  },
  { id:'11', icon:'🤝', name:'Collabs & Duos',             count:44,  cat:'Rencontres',  color:'#52C07A', hasMod:true  },
  { id:'12', icon:'🌍', name:'International & Multilingue',count:201, cat:'Rencontres',  color:'#6BB8E8', hasMod:true  },
]

// ── 26 salons par genre musical ───────────────────────────────────────────────
const GENRE_SALONS = [
  { id:'13', icon:'🎸', name:'Rock',                count:42, cat:'Styles', color:'#E8395A', hasMod:false },
  { id:'14', icon:'🤘', name:'Métal',               count:28, cat:'Styles', color:'#CC2200', hasMod:false },
  { id:'15', icon:'⚡', name:'Punk · Hardcore',      count:19, cat:'Styles', color:'#FF5722', hasMod:false },
  { id:'16', icon:'🌧️', name:'Grunge · Alternative', count:22, cat:'Styles', color:'#795548', hasMod:false },
  { id:'17', icon:'🌿', name:'Indie Rock · Post-Rock',count:31,cat:'Styles', color:'#9C27B0', hasMod:false },
  { id:'18', icon:'🎵', name:'Blues',               count:15, cat:'Styles', color:'#1565C0', hasMod:false },
  { id:'19', icon:'🎤', name:'Soul · Gospel',       count:24, cat:'Styles', color:'#FF8F00', hasMod:false },
  { id:'20', icon:'🕺', name:'R&B · Funk',          count:36, cat:'Styles', color:'#7B1FA2', hasMod:false },
  { id:'21', icon:'🪩', name:'Disco · Groove',      count:18, cat:'Styles', color:'#E91E63', hasMod:false },
  { id:'22', icon:'🏠', name:'House · Deep House',  count:44, cat:'Styles', color:'#FF4081', hasMod:true  },
  { id:'23', icon:'🔊', name:'Techno · Industrial', count:38, cat:'Styles', color:'#546E7A', hasMod:true  },
  { id:'24', icon:'🌌', name:'Trance · Psytrance',  count:27, cat:'Styles', color:'#7C4DFF', hasMod:false },
  { id:'25', icon:'🥁', name:'Drum & Bass · Jungle',count:33, cat:'Styles', color:'#FF6D00', hasMod:false },
  { id:'26', icon:'🔈', name:'Dubstep · Bass Music',count:21, cat:'Styles', color:'#64DD17', hasMod:false },
  { id:'27', icon:'🌊', name:'Ambient · Drone',     count:12, cat:'Styles', color:'#80CBC4', hasMod:false },
  { id:'28', icon:'🌆', name:'Synthwave · Retrowave',count:29,cat:'Styles', color:'#CE93D8', hasMod:false },
  { id:'29', icon:'☁️', name:'Lo-fi · Chillhop',   count:51, cat:'Styles', color:'#A5D6A7', hasMod:false },
  { id:'30', icon:'🎤', name:'Trap · Cloud Rap',    count:45, cat:'Styles', color:'#607D8B', hasMod:true  },
  { id:'31', icon:'🌸', name:'Pop · Dance Pop',     count:67, cat:'Styles', color:'#F06292', hasMod:true  },
  { id:'32', icon:'💫', name:'K-Pop · J-Pop',       count:89, cat:'Styles', color:'#FF80AB', hasMod:true  },
  { id:'33', icon:'🎻', name:'Classique · Opéra',   count:16, cat:'Styles', color:'#A1887F', hasMod:false },
  { id:'34', icon:'🪕', name:'Folk · Acoustique',   count:34, cat:'Styles', color:'#8BC34A', hasMod:false },
  { id:'35', icon:'🤠', name:'Country · Bluegrass', count:14, cat:'Styles', color:'#FFA726', hasMod:false },
  { id:'36', icon:'🌴', name:'Reggae · Ska · Dub',  count:26, cat:'Styles', color:'#4CAF50', hasMod:false },
  { id:'37', icon:'💃', name:'Latin · Bossa Nova',  count:31, cat:'Styles', color:'#F44336', hasMod:false },
  { id:'38', icon:'🌍', name:'World · Afrobeat',    count:23, cat:'Styles', color:'#E65100', hasMod:false },
]

// ── Salons instruments — liste exhaustive ─────────────────────────────────────
const INSTR_SALONS = [
  // Cordes
  { id:'39', icon:'🎸', name:'Guitare électrique',         count:54, cat:'Instruments', color:'#52C07A', hasMod:false },
  { id:'40', icon:'🎸', name:'Guitare acoustique · Folk',   count:38, cat:'Instruments', color:'#6DBF6D', hasMod:false },
  { id:'41', icon:'🎸', name:'Guitare basse',               count:29, cat:'Instruments', color:'#3DAD7A', hasMod:false },
  { id:'42', icon:'🎻', name:'Violon · Alto',               count:18, cat:'Instruments', color:'#8BC34A', hasMod:false },
  { id:'43', icon:'🎻', name:'Violoncelle · Contrebasse',   count:11, cat:'Instruments', color:'#558B2F', hasMod:false },
  { id:'44', icon:'🪕', name:'Ukulélé · Mandoline · Banjo', count:22, cat:'Instruments', color:'#9CCC65', hasMod:false },
  { id:'45', icon:'🎵', name:'Harpe · Sitar · Luth',        count:8,  cat:'Instruments', color:'#AED581', hasMod:false },
  // Claviers / Électronique
  { id:'46', icon:'🎹', name:'Piano acoustique',            count:32, cat:'Instruments', color:'#29B6F6', hasMod:false },
  { id:'47', icon:'🎹', name:'Piano numérique · Claviers',  count:27, cat:'Instruments', color:'#0288D1', hasMod:false },
  { id:'48', icon:'🎛️', name:'Synthétiseur · Modulaire',   count:35, cat:'Instruments', color:'#7C4DFF', hasMod:false },
  { id:'49', icon:'🎹', name:'Orgue · Hammond',             count:14, cat:'Instruments', color:'#5E35B1', hasMod:false },
  { id:'50', icon:'🪗', name:'Accordéon · Harmonica',       count:16, cat:'Instruments', color:'#AB47BC', hasMod:false },
  { id:'51', icon:'🎧', name:'Beatmaking · MPC · Launchpad',count:43, cat:'Instruments', color:'#8E24AA', hasMod:true  },
  // Percussions
  { id:'52', icon:'🥁', name:'Batterie acoustique',         count:41, cat:'Instruments', color:'#EF5350', hasMod:false },
  { id:'53', icon:'🥁', name:'Batterie électronique',       count:28, cat:'Instruments', color:'#E53935', hasMod:false },
  { id:'54', icon:'🪘', name:'Cajon · Djembé · Congas',     count:19, cat:'Instruments', color:'#FF7043', hasMod:false },
  { id:'55', icon:'🪘', name:'Percussions latines',         count:13, cat:'Instruments', color:'#FF5722', hasMod:false },
  { id:'56', icon:'🎵', name:'Marimba · Xylophone · Vibes', count:9,  cat:'Instruments', color:'#FFCA28', hasMod:false },
  { id:'57', icon:'🎵', name:'Hang drum · Handpan',         count:12, cat:'Instruments', color:'#FFB300', hasMod:false },
  // Vents
  { id:'58', icon:'🎷', name:'Saxophone',                   count:26, cat:'Instruments', color:'#FF8F00', hasMod:false },
  { id:'59', icon:'🎺', name:'Trompette · Bugle',           count:17, cat:'Instruments', color:'#FFA000', hasMod:false },
  { id:'60', icon:'🎺', name:'Trombone · Tuba',             count:11, cat:'Instruments', color:'#F57F17', hasMod:false },
  { id:'61', icon:'🎵', name:'Clarinette · Hautbois · Basson',count:14,cat:'Instruments', color:'#6D4C41', hasMod:false },
  { id:'62', icon:'🎵', name:'Flûte traversière',           count:19, cat:'Instruments', color:'#80CBC4', hasMod:false },
  { id:'63', icon:'🎵', name:'Cor · Cor anglais',           count:8,  cat:'Instruments', color:'#26A69A', hasMod:false },
  { id:'64', icon:'🎵', name:'Cornemuse · Flûte irlandaise',count:10, cat:'Instruments', color:'#00897B', hasMod:false },
  // Voix
  { id:'65', icon:'🎤', name:'Chant classique · Lyrique',   count:21, cat:'Instruments', color:'#EC407A', hasMod:false },
  { id:'66', icon:'🎤', name:'Chant pop · Rock · Indie',    count:48, cat:'Instruments', color:'#E91E63', hasMod:true  },
  { id:'67', icon:'🎤', name:'Rap · Slam · Spoken word',    count:37, cat:'Instruments', color:'#AD1457', hasMod:true  },
  { id:'68', icon:'🎤', name:'Beatbox',                     count:16, cat:'Instruments', color:'#880E4F', hasMod:false },
  { id:'69', icon:'🎶', name:'Chœurs · Harmonies vocales',  count:23, cat:'Instruments', color:'#F06292', hasMod:false },
  // Production / Autres
  { id:'70', icon:'🎧', name:'DJ · Platines · Mixage',      count:52, cat:'Instruments', color:'#546E7A', hasMod:true  },
  { id:'71', icon:'💻', name:'Producteur · DAW · Studio',   count:61, cat:'Instruments', color:'#37474F', hasMod:true  },
  { id:'72', icon:'🎸', name:'Guitare électro · Pédaliers', count:24, cat:'Instruments', color:'#455A64', hasMod:false },
  { id:'73', icon:'🎵', name:'Lap steel · Pedal steel',     count:7,  cat:'Instruments', color:'#78909C', hasMod:false },
  { id:'74', icon:'🎵', name:'Theremin · Instruments rares',count:6,  cat:'Instruments', color:'#90A4AE', hasMod:false },
]

const SALONS = [...MAIN_SALONS, ...GENRE_SALONS, ...INSTR_SALONS]

const STYLE_IDS = SALONS.filter(s => s.cat === 'Styles').map(s => s.id)
const INSTR_IDS = SALONS.filter(s => s.cat === 'Instruments').map(s => s.id)

const BRANCHES = [
  { id:'styles',      label:'🎼 Styles musicaux',       ids: STYLE_IDS, color:'#E07A9A' },
  { id:'instruments', label:'🎵 Instruments pratiqués', ids: INSTR_IDS, color:'#52C07A' },
  { id:'evenements',  label:'🎤 Concerts & Événements', ids:['7','8','9'],       color:'#6BB8E8' },
  { id:'rencontres',  label:'💑 Rencontres musicales',  ids:['10','11','12'],    color:'#E07A9A' },
]

const CATS = ['Tous', 'Styles', 'Instruments', 'Événements', 'Rencontres']

type Msg = {
  id: string; author: string; avatar: string; content: string
  isMod?: boolean; isBot?: boolean; lang?: string; translated?: string; time: string
}

const INIT_MSGS: Record<string, Msg[]> = {
  '1':  [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Rock·Metal·Punk — Partagez votre passion, restez bienveillants.',isBot:true,time:''},
    {id:'2',author:'Éric (Modo)',avatar:'🎸',content:'Quelqu\'un connaît de bons concerts metal à Lyon ce mois-ci ? 🤘',isMod:true,time:'20:14'},
    {id:'3',author:'Léa R.',avatar:'🎵',content:'Gojira au Transbordeur le 12 novembre, fonce 🔥',time:'20:15'},
  ],
  '2':  [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Jazz·Blues·Soul — Le salon des âmes fines.',isBot:true,time:''},
    {id:'2',author:'Pierre M.',avatar:'🎷',content:'Cherche jam session sur Paris ce week-end 🎷',time:'21:10'},
  ],
  '3':  [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Électro·Hip-Hop·Urbain — Beats, flows et drops.',isBot:true,time:''},
    {id:'2',author:'Nico B.',avatar:'🎧',content:'Qui connaît des événements drum & bass en région parisienne ? 🎧',time:'19:30'},
    {id:'3',author:'Malia K.',avatar:'🎤',content:'Le Concrete ce samedi ! Lineup de folie 🔊',time:'19:31'},
  ],
  '4':  [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Cordes — Guitaristes, bassistes, violonistes…',isBot:true,time:''},
    {id:'2',author:'Sam G.',avatar:'🎸',content:'Quelqu\'un bosse le fingerstyle ? 🎸',time:'17:00'},
  ],
  '5':  [{id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Rythme & Percussions — Le temple du groove.',isBot:true,time:''}],
  '6':  [{id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Claviers·Voix·Chœurs — Tous les timbres ici.',isBot:true,time:''}],
  '7':  [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Concerts — Partagez vos dates et coups de cœur !',isBot:true,time:''},
    {id:'2',author:'Marie F.',avatar:'🎪',content:'Coldplay à Saint-Denis en juillet — qui y va ? 🎪',time:'15:00'},
  ],
  '8':  [{id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Festivals & Scènes — Bons plans et open mics.',isBot:true,time:''}],
  '9':  [{id:'1',author:'VibzGuard',avatar:'🤖',content:'🛡️ Casting & Annonces — Cherche musicien, groupe qui recrute.',isBot:true,time:''}],
  '10': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'💑 Coup de foudre musical — Bienveillance et authenticité.',isBot:true,time:''},
    {id:'2',author:'Sophie L.',avatar:'🎤',content:'Qui est musicien(ne) ici ? Je cherche quelqu\'un qui vibre 😊',time:'19:30'},
    {id:'3',author:'Marco D.',avatar:'🎹',content:'Moi ! Pianiste jazz passionné 🌅',time:'19:31'},
  ],
  '11': [{id:'1',author:'VibzGuard',avatar:'🤖',content:'🤝 Collabs & Duos — Créez ensemble : duo, EP, collab.',isBot:true,time:''}],
  '12': [
    {id:'1',author:'VibzGuard',avatar:'🤖',content:'🌍 International — Traduction IA activée !',isBot:true,time:''},
    {id:'2',author:'Yuki 🇯🇵',avatar:'🎸',content:'こんにちは！ギターを弾く人いますか？',lang:'🇯🇵 Japonais',translated:'Bonjour ! Y a-t-il des guitaristes ici ?',time:'18:00'},
    {id:'3',author:'Carlos 🇧🇷',avatar:'🥁',content:'Olá! Sou baterista, procuro colaborar!',lang:'🇧🇷 Portugais',translated:'Salut ! Je suis batteur, je cherche à collaborer !',time:'18:01'},
  ],
}

const MATCH_PROFILES = [
  { pseudo:'Léa R.',   avatar:'🎸', instrument:'Guitare', city:'Lyon',      looking:'collaboration' },
  { pseudo:'Marco D.', avatar:'🎹', instrument:'Piano',   city:'Paris',     looking:'rencontre'     },
  { pseudo:'Sophie L.',avatar:'🎤', instrument:'Chant',   city:'Bordeaux',  looking:'rencontre'     },
  { pseudo:'Nico B.',  avatar:'🎧', instrument:'DJ',      city:'Marseille', looking:'collaboration' },
]

const VISITOR_COLORS = [
  { bg:'#FFF0F5', color:'#C0345A', border:'#E07A9A' },
  { bg:'#F0F7FD', color:'#2A6090', border:'#6BB8E8' },
  { bg:'#F0FBF4', color:'#2A7A4A', border:'#52C07A' },
  { bg:'#F5F0FC', color:'#5040A0', border:'#A78BDB' },
]

// ── Salons mixés — stockés en localStorage ─────────────────────────────────
const MIX_KEY = 'vibz-mixed-salons'

interface MixedSalon {
  id: string; icon: string; name: string; count: number
  cat: string; color: string; hasMod: boolean
  sourceNames: string[]; createdAt: number
}

function parseMixId(mixId: string): { names: string[]; salonIds: string[] } | null {
  if (!mixId.startsWith('mix:')) return null
  const rest = mixId.slice(4)
  const [namesPart, idsPart] = rest.split('|')
  return { names: namesPart.split('+'), salonIds: idsPart ? idsPart.split('+') : [] }
}

function mixColor(names: string[]): string {
  const palette = ['#A78BDB','#E07A9A','#6BB8E8','#52C07A','#FF6D00','#7C4DFF','#00ACC1','#F06292']
  const idx = names.reduce((acc, n) => acc + n.charCodeAt(0), 0) % palette.length
  return palette[idx]
}

function mixToSalon(mixedSalon: MixedSalon): typeof SALONS[0] {
  return { id: mixedSalon.id, icon: mixedSalon.icon, name: mixedSalon.name, count: mixedSalon.count, cat: mixedSalon.cat, color: mixedSalon.color, hasMod: mixedSalon.hasMod }
}

export default function SalonsPage({ user, initialSalonId }: Props) {
  const { theme: tk } = useTheme()
  const BG   = tk.bg2; const SURF = tk.surface; const BDR = tk.border; const TXT = tk.text; const MUT = tk.textMuted

  // ── Salons mixés ────────────────────────────────────────────────────────────
  const [mixedSalons, setMixedSalons] = useState<MixedSalon[]>(() => {
    try { const s = localStorage.getItem(MIX_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  useEffect(() => { localStorage.setItem(MIX_KEY, JSON.stringify(mixedSalons)) }, [mixedSalons])
  const [mixesOpen, setMixesOpen] = useState(false)

  const getInitialSalon = () => {
    if (initialSalonId) {
      if (initialSalonId.startsWith('mix:')) {
        const parsed = parseMixId(initialSalonId)
        if (parsed) {
          const col   = mixColor(parsed.names)
          const newMix: MixedSalon = {
            id: `mix-${Date.now()}`, icon: '🎛️',
            name: parsed.names.join(' × '),
            count: Math.floor(Math.random()*18)+3,
            cat: 'Mix', color: col, hasMod: false,
            sourceNames: parsed.names, createdAt: Date.now(),
          }
          // Évite les doublons (même combinaison de noms)
          setMixedSalons(prev => {
            const already = prev.find(m => m.name === newMix.name)
            return already ? prev : [newMix, ...prev]
          })
          return mixToSalon(newMix)
        }
      }
      const found = SALONS.find(s => s.id === initialSalonId)
      if (found) return found
    }
    return SALONS[0]
  }

  const now = () => { const d = new Date(); return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}` }

  const [visitorPseudo, setVisitorPseudo] = useState('')
  const [visitorInput,  setVisitorInput]  = useState('')
  const [isVisitor,     setIsVisitor]     = useState(!user)
  const [visitorReady,  setVisitorReady]  = useState(!!user)
  const visitorColor = VISITOR_COLORS[visitorPseudo.length % 4]

  const myPseudo = user ? (user.email?.split('@')[0] || 'Moi') : visitorPseudo
  const myAvatar = user ? '🎵' : '👤'

  const [salon,      setSalon]      = useState(getInitialSalon)
  const [catFilter,  setCatFilter]  = useState('Tous')
  const [allMsgs,    setAllMsgs]    = useState<Record<string,Msg[]>>(INIT_MSGS)
  const [input,      setInput]      = useState('')
  const [warning,    setWarning]    = useState('')
  const [translateOn,setTranslateOn]= useState(true)
  const [stylesOpen,    setStylesOpen]    = useState(!!initialSalonId && GENRE_SALONS.some(s => s.id === initialSalonId))
  const [instrOpen,     setInstrOpen]     = useState(!!initialSalonId && INSTR_SALONS.some(s => s.id === initialSalonId))
  const [instrMixOpen,  setInstrMixOpen]  = useState(false)
  const [instrMixSel,   setInstrMixSel]   = useState<typeof SALONS>([])

  const toggleInstrMix = (s: typeof SALONS[0]) =>
    setInstrMixSel(prev => prev.find(x => x.id===s.id) ? prev.filter(x=>x.id!==s.id) : [...prev, s])

  const createInstrMix = () => {
    if (instrMixSel.length < 2) return
    const name = instrMixSel.map(s=>s.name).join(' × ')
    const col  = instrMixSel[0].color
    const newMix: MixedSalon = {
      id:`mix-${Date.now()}`, icon:'🎸', name, count:Math.floor(Math.random()*12)+3,
      cat:'Mix', color:col, hasMod:false,
      sourceNames: instrMixSel.map(s=>s.name), createdAt:Date.now(),
    }
    setMixedSalons(prev => prev.find(m=>m.name===name) ? prev : [newMix, ...prev])
    setSalon(mixToSalon(newMix))
    setMixesOpen(true); setInstrMixOpen(false); setInstrMixSel([])
  }
  const endRef      = useRef<HTMLDivElement>(null)
  const msgAreaRef  = useRef<HTMLDivElement>(null)

  const [matchSuggestion,  setMatchSuggestion]  = useState<typeof MATCH_PROFILES[0]|null>(null)
  const [matchDismissed,   setMatchDismissed]   = useState(false)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [showInscription,  setShowInscription]  = useState(false)
  const [showVinylMix,  setShowVinylMix]  = useState(false)
  const [mixSalons,     setMixSalons]     = useState<MixSalon[]>([])

  const handleCreateMixSalon = (name: string, selections: string[], key: string) => {
    const colors = ['#E07A9A','#6BB8E8','#52C07A','#A78BDB']
    const newMix: MixSalon = {
      id: `mix_${Date.now()}`,
      name,
      key,
      selections,
      color: colors[mixSalons.length % 4],
      memberCount: 1,
      hasMod: true,
    }
    setMixSalons(p => [...p, newMix])
    // Ouvrir le salon créé
    selectSalon({ id: newMix.id, icon:'🎛️', name: newMix.name, count:1, cat:'Mix', branch:'🎛️ Salons Mix', color: newMix.color, hasMod: true })
  }

  const handleJoinMixSalon = (mix: MixSalon) => {
    setMixSalons(p => p.map(s => s.id === mix.id ? { ...s, memberCount: s.memberCount + 1 } : s))
    selectSalon({ id: mix.id, icon:'🎛️', name: mix.name, count: mix.memberCount + 1, cat:'Mix', branch:'🎛️ Salons Mix', color: mix.color, hasMod: true })
  }

  useEffect(() => {
    if (!initialSalonId) return
    if (initialSalonId.startsWith('mix:')) {
      const parsed = parseMixId(initialSalonId)
      if (parsed) {
        const name = parsed.names.join(' × ')
        // Cherche dans les salons mixés existants ou crée
        setMixedSalons(prev => {
          const already = prev.find(m => m.name === name)
          if (already) { setSalon(mixToSalon(already)); setMixesOpen(true); return prev }
          const newMix: MixedSalon = {
            id: `mix-${Date.now()}`, icon: '🎛️', name,
            count: Math.floor(Math.random()*18)+3,
            cat: 'Mix', color: mixColor(parsed.names), hasMod: false,
            sourceNames: parsed.names, createdAt: Date.now(),
          }
          setSalon(mixToSalon(newMix))
          setMixesOpen(true)
          return [newMix, ...prev]
        })
      }
      return
    }
    const found = SALONS.find(s => s.id === initialSalonId)
    if (found) {
      setSalon(found)
      if (GENRE_SALONS.some(s => s.id === initialSalonId)) setStylesOpen(true)
    }
  }, [initialSalonId])

  const messages = allMsgs[salon.id] || [{id:'1',author:'VibzGuard',avatar:'🤖',content:`🛡️ Bienvenue dans ${salon.name} !`,isBot:true,time:''}]

  useEffect(() => {
    const el = msgAreaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, salon])

  useEffect(() => {
    const MATCH_SALONS = ['10','11','12']
    const userMsgs = (allMsgs[salon.id]||[]).filter(m=>m.author===myPseudo)
    if (userMsgs.length >= 3 && !matchDismissed && !matchSuggestion && MATCH_SALONS.includes(salon.id)) {
      setMatchSuggestion(MATCH_PROFILES[Math.floor(Math.random()*MATCH_PROFILES.length)])
    }
  }, [allMsgs, salon, myPseudo, matchDismissed, matchSuggestion])

  const selectSalon = (s: typeof SALONS[0]) => {
    setSalon(s); setMatchSuggestion(null); setMatchDismissed(false)
    if (s.id==='12') setTranslateOn(true)
  }

  const addMsg = (msg: Omit<Msg,'id'>) => {
    setAllMsgs(prev => ({ ...prev, [salon.id]: [...(prev[salon.id]||[]), { ...msg, id:Date.now().toString() }] }))
  }

  const send = () => {
    if (!input.trim()) return
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

  // ── Feuille d'arbre — lignes continues ────────────────────────────────────
  // Principe : chaque item occupe toute la hauteur de sa rangée (flex stretch).
  // La ligne verticale va de 0 → 50% (haut) et 50% → 100% (bas, sauf dernier).
  // Aucun margin entre items → les lignes se raccordent parfaitement.
  const renderLeaf = (s: typeof SALONS[0], i: number, arr: typeof SALONS) => {
    const active  = salon.id === s.id
    const isLast  = i === arr.length - 1
    const lineCol = tk.isDark ? '#2A3A5A' : '#C8D4EC'

    return (
      <div key={s.id} style={{ display:'flex', alignItems:'stretch', paddingLeft:10 }}>

        {/* ── Connecteur arbre ── */}
        <div style={{ width:24, flexShrink:0, position:'relative' }}>

          {/* Tronc haut : du bord sup jusqu'au milieu */}
          <div style={{
            position:'absolute', left:8, top:0, bottom:'50%', width:2,
            background: lineCol,
          }}/>

          {/* Tronc bas : du milieu jusqu'au bord inf (absent pour le dernier) */}
          {!isLast && <div style={{
            position:'absolute', left:8, top:'50%', bottom:0, width:2,
            background: lineCol,
          }}/>}

          {/* Branche horizontale vers la carte */}
          <div style={{
            position:'absolute', left:8, top:'50%',
            width:14, height:2,
            background: active ? s.color : lineCol,
            transform:'translateY(-50%)',
            transition:'background 0.2s',
          }}/>

          {/* Nœud — petit cercle à l'intersection */}
          <div style={{
            position:'absolute', left:5, top:'50%',
            width:7, height:7, borderRadius:'50%',
            background: active ? s.color : (tk.isDark ? '#3A4A6A' : '#B8C8E4'),
            border:`1.5px solid ${active ? s.color : (tk.isDark ? '#1C2233' : SURF)}`,
            transform:'translateY(-50%)',
            boxShadow: active ? `0 0 8px ${s.color}88` : 'none',
            transition:'all 0.2s',
            zIndex:1,
          }}/>
        </div>

        {/* ── Carte du salon ── */}
        <div style={{ flex:1, paddingTop:2, paddingBottom:2, paddingRight:4 }}>
          <div
            style={{
              padding:'6px 8px', borderRadius:10,
              border: active ? `1.5px solid ${s.color}` : `1px solid transparent`,
              background: active ? `${s.color}13` : 'transparent',
              cursor:'pointer', transition:'all 0.15s',
            }}
            onClick={() => selectSalon(s)}
            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = tk.isDark ? tk.surface2 : '#F2F6FF' }}
            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
          >
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
              <span style={{ fontSize:12 }}>{s.icon}</span>
              <div style={{ fontSize:10, fontWeight:700, color:active?s.color:TXT, lineHeight:1.2 }}>{s.name}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:active?s.color:green, opacity:0.7 }}/>
              <span style={{ fontSize:9, color:MUT }}>{s.count} en ligne</span>
              {s.hasMod && <span style={{ fontSize:8, fontWeight:700, padding:'0 4px', borderRadius:4, background:tk.modBg, color:tk.modText }}>MOD</span>}
              <span style={{ fontSize:8, fontWeight:700, padding:'0 4px', borderRadius:4, background:tk.guardBg, color:tk.guardText }}>IA</span>
            </div>
          </div>
        </div>

      </div>
    )
  }

  // En-tête de branche avec tronc descendant vers le premier enfant
  const renderBranchHeader = (label: string, color: string, toggle?: () => void, open?: boolean) => (
    <div style={{ position:'relative', marginBottom:0 }}>
      <div
        onClick={toggle}
        style={{
          padding:'6px 10px 6px 10px', fontSize:10, fontWeight:800,
          color, letterSpacing:0.4,
          borderLeft:`3px solid ${color}`,
          background: `${color}${tk.isDark?'18':'0D'}`,
          borderRadius:'0 8px 8px 0',
          cursor: toggle ? 'pointer' : 'default',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}
      >
        <span>{label}</span>
        {toggle !== undefined && <span style={{ fontSize:9, opacity:0.6 }}>{open ? '▲' : '▼'}</span>}
      </div>
      {/* Tronc descendant qui relie le header au premier enfant */}
      <div style={{
        position:'absolute', left:13, top:'100%',
        width:2, height:10,
        background: tk.isDark ? '#2A3A5A' : '#C8D4EC',
        zIndex:0,
      }}/>
    </div>
  )

  // ── ÉCRAN VISITEUR ────────────────────────────────────────────────────────
  if (!visitorReady) {
    return (
      <div style={{ minHeight:'calc(100vh - 60px)', background:BG, display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:font }}>
        <div style={{ background:SURF, borderRadius:24, padding:36, width:'100%', maxWidth:440, boxShadow:`0 8px 40px ${blue}18`, border:`1.5px solid ${BDR}` }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>💬</div>
            <div style={{ fontSize:22, fontWeight:800, color:TXT, marginBottom:6 }}>Rejoindre les Salons</div>
            <div style={{ fontSize:13, color:MUT, lineHeight:1.6 }}>Entre un pseudo pour accéder aux salons en mode visiteur, ou connecte-toi.</div>
          </div>
          <div style={{ background:BG, borderRadius:16, padding:20, marginBottom:16, border:`1.5px solid ${BDR}` }}>
            <div style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:12 }}>👤 Entrer en visiteur</div>
            <input
              value={visitorInput} onChange={e=>setVisitorInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&visitorInput.trim().length>=2&&(setVisitorPseudo(visitorInput.trim()),setIsVisitor(true),setVisitorReady(true))}
              placeholder="Ton pseudo (ex: guitar_fan)"
              style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${BDR}`, borderRadius:12, fontSize:14, fontFamily:font, outline:'none', background:SURF, color:TXT, boxSizing:'border-box', marginBottom:10 }}
            />
            <div style={{ fontSize:11, color:MUT, marginBottom:12 }}>Limité à 10 messages par salon · Sans inscription</div>
            <button
              disabled={visitorInput.trim().length < 2}
              onClick={() => { setVisitorPseudo(visitorInput.trim()); setIsVisitor(true); setVisitorReady(true) }}
              style={{ width:'100%', padding:'12px', borderRadius:14, border:'none', cursor: visitorInput.trim().length<2?'not-allowed':'pointer', background: visitorInput.trim().length<2?'#F0F2F8':`linear-gradient(135deg,${blue},${green})`, color: visitorInput.trim().length<2?'#B0B8CC':'white', fontWeight:800, fontSize:14, fontFamily:font }}
            >Entrer dans les salons →</button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'16px 0', color:MUT, fontSize:12, fontWeight:700 }}>
            <div style={{ flex:1, height:1, background:BDR }}/> ou <div style={{ flex:1, height:1, background:BDR }}/>
          </div>
          <button onClick={() => window.location.href='/'} style={{ width:'100%', padding:'12px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:14, fontFamily:font }}>
            🔑 Se connecter / S&apos;inscrire à Vibz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'230px 1fr', minHeight:'calc(100vh - 60px)', background:BG, fontFamily:font }}>

      {/* ── SIDEBAR ── */}
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
          {/* Salons Mix créés par l'utilisateur */}
          {mixSalons.length > 0 && (
            <div style={{ marginBottom:6 }}>
              <div style={{ padding:'5px 8px', fontSize:10, fontWeight:800, color:'#A78BDB', letterSpacing:0.3, borderLeft:'3px solid #A78BDB', background:'rgba(167,139,219,0.08)', borderRadius:'0 8px 8px 0', marginBottom:3 }}>
                🎛️ Mes salons Mix
              </div>
              {mixSalons.map(s => {
                const active = salon.id === s.id
                return (
                  <div key={s.id} style={{ display:'flex', alignItems:'flex-start', paddingLeft:6, marginBottom:2 }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:4, paddingTop:4, width:12, flexShrink:0 }}>
                      <div style={{ width:1, height:8, background:'#DEE4F0' }}/>
                      <div style={{ width:10, height:1, background:'#DEE4F0' }}/>
                    </div>
                    <div
                      style={{ flex:1, padding:'7px 8px', borderRadius:10, border: active ? `1.5px solid ${s.color}` : '1.5px solid transparent', background: active ? `${s.color}13` : 'transparent', cursor:'pointer', transition:'all 0.1s' }}
                      onClick={() => selectSalon(s)}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                        <span style={{ fontSize:14 }}>🎛️</span>
                        <div style={{ fontSize:11, fontWeight:700, color: active ? s.color : '#1A1E2E', lineHeight:1.2 }}>{s.name}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:3, paddingLeft:1 }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:s.color, opacity:0.7 }}/>
                        <span style={{ fontSize:9, color:'#9BA8C0' }}>Mix personnalisé</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {BRANCHES.map(branch => {
            const branchSalons = SALONS.filter(s => branch.ids.includes(s.id))
            const visible = catFilter==='Tous' || branchSalons.some(s=>s.cat===catFilter)
            if (!visible) return null

            // ── Branche Styles musicaux : collapsible ──
            if (branch.id === 'styles') {
              const mainStyles  = branchSalons.filter(s => ['1','2','3'].includes(s.id))
              const genreStyles = branchSalons.filter(s => !['1','2','3'].includes(s.id))
              const filtered    = catFilter==='Tous' ? mainStyles : branchSalons.filter(s=>s.cat===catFilter)
              const filteredGenres = catFilter==='Tous' ? genreStyles : []

              // Tous les items à afficher (3 principaux + genres si ouvert)
              const allVisible = stylesOpen
                ? [...filtered, ...filteredGenres]
                : filtered

              return (
                <div key={branch.id} style={{ marginBottom:8 }}>
                  {renderBranchHeader(branch.label, branch.color, () => setStylesOpen(v=>!v), stylesOpen)}
                  {allVisible.map((s, i, arr) => renderLeaf(s, i, arr))}
                  {/* Bouton dérouler / replier */}
                  <div onClick={() => setStylesOpen(v=>!v)} style={{ marginLeft:34, marginTop:2, padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:700, color:branch.color, background:`${branch.color}0D`, border:`1px dashed ${branch.color}55`, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
                    {stylesOpen ? `▲ Replier` : `▼ Voir ${filteredGenres.length} genres musicaux`}
                  </div>
                </div>
              )
            }

            // ── Branche Instruments : collapsible + mixer ──
            if (branch.id === 'instruments') {
              const mainInstrs  = branchSalons.filter(s => ['4','5','6'].includes(s.id))
              const extraInstrs = branchSalons.filter(s => !['4','5','6'].includes(s.id))
              const visible     = catFilter==='Tous' || branchSalons.some(s=>s.cat===catFilter)
              if (!visible) return null

              // Regroupement par famille pour l'affichage étendu
              const FAMILIES = [
                { label:'🎸 Cordes',              ids:['39','40','41','42','43','44','45'] },
                { label:'🎹 Claviers & Électro',  ids:['46','47','48','49','50','51'] },
                { label:'🥁 Percussions',          ids:['52','53','54','55','56','57'] },
                { label:'🎷 Vents',                ids:['58','59','60','61','62','63','64'] },
                { label:'🎤 Voix',                 ids:['65','66','67','68','69'] },
                { label:'🎧 Production',            ids:['70','71','72','73','74'] },
              ]

              return (
                <div key={branch.id} style={{ marginBottom:8 }}>
                  {renderBranchHeader(branch.label, branch.color, () => setInstrOpen(v=>!v), instrOpen)}

                  {/* 3 salons principaux — toujours visibles */}
                  {mainInstrs.map((s,i,arr) => renderLeaf(s,i,arr))}

                  {/* Bouton dérouler */}
                  <div onClick={() => setInstrOpen(v=>!v)} style={{ marginLeft:34, marginTop:2, padding:'4px 10px', borderRadius:8, fontSize:10, fontWeight:700, color:branch.color, background:`${branch.color}0D`, border:`1px dashed ${branch.color}55`, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
                    {instrOpen ? `▲ Replier` : `▼ Voir ${extraInstrs.length} instruments`}
                  </div>

                  {/* Instruments étendus par famille, avec sous-en-têtes */}
                  {instrOpen && FAMILIES.map(fam => {
                    const famSalons = extraInstrs.filter(s => fam.ids.includes(s.id))
                    if (!famSalons.length) return null
                    return (
                      <div key={fam.label} style={{ marginTop:6 }}>
                        {/* Sous-en-tête famille */}
                        <div style={{ position:'relative', marginLeft:10, marginBottom:0 }}>
                          <div style={{ padding:'3px 8px', fontSize:9, fontWeight:800, color:MUT, letterSpacing:0.6, textTransform:'uppercase', borderLeft:`2px solid ${tk.isDark?'#2A3A5A':'#C8D4EC'}`, background:tk.isDark?'#1C223322':'#F0F4FC44' }}>
                            {fam.label}
                          </div>
                          {/* Tronc vers premier enfant */}
                          <div style={{ position:'absolute', left:18, top:'100%', width:2, height:8, background:tk.isDark?'#2A3A5A':'#C8D4EC' }}/>
                        </div>
                        {famSalons.map((s,i,arr) => renderLeaf(s,i,arr))}
                      </div>
                    )
                  })}

                  {/* Bouton Mixer des instruments */}
                  {instrOpen && (
                    <div style={{ margin:'6px 0 2px 6px' }}>
                      <div
                        onClick={() => { setInstrMixOpen(v=>!v); setInstrMixSel([]) }}
                        style={{ padding:'6px 10px', borderRadius:8, fontSize:10, fontWeight:700, color:green, background:`${green}0D`, border:`1px dashed ${green}55`, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}
                      >
                        🎸 {instrMixOpen ? '▲ Fermer le mixeur' : '▼ Mixer des instruments →'}
                      </div>

                      {instrMixOpen && (
                        <div style={{ margin:'6px 0 0 0', padding:'8px', background:`${green}08`, borderRadius:10, border:`1px solid ${green}22` }}>
                          <div style={{ fontSize:9, color:MUT, fontWeight:700, marginBottom:6 }}>
                            Sélectionne 2+ instruments pour créer ton salon personnalisé
                          </div>
                          {/* Chips de sélection par famille */}
                          {FAMILIES.map(fam => {
                            const famAll = branchSalons.filter(s => fam.ids.includes(s.id))
                            if (!famAll.length) return null
                            return (
                              <div key={fam.label} style={{ marginBottom:5 }}>
                                <div style={{ fontSize:8, color:MUT, fontWeight:800, letterSpacing:0.5, marginBottom:3 }}>{fam.label}</div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                                  {famAll.map(s => {
                                    const sel = !!instrMixSel.find(x=>x.id===s.id)
                                    return (
                                      <div key={s.id} onClick={() => toggleInstrMix(s)} style={{ padding:'2px 7px', borderRadius:10, fontSize:9, fontWeight:700, cursor:'pointer', border:`1px solid ${s.color}`, background: sel?s.color:`${s.color}18`, color: sel?'#fff':s.color, transition:'all 0.15s' }}>
                                        {s.icon} {s.name}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                          {/* Sélection en cours */}
                          {instrMixSel.length > 0 && (
                            <div style={{ marginTop:8, padding:'6px 8px', borderRadius:8, background:`${green}15`, border:`1px solid ${green}33` }}>
                              <div style={{ fontSize:9, color:green, fontWeight:700, marginBottom:4 }}>
                                Mixage : {instrMixSel.map(s=>s.name).join(' × ')}
                              </div>
                              <button onClick={createInstrMix} disabled={instrMixSel.length < 2} style={{ width:'100%', padding:'6px', borderRadius:8, border:'none', background:instrMixSel.length>=2?`linear-gradient(135deg,${green},${blue})`:'#DDD', color:'#fff', fontWeight:800, fontSize:10, cursor:instrMixSel.length>=2?'pointer':'not-allowed', fontFamily:font }}>
                                🎸 Créer ce salon ({instrMixSel.length} instruments)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }

            // ── Autres branches : toujours dépliées ──
            const visibleItems = branchSalons.filter(s => catFilter==='Tous' || s.cat===catFilter)
            return (
              <div key={branch.id} style={{ marginBottom:8 }}>
                {renderBranchHeader(branch.label, branch.color)}
                {visibleItems.map((s, i, arr) => renderLeaf(s, i, arr))}
              </div>
            )
          })}
        </div>

        {/* ── Section Salons Mixés ── */}
        {mixedSalons.length > 0 && (
          <div style={{ borderTop:`1.5px solid ${BDR}`, padding:'6px 6px 4px' }}>
            <div
              onClick={() => setMixesOpen(v => !v)}
              style={{ padding:'5px 8px', fontSize:10, fontWeight:800, color:'#A78BDB', letterSpacing:0.3, borderLeft:`3px solid #A78BDB`, background:'#A78BDB0D', borderRadius:'0 8px 8px 0', marginBottom:3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}
            >
              <span>🎛️ Mes salons mixés ({mixedSalons.length})</span>
              <span style={{ fontSize:10, opacity:0.7 }}>{mixesOpen ? '▲' : '▼'}</span>
            </div>
            {mixesOpen && mixedSalons.map(mx => {
              const s = mixToSalon(mx)
              const active = salon.id === s.id
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'flex-start', paddingLeft:6, marginBottom:2 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginRight:4, paddingTop:4, width:12, flexShrink:0 }}>
                    <div style={{ width:1, height:8, background:'#DEE4F0' }}/><div style={{ width:10, height:1, background:'#DEE4F0' }}/>
                  </div>
                  <div
                    style={{ flex:1, padding:'7px 8px', borderRadius:10, border: active?`1.5px solid ${s.color}`:'1.5px solid transparent', background: active?`${s.color}13`:'transparent', cursor:'pointer', transition:'all 0.1s' }}
                    onClick={() => setSalon(s)}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background=BG }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background='transparent' }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                      <span style={{ fontSize:13 }}>🎛️</span>
                      <div style={{ fontSize:10, fontWeight:700, color:active?s.color:TXT, lineHeight:1.2 }}>{s.name}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      {mx.sourceNames.map(n => (
                        <span key={n} style={{ fontSize:8, padding:'0 4px', borderRadius:4, background:`${s.color}22`, color:s.color, fontWeight:700 }}>{n}</span>
                      ))}
                    </div>
                  </div>
                  <div title="Supprimer" onClick={() => { setMixedSalons(prev => prev.filter(m => m.id !== mx.id)); if (salon.id===mx.id) setSalon(SALONS[0]) }} style={{ padding:'4px 6px', cursor:'pointer', fontSize:11, color:MUT, flexShrink:0, marginTop:4 }}>🗑</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Bouton créer un salon Mix — toujours visible */}
        <div style={{ padding:'10px 10px 0' }}>
          <button
            onClick={() => setShowVinylMix(true)}
            style={{
              width:'100%', padding:'10px', borderRadius:12, border:'none', cursor:'pointer',
              background:'linear-gradient(135deg,#A78BDB,#E07A9A)',
              color:'white', fontWeight:800, fontSize:12, fontFamily:font,
              boxShadow:'0 4px 14px rgba(167,139,219,0.35)',
            }}
          >🎛️ Créer un salon Mix</button>
        </div>

        {isVisitor && (
          <div style={{ padding:12, borderTop:`1.5px solid ${BDR}`, background:`${pink}08` }}>
            <div style={{ fontSize:11, fontWeight:700, color:TXT, marginBottom:4 }}>✨ Profil complet + matchs</div>
            <div style={{ fontSize:10, color:MUT, marginBottom:8 }}>Inscris-toi pour accéder à tout Vibz</div>
            <button onClick={() => setShowInscription(true)} style={{ width:'100%', padding:'9px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font }}>
              Rejoindre Vibz →
            </button>
          </div>
        )}
      </div>

      {/* ── ZONE CHAT ── */}
      <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 60px)', overflow:'hidden' }}>

        {/* Header salon */}
        <div style={{ padding:'12px 20px', borderBottom:`1.5px solid ${BDR}`, background:SURF, display:'flex', alignItems:'center', gap:10, boxShadow:'0 2px 8px rgba(107,184,232,0.06)' }}>
          <span style={{ fontSize:26 }}>{salon.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, color:TXT }}>{salon.name}</div>
            <div style={{ fontSize:11, color:MUT }}>{salon.count} connectés · {salon.hasMod?'Modéré humain + IA':'Modéré par IA'} · {salon.cat}</div>
          </div>
          {isVisitor && (
            <div style={{ padding:'5px 12px', borderRadius:20, background:`${blue}18`, border:`1px solid ${blue}44`, fontSize:11, fontWeight:700, color:blue }}>
              👤 Visiteur · {10 - ((allMsgs[salon.id]||[]).filter(m=>m.author===myPseudo).length)} msg restants
            </div>
          )}
          {salon.id==='12' && (
            <button onClick={() => setTranslateOn(v=>!v)} style={{ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:font, border:`1.5px solid ${translateOn?green:'#EEF2FA'}`, background:translateOn?`${green}18`:SURF, color:translateOn?green:MUT }}>
              🌍 Traduction {translateOn?'ON':'OFF'}
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', background:`${green}18`, borderRadius:20, fontSize:11, fontWeight:700, color:green }}>
            <div style={{ width:7, height:7, background:green, borderRadius:'50%' }}/> IA Guard
          </div>
        </div>

        {/* Match suggestion */}
        {matchSuggestion && !matchDismissed && (
          <div style={{ margin:'12px 20px 0', padding:'14px 18px', borderRadius:16, background:`linear-gradient(135deg,${pink}18,${blue}18)`, border:`1.5px solid ${pink}33`, display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ fontSize:32 }}>{matchSuggestion.avatar}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:TXT, marginBottom:2 }}>💘 Match potentiel : <span style={{ color:pink }}>{matchSuggestion.pseudo}</span></div>
              <div style={{ fontSize:11, color:MUT }}>{matchSuggestion.instrument} · {matchSuggestion.city} · Cherche {matchSuggestion.looking}</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              {isVisitor ? (
                <button onClick={() => setShowInscription(true)} style={{ padding:'8px 14px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font }}>❤️ S&apos;inscrire pour matcher</button>
              ) : (
                <button style={{ padding:'8px 14px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font }}>❤️ Liker</button>
              )}
              <button onClick={() => setMatchDismissed(true)} style={{ padding:'8px 12px', borderRadius:12, border:`1.5px solid ${BDR}`, background:SURF, cursor:'pointer', fontSize:12, color:MUT, fontFamily:font }}>✕</button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div
          ref={msgAreaRef}
          style={{ flex:1, minHeight:0, padding:'14px 20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}
        >
          {messages.map(msg => {
            const isMe  = msg.author === myPseudo
            const isBot = !!msg.isBot

            return (
              <div key={msg.id} style={{ display:'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap:8, alignItems:'flex-end' }}>

                {/* Avatar */}
                <div style={{
                  width:30, height:30, borderRadius:'50%', flexShrink:0,
                  fontSize: isBot ? 16 : 13,
                  background: isBot ? tk.modBg : isMe ? `${salon.color}33` : `${salon.color}18`,
                  border: isBot ? `1.5px solid ${tk.modBorder}` : `1.5px solid ${salon.color}44`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {msg.avatar}
                </div>

                {/* Contenu */}
                <div style={{ maxWidth:'62%', display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>

                  {/* Auteur + badges + heure */}
                  <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <span style={{ fontSize:11, fontWeight:700, color: isBot ? tk.modText : isMe ? salon.color : TXT }}>
                      {msg.author}
                    </span>
                    {msg.isMod && <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:6, background:tk.modBg, color:tk.modText }}>MOD</span>}
                    {isBot    && <span style={{ fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:6, background:tk.guardBg, color:tk.guardText }}>IA</span>}
                    {msg.time && <span style={{ fontSize:10, color:MUT }}>{msg.time}</span>}
                  </div>

                  {/* Bulle */}
                  <div style={{
                    padding:'9px 13px',
                    background: isMe
                      ? `linear-gradient(135deg,${salon.color},${salon.color}CC)`
                      : isBot ? tk.modBg : SURF,
                    borderLeft: isBot && !isMe ? `3px solid ${tk.modBorder}` : undefined,
                    borderRadius: isMe
                      ? '14px 14px 4px 14px'
                      : isBot ? '0 12px 12px 12px' : '4px 14px 14px 14px',
                    border: isMe || isBot ? 'none' : `1px solid ${BDR}`,
                    fontSize:13, lineHeight:1.55,
                    color: isMe ? '#fff' : isBot ? tk.modText : TXT,
                    boxShadow: isMe ? `0 3px 10px ${salon.color}44` : '0 1px 3px rgba(0,0,0,0.06)',
                    wordBreak:'break-word',
                  }}>
                    {msg.content}
                    {!isBot && extractMusicUrl(msg.content) && <MusicCard url={extractMusicUrl(msg.content)!} compact />}
                  </div>

                  {/* Traduction salon international */}
                  {salon.id==='12' && translateOn && msg.lang && msg.translated && (
                    <div style={{ marginTop:4, padding:'5px 10px', background:`${blue}18`, borderRadius:'0 8px 8px 0', borderLeft:`3px solid ${blue}`, fontSize:11, color:tk.blueDark }}>
                      <span style={{ fontSize:9, fontWeight:700, opacity:0.7 }}>{msg.lang} → 🌍 Traduit</span>
                      <div style={{ fontWeight:700, marginTop:1 }}>{msg.translated}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={endRef}/>
        </div>

        {/* Zone saisie */}
        <div style={{ padding:'12px 16px', borderTop:`1.5px solid ${BDR}`, background:SURF, display:'flex', flexDirection:'column', gap:8 }}>
          {warning && (
            <div style={{ padding:'10px 14px', background:'#FBF3EA', color:'#7A4A20', borderRadius:10, fontSize:13, fontWeight:600, borderLeft:'3px solid #E8A06A' }}>
              🛡️ VibzGuard : {warning}
            </div>
          )}
          {showSignupPrompt && (
            <div style={{ padding:'12px 16px', background:`${pink}11`, borderRadius:12, border:`1.5px solid ${pink}33`, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:20 }}>⚡</span>
              <div style={{ flex:1, fontSize:12, color:TXT, fontWeight:600 }}>Tu as atteint la limite visiteur (10 messages). Inscris-toi gratuitement pour continuer !</div>
              <button onClick={() => setShowInscription(true)} style={{ padding:'8px 14px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:12, fontFamily:font, whiteSpace:'nowrap' }}>S&apos;inscrire →</button>
            </div>
          )}
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:`${salon.color}18`, border:`1.5px solid ${salon.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{myAvatar}</div>
            <input
              style={{ flex:1, padding:'10px 16px', border:`1.5px solid ${BDR}`, borderRadius:24, fontSize:13, fontFamily:font, outline:'none', background:BG, color:TXT }}
              value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
              placeholder={`Écrire dans ${salon.name}... (en tant que ${myPseudo})`}
            />
            <button onClick={send} style={{ width:38, height:38, borderRadius:'50%', border:'none', cursor:'pointer', background:`linear-gradient(135deg,${salon.color},${blue})`, color:'white', fontSize:16, boxShadow:`0 4px 12px ${salon.color}44` }}>➤</button>
          </div>
        </div>
      </div>

      {/* Modal Vinyl Mix Creator */}
      {showVinylMix && (
        <VinylMixCreator
          onClose={() => setShowVinylMix(false)}
          existingSalons={mixSalons}
          onCreateSalon={handleCreateMixSalon}
          onJoinSalon={handleJoinMixSalon}
        />
      )}

      {/* Modal inscription */}
      {showInscription && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(26,30,46,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} onClick={() => setShowInscription(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:SURF, borderRadius:24, width:'100%', maxWidth:440, padding:32, boxShadow:`0 24px 64px ${pink}22`, border:`1.5px solid ${BDR}`, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🦋</div>
            <div style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:6 }}>Rejoins Vibz gratuitement</div>
            <div style={{ fontSize:13, color:MUT, lineHeight:1.7, marginBottom:24 }}>Crée ton profil complet, accès illimité aux salons, messagerie privée, likes, matchs musicaux.</div>
            <button onClick={() => window.location.href='/'} style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${pink},${blue})`, color:'white', fontWeight:800, fontSize:15, fontFamily:font, boxShadow:`0 6px 20px ${pink}33` }}>
              S&apos;inscrire gratuitement →
            </button>
            <div style={{ marginTop:12, fontSize:11, color:MUT }}>
              Déjà inscrit ? <span style={{ color:pink, cursor:'pointer', fontWeight:700 }} onClick={() => window.location.href='/'}>Se connecter</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
