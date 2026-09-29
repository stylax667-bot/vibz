// Affinité musicale entre membres, calculée côté base à partir de l'historique des
// mélanges (vinyle, salons, likes) — migration 20261002_affinites_melanges.sql.
import { supabase } from './supabase'
import { CATALOG_BY_ID } from './musicCatalog'

export type Affinity = {
  target: string
  score: number              // 0–100
  shared_styles: string[]    // styles que nous aimons tous les deux
  they_play: string[]        // instruments qu'il/elle joue et que je mélange sans les jouer
  i_play: string[]           // instruments que je joue et qu'il/elle mélange sans les jouer
  shared_pair: string[]      // un mélange que nous faisons tous les deux
}

export async function fetchAffinity(ids: string[]): Promise<Map<string, Affinity>> {
  if (ids.length === 0) return new Map()
  const { data } = await supabase.rpc('mix_affinity', { p_targets: ids })
  return new Map(((data as Affinity[] | null) || []).map(a => [a.target, a]))
}

// Mélange essayé sur le vinyle (le serveur ignore les doublons et limite la cadence)
export function logMix(tags: string[]) {
  if (tags.length === 0) return
  supabase.rpc('log_mix', { p_tags: tags }).then(() => {})
}

const label = (id: string) => CATALOG_BY_ID[id]?.label || id

// Raison la plus parlante, en quelques mots
export function affinityReason(a: Affinity): string | null {
  if (a.they_play.length) return `joue ${label(a.they_play[0])}, que tu mélanges souvent`
  if (a.shared_pair.length === 2) return `vous mélangez tous les deux ${label(a.shared_pair[0])} × ${label(a.shared_pair[1])}`
  if (a.i_play.length) return `cherche ${label(a.i_play[0])}, ce que tu joues`
  if (a.shared_styles.length) return `${a.shared_styles.slice(0, 2).map(label).join(' · ')} en commun`
  return null
}
