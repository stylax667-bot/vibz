import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { CATALOG_BY_ID } from './musicCatalog'

// Règles des salons (appliquées côté base par la migration 20260925)
export const SALON_BASE_MAX   = 16   // membres
export const SALON_EXTEND_MAX = 24   // après votes d'agrandissement (+4 par vote)
export const SALON_ADMIN_CHECK_MIN = 45
export const SALON_IDLE_CLOSE_MIN  = 15

// Ligne renvoyée par salon_list() : uniquement de vraies données
export type SalonInfo = {
  id: string
  name: string
  icon: string | null
  color: string | null
  tags: string[]
  parent_id: string | null
  is_locked: boolean
  created_at: string
  admin_name: string | null
  member_count: number
  online_count: number
  max_members: number
  is_member: boolean
  request_pending: boolean
  last_message_at: string | null
}

export type SalonMember = {
  user_id: string
  name: string
  avatar_url: string | null
  avatar_emoji: string | null
  online: boolean
  wants_private: boolean
  votes_extend: boolean
  is_admin: boolean
}

// Réponse de salon_ping() pour un membre
export type SalonState = {
  active: boolean
  is_member: boolean
  is_locked?: boolean
  request_pending?: boolean
  id?: string
  name?: string
  icon?: string
  color?: string
  tags?: string[]
  parent_id?: string | null
  is_admin?: boolean
  admin_id?: string
  max_members?: number
  member_count?: number
  votes_private?: number
  private_needed?: number
  votes_extend?: number
  extend_needed?: number
  extend_max?: number
  last_check_at?: string
  me?: { wants_private: boolean; votes_extend: boolean }
  members?: SalonMember[]
  requests?: { user_id: string; name: string; avatar_url: string | null; avatar_emoji: string | null }[]
}

export type AdminCheck = { id: string; name: string; icon: string | null; member_count: number }

// ── Ingrédients ──────────────────────────────────────────────────────────────
export const normTags = (ids: string[]) => Array.from(new Set(ids)).sort()
export const sameTags = (a: string[], b: string[]) => normTags(a).join('+') === normTags(b).join('+')

export function defaultSalonName(ids: string[]) {
  const labels = ids.map(id => CATALOG_BY_ID[id]?.label || id)
  return labels.length <= 3 ? labels.join(' × ') : `${labels.slice(0, 3).join(' × ')} +${labels.length - 3}`
}

export function salonColor(ids: string[]) {
  return CATALOG_BY_ID[ids[0]]?.color || '#A78BDB'
}

export function salonIcon(ids: string[]) {
  return ids.length === 1 ? CATALOG_BY_ID[ids[0]]?.emoji || '🎛️' : '🎛️'
}

export const tagLabels = (ids: string[]) => ids.map(t => CATALOG_BY_ID[t]).filter(Boolean).map(i => `${i.emoji} ${i.label}`)

// Salons correspondant à un mélange : même combinaison, ou ingrédients en commun
export function matchSalons(tags: string[], list: SalonInfo[]) {
  const want = new Set(tags)
  const scored = list.map(s => {
    const shared = s.tags.filter(t => want.has(t)).length
    const union = new Set([...s.tags, ...tags]).size
    return { s, shared, score: union ? shared / union : 0 }
  })
  const exact = scored.filter(x => sameTags(x.s.tags, tags)).map(x => x.s)
  const close = scored
    .filter(x => x.shared > 0 && !sameTags(x.s.tags, tags))
    .sort((a, b) => b.score - a.score || b.s.online_count - a.s.online_count)
    .map(x => x.s)
  return { exact, close }
}

// ── Descriptions concrètes (visibles dans la recherche) ──────────────────────
export function ago(iso: string | null) {
  if (!iso) return ''
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'à l’instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`
}

