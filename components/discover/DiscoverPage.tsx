import { useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import ShareModal, { type ShareContext } from '../shared/ShareModal'
import DonationBanner from '../shared/DonationBanner'
import InviteWidget from '../shared/InviteWidget'
import VinylGalaxy, { GALAXY_ITEMS } from './VinylGalaxy'

interface Props { user: User; onMessage: () => void }

const EMOJI_MAP: Record<string, string> = { Guitare:'🎸', Piano:'🎹', Basse:'🎸', Batterie:'🥁', Chant:'🎤', Saxo:'🎷', Violon:'🎻', DJ:'🎧', Ukulélé:'🪕', Flûte:'🪈' }

export default function DiscoverPage({ user, onMessage }: Props) {
  const { theme: tk } = useTheme()
  const BG   = tk.bg2
  const SURF = tk.surface
  const BDR  = tk.border
  const TXT  = tk.text
  const MUT  = tk.textMuted

  const BANNER_BG: Record<string, string> = tk.isDark
    ? { Guitare:'#2A1E3E', Piano:'#1A2E26', Basse:'#2E2A1A', Batterie:'#2E1E26', Chant:'#1A2E26', Saxo:'#2E2A1A', DJ:'#2A1E3E', Violon:'#2E1E26' }
    : { Guitare:'#EEEDFE', Piano:'#E1F5EE', Basse:'#FAEEDA', Batterie:'#FBEAF0', Chant:'#E1F5EE', Saxo:'#FAEEDA', DJ:'#EEEDFE', Violon:'#FBEAF0' }

  const [profiles, setProfiles]         = useState<Profile[]>([])
  const [loading, setLoading]           = useState(true)
  const [searchProfiles, setSearchProfiles] = useState('')
  const [galaxyFilters, setGalaxyFilters]   = useState<string[]>([])
  const [likedIds, setLikedIds]         = useState<Set<string>>(new Set())
  const [matchName, setMatchName]       = useState<string|null>(null)
  const [notif, setNotif]               = useState<{ msg: string; color: string }|null>(null)
  const [currentUserName, setCurrentUserName] = useState('')
  const [shareCtx, setShareCtx]         = useState<ShareContext | null>(null)
  const [showDonation, setShowDonation] = useState(false)
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null)
  const [salonCreated, setSalonCreated] = useState<string | null>(null)

  // Notification salon créé
  const showNotif = (msg: string, color = '#D4537E') => {
    setNotif({ msg, color })
    setTimeout(() => setNotif(null), 3500)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: blocks }, { data: likes }, { data: myProfile }] = await Promise.all([
      supabase.from('blocks').select('blocked_id'),
      supabase.from('likes').select('to_user').eq('from_user', user.id),
      supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    ])
    if (myProfile?.display_name) setCurrentUserName(myProfile.display_name)
    setLikedIds(new Set((likes || []).map(l => l.to_user as string)))
    const blockedIds = (blocks || []).map(b => b.blocked_id as string)
    let q = supabase.from('profiles').select('*').neq('id', user.id).eq('is_banned', false)
    if (blockedIds.length > 0) q = q.not('id', 'in', `(${blockedIds.join(',')})`)
    const { data } = await q.order('is_online', { ascending: false }).limit(50)
    setProfiles(data || [])
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  const handleLike = async (targetId: string, name: string) => {
    if (likedIds.has(targetId)) return
    setLikedIds(p => { const s = new Set(Array.from(p)); s.add(targetId); return s })
    await supabase.from('likes').insert({ from_user: user.id, to_user: targetId })
    const { data } = await supabase.from('likes').select('id')
      .eq('from_user', targetId).eq('to_user', user.id).maybeSingle()
    if (data) {
      setMatchName(name)
      setMatchProfile(profiles.find(p => p.id === targetId) || null)
      setTimeout(() => setMatchName(null), 4000)
      supabase.functions.invoke('send-notification', {
        body: { type: 'match', userId: targetId, fromName: currentUserName || user.email?.split('@')[0] || 'Quelqu\'un' }
      })
      setTimeout(() => setShowDonation(true), 5000)
    }
  }

  const handleWizzz = async (targetId: string, name: string) => {
    const { error } = await supabase.from('wizzz').insert({ sender_id: user.id, receiver_id: targetId })
    if (error?.message?.includes('rate_limit')) showNotif('⏳ Attends 30s avant de renvoyer un wizzz !', '#6b7280')
    else if (error) showNotif('Erreur lors du wizzz', '#ef4444')
    else showNotif(`⚡ Wizzz envoyé à ${name} !`, '#7F77DD')
  }

  const handleBlock = async (targetId: string, name: string) => {
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: targetId })
    setProfiles(p => p.filter(x => x.id !== targetId))
    showNotif(`🚫 ${name} bloqué`, '#6b7280')
  }

  // Création salon depuis le VinylGalaxy
  const handleCreateSalon = useCallback((name: string, selections: string[]) => {
    setSalonCreated(name)
    setTimeout(() => setSalonCreated(null), 4000)
    showNotif(`🎛️ Salon "${name}" créé !`, '#A78BDB')
    // Ici on pourrait naviguer vers les salons avec le nouveau salon
  }, [])

  // Filtrage profils — croise la recherche texte + filtres galaxy
  const filteredProfiles = profiles.filter(p => {
    // Recherche texte sur profils
    if (searchProfiles) {
      const q = searchProfiles.toLowerCase()
      const ok = (p.display_name || '').toLowerCase().includes(q)
        || (p.city || '').toLowerCase().includes(q)
        || (p.instruments || []).some(i => i.toLowerCase().includes(q))
      if (!ok) return false
    }
    // Filtres galaxy sélectionnés
    if (galaxyFilters.length === 0) return true
    const selectedItems = galaxyFilters.map(id => GALAXY_ITEMS.find(i => i.id === id)).filter(Boolean)
    return selectedItems.some(item => {
      if (!item) return false
      if (item.cat === 'Style') {
        return (p.music_genres || []).some(g => g.toLowerCase().includes(item.label.toLowerCase().split(' ')[0]))
      }
      if (item.cat === 'Instrument') {
        return (p.instruments || []).some(inst => inst.toLowerCase().includes(item.label.toLowerCase().split(' ')[0]))
      }
      if (item.cat === 'Intention') {
        if (item.id === 'rencontre') return (p.looking_for || []).includes('rencontre')
        if (item.id === 'collab') return (p.looking_for || []).includes('collab')
        if (item.id === 'amis') return (p.looking_for || []).includes('amis')
      }
      return true
    })
  })

  const onlineProfiles = profiles.filter(p => p.is_online).slice(0, 4)

  const getSocials = (p: Profile) => {
    const r: { label: string; color: string }[] = []
    if (p.social_soundcloud) r.push({ label: 'SC', color: '#f50' })
    if (p.social_instagram) r.push({ label: 'IG', color: '#C13584' })
    if (p.social_youtube) r.push({ label: 'YT', color: '#FF0000' })
    if (p.social_linkedin) r.push({ label: 'in', color: '#0A66C2' })
    if (p.social_facebook) r.push({ label: 'fb', color: '#1877F2' })
    return r
  }

  return (
    <div style={{ height: 'calc(100vh - 60px)', background: BG, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Notifications ── */}
      {matchName && (
        <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#D4537E,#A78BDB)', color:'white', padding:'16px 24px', borderRadius:20, fontWeight:700, fontSize:15, zIndex:999, boxShadow:'0 8px 40px rgba(212,83,126,0.5)', display:'flex', alignItems:'center', gap:14 }}>
          <span>🎉 Match avec {matchName} !</span>
          <button onClick={() => setShareCtx({ type:'match', name:matchName, instrument:matchProfile?.instruments?.[0]||'', city:matchProfile?.city||'' })}
            style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'white', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'Nunito, sans-serif' }}>
            🚀 Partager
          </button>
        </div>
      )}
      {notif && (
        <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', background:notif.color, color:'white', padding:'12px 24px', borderRadius:14, fontWeight:700, fontSize:14, zIndex:999, boxShadow:`0 6px 24px ${notif.color}66` }}>
          {notif.msg}
        </div>
      )}
      {showDonation && <DonationBanner variant="match" onDismiss={() => setShowDonation(false)} />}
      {shareCtx && <ShareModal context={shareCtx} onClose={() => setShareCtx(null)} />}

      {/* ══════════════════════════════════════════════
           LAYOUT 3 COLONNES — tient sur une page
      ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 400px 220px', overflow: 'hidden' }}>

        {/* ── Colonne 1 : Profils ── */}
        <div style={{ overflowY: 'auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Recherche profils */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `0.5px solid ${BDR}`, borderRadius: 10, background: tk.inputBg }}>
              <span style={{ fontSize: 13, color: MUT }}>🔍</span>
              <input
                style={{ border: 'none', background: 'transparent', fontSize: 12, fontFamily: 'Nunito,sans-serif', outline: 'none', flex: 1, color: TXT }}
                placeholder="Nom, ville..."
                value={searchProfiles}
                onChange={e => setSearchProfiles(e.target.value)}
              />
            </div>
            {galaxyFilters.length > 0 && (
              <div style={{ padding: '6px 10px', borderRadius: 10, background: 'rgba(167,139,219,0.12)', border: '1px solid rgba(167,139,219,0.3)', fontSize: 10, fontWeight: 800, color: '#A78BDB', whiteSpace: 'nowrap' }}>
                🎛️ {galaxyFilters.length}
              </div>
            )}
            <div style={{ fontSize: 10, color: MUT, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {filteredProfiles.length} profil{filteredProfiles.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Grille */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: MUT, fontSize: 14 }}>Chargement des profils...</div>
          ) : filteredProfiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: MUT, fontSize: 13 }}>
              {galaxyFilters.length > 0
                ? 'Aucun profil ne correspond à ce mix musical. Essaie d\'autres styles !'
                : 'Aucun profil trouvé'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {filteredProfiles.map(p => {
                const inst = p.instruments?.[0] || 'Guitare'
                const liked = likedIds.has(p.id)
                const socials = getSocials(p)
                return (
                  <div key={p.id} style={{ background: SURF, border: `0.5px solid ${BDR}`, borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ height: 56, background: BANNER_BG[inst] || (tk.isDark ? '#2A1E3E' : '#EEEDFE'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, position: 'relative' }}>
                      {EMOJI_MAP[inst] || '🎵'}
                      <button onClick={e => { e.stopPropagation(); handleBlock(p.id, p.display_name || '') }}
                        style={{ position: 'absolute', top: 6, right: 8, background: tk.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.75)', border: 'none', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: MUT, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>🚫</button>
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {p.is_online && <span style={{ width: 7, height: 7, background: '#1D9E75', borderRadius: '50%', display: 'inline-block' }} />}
                        <span style={{ fontSize: 15, fontWeight: 700, color: TXT }}>{p.display_name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: MUT, marginBottom: 8 }}>{p.city} · {p.country}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                        {(p.instruments || []).map(i => <span key={i} className="tag tag-music">{i}</span>)}
                        {(p.looking_for || []).includes('rencontre') && <span className="tag tag-love">💑</span>}
                        {(p.looking_for || []).includes('collab') && <span className="tag tag-collab">🎵</span>}
                      </div>
                      {socials.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                          {socials.map(s => (
                            <div key={s.label} style={{ width: 22, height: 22, background: s.color, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800 }}>{s.label}</div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleLike(p.id, p.display_name || '')}
                          style={{ flex: 1, padding: '7px', borderRadius: 8, border: `0.5px solid ${BDR}`, background: liked ? '#D4537E' : tk.pinkLight, color: liked ? 'white' : '#D4537E', cursor: 'pointer', fontSize: 15, fontFamily: 'Nunito,sans-serif', fontWeight: 700, transition: 'all 0.15s' }}>
                          {liked ? '❤️' : '🤍'}
                        </button>
                        <button onClick={() => handleWizzz(p.id, p.display_name || '')}
                          style={{ flex: 1, padding: '7px', borderRadius: 8, border: `0.5px solid ${BDR}`, background: tk.blueLight, color: '#3C3489', cursor: 'pointer', fontSize: 15, fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>⚡</button>
                        <button onClick={onMessage}
                          style={{ flex: 1, padding: '7px', borderRadius: 8, border: `0.5px solid ${BDR}`, background: tk.greenLight, color: '#1D9E75', cursor: 'pointer', fontSize: 15, fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>💬</button>
                        <button onClick={() => setShareCtx({ type:'collab', name:p.display_name||'', instrument:p.instruments?.[0]||'', city:p.city||'', genre:p.music_genres?.[0]||'' })}
                          style={{ padding: '7px 8px', borderRadius: 8, border: `0.5px solid ${BDR}`, background: SURF, color: MUT, cursor: 'pointer', fontSize: 13, fontFamily: 'Nunito,sans-serif', fontWeight: 700 }}>🚀</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Colonne 2 : Vinyl Galaxy (centre) ── */}
        <div style={{
          borderLeft: `1px solid ${BDR}`, borderRight: `1px solid ${BDR}`,
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '14px 8px',
          background: tk.isDark
            ? 'radial-gradient(ellipse at 50% 45%, rgba(167,139,219,0.07) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 45%, rgba(224,122,154,0.05) 0%, transparent 70%)',
        }}>
          <div style={{ marginBottom: 6, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: TXT }}>🎛️ Créer un salon</div>
            <div style={{ fontSize: 10, color: MUT, marginTop: 1 }}>Clique ou glisse sur le vinyle</div>
          </div>
          <VinylGalaxy onCreateSalon={handleCreateSalon} onFilterChange={setGalaxyFilters} />
        </div>

        {/* ── Colonne 3 : Sidebar ── */}
        <aside style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12, background: SURF, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUT }}>En ligne</div>
          {onlineProfiles.length === 0
            ? <div style={{ fontSize: 13, color: MUT }}>Personne en ligne</div>
            : onlineProfiles.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: tk.blueLight, color: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                  {(p.display_name || '').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{p.display_name}</div>
                  <div style={{ fontSize: 11, color: MUT }}>{EMOJI_MAP[p.instruments?.[0] || '']} {p.instruments?.[0]} · {p.city}</div>
                </div>
              </div>
            ))
          }

          <InviteWidget userId={user.id} compact />

          <div style={{ height: 1, background: BDR }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUT }}>Salons actifs 🔥</div>
          {[{ icon:'🎸', name:'Rock & Rencontre', count:47 }, { icon:'🎹', name:'Jazz Lounge', count:23 }, { icon:'💑', name:'Coup de foudre', count:88 }, { icon:'🥁', name:'Beatmakers', count:14 }].map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: `0.5px solid ${BDR}`, cursor: 'pointer', background: BG }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{s.name}</div>
                <div style={{ fontSize: 11, color: MUT }}>{s.count} connectés</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1D9E75' }}>LIVE</span>
            </div>
          ))}
        </aside>
      </div>
    </div>
  )
}
