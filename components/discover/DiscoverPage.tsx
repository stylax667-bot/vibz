import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import { CATALOG_BY_ID, matchTerms, norm } from '../../lib/musicCatalog'
import { openMixSalon, type SalonRow } from '../../lib/salons'
import ShareModal, { type ShareContext } from '../shared/ShareModal'
import DonationBanner from '../shared/DonationBanner'
import InviteWidget from '../shared/InviteWidget'
import VinylGalaxy from './VinylGalaxy'

interface Props {
  user: User
  onMessage: (p: Profile) => void
  onOpenSalon: (salonId: string) => void
  salonCounts: Record<string, number>
}

const EMOJI_MAP: Record<string, string> = { Guitare:'🎸', Piano:'🎹', Basse:'🎸', Batterie:'🥁', Chant:'🎤', Saxo:'🎷', Violon:'🎻', DJ:'🎧', Ukulélé:'🪕', Flûte:'🪈' }

type MobileView = 'profils' | 'salon' | 'communaute'

export default function DiscoverPage({ user, onMessage, onOpenSalon, salonCounts }: Props) {
  const { theme: tk } = useTheme()
  const isMobile = useIsMobile()
  const isNarrow = useIsMobile(1100)
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
  const [notif, setNotif]               = useState<{ msg: string; color: string; undo?: () => void }|null>(null)
  const [currentUserName, setCurrentUserName] = useState('')
  const [shareCtx, setShareCtx]         = useState<ShareContext | null>(null)
  const [showDonation, setShowDonation] = useState(false)
  const [matchProfile, setMatchProfile] = useState<Profile | null>(null)
  const [confirmBlock, setConfirmBlock] = useState<Profile | null>(null)
  const [communitySalons, setCommunitySalons] = useState<SalonRow[]>([])
  const [mobileView, setMobileView]     = useState<MobileView>('profils')

  const showNotif = (msg: string, color = '#D4537E', undo?: () => void) => {
    setNotif({ msg, color, undo })
    setTimeout(() => setNotif(n => (n?.msg === msg ? null : n)), undo ? 6000 : 3500)
  }

  // ── Profils réels : comptes inscrits, non bannis, hors blocages dans les deux sens ──
  const loadData = useCallback(async () => {
    setLoading(true)
    const [{ data: blocks }, { data: blockedMe }, { data: likes }, { data: myProfile }] = await Promise.all([
      supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id),
      supabase.rpc('blocked_me'),
      supabase.from('likes').select('to_user').eq('from_user', user.id),
      supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    ])
    if (myProfile?.display_name) setCurrentUserName(myProfile.display_name)
    setLikedIds(new Set((likes || []).map(l => l.to_user as string)))
    const hidden = [
      ...(blocks || []).map(b => b.blocked_id as string),
      ...((blockedMe as string[] | null) || []),
    ]
    let q = supabase.from('profiles').select('*').neq('id', user.id).eq('is_banned', false)
    if (hidden.length > 0) q = q.not('id', 'in', `(${hidden.join(',')})`)
    const { data } = await q.order('is_online', { ascending: false }).order('updated_at', { ascending: false }).limit(100)
    setProfiles(data || [])
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  // ── Salons ouverts par la communauté (réels, mis à jour en direct) ──
  const loadSalons = useCallback(async () => {
    const { data } = await supabase.from('salons').select('*')
      .eq('is_active', true).eq('is_official', false)
      .order('created_at', { ascending: false }).limit(30)
    setCommunitySalons((data as SalonRow[]) || [])
  }, [])

  useEffect(() => {
    loadSalons()
    const ch = supabase.channel('discover-salons')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salons' }, () => loadSalons())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadSalons])

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

  const unblock = async (p: Profile) => {
    await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', p.id)
    setNotif(null)
    loadData()
  }

  const handleBlock = async (p: Profile) => {
    setConfirmBlock(null)
    const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: p.id })
    if (error) { showNotif('Impossible de bloquer ce membre pour le moment', '#ef4444'); return }
    setProfiles(list => list.filter(x => x.id !== p.id))
    showNotif(`🚫 ${p.display_name || 'Membre'} bloqué`, '#6b7280', () => unblock(p))
  }

  // Création / ouverture d'un salon depuis le vinyle
  const handleCreateSalon = useCallback(async (ids: string[], name: string) => {
    const { salon, error } = await openMixSalon(ids, name)
    if (error || !salon) return 'La création du salon a échoué. Réessaie dans un instant.'
    showNotif(`🎛️ Salon « ${salon.name} » ouvert`, '#A78BDB')
    onOpenSalon(salon.id)
    return null
  }, [onOpenSalon])

  // Filtrage profils — recherche texte + sélection du vinyle
  const filteredProfiles = profiles.filter(p => {
    if (searchProfiles) {
      const q = norm(searchProfiles)
      const ok = norm(p.display_name || '').includes(q)
        || norm(p.city || '').includes(q)
        || (p.instruments || []).some(i => norm(i).includes(q))
        || (p.music_genres || []).some(g => norm(g).includes(q))
      if (!ok) return false
    }
    if (galaxyFilters.length === 0) return true
    return galaxyFilters.some(id => {
      const item = CATALOG_BY_ID[id]
      if (!item) return false
      const fields = (item.kind === 'style' ? p.music_genres : p.instruments) || []
      const terms = matchTerms(item)
      return fields.some(f => terms.some(t => norm(f).includes(t)))
    })
  })

  const onlineProfiles = profiles.filter(p => p.is_online).slice(0, 6)

  const getSocials = (p: Profile) => {
    const r: { label: string; color: string }[] = []
    if (p.social_soundcloud) r.push({ label: 'SC', color: '#f50' })
    if (p.social_instagram) r.push({ label: 'IG', color: '#C13584' })
    if (p.social_youtube) r.push({ label: 'YT', color: '#FF0000' })
    if (p.social_linkedin) r.push({ label: 'in', color: '#0A66C2' })
    if (p.social_facebook) r.push({ label: 'fb', color: '#1877F2' })
    return r
  }

  const actionBtn = (bg: string, color: string): React.CSSProperties => ({
    flex: 1, minHeight: 38, padding: '7px', borderRadius: 10, border: `0.5px solid ${BDR}`,
    background: bg, color, cursor: 'pointer', fontSize: 15, fontFamily: 'Nunito,sans-serif', fontWeight: 700, transition: 'all 0.15s',
  })

  // ── Colonne profils ──
  const profilesColumn = (
    <div style={{ overflowY: 'auto', padding: isMobile ? '12px' : '16px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: `0.5px solid ${BDR}`, borderRadius: 12, background: tk.inputBg, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: MUT }}>🔍</span>
          <input
            style={{ border: 'none', background: 'transparent', fontSize: 13, fontFamily: 'Nunito,sans-serif', outline: 'none', flex: 1, minWidth: 0, color: TXT }}
            placeholder="Nom, ville, instrument…"
            value={searchProfiles}
            onChange={e => setSearchProfiles(e.target.value)}
          />
        </div>
        {galaxyFilters.length > 0 && (
          <button onClick={() => setMobileView('salon')} title="Filtres du vinyle actifs"
            style={{ padding: '7px 10px', borderRadius: 10, background: 'rgba(167,139,219,0.12)', border: '1px solid rgba(167,139,219,0.3)', fontSize: 11, fontWeight: 800, color: '#A78BDB', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
            🎛️ {galaxyFilters.length}
          </button>
        )}
        <div style={{ fontSize: 11, color: MUT, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {filteredProfiles.length} profil{filteredProfiles.length > 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: MUT, fontSize: 14 }}>Chargement des profils...</div>
      ) : filteredProfiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: MUT, fontSize: 13, lineHeight: 1.6 }}>
          {galaxyFilters.length > 0 || searchProfiles
            ? 'Aucun membre ne correspond à cette recherche pour le moment.'
            : <>Aucun autre membre inscrit pour l&apos;instant.<br/>Invite tes amis musiciens à rejoindre Vibz 🎵</>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 210px), 1fr))', gap: 12 }}>
          {filteredProfiles.map(p => {
            const inst = p.instruments?.[0] || ''
            const liked = likedIds.has(p.id)
            const socials = getSocials(p)
            return (
              <div key={p.id} style={{ background: SURF, border: `0.5px solid ${BDR}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 56, background: BANNER_BG[inst] || (tk.isDark ? '#2A1E3E' : '#EEEDFE'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, position: 'relative' }}>
                  {p.avatar_url
                    ? <img src={p.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
                    : (EMOJI_MAP[inst] || '🎵')}
                  <button onClick={e => { e.stopPropagation(); setConfirmBlock(p) }} title="Bloquer ce membre"
                    style={{ position: 'absolute', top: 6, right: 6, background: tk.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 800, color: MUT, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                    🚫 Bloquer
                  </button>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    {p.is_online && <span title="En ligne" style={{ width: 7, height: 7, background: '#1D9E75', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />}
                    <span style={{ fontSize: 15, fontWeight: 700, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || p.username}</span>
                  </div>
                  <div style={{ fontSize: 12, color: MUT, marginBottom: 8 }}>
                    {[p.show_location !== false ? p.city : null, p.country].filter(Boolean).join(' · ') || ' '}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {(p.instruments || []).map(i => <span key={i} className="tag tag-music">{i}</span>)}
                    {(p.looking_for || []).includes('rencontre') && <span className="tag tag-love">💑</span>}
                    {(p.looking_for || []).includes('collab') && <span className="tag tag-collab">🎵</span>}
                  </div>
                  {socials.length > 0 && p.show_socials !== false && (
                    <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                      {socials.map(s => (
                        <div key={s.label} style={{ width: 22, height: 22, background: s.color, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800 }}>{s.label}</div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleLike(p.id, p.display_name || '')} title="J'aime"
                      style={actionBtn(liked ? '#D4537E' : tk.pinkLight, liked ? 'white' : '#D4537E')}>
                      {liked ? '❤️' : '🤍'}
                    </button>
                    <button onClick={() => handleWizzz(p.id, p.display_name || '')} title="Wizzz" style={actionBtn(tk.blueLight, '#3C3489')}>⚡</button>
                    <button onClick={() => onMessage(p)} title="Envoyer un message" style={actionBtn(tk.greenLight, '#1D9E75')}>💬</button>
                    <button onClick={() => setShareCtx({ type:'collab', name:p.display_name||'', instrument:p.instruments?.[0]||'', city:p.city||'', genre:p.music_genres?.[0]||'' })} title="Partager"
                      style={{ ...actionBtn(SURF, MUT), flex: '0 0 auto', padding: '7px 10px', fontSize: 13 }}>🚀</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  // ── Colonne vinyle ──
  const galaxyColumn = (
    <div style={{
      overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: isMobile ? '14px 12px 20px' : '14px 8px', minWidth: 0,
      borderLeft: isMobile ? 'none' : `1px solid ${BDR}`, borderRight: isNarrow ? 'none' : `1px solid ${BDR}`,
      background: tk.isDark
        ? 'radial-gradient(ellipse at 50% 45%, rgba(167,139,219,0.07) 0%, transparent 70%)'
        : 'radial-gradient(ellipse at 50% 45%, rgba(224,122,154,0.05) 0%, transparent 70%)',
    }}>
      <div style={{ marginBottom: 8, textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: TXT }}>🎛️ Créer ou rejoindre un salon</div>
        <div style={{ fontSize: 11, color: MUT, marginTop: 2 }}>Combine styles et instruments : touche, glisse ou recherche</div>
      </div>
      <VinylGalaxy onCreateSalon={handleCreateSalon} onFilterChange={setGalaxyFilters} isDark={tk.isDark} />
    </div>
  )

  // ── Colonne communauté ──
  const sidebar = (
    <aside style={{ padding: isMobile ? '14px 12px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 12, background: SURF, overflowY: 'auto', minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUT }}>En ligne</div>
      {onlineProfiles.length === 0
        ? <div style={{ fontSize: 13, color: MUT }}>Personne en ligne</div>
        : onlineProfiles.map(p => (
          <button key={p.id} onClick={() => onMessage(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'Nunito,sans-serif' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: tk.blueLight, color: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {(p.display_name || '').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{p.display_name}</div>
              <div style={{ fontSize: 11, color: MUT }}>{[p.instruments?.[0], p.city].filter(Boolean).join(' · ')}</div>
            </div>
          </button>
        ))
      }

      <InviteWidget userId={user.id} compact />

      <div style={{ height: 1, background: BDR }} />
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUT }}>Salons de la communauté</div>
      {communitySalons.length === 0 ? (
        <div style={{ fontSize: 12, color: MUT, lineHeight: 1.5 }}>Aucun salon ouvert pour l&apos;instant. Crée le premier avec le vinyle 🎛️</div>
      ) : communitySalons.map(s => {
        const n = salonCounts[s.id] || 0
        return (
          <button key={s.id} onClick={() => onOpenSalon(s.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: `0.5px solid ${BDR}`, cursor: 'pointer', background: BG, textAlign: 'left', fontFamily: 'Nunito,sans-serif' }}>
            <span style={{ fontSize: 18 }}>{s.icon || '🎛️'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: MUT }}>{n > 0 ? `${n} connecté${n > 1 ? 's' : ''}` : 'Personne pour le moment'}</div>
            </div>
            {n > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#1D9E75' }}>LIVE</span>}
          </button>
        )
      })}
    </aside>
  )

  return (
    <div style={{ height: 'var(--vz-app-h, calc(100vh - 60px))', background: BG, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Notifications ── */}
      {matchName && (
        <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', width:'max-content', maxWidth:'calc(100vw - 24px)', background:'linear-gradient(135deg,#D4537E,#A78BDB)', color:'white', padding:'14px 20px', borderRadius:20, fontWeight:700, fontSize:15, zIndex:999, boxShadow:'0 8px 40px rgba(212,83,126,0.5)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
          <span>🎉 Match avec {matchName} !</span>
          <button onClick={() => setShareCtx({ type:'match', name:matchName, instrument:matchProfile?.instruments?.[0]||'', city:matchProfile?.city||'' })}
            style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid rgba(255,255,255,0.4)', background:'rgba(255,255,255,0.15)', color:'white', fontSize:12, fontWeight:800, cursor:'pointer', fontFamily:'Nunito, sans-serif' }}>
            🚀 Partager
          </button>
        </div>
      )}
      {notif && (
        <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', width:'max-content', maxWidth:'calc(100vw - 24px)', background:notif.color, color:'white', padding:'12px 20px', borderRadius:14, fontWeight:700, fontSize:14, zIndex:999, boxShadow:`0 6px 24px ${notif.color}66`, display:'flex', alignItems:'center', gap:12 }}>
          <span>{notif.msg}</span>
          {notif.undo && (
            <button onClick={notif.undo} style={{ padding:'4px 12px', borderRadius:16, border:'1.5px solid rgba(255,255,255,0.5)', background:'transparent', color:'white', fontWeight:800, fontSize:12, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>Annuler</button>
          )}
        </div>
      )}
      {showDonation && <DonationBanner variant="match" onDismiss={() => setShowDonation(false)} />}
      {shareCtx && <ShareModal context={shareCtx} onClose={() => setShareCtx(null)} />}

      {/* ── Confirmation de blocage ── */}
      {confirmBlock && (
        <div onClick={() => setConfirmBlock(null)} style={{ position:'fixed', inset:0, zIndex:600, background:tk.overlay, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background:SURF, borderRadius:20, padding:22, maxWidth:360, width:'100%', border:`1px solid ${BDR}`, fontFamily:'Nunito,sans-serif' }}>
            <div style={{ fontSize:17, fontWeight:800, color:TXT, marginBottom:6 }}>🚫 Bloquer {confirmBlock.display_name} ?</div>
            <div style={{ fontSize:13, color:MUT, lineHeight:1.6, marginBottom:18 }}>
              Ce membre ne te verra plus dans Découvrir et ne pourra plus t&apos;écrire. Tu pourras le débloquer à tout moment depuis Messages → Bloqués.
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setConfirmBlock(null)} style={{ flex:1, padding:12, borderRadius:12, border:`1px solid ${BDR}`, background:'transparent', color:MUT, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>Annuler</button>
              <button onClick={() => handleBlock(confirmBlock)} style={{ flex:1, padding:12, borderRadius:12, border:'none', background:'linear-gradient(135deg,#E07A7A,#C4547A)', color:'white', fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'Nunito,sans-serif' }}>Bloquer</button>
            </div>
          </div>
        </div>
      )}

      {isMobile ? (
        <>
          {/* Sélecteur de vue (mobile) */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 12px 0', flexShrink: 0 }}>
            {([
              { id: 'profils',    label: '👥 Profils' },
              { id: 'salon',      label: '🎛️ Créer' },
              { id: 'communaute', label: '🔥 Salons' },
            ] as { id: MobileView; label: string }[]).map(v => (
              <button key={v.id} onClick={() => setMobileView(v.id)}
                style={{
                  flex: 1, padding: '9px 4px', borderRadius: 12, fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  border: mobileView === v.id ? `1px solid ${tk.pink}88` : `1px solid ${BDR}`,
                  background: mobileView === v.id ? tk.pinkLight : SURF,
                  color: mobileView === v.id ? tk.pinkDark : MUT,
                }}>{v.label}</button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {mobileView === 'profils' && profilesColumn}
            {mobileView === 'salon' && galaxyColumn}
            {mobileView === 'communaute' && sidebar}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: isNarrow ? '1fr minmax(360px, 460px)' : '1fr 500px 220px', overflow: 'hidden' }}>
          {profilesColumn}
          {galaxyColumn}
          {!isNarrow && sidebar}
        </div>
      )}
    </div>
  )
}
