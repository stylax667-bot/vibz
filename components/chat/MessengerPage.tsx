import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { useTheme } from '../../lib/theme'
import MusicCard, { extractMusicUrl } from '../shared/MusicCard'

interface Props { user: User }

// ── Avatars instruments disponibles ─────────────────────────────────────────
const AVATAR_OPTIONS = [
  { id:'guitar',    icon:'🎸', label:'Guitare' },
  { id:'piano',     icon:'🎹', label:'Piano' },
  { id:'mic',       icon:'🎤', label:'Chant' },
  { id:'drums',     icon:'🥁', label:'Batterie' },
  { id:'sax',       icon:'🎷', label:'Saxophone' },
  { id:'violin',    icon:'🎻', label:'Violon' },
  { id:'trumpet',   icon:'🎺', label:'Trompette' },
  { id:'banjo',     icon:'🪕', label:'Banjo' },
  { id:'flute',     icon:'🎵', label:'Flûte' },
  { id:'harp',      icon:'🎶', label:'Harpe' },
  { id:'bass',      icon:'🎙️', label:'Basse' },
  { id:'dj',        icon:'🎧', label:'DJ' },
  { id:'accordion', icon:'🪗', label:'Accordéon' },
  { id:'note',      icon:'🎼', label:'Compositeur' },
  { id:'butterfly', icon:'🦋', label:'Vibz' },
]

const STATUS_OPTIONS = [
  { id:'online',  label:'En ligne',       color:'#52C07A', dot:'#52C07A' },
  { id:'away',    label:'Occupé(e)',       color:'#F5A623', dot:'#F5A623' },
  { id:'busy',    label:'Ne pas déranger', color:'#E07A9A', dot:'#E07A9A' },
  { id:'offline', label:'Apparaître hors ligne', color:'#9BA8C0', dot:'#9BA8C0' },
]

const EMOJIS = ['😊','❤️','🎸','🎵','😂','🔥','✨','🥰','👋','🎹','🎤','🎧','😎','🎶','💕','🤩','😍','🙌','👌','💯','🎺','🥁','🎷','🎻','🪕']

const CONTACTS = [
  { id:'1', name:'Léa R.',  avatar:'🎸', status:'online',  statusMsg:'Guitariste depuis 8 ans 🎸', preview:'Haha oui je joue depuis 8 ans !', unread:2 },
  { id:'2', name:'Tom K.',  avatar:'🥁', status:'online',  statusMsg:'À la recherche d\'un jam 🥁', preview:'On peut jam samedi ?', unread:0 },
  { id:'3', name:'Sara M.', avatar:'🎹', status:'offline', statusMsg:'', preview:'Merci pour le follow !', unread:0 },
  { id:'4', name:'Nico B.', avatar:'🎧', status:'away',    statusMsg:'En studio 🎵', preview:'À plus pour le jam 🥁', unread:1 },
  { id:'5', name:'Julie P.',avatar:'🎤', status:'busy',    statusMsg:'Ne pas déranger svp', preview:'On se fait une collab ?', unread:0 },
]

const INIT_MESSAGES: Record<string, {id:string;from:string;content:string;time:string}[]> = {
  '1': [
    {id:'1',from:'them',content:'Salut ! J\'ai vu que tu jouais de la basse aussi ? 🎸',time:'14:22'},
    {id:'2',from:'me',content:'Oui ! Depuis 5 ans 😊 Et toi la guitare depuis longtemps ?',time:'14:23'},
    {id:'3',from:'them',content:'Haha oui je joue depuis 8 ans ! On devrait jammer un jour 🎵',time:'14:24'},
  ],
  '2': [{id:'1',from:'them',content:'On peut jam samedi ? 🥁',time:'15:10'}],
  '3': [{id:'1',from:'them',content:'Merci pour le follow ! 🎹',time:'12:00'}],
  '4': [{id:'1',from:'them',content:'À plus pour le jam 🥁',time:'10:30'}],
  '5': [{id:'1',from:'them',content:'On se fait une collab ? 🎤',time:'09:15'}],
}

const statusColor = (s: string) => STATUS_OPTIONS.find(o=>o.id===s)?.dot || '#9BA8C0'
const statusLabel = (s: string) => STATUS_OPTIONS.find(o=>o.id===s)?.label || 'Hors ligne'

