import { useState, useRef, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

interface Props { user: User }

const EMOJIS = ['😊','❤️','🎸','🎵','😂','🔥','✨','🥰','👋','🎹','🎤','🎧','😎','🎶','💕','🤩','😍','🙌','👌','💯']

const CONTACTS = [
  {id:'1',name:'Léa R.',initials:'LR',online:true,bg:'#EEEDFE',color:'#3C3489',preview:'Haha oui je joue depuis 8 ans !',unread:2},
  {id:'2',name:'Tom K.',initials:'TK',online:true,bg:'#E1F5EE',color:'#085041',preview:'On peut jam samedi ?',unread:0},
  {id:'3',name:'Sara M.',initials:'SM',online:false,bg:'#FBEAF0',color:'#72243E',preview:'Merci pour le follow !',unread:0},
  {id:'4',name:'Nico B.',initials:'NB',online:true,bg:'#FAEEDA',color:'#633806',preview:'À plus pour le jam 🥁',unread:1},
]

const INITIAL_MESSAGES = [
  {id:'1',from:'them',content:'Salut ! J\'ai vu que tu jouais de la basse aussi ? 🎸',time:'14:22'},
  {id:'2',from:'me',content:'Oui ! Depuis 5 ans 😊 Et toi la guitare depuis longtemps ?',time:'14:23'},
  {id:'3',from:'them',content:'Haha oui je joue depuis 8 ans ! On devrait jammer un jour 🎵',time:'14:24'},
]

const contactItemStyle = (active: boolean): React.CSSProperties => ({
  display:'flex', alignItems:'center', gap:9,
  padding:'10px 14px', cursor:'pointer',
  borderBottom:'0.5px solid rgba(0,0,0,0.06)',
  background: active ? 'white' : 'transparent',
  transition:'background 0.1s',
})

const wizzBtnStyle = (wizzing: boolean): React.CSSProperties => ({
  padding:'6px 14px', borderRadius:20,
  border:'0.5px solid #EF9F27', background:'#FAEEDA', color:'#633806',
  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Syne,sans-serif',
  animation: wizzing ? 'wizz 0.5s ease' : 'none',
})

export default function MessengerPage({ user }: Props) {
  const [selected, setSelected] = useState(CONTACTS[0])
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [wizzing, setWizzing] = useState(false)
  const [wizzNotif, setWizzNotif] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[messages])

  const sendMsg = (content = input) => {
    if (!content.trim()) return
    const now = new Date()
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`
    setMessages(p=>[...p,{id:Date.now().toString(),from:'me',content,time}])
    setInput('')
    setTimeout(()=>{
      const replies = ['Trop cool ! 🎸','J\'adore ! 😊','On se fait ça 🎵','Super idée ! 🤩','Avec plaisir ! 💕']
      setMessages(p=>[...p,{id:(Date.now()+1).toString(),from:'them',content:replies[Math.floor(Math.random()*replies.length)],time}])
    },1200)
  }

  const sendWizz = () => {
    setWizzing(true); setWizzNotif(true)
    const now = new Date()
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`
    setMessages(p=>[...p,{id:Date.now().toString(),from:'me',content:'⚡ Wizz !',time}])
    setTimeout(()=>setWizzing(false),500)
    setTimeout(()=>setWizzNotif(false),3000)
  }

  return (
    <div style={{display:'grid',gridTemplateColumns:'220px 1fr',minHeight:'calc(100vh - 60px)',background:'white'}}>
      <div style={{borderRight:'0.5px solid rgba(0,0,0,0.08)',background:'#f9f8f7',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 14px 12px',borderBottom:'0.5px solid rgba(0,0,0,0.08)'}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:6}}>💬 Messagerie</div>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'#6b7280'}}>
            <span style={{width:7,height:7,background:'#1D9E75',borderRadius:'50%',display:'inline-block'}}/>
            Vous êtes en ligne
          </div>
        </div>
        {CONTACTS.map(c=>(
          <div key={c.id} style={contactItemStyle(selected.id===c.id)} onClick={()=>setSelected(c)}>
            <div style={{width:36,height:36,borderRadius:'50%',background:c.bg,color:c.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,position:'relative',flexShrink:0}}>
              {c.initials}
              <div style={{position:'absolute',bottom:0,right:0,width:9,height:9,borderRadius:'50%',background:c.online?'#1D9E75':'#d1d5db',border:'1.5px solid #f9f8f7'}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:700}}>{c.name}</div>
              <div style={{fontSize:11,color:'#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.preview}</div>
            </div>
            {c.unread>0 && <div style={{background:'#D4537E',color:'white',fontSize:10,fontWeight:700,borderRadius:10,padding:'1px 6px'}}>{c.unread}</div>}
          </div>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px 20px',borderBottom:'0.5px solid rgba(0,0,0,0.08)',display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:selected.bg,color:selected.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700}}>
            {selected.initials}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700}}>{selected.name} 🎸</div>
            <div style={{fontSize:12,color:selected.online?'#1D9E75':'#6b7280'}}>{selected.online?'● En ligne':'○ Hors ligne'}</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={wizzBtnStyle(wizzing)} onClick={sendWizz}>⚡ Wizz !</button>
            <button style={{padding:'6px 12px',borderRadius:20,border:'0.5px solid rgba(0,0,0,0.1)',background:'transparent',cursor:'pointer',fontSize:12,fontFamily:'Syne,sans-serif',color:'#6b7280'}}>🚫 Bloquer</button>
          </div>
        </div>

        <div style={{padding:'8px 16px 4px',display:'flex',gap:5,flexWrap:'wrap',borderBottom:'0.5px solid rgba(0,0,0,0.06)'}}>
          {EMOJIS.map(e=>(
            <span key={e} style={{fontSize:18,cursor:'pointer',display:'inline-block',transition:'transform 0.1s'}}
              onClick={()=>sendMsg(e)}
              onMouseEnter={ev=>(ev.currentTarget.style.transform='scale(1.4)')}
              onMouseLeave={ev=>(ev.currentTarget.style.transform='scale(1)')}>
              {e}
            </span>
          ))}
        </div>

        <div style={{flex:1,padding:'16px 20px',overflowY:'auto',display:'flex',flexDirection:'column',gap:10,minHeight:320,maxHeight:'calc(100vh - 280px)'}}>
          {wizzNotif && <div style={{textAlign:'center',fontSize:13,color:'#EF9F27',fontWeight:700,padding:'4px 0'}}>⚡⚡ Tu as envoyé un Wizz à {selected.name} ! ⚡⚡</div>}
          {messages.map(msg=>(
            <div key={msg.id} style={{display:'flex',gap:8,alignItems:'flex-end',flexDirection:msg.from==='me'?'row-reverse':'row'}}>
              <div style={{width:28,height:28,borderRadius:'50%',background:msg.from==='me'?'#FBEAF0':selected.bg,color:msg.from==='me'?'#72243E':selected.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>
                {msg.from==='me'?'Moi':selected.initials}
              </div>
              <div>
                <div style={{maxWidth:280,padding:'9px 13px',borderRadius:msg.from==='me'?'14px 14px 4px 14px':'14px 14px 14px 4px',background:msg.from==='me'?'#D4537E':'#f3f4f6',color:msg.from==='me'?'white':'#1a1a1a',fontSize:13,lineHeight:1.5}}>
                  {msg.content}
                </div>
                <div style={{fontSize:10,color:'#9ca3af',margin:'2px 4px'}}>{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={endRef}/>
        </div>

        <div style={{padding:'12px 16px',borderTop:'0.5px solid rgba(0,0,0,0.08)',display:'flex',gap:8,alignItems:'center'}}>
          <input style={{flex:1,padding:'9px 14px',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:20,fontSize:13,fontFamily:'Syne,sans-serif',outline:'none',background:'#f9f8f7',color:'#1a1a1a'}}
            value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMsg()} placeholder={`Écrire à ${selected.name}...`}/>
          <button onClick={()=>sendMsg()} style={{width:36,height:36,borderRadius:'50%',border:'none',background:'#D4537E',color:'white',fontSize:16,cursor:'pointer'}}>➤</button>
        </div>
      </div>
    </div>
  )
}
