import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { detectPlatform, getEmbedUrl, MUSIC_PLATFORMS, type MusicLink } from '../../lib/musicPlatforms'

interface Props { user: User }

const INSTRUMENTS = ['Guitare','Piano','Basse','Batterie','Chant','Saxo','Violon','DJ','Ukulélé','Flûte','Trompette','Clarinette']
const GENRES = ['Rock','Jazz','Blues','Pop','Funk','Soul','Hip-Hop','Électro','Classique','Folk','Metal','R&B','Reggae','Indie']
const LOOKING = [{id:'rencontre',label:'💑 Rencontre amoureuse'},{id:'collab',label:'🎵 Collaboration musicale'},{id:'amis',label:'👥 Amis / Réseau'}]
const LEVELS = ['Débutant','Intermédiaire','Confirmé','Pro'] as const

type Level = typeof LEVELS[number]

// ── Réseaux & plateformes — partage libre, toutes destinations ────────────────
// Organisés par catégorie pour clarté, mais tout est libre
const SOCIALS_GROUPS = [
  {
    group: '🎵 Musique & Création',
    items: [
      {key:'social_soundcloud',  visKey:'soundcloud',  label:'SC', color:'#f50',    ph:'soundcloud.com/monprofil',   name:'SoundCloud'},
      {key:'social_spotify',     visKey:'spotify',     label:'SP', color:'#1DB954', ph:'open.spotify.com/artist/...', name:'Spotify'},
      {key:'social_youtube',     visKey:'youtube',     label:'YT', color:'#FF0000', ph:'youtube.com/machaîne',       name:'YouTube'},
      {key:'social_bandcamp',    visKey:'bandcamp',    label:'BC', color:'#1DA0C3', ph:'monartiste.bandcamp.com',    name:'Bandcamp'},
      {key:'social_deezer',      visKey:'deezer',      label:'DZ', color:'#A238FF', ph:'deezer.com/profile/...',     name:'Deezer'},
      {key:'social_applemusic',  visKey:'applemusic',  label:'AM', color:'#FC3C44', ph:'music.apple.com/...',        name:'Apple Music'},
      {key:'social_mixcloud',    visKey:'mixcloud',    label:'MC', color:'#52AAD8', ph:'mixcloud.com/monprofil',     name:'Mixcloud'},
    ]
  },
  {
    group: '📱 Réseaux sociaux',
    items: [
      {key:'social_instagram',   visKey:'instagram',   label:'IG', color:'#C13584', ph:'@moninsta',                  name:'Instagram'},
      {key:'social_tiktok',      visKey:'tiktok',      label:'TT', color:'#111',    ph:'@montiktok',                 name:'TikTok'},
      {key:'social_facebook',    visKey:'facebook',    label:'fb', color:'#1877F2', ph:'facebook.com/moi',           name:'Facebook'},
      {key:'social_twitter',     visKey:'twitter',     label:'X',  color:'#000',    ph:'@montwitter',                name:'X / Twitter'},
      {key:'social_pinterest',   visKey:'pinterest',   label:'Pi', color:'#E60023', ph:'pinterest.com/monprofil',    name:'Pinterest'},
      {key:'social_bereal',      visKey:'bereal',      label:'BR', color:'#000',    ph:'@monbereal',                 name:'BeReal'},
      {key:'social_snapchat',    visKey:'snapchat',    label:'Sn', color:'#FFFC00', ph:'@monsnapchat',               name:'Snapchat'},
    ]
  },
  {
    group: '🎮 Gaming & Streaming',
    items: [
      {key:'social_twitch',      visKey:'twitch',      label:'Tw', color:'#9146FF', ph:'twitch.tv/monprofil',        name:'Twitch'},
      {key:'social_discord_tag', visKey:'discordtag',  label:'Dc', color:'#5865F2', ph:'monpseudo#1234 ou monserveur', name:'Discord'},
    ]
  },
  {
    group: '💼 Pro & Lien universel',
    items: [
      {key:'social_linkedin',    visKey:'linkedin',    label:'in', color:'#0A66C2', ph:'linkedin.com/in/moi',        name:'LinkedIn'},
      {key:'social_linktree',    visKey:'linktree',    label:'LT', color:'#39E09B', ph:'linktr.ee/monprofil',        name:'Linktree'},
      {key:'social_website',     visKey:'website',     label:'🌐', color:'#6BB8E8', ph:'https://monsite.com',        name:'Site web perso'},
      {key:'social_email_public',visKey:'email',       label:'@',  color:'#9B7A8A', ph:'contact@monsite.com',        name:'Email public'},
    ]
  },
]

