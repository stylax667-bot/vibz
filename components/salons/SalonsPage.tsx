import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { moderateMessage, getIAGuardMessage } from '../../lib/moderation'

interface Props { user: User }

const SALONS = [
  { id:'1', icon:'🎸', name:'Rock & Rencontre', count:47, hasMod:true },
  { id:'2', icon:'🎹', name:'Jazz Lounge', count:23, hasMod:false },
  { id:'3', icon:'💑', name:'Coup de foudre', count:88, hasMod:true },
  { id:'4', icon:'🥁', name:'Beatmakers', count:14, hasMod:false },
  { id:'5', icon:'🎤', name:'Chanteurs & Choristes', count:31, hasMod:true },
  { id:'6', icon:'🌍', name:'International', count:201, hasMod:true },
  { id:'7', icon:'🎻', name:'Classique', count:9, hasMod:false },
  { id:'8', icon:'🎧', name:'DJ & Électro', count:56, hasMod:true },
]

type Msg = { id:string; author:string; initials:string; bg:string; color:string; content:string; isMod?:boolean; isBot?:boolean; lang?:string; translated?:string }

const INIT: Record<string, Msg[]> = {
  '1': [
    {id:'1',author:'VibzGuard',initials:'🤖',bg:'#FAEEDA',color:'#633806',content:'🛡️ Bienvenue ! Le respect est obligatoire.',isBot:true},
    {id:'2',author:'Éric (Modo)',initials:'ÉM',bg:'#E1F5EE',color:'#085041',content:'Bonsoir ! Cherche un bassiste lyonnais 🎸',isMod:true},
    {id:'3',author:'Léa R.',initials:'LR',bg:'#EEEDFE',color:'#3C3489',content:'Ma sœur est bassiste !'},
  ],
  '3': [
    {id:'1',author:'VibzGuard',initials:'🤖',bg:'#FAEEDA',color:'#633806',content:'💑 Salon dédié aux rencontres sincères.',isBot:true},
    {id:'2',author:'Sophie L.',initials:'SL',bg:'#FBEAF0',color:'#72243E',content:'Bonsoir ! Qui est musicien(ne) ici ? 😊'},
  ],
  '6': [
    {id:'1',author:'VibzGuard',initials:'🤖',bg:'#FAEEDA',color:'#633806',content:'🌍 Salon International — Traduction IA activée ! Parlez votre langue.',isBot:true},
    {id:'2',author:'Yuki 🇯🇵',initials:'YK',bg:'#EEEDFE',color:'#3C3489',content:'こんにちは！ギターを弾く人いますか？',lang:'🇯🇵 Japonais',translated:'Bonjour ! Y a-t-il des guitaristes ici ?'},
    {id:'3',author:'Carlos 🇧🇷',initials:'CA',bg:'#E1F5EE',color:'#085041',content:'Olá! Sou baterista, procuro colaborar!',lang:'🇧🇷 Portugais',translated:'Salut ! Je suis batteur, je cherche à collaborer !'},
    {id:'4',author:'Anna 🇩🇪',initials:'AN',bg:'#FBEAF0',color:'#72243E',content:'Ich spiele Klavier, wer möchte eine Session machen?',lang:'🇩🇪 Allemand',translated:'Je joue du piano, qui veut faire une session ?'},
  ],
}

const salonEntryStyle = (active: boolean): React.CSSProperties => ({
  padding:'10px 12px', borderRadius:10,
  border: active ? '0.5px solid #7F77DD' : '0.5px solid rgba(0,0,0,0.08)',
  background: active ? '#EEEDFE' : 'white',
  cursor:'pointer', transition:'all 0.1s',
})

