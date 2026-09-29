// Présence des membres : 🟢 en ligne, 🟠 ne pas déranger, 🔴 hors ligne.
// Un signe de vie part chaque minute tant que Vibz est ouvert (migration 20261003_presence.sql).
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Presence = 'online' | 'dnd' | 'offline'
export type PresenceMode = 'auto' | 'dnd'

export type PresenceFields = {
  last_seen?: string | null
  is_online?: boolean | null
  presence_mode?: string | null
}

const ONLINE_WINDOW_MS = 3 * 60 * 1000
const PING_MS = 60 * 1000

export const PRESENCE_COLOR: Record<Presence, string> = {
  online:  '#22C55E',
  dnd:     '#F59E0B',
  offline: '#EF4444',
}

export const PRESENCE_LABEL: Record<Presence, string> = {
  online:  'En ligne',
  dnd:     'Ne pas déranger',
  offline: 'Hors ligne',
}

export function presenceOf(p: PresenceFields | null | undefined): Presence {
  if (!p) return 'offline'
  const recent = !!p.last_seen && Date.now() - new Date(p.last_seen).getTime() < ONLINE_WINDOW_MS
  if (!recent || p.is_online === false) return 'offline'
  return p.presence_mode === 'dnd' ? 'dnd' : 'online'
}

export const isReachable = (p: PresenceFields | null | undefined) => presenceOf(p) !== 'offline'

export const setPresenceMode = (mode: PresenceMode) => supabase.rpc('set_presence_mode', { p_mode: mode })

// Signe de vie du membre connecté : chaque minute quand l'onglet est visible,
// « hors ligne » quand il est caché longtemps ou fermé.
export function usePresenceHeartbeat(userId: string) {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const ping = (online = true) => { supabase.rpc('presence_ping', { p_online: online }).then(() => {}) }
    const start = () => { ping(); if (!timer) timer = setInterval(() => ping(), PING_MS) }
    const stop = () => { if (timer) { clearInterval(timer); timer = null } }
    const onVisibility = () => { if (document.visibilityState === 'visible') start(); else stop() }
    const onLeave = () => ping(false)

    start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onLeave)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onLeave)
    }
  }, [userId])
}

// Présence fraîche d'une liste de membres, relue chaque minute
export function usePresenceMap(ids: string[]) {
  const [map, setMap] = useState<Map<string, PresenceFields>>(new Map())
  const key = Array.from(new Set(ids)).sort().join(',')
  useEffect(() => {
    if (!key) return
    let alive = true
    const load = async () => {
      const { data } = await supabase.from('profiles').select('id, last_seen, is_online, presence_mode').in('id', key.split(','))
      if (alive && data) setMap(new Map(data.map(r => [r.id as string, r as PresenceFields])))
    }
    load()
    const timer = setInterval(load, PING_MS)
    return () => { alive = false; clearInterval(timer) }
  }, [key])
  return map
}

// Fusionne la présence fraîche dans un profil
export function withPresence<T extends { id: string }>(p: T, map: Map<string, PresenceFields>): T {
  const f = map.get(p.id)
  return f ? { ...p, ...f } : p
}
