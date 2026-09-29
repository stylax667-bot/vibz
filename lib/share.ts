// Partage : textes, liens et adresses de chaque réseau, au format que chacun attend.
// Chaque lien porte ?ref= (invitation → six degrés) et utm_* (savoir quel réseau fait venir du monde).
import { SITE_URL } from './site'
import { CATALOG_BY_ID } from './musicCatalog'

export type ShareKind = 'app' | 'profile' | 'collab' | 'member' | 'match' | 'mix' | 'badge'

export type ShareContext =
  | { type: 'app' }
  | { type: 'profile'; userId: string; name: string; instruments: string[]; city: string }
  | { type: 'collab'; userId: string; name: string; instrument: string; genre: string; city: string }
  | { type: 'member'; memberId: string; name: string; instrument: string; city: string }
  | { type: 'match' }
  | { type: 'mix'; tags: string[] }
  | { type: 'badge'; badge: string; icon: string; name: string; reach: number }

export type Platform = {
  id: string
  name: string
  color: string
  icon: string                 // chemin d'icône (public/share) ou emoji
  mobileOnly?: boolean
  desktopOnly?: boolean
  mode: 'link' | 'image' | 'copy'
  build?: (s: SharePayload) => string
  hint?: string
}

export type SharePayload = { text: string; url: string; title: string; image: string; hashtags: string[] }

// ── Liens ──────────────────────────────────────────────────────────────
const ref8 = (id?: string | null) => (id ? id.slice(0, 8) : '')

export function withTracking(path: string, opts: { ref?: string | null; source: string; campaign: ShareKind }) {
  const u = new URL(path, SITE_URL)
  if (opts.ref) u.searchParams.set('ref', ref8(opts.ref))
  u.searchParams.set('utm_source', opts.source)
  u.searchParams.set('utm_medium', 'partage')
  u.searchParams.set('utm_campaign', opts.campaign)
  return u.toString()
}

const label = (id: string) => CATALOG_BY_ID[id]?.label || id
const hashtag = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '')

// Page cible et image d'aperçu de chaque contexte
function target(ctx: ShareContext): { path: string; image: string } {
  const og = (q: Record<string, string>) => `${SITE_URL}/api/og?${new URLSearchParams(q)}`
  switch (ctx.type) {
    case 'profile': return { path: `/profil/${ctx.userId}`, image: og({ t: 'profile', id: ctx.userId }) }
    case 'collab':  return { path: `/profil/${ctx.userId}?v=collab`, image: og({ t: 'collab', id: ctx.userId }) }
    case 'member':  return { path: `/profil/${ctx.memberId}`, image: og({ t: 'profile', id: ctx.memberId }) }
    case 'mix':     return { path: `/mix/${ctx.tags.join('+')}`, image: og({ t: 'mix', tags: ctx.tags.join('+') }) }
    case 'badge':   return { path: '/', image: og({ t: 'badge', b: ctx.badge, n: String(ctx.reach) }) }
    case 'match':   return { path: '/', image: og({ t: 'match' }) }
    default:        return { path: '/', image: og({ t: 'app' }) }
  }
}

// Texte : chaleureux, court, jamais le nom d'un match (vie privée)
function message(ctx: ShareContext): { text: string; title: string; tags: string[] } {
  switch (ctx.type) {
    case 'profile': {
      const bits = [ctx.instruments.slice(0, 2).join(' & '), ctx.city].filter(Boolean).join(' à ')
      return { title: `${ctx.name} sur Vibz`, text: `Mon profil de musicien·ne sur Vibz${bits ? ` : ${bits}` : ''}. Passe me dire bonjour 🦋`, tags: ctx.instruments }
    }
    case 'collab':
      return {
        title: `${ctx.name} cherche des musiciens`,
        text: `Je joue ${ctx.instrument || 'de la musique'} et je cherche des gens pour jouer${ctx.genre ? ` du ${ctx.genre}` : ''}${ctx.city ? ` à ${ctx.city}` : ''}. Ça te dit ? 🎶`,
        tags: [ctx.instrument, ctx.genre].filter(Boolean),
      }
    case 'member':
      return {
        title: `${ctx.name} sur Vibz`,
        text: `Tu connais ${ctx.name} ? ${[ctx.instrument, ctx.city].filter(Boolean).join(' à ')} — je pense que vous devriez jouer ensemble 🎸`,
        tags: [ctx.instrument].filter(Boolean),
      }
    case 'match':
      return { title: 'Un match musical sur Vibz', text: `Nouveau match musical sur Vibz 💘 Et toi, qui vibre comme toi ?`, tags: [] }
    case 'mix': {
      const l = ctx.tags.map(label)
      return { title: `Mélange ${l.join(' × ')}`, text: `Mon mélange du moment sur Vibz : ${l.join(' × ')} 🎛️ Qui en est ?`, tags: l }
    }
    case 'badge':
      return { title: `Badge ${ctx.name}`, text: `${ctx.icon} Badge « ${ctx.name} » débloqué sur Vibz : mon réseau touche ${ctx.reach} musicien${ctx.reach > 1 ? 's' : ''}. On relie tout le monde en 6 poignées de main ?`, tags: [] }
    default:
      return { title: 'Vibz', text: `Je suis sur Vibz, l'appli pour rencontrer des musiciens et musiciennes près de chez soi. Viens jammer 🎶`, tags: [] }
  }
}

