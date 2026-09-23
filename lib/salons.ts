import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { CATALOG_BY_ID } from './musicCatalog'

// Ligne de la table public.salons (colonnes ajoutées par la migration 20260923)
export type SalonRow = {
  id: string
  name: string
  slug: string
  icon: string | null
  combo_key: string | null
  tags: string[]
  is_official: boolean
  is_active: boolean
  color: string | null
  created_by: string | null
  created_at: string
}

// Une seule salle par combinaison : la clé ne dépend pas de l'ordre de sélection
export function comboKey(ids: string[]) {
  return 'mix-' + Array.from(new Set(ids)).sort().join('+')
}

export function defaultSalonName(ids: string[]) {
  const labels = ids.map(id => CATALOG_BY_ID[id]?.label || id)
  return labels.length <= 3 ? labels.join(' × ') : `${labels.slice(0, 3).join(' × ')} +${labels.length - 3}`
}

export function salonColor(ids: string[]) {
  return CATALOG_BY_ID[ids[0]]?.color || '#A78BDB'
}

// Crée le salon de cette combinaison, ou rejoint celui qui existe déjà
export async function openMixSalon(ids: string[], name?: string) {
  const uniq = Array.from(new Set(ids))
  const { data, error } = await supabase.rpc('open_salon', {
    p_key:   comboKey(uniq),
    p_name:  (name || '').trim() || defaultSalonName(uniq),
    p_icon:  uniq.length === 1 ? CATALOG_BY_ID[uniq[0]]?.emoji || '🎛️' : '🎛️',
    p_tags:  uniq,
    p_color: salonColor(uniq),
  })
  return { salon: data as SalonRow | null, error }
}

// Salon officiel du catalogue Vibz (créé en base à la première visite)
export async function openOfficialSalon(catId: string, name: string, icon: string, color: string) {
  const { data, error } = await supabase.rpc('open_salon', {
    p_key: `cat-${catId}`, p_name: name, p_icon: icon, p_tags: [], p_color: color,
  })
  return { salon: data as SalonRow | null, error }
}

export async function closeSalon(id: string) {
  return supabase.rpc('close_salon', { p_id: id })
}

// ── Présence temps réel ──────────────────────────────────────────────────────
// Chaque membre connecté annonce le salon qu'il regarde ; on compte les
// membres distincts par salon. Ce sont les seuls chiffres de participants
// affichés : aucune valeur inventée.
export function useSalonPresence(userId: string | null, currentSalonId: string | null) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const readyRef = useRef(false)
  const currentSalonRef = useRef(currentSalonId)

  useEffect(() => {
    if (!userId) return
    const ch = supabase.channel('vibz-salons-presence', { config: { presence: { key: userId } } })
    channelRef.current = ch
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState<{ salon_id: string | null }>()
      const next: Record<string, Set<string>> = {}
      Object.entries(state).forEach(([uid, metas]) => {
        metas.forEach(m => {
          if (!m.salon_id) return
          ;(next[m.salon_id] ||= new Set()).add(uid)
        })
      })
      setCounts(Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v.size])))
    }).subscribe(status => {
      if (status === 'SUBSCRIBED') {
        readyRef.current = true
        ch.track({ salon_id: currentSalonRef.current })
      }
    })
    return () => { readyRef.current = false; supabase.removeChannel(ch) }
  }, [userId])

  useEffect(() => {
    currentSalonRef.current = currentSalonId
    if (readyRef.current) channelRef.current?.track({ salon_id: currentSalonId })
  }, [currentSalonId])

  return counts
}