// Liste plate pour traitement uniforme
const SOCIALS = SOCIALS_GROUPS.flatMap(g => g.items)

const DEFAULT_VISIBILITY: Record<string, boolean> = Object.fromEntries(
  SOCIALS.map(s => [s.visKey, true])
)

// tagBtnStyle est recréé à l'intérieur du composant pour accéder au thème

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
  const { theme: tk } = useTheme()
  const BG   = tk.bg2
  const SURF = tk.surface
  const BDR  = tk.border
  const TXT  = tk.text
  const MUT  = tk.textMuted
  const INP  = tk.inputBg

  // ── Playlists & sons partagés ──────────────────────────────────────────────
  const [musicLinks, setMusicLinks]   = useState<MusicLink[]>([])
  const [musicInput, setMusicInput]   = useState('')
  const [musicTitle, setMusicTitle]   = useState('')
  const [musicError, setMusicError]   = useState('')

  const addMusicLink = () => {
    const url = musicInput.trim()
    if (!url.startsWith('http')) { setMusicError('Colle une URL complète (https://...)'); return }
    const platform = detectPlatform(url)
    if (!platform) { setMusicError('Plateforme non reconnue'); return }
    const link: MusicLink = {
      id: Date.now().toString(),
      url,
      title: musicTitle.trim() || platform.name,
      platform: platform.id,
      showEmbed: true,
    }
    setMusicLinks(prev => [link, ...prev])
    setMusicInput(''); setMusicTitle(''); setMusicError('')
  }

  const removeMusicLink = (id: string) => setMusicLinks(prev => prev.filter(l => l.id !== id))
  const toggleEmbed = (id: string) => setMusicLinks(prev => prev.map(l => l.id===id ? {...l,showEmbed:!l.showEmbed} : l))

  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    display_name: user.email?.split('@')[0]||'',
    bio:'', city:'', country:'FR',
    instruments:[] as string[],
    music_genres:[] as string[],
    looking_for:[] as string[],
    // Tous les réseaux & plateformes
    social_soundcloud:'', social_spotify:'', social_youtube:'',
    social_bandcamp:'', social_deezer:'', social_applemusic:'', social_mixcloud:'',
    social_instagram:'', social_tiktok:'', social_facebook:'',
    social_twitter:'', social_pinterest:'', social_bereal:'', social_snapchat:'',
    social_twitch:'', social_discord_tag:'',
    social_linkedin:'', social_linktree:'', social_website:'', social_email_public:'',
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
  const tagBtnStyle = (active: boolean, activeColor = '#A78BDB', activeBg = '#EDE8F8', activeText = '#5B3FAD'): React.CSSProperties => ({
    padding:'6px 14px', borderRadius:20,
    border: active ? `1px solid ${activeColor}` : `1px solid ${BDR}`,
    background: active ? activeBg : SURF,
    color: active ? activeText : MUT,
    cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Nunito,sans-serif', transition:'all 0.1s',
  })

  const inp: React.CSSProperties = { width:'100%', padding:'10px 14px', border:`1px solid ${BDR}`, borderRadius:10, fontSize:13, fontFamily:'Nunito,sans-serif', outline:'none', background:INP, color:TXT, marginBottom:10 }
  const card: React.CSSProperties = { background:SURF, border:`1px solid ${BDR}`, borderRadius:24, padding:20 }
  const lbl: React.CSSProperties = { fontSize:11, fontWeight:800, letterSpacing:1, textTransform:'uppercase', color:MUT, marginBottom:14, display:'block' }

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
          <div style={{ fontSize:14, color:MUT, margin:'4px 0 12px' }}>{profile.city||'Ajoute ta ville'} · {user.email}</div>
          <div style={{ display:'flex', gap:10 }}>
            {['Likes','Contacts','Matches'].map(l => (
              <div key={l} style={{ textAlign:'center' }}><div style={{ fontSize:18, fontWeight:700 }}>0</div><div style={{ fontSize:11, color:MUT }}>{l}</div></div>
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

      {/* ── Réseaux & plateformes — partage libre ── */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <span style={lbl}>Mes liens & réseaux</span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:MUT, fontWeight:700 }}>
              {profile.show_socials ? `${visibleCount} visible${visibleCount>1?'s':''} sur ${filledSocials.length}` : 'Mode caché actif'}
            </span>
            {/* Bouton partage profil */}
            <button
              onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/profil/${user.id}`); setSaved(true); setTimeout(()=>setSaved(false),2000) }}
              title="Copier le lien de mon profil"
              style={{ padding:'5px 12px', borderRadius:20, border:'1px solid rgba(107,184,232,0.3)', background:'#F0F7FD', color:'#2A6090', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}
            >🔗 Copier mon profil</button>
          </div>
        </div>

        {/* Note de confidentialité */}
        <div style={{ padding:'10px 14px', background:'#F0FBF4', borderRadius:12, border:'1px solid #D6F5E6', fontSize:12, color:'#2A7A4A', fontWeight:600, marginBottom:16, display:'flex', gap:8 }}>
          <span>🛡️</span>
          <span>VibzGuard protège ton identité. Tu choisis ce que tu partages et avec qui. L&apos;œil 👁️ contrôle la visibilité sur ton profil public. Ne partage pas tes coordonnées en chat public.</span>
        </div>

        {/* Groupes de réseaux */}
        {SOCIALS_GROUPS.map(group => {
          const filledInGroup = group.items.filter(s => (profile as unknown as Record<string,string>)[s.key])
          return (
            <div key={group.group} style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:800, color:MUT, letterSpacing:0.5, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <span>{group.group}</span>
                {filledInGroup.length > 0 && (
                  <span style={{ padding:'1px 8px', borderRadius:10, background:'#F0FBF4', color:'#2A7A4A', fontSize:10, fontWeight:800 }}>
                    {filledInGroup.length} renseigné{filledInGroup.length>1?'s':''}
                  </span>
                )}
              </div>
              {group.items.map(s => {
                const val = (profile as unknown as Record<string,string>)[s.key] || ''
                const isVisible = profile.social_visibility[s.visKey]
                return (
                  <div key={s.key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{
                      ...socialBadgeStyle(s.color),
                      width:28, height:28, borderRadius:7, fontSize:10,
                      opacity: val ? 1 : 0.35,
                    }}>{s.label}</div>
                    <input
                      style={{ ...inp, marginBottom:0, flex:1, fontSize:12, padding:'8px 12px', opacity: val ? 1 : 0.7 }}
                      placeholder={`${s.name} — ${s.ph}`}
                      value={val}
                      onChange={e => setProfile(p => ({ ...p, [s.key]:e.target.value }))}
                    />
                    {/* Ouvrir le lien */}
                    {val && val.startsWith('http') && (
                      <a href={val} target="_blank" rel="noopener noreferrer" title={`Ouvrir ${s.name}`}
                        style={{ width:32, height:32, borderRadius:9, border:'1px solid rgba(107,184,232,0.2)', background:'#F0F7FD', color:'#2A6090', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, textDecoration:'none' }}>
                        ↗
                      </a>
                    )}
                    {/* Toggle visibilité */}
                    {val && (
                      <button
                        onClick={() => toggleVisibility(s.visKey)}
                        title={isVisible ? 'Visible sur ton profil — cliquer pour masquer' : 'Masqué — cliquer pour afficher'}
                        style={{
                          width:32, height:32, borderRadius:9, border:'1px solid rgba(196,84,122,0.15)',
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
            </div>
          )
        })}
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
          <div style={{ fontSize:12, fontWeight:700, color:MUT, marginBottom:8 }}>Niveau</div>
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
          <div style={{ fontSize:12, fontWeight:700, color:MUT, marginBottom:8 }}>Influences musicales</div>
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
          <div style={{ fontSize:12, fontWeight:700, color:MUT, marginBottom:8 }}>Artistes favoris</div>
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
          <div style={{ fontSize:12, fontWeight:700, color:MUT, marginBottom:8 }}>Ma vibe musicale</div>
          <textarea style={{ ...inp, height:80, resize:'none', marginBottom:0 }} placeholder="Décris ton univers musical, ton ambiance..."
            value={musicProfile.mood_text} onChange={e => setMusicProfile(p => ({ ...p, mood_text:e.target.value }))} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
           🎵 MES PLAYLISTS & SONS — Partage musical multiplateforme
      ══════════════════════════════════════════════════════════════════ */}
      <div style={card}>

        {/* En-tête */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={lbl}>🎵 Mes playlists &amp; sons</span>
          <span style={{ fontSize:11, color:MUT, fontWeight:700 }}>
            {musicLinks.length} lien{musicLinks.length>1?'s':''} partagé{musicLinks.length>1?'s':''}
          </span>
        </div>

        {/* Plateformes supportées — badges visuels */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:20 }}>
          {MUSIC_PLATFORMS.map(p => (
            <span key={p.id} style={{
              display:'inline-flex', alignItems:'center', gap:4,
              padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800,
              background: p.bg, color: p.color,
              border: `1px solid ${p.color}44`,
            }}>
              {p.icon} {p.name}
            </span>
          ))}
        </div>

        {/* Formulaire d'ajout */}
        <div style={{ background:BG, borderRadius:16, padding:16, marginBottom:20, border:`1.5px solid ${BDR}` }}>
          <div style={{ fontSize:12, fontWeight:800, color:TXT, marginBottom:10 }}>➕ Partager un lien musical</div>

          <input
            style={{ ...inp, marginBottom:8 }}
            placeholder="Titre / Description (optionnel — ex: Ma playlist du soir 🌙)"
            value={musicTitle}
            onChange={e => setMusicTitle(e.target.value)}
          />

          <div style={{ display:'flex', gap:8 }}>
            <input
              style={{ ...inp, marginBottom:0, flex:1, fontFamily:'monospace', fontSize:12 }}
              placeholder="https://open.spotify.com/... · deezer.com/... · soundcloud.com/... · youtu.be/..."
              value={musicInput}
              onChange={e => { setMusicInput(e.target.value); setMusicError('') }}
              onKeyDown={e => e.key==='Enter' && addMusicLink()}
            />
            <button
              onClick={addMusicLink}
              style={{
                padding:'10px 18px', borderRadius:12, border:'none', cursor:'pointer',
                background:`linear-gradient(135deg,#E07A9A,#6BB8E8)`,
                color:'white', fontWeight:800, fontSize:13, fontFamily:'Nunito,sans-serif',
                whiteSpace:'nowrap', flexShrink:0,
              }}
            >Ajouter ➤</button>
          </div>

          {/* Erreur */}
          {musicError && (
            <div style={{ marginTop:8, padding:'8px 12px', background:'rgba(224,122,154,0.12)', borderRadius:8, fontSize:12, color:'#E07A9A', fontWeight:700 }}>
              ⚠️ {musicError}
            </div>
          )}

          {/* Détection plateforme en live */}
          {musicInput.startsWith('http') && (() => {
            const p = detectPlatform(musicInput)
            if (!p) return null
            return (
              <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:p.bg, borderRadius:8, border:`1px solid ${p.color}44` }}>
                <span style={{ fontSize:18 }}>{p.icon}</span>
                <span style={{ fontSize:12, fontWeight:800, color:p.color }}>{p.name} détecté</span>
                {getEmbedUrl(musicInput) && <span style={{ fontSize:10, color:p.color, opacity:0.7 }}>· Lecteur intégré disponible</span>}
              </div>
            )
          })()}
        </div>

        {/* Liste des liens ajoutés */}
        {musicLinks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'28px 20px', color:MUT, fontSize:13 }}>
            <div style={{ fontSize:36, marginBottom:8 }}>🎵</div>
            <div style={{ fontWeight:700, marginBottom:4 }}>Aucun son partagé pour l&apos;instant</div>
            <div style={{ fontSize:12 }}>Colle un lien Spotify, Deezer, SoundCloud, YouTube… ci-dessus !</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {musicLinks.map(link => {
              const plat = detectPlatform(link.url)
              const embedUrl = getEmbedUrl(link.url)
              return (
                <div key={link.id} style={{
                  borderRadius:16, overflow:'hidden',
                  border:`1.5px solid ${plat ? plat.color+'44' : BDR}`,
                  background: plat ? plat.bg : BG,
                }}>
                  {/* Header de la carte */}
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px' }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{plat?.icon ?? '🎵'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, fontSize:13, color:TXT, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {link.title}
                      </div>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize:11, color:plat?.color ?? '#6BB8E8', fontWeight:700, textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                        {link.url.length > 55 ? link.url.slice(0,55)+'…' : link.url} ↗
                      </a>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      {embedUrl && (
                        <button onClick={() => toggleEmbed(link.id)} style={{
                          padding:'5px 10px', borderRadius:8, border:`1px solid ${plat?.color ?? BDR}44`,
                          background: link.showEmbed ? (plat?.bg ?? BG) : SURF,
                          color: plat?.color ?? MUT, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'Nunito,sans-serif',
                        }}>
                          {link.showEmbed ? '🎵 Masquer' : '▶ Écouter'}
                        </button>
                      )}
                      <button onClick={() => { navigator.clipboard.writeText(link.url) }} style={{
                        width:30, height:30, borderRadius:8, border:`1px solid ${BDR}`,
                        background:SURF, color:MUT, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      }} title="Copier le lien">🔗</button>
                      <button onClick={() => removeMusicLink(link.id)} style={{
                        width:30, height:30, borderRadius:8, border:'1px solid rgba(224,122,154,0.3)',
                        background:'rgba(224,122,154,0.08)', color:'#E07A9A', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      }} title="Supprimer">×</button>
                    </div>
                  </div>

                  {/* Lecteur intégré */}
                  {embedUrl && link.showEmbed && (
                    <div style={{ padding:'0 0 0 0' }}>
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height={link.platform==='youtube'||link.platform==='youtubemusic' ? 280 : link.platform==='soundcloud' ? 140 : 152}
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        title={link.title}
                        style={{ display:'block', border:'none' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Note de confidentialité */}
        <div style={{ marginTop:16, padding:'10px 14px', background:tk.greenLight, borderRadius:12, border:`1px solid ${tk.green}33`, fontSize:12, color:tk.greenDark, fontWeight:600, display:'flex', gap:8 }}>
          <span>🔒</span>
          <span>Tes playlists sont visibles sur ton profil public. N&apos;y partage que des contenus dont tu as les droits ou qui sont en accès libre.</span>
        </div>
      </div>

      {/* ── Confidentialité ── */}
      <div style={card}>
        <span style={lbl}>Confidentialité</span>

        {/* Mode caché global */}
        <div style={{
          display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'14px 16px', borderRadius:16,
          background: !profile.show_socials ? '#2D1A25' : INP,
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
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:0.5, color:MUT, textTransform:'uppercase', marginBottom:10 }}>
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
                    background: val ? (isVisible ? '#F6FEF9' : INP) : '#FAFAFA',
                    border: `1px solid ${val ? (isVisible ? 'rgba(59,173,122,0.2)' : 'rgba(196,84,122,0.15)') : 'rgba(0,0,0,0.05)'}`,
                    opacity: val ? 1 : 0.45,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={socialBadgeStyle(s.color)}>{s.label}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:TXT }}>{s.name}</div>
                        <div style={{ fontSize:11, color:MUT }}>
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
            <div style={{ fontSize:11, color:MUT, marginTop:2 }}>Les autres voient votre localisation</div>
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
