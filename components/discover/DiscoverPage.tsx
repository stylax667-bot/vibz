import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import { CATALOG_BY_ID, matchTerms, norm } from '../../lib/musicCatalog'
import { useSalonList, tagLabels } from '../../lib/salons'
import ShareModal, { type ShareContext } from '../shared/ShareModal'
import DonationBanner from '../shared/DonationBanner'
import InviteWidget from '../shared/InviteWidget'
import VinylGalaxy from './VinylGalaxy'
import Avatar from '../shared/Avatar'
import SixDegresChain from '../shared/SixDegresChain'
import { fetchAffinity, logMix, affinityReason, type Affinity } from '../../lib/affinity'
import { usePresenceMap, withPresence, presenceOf } from '../../lib/presence'
import {
  fetchDegrees, fetchConnections, requestConnection, connState, degreeLabel,
  type Degree, type ConnectionRow,
} from '../../lib/sixDegres'

interface Props {
  user: User
  onMessage: (p: Profile) => void
  onOpenSalon: (salonId: string) => void
  onMix: (tags: string[], name?: string) => void   // mélange du vinyle → rejoindre / créer (onglet Salons)
}


type MobileView = 'profils' | 'salon' | 'communaute'
type ProfileView = 'cartes' | 'liste' | 'miniatures'
const VIEW_KEY = 'vibz_discover_view'
const VIEWS: { id: ProfileView; icon: string; label: string }[] = [
  { id: 'cartes',     icon: '▦', label: 'Cartes' },
  { id: 'liste',      icon: '☰', label: 'Liste' },
  { id: 'miniatures', icon: '▣', label: 'Miniatures' },
]