export default function MessengerPage({ user }: Props) {
  const { theme: tk } = useTheme()
  const font = 'Nunito, sans-serif'
  const pink  = '#E07A9A'
  const blue  = '#6BB8E8'
  const green = '#52C07A'

  // Alias thème
  const BG   = tk.bg2
  const SURF = tk.surface
  const BDR  = tk.border
  const TXT  = tk.text
  const MUT  = tk.textMuted
  const INP  = tk.inputBg

  // ── Mon profil ─────────────────────────────────────────────────────────────
  const [myAvatar,    setMyAvatar]    = useState('🎸')
  const [myPseudo,    setMyPseudo]    = useState(user.email?.split('@')[0] || 'MonPseudo')
  const [myStatus,    setMyStatus]    = useState('online')
  const [myStatusMsg, setMyStatusMsg] = useState('Musicien sur Vibz 🎵')
  const [showProfile, setShowProfile] = useState(false)
  const [editPseudo,  setEditPseudo]  = useState(myPseudo)
  const [editStatusMsg, setEditStatusMsg] = useState(myStatusMsg)

  // ── Conversations ──────────────────────────────────────────────────────────
  const [selected,   setSelected]   = useState(CONTACTS[0])
  const [allMessages, setAllMessages] = useState(INIT_MESSAGES)
  const messages = allMessages[selected.id] || []
  const [input,      setInput]      = useState('')
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const endRef = useRef<HTMLDivElement>(null)

  // ── Wizz ───────────────────────────────────────────────────────────────────
  const [wizzing,       setWizzing]       = useState(false)
  const [wizzReceived,  setWizzReceived]  = useState(false)
  const [wizzShake,     setWizzShake]     = useState(false)

  // ── Fenêtre de conversation ouverte ───────────────────────────────────────
  const [openWindows, setOpenWindows] = useState<string[]>(['1'])

  // ── Signalement ────────────────────────────────────────────────────────────
  const [reportOpen, setReportOpen] = useState(false)

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages, selected])

  const now = () => {
    const d = new Date()
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const addMsg = (contactId: string, from: string, content: string) => {
    setAllMessages(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId]||[]), {id:Date.now().toString(), from, content, time:now()}]
    }))
  }

  const sendMsg = (content = input) => {
    if (!content.trim()) return
    addMsg(selected.id, 'me', content)
    setInput('')
    setTimeout(() => {
      const replies = ['Trop cool ! 🎸','J\'adore ! 😊','On se fait ça 🎵','Super idée ! 🤩','Avec plaisir ! 💕','Haha yes 😂','T\'es au top 🙌']
      addMsg(selected.id, 'them', replies[Math.floor(Math.random()*replies.length)])
    }, 1200)
  }

  const sendWizz = () => {
    setWizzing(true)
    addMsg(selected.id, 'me', '⚡ Wizz !')
    setTimeout(() => setWizzing(false), 600)
    // Simuler réception wizz en retour
    setTimeout(() => {
      setWizzReceived(true)
      setWizzShake(true)
      addMsg(selected.id, 'them', '⚡ Wizz en retour !')
      setTimeout(() => { setWizzReceived(false); setWizzShake(false) }, 3000)
    }, 2000)
  }

  const openConversation = (c: typeof CONTACTS[0]) => {
    setSelected(c)
    if (!openWindows.includes(c.id)) setOpenWindows(p => [...p, c.id])
  }

  const saveProfile = () => {
    setMyPseudo(editPseudo)
    setMyStatusMsg(editStatusMsg)
    setShowProfile(false)
  }

  // ── Composant : Avatar + Statut ────────────────────────────────────────────
  const AvatarBubble = ({ avatar, status, size=36 }: { avatar:string; status:string; size?:number }) => (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%', fontSize:size*0.5,
        background: tk.isDark
          ? `linear-gradient(135deg,${tk.pinkLight},${tk.blueLight})`
          : 'linear-gradient(135deg,#FFF0F5,#F0F7FD)',
        border: `2px solid ${BDR}`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>{avatar}</div>
      <div style={{
        position:'absolute', bottom:0, right:0,
        width:10, height:10, borderRadius:'50%',
        background: statusColor(status),
        border: `2px solid ${SURF}`,
        boxShadow:'0 1px 3px rgba(0,0,0,0.15)',
      }}/>
    </div>
  )

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', minHeight:'calc(100vh - 60px)', background:BG, fontFamily:font }}>

      {/* ── SIDEBAR liste contacts ── */}
      <div style={{ borderRight:`1.5px solid ${BDR}`, background:SURF, display:'flex', flexDirection:'column' }}>

        {/* Mon profil */}
        <div style={{ padding:'14px 16px', borderBottom:`1.5px solid ${BDR}`, background:'linear-gradient(135deg,#FFF5F8,#F0F7FD)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => { setEditPseudo(myPseudo); setEditStatusMsg(myStatusMsg); setShowProfile(true) }}>
            <AvatarBubble avatar={myAvatar} status={myStatus} size={44} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:800, color:TXT, display:'flex', alignItems:'center', gap:6 }}>
                {myPseudo}
                <span style={{ fontSize:10, color:MUT, fontWeight:600 }}>✏️</span>
              </div>
              <div style={{ fontSize:11, color:MUT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{myStatusMsg || statusLabel(myStatus)}</div>
            </div>
          </div>

          {/* Sélecteur de statut */}
          <div style={{ display:'flex', gap:5, marginTop:10, flexWrap:'wrap' }}>
            {STATUS_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setMyStatus(s.id)} style={{
                padding:'3px 8px', borderRadius:20, fontSize:10, fontWeight:700,
                border: myStatus===s.id ? `1.5px solid ${s.dot}` : `1.5px solid ${BDR}`,
                background: myStatus===s.id ? `${s.dot}22` : 'white',
                color: myStatus===s.id ? s.dot : '#9BA8C0',
                cursor:'pointer', fontFamily:font,
              }}>
                <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:s.dot, marginRight:4, verticalAlign:'middle' }}/>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste contacts */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          <div style={{ padding:'6px 16px 4px', fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', color:MUT }}>
            Contacts ({CONTACTS.filter(c=>!blockedIds.has(c.id)).length})
          </div>
          {CONTACTS.filter(c=>!blockedIds.has(c.id)).map(c => {
            const msgs = allMessages[c.id] || []
            const lastMsg = msgs[msgs.length-1]
            const isActive = selected.id === c.id
            const isOpen = openWindows.includes(c.id)
            return (
              <div key={c.id}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 16px', cursor:'pointer',
                  background: isActive ? 'linear-gradient(90deg,#FFF0F5,#F0F7FD)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${pink}` : '3px solid transparent',
                  transition:'all 0.1s',
                  opacity: c.status==='offline' ? 0.6 : 1,
                }}
                onClick={() => openConversation(c)}
              >
                <AvatarBubble avatar={c.avatar} status={c.status} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{
                      fontSize:13, fontWeight:700,
                      color: c.status==='offline' ? '#9BA8C0' : '#1A1E2E',
                      fontStyle: c.status==='offline' ? 'italic' : 'normal',
                    }}>{c.name}</span>
                    {isOpen && <span style={{ fontSize:9, background:blue+'22', color:blue, padding:'1px 5px', borderRadius:8, fontWeight:700 }}>ouvert</span>}
                  </div>
                  <div style={{ fontSize:11, color:MUT, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {c.status!=='offline' && c.statusMsg ? c.statusMsg : lastMsg?.content || ''}
                  </div>
                </div>
                {(allMessages[c.id]?.filter(m=>m.from==='them').length||0)>0 && c.id!==selected.id && (
                  <div style={{ background:pink, color:'white', fontSize:10, fontWeight:700, borderRadius:10, padding:'1px 6px', minWidth:16, textAlign:'center' }}>
                    {allMessages[c.id].filter(m=>m.from==='them').length}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Onglets conversations ouvertes */}
        {openWindows.length > 0 && (
          <div style={{ borderTop:`1.5px solid ${BDR}`, padding:'8px 12px' }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:1.5, textTransform:'uppercase', color:MUT, marginBottom:6 }}>Fenêtres</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {openWindows.map(wid => {
                const c = CONTACTS.find(x=>x.id===wid)
                if (!c) return null
                return (
                  <div key={wid} style={{
                    display:'flex', alignItems:'center', gap:4,
                    padding:'4px 8px', borderRadius:12,
                    background: selected.id===wid ? `${pink}22` : '#F8FBFF',
                    border: `1.5px solid ${selected.id===wid ? pink : '#EEF2FA'}`,
                    cursor:'pointer', fontSize:12,
                  }}>
                    <span onClick={() => setSelected(c)}>{c.avatar} {c.name.split(' ')[0]}</span>
                    <span onClick={() => setOpenWindows(p=>p.filter(x=>x!==wid))} style={{ color:MUT, fontSize:10, cursor:'pointer', marginLeft:2 }}>×</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── FENÊTRE DE CONVERSATION ── */}
      <div style={{ display:'flex', flexDirection:'column', animation: wizzShake ? 'wizz 0.5s ease' : 'none' }}>

        {/* Header contact */}
        <div style={{
          padding:'12px 20px', borderBottom:`1.5px solid ${BDR}`,
          background:SURF, display:'flex', alignItems:'center', gap:12,
          boxShadow:'0 2px 8px rgba(107,184,232,0.06)',
        }}>
          <AvatarBubble avatar={selected.avatar} status={selected.status} size={40} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15, fontWeight:800, color:TXT }}>{selected.name}</div>
            <div style={{ fontSize:12, color: selected.status==='offline' ? '#9BA8C0' : statusColor(selected.status), fontWeight:600 }}>
              <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:statusColor(selected.status), marginRight:5, verticalAlign:'middle' }}/>
              {statusLabel(selected.status)}
              {selected.statusMsg && selected.status!=='offline' && ` · ${selected.statusMsg}`}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:8 }}>
            <button
              style={{
                padding:'7px 16px', borderRadius:20, border:`1.5px solid ${blue}`,
                background:`${blue}18`, color:blue, fontSize:12, fontWeight:700,
                cursor:'pointer', fontFamily:font,
                animation: wizzing ? 'wizz 0.5s ease' : 'none',
              }}
              onClick={sendWizz}
            >⚡ Wizz !</button>
            <button
              onClick={() => setReportOpen(true)}
              style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${pink}33`, background:`${pink}11`, cursor:'pointer', fontSize:12, fontFamily:font, color:pink, fontWeight:700 }}
            >🚩 Signaler</button>
          </div>
        </div>

        {/* Wizz reçu */}
        {wizzReceived && (
          <div style={{ textAlign:'center', padding:'8px', background:`${blue}11`, fontSize:13, color:blue, fontWeight:700, borderBottom:`1px solid ${blue}22` }}>
            ⚡ {selected.name} t&apos;a envoyé un Wizz ! ⚡
          </div>
        )}

        {/* Barre emojis */}
        <div style={{ padding:'8px 16px 6px', display:'flex', gap:5, flexWrap:'wrap', borderBottom:'1px solid #EEF2FA', background:SURF }}>
          {EMOJIS.map(e => (
            <span key={e} style={{ fontSize:18, cursor:'pointer', display:'inline-block', transition:'transform 0.1s' }}
              onClick={() => sendMsg(e)}
              onMouseEnter={ev=>(ev.currentTarget.style.transform='scale(1.4)')}
              onMouseLeave={ev=>(ev.currentTarget.style.transform='scale(1)')}>
              {e}
            </span>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex:1, padding:'16px 20px', overflowY:'auto', display:'flex', flexDirection:'column', gap:10, background:BG, maxHeight:'calc(100vh - 300px)' }}>
          {reportOpen && (
            <div className="animate-slide-up" style={{ background:SURF, border:`1.5px solid ${pink}33`, borderRadius:18, padding:20, margin:'0 auto', maxWidth:380, width:'100%', boxShadow:`0 8px 32px ${pink}22` }}>
              <div style={{ fontSize:32, textAlign:'center', marginBottom:8 }}>🚨</div>
              <div style={{ fontWeight:800, fontSize:15, textAlign:'center', marginBottom:6, color:TXT }}>Signalement — {selected.name}</div>
              <div style={{ fontSize:12, color:MUT, textAlign:'center', lineHeight:1.6, marginBottom:16 }}>Notre IA Guard a détecté un comportement potentiellement inapproprié. Que souhaitez-vous faire ?</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={() => { setBlockedIds(p=>new Set(Array.from(p).concat(selected.id))); setReportOpen(false); setSelected(CONTACTS.find(c=>!blockedIds.has(c.id)&&c.id!==selected.id)||CONTACTS[0]) }}
                  style={{ padding:'12px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg,#E07A7A,${pink})`, color:'white', fontWeight:800, fontSize:13, fontFamily:font }}>
                  🚫 Bloquer définitivement {selected.name}
                </button>
                <button onClick={() => setReportOpen(false)}
                  style={{ padding:'12px', borderRadius:14, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${green},#1D9E75)`, color:'white', fontWeight:800, fontSize:13, fontFamily:font }}>
                  ✅ Continuer la discussion
                </button>
                <button onClick={() => setReportOpen(false)}
                  style={{ padding:'9px', borderRadius:14, border:`1.5px solid ${BDR}`, background:'transparent', cursor:'pointer', fontSize:12, color:MUT, fontFamily:font, fontWeight:700 }}>
                  Décider plus tard
                </button>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} style={{ display:'flex', gap:8, alignItems:'flex-end', flexDirection:msg.from==='me'?'row-reverse':'row' }}>
              <AvatarBubble avatar={msg.from==='me'?myAvatar:selected.avatar} status={msg.from==='me'?myStatus:selected.status} size={28} />
              <div>
                <div style={{ fontSize:10, color:MUT, margin:'0 4px 3px', textAlign:msg.from==='me'?'right':'left' }}>
                  {msg.from==='me' ? myPseudo : selected.name} · {msg.time}
                </div>
                <div style={{
                  maxWidth:300, padding:'9px 14px',
                  borderRadius: msg.from==='me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.from==='me'
                    ? `linear-gradient(135deg,${pink},${blue})`
                    : msg.content.startsWith('⚡') ? `${blue}22` : SURF,
                  color: msg.from==='me' ? 'white' : TXT,
                  fontSize:13, lineHeight:1.5,
                  border: msg.from==='me' ? 'none' : `1.5px solid ${BDR}`,
                  boxShadow: msg.from==='me' ? `0 4px 12px ${pink}33` : '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  {msg.content}
                  {/* Carte musicale intégrée si lien musical détecté */}
                  {extractMusicUrl(msg.content) && (
                    <MusicCard url={extractMusicUrl(msg.content)!} compact />
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        {/* Zone de saisie */}
        <div style={{ padding:'12px 16px', borderTop:`1.5px solid ${BDR}`, display:'flex', gap:8, alignItems:'center', background:SURF }}>
          <input
            style={{ flex:1, padding:'10px 16px', border:`1.5px solid ${BDR}`, borderRadius:24, fontSize:13, fontFamily:font, outline:'none', background:BG, color:TXT }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && sendMsg()}
            placeholder={`Écrire à ${selected.name}...`}
          />
          <button onClick={() => sendMsg()} style={{
            width:38, height:38, borderRadius:'50%', border:'none',
            background:`linear-gradient(135deg,${pink},${blue})`,
            color:'white', fontSize:16, cursor:'pointer',
            boxShadow:`0 4px 12px ${pink}44`,
          }}>➤</button>
        </div>
      </div>

      {/* ── MODAL PROFIL ── */}
      {showProfile && (
        <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(26,30,46,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setShowProfile(false)}>
          <div onClick={e=>e.stopPropagation()} className="animate-slide-up" style={{
            background:SURF, borderRadius:24, width:'100%', maxWidth:480, padding:28,
            boxShadow:`0 24px 64px ${pink}22`, border:`1.5px solid ${BDR}`,
          }}>
            <div style={{ fontSize:18, fontWeight:800, color:TXT, marginBottom:4 }}>✏️ Mon profil Vibz</div>
            <div style={{ fontSize:12, color:MUT, marginBottom:20 }}>Personnalise ton apparence et ton pseudo</div>

            {/* Pseudo */}
            <label style={{ fontSize:12, fontWeight:700, color:TXT, display:'block', marginBottom:6 }}>Pseudo</label>
            <input value={editPseudo} onChange={e=>setEditPseudo(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${BDR}`, borderRadius:12, fontSize:14, fontFamily:font, outline:'none', background:BG, color:TXT, boxSizing:'border-box', marginBottom:14 }}
              placeholder="Ton pseudo Vibz..." />

            {/* Message de statut */}
            <label style={{ fontSize:12, fontWeight:700, color:TXT, display:'block', marginBottom:6 }}>Message de statut</label>
            <input value={editStatusMsg} onChange={e=>setEditStatusMsg(e.target.value)}
              style={{ width:'100%', padding:'10px 14px', border:`1.5px solid ${BDR}`, borderRadius:12, fontSize:14, fontFamily:font, outline:'none', background:BG, color:TXT, boxSizing:'border-box', marginBottom:20 }}
              placeholder="Ce qui me définit musicalement..." />

            {/* Avatar */}
            <label style={{ fontSize:12, fontWeight:700, color:TXT, display:'block', marginBottom:10 }}>Avatar</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {AVATAR_OPTIONS.map(a => (
                <button key={a.id} onClick={() => setMyAvatar(a.icon)} title={a.label} style={{
                  width:44, height:44, borderRadius:12, fontSize:22,
                  border: myAvatar===a.icon ? `2px solid ${pink}` : '2px solid #EEF2FA',
                  background: myAvatar===a.icon ? `${pink}11` : '#F8FBFF',
                  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow: myAvatar===a.icon ? `0 2px 8px ${pink}33` : 'none',
                }}>
                  {a.icon}
                </button>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={saveProfile} style={{
                flex:1, padding:'12px', borderRadius:14, border:'none', cursor:'pointer',
                background:`linear-gradient(135deg,${pink},${blue})`, color:'white',
                fontWeight:800, fontSize:14, fontFamily:font,
              }}>Enregistrer</button>
              <button onClick={() => setShowProfile(false)} style={{
                padding:'12px 20px', borderRadius:14, border:`1.5px solid ${BDR}`,
                background:SURF, cursor:'pointer', fontSize:14, color:MUT, fontFamily:font, fontWeight:700,
              }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
