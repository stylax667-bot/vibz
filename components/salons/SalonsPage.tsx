import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { moderateMessage, getIAGuardMessage } from '../../lib/moderation'
import { useTheme } from '../../lib/theme'
import Avatar from '../shared/Avatar'
import type { AvatarFields } from '../../lib/avatar'
import { useIsMobile } from '../../lib/useIsMobile'
import { CATALOG_BY_ID, searchCatalog, norm } from '../../lib/musicCatalog'
import {
  useSalonList, createSalon, joinSalon, leaveSalon, cancelJoinRequest, closeSalon, pingSalon,
  votePrivate, lockSalon, unlockSalon, voteExtend, answerRequest, salonFacts, tagLabels,
  SALON_BASE_MAX, SALON_EXTEND_MAX, SALON_IDLE_CLOSE_MIN,
  type SalonInfo, type SalonState,
} from '../../lib/salons'
import MusicCard, { extractMusicUrl } from '../shared/MusicCard'
import VinylMixCreator from '../shared/VinylMixCreator'
import SalonProposal from './SalonProposal'
import AssistantBox from '../shared/AssistantBox'
import { ASSISTANT_ENABLED } from '../../lib/assistant/config'

interface Props {
  user: User
  initialSalonId?: string | null            // salon à afficher directement (depuis Découvrir)
  onInitialSalonOpened?: () => void
  initialMix?: { tags: string[]; name?: string } | null   // mélange venu de Découvrir
  onInitialMixUsed?: () => void
}

const font  = 'Nunito, sans-serif'
const pink  = '#E07A9A'
const green = '#52C07A'
const blue  = '#6BB8E8'

type Msg = { id: string; sender_id: string; content: string; created_at: string }

