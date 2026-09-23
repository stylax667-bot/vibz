import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { moderateMessage, getIAGuardMessage } from '../../lib/moderation'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import { CATALOG_BY_ID, searchCatalog, norm } from '../../lib/musicCatalog'
import { openMixSalon, openOfficialSalon, closeSalon, comboKey, type SalonRow } from '../../lib/salons'
import MusicCard, { extractMusicUrl } from '../shared/MusicCard'
import VinylMixCreator from '../shared/VinylMixCreator'

interface Props {
  user: User
  initialSalonId?: string | null            // id (uuid) d'un salon à ouvrir directement
  onInitialSalonOpened?: () => void
  onSalonChange?: (id: string | null) => void
  salonCounts: Record<string, number>        // présence réelle par salon (uuid)
}

const font  = 'Nunito, sans-serif'
const pink  = '#E07A9A'
const green = '#52C07A'
const blue  = '#6BB8E8'

// ── Salons officiels Vibz (créés en base à la première visite) ────────────────
type CatalogSalon = { id: string; icon: string; name: string; cat: string; color: string; family?: string }

const MAIN_SALONS: CatalogSalon[] = [
  { id:'1',  icon:'🎸', name:'Rock · Metal · Punk',        cat:'Styles',      color:'#E07A9A' },
  { id:'2',  icon:'🎷', name:'Jazz · Blues · Soul',         cat:'Styles',      color:'#6BB8E8' },
  { id:'3',  icon:'🎧', name:'Électro · Hip-Hop · Urbain',  cat:'Styles',      color:'#A78BDB' },
  { id:'4',  icon:'🎸', name:'Cordes',                     cat:'Instruments', color:'#52C07A' },
  { id:'5',  icon:'🥁', name:'Rythme & Percussions',       cat:'Instruments', color:'#E07A9A' },
  { id:'6',  icon:'🎹', name:'Claviers · Voix · Chœurs',   cat:'Instruments', color:'#6BB8E8' },
  { id:'7',  icon:'🎪', name:'Concerts à ne pas louper',   cat:'Événements',  color:'#52C07A' },
  { id:'8',  icon:'🏟️', name:'Festivals & Scènes',         cat:'Événements',  color:'#6BB8E8' },
  { id:'9',  icon:'📢', name:'Casting & Annonces',          cat:'Événements',  color:'#E07A9A' },
  { id:'10', icon:'❤️', name:'Coup de foudre musical',     cat:'Rencontres',  color:'#E07A9A' },
  { id:'11', icon:'🤝', name:'Collabs & Duos',              cat:'Rencontres',  color:'#52C07A' },
  { id:'12', icon:'🌍', name:'International & Multilingue', cat:'Rencontres',  color:'#6BB8E8' },
]

const GENRE_SALONS: CatalogSalon[] = [
  ['13','🎸','Rock','#E8395A'], ['14','🤘','Métal','#CC2200'], ['15','⚡','Punk · Hardcore','#FF5722'],
  ['16','🌧️','Grunge · Alternative','#795548'], ['17','🌿','Indie Rock · Post-Rock','#9C27B0'], ['18','🎵','Blues','#1565C0'],
  ['19','🎤','Soul · Gospel','#FF8F00'], ['20','🕺','R&B · Funk','#7B1FA2'], ['21','🪩','Disco · Groove','#E91E63'],
  ['22','🏠','House · Deep House','#FF4081'], ['23','🔊','Techno · Industrial','#546E7A'], ['24','🌌','Trance · Psytrance','#7C4DFF'],
  ['25','🥁','Drum & Bass · Jungle','#FF6D00'], ['26','🔈','Dubstep · Bass Music','#64DD17'], ['27','🌊','Ambient · Drone','#80CBC4'],
  ['28','🌆','Synthwave · Retrowave','#CE93D8'], ['29','☁️','Lo-fi · Chillhop','#A5D6A7'], ['30','🎤','Trap · Cloud Rap','#607D8B'],
  ['31','🌸','Pop · Dance Pop','#F06292'], ['32','💫','K-Pop · J-Pop','#FF80AB'], ['33','🎻','Classique · Opéra','#A1887F'],
  ['34','🪕','Folk · Acoustique','#8BC34A'], ['35','🤠','Country · Bluegrass','#FFA726'], ['36','🌴','Reggae · Ska · Dub','#4CAF50'],
  ['37','💃','Latin · Bossa Nova','#F44336'], ['38','🌍','World · Afrobeat','#E65100'],
].map(([id, icon, name, color]) => ({ id, icon, name, color, cat: 'Styles' }))

