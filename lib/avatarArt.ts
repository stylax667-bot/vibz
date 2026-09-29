// Avatar illustré pour les membres sans photo : un vinyle aux couleurs de leurs styles,
// l'instrument au centre (images Twemoji hébergées dans public/twemoji, licence CC-BY 4.0).
import { STYLES, INSTRUMENTS, matchTerms, norm, type CatalogItem } from './musicCatalog'
import { instrumentEmoji } from './avatar'

export type ArtFields = {
  display_name?: string | null
  username?: string | null
  instruments?: string[] | null
  music_genres?: string[] | null
  avatar_emoji?: string | null
}

export type Art = { bg1: string; bg2: string; label: string; emoji: string; icon: string; angle: number }

const PALETTE = ['#E8395A', '#6BB8E8', '#A78BDB', '#52C07A', '#FF8F00', '#E91E63', '#00ACC1', '#7C4DFF', '#8BC34A', '#F06292']

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function firstMatch(values: string[] | null | undefined, pool: CatalogItem[]): CatalogItem[] {
  const out: CatalogItem[] = []
  for (const raw of values || []) {
    const v = norm(raw)
    const hit = pool.find(i => matchTerms(i).some(t => v.includes(t)))
    if (hit && !out.includes(hit)) out.push(hit)
  }
  return out
}

// Fichier Twemoji d'un emoji : points de code en hexadécimal, sans le sélecteur de variante
export function twemojiSrc(emoji: string) {
  const cp = Array.from(emoji).map(c => c.codePointAt(0)!.toString(16)).filter(h => h !== 'fe0f').join('-')
  return `/twemoji/${cp}.svg`
}

export function artFor(p: ArtFields | null | undefined): Art {
  const seed = hash(p?.display_name || p?.username || '?')
  const styles = firstMatch(p?.music_genres, STYLES)
  const inst = firstMatch(p?.instruments, INSTRUMENTS)[0]
  const bg1 = styles[0]?.color || PALETTE[seed % PALETTE.length]
  const bg2 = styles[1]?.color || PALETTE[(seed >>> 4) % PALETTE.length]
  const emoji = p?.avatar_emoji || instrumentEmoji(p?.instruments)
  return {
    bg1, bg2: bg2 === bg1 ? PALETTE[(seed >>> 8) % PALETTE.length] : bg2,
    label: inst?.color || '#F9F8F7',
    emoji,
    icon: twemojiSrc(emoji),
    angle: seed % 360,
  }
}