export default function SalonsPage({ user }: Props) {
  const [salon, setSalon] = useState(SALONS[0])
  const [messages, setMessages] = useState<Msg[]>(INIT['1'] || [])
  const [input, setInput] = useState('')
  const [warning, setWarning] = useState('')
  const [translateOn, setTranslateOn] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)
  const username = user.email?.split('@')[0] || 'Vous'
  const isIntl = salon.id === '6'

  useEffect(() => { endRef.current?.scrollIntoView({behavior:'smooth'}) }, [messages])

  const selectSalon = (s: typeof SALONS[0]) => {
    setSalon(s)
    setMessages(INIT[s.id] || [{id:'1',author:'VibzGuard',initials:'🤖',bg:'#FAEEDA',color:'#633806',content:`🛡️ Bienvenue dans ${s.name} !`,isBot:true}])
    if (s.id === '6') setTranslateOn(true)
  }

  const send = () => {
    if (!input.trim()) return
    const result = moderateMessage(input)
    if (result.isBlocked) { setWarning(result.suggestion||''); setTimeout(()=>setWarning(''),4000); return }
    const msg: Msg = {id:Date.now().toString(),author:username,initials:username.slice(0,2).toUpperCase(),bg:'#EEEDFE',color:'#3C3489',content:input}
    setMessages(p=>[...p,msg])
    setInput('')
    if (result.isWarning) {
      setTimeout(()=>setMessages(p=>[...p,{id:(Date.now()+1).toString(),author:'VibzGuard',initials:'🤖',bg:'#FAEEDA',color:'#633806',content:getIAGuardMessage(result),isBot:true}]),600)
    }
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'200px 1fr',minHeight:'calc(100vh - 60px)',background:'white'}}>
      <div style={{borderRight:'0.5px solid rgba(0,0,0,0.08)',background:'#f9f8f7',padding:12,display:'flex',flexDirection:'column',gap:6}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#6b7280',padding:'4px 4px 8px'}}>Salons</div>
        {SALONS.map(s=>(
          <div key={s.id} style={salonEntryStyle(salon.id===s.id)} onClick={()=>selectSalon(s)}>
            <div style={{fontSize:18,marginBottom:2}}>{s.icon}</div>
            <div style={{fontSize:13,fontWeight:700}}>{s.name}</div>
            <div style={{fontSize:11,color:'#6b7280'}}>{s.count} connectés</div>
            <div style={{display:'flex',gap:4,marginTop:4,flexWrap:'wrap'}}>
              {s.hasMod && <span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:4,background:'#FAEEDA',color:'#633806'}}>MOD</span>}
              <span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:4,background:'#E1F5EE',color:'#085041'}}>IA</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column'}}>
        <div style={{padding:'14px 20px',borderBottom:'0.5px solid rgba(0,0,0,0.08)',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:24}}>{salon.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700}}>{salon.name}</div>
            <div style={{fontSize:12,color:'#6b7280'}}>{salon.count} connectés · {salon.hasMod?'Modéré humain + IA':'Modéré par IA'}</div>
          </div>
          {isIntl && (
            <button
              onClick={() => setTranslateOn(v => !v)}
              style={{padding:'5px 12px',borderRadius:20,border:`0.5px solid ${translateOn?'#7F77DD':'rgba(0,0,0,0.1)'}`,background:translateOn?'#EEEDFE':'white',color:translateOn?'#3C3489':'#6b7280',fontSize:11,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}
            >
              🌍 Traduction {translateOn ? 'ON' : 'OFF'}
            </button>
          )}
          <div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',background:'#E1F5EE',color:'#085041',borderRadius:20,fontSize:11,fontWeight:700}}>
            <div style={{width:7,height:7,background:'#1D9E75',borderRadius:'50%'}}/>
            IA Guard actif
          </div>
        </div>

        <div style={{flex:1,padding:'16px 20px',overflowY:'auto',display:'flex',flexDirection:'column',gap:10,minHeight:360,maxHeight:'calc(100vh - 230px)'}}>
          {messages.map(msg=>(
            <div key={msg.id} style={{display:'flex',gap:9,alignItems:'flex-start'}}>
              <div style={{width:30,height:30,borderRadius:'50%',background:msg.bg,color:msg.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:msg.isBot?16:11,fontWeight:700,flexShrink:0}}>
                {msg.initials}
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:700}}>{msg.author}</span>
                  {msg.isMod && <span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:4,background:'#FAEEDA',color:'#633806'}}>MOD</span>}
                  {msg.isBot && <span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:4,background:'#E1F5EE',color:'#085041'}}>IA</span>}
                </div>
                <div style={{fontSize:13,padding:msg.isBot?'8px 12px':'0',background:msg.isBot?'#FAEEDA':'transparent',borderLeft:msg.isBot?'3px solid #EF9F27':'none',borderRadius:msg.isBot?'0 8px 8px 0':0,color:msg.isBot?'#633806':'#1a1a1a',lineHeight:1.5}}>
                  {msg.content}
                </div>
                {isIntl && translateOn && msg.lang && msg.translated && (
                  <div style={{marginTop:6,padding:'6px 10px',background:'#EEEDFE',borderRadius:'0 8px 8px 0',borderLeft:'3px solid #7F77DD',fontSize:12,color:'#3C3489'}}>
                    <span style={{fontSize:10,fontWeight:700,opacity:0.7}}>{msg.lang} → 🌍 Traduit automatiquement</span>
                    <div style={{fontWeight:700,marginTop:2}}>{msg.translated}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        <div style={{padding:'12px 16px',borderTop:'0.5px solid rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',gap:8}}>
          {warning && <div style={{padding:'10px 14px',background:'#FAEEDA',color:'#633806',borderRadius:8,fontSize:13,fontWeight:600}}>🛡️ VibzGuard : {warning}</div>}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input style={{flex:1,padding:'9px 14px',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:20,fontSize:13,fontFamily:'Syne,sans-serif',outline:'none',background:'#f9f8f7',color:'#1a1a1a'}}
              value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={`Écrire dans ${salon.name}...`}/>
            <button onClick={send} style={{width:36,height:36,borderRadius:'50%',border:'none',background:'#7F77DD',color:'white',fontSize:16,cursor:'pointer'}}>➤</button>
          </div>
        </div>
      </div>
    </div>
  )
}
