import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

interface Props { user: User }

const INSTRUMENTS = ['Guitare','Piano','Basse','Batterie','Chant','Saxo','Violon','DJ','Ukulélé','Flûte','Trompette','Clarinette']
const GENRES = ['Rock','Jazz','Blues','Pop','Funk','Soul','Hip-Hop','Électro','Classique','Folk','Metal','R&B','Reggae','Indie']
const LOOKING = [{id:'rencontre',label:'💑 Rencontre amoureuse'},{id:'collab',label:'🎵 Collaboration musicale'},{id:'amis',label:'👥 Amis / Réseau'}]

const tagBtnStyle = (active: boolean): React.CSSProperties => ({
  padding:'6px 14px', borderRadius:20,
  border: active ? '0.5px solid #7F77DD' : '0.5px solid rgba(0,0,0,0.1)',
  background: active ? '#EEEDFE' : 'white',
  color: active ? '#3C3489' : '#6b7280',
  cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Syne,sans-serif', transition:'all 0.1s',
})

const socialBadgeStyle = (color: string): React.CSSProperties => ({
  width:28, height:28, background:color, borderRadius:7,
  display:'flex', alignItems:'center', justifyContent:'center',
  color:'white', fontSize:11, fontWeight:800, flexShrink:0,
})

export default function ProfilePage({ user }: Props) {
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    display_name: user.email?.split('@')[0]||'',
    bio:'', city:'', country:'FR',
    instruments:[] as string[],
    music_genres:[] as string[],
    looking_for:[] as string[],
    social_soundcloud:'', social_instagram:'', social_youtube:'',
    social_linkedin:'', social_facebook:'', social_tiktok:'',
    social_email_public:'', show_socials:true, show_location:true,
    allow_messages_from:'all',
  })

  useEffect(()=>{
    supabase.from('profiles').select('*').eq('id',user.id).single().then(({data})=>{
      if(data) setProfile(p=>({...p,...data}))
    })
  },[user.id])

  const toggle = (field:'instruments'|'music_genres'|'looking_for', val:string) => {
    setProfile(p=>({...p,[field]:p[field].includes(val)?p[field].filter((x:string)=>x!==val):[...p[field],val]}))
  }

  const save = async () => {
    await supabase.from('profiles').upsert({id:user.id,...profile,updated_at:new Date().toISOString()})
    setSaved(true); setTimeout(()=>setSaved(false),2500)
  }

  const initials = (profile.display_name||'U').slice(0,2).toUpperCase()
  const inp: React.CSSProperties = {width:'100%',padding:'10px 14px',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:8,fontSize:13,fontFamily:'Syne,sans-serif',outline:'none',background:'#f9f8f7',color:'#1a1a1a',marginBottom:10}
  const card: React.CSSProperties = {background:'white',border:'0.5px solid rgba(0,0,0,0.08)',borderRadius:14,padding:18}
  const lbl: React.CSSProperties = {fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#6b7280',marginBottom:12,display:'block'}

  return (
    <div style={{padding:28,maxWidth:800,display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',gap:20,alignItems:'flex-start'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,fontWeight:700,border:'2px solid #D4537E',flexShrink:0}}>
          {initials}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:24,fontWeight:800,letterSpacing:-1}}>{profile.display_name||'Mon profil'}</div>
          <div style={{fontSize:14,color:'#6b7280',margin:'4px 0 12px'}}>{profile.city||'Ajoute ta ville'} · {user.email}</div>
          <div style={{display:'flex',gap:10}}>
            {['Likes','Contacts','Matches'].map(l=>(
              <div key={l} style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:700}}>0</div><div style={{fontSize:11,color:'#6b7280'}}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div style={card}>
        <span style={lbl}>Informations de base</span>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <input style={inp} placeholder="Pseudo / Nom affiché" value={profile.display_name} onChange={e=>setProfile(p=>({...p,display_name:e.target.value}))}/>
            <input style={inp} placeholder="Ville" value={profile.city} onChange={e=>setProfile(p=>({...p,city:e.target.value}))}/>
          </div>
          <textarea style={{...inp,height:88,resize:'none',marginBottom:0}} placeholder="Bio..." value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))}/>
        </div>
      </div>

      <div style={card}>
        <span style={lbl}>Mes réseaux sociaux</span>
        {[
          {key:'social_soundcloud',label:'SC',color:'#f50',ph:'soundcloud.com/monprofil'},
          {key:'social_instagram',label:'IG',color:'#C13584',ph:'@moninsta'},
          {key:'social_youtube',label:'YT',color:'#FF0000',ph:'youtube.com/machaîne'},
          {key:'social_linkedin',label:'in',color:'#0A66C2',ph:'linkedin.com/in/moi'},
          {key:'social_facebook',label:'fb',color:'#1877F2',ph:'facebook.com/moi'},
          {key:'social_tiktok',label:'TT',color:'#000',ph:'@montiktok'},
          {key:'social_email_public',label:'@',color:'#6b7280',ph:'contact@monsite.com'},
        ].map(s=>(
          <div key={s.key} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <div style={socialBadgeStyle(s.color)}>{s.label}</div>
            <input style={{...inp,marginBottom:0}} placeholder={s.ph} value={(profile as unknown as Record<string,string>)[s.key]||''} onChange={e=>setProfile(p=>({...p,[s.key]:e.target.value}))}/>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={card}>
          <span style={lbl}>Mes instruments</span>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {INSTRUMENTS.map(i=><button key={i} style={tagBtnStyle(profile.instruments.includes(i))} onClick={()=>toggle('instruments',i)}>{i}</button>)}
          </div>
        </div>
        <div style={card}>
          <span style={lbl}>Styles musicaux</span>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {GENRES.map(g=><button key={g} style={{...tagBtnStyle(profile.music_genres.includes(g)),background:profile.music_genres.includes(g)?'#FBEAF0':'white',borderColor:profile.music_genres.includes(g)?'#D4537E':'rgba(0,0,0,0.1)',color:profile.music_genres.includes(g)?'#4B1528':'#6b7280'}} onClick={()=>toggle('music_genres',g)}>{g}</button>)}
          </div>
        </div>
      </div>

      <div style={card}>
        <span style={lbl}>Je cherche</span>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {LOOKING.map(l=><button key={l.id} style={{...tagBtnStyle(profile.looking_for.includes(l.id)),padding:'10px 18px',fontSize:13}} onClick={()=>toggle('looking_for',l.id)}>{l.label}</button>)}
        </div>
      </div>

      <div style={card}>
        <span style={lbl}>Confidentialité</span>
        {[{key:'show_socials',label:'Afficher mes réseaux sociaux'},{key:'show_location',label:'Afficher ma ville'}].map(opt=>(
          <div key={opt.key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'0.5px solid rgba(0,0,0,0.06)'}}>
            <span style={{fontSize:13}}>{opt.label}</span>
            <button onClick={()=>setProfile(p=>({...p,[opt.key]:!(p as unknown as Record<string,unknown>)[opt.key]}))} style={{padding:'6px 14px',borderRadius:20,border:'0.5px solid rgba(0,0,0,0.1)',background:(profile as unknown as Record<string,unknown>)[opt.key]?'#E1F5EE':'white',color:(profile as unknown as Record<string,unknown>)[opt.key]?'#085041':'#6b7280',cursor:'pointer',fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:700}}>
              {(profile as unknown as Record<string,unknown>)[opt.key]?'✓ Activé':'○ Désactivé'}
            </button>
          </div>
        ))}
      </div>

      <button onClick={save} style={{padding:'12px 28px',background:saved?'#1D9E75':'#D4537E',color:'white',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'Syne,sans-serif',transition:'background 0.2s'}}>
        {saved?'✅ Profil sauvegardé !':'Sauvegarder mon profil'}
      </button>
    </div>
  )
}