export function salonFacts(s: SalonInfo, parentName?: string) {
  const facts = [
    `${s.member_count}/${s.max_members} membre${s.member_count > 1 ? 's' : ''}`,
    s.online_count > 0 ? `${s.online_count} en ligne` : 'personne en ligne',
    `ouvert ${ago(s.created_at)}${s.admin_name ? ` · admin ${s.admin_name}` : ''}`,
    s.last_message_at ? `dernier message ${ago(s.last_message_at)}` : 'pas encore de message',
  ]
  if (s.is_locked) facts.push('🔒 privé : entrée sur demande')
  if (parentName) facts.push(`annexe de « ${parentName} »`)
  return facts
}

// ── Appels à la base ─────────────────────────────────────────────────────────
type CreateResult = { status: 'created' | 'exists'; salon_id: string; name: string }

export async function createSalon(tags: string[], opts: { name?: string; parentId?: string | null; isPrivate?: boolean } = {}) {
  const t = normTags(tags)
  const { data, error } = await supabase.rpc('create_salon', {
    p_tags: t,
    p_name: (opts.name || '').trim() || defaultSalonName(t),
    p_icon: salonIcon(t),
    p_color: salonColor(t),
    p_parent: opts.parentId || null,
    p_private: !!opts.isPrivate,
  })
  return { result: data as CreateResult | null, error }
}

export async function joinSalon(id: string) {
  const { data, error } = await supabase.rpc('join_salon', { p_id: id })
  return { status: (data as { status: 'joined' | 'requested' | 'full' | 'closed' } | null)?.status, error }
}

export const leaveSalon        = (id: string) => supabase.rpc('leave_salon', { p_id: id })
export const cancelJoinRequest = (id: string) => supabase.rpc('cancel_join_request', { p_id: id })
export const closeSalon        = (id: string) => supabase.rpc('close_salon', { p_id: id })
export const keepSalonAlive    = (id: string) => supabase.rpc('salon_keepalive', { p_id: id })
export const votePrivate       = (id: string, on: boolean) => supabase.rpc('salon_vote_private', { p_id: id, p_on: on })
export const lockSalon         = (id: string, keep: string[]) => supabase.rpc('salon_lock', { p_id: id, p_keep: keep })
export const unlockSalon       = (id: string) => supabase.rpc('salon_unlock', { p_id: id })
export const voteExtend        = (id: string, on: boolean) => supabase.rpc('salon_vote_extend', { p_id: id, p_on: on })
export const answerRequest     = (id: string, user: string, accept: boolean) =>
  supabase.rpc('salon_answer_request', { p_id: id, p_user: user, p_accept: accept })

export async function pingSalon(id: string) {
  const { data } = await supabase.rpc('salon_ping', { p_id: id })
  return data as SalonState | null
}

// ── Liste des salons ouverts (mise à jour en direct) ─────────────────────────
export function useSalonList(enabled = true) {
  const [salons, setSalons] = useState<SalonInfo[]>([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('salon_list')
    if (!error) setSalons((data as SalonInfo[]) || [])
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!enabled) return
    refresh()
    let timer: ReturnType<typeof setTimeout> | null = null
    const soon = () => { if (timer) clearTimeout(timer); timer = setTimeout(refresh, 400) }
    const ch = supabase.channel(`salon-list-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salons' }, soon)
      .subscribe()
    const every = setInterval(refresh, 45000)
    return () => { if (timer) clearTimeout(timer); clearInterval(every); supabase.removeChannel(ch) }
  }, [enabled, refresh])

  return { salons, loaded, refresh }
}

// ── Signe de vie global + rappel admin toutes les 45 min ─────────────────────
export function useSalonHeartbeat(userId: string | null) {
  const [checks, setChecks] = useState<AdminCheck[]>([])
  useEffect(() => {
    if (!userId) return
    let stop = false
    const beat = async () => {
      const { data } = await supabase.rpc('salon_heartbeat')
      if (!stop) setChecks((data as AdminCheck[]) || [])
    }
    beat()
    const t = setInterval(beat, 60000)
    return () => { stop = true; clearInterval(t) }
  }, [userId])
  const dismiss = (id: string) => setChecks(c => c.filter(x => x.id !== id))
  return { checks, dismiss }
}
