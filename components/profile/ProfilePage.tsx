import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

interface Props { user: User }

const INSTRUMENTS = ['Guitare','Piano','Basse','Batterie','Chant','Saxo','Violon','DJ','Ukulélé','Flûte','Trompette','Clarinette']
const GENRES = ['Rock','Jazz','Blues','Pop','Funk','Soul','Hip-Hop','Électro','Classique','Folk','Metal','R&B','Reggae','Indie']
const LOOKING = [{id:'rencontre',label:'💑 Rencontre amoureuse'},{id:'collab',label:'🎵 Collaboration musicale'},{id:'amis',label:'👥 Amis / Réseau'}]
const LEVELS = ['Débutant','Intermédiaire','Confirmé','Pro'] as const

type Level = typeof LEVELS[number]

const SOCIALS = [
  {key:'social_soundcloud', visKey:'soundcloud', label:'SC', color:'#f50',    ph:'soundcloud.com/monprofil',  name:'SoundCloud'},
  {key:'social_instagram',  visKey:'instagram',  label:'IG', color:'#C13584', ph:'@moninsta',                 name:'Instagram'},
  {key:'social_youtube',    visKey:'youtube',    label:'YT', color:'#FF0000', ph:'youtube.com/machaîne',      name:'YouTube'},
  {key:'social_linkedin',   visKey:'linkedin',   label:'in', color:'#0A66C2', ph:'linkedin.com/in/moi',       name:'LinkedIn'},
  {key:'social_facebook',   visKey:'facebook',   label:'fb', color:'#1877F2', ph:'facebook.com/moi',          name:'Facebook'},
  {key:'social_tiktok',     visKey:'tiktok',     label:'TT', color:'#111',    ph:'@montiktok',                name:'TikTok'},
  {key:'social_email_public',visKey:'email',     label:'@',  color:'#9B7A8A', ph:'contact@monsite.com',       name:'Email public'},
]

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  soundcloud:true, instagram:true, youtube:true,
  linkedin:true, facebook:true, tiktok:true, email:true,
}

const tagBtnStyle = (active: boolean, activeColor = '#A78BDB', activeBg = '#EDE8F8', activeText = '#5B3FAD'): React.CSSProperties => ({
  padding:'6px 14px', borderRadius:20,
  border: active ? `1px solid ${activeColor}` : '1px solid rgba(0,0,0,0.08)',
  background: active ? activeBg : 'white',
  color: active ? activeText : '#9B7A8A',
  cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Nunito,sans-serif', transition:'all 0.1s',
})

const socialBadgeStyle = (color: string): React.CSSProperties => ({
  width:30, height:30, background:color, borderRadius:8,
  display:'flex', alignItems:'center', justifyContent:'center',
  color:'white', fontSize:11, fontWeight:800, flexShrink:0,
})