const timeOf = (iso: string) => {
  const d = new Date(iso)
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function SalonsPage({ user, initialSalonId, onInitialSalonOpened, initialMix, onInitialMixUsed }: Props) {
  const { theme: tk } = useTheme()
  const isMobile = useIsMobile()
  const BG = tk.bg2; const SURF = tk.surface; const BDR = tk.border; const TXT = tk.text; const MUT = tk.textMuted

  const { salons, loaded, refresh } = useSalonList()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [state, setState]           = useState<SalonState | null>(null)
  const [search, setSearch]         = useState('')
  const [searchSel, setSearchSel]   = useState<string[]>([])
  const [mixer, setMixer]           = useState<string[] | null>(null)            // ingrédients de départ du vinyle
  const [proposal, setProposal]     = useState<{ tags: string[]; name?: string } | null>(null)
  const [propBusy, setPropBusy]     = useState(false)
  const [propError, setPropError]   = useState('')
  const [busy, setBusy]             = useState(false)
  const [msgs, setMsgs]             = useState<Msg[]>([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [input, setInput]           = useState('')
  const [warning, setWarning]       = useState('')
  const [notice, setNotice]         = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const [lockPick, setLockPick]     = useState<string[] | null>(null)
  const [confirm, setConfirm]       = useState<'leave' | 'close' | null>(null)
  const [askAI, setAskAI]           = useState(false)
  const namesRef   = useRef<Record<string, string>>({})
  const avatarsRef = useRef<Record<string, AvatarFields>>({})
  const msgAreaRef = useRef<HTMLDivElement>(null)
  const wasMember  = useRef(false)

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 4500) }

  const byId = useMemo(() => Object.fromEntries(salons.map(s => [s.id, s])), [salons])
  const selected: SalonInfo | undefined = selectedId ? byId[selectedId] : undefined
  const isMember = !!state?.is_member
  const current = isMember ? state : null

  // ── Salon demandé depuis Découvrir / mélange venu de Découvrir ──
  useEffect(() => {
    if (!initialSalonId) return
    setSelectedId(initialSalonId)
    onInitialSalonOpened?.()
  }, [initialSalonId, onInitialSalonOpened])

  useEffect(() => {
    if (!initialMix) return
    setProposal(initialMix)
    onInitialMixUsed?.()
  }, [initialMix, onInitialMixUsed])

  // ── État du salon affiché (et signe de vie) ──
  const ping = useCallback(async (id: string) => {
    const st = await pingSalon(id)
    if (!st) return
    if (!st.active) {
      if (wasMember.current) flash('Ce salon a été fermé : il n’avait plus de membres ou son admin l’a fermé.')
      wasMember.current = false
      setState(null); setSelectedId(s => (s === id ? null : s)); refresh()
      return
    }
    if (wasMember.current && !st.is_member) {
      flash(st.is_locked ? 'Ce salon a été verrouillé par ses membres : tu n’en fais plus partie.' : `Tu as quitté ce salon (inactif depuis plus de ${SALON_IDLE_CLOSE_MIN} min).`)
      refresh()
    }
    wasMember.current = st.is_member
    ;(st.members || []).forEach(m => {
      namesRef.current[m.user_id] = m.name
      avatarsRef.current[m.user_id] = { avatar_url: m.avatar_url, avatar_emoji: m.avatar_emoji }
    })
    setState(st)
  }, [refresh])

  useEffect(() => {
    setState(null); setMsgs([]); setShowMembers(false); setWarning(''); wasMember.current = false
    if (!selectedId) return
    ping(selectedId)
    const t = setInterval(() => ping(selectedId), 15000)
    // Changements de membres (entrées, départs, votes) : état rafraîchi aussitôt
    const ch = supabase.channel(`salon-state-${selectedId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salons', filter: `id=eq.${selectedId}` }, () => ping(selectedId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salon_members', filter: `user_id=eq.${user.id}` }, () => ping(selectedId))
      .subscribe()
    return () => { clearInterval(t); supabase.removeChannel(ch) }
  }, [selectedId, ping, user.id])

  // Salon ouvert pas encore présent dans la liste (vient d'être créé) : on recharge la liste
  const refreshedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!selectedId || !state?.active || byId[selectedId] || refreshedFor.current === selectedId) return
    refreshedFor.current = selectedId
    refresh()
  }, [selectedId, state?.active, byId, refresh])

  // ── Messages (membres uniquement) ──
  const resolveNames = useCallback(async (ids: string[]) => {
    const missing = Array.from(new Set(ids)).filter(id => !namesRef.current[id])
    if (!missing.length) return
    const { data } = await supabase.from('profiles').select('id, display_name, username, avatar_url, avatar_emoji').in('id', missing)
    ;(data || []).forEach(p => {
      namesRef.current[p.id] = p.display_name || p.username || 'Membre'
      avatarsRef.current[p.id] = { avatar_url: p.avatar_url, avatar_emoji: p.avatar_emoji }
    })
  }, [])

  const memberSalonId = isMember ? selectedId : null
  useEffect(() => {
    if (!memberSalonId) { setMsgs([]); return }
    let alive = true
    setLoadingMsgs(true)
    supabase.from('salon_messages').select('id, sender_id, content, created_at')
      .eq('salon_id', memberSalonId).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(100)
      .then(async ({ data }) => {
        const list = ((data as Msg[]) || []).reverse()
        await resolveNames(list.map(m => m.sender_id))
        if (alive) { setMsgs(list); setLoadingMsgs(false) }
      })
    const ch = supabase.channel(`salon-msgs-${memberSalonId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'salon_messages', filter: `salon_id=eq.${memberSalonId}` },
        async payload => {
          const m = payload.new as Msg
          await resolveNames([m.sender_id])
          setMsgs(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m])
        })
      .subscribe()
    return () => { alive = false; supabase.removeChannel(ch) }
  }, [memberSalonId, resolveNames])

  useEffect(() => {
    const el = msgAreaRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  const send = async () => {
    const content = input.trim()
    if (!content || !current?.id) return
    const result = moderateMessage(content)
    if (result.isBlocked) { setWarning(getIAGuardMessage(result)); setTimeout(() => setWarning(''), 5000); return }
    setInput('')
    const { data, error } = await supabase.from('salon_messages')
      .insert({ salon_id: current.id, sender_id: user.id, content })
      .select('id, sender_id, content, created_at').single()
    if (error) { setInput(content); flash('Message non envoyé : vérifie ta connexion ou ton accès au salon.'); ping(current.id); return }
    setMsgs(prev => prev.some(x => x.id === (data as Msg).id) ? prev : [...prev, data as Msg])
    if (result.isWarning) { setWarning(getIAGuardMessage(result)); setTimeout(() => setWarning(''), 5000) }
  }

  // ── Actions ──
  const doJoin = async (s: SalonInfo) => {
    if (s.is_member) { setSelectedId(s.id); return true }
    setBusy(true)
    const { status, error } = await joinSalon(s.id)
    setBusy(false)
    if (error) { flash('Impossible de rejoindre ce salon pour le moment.'); return false }
    refresh()
    if (status === 'joined') { setSelectedId(s.id); ping(s.id); return true }
    if (status === 'requested') { setSelectedId(s.id); flash('🔑 Demande envoyée : les membres du salon vont te répondre.'); return true }
    if (status === 'full') flash(`Ce salon est complet (${s.max_members} membres).`)
    if (status === 'closed') flash('Ce salon vient d’être fermé.')
    return false
  }

  const doCreate = async (opts: { name: string; parentId: string | null; isPrivate: boolean }) => {
    if (!proposal) return
    setPropBusy(true); setPropError('')
    const { result, error } = await createSalon(proposal.tags, opts)
    setPropBusy(false)
    if (error || !result) { setPropError(error?.message || 'La création a échoué. Réessaie dans un instant.'); return }
    await refresh()
    if (result.status === 'exists') { setPropError(`« ${result.name} » vient d’être ouvert avec ces ingrédients : rejoins-le ou crée une annexe.`); return }
    setProposal(null); setSearchSel([]); setSearch('')
    setSelectedId(result.salon_id)
    flash(opts.isPrivate ? '🔒 Salon privé créé : tu décides qui entre.' : '🎛️ Salon créé ! Les membres qui choisissent les mêmes ingrédients le verront.')
  }

  const doLeave = async () => {
    if (!current?.id) return
    setConfirm(null)
    const id = current.id
    wasMember.current = false
    const { data } = await leaveSalon(id)
    setState(null); setSelectedId(null); refresh()
    flash((data as { closed?: boolean } | null)?.closed ? 'Tu étais le dernier membre : le salon est fermé et ses messages effacés.' : 'Tu as quitté le salon.')
  }

  const doClose = async () => {
    if (!current?.id) return
    setConfirm(null)
    wasMember.current = false
    const { error } = await closeSalon(current.id)
    if (error) { flash(error.message); return }
    setState(null); setSelectedId(null); refresh()
    flash('Salon fermé. Ses messages sont effacés.')
  }

  const run = async (fn: () => PromiseLike<{ error: { message: string } | null }>, ok?: string) => {
    if (!current?.id) return
    setBusy(true)
    const { error } = await fn()
    setBusy(false)
    if (error) flash(error.message)
    else if (ok) flash(ok)
    ping(current.id)
  }

  const doVoteExtend = async (on: boolean) => {
    if (!current?.id) return
    setBusy(true)
    const { data, error } = await voteExtend(current.id, on)
    setBusy(false)
    if (error) flash(error.message)
    else if ((data as { extended?: boolean } | null)?.extended) flash('➕ Le salon compte 4 places de plus !')
    ping(current.id); refresh()
  }

  // ── Recherche ──
  const q = norm(search)
  const catalogMatches = useMemo(() => (q ? searchCatalog(search).slice(0, 10) : []), [q, search])
  const matchesSearch = (s: SalonInfo) => !q
    || norm(s.name).includes(q)
    || s.tags.some(t => CATALOG_BY_ID[t] && norm(CATALOG_BY_ID[t].label).includes(q))
    || (!!s.admin_name && norm(s.admin_name).includes(q))
  const shown = salons.filter(matchesSearch)
  const mine = shown.filter(s => s.is_member)
  const others = shown.filter(s => !s.is_member)
  // Salons principaux suivis de leurs annexes (ramifications du thème)
  const ordered = useMemo(() => {
    const roots = others.filter(s => !s.parent_id || !byId[s.parent_id])
    const out: { s: SalonInfo; depth: number }[] = []
    roots.forEach(r => {
      out.push({ s: r, depth: 0 })
      others.filter(a => a.parent_id === r.id).forEach(a => out.push({ s: a, depth: 1 }))
    })
    others.filter(a => a.parent_id && byId[a.parent_id] && !roots.some(r => r.id === a.parent_id))
      .forEach(a => { if (!out.some(o => o.s.id === a.id)) out.push({ s: a, depth: 1 }) })
    return out
  }, [others, byId])

  const toggleSel = (id: string) => setSearchSel(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  // ── Rendu ──
  const chip = (id: string) => {
    const i = CATALOG_BY_ID[id]
    return i ? <span key={id} style={{ padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${i.color}18`, color: i.color, whiteSpace: 'nowrap' }}>{i.emoji} {i.label}</span> : null
  }

  const SalonItem = ({ s, depth }: { s: SalonInfo; depth: number }) => {
    const active = selectedId === s.id
    const color = s.color || '#A78BDB'
    return (
      <button onClick={() => setSelectedId(s.id)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', textAlign: 'left', fontFamily: font,
          padding: isMobile ? '11px 10px' : '9px 10px', marginLeft: depth ? 14 : 0, maxWidth: depth ? 'calc(100% - 14px)' : '100%',
          borderRadius: 10, cursor: 'pointer', border: active ? `1.5px solid ${color}` : '1.5px solid transparent',
          background: active ? `${color}13` : 'transparent', boxSizing: 'border-box',
        }}>
        <span style={{ fontSize: isMobile ? 18 : 15, flexShrink: 0 }}>{depth ? '🌿' : s.icon || '🎛️'}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: isMobile ? 14 : 12.5, fontWeight: 800, color: active ? color : TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            {s.is_locked && <span style={{ fontSize: 10 }} title="Salon privé">🔒</span>}
          </span>
          <span style={{ display: 'block', fontSize: 10.5, color: MUT, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tagLabels(s.tags).join(' · ')}
          </span>
          <span style={{ display: 'block', fontSize: 10.5, color: MUT, marginTop: 1 }}>
            <span style={{ color: s.online_count ? green : MUT, fontWeight: 700 }}>● {s.online_count} en ligne</span>
            {` · ${s.member_count}/${s.max_members} membres`}
            {s.request_pending ? ' · ⏳ demande envoyée' : ''}
          </span>
        </span>
      </button>
    )
  }

  const sectionTitle = (label: string, color: string) => (
    <div style={{ padding: '8px 10px 4px', fontSize: 10.5, fontWeight: 800, color, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
  )

  const sidebar = (
    <div style={{ borderRight: isMobile ? 'none' : `1.5px solid ${BDR}`, background: SURF, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ padding: '12px 10px 8px', borderBottom: `1.5px solid ${BDR}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: TXT }}>🎵 Salons des membres</span>
          <span style={{ fontSize: 11, color: MUT }}>{loaded ? `${salons.length} ouvert${salons.length > 1 ? 's' : ''}` : '…'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 12, border: `1.5px solid ${BDR}`, background: tk.inputBg, marginBottom: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.6 }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setAskAI(false) }}
            onKeyDown={e => { if (ASSISTANT_ENABLED && e.key === 'Enter' && search.trim()) setAskAI(true) }}
            placeholder="Style, instrument, nom de salon, envie…" aria-label="Rechercher un salon"
            style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', color: TXT, fontSize: 13, fontFamily: font }} />
          {search && <button onClick={() => { setSearch(''); setAskAI(false) }} aria-label="Effacer" style={{ border: 'none', background: 'transparent', color: MUT, cursor: 'pointer', fontSize: 12, padding: 2 }}>✕</button>}
        </div>

        {ASSISTANT_ENABLED && search.trim() && (
          <button onClick={() => setAskAI(true)}
            style={{ width: '100%', marginBottom: 8, padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${blue}55`, background: `${blue}12`, color: tk.blueDark, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: font, textAlign: 'left' }}>
            🤖 Demander à l’assistant : « {search.trim().slice(0, 40)} »
          </button>
        )}

        {(catalogMatches.length > 0 || searchSel.length > 0) && (
          <div style={{ padding: 8, borderRadius: 12, background: `${pink}0A`, border: `1px dashed ${pink}55`, marginBottom: 4 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: MUT, marginBottom: 6 }}>Composer ton mélange :</div>
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
              <button onClick={() => { setPropError(''); setProposal({ tags: searchSel }) }}
                style={{ marginTop: 8, width: '100%', padding: 9, borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: font, fontWeight: 800, fontSize: 12, color: 'white', background: 'linear-gradient(135deg,#A78BDB,#E07A9A)' }}>
                Rejoindre ou créer ({searchSel.length} ingrédient{searchSel.length > 1 ? 's' : ''}) →
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 6, minHeight: 0 }}>
        {ASSISTANT_ENABLED && askAI && search.trim() && (
          <div style={{ margin: '4px 2px 8px' }}>
            <AssistantBox key={search.trim()} question={search.trim()} mode="search"
              onOpenSalon={id => { setSelectedId(id); setAskAI(false) }}
              onMix={tags => { setAskAI(false); setPropError(''); setProposal({ tags }) }}
              onClose={() => setAskAI(false)} />
          </div>
        )}
        {mine.length > 0 && (
          <>
            {sectionTitle(`Mes salons · ${mine.length}`, green)}
            {mine.map(s => <SalonItem key={s.id} s={s} depth={0} />)}
          </>
        )}
        {sectionTitle(`Salons ouverts · ${others.length}`, '#A78BDB')}
        {loaded && ordered.length === 0 && (
          <div style={{ fontSize: 12, color: MUT, padding: '6px 10px 10px', lineHeight: 1.55 }}>
            {q ? 'Aucun salon ouvert ne correspond. Compose ton mélange ci-dessus ou demande à l’assistant.'
              : 'Aucun autre salon ouvert pour l’instant. Les salons sont créés par les membres : lance le prochain !'}
          </div>
        )}
        {ordered.map(({ s, depth }) => <SalonItem key={s.id} s={s} depth={depth} />)}
      </div>

      <div style={{ padding: 10, borderTop: `1.5px solid ${BDR}`, flexShrink: 0 }}>
        <button onClick={() => setMixer([])}
          style={{ width: '100%', padding: isMobile ? 13 : 10, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#A78BDB,#E07A9A)', color: 'white', fontWeight: 800, fontSize: 13, fontFamily: font, boxShadow: '0 4px 14px rgba(167,139,219,0.35)' }}>
          🎛️ Créer un salon
        </button>
      </div>
    </div>
  )

  const btn = (kind: 'main' | 'soft' | 'ghost', color = pink): React.CSSProperties => ({
    padding: '8px 13px', borderRadius: 20, fontFamily: font, fontWeight: 800, fontSize: 12, cursor: busy ? 'wait' : 'pointer', whiteSpace: 'nowrap',
    border: kind === 'ghost' ? `1.5px solid ${BDR}` : kind === 'soft' ? `1.5px solid ${color}55` : 'none',
    background: kind === 'main' ? color : kind === 'soft' ? `${color}12` : 'transparent',
    color: kind === 'main' ? 'white' : kind === 'soft' ? color : TXT,
  })

  const backBtn = isMobile && (
    <button onClick={() => setSelectedId(null)} aria-label="Retour à la liste des salons"
      style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BDR}`, background: 'transparent', color: TXT, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>‹</button>
  )

  // ── Aperçu d'un salon (non membre) ──
  const preview = selected && !isMember ? (
    <div style={{ height: '100%', overflowY: 'auto', padding: isMobile ? 12 : 28 }}>
      {backBtn}
      <div style={{ maxWidth: 560, margin: isMobile ? '10px auto 0' : '0 auto', background: SURF, border: `1.5px solid ${(selected.color || blue)}55`, borderRadius: 20, padding: isMobile ? 16 : 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 34 }}>{selected.icon || '🎛️'}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: TXT, overflowWrap: 'anywhere' }}>{selected.name} {selected.is_locked && '🔒'}</div>
            {selected.parent_id && byId[selected.parent_id] && (
              <button onClick={() => setSelectedId(selected.parent_id)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: MUT, fontSize: 12, fontFamily: font }}>
                🌿 Annexe de « {byId[selected.parent_id].name} »
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>{selected.tags.map(chip)}</div>
        <ul style={{ margin: '0 0 16px', paddingLeft: 18, color: tk.textSub, fontSize: 13, lineHeight: 1.7 }}>
          {salonFacts(selected).map(f => <li key={f}>{f}</li>)}
        </ul>
        <div style={{ fontSize: 12, color: MUT, marginBottom: 16, lineHeight: 1.5 }}>
          🛡️ Les messages ne sont visibles que par les membres du salon.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selected.request_pending ? (
            <button disabled={busy} onClick={async () => { await cancelJoinRequest(selected.id); refresh(); flash('Demande annulée.') }} style={btn('ghost')}>⏳ Demande envoyée · annuler</button>
          ) : selected.is_locked ? (
            <button disabled={busy} onClick={() => doJoin(selected)} style={btn('main', blue)}>🔑 Demander à entrer</button>
          ) : selected.member_count >= selected.max_members ? (
            <button disabled style={{ ...btn('ghost'), cursor: 'default', color: MUT }}>Complet ({selected.max_members} membres)</button>
          ) : (
            <button disabled={busy} onClick={() => doJoin(selected)} style={btn('main', green)}>🚪 Accéder au salon</button>
          )}
          <button onClick={() => setMixer(selected.tags)} style={btn('soft', pink)}>🎛️ Créer un autre salon</button>
          <button onClick={() => { setPropError(''); setProposal({ tags: selected.tags }) }} style={btn('soft', selected.color || '#A78BDB')}>🌿 Créer une annexe</button>
        </div>
        {salons.filter(a => a.parent_id === selected.id).length > 0 && (
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: MUT, marginBottom: 6 }}>Annexes de ce salon</div>
            {salons.filter(a => a.parent_id === selected.id).map(a => <SalonItem key={a.id} s={a} depth={0} />)}
          </div>
        )}
      </div>
    </div>
  ) : null

  // ── Discussion (membre) ──
  const members = current?.members || []
  const onlineN = members.filter(m => m.online).length
  const isCtrl = !!current && (current.is_admin || current.me?.wants_private)
  const majority = !!current && (current.votes_private || 0) >= (current.private_needed || 99)
  const requests = current?.requests || []

  const controls = current && (
    <div className="vz-scroll-x" style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${BDR}`, background: SURF, flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : undefined, flexShrink: 0, alignItems: 'center' }}>
      {current.is_locked ? (
        <>
          <span style={{ ...btn('soft', blue), cursor: 'default' }}>🔒 Salon verrouillé</span>
          {isCtrl && <button disabled={busy} onClick={() => run(() => unlockSalon(current.id!), '🔓 Salon rouvert à tous.')} style={btn('ghost')}>Déverrouiller</button>}
        </>
      ) : (
        <>
          <button disabled={busy} onClick={() => run(() => votePrivate(current.id!, !current.me?.wants_private))}
            title="1er niveau : indique que tu veux discuter en petit comité. Les membres qui votent prennent le contrôle du salon."
            style={btn(current.me?.wants_private ? 'main' : 'soft', blue)}>
            🔐 {current.me?.wants_private ? 'Je veux privatiser ✓' : 'Privatiser'} · {current.votes_private}/{current.private_needed}
          </button>
          {current.me?.wants_private && (
            <button disabled={busy || !majority}
              onClick={() => setLockPick(members.filter(m => m.wants_private).map(m => m.user_id))}
              title={majority ? '2e niveau : choisis les participants et verrouille le salon' : `Il faut ${current.private_needed} votes sur ${current.member_count}`}
              style={{ ...btn(majority ? 'main' : 'ghost', pink), opacity: majority ? 1 : 0.55 }}>
              🔒 Choisir les participants
            </button>
          )}
        </>
      )}
      {(current.max_members || SALON_BASE_MAX) < SALON_EXTEND_MAX && (
        <button disabled={busy} onClick={() => doVoteExtend(!current.me?.votes_extend)}
          title={`Un quart des membres suffit pour ajouter 4 places (${SALON_EXTEND_MAX} maximum)`}
          style={btn(current.me?.votes_extend ? 'main' : 'soft', green)}>
          ➕ Agrandir (+4) · {current.votes_extend}/{current.extend_needed}
        </button>
      )}
      {isCtrl && requests.length > 0 && (
        <button onClick={() => setShowMembers(true)} style={btn('main', '#E8A06A')}>🔑 {requests.length} demande{requests.length > 1 ? 's' : ''}</button>
      )}
    </div>
  )

  const chat = current ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
      <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderBottom: `1.5px solid ${BDR}`, background: SURF, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {backBtn}
        <span style={{ fontSize: isMobile ? 22 : 26 }}>{current.icon || '🎛️'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.name}</div>
          <div style={{ fontSize: 11, color: MUT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ color: onlineN ? green : MUT, fontWeight: 700 }}>● {onlineN} en ligne</span>
            {` · ${current.member_count}/${current.max_members} membres`}
            {current.is_admin ? ' · 👑 tu es l’admin' : ''}
          </div>
        </div>
        <button onClick={() => setShowMembers(true)} style={btn('ghost')} aria-label="Membres du salon">👥{isMobile ? '' : ' Membres'}</button>
        {(current.member_count || 0) <= 2 && <button onClick={() => setConfirm('close')} style={btn('soft', pink)} title="Les deux derniers membres peuvent fermer le salon">🔒{isMobile ? '' : ' Fermer'}</button>}
        <button onClick={() => setConfirm('leave')} style={btn('ghost')}>🚪{isMobile ? '' : ' Quitter'}</button>
      </div>

      {controls}
      {(current.tags || []).length > 0 && !isMobile && (
        <div style={{ display: 'flex', gap: 5, padding: '6px 20px', borderBottom: `1px solid ${BDR}`, background: SURF, flexWrap: 'wrap', flexShrink: 0 }}>{(current.tags || []).map(chip)}</div>
      )}

      <div ref={msgAreaRef} style={{ flex: 1, minHeight: 0, padding: isMobile ? '12px' : '14px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: BG }}>
        <div style={{ alignSelf: 'center', maxWidth: 480, textAlign: 'center', padding: '8px 14px', borderRadius: 12, background: tk.modBg, color: tk.modText, fontSize: 12, lineHeight: 1.5 }}>
          🛡️ Messages visibles des seuls membres. Le salon se ferme quand le dernier membre part, ou après {SALON_IDLE_CLOSE_MIN} min sans personne ; ses messages sont alors effacés.
        </div>
        {loadingMsgs ? (
          <div style={{ textAlign: 'center', color: MUT, fontSize: 13, padding: 24 }}>Chargement des messages…</div>
        ) : msgs.length === 0 ? (
          <div style={{ textAlign: 'center', color: MUT, fontSize: 13, padding: 24 }}>Aucun message pour l&apos;instant. Lance la conversation 🎶 (tu peux coller un lien YouTube)</div>
        ) : msgs.map(msg => {
          const isMe = msg.sender_id === user.id
          const author = namesRef.current[msg.sender_id] || 'Membre'
          const color = current.color || '#A78BDB'
          const link = extractMusicUrl(msg.content)
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
              <Avatar p={{ display_name: author, ...avatarsRef.current[msg.sender_id] }} size={30} ring={`${color}66`} online={false} />
              <div style={{ maxWidth: isMobile ? '80%' : '62%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isMe ? color : TXT }}>{isMe ? 'Moi' : author}</span>
                  <span style={{ fontSize: 10, color: MUT }}>{timeOf(msg.created_at)}</span>
                </div>
                <div style={{
                  padding: '9px 13px', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', maxWidth: '100%',
                  background: isMe ? `linear-gradient(135deg,${color},${color}CC)` : SURF,
                  borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  border: isMe ? 'none' : `1px solid ${BDR}`, color: isMe ? '#fff' : TXT,
                }}>
                  {msg.content}
                </div>
                {link && <MusicCard url={link} compact />}
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
            placeholder={`Écrire dans ${current.name}…`} maxLength={1000} enterKeyHint="send" />
          <button onClick={send} aria-label="Envoyer" style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${current.color || pink},${blue})`, color: 'white', fontSize: 16, flexShrink: 0 }}>➤</button>
        </div>
      </div>
    </div>
  ) : null

  const welcome = (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 460, textAlign: 'center', color: tk.textSub, fontSize: 14, lineHeight: 1.65 }}>
        <div style={{ fontSize: 42, marginBottom: 8 }}>🎵</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: TXT, marginBottom: 8 }}>Les salons sont créés par les membres</div>
        Choisis tes ingrédients (styles, instruments) : si un salon existe déjà avec les mêmes, Vibz te propose de le rejoindre, d’en créer une annexe ou d’ouvrir le tien.
        <ul style={{ textAlign: 'left', fontSize: 13, margin: '14px 0', paddingLeft: 20 }}>
          <li>{SALON_BASE_MAX} membres maximum, jusqu’à {SALON_EXTEND_MAX} si un quart des membres vote pour agrandir.</li>
          <li>Les messages ne sont lisibles que par les membres.</li>
          <li>Les membres peuvent privatiser le salon et choisir les participants.</li>
          <li>Le salon se ferme quand le dernier membre part, ou après {SALON_IDLE_CLOSE_MIN} min sans personne.</li>
        </ul>
        <button onClick={() => setMixer([])} style={{ ...btn('main'), padding: '11px 20px', fontSize: 14 }}>🎛️ Créer un salon</button>
      </div>
    </div>
  )

  const main = chat || preview || (selectedId && !state ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: MUT, fontSize: 13 }}>Chargement du salon…</div>
  ) : welcome)

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, zIndex: 600, background: tk.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: font }
  const box: React.CSSProperties = { background: SURF, color: TXT, borderRadius: 20, padding: 22, maxWidth: 420, width: '100%', maxHeight: '88vh', overflowY: 'auto', border: `1px solid ${BDR}` }

  return (
    <div style={{ height: 'var(--vz-app-h, calc(100vh - 60px))', background: BG, fontFamily: font, position: 'relative', overflow: 'hidden',
      display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? undefined : '300px 1fr' }}>
      {isMobile ? (selectedId ? main : sidebar) : <>{sidebar}{main}</>}

      {notice && (
        <div role="status" style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 24px)', padding: '10px 16px', borderRadius: 12, background: TXT, color: SURF, fontSize: 13, fontWeight: 700, zIndex: 50 }}>
          {notice}
        </div>
      )}

      {/* Membres + demandes d'accès */}
      {showMembers && current && (
        <div onClick={() => setShowMembers(false)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={box} role="dialog" aria-label="Membres du salon">
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 12 }}>👥 Membres · {current.member_count}/{current.max_members}</div>
            {isCtrl && requests.length > 0 && (
              <div style={{ marginBottom: 14, padding: 10, borderRadius: 12, background: tk.modBg }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: tk.modText, marginBottom: 8 }}>🔑 Demandent à entrer</div>
                {requests.map(r => (
                  <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Avatar p={{ display_name: r.name, avatar_url: r.avatar_url, avatar_emoji: r.avatar_emoji }} size={30} online={false} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <button disabled={busy} onClick={() => run(() => answerRequest(current.id!, r.user_id, true), `${r.name} a rejoint le salon.`)} style={btn('main', green)}>Accepter</button>
                    <button disabled={busy} onClick={() => run(() => answerRequest(current.id!, r.user_id, false))} style={btn('ghost')}>Refuser</button>
                  </div>
                ))}
              </div>
            )}
            {members.map(m => (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <Avatar p={{ display_name: m.name, avatar_url: m.avatar_url, avatar_emoji: m.avatar_emoji }} size={34} online={m.online} />
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}{m.user_id === user.id ? ' (moi)' : ''}
                </span>
                {m.is_admin && <span title="Admin du salon">👑</span>}
                {m.wants_private && <span title="Veut privatiser">🔐</span>}
                {m.votes_extend && <span title="Vote pour agrandir">➕</span>}
              </div>
            ))}
            <div style={{ fontSize: 11, color: MUT, marginTop: 10, lineHeight: 1.5 }}>👑 admin · 🔐 veut privatiser (contrôle le salon) · ➕ vote pour agrandir · ● en ligne</div>
            <button onClick={() => setShowMembers(false)} style={{ ...btn('ghost'), marginTop: 14, width: '100%' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* 2e niveau : choix des participants puis verrouillage */}
      {lockPick && current && (
        <div onClick={() => setLockPick(null)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={box} role="dialog" aria-label="Verrouiller le salon">
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>🔒 Qui reste dans le salon ?</div>
            <div style={{ fontSize: 13, color: tk.textSub, lineHeight: 1.55, marginBottom: 12 }}>
              Coche les participants. Les autres quitteront le salon ; il restera visible dans la liste, mais on n’y entrera plus que sur demande.
            </div>
            {members.map(m => {
              const me = m.user_id === user.id
              const on = me || lockPick.includes(m.user_id)
              return (
                <label key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: me ? 'default' : 'pointer' }}>
                  <input type="checkbox" checked={on} disabled={me} style={{ accentColor: pink }}
                    onChange={() => setLockPick(p => p && (p.includes(m.user_id) ? p.filter(x => x !== m.user_id) : [...p, m.user_id]))} />
                  <Avatar p={{ display_name: m.name, avatar_url: m.avatar_url, avatar_emoji: m.avatar_emoji }} size={30} online={m.online} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{m.name}{me ? ' (moi)' : ''}</span>
                  {m.wants_private && <span title="Veut privatiser">🔐</span>}
                </label>
              )
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setLockPick(null)} style={{ ...btn('ghost'), flex: 1 }}>Annuler</button>
              <button disabled={busy} onClick={async () => {
                const keep = Array.from(new Set([...lockPick, user.id]))
                setLockPick(null)
                await run(() => lockSalon(current.id!, keep), '🔒 Salon verrouillé.')
                refresh()
              }} style={{ ...btn('main'), flex: 1 }}>Verrouiller</button>
            </div>
          </div>
        </div>
      )}

      {confirm && current && (
        <div onClick={() => setConfirm(null)} style={overlay}>
          <div onClick={e => e.stopPropagation()} style={box}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>
              {confirm === 'close' ? `🔒 Fermer « ${current.name} » ?` : `🚪 Quitter « ${current.name} » ?`}
            </div>
            <div style={{ fontSize: 13, color: MUT, lineHeight: 1.6, marginBottom: 18 }}>
              {confirm === 'close'
                ? 'Le salon est fermé pour tous ses membres et ses messages sont effacés.'
                : (current.member_count || 0) <= 1
                  ? 'Tu es le dernier membre : le salon sera fermé et ses messages effacés.'
                  : current.is_admin ? 'Le rôle d’admin passera au membre le plus ancien.' : 'Tu pourras revenir tant que le salon est ouvert.'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirm(null)} style={{ ...btn('ghost'), flex: 1 }}>Annuler</button>
              <button onClick={confirm === 'close' ? doClose : doLeave} style={{ ...btn('main'), flex: 1 }}>{confirm === 'close' ? 'Fermer le salon' : 'Quitter'}</button>
            </div>
          </div>
        </div>
      )}

      {mixer && (
        <VinylMixCreator
          salons={salons}
          initialSelected={mixer}
          onClose={() => setMixer(null)}
          onOpen={tags => { setMixer(null); setPropError(''); setProposal({ tags }) }}
        />
      )}

      {proposal && (
        <SalonProposal
          tags={proposal.tags}
          initialName={proposal.name}
          salons={salons}
          busy={propBusy}
          error={propError}
          onJoin={async s => { if (await doJoin(s)) setProposal(null) }}
          onCreate={doCreate}
          onChangeIngredients={() => { const t = proposal.tags; setProposal(null); setMixer(t) }}
          onClose={() => setProposal(null)}
        />
      )}
    </div>
  )
}