export default function DiscoverPage({ user, onMessage, onOpenSalon, onMix }: Props) {
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
  const { salons: communitySalons } = useSalonList()
  const [mobileView, setMobileView]     = useState<MobileView>('profils')
  // Six degrés
  const [degrees, setDegrees]           = useState<Map<string, Degree>>(new Map())
  const [conns, setConns]               = useState<ConnectionRow[]>([])
  const [chainWith, setChainWith]       = useState<Profile | null>(null)
  const [networkOnly, setNetworkOnly]   = useState(false)
  // Vue des profils (cartes / liste / miniatures), mémorisée sur cet appareil
  const [view, setView]                 = useState<ProfileView>('cartes')
  useEffect(() => {
    try { const v = localStorage.getItem(VIEW_KEY) as ProfileView | null; if (v && VIEWS.some(x => x.id === v)) setView(v) } catch { /* rien */ }
  }, [])
  const chooseView = (v: ProfileView) => { setView(v); try { localStorage.setItem(VIEW_KEY, v) } catch { /* rien */ } }
  // Affinités musicales (historique des mélanges)
  const [affinity, setAffinity]         = useState<Map<string, Affinity>>(new Map())

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
    const { data } = await q.order('last_seen', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false }).limit(100)
    setProfiles(data || [])
    setLoading(false)
    const ids = (data || []).map(p => p.id)
    const [deg, cs, aff] = await Promise.all([fetchDegrees(ids), fetchConnections(user.id), fetchAffinity(ids)])
    setDegrees(deg)
    setConns(cs)
    setAffinity(aff)
  }, [user.id])

  // Présence fraîche (voyants) relue chaque minute
  const presence = usePresenceMap(profiles.map(p => p.id))

  // Chaque mélange essayé sur le vinyle enrichit l'historique (après 4 s sans changement)
  useEffect(() => {
    if (galaxyFilters.length === 0) return
    const timer = setTimeout(() => logMix(galaxyFilters), 4000)
    return () => clearTimeout(timer)
  }, [galaxyFilters])

  const handleConnect = async (p: Profile) => {
    const name = p.display_name || 'ce membre'
    const r = await requestConnection(p.id)
    if (r === 'pending') showNotif(`🤝 Demande de connexion envoyée à ${name}`, '#6BB8E8')
    else if (r === 'accepted') showNotif(`🔗 Connecté à ${name} !`, '#52C07A')
    else if (r === 'limite') showNotif('⏳ Beaucoup de demandes aujourd’hui, réessaie demain', '#6b7280')
    else showNotif('Connexion impossible avec ce membre', '#ef4444')
    const [deg, cs] = await Promise.all([fetchDegrees(profiles.map(x => x.id)), fetchConnections(user.id)])
    setDegrees(deg)
    setConns(cs)
  }

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
    if (error?.message?.includes('dnd')) showNotif(`🟠 ${name} ne veut pas être dérangé·e pour le moment`, '#F59E0B')
    else if (error?.message?.includes('rate_limit')) showNotif('⏳ Attends 30s avant de renvoyer un wizzz !', '#6b7280')
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

  // Mélange du vinyle : Vibz propose de rejoindre un salon existant ou d'en créer un (onglet Salons)
  const handleCreateSalon = useCallback(async (ids: string[], name: string) => {
    onMix(ids, name)
    return null
  }, [onMix])

  // Filtrage profils — recherche texte + sélection du vinyle
  const filteredProfiles = profiles.filter(p => {
    if (networkOnly && !degrees.has(p.id)) return false
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
  // Ordre : « Mon réseau » → les plus proches d'abord ; sinon affinité musicale,
  // avec un coup de pouce pour les membres proches dans le réseau et ceux en ligne.
  const rank = (p: Profile) => {
    const d = degrees.get(p.id)?.degree
    const st = presenceOf(withPresence(p, presence))
    return (affinity.get(p.id)?.score ?? 0) + (d ? (7 - d) * 2 : 0) + (st === 'online' ? 6 : st === 'dnd' ? 2 : 0)
  }
  if (networkOnly) filteredProfiles.sort((a, b) => (degrees.get(a.id)?.degree ?? 9) - (degrees.get(b.id)?.degree ?? 9) || rank(b) - rank(a))
  else filteredProfiles.sort((a, b) => rank(b) - rank(a))

  const onlineProfiles = profiles.map(p => withPresence(p, presence)).filter(p => presenceOf(p) !== 'offline').slice(0, 6)

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
        <button onClick={() => setNetworkOnly(v => !v)} title="Membres reliés à toi en 6 degrés ou moins, les plus proches d'abord"
          style={{ padding: '7px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'Nunito,sans-serif',
            background: networkOnly ? tk.pinkLight : 'transparent', border: `1px solid ${networkOnly ? tk.pink : BDR}`, color: networkOnly ? tk.pinkDark : MUT }}>
          🕸️ Mon réseau
        </button>
      </div>

      {/* Vue + nombre de profils */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div role="radiogroup" aria-label="Affichage des profils" style={{ display: 'flex', padding: 3, borderRadius: 12, background: tk.bg2, border: `0.5px solid ${BDR}` }}>
          {VIEWS.map(v => (
            <button key={v.id} role="radio" aria-checked={view === v.id} onClick={() => chooseView(v.id)} title={v.label}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'Nunito,sans-serif', fontSize: 12, fontWeight: 800,
                background: view === v.id ? SURF : 'transparent', color: view === v.id ? TXT : MUT, boxShadow: view === v.id ? `0 1px 4px ${tk.shadow}` : 'none' }}>
              <span aria-hidden="true">{v.icon}</span>{v.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: MUT, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {filteredProfiles.length} profil{filteredProfiles.length > 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: MUT, fontSize: 14 }}>Chargement des profils...</div>
      ) : filteredProfiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: MUT, fontSize: 13, lineHeight: 1.6 }}>
          {networkOnly && !searchProfiles && galaxyFilters.length === 0
            ? <>Personne n&apos;est encore relié à toi.<br/>Connecte-toi avec des membres 🤝 ou invite tes amis musiciens 🌱</>
            : galaxyFilters.length > 0 || searchProfiles
            ? 'Aucun membre ne correspond à cette recherche pour le moment.'
            : <>Aucun autre membre inscrit pour l&apos;instant.<br/>Invite tes amis musiciens à rejoindre Vibz 🎵</>}
        </div>
      ) : (
        <div style={view === 'liste'
          ? { display: 'flex', flexDirection: 'column', gap: 6 }
          : { display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${view === 'miniatures' ? (isMobile ? 140 : 160) : 210}px), 1fr))`, gap: view === 'miniatures' ? 10 : 12 }}>
          {filteredProfiles.map(p => {
            const inst = p.instruments?.[0] || ''
            const liked = likedIds.has(p.id)
            const socials = getSocials(p)
            const deg = degrees.get(p.id)
            const aff = affinity.get(p.id)
            const why = aff && aff.score >= 15 ? affinityReason(aff) : null
            const live = withPresence(p, presence)
            const cs = connState(conns, user.id, p.id)
            const name = p.display_name || p.username
            const place = [p.show_location !== false ? p.city : null, p.country].filter(Boolean).join(' · ')
            const small = (bg: string, color: string): React.CSSProperties => ({ ...actionBtn(bg, color), flex: '0 0 auto', minHeight: 34, width: 36, padding: 0, fontSize: 14 })

            // ── Vue Liste : une ligne compacte par membre ──
            if (view === 'liste') return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: SURF, border: `0.5px solid ${BDR}`, borderRadius: 14, minWidth: 0 }}>
                <Avatar p={live} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    {aff && aff.score >= 15 && <span style={{ fontSize: 10.5, fontWeight: 800, color: tk.isDark ? '#C9DEF7' : '#2B4C7E', flexShrink: 0 }}>✨ {aff.score} %</span>}
                    {deg && <button onClick={() => setChainWith(p)} title="Voir la chaîne" style={{ fontSize: 10.5, fontWeight: 800, color: tk.pinkDark, background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, fontFamily: 'Nunito,sans-serif' }}>🕸️ {deg.degree}°</button>}
                  </div>
                  {p.tagline && <div style={{ fontSize: 12, color: TXT, opacity: 0.8, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>« {p.tagline} »</div>}
                  <div style={{ fontSize: 11.5, color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[(p.instruments || []).slice(0, 2).join(', '), place].filter(Boolean).join(' · ') || ' '}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => handleLike(p.id, p.display_name || '')} title="J'aime" style={small(liked ? '#D4537E' : tk.pinkLight, liked ? 'white' : '#D4537E')}>{liked ? '❤️' : '🤍'}</button>
                  <button onClick={() => onMessage(p)} title="Envoyer un message" style={small(tk.greenLight, '#1D9E75')}>💬</button>
                  {!isMobile && <button onClick={() => handleWizzz(p.id, p.display_name || '')} title="Wizzz" style={small(tk.blueLight, '#3C3489')}>⚡</button>}
                </div>
              </div>
            )

            // ── Vue Miniatures : l'image du membre en grand ──
            if (view === 'miniatures') return (
              <div key={p.id} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: `0.5px solid ${BDR}`, background: SURF }}>
                <Avatar p={live} fill ring="transparent" onClick={() => onMessage(p)} title={`Écrire à ${name}`} />
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 30px 8px 10px', background: 'linear-gradient(transparent, rgba(10,12,20,0.82))', color: 'white', pointerEvents: 'none' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  {p.tagline
                    ? <div style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>« {p.tagline} »</div>
                    : <div style={{ fontSize: 11, opacity: 0.85, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.instruments || [])[0] || place || ' '}</div>}
                </div>
                {aff && aff.score >= 15 && (
                  <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.9)', color: '#2B4C7E', fontSize: 10.5, fontWeight: 800 }}>✨ {aff.score} %</div>
                )}
                <button onClick={() => handleLike(p.id, p.display_name || '')} title="J'aime"
                  style={{ position: 'absolute', top: 6, right: 6, width: 32, height: 32, borderRadius: '50%', border: 'none', background: liked ? '#D4537E' : 'rgba(255,255,255,0.9)', fontSize: 14, cursor: 'pointer' }}>
                  {liked ? '❤️' : '🤍'}
                </button>
              </div>
            )

            return (
              <div key={p.id} style={{ background: SURF, border: `0.5px solid ${BDR}`, borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 56, background: BANNER_BG[inst] || (tk.isDark ? '#2A1E3E' : '#EEEDFE'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, position: 'relative' }}>
                  <Avatar p={live} size={44} ring="white" />
                  <button onClick={e => { e.stopPropagation(); setConfirmBlock(p) }} title="Bloquer ce membre"
                    style={{ position: 'absolute', top: 6, right: 6, background: tk.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)', border: 'none', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 800, color: MUT, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                    🚫 Bloquer
                  </button>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || p.username}</span>
                  </div>
                  {p.tagline && <div style={{ fontSize: 12.5, color: TXT, opacity: 0.85, fontStyle: 'italic', marginBottom: 2, lineHeight: 1.35, overflowWrap: 'anywhere' }}>« {p.tagline} »</div>}
                  <div style={{ fontSize: 12, color: MUT, marginBottom: 8 }}>
                    {[p.show_location !== false ? p.city : null, p.country].filter(Boolean).join(' · ') || ' '}
                  </div>
                  {aff && aff.score >= 15 && (
                    <div title="Affinité calculée d'après vos mélanges de styles et d'instruments (vinyle, salons, likes)"
                      style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 6, fontSize: 11, lineHeight: 1.4, color: MUT }}>
                      <span style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 10, background: tk.blueLight, color: tk.isDark ? '#C9DEF7' : '#2B4C7E', fontWeight: 800 }}>✨ {aff.score} %</span>
                      {why && <span style={{ fontWeight: 700 }}>{why}</span>}
                    </div>
                  )}
                  {deg && (
                    <button onClick={() => setChainWith(p)} title="Voir la chaîne qui vous relie"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: '100%', marginBottom: 8, padding: '3px 9px', borderRadius: 12, border: `1px solid ${tk.pink}55`, background: tk.pinkLight, color: tk.pinkDark, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
                      <span style={{ flexShrink: 0 }}>🕸️ {degreeLabel(deg.degree)}</span>
                      {deg.degree > 1 && deg.via_name && <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· via {deg.via_name}</span>}
                    </button>
                  )}
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
                    <button onClick={() => cs === 'none' || cs === 'received' ? handleConnect(p) : setChainWith(p)}
                      title={cs === 'connected' ? 'Connectés — voir la chaîne' : cs === 'sent' ? 'Demande de connexion envoyée' : cs === 'received' ? 'Accepter sa demande de connexion' : 'Se connecter (lien visible dans les chaînes)'}
                      style={actionBtn(cs === 'connected' ? tk.blue : cs === 'received' ? tk.pink : tk.blueLight, cs === 'connected' || cs === 'received' ? 'white' : '#3C3489')}>
                      {cs === 'connected' ? '🔗' : cs === 'sent' ? '⏳' : cs === 'received' ? '✅' : '🤝'}
                    </button>
                    <button onClick={() => setShareCtx({ type:'member', memberId:p.id, name:p.display_name||'Ce membre', instrument:p.instruments?.[0]||'', city:p.show_location !== false ? (p.city||'') : '' })} title="Présenter ce membre à quelqu’un"
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
      {galaxyFilters.length >= 2 && (
        <button onClick={() => setShareCtx({ type: 'mix', tags: galaxyFilters })}
          style={{ marginTop: 10, padding: '8px 16px', borderRadius: 20, border: `1px solid ${BDR}`, background: SURF, color: TXT, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Nunito,sans-serif' }}>
          🚀 Partager ce mélange
        </button>
      )}
    </div>
  )

  // ── Colonne communauté ──
  const sidebar = (
    <aside style={{ padding: isMobile ? '14px 12px' : '16px 12px', display: 'flex', flexDirection: 'column', gap: 12, background: SURF, overflowY: 'auto', minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUT }}>En ligne maintenant</div>
      {onlineProfiles.length === 0
        ? <div style={{ fontSize: 13, color: MUT }}>Personne en ligne</div>
        : onlineProfiles.map(p => (
          <button key={p.id} onClick={() => onMessage(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'Nunito,sans-serif' }}>
            <Avatar p={p} size={30} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{p.display_name}</div>
              <div style={{ fontSize: 11, color: MUT }}>{[p.instruments?.[0], p.city].filter(Boolean).join(' · ')}</div>
            </div>
          </button>
        ))
      }

      <InviteWidget userId={user.id} compact />

      <div style={{ height: 1, background: BDR }} />
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: MUT }}>Salons ouverts par les membres</div>
      {communitySalons.length === 0 ? (
        <div style={{ fontSize: 12, color: MUT, lineHeight: 1.5 }}>Aucun salon ouvert pour l&apos;instant. Crée le premier avec le vinyle 🎛️</div>
      ) : communitySalons.slice(0, 20).map(s => (
        <button key={s.id} onClick={() => onOpenSalon(s.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: `0.5px solid ${BDR}`, cursor: 'pointer', background: BG, textAlign: 'left', fontFamily: 'Nunito,sans-serif' }}>
          <span style={{ fontSize: 18 }}>{s.parent_id ? '🌿' : s.icon || '🎛️'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}{s.is_locked ? ' 🔒' : ''}</div>
            <div style={{ fontSize: 10.5, color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tagLabels(s.tags).join(' · ')}</div>
            <div style={{ fontSize: 11, color: MUT }}>{s.member_count}/{s.max_members} membres · {s.online_count > 0 ? `${s.online_count} en ligne` : 'personne en ligne'}</div>
          </div>
          {s.online_count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#1D9E75' }}>LIVE</span>}
        </button>
      ))}
    </aside>
  )

  return (
    <div style={{ height: 'var(--vz-app-h, calc(100vh - 60px))', background: BG, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Notifications ── */}
      {matchName && (
        <div style={{ position:'fixed', top:80, left:'50%', transform:'translateX(-50%)', width:'max-content', maxWidth:'calc(100vw - 24px)', background:'linear-gradient(135deg,#D4537E,#A78BDB)', color:'white', padding:'14px 20px', borderRadius:20, fontWeight:700, fontSize:15, zIndex:999, boxShadow:'0 8px 40px rgba(212,83,126,0.5)', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
          <span>🎉 Match avec {matchName} !</span>
          <button onClick={() => setShareCtx({ type:'match' })}
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
      {chainWith && <SixDegresChain targetId={chainWith.id} targetName={chainWith.display_name || 'ce membre'} onClose={() => setChainWith(null)} />}

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