const INSTR_FAMILIES: [string, [string, string, string, string][]][] = [
  ['🎸 Cordes', [
    ['39','🎸','Guitare électrique','#52C07A'], ['40','🎸','Guitare acoustique · Folk','#6DBF6D'], ['41','🎸','Guitare basse','#3DAD7A'],
    ['42','🎻','Violon · Alto','#8BC34A'], ['43','🎻','Violoncelle · Contrebasse','#558B2F'], ['44','🪕','Ukulélé · Mandoline · Banjo','#9CCC65'],
    ['45','🎵','Harpe · Sitar · Luth','#AED581'],
  ]],
  ['🎹 Claviers & Électro', [
    ['46','🎹','Piano acoustique','#29B6F6'], ['47','🎹','Piano numérique · Claviers','#0288D1'], ['48','🎛️','Synthétiseur · Modulaire','#7C4DFF'],
    ['49','🎹','Orgue · Hammond','#5E35B1'], ['50','🪗','Accordéon · Harmonica','#AB47BC'], ['51','🎧','Beatmaking · MPC · Launchpad','#8E24AA'],
  ]],
  ['🥁 Percussions', [
    ['52','🥁','Batterie acoustique','#EF5350'], ['53','🥁','Batterie électronique','#E53935'], ['54','🪘','Cajon · Djembé · Congas','#FF7043'],
    ['55','🪘','Percussions latines','#FF5722'], ['56','🎵','Marimba · Xylophone · Vibes','#FFCA28'], ['57','🎵','Hang drum · Handpan','#FFB300'],
  ]],
  ['🎷 Vents', [
    ['58','🎷','Saxophone','#FF8F00'], ['59','🎺','Trompette · Bugle','#FFA000'], ['60','🎺','Trombone · Tuba','#F57F17'],
    ['61','🎵','Clarinette · Hautbois · Basson','#6D4C41'], ['62','🎵','Flûte traversière','#80CBC4'], ['63','🎵','Cor · Cor anglais','#26A69A'],
    ['64','🎵','Cornemuse · Flûte irlandaise','#00897B'],
  ]],
  ['🎤 Voix', [
    ['65','🎤','Chant classique · Lyrique','#EC407A'], ['66','🎤','Chant pop · Rock · Indie','#E91E63'], ['67','🎤','Rap · Slam · Spoken word','#AD1457'],
    ['68','🎤','Beatbox','#880E4F'], ['69','🎶','Chœurs · Harmonies vocales','#F06292'],
  ]],
  ['🎧 Production', [
    ['70','🎧','DJ · Platines · Mixage','#546E7A'], ['71','💻','Producteur · DAW · Studio','#37474F'], ['72','🎸','Guitare électro · Pédaliers','#455A64'],
    ['73','🎵','Lap steel · Pedal steel','#78909C'], ['74','🎵','Theremin · Instruments rares','#90A4AE'],
  ]],
]
const INSTR_SALONS: CatalogSalon[] = INSTR_FAMILIES.flatMap(([family, items]) =>
  items.map(([id, icon, name, color]) => ({ id, icon, name, color, cat: 'Instruments', family })))

const ALL_CATALOG = [...MAIN_SALONS, ...GENRE_SALONS, ...INSTR_SALONS]
const CATS = ['Tous', 'Communauté', 'Styles', 'Instruments', 'Événements', 'Rencontres']