export function payload(ctx: ShareContext, me: string | null | undefined, source: string): SharePayload {
  const t = target(ctx)
  const m = message(ctx)
  return {
    text: m.text,
    title: m.title,
    url: withTracking(t.path, { ref: me, source, campaign: ctx.type }),
    image: t.image,
    hashtags: ['Vibz', 'musiciens', ...m.tags.map(hashtag)].filter((h, i, a) => h && a.indexOf(h) === i).slice(0, 4),
  }
}

// Tronque proprement en conservant la place du lien
function fit(text: string, max: number) {
  if (text.length <= max) return text
  return text.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, '') + '…'
}

const e = encodeURIComponent

// ── Réseaux (formats officiels de partage web) ─────────────────────────
export const PLATFORMS: Platform[] = [
  { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', icon: '💬', mode: 'link',
    build: s => `https://wa.me/?text=${e(`${s.text}\n${s.url}`)}` },
  { id: 'sms', name: 'SMS', color: '#34C759', icon: '✉️', mode: 'link', mobileOnly: true,
    build: s => `sms:?&body=${e(`${s.text} ${s.url}`)}` },
  { id: 'messenger', name: 'Messenger', color: '#0084FF', icon: '⚡', mode: 'link', mobileOnly: true,
    build: s => `fb-messenger://share/?link=${e(s.url)}` },
  { id: 'telegram', name: 'Telegram', color: '#229ED9', icon: '✈️', mode: 'link',
    build: s => `https://t.me/share/url?url=${e(s.url)}&text=${e(s.text)}` },
  { id: 'instagram', name: 'Instagram', color: '#E1306C', icon: '📸', mode: 'image',
    hint: 'Image pour ta story + lien copié à coller dans le sticker « Lien »' },
  { id: 'tiktok', name: 'TikTok', color: '#FE2C55', icon: '🎵', mode: 'image',
    hint: 'Image à publier + lien copié pour ta description ou ta bio' },
  { id: 'snapchat', name: 'Snapchat', color: '#FFFC00', icon: '👻', mode: 'image',
    hint: 'Image à envoyer + lien copié à ajouter avec le trombone' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'f', mode: 'link',
    build: s => `https://www.facebook.com/sharer/sharer.php?u=${e(s.url)}` },
  { id: 'x', name: 'X', color: '#111111', icon: '𝕏', mode: 'link',
    // 280 caractères ; un lien compte pour 23, chaque hashtag pour sa longueur + 2
    build: s => {
      const tags = s.hashtags.slice(0, 2)
      const room = 280 - 24 - tags.reduce((n, h) => n + h.length + 2, 0)
      return `https://x.com/intent/post?text=${e(fit(s.text, room))}&url=${e(s.url)}&hashtags=${e(tags.join(','))}`
    } },
  { id: 'bluesky', name: 'Bluesky', color: '#1185FE', icon: '🦋', mode: 'link',
    build: s => `https://bsky.app/intent/compose?text=${e(`${fit(s.text, 300 - s.url.length - 1)} ${s.url}`)}` },
  { id: 'threads', name: 'Threads', color: '#101010', icon: '@', mode: 'link',
    build: s => `https://www.threads.net/intent/post?text=${e(`${fit(s.text, 500 - s.url.length - 1)} ${s.url}`)}` },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: 'in', mode: 'link',
    build: s => `https://www.linkedin.com/sharing/share-offsite/?url=${e(s.url)}` },
  { id: 'reddit', name: 'Reddit', color: '#FF4500', icon: '👽', mode: 'link',
    build: s => `https://www.reddit.com/submit?url=${e(s.url)}&title=${e(fit(s.title + ' — ' + s.text, 300))}` },
  { id: 'pinterest', name: 'Pinterest', color: '#E60023', icon: '📌', mode: 'link',
    build: s => `https://www.pinterest.com/pin/create/button/?url=${e(s.url)}&media=${e(s.image)}&description=${e(fit(s.text, 500))}` },
  { id: 'discord', name: 'Discord', color: '#5865F2', icon: '🎮', mode: 'copy',
    hint: 'Message copié : colle-le dans ton serveur, l’aperçu s’affiche tout seul' },
  { id: 'email', name: 'Email', color: '#6B7A9A', icon: '📧', mode: 'link',
    build: s => `mailto:?subject=${e(s.title)}&body=${e(`${s.text}\n\n${s.url}`)}` },
]

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))
}

// Récupère l'image d'aperçu en format story (1080×1920) pour Instagram / TikTok / Snapchat
export async function storyFile(s: SharePayload): Promise<File | null> {
  try {
    const u = new URL(s.image)
    u.searchParams.set('format', 'story')
    const blob = await (await fetch(u.toString())).blob()
    return new File([blob], 'vibz-story.png', { type: 'image/png' })
  } catch { return null }
}

export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch { return false }
}

// ── Mélange reçu par lien (/?mix=jazz+batt) : gardé jusqu'à la connexion, puis ouvert ──
const MIX_KEY = 'vibz_mix'

export function rememberMix() {
  try {
    const raw = new URLSearchParams(window.location.search).get('mix')
    const tags = (raw || '').split(/[+ ,]/).filter(id => CATALOG_BY_ID[id]).slice(0, 6)
    if (tags.length) sessionStorage.setItem(MIX_KEY, tags.join('+'))
  } catch { /* stockage indisponible */ }
}

export function takeStoredMix(): string[] | null {
  try {
    const v = sessionStorage.getItem(MIX_KEY)
    if (!v) return null
    sessionStorage.removeItem(MIX_KEY)
    return v.split('+')
  } catch { return null }
}
