import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { type Profile } from '../../lib/supabase'

interface Props { user: User; onMessage: () => void }

const INSTRUMENTS = ['Guitare', 'Piano', 'Basse', 'Batterie', 'Chant', 'Saxo', 'Violon', 'DJ', 'Ukulélé', 'Flûte']
const SOCIAL_FILTERS = ['SoundCloud', 'Instagram', 'YouTube', 'LinkedIn', 'Facebook', 'TikTok']
const EMOJI_MAP: Record<string, string> = { Guitare:'🎸', Piano:'🎹', Basse:'🎸', Batterie:'🥁', Chant:'🎤', Saxo:'🎷', Violon:'🎻', DJ:'🎧', Ukulélé:'🪕', Flûte:'🪈' }
const BANNER_BG: Record<string, string> = { Guitare:'#EEEDFE', Piano:'#E1F5EE', Basse:'#FAEEDA', Batterie:'#FBEAF0', Chant:'#E1F5EE', Saxo:'#FAEEDA', DJ:'#EEEDFE', Violon:'#FBEAF0' }

const DEMO_PROFILES: Profile[] = [
  { id:'1', username:'lea_rock', display_name:'Léa R.', city:'Lyon', country:'FR', instruments:['Guitare'], music_genres:['Rock','Indie'], looking_for:['rencontre','collab'], social_soundcloud:'soundcloud.com/lea', social_instagram:'@lea_rock', social_youtube:'youtube/lea', is_online:true },
  { id:'2', username:'tom_jazz', display_name:'Tom K.', city:'Paris', country:'FR', instruments:['Piano'], music_genres:['Jazz','Blues'], looking_for:['collab','amis'], social_youtube:'youtube/tomjazz', social_linkedin:'linkedin/tom', is_online:true },
  { id:'3', username:'sara_chant', display_name:'Sara M.', city:'Bruxelles', country:'BE', instruments:['Chant'], music_genres:['Soul','R&B'], looking_for:['rencontre','collab'], social_instagram:'@sara_sings', social_facebook:'fb/sara', is_online:false },
  { id:'4', username:'nico_beats', display_name:'Nico B.', city:'Montréal', country:'CA', instruments:['Batterie'], music_genres:['Hip-Hop','Funk'], looking_for:['collab'], social_soundcloud:'soundcloud.com/nico', social_linkedin:'linkedin/nico', is_online:true },
  { id:'5', username:'marie_basse', display_name:'Marie L.', city:'Lyon', country:'FR', instruments:['Basse'], music_genres:['Funk','Jazz'], looking_for:['rencontre','collab'], social_instagram:'@marie_basse', is_online:false },
  { id:'6', username:'alex_dj', display_name:'Alex V.', city:'Berlin', country:'DE', instruments:['DJ'], music_genres:['Électro','House'], looking_for:['rencontre','collab'], social_soundcloud:'soundcloud.com/alexvibe', social_instagram:'@alexvibe', is_online:true },
]

const chipStyle = (on: boolean): React.CSSProperties => ({
  padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
  border: on ? '0.5px solid #1D9E75' : '0.5px solid rgba(0,0,0,0.1)',
  background: on ? '#E1F5EE' : 'white', color: on ? '#085041' : '#6b7280',
  cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.1s',
})