type Msg = {
  id: string
  sender_id: string
  content: string
  created_at: string
  author?: string
}

type Current = {
  dbId: string
  name: string
  icon: string
  color: string
  isOfficial: boolean
  createdBy: string | null
  tags: string[]
}

const toCurrent = (s: SalonRow): Current => ({
  dbId: s.id, name: s.name, icon: s.icon || '🎛️', color: s.color || '#A78BDB',
  isOfficial: s.is_official, createdBy: s.created_by, tags: s.tags || [],
})

const timeOf = (iso: string) => {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function SalonsPage({ user, initialSalonId, onInitialSalonOpened, onSalonChange, salonCounts }: Props) {
  const { theme: tk } = useTheme()
  const isMobile = useIsMobile()
  const BG = tk.bg2; const SURF = tk.surface; const BDR = tk.border; const TXT = tk.text; const MUT = tk.textMuted

  const [current, setCurrent]         = useState<Current | null>(null)
  const [opening, setOpening]         = useState<string | null>(null)
  const [community, setCommunity]     = useState<SalonRow[]>([])
  const [catFilter, setCatFilter]     = useState('Tous')
  const [search, setSearch]           = useState('')
  const [searchSel, setSearchSel]     = useState<string[]>([])
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ communaute: true, principaux: true })
  const [msgs, setMsgs]               = useState<Msg[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput]             = useState('')
  const [warning, setWarning]         = useState('')
  const [notice, setNotice]           = useState('')
  const [showVinylMix, setShowVinylMix] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [myName, setMyName]           = useState(user.email?.split('@')[0] || 'Moi')
  const namesRef   = useRef<Record<string, string>>({})
  const msgAreaRef = useRef<HTMLDivElement>(null)
  // Correspondance salon officiel (id catalogue) → ligne en base
  const officialRows = useRef<Record<string, SalonRow>>({})

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 4000) }

  useEffect(() => {
    supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.display_name) setMyName(data.display_name) })
  }, [user.id])

  // ── Salons de la communauté (temps réel) ──
  const loadCommunity = useCallback(async () => {
    const { data } = await supabase.from('salons').select('*').eq('is_active', true).eq('is_official', false)
      .order('created_at', { ascending: false }).limit(100)
    setCommunity((data as SalonRow[]) || [])
  }, [])

  useEffect(() => {
    loadCommunity()
    const ch = supabase.channel('salons-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salons' }, payload => {
        loadCommunity()
        // Le salon ouvert vient d'être fermé par son créateur
        const row = payload.new as Partial<SalonRow>
        setCurrent(c => {
          if (c && row?.id === c.dbId && row.is_active === false) {
            flash('Ce salon a été fermé par son créateur.')
            return null
          }
          return c
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadCommunity])

  useEffect(() => { onSalonChange?.(current?.dbId ?? null) }, [current?.dbId, onSalonChange])
  useEffect(() => () => onSalonChange?.(null), [onSalonChange])

  // ── Ouverture d'un salon ──
  const openRow = useCallback((row: SalonRow) => {
    setCurrent(toCurrent(row))
    setWarning('')
  }, [])

  const openCatalog = async (s: CatalogSalon) => {
    const cached = officialRows.current[s.id]
    if (cached) { openRow(cached); return }
    setOpening(s.id)
    const { salon, error } = await openOfficialSalon(s.id, s.name, s.icon, s.color)
    setOpening(null)
    if (error || !salon) { flash('Impossible d\'ouvrir ce salon pour le moment.'); return }
    officialRows.current[s.id] = salon
    openRow(salon)
  }

  const openMix = async (ids: string[], name?: string): Promise<string | null> => {
    const { salon, error } = await openMixSalon(ids, name)
    if (error || !salon) return 'La création du salon a échoué. Réessaie dans un instant.'
    openRow(salon)
    loadCommunity()
    return null
  }

  // Salon demandé depuis Découvrir
  useEffect(() => {
    if (!initialSalonId) return
    supabase.from('salons').select('*').eq('id', initialSalonId).maybeSingle().then(({ data }) => {
      if (data) openRow(data as SalonRow)
      onInitialSalonOpened?.()
    })
  }, [initialSalonId, onInitialSalonOpened, openRow])

  // Sur ordinateur, on ouvre le premier salon officiel par défaut
  useEffect(() => {
    if (!isMobile && !initialSalonId && !current) openCatalog(MAIN_SALONS[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  // ── Messages du salon ouvert (temps réel) ──
  const resolveNames = useCallback(async (ids: string[]) => {
    const missing = Array.from(new Set(ids)).filter(id => !namesRef.current[id])
    if (!missing.length) return
    const { data } = await supabase.from('profiles').select('id, display_name, username').in('id', missing)
    ;(data || []).forEach(p => { namesRef.current[p.id] = p.display_name || p.username || 'Membre' })
  }, [])

  const loadMsgs = useCallback(async (salonId: string) => {
    setLoadingMsgs(true)
    const { data } = await supabase.from('salon_messages').select('id, sender_id, content, created_at')
      .eq('salon_id', salonId).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(100)
    const list = ((data as Msg[]) || []).reverse()
    await resolveNames(list.map(m => m.sender_id))
    setMsgs(list.map(m => ({ ...m, author: namesRef.current[m.sender_id] })))
    setLoadingMsgs(false)
  }, [resolveNames])

  useEffect(() => {
    if (!current) { setMsgs([]); return }
    const salonId = current.dbId
    loadMsgs(salonId)
    const ch = supabase.channel(`salon-msgs-${salonId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'salon_messages', filter: `salon_id=eq.${salonId}` },
        async payload => {
          const m = payload.new as Msg
          await resolveNames([m.sender_id])
          setMsgs(prev => prev.some(x => x.id === m.id) ? prev : [...prev, { ...m, author: namesRef.current[m.sender_id] }])
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [current, loadMsgs, resolveNames])

  useEffect(() => {
    const el = msgAreaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const send = async () => {
    const content = input.trim()
    if (!content || !current) return
    const result = moderateMessage(content)
    if (result.isBlocked) { setWarning(getIAGuardMessage(result)); setTimeout(() => setWarning(''), 5000); return }
    setInput('')
    const { data, error } = await supabase.from('salon_messages')
      .insert({ salon_id: current.dbId, sender_id: user.id, content })
      .select('id, sender_id, content, created_at').single()
    if (error) { setInput(content); flash('Message non envoyé. Vérifie ta connexion.'); return }
    namesRef.current[user.id] = myName
    setMsgs(prev => prev.some(x => x.id === (data as Msg).id) ? prev : [...prev, { ...(data as Msg), author: myName }])
    if (result.isWarning) { setWarning(getIAGuardMessage(result)); setTimeout(() => setWarning(''), 5000) }
  }

  const doClose = async () => {
    if (!current) return
    setConfirmClose(false)
    const { error } = await closeSalon(current.dbId)
    if (error) { flash('Seul le créateur peut fermer ce salon.'); return }
    setCurrent(null)
    loadCommunity()
    flash('Salon fermé.')
  }

  // ── Recherche : filtre les salons + propose de créer la combinaison ──
  const q = norm(search)
  const catalogMatches = useMemo(() => (q ? searchCatalog(search).slice(0, 12) : []), [q, search])
  const matchName = (name: string) => !q || norm(name).includes(q)
  const communityShown = community.filter(s => matchName(s.name) || (s.tags || []).some(t => CATALOG_BY_ID[t] && norm(CATALOG_BY_ID[t].label).includes(q)))
  const existingForSel = searchSel.length ? community.find(s => s.combo_key === comboKey(searchSel)) : undefined

  const toggleSel = (id: string) => setSearchSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const createFromSearch = async () => {
    if (!searchSel.length) return
    const err = await openMix(searchSel)
    if (err) flash(err)
    else { setSearchSel([]); setSearch('') }
  }

  const count = (id: string | undefined) => (id ? salonCounts[id] || 0 : 0)
  const officialCount = (s: CatalogSalon) => count(officialRows.current[s.id]?.id)

  // ── Rendu d'une ligne de salon ──
  const SalonItem = ({ icon, name, color, active, n, sub, onClick, busy }: {
    icon: string; name: string; color: string; active: boolean; n: number; sub?: string; onClick: () => void; busy?: boolean
  }) => (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
        padding: isMobile ? '11px 10px' : '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: font,
        border: active ? `1.5px solid ${color}` : '1.5px solid transparent',
        background: active ? `${color}13` : 'transparent', transition: 'background 0.15s',
      }}>
      <span style={{ fontSize: isMobile ? 18 : 14, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: isMobile ? 14 : 12, fontWeight: 700, color: active ? color : TXT, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        {sub && <span style={{ display: 'block', fontSize: 10, color: MUT, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
      {busy ? <span style={{ fontSize: 10, color: MUT }}>…</span>
        : n > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: green, whiteSpace: 'nowrap' }}>● {n}</span>}
    </button>
  )

  const Section = ({ id, label, color, children, countLabel, defaultOpen = false }: { id: string; label: string; color: string; children: React.ReactNode; countLabel?: string; defaultOpen?: boolean }) => {
    const open = openSections[id] ?? defaultOpen
    return (
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => setOpenSections(s => ({ ...s, [id]: !open }))}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '10px 10px' : '7px 10px', fontSize: 11, fontWeight: 800, color, letterSpacing: 0.3, border: 'none', borderRadius: '0 8px 8px 0', background: `${color}${tk.isDark ? '18' : '0D'}`, cursor: 'pointer', fontFamily: font, textAlign: 'left', boxShadow: `inset 3px 0 0 ${color}` }}>
          <span>{label}{countLabel ? <span style={{ opacity: 0.7, fontWeight: 700 }}> · {countLabel}</span> : null}</span>
          <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
        </button>
        {open && <div style={{ padding: '4px 0 0 4px' }}>{children}</div>}
      </div>
    )
  }

  const showCat = (cat: string) => catFilter === 'Tous' || catFilter === cat

  // ── Barre latérale (liste des salons) ──
  const sidebar = (
    <div style={{ borderRight: isMobile ? 'none' : `1.5px solid ${BDR}`, background: SURF, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ padding: '12px 10px 8px', borderBottom: `1.5px solid ${BDR}`, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: TXT, marginBottom: 8 }}>🎵 Salons Vibz</div>

        {/* Recherche : salons existants + création d'une combinaison */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 12, border: `1.5px solid ${BDR}`, background: tk.inputBg, marginBottom: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && catalogMatches[0]) toggleSel(catalogMatches[0].id) }}
            placeholder="Salon, style ou instrument…" aria-label="Rechercher un salon, un style ou un instrument"
            style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', color: TXT, fontSize: 13, fontFamily: font }} />
          {search && <button onClick={() => setSearch('')} aria-label="Effacer" style={{ border: 'none', background: 'transparent', color: MUT, cursor: 'pointer', fontSize: 12, padding: 2 }}>✕</button>}
        </div>

        {(catalogMatches.length > 0 || searchSel.length > 0) && (
          <div style={{ padding: 8, borderRadius: 12, background: `${pink}0A`, border: `1px dashed ${pink}55`, marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: MUT, marginBottom: 6 }}>Compose ton salon (styles + instruments) :</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {searchSel.map(id => CATALOG_BY_ID[id]).filter(Boolean).map(item => (
                <button key={item.id} onClick={() => toggleSel(item.id)}
                  style={{ padding: '4px 9px', borderRadius: 14, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: font, border: `1px solid ${item.color}`, background: item.color, color: '#fff' }}>
                  {item.emoji} {item.label} ✕
                </button>
              ))}
              {catalogMatches.filter(i => !searchSel.includes(i.id)).map(item => (
                <button key={item.id} onClick={() => toggleSel(item.id)}
                  style={{ padding: '4px 9px', borderRadius: 14, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font, border: `1px solid ${item.color}66`, background: `${item.color}14`, color: item.color }}>
                  + {item.emoji} {item.label}
                </button>
              ))}
            </div>
            {searchSel.length > 0 && (
              <button onClick={createFromSearch}
                style={{ marginTop: 8, width: '100%', padding: 9, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: font, fontWeight: 800, fontSize: 12, color: 'white', background: existingForSel ? `linear-gradient(135deg,${blue},${green})` : 'linear-gradient(135deg,#A78BDB,#E07A9A)' }}>
                {existingForSel ? `🔀 Rejoindre « ${existingForSel.name} »` : `🎛️ Ouvrir le salon (${searchSel.length})`}
              </button>
            )}
          </div>
        )}

        <div className="vz-scroll-x" style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CATS.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{
              padding: isMobile ? '6px 11px' : '3px 8px', borderRadius: 20, fontSize: isMobile ? 12 : 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
              border: catFilter === cat ? `1.5px solid ${pink}` : `1.5px solid ${BDR}`,
              background: catFilter === cat ? `${pink}18` : tk.surface2,
              color: catFilter === cat ? pink : MUT, cursor: 'pointer', fontFamily: font,
            }}>{cat}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 6, minHeight: 0 }}>
        {showCat('Communauté') && (
          <Section id="communaute" label="🎛️ Salons de la communauté" color="#A78BDB" countLabel={String(communityShown.length)}>
            {communityShown.length === 0 && (
              <div style={{ fontSize: 11, color: MUT, padding: '6px 10px', lineHeight: 1.5 }}>
                {q ? 'Aucun salon ne correspond. Compose-le ci-dessus !' : 'Aucun salon ouvert. Crée le premier !'}
              </div>
            )}
            {communityShown.map(s => (
              <SalonItem key={s.id} icon={s.icon || '🎛️'} name={s.name} color={s.color || '#A78BDB'}
                active={current?.dbId === s.id} n={count(s.id)}
                sub={s.created_by === user.id ? '👑 Ton salon' : (s.tags || []).map(t => CATALOG_BY_ID[t]?.label).filter(Boolean).join(' · ')}
                onClick={() => openRow(s)} />
            ))}
          </Section>
        )}

        {(['Styles', 'Instruments', 'Événements', 'Rencontres'] as const).filter(showCat).map(cat => {
          const main = MAIN_SALONS.filter(s => s.cat === cat && matchName(s.name))
          const extra = cat === 'Styles' ? GENRE_SALONS : cat === 'Instruments' ? INSTR_SALONS : []
          const extraShown = extra.filter(s => matchName(s.name))
          if (!main.length && !extraShown.length) return null
          const color = cat === 'Styles' ? pink : cat === 'Instruments' ? green : cat === 'Événements' ? blue : pink
          const label = cat === 'Styles' ? '🎼 Styles musicaux' : cat === 'Instruments' ? '🎵 Instruments' : cat === 'Événements' ? '🎤 Concerts & Événements' : '💑 Rencontres musicales'
          const secId = `cat-${cat}`
          // Pendant une recherche tout est déplié ; sinon les longues listes sont repliées
          const defaultOpen = !!q || (cat !== 'Styles' && cat !== 'Instruments')
          return (
            <div key={cat}>
              <Section id={secId} label={label} color={color} countLabel={String(main.length + extraShown.length)} defaultOpen={defaultOpen}>
                {main.map(s => (
                  <SalonItem key={s.id} icon={s.icon} name={s.name} color={s.color} busy={opening === s.id}
                    active={!!current && officialRows.current[s.id]?.id === current.dbId} n={officialCount(s)} onClick={() => openCatalog(s)} />
                ))}
                {extraShown.map((s, i) => (
                  <div key={s.id}>
                    {s.family && s.family !== extraShown[i - 1]?.family && (
                      <div style={{ padding: '8px 10px 2px', fontSize: 9, fontWeight: 800, color: MUT, letterSpacing: 0.6, textTransform: 'uppercase' }}>{s.family}</div>
                    )}
                    <SalonItem icon={s.icon} name={s.name} color={s.color} busy={opening === s.id}
                      active={!!current && officialRows.current[s.id]?.id === current.dbId} n={officialCount(s)} onClick={() => openCatalog(s)} />
                  </div>
                ))}
              </Section>
            </div>
          )
        })}
      </div>

      <div style={{ padding: 10, borderTop: `1.5px solid ${BDR}`, flexShrink: 0 }}>
        <button onClick={() => setShowVinylMix(true)}
          style={{ width: '100%', padding: isMobile ? 13 : 10, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#A78BDB,#E07A9A)', color: 'white', fontWeight: 800, fontSize: 13, fontFamily: font, boxShadow: '0 4px 14px rgba(167,139,219,0.35)' }}>
          🎛️ Créer un salon Mix
        </button>
      </div>
    </div>
  )

  const isCreator = !!current && !current.isOfficial && current.createdBy === user.id
  const n = count(current?.dbId)

  // ── Zone de discussion ──
  const chat = current ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderBottom: `1.5px solid ${BDR}`, background: SURF, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {isMobile && (
          <button onClick={() => setCurrent(null)} aria-label="Retour à la liste des salons"
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BDR}`, background: 'transparent', color: TXT, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>‹</button>
        )}
        <span style={{ fontSize: isMobile ? 22 : 26 }}>{current.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.name}</div>
          <div style={{ fontSize: 11, color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: n > 0 ? green : MUT, fontWeight: 700 }}>● {n} connecté{n > 1 ? 's' : ''}</span>
            {' · '}{current.isOfficial ? 'Salon officiel' : isCreator ? 'Créé par toi' : 'Salon de la communauté'}
          </div>
        </div>
        {isCreator && (
          <button onClick={() => setConfirmClose(true)}
            style={{ padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${pink}55`, background: `${pink}11`, color: pink, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap' }}>
            🔒 Fermer
          </button>
        )}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: `${green}18`, borderRadius: 20, fontSize: 11, fontWeight: 700, color: green }}>
            <div style={{ width: 7, height: 7, background: green, borderRadius: '50%' }} /> IA Guard
          </div>
        )}
      </div>

      {current.tags.length > 0 && (
        <div className="vz-scroll-x" style={{ display: 'flex', gap: 5, padding: '8px 12px', borderBottom: `1px solid ${BDR}`, background: SURF, flexWrap: 'wrap', flexShrink: 0 }}>
          {current.tags.map(t => CATALOG_BY_ID[t]).filter(Boolean).map(item => (
            <span key={item.id} style={{ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${item.color}18`, color: item.color, whiteSpace: 'nowrap' }}>{item.emoji} {item.label}</span>
          ))}
        </div>
      )}

      <div ref={msgAreaRef} style={{ flex: 1, minHeight: 0, padding: isMobile ? '12px' : '14px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: BG }}>
        <div style={{ alignSelf: 'center', maxWidth: 460, textAlign: 'center', padding: '8px 14px', borderRadius: 12, background: tk.modBg, color: tk.modText, fontSize: 12, lineHeight: 1.5 }}>
          🛡️ Bienvenue dans <strong>{current.name}</strong>. Reste bienveillant·e ; VibzGuard filtre les messages qui partagent des données personnelles ou harcèlent.
        </div>
        {loadingMsgs ? (
          <div style={{ textAlign: 'center', color: MUT, fontSize: 13, padding: 24 }}>Chargement des messages…</div>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: 'center', color: MUT, fontSize: 13, padding: 24 }}>Aucun message pour l&apos;instant. Lance la conversation 🎶</div>
        ) : msgs.map(msg => {
          const isMe = msg.sender_id === user.id
          const author = isMe ? myName : (msg.author || 'Membre')
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, fontSize: 11, fontWeight: 800, background: isMe ? `${current.color}33` : `${current.color}18`, border: `1.5px solid ${current.color}44`, color: current.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {author.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ maxWidth: isMobile ? '78%' : '62%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? current.color : TXT }}>{author}</span>
                  <span style={{ fontSize: 10, color: MUT }}>{timeOf(msg.created_at)}</span>
                </div>
                <div style={{
                  padding: '9px 13px', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', maxWidth: '100%',
                  background: isMe ? `linear-gradient(135deg,${current.color},${current.color}CC)` : SURF,
                  borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  border: isMe ? 'none' : `1px solid ${BDR}`,
                  color: isMe ? '#fff' : TXT,
                }}>
                  {msg.content}
                  {extractMusicUrl(msg.content) && <MusicCard url={extractMusicUrl(msg.content)!} compact />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: isMobile ? '10px 10px' : '12px 16px', borderTop: `1.5px solid ${BDR}`, background: SURF, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {warning && (
          <div style={{ padding: '10px 14px', background: tk.modBg, color: tk.modText, borderRadius: 10, fontSize: 13, fontWeight: 600, borderLeft: `3px solid ${tk.modBorder}` }}>{warning}</div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            style={{ flex: 1, minWidth: 0, padding: '11px 16px', border: `1.5px solid ${BDR}`, borderRadius: 24, fontSize: 14, fontFamily: font, outline: 'none', background: BG, color: TXT }}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder={`Écrire dans ${current.name}…`} maxLength={1000} enterKeyHint="send"
          />
          <button onClick={send} aria-label="Envoyer" style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${current.color},${blue})`, color: 'white', fontSize: 16, flexShrink: 0 }}>➤</button>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 24, textAlign: 'center', color: MUT, fontSize: 14, lineHeight: 1.6 }}>
      <div>
        <div style={{ fontSize: 42, marginBottom: 8 }}>🎵</div>
        Choisis un salon dans la liste<br />ou crée le tien avec n&apos;importe quelle combinaison de styles et d&apos;instruments.
      </div>
    </div>
  )

  return (
    <div style={{ height: 'var(--vz-app-h, calc(100vh - 60px))', background: BG, fontFamily: font, position: 'relative', overflow: 'hidden',
      display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? undefined : '260px 1fr' }}>
      {isMobile ? (current ? chat : sidebar) : <>{sidebar}{chat}</>}

      {notice && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 24px)', padding: '10px 16px', borderRadius: 12, background: TXT, color: SURF, fontSize: 13, fontWeight: 700, zIndex: 50 }}>
          {notice}
        </div>
      )}

      {confirmClose && current && (
        <div onClick={() => setConfirmClose(false)} style={{ position: 'fixed', inset: 0, zIndex: 600, background: tk.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: SURF, borderRadius: 20, padding: 22, maxWidth: 380, width: '100%', border: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: TXT, marginBottom: 6 }}>🔒 Fermer « {current.name} » ?</div>
            <div style={{ fontSize: 13, color: MUT, lineHeight: 1.6, marginBottom: 18 }}>
              Le salon disparaît de la liste et ses messages sont effacés. N&apos;importe qui pourra le rouvrir plus tard avec la même combinaison.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmClose(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${BDR}`, background: 'transparent', color: MUT, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: font }}>Annuler</button>
              <button onClick={doClose} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,#E07A7A,${pink})`, color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: font }}>Fermer le salon</button>
            </div>
          </div>
        </div>
      )}

      {showVinylMix && (
        <VinylMixCreator
          onClose={() => setShowVinylMix(false)}
          existingSalons={community}
          salonCounts={salonCounts}
          onOpen={openMix}
        />
      )}
    </div>
  )
}
