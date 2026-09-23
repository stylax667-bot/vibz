import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import { moderateMessage, getIAGuardMessage } from '../../lib/moderation'
import MusicCard, { extractMusicUrl } from '../shared/MusicCard'

interface Props {
  user: User
  initialContact?: Profile | null   // ouvrir directement une conversation (depuis Découvrir)
  onContactOpened?: () => void
}

type ContactProfile = Profile & { allow_messages_from?: 'all' | 'matches' | 'none' }

type Contact = {
  profile: ContactProfile
  conversationId: string | null
  lastAt: string | null
  unread: number
  isMatch: boolean
}

type ChatMsg = {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: string
  created_at: string
}

const EMOJIS = ['😊','❤️','🎸','🎵','😂','🔥','✨','🥰','👋','🎹','🎤','🎧','😎','🎶','💕','🤩','😍','🙌','👌','💯','🎺','🥁','🎷','🎻','🪕']

const REPORT_REASONS = [
  { id: 'harcelement',         label: 'Harcèlement' },
  { id: 'spam',                label: 'Spam' },
  { id: 'contenu_inapproprie', label: 'Contenu inapproprié' },
  { id: 'usurpation',          label: 'Usurpation d\'identité' },
  { id: 'autre',               label: 'Autre' },
] as const

const timeOf = (iso: string) => {
  const d = new Date(iso)
  const today = new Date().toDateString() === d.toDateString()
  return today
    ? `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function MessengerPage({ user, initialContact, onContactOpened }: Props) {
  const { theme: tk } = useTheme()
  const isMobile = useIsMobile()
  const font = 'Nunito, sans-serif'
  const pink  = '#E07A9A'
  const blue  = '#6BB8E8'
  const green = '#52C07A'
  const BG = tk.bg2; const SURF = tk.surface; const BDR = tk.border; const TXT = tk.text; const MUT = tk.textMuted

  const [me, setMe]                   = useState<Profile | null>(null)
  const [contacts, setContacts]       = useState<Contact[]>([])
  // Membre ouvert depuis Découvrir, sans conversation existante (conservé même si la liste se recharge)
  const [pending, setPending]         = useState<ContactProfile | null>(null)
  const [blocked, setBlocked]         = useState<Profile[]>([])
  const [blockedMe, setBlockedMe]     = useState<Set<string>>(new Set())
  const [loading, setLoading]         = useState(true)
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [messages, setMessages]       = useState<ChatMsg[]>([])
  const [input, setInput]             = useState('')
  const [warning, setWarning]         = useState('')
  const [notice, setNotice]           = useState('')
  const [showEmojis, setShowEmojis]   = useState(false)
  const [wizzShake, setWizzShake]     = useState(false)
  const [reportOpen, setReportOpen]   = useState(false)
  const [reportReason, setReportReason] = useState<typeof REPORT_REASONS[number]['id']>('harcelement')
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(''), 3500) }

  // ── Chargement : conversations + matchs + blocages (données réelles) ──
  const loadAll = useCallback(async () => {
    const [{ data: meRow }, { data: convs }, { data: matches }, { data: blocks }, { data: bm }, { data: unreadRows }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('conversations').select('id, user1, user2, last_message_at').or(`user1.eq.${user.id},user2.eq.${user.id}`),
      supabase.from('matches').select('user1, user2').or(`user1.eq.${user.id},user2.eq.${user.id}`),
      supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id),
      supabase.rpc('blocked_me'),
      supabase.from('messages').select('conversation_id').eq('is_read', false).neq('sender_id', user.id),
    ])
    if (meRow) setMe(meRow as Profile)

    const other = (r: { user1: string; user2: string }) => (r.user1 === user.id ? r.user2 : r.user1)
    const convByUser = new Map<string, { id: string; last: string | null }>()
    ;(convs || []).forEach(c => convByUser.set(other(c), { id: c.id, last: c.last_message_at }))
    const matchIds = new Set((matches || []).map(other))
    const blockedIds = new Set((blocks || []).map(b => b.blocked_id as string))
    setBlockedMe(new Set((bm as string[] | null) || []))

    const unread = new Map<string, number>()
    ;(unreadRows || []).forEach(r => unread.set(r.conversation_id, (unread.get(r.conversation_id) || 0) + 1))

    const ids = Array.from(new Set([...Array.from(convByUser.keys()), ...Array.from(matchIds), ...Array.from(blockedIds)]))
    const { data: profs } = ids.length
      ? await supabase.from('profiles').select('*').in('id', ids)
      : { data: [] as Profile[] }
    const byId = new Map((profs || []).map(p => [p.id, p as ContactProfile]))

    setBlocked(Array.from(blockedIds).map(id => byId.get(id)).filter(Boolean) as Profile[])
    setContacts(
      ids.filter(id => !blockedIds.has(id) && byId.has(id)).map(id => {
        const conv = convByUser.get(id)
        return {
          profile: byId.get(id)!,
          conversationId: conv?.id ?? null,
          lastAt: conv?.last ?? null,
          unread: conv ? unread.get(conv.id) || 0 : 0,
          isMatch: matchIds.has(id),
        }
      }).sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''))
    )
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadAll() }, [loadAll])

  // Conversation demandée depuis Découvrir : on l'ajoute si besoin puis on l'ouvre
  useEffect(() => {
    if (!initialContact || loading) return
    setPending(initialContact)
    setSelectedId(initialContact.id)
    onContactOpened?.()
  }, [initialContact, loading, onContactOpened])

  const allContacts = useMemo<Contact[]>(() => {
    if (!pending || contacts.some(c => c.profile.id === pending.id) || blocked.some(b => b.id === pending.id)) return contacts
    return [{ profile: pending, conversationId: null, lastAt: null, unread: 0, isMatch: false }, ...contacts]
  }, [contacts, pending, blocked])

  // Sur ordinateur on ouvre la conversation la plus récente
  useEffect(() => {
    if (!isMobile && !selectedId && allContacts.length > 0 && !initialContact) setSelectedId(allContacts[0].profile.id)
  }, [isMobile, selectedId, allContacts, initialContact])

  const selected = allContacts.find(c => c.profile.id === selectedId) || null
  const selectedBlocked = blocked.find(b => b.id === selectedId) || null
  const selectedProfile: Profile | null = selected?.profile || selectedBlocked
  const conversationId = selected?.conversationId ?? null
  const conversationIdRef = useRef<string | null>(null)
  conversationIdRef.current = conversationId

  // ── Messages de la conversation ouverte ──
  useEffect(() => {
    setMessages([]); setReportOpen(false); setConfirmBlock(false); setWarning('')
    if (!conversationId) return
    let cancelled = false
    supabase.from('messages').select('*').eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }).limit(200)
      .then(({ data }) => { if (!cancelled) setMessages((data as ChatMsg[]) || []) })
    // Marquer comme lus
    supabase.from('messages').update({ is_read: true })
      .eq('conversation_id', conversationId).neq('sender_id', user.id).eq('is_read', false)
      .then(() => setContacts(prev => prev.map(c => c.conversationId === conversationId ? { ...c, unread: 0 } : c)))
    return () => { cancelled = true }
  }, [conversationId, user.id])

  // ── Temps réel : nouveaux messages (RLS : uniquement mes conversations) ──
  useEffect(() => {
    const ch = supabase.channel(`dm-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const m = payload.new as ChatMsg
        setContacts(prev => {
          const known = prev.find(c => c.conversationId === m.conversation_id)
          if (!known) { loadAll(); return prev }
          const isOpen = known.profile.id === selectedIdRef.current
          return prev.map(c => c.conversationId === m.conversation_id
            ? { ...c, lastAt: m.created_at, unread: isOpen || m.sender_id === user.id ? c.unread : c.unread + 1 }
            : c).sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || ''))
        })
        setMessages(prev => {
          if (m.conversation_id !== conversationIdRef.current || prev.some(x => x.id === m.id)) return prev
          return [...prev, m]
        })
        if (m.conversation_id === conversationIdRef.current && m.sender_id !== user.id) {
          supabase.from('messages').update({ is_read: true }).eq('id', m.id).then(() => {})
          if (m.message_type === 'wizz') { setWizzShake(true); setTimeout(() => setWizzShake(false), 600) }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user.id, loadAll])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ── Envoi ──
  const canWrite = (() => {
    if (!selected) return { ok: false, why: '' }
    if (blockedMe.has(selected.profile.id)) return { ok: false, why: 'Ce membre ne reçoit plus tes messages.' }
    const rule = selected.profile.allow_messages_from || 'all'
    if (rule === 'none') return { ok: false, why: `${selected.profile.display_name} n'accepte pas de messages pour le moment.` }
    if (rule === 'matches' && !selected.isMatch && !selected.conversationId) return { ok: false, why: `${selected.profile.display_name} n'accepte les messages que de ses matchs.` }
    return { ok: true, why: '' }
  })()

  const ensureConversation = async (other: string): Promise<string | null> => {
    const [u1, u2] = [user.id, other].sort()
    const { data: existing } = await supabase.from('conversations').select('id').eq('user1', u1).eq('user2', u2).maybeSingle()
    if (existing) return existing.id
    const { data, error } = await supabase.from('conversations').insert({ user1: u1, user2: u2 }).select('id').single()
    if (error || !data) return null
    return data.id
  }

  const sendMsg = async (content = input, type: 'text' | 'emoji' | 'wizz' = 'text') => {
    const text = content.trim()
    if (!text || !selected || !canWrite.ok) return
    if (type === 'text') {
      const result = moderateMessage(text)
      if (result.isBlocked) { setWarning(getIAGuardMessage(result)); setTimeout(() => setWarning(''), 5000); return }
      if (result.isWarning) { setWarning(getIAGuardMessage(result)); setTimeout(() => setWarning(''), 5000) }
    }
    const convId = selected.conversationId || await ensureConversation(selected.profile.id)
    if (!convId) { flash('Impossible de démarrer la conversation.'); return }
    if (type === 'text') setInput('')
    const { data, error } = await supabase.from('messages')
      .insert({ conversation_id: convId, sender_id: user.id, content: text, message_type: type })
      .select('*').single()
    if (error || !data) { if (type === 'text') setInput(text); flash('Message non envoyé.'); return }
    const now = new Date().toISOString()
    supabase.from('conversations').update({ last_message_at: now }).eq('id', convId).then(() => {})
    setMessages(prev => prev.some(x => x.id === data.id) ? prev : [...prev, data as ChatMsg])
    // Première conversation avec ce membre : on recharge la liste (la conversation existe maintenant)
    if (!selected.conversationId) { await loadAll(); return }
    setContacts(prev => prev.map(c => c.profile.id === selected.profile.id ? { ...c, lastAt: now } : c)
      .sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || '')))
    if (type !== 'text') setShowEmojis(false)
  }

  const sendWizz = () => {
    setWizzShake(true); setTimeout(() => setWizzShake(false), 600)
    sendMsg('⚡ Wizz !', 'wizz')
  }

  // ── Bloquer / débloquer ──
  const block = async (p: Profile) => {
    setConfirmBlock(false)
    const { error } = await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: p.id })
    if (error) { flash('Impossible de bloquer ce membre pour le moment.'); return }
    flash(`🚫 ${p.display_name} est bloqué·e`)
    await loadAll()
  }

  const unblock = async (p: Profile) => {
    const { error } = await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', p.id)
    if (error) { flash('Impossible de débloquer pour le moment.'); return }
    flash(`✅ ${p.display_name} est débloqué·e`)
    await loadAll()
  }

  const sendReport = async () => {
    if (!selectedProfile) return
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id, reported_user_id: selectedProfile.id, reason: reportReason,
    })
    setReportOpen(false)
    flash(error ? 'Le signalement n\'a pas pu être envoyé.' : '🚩 Signalement envoyé à la modération. Merci.')
  }

  // ── Composants ──
  const Avatar = ({ p, size = 36 }: { p: Profile | null; size?: number }) => (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {p?.avatar_url
        ? <img src={p.avatar_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BDR}` }} />
        : <div style={{
            width: size, height: size, borderRadius: '50%', fontSize: size * 0.36, fontWeight: 800,
            background: tk.isDark ? `linear-gradient(135deg,${tk.pinkLight},${tk.blueLight})` : 'linear-gradient(135deg,#FFF0F5,#F0F7FD)',
            color: tk.pinkDark, border: `2px solid ${BDR}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{(p?.display_name || p?.username || '?').slice(0, 2).toUpperCase()}</div>}
      {p?.is_online && (
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: green, border: `2px solid ${SURF}` }} />
      )}
    </div>
  )

  const headerBtn = (color: string): React.CSSProperties => ({
    padding: isMobile ? '7px 10px' : '7px 14px', borderRadius: 20, border: `1.5px solid ${color}55`,
    background: `${color}14`, color, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap',
  })

  // ── Liste des contacts ──
  const list = (
    <div style={{ borderRight: isMobile ? 'none' : `1.5px solid ${BDR}`, background: SURF, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
      <div style={{ padding: '14px 16px', borderBottom: `1.5px solid ${BDR}`, display: 'flex', alignItems: 'center', gap: 10, background: tk.isDark ? `linear-gradient(135deg,${tk.pinkLight},${tk.blueLight})` : 'linear-gradient(135deg,#FFF5F8,#F0F7FD)' }}>
        <Avatar p={me || ({ display_name: user.email || '' } as Profile)} size={42} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me?.display_name || user.email?.split('@')[0]}</div>
          <div style={{ fontSize: 11, color: MUT }}>Mes conversations</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', minHeight: 0 }}>
        <div style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: MUT }}>
          Contacts ({allContacts.length})
        </div>
        {loading ? (
          <div style={{ padding: 16, fontSize: 13, color: MUT }}>Chargement…</div>
        ) : allContacts.length === 0 ? (
          <div style={{ padding: '12px 16px', fontSize: 13, color: MUT, lineHeight: 1.6 }}>
            Aucune conversation pour l&apos;instant.<br />Écris à un membre depuis <strong>Découvrir</strong> (bouton 💬) ou matche avec quelqu&apos;un ❤️
          </div>
        ) : allContacts.map(c => {
          const active = selectedId === c.profile.id
          return (
            <button key={c.profile.id} onClick={() => setSelectedId(c.profile.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', fontFamily: font,
                padding: isMobile ? '12px 16px' : '10px 16px', cursor: 'pointer', border: 'none',
                background: active ? (tk.isDark ? `linear-gradient(90deg,${tk.pinkLight},${tk.blueLight})` : 'linear-gradient(90deg,#FFF0F5,#F0F7FD)') : 'transparent',
                borderLeft: active ? `3px solid ${pink}` : '3px solid transparent',
              }}>
              <Avatar p={c.profile} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.profile.display_name || c.profile.username}</span>
                  {c.isMatch && <span title="Match" style={{ fontSize: 11 }}>💑</span>}
                </div>
                <div style={{ fontSize: 11, color: MUT }}>
                  {c.lastAt ? `Dernier message · ${timeOf(c.lastAt)}` : 'Nouvelle conversation'}
                </div>
              </div>
              {c.unread > 0 && (
                <div style={{ background: pink, color: 'white', fontSize: 11, fontWeight: 800, borderRadius: 10, padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{c.unread}</div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Membres bloqués ── */}
      <div style={{ borderTop: `1.5px solid ${BDR}`, padding: '8px 12px', flexShrink: 0 }}>
        <button onClick={() => setShowBlocked(v => !v)}
          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 4px', fontFamily: font, fontSize: 12, fontWeight: 800, color: MUT }}>
          <span>🚫 Bloqués ({blocked.length})</span>
          <span style={{ fontSize: 10 }}>{showBlocked ? '▲' : '▼'}</span>
        </button>
        {showBlocked && (
          blocked.length === 0
            ? <div style={{ fontSize: 12, color: MUT, padding: '4px 4px 8px' }}>Tu n&apos;as bloqué personne.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 6, maxHeight: 220, overflowY: 'auto' }}>
                {blocked.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar p={p} size={30} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name || p.username}</span>
                    <button onClick={() => unblock(p)} style={headerBtn(green)}>✅ Débloquer</button>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  )

  // ── Conversation ──
  const conversation = selectedProfile ? (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, minWidth: 0, animation: wizzShake ? 'wizz 0.5s ease' : 'none' }}>
      <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderBottom: `1.5px solid ${BDR}`, background: SURF, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {isMobile && (
          <button onClick={() => setSelectedId(null)} aria-label="Retour aux conversations"
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${BDR}`, background: 'transparent', color: TXT, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>‹</button>
        )}
        <Avatar p={selectedProfile} size={isMobile ? 36 : 40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: TXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedProfile.display_name || selectedProfile.username}</div>
          <div style={{ fontSize: 12, color: selectedProfile.is_online ? green : MUT, fontWeight: 600 }}>
            {selectedBlocked ? 'Bloqué·e' : selectedProfile.is_online ? 'En ligne' : 'Hors ligne'}
          </div>
        </div>

        {/* Actions — le bouton Bloquer / Débloquer est toujours visible */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!selectedBlocked && canWrite.ok && (
            <button onClick={sendWizz} title="Envoyer un Wizz" style={headerBtn(blue)}>⚡{isMobile ? '' : ' Wizz'}</button>
          )}
          {!selectedBlocked && (
            <button onClick={() => setReportOpen(v => !v)} title="Signaler" style={headerBtn(tk.isDark ? '#E8B06A' : '#B87A2A')}>🚩{isMobile ? '' : ' Signaler'}</button>
          )}
          {selectedBlocked
            ? <button onClick={() => unblock(selectedBlocked)} style={headerBtn(green)}>✅ Débloquer</button>
            : <button onClick={() => setConfirmBlock(true)} style={headerBtn(pink)}>🚫 Bloquer</button>}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: isMobile ? 12 : '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, background: BG }}>
        {confirmBlock && selected && (
          <div className="animate-slide-up" style={{ background: SURF, border: `1.5px solid ${pink}44`, borderRadius: 18, padding: 18, margin: '0 auto', maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: TXT, marginBottom: 6 }}>🚫 Bloquer {selected.profile.display_name} ?</div>
            <div style={{ fontSize: 12, color: MUT, lineHeight: 1.6, marginBottom: 14 }}>Ce membre ne pourra plus t&apos;écrire ni te voir dans Découvrir. Tu pourras le débloquer à tout moment (liste « Bloqués »).</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmBlock(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1.5px solid ${BDR}`, background: 'transparent', color: MUT, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font }}>Annuler</button>
              <button onClick={() => block(selected.profile)} style={{ flex: 1, padding: 11, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,#E07A7A,${pink})`, color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: font }}>Bloquer</button>
            </div>
          </div>
        )}

        {reportOpen && (
          <div className="animate-slide-up" style={{ background: SURF, border: `1.5px solid ${pink}33`, borderRadius: 18, padding: 18, margin: '0 auto', maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: TXT, marginBottom: 10 }}>🚩 Signaler {selectedProfile.display_name}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {REPORT_REASONS.map(r => (
                <button key={r.id} onClick={() => setReportReason(r.id)}
                  style={{ padding: '7px 12px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font, border: `1.5px solid ${reportReason === r.id ? pink : BDR}`, background: reportReason === r.id ? `${pink}18` : 'transparent', color: reportReason === r.id ? pink : MUT }}>
                  {r.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setReportOpen(false)} style={{ flex: 1, padding: 11, borderRadius: 12, border: `1.5px solid ${BDR}`, background: 'transparent', color: MUT, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font }}>Annuler</button>
              <button onClick={sendReport} style={{ flex: 1, padding: 11, borderRadius: 12, border: 'none', background: `linear-gradient(135deg,#E8A06A,${pink})`, color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: font }}>Envoyer</button>
            </div>
          </div>
        )}

        {selectedBlocked ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: MUT, fontSize: 13, lineHeight: 1.6, maxWidth: 320 }}>
            Tu as bloqué {selectedBlocked.display_name}. Débloque ce membre pour reprendre la conversation.
          </div>
        ) : messages.length === 0 && !confirmBlock && !reportOpen ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: MUT, fontSize: 13 }}>Dis bonjour à {selectedProfile.display_name} 👋</div>
        ) : messages.map(msg => {
          const mine = msg.sender_id === user.id
          const isWizz = msg.message_type === 'wizz'
          return (
            <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: mine ? 'row-reverse' : 'row' }}>
              <div style={{ maxWidth: isMobile ? '80%' : 360, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: MUT, margin: '0 4px 3px', textAlign: mine ? 'right' : 'left' }}>{timeOf(msg.created_at)}</div>
                <div style={{
                  padding: '9px 14px', wordBreak: 'break-word',
                  borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: mine ? `linear-gradient(135deg,${pink},${blue})` : isWizz ? `${blue}22` : SURF,
                  color: mine ? 'white' : TXT, fontSize: 14, lineHeight: 1.5,
                  border: mine ? 'none' : `1.5px solid ${BDR}`,
                }}>
                  {msg.content}
                  {extractMusicUrl(msg.content) && <MusicCard url={extractMusicUrl(msg.content)!} compact />}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {!selectedBlocked && (
        <div style={{ borderTop: `1.5px solid ${BDR}`, background: SURF, flexShrink: 0 }}>
          {warning && (
            <div style={{ margin: '10px 12px 0', padding: '10px 14px', background: tk.modBg, color: tk.modText, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>{warning}</div>
          )}
          {showEmojis && canWrite.ok && (
            <div className="vz-scroll-x" style={{ padding: '8px 12px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => sendMsg(e, 'emoji')} style={{ fontSize: 22, background: 'transparent', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>{e}</button>
              ))}
            </div>
          )}
          {canWrite.ok ? (
            <div style={{ padding: isMobile ? '10px' : '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowEmojis(v => !v)} aria-label="Émojis"
                style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${BDR}`, background: showEmojis ? tk.pinkLight : 'transparent', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>😊</button>
              <input
                style={{ flex: 1, minWidth: 0, padding: '11px 16px', border: `1.5px solid ${BDR}`, borderRadius: 24, fontSize: 14, fontFamily: font, outline: 'none', background: BG, color: TXT }}
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()}
                placeholder={`Écrire à ${selectedProfile.display_name}…`} maxLength={2000} enterKeyHint="send"
              />
              <button onClick={() => sendMsg()} aria-label="Envoyer" style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: `linear-gradient(135deg,${pink},${blue})`, color: 'white', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>➤</button>
            </div>
          ) : (
            <div style={{ padding: '14px 16px', fontSize: 13, color: MUT, textAlign: 'center' }}>{canWrite.why}</div>
          )}
        </div>
      )}
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: MUT, fontSize: 14, padding: 24, textAlign: 'center' }}>
      Sélectionne une conversation 💬
    </div>
  )

  return (
    <div style={{ height: 'var(--vz-app-h, calc(100vh - 60px))', background: BG, fontFamily: font, position: 'relative', overflow: 'hidden',
      display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? undefined : '280px 1fr' }}>
      {isMobile ? (selectedProfile ? conversation : list) : <>{list}{conversation}</>}
      {notice && (
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 'max-content', maxWidth: 'calc(100% - 24px)', padding: '10px 16px', borderRadius: 12, background: TXT, color: SURF, fontSize: 13, fontWeight: 700, zIndex: 50 }}>
          {notice}
        </div>
      )}
    </div>
  )
}