function EyeIcon({ open }: { open: boolean }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}

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
    social_email_public:'',
    show_socials:true,
    show_location:true,
    allow_messages_from:'all' as 'all'|'matches'|'none',
    social_visibility: { ...DEFAULT_VISIBILITY } as Record<string,boolean>,
  })
  const [musicProfile, setMusicProfile] = useState({
    level: '' as Level | '',
    influences: [] as string[],
    mood_text: '',
    favorite_artists: [] as string[],
  })
  const [influenceInput, setInfluenceInput] = useState('')
  const [artistInput, setArtistInput] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) setProfile(p => ({
        ...p, ...data,
        social_visibility: { ...DEFAULT_VISIBILITY, ...(data.social_visibility || {}) },
      }))
    })
    supabase.from('music_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setMusicProfile({
        level: data.level || '',
        influences: data.influences || [],
        mood_text: data.mood_text || '',
        favorite_artists: data.favorite_artists || [],
      })
    })
  }, [user.id])

  const toggle = (field:'instruments'|'music_genres'|'looking_for', val:string) => {
    setProfile(p => ({ ...p, [field]: p[field].includes(val) ? p[field].filter((x:string) => x !== val) : [...p[field], val] }))
  }

  const toggleVisibility = (visKey: string) => {
    setProfile(p => ({
      ...p,
      social_visibility: { ...p.social_visibility, [visKey]: !p.social_visibility[visKey] },
    }))
  }

  const addTag = (field: 'influences'|'favorite_artists', val: string) => {
    const v = val.trim()
    if (!v) return
    setMusicProfile(p => ({ ...p, [field]: p[field].includes(v) ? p[field] : [...p[field], v] }))
  }

  const removeTag = (field: 'influences'|'favorite_artists', val: string) => {
    setMusicProfile(p => ({ ...p, [field]: p[field].filter(x => x !== val) }))
  }

  const save = async () => {
    await supabase.from('profiles').upsert({ id: user.id, ...profile, updated_at: new Date().toISOString() })
    await supabase.from('music_profiles').upsert({
      user_id: user.id,
      instruments: profile.instruments,
      genres: profile.music_genres,
      looking_for: profile.looking_for,
      level: musicProfile.level || null,
      influences: musicProfile.influences,
      mood_text: musicProfile.mood_text || null,
      favorite_artists: musicProfile.favorite_artists,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = (profile.display_name||'U').slice(0,2).toUpperCase()
  const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', border:'1px solid rgba(196,84,122,0.12)', borderRadius:10, fontSize:13, fontFamily:'Nunito,sans-serif', outline:'none', background:'#FFF5F8', color:'#2D1A25', marginBottom:10 }
  const card: React.CSSProperties = { background:'white', border:'1px solid rgba(196,84,122,0.1)', borderRadius:24, padding:20 }
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:'#9B7A8A', marginBottom:14, display:'block' }

  const filledSocials = SOCIALS.filter(s => (profile as unknown as Record<string,string>)[s.key])
  const visibleCount = profile.show_socials
    ? filledSocials.filter(s => profile.social_visibility[s.visKey]).length
    : 0

  return (
    <div style={{ padding:28, maxWidth:800, display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── En-tête profil ── */}
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'#FDE8F2', color:'#C4547A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, fontWeight:800, border:'2px solid #C4547A', flexShrink:0 }}>
          {initials}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:24, fontWeight:800, letterSpacing:-0.5 }}>{profile.display_name||'Mon profil'}</div>
          <div style={{ fontSize:14, color:'#9B7A8A', margin:'4px 0 12px' }}>{profile.city||'Ajoute ta ville'} · {user.email}</div>
          <div style={{ display:'flex', gap:10 }}>
            {['Likes','Contacts','Matches'].map(l => (
              <div key={l} style={{ textAlign:'center' }}><div style={{ fontSize:18, fontWeight:700 }}>0</div><div style={{ fontSize:11, color:'#9B7A8A' }}>{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Informations de base ── */}
      <div style={card}>
        <span style={lbl}>Informations de base</span>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <input style={inp} placeholder="Pseudo / Nom affiché" value={profile.display_name} onChange={e => setProfile(p => ({ ...p, display_name:e.target.value }))} />
            <input style={inp} placeholder="Ville" value={profile.city} onChange={e => setProfile(p => ({ ...p, city:e.target.value }))} />
          </div>
          <textarea style={{ ...inp, height:88, resize:'none', marginBottom:0 }} placeholder="Bio..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio:e.target.value }))} />
        </div>
      </div>

      {/* ── Réseaux sociaux avec toggle visibilité ── */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <span style={lbl}>Mes réseaux &amp; contacts</span>
          <span style={{ fontSize:11, color:'#9B7A8A', fontWeight:700 }}>
            {profile.show_socials ? `${visibleCount} visible${visibleCount>1?'s':''} sur ${filledSocials.length}` : 'Mode caché actif'}
          </span>
        </div>
        {SOCIALS.map(s => {
          const val = (profile as unknown as Record<string,string>)[s.key] || ''
          const isVisible = profile.social_visibility[s.visKey]
          return (
            <div key={s.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={socialBadgeStyle(s.color)}>{s.label}</div>
              <input
                style={{ ...inp, marginBottom:0, flex:1, opacity: val ? 1 : 0.6 }}
                placeholder={s.ph}
                value={val}
                onChange={e => setProfile(p => ({ ...p, [s.key]:e.target.value }))}
              />
              {val && (
                <button
                  onClick={() => toggleVisibility(s.visKey)}
                  title={isVisible ? 'Visible — cliquer pour cacher' : 'Caché — cliquer pour afficher'}
                  style={{
                    width:34, height:34, borderRadius:10, border:'1px solid rgba(196,84,122,0.15)',
                    background: isVisible ? '#D6F5E6' : '#F5F5F5',
                    color: isVisible ? '#1A6645' : '#9B7A8A',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0, transition:'all 0.15s',
                  }}
                >
                  <EyeIcon open={isVisible} />
                </button>
              )}
            </div>
          )
        })}
        <div style={{ marginTop:8, padding:'8px 12px', background:'#FFF5F8', borderRadius:12, fontSize:12, color:'#9B7A8A', fontWeight:600 }}>
          L&apos;icône œil contrôle ce que les autres voient sur votre profil public.
        </div>
      </div>

      {/* ── Instruments & Genres ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div style={card}>
          <span style={lbl}>Mes instruments</span>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {INSTRUMENTS.map(i => <button key={i} style={tagBtnStyle(profile.instruments.includes(i))} onClick={() => toggle('instruments',i)}>{i}</button>)}
          </div>
        </div>
        <div style={card}>
          <span style={lbl}>Styles musicaux</span>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {GENRES.map(g => <button key={g} style={tagBtnStyle(profile.music_genres.includes(g),'#C4547A','#FDE8F2','#7A1F40')} onClick={() => toggle('music_genres',g)}>{g}</button>)}
          </div>
        </div>
      </div>

      {/* ── Je cherche ── */}
      <div style={card}>
        <span style={lbl}>Je cherche</span>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {LOOKING.map(l => <button key={l.id} style={{ ...tagBtnStyle(profile.looking_for.includes(l.id)), padding:'10px 18px', fontSize:13 }} onClick={() => toggle('looking_for',l.id)}>{l.label}</button>)}
        </div>
      </div>

      {/* ── Profil Musical Avancé ── */}
      <div style={card}>
        <span style={lbl}>Profil Musical Avancé</span>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#9B7A8A', marginBottom:8 }}>Niveau</div>
          <div style={{ display:'flex', gap:8 }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => setMusicProfile(p => ({ ...p, level: p.level === l ? '' : l }))}
                style={tagBtnStyle(musicProfile.level === l, '#3BAD7A', '#D6F5E6', '#1A6645')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#9B7A8A', marginBottom:8 }}>Influences musicales</div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input style={{ ...inp, marginBottom:0, flex:1 }} placeholder="Ex: Miles Davis, Radiohead..."
              value={influenceInput} onChange={e => setInfluenceInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') { addTag('influences',influenceInput); setInfluenceInput('') } }} />
            <button onClick={() => { addTag('influences',influenceInput); setInfluenceInput('') }}
              style={{ padding:'10px 16px', borderRadius:12, border:'none', background:'#A78BDB', color:'white', cursor:'pointer', fontFamily:'Nunito,sans-serif', fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>
              + Ajouter
            </button>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {musicProfile.influences.map(inf => (
              <span key={inf} style={{ padding:'5px 12px', borderRadius:20, background:'#EDE8F8', color:'#5B3FAD', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                {inf}<span onClick={() => removeTag('influences',inf)} style={{ cursor:'pointer', opacity:0.6, fontSize:14, lineHeight:1 }}>×</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#9B7A8A', marginBottom:8 }}>Artistes favoris</div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input style={{ ...inp, marginBottom:0, flex:1 }} placeholder="Ex: Daft Punk, Adele..."
              value={artistInput} onChange={e => setArtistInput(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') { addTag('favorite_artists',artistInput); setArtistInput('') } }} />
            <button onClick={() => { addTag('favorite_artists',artistInput); setArtistInput('') }}
              style={{ padding:'10px 16px', borderRadius:12, border:'none', background:'#C4547A', color:'white', cursor:'pointer', fontFamily:'Nunito,sans-serif', fontWeight:700, fontSize:13, whiteSpace:'nowrap' }}>
              + Ajouter
            </button>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {musicProfile.favorite_artists.map(a => (
              <span key={a} style={{ padding:'5px 12px', borderRadius:20, background:'#FDE8F2', color:'#7A1F40', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                {a}<span onClick={() => removeTag('favorite_artists',a)} style={{ cursor:'pointer', opacity:0.6, fontSize:14, lineHeight:1 }}>×</span>
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#9B7A8A', marginBottom:8 }}>Ma vibe musicale</div>
          <textarea style={{ ...inp, height:80, resize:'none', marginBottom:0 }} placeholder="Décris ton univers musical, ton ambiance..."
            value={musicProfile.mood_text} onChange={e => setMusicProfile(p => ({ ...p, mood_text:e.target.value }))} />
        </div>
      </div>

      {/* ── Confidentialité ── */}
      <div style={card}>
        <span style={lbl}>Confidentialité</span>

        {/* Mode caché global */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'14px 16px', borderRadius:16,
          background: !profile.show_socials ? '#2D1A25' : '#FFF5F8',
          marginBottom:16, transition:'background 0.2s',
        }}>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color: !profile.show_socials ? 'white' : '#2D1A25' }}>
              Mode caché
            </div>
            <div style={{ fontSize:11, color: !profile.show_socials ? 'rgba(255,255,255,0.6)' : '#9B7A8A', marginTop:2 }}>
              {!profile.show_socials
                ? 'Vos coordonnées sont cachées de tous les profils'
                : 'Vos coordonnées sont visibles selon vos réglages'}
            </div>
          </div>
          <button
            onClick={() => setProfile(p => ({ ...p, show_socials: !p.show_socials }))}
            style={{
              padding:'8px 18px', borderRadius:20, border:'none', cursor:'pointer',
              fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:800,
              background: !profile.show_socials ? '#C4547A' : 'rgba(196,84,122,0.12)',
              color: !profile.show_socials ? 'white' : '#C4547A',
              transition:'all 0.15s',
            }}
          >
            {!profile.show_socials ? '🔒 Actif' : 'Activer'}
          </button>
        </div>

        {/* Visibilité par réseau (disponible seulement si mode caché désactivé) */}
        {profile.show_socials && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:0.5, color:'#9B7A8A', textTransform:'uppercase', marginBottom:10 }}>
              Visibilité par réseau
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {SOCIALS.map(s => {
                const val = (profile as unknown as Record<string,string>)[s.key]
                const isVisible = profile.social_visibility[s.visKey]
                return (
                  <div key={s.visKey} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'10px 14px', borderRadius:12,
                    background: val ? (isVisible ? '#F6FEF9' : '#FFF5F8') : '#FAFAFA',
                    border: `1px solid ${val ? (isVisible ? 'rgba(59,173,122,0.2)' : 'rgba(196,84,122,0.15)') : 'rgba(0,0,0,0.05)'}`,
                    opacity: val ? 1 : 0.45,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={socialBadgeStyle(s.color)}>{s.label}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:'#2D1A25' }}>{s.name}</div>
                        <div style={{ fontSize:11, color:'#9B7A8A' }}>
                          {val ? (isVisible ? 'Visible sur votre profil' : 'Caché aux autres') : 'Non renseigné'}
                        </div>
                      </div>
                    </div>
                    {val && (
                      <button
                        onClick={() => toggleVisibility(s.visKey)}
                        style={{
                          display:'flex', alignItems:'center', gap:6,
                          padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer',
                          fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:700,
                          background: isVisible ? '#D6F5E6' : '#F0F0F0',
                          color: isVisible ? '#1A6645' : '#9B7A8A',
                          transition:'all 0.15s',
                        }}
                      >
                        <EyeIcon open={isVisible} />
                        {isVisible ? 'Visible' : 'Caché'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Ma ville */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderTop:'1px solid rgba(196,84,122,0.08)', marginBottom:4 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700 }}>Afficher ma ville</div>
            <div style={{ fontSize:11, color:'#9B7A8A', marginTop:2 }}>Les autres voient votre localisation</div>
          </div>
          <button
            onClick={() => setProfile(p => ({ ...p, show_location: !p.show_location }))}
            style={{
              padding:'6px 16px', borderRadius:20, border:'none', cursor:'pointer',
              fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:700,
              background: profile.show_location ? '#D6F5E6' : '#F0F0F0',
              color: profile.show_location ? '#1A6645' : '#9B7A8A',
              transition:'all 0.15s',
            }}
          >
            {profile.show_location ? '✓ Activé' : '○ Désactivé'}
          </button>
        </div>

        {/* Qui peut m'écrire */}
        <div style={{ paddingTop:12, borderTop:'1px solid rgba(196,84,122,0.08)' }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Qui peut m&apos;envoyer des messages ?</div>
          <div style={{ display:'flex', gap:8 }}>
            {([
              {id:'all',     label:'Tout le monde', icon:'🌍'},
              {id:'matches', label:'Mes matchs',     icon:'💑'},
              {id:'none',    label:'Personne',       icon:'🔕'},
            ] as const).map(opt => (
              <button
                key={opt.id}
                onClick={() => setProfile(p => ({ ...p, allow_messages_from: opt.id }))}
                style={{
                  flex:1, padding:'10px 8px', borderRadius:14, cursor:'pointer',
                  fontFamily:'Nunito,sans-serif', fontSize:12, fontWeight:700,
                  border: profile.allow_messages_from === opt.id ? '2px solid #C4547A' : '1px solid rgba(0,0,0,0.08)',
                  background: profile.allow_messages_from === opt.id ? '#FDE8F2' : 'white',
                  color: profile.allow_messages_from === opt.id ? '#7A1F40' : '#9B7A8A',
                  transition:'all 0.15s', textAlign:'center',
                }}
              >
                <div style={{ fontSize:18, marginBottom:4 }}>{opt.icon}</div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={save} style={{
        padding:'14px 28px', color:'white', border:'none', borderRadius:32,
        fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif',
        background: saved ? 'linear-gradient(135deg,#3BAD7A,#6DDBA8)' : 'linear-gradient(135deg,#C4547A,#F9A8C9)',
        boxShadow: saved ? '0 4px 16px rgba(59,173,122,0.3)' : '0 4px 16px rgba(196,84,122,0.3)',
        transition:'all 0.2s',
      }}>
        {saved ? '✅ Profil sauvegardé !' : 'Sauvegarder mon profil'}
      </button>
    </div>
  )
}