export default function DiscoverPage({ user, onMessage }: Props) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>(['Rencontre','Musiciens'])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [matchName, setMatchName] = useState<string|null>(null)

  const toggleFilter = (f: string) => setActiveFilters(p => p.includes(f) ? p.filter(x=>x!==f) : [...p,f])

  const handleLike = (id: string, name: string) => {
    setLikedIds(p => { const s = new Set(Array.from(p)); s.add(id); return s })
    if (Math.random() > 0.7) { setMatchName(name); setTimeout(()=>setMatchName(null),3000) }
  }

  const getSocials = (p: Profile) => {
    const r: {label:string;color:string}[] = []
    if (p.social_soundcloud) r.push({label:'SC',color:'#f50'})
    if (p.social_instagram) r.push({label:'IG',color:'#C13584'})
    if (p.social_youtube) r.push({label:'YT',color:'#FF0000'})
    if (p.social_linkedin) r.push({label:'in',color:'#0A66C2'})
    if (p.social_facebook) r.push({label:'fb',color:'#1877F2'})
    return r
  }

  const filtered = DEMO_PROFILES.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.display_name||'').toLowerCase().includes(q) || (p.city||'').toLowerCase().includes(q) || (p.instruments||[]).some(i=>i.toLowerCase().includes(q))
  })

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 270px',minHeight:'calc(100vh - 60px)'}}>
      {matchName && (
        <div style={{position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',background:'#D4537E',color:'white',padding:'14px 28px',borderRadius:16,fontWeight:700,fontSize:16,zIndex:999,boxShadow:'0 8px 32px rgba(212,83,126,0.4)'}}>
          🎉 Match avec {matchName} !
        </div>
      )}

      <div style={{padding:24,display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'11px 16px',border:'0.5px solid rgba(0,0,0,0.1)',borderRadius:12,background:'white'}}>
          <span style={{fontSize:16,color:'#6b7280'}}>🔍</span>
          <input style={{border:'none',background:'transparent',fontSize:14,fontFamily:'Syne,sans-serif',outline:'none',flex:1,color:'#1a1a1a'}} placeholder="Rechercher par nom, ville, instrument..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>

        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {['💑 Rencontre','🎸 Musiciens',...INSTRUMENTS,...SOCIAL_FILTERS].map(f=>(
            <div key={f} style={chipStyle(activeFilters.includes(f))} onClick={()=>toggleFilter(f)}>{f}</div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          {filtered.map(p => {
            const inst = p.instruments?.[0]||'Guitare'
            const liked = likedIds.has(p.id)
            const socials = getSocials(p)
            return (
              <div key={p.id} style={{background:'white',border:'0.5px solid rgba(0,0,0,0.08)',borderRadius:16,overflow:'hidden',cursor:'pointer',transition:'border-color 0.15s'}}>
                <div style={{height:56,background:BANNER_BG[inst]||'#EEEDFE',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>
                  {EMOJI_MAP[inst]||'🎵'}
                </div>
                <div style={{padding:14}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    {p.is_online && <span style={{width:7,height:7,background:'#1D9E75',borderRadius:'50%',display:'inline-block'}}/>}
                    <span style={{fontSize:15,fontWeight:700}}>{p.display_name}</span>
                  </div>
                  <div style={{fontSize:12,color:'#6b7280',marginBottom:8}}>{p.city} · {p.country}</div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                    {(p.instruments||[]).map(i=><span key={i} className="tag tag-music">{i}</span>)}
                    {(p.looking_for||[]).includes('rencontre') && <span className="tag tag-love">💑</span>}
                    {(p.looking_for||[]).includes('collab') && <span className="tag tag-collab">🎵</span>}
                  </div>
                  {socials.length>0 && (
                    <div style={{display:'flex',gap:5,marginBottom:10}}>
                      {socials.map(s=>(
                        <div key={s.label} style={{width:22,height:22,background:s.color,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:10,fontWeight:800}}>{s.label}</div>
                      ))}
                    </div>
                  )}
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>handleLike(p.id,p.display_name||'')} style={{flex:1,padding:'7px',borderRadius:8,border:'0.5px solid rgba(0,0,0,0.08)',background:liked?'#D4537E':'#FBEAF0',color:liked?'white':'#D4537E',cursor:'pointer',fontSize:15,fontFamily:'Syne,sans-serif',fontWeight:700,transition:'all 0.15s'}}>
                      {liked?'❤️':'🤍'}
                    </button>
                    <button onClick={onMessage} style={{flex:1,padding:'7px',borderRadius:8,border:'0.5px solid rgba(0,0,0,0.08)',background:'#E1F5EE',color:'#1D9E75',cursor:'pointer',fontSize:15,fontFamily:'Syne,sans-serif',fontWeight:700}}>
                      💬
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <aside style={{borderLeft:'0.5px solid rgba(0,0,0,0.08)',padding:'20px 16px',display:'flex',flexDirection:'column',gap:16,background:'#f9f8f7'}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#6b7280'}}>En ligne maintenant</div>
        {DEMO_PROFILES.filter(p=>p.is_online).slice(0,4).map(p=>(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>
              {(p.display_name||'').slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:700}}>{p.display_name}</div>
              <div style={{fontSize:11,color:'#6b7280'}}>{EMOJI_MAP[p.instruments?.[0]||'']} {p.instruments?.[0]} · {p.city}</div>
            </div>
          </div>
        ))}
        <div style={{height:1,background:'rgba(0,0,0,0.06)',margin:'4px 0'}}/>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:1,textTransform:'uppercase',color:'#6b7280'}}>Salons actifs 🔥</div>
        {[{icon:'🎸',name:'Rock & Rencontre',count:47},{icon:'🎹',name:'Jazz Lounge',count:23},{icon:'💑',name:'Coup de foudre',count:88},{icon:'🥁',name:'Beatmakers',count:14}].map(s=>(
          <div key={s.name} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:10,border:'0.5px solid rgba(0,0,0,0.08)',cursor:'pointer',background:'white'}}>
            <span style={{fontSize:18}}>{s.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{s.name}</div><div style={{fontSize:11,color:'#6b7280'}}>{s.count} connectés</div></div>
            <span style={{fontSize:10,fontWeight:700,color:'#1D9E75'}}>LIVE</span>
          </div>
        ))}
      </aside>
    </div>
  )
}
