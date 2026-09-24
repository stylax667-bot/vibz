// Avatars carrés — règles partagées entre le navigateur et l'API /api/avatar.
import { INSTRUMENTS, matchTerms, norm } from './musicCatalog'

// Image choisie par le membre (avant recadrage)
export const AVATAR_MAX_FILE_MB   = 10
export const AVATAR_MIN_SIDE      = 128    // px, largeur et hauteur minimales
export const AVATAR_MAX_SIDE      = 8000   // px, au-delà le navigateur peine à recadrer
export const AVATAR_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Image envoyée au serveur (après recadrage) : un petit carré JPEG
export const AVATAR_OUTPUT_SIDE   = 256
export const AVATAR_MAX_UPLOAD_KB = 300

// Durée pendant laquelle l'avatar reste fixé après une image explicite
export const AVATAR_LOCK_MONTHS = 6

// Événement navigateur émis quand l'avatar du membre connecté change
export const AVATAR_EVENT = 'vibz:avatar'

export type AvatarFields = {
  avatar_url?: string | null
  avatar_emoji?: string | null
  avatar_locked_until?: string | null
  instruments?: string[] | null
}

export function isAvatarLocked(p: AvatarFields | null | undefined): boolean {
  return !!p?.avatar_locked_until && new Date(p.avatar_locked_until).getTime() > Date.now()
}

// Emoji d'instrument qui représente le mieux le parcours du membre :
// son premier instrument reconnu dans le catalogue, sinon une note.
export function instrumentEmoji(instruments?: string[] | null): string {
  for (const raw of instruments || []) {
    const v = norm(raw)
    if (!v) continue
    const hit = INSTRUMENTS.find(i => norm(i.label) === v || matchTerms(i).some(t => v.includes(t) || t.includes(v)))
    if (hit) return hit.emoji
  }
  return '🎵'
}

export const formatBytes = (n: number) =>
  n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} Ko` : `${(n / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`

export const formatLockDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
