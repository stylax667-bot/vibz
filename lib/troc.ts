// Onglet Troc de Vibz = succursale de TrocMusic (site de troc / don / revente de matériel).
// Même base Supabase : les annonces sont celles de TrocMusic (table troc_listings),
// les comptes sont les mêmes. Tous les liens vers TrocMusic passent par ici.
import { supabase } from './supabase'

export const TROC_URL = (process.env.NEXT_PUBLIC_TROC_URL || 'https://www.trocmusic.fr').replace(/\/$/, '')

const tag = (path: string) => `${TROC_URL}${path}${path.includes('?') ? '&' : '?'}from=vibz`
export const trocLinks = {
  home: () => tag('/'),
  listing: (id: string) => tag(`/annonce/${id}`),
  deposer: () => tag('/deposer'),
  mine: () => tag('/mes-annonces'),
  search: (q: string) => tag(`/?q=${encodeURIComponent(q)}`),
}

// ── Données ───────────────────────────────────────────────────────────
export type TrocKind = 'troc' | 'echange' | 'don' | 'vente'
export type TrocListing = {
  id: string; seller_id: string; kind: TrocKind; category: string; title: string; description: string
  wanted: string | null; price_cents: number | null; condition: string; brand: string | null; city: string | null
  photos: string[]; status: 'active' | 'reserve' | 'termine'; source: 'trocmusic' | 'vibz'; created_at: string
  seller?: { id: string; display_name: string | null; username: string | null; avatar_url: string | null; avatar_emoji: string | null } | null
}
export const TROC_SELECT =
  '*, seller:profiles!troc_listings_seller_id_fkey(id, display_name, username, avatar_url, avatar_emoji)'

export const TROC_KINDS: { id: TrocKind; label: string; icon: string }[] = [
  { id: 'troc', label: 'Troc', icon: '🔁' }, { id: 'echange', label: 'Échange', icon: '🤝' },
  { id: 'don', label: 'Don', icon: '🎁' },   { id: 'vente', label: 'Vente', icon: '💶' },
]
export const TROC_CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'guitares', label: 'Guitares', icon: '🎸' }, { id: 'basses', label: 'Basses', icon: '🎸' },
  { id: 'claviers', label: 'Claviers', icon: '🎹' }, { id: 'batteries', label: 'Batteries', icon: '🥁' },
  { id: 'vents', label: 'Vents', icon: '🎷' },        { id: 'cordes', label: 'Cordes', icon: '🎻' },
  { id: 'amplis', label: 'Amplis', icon: '🔊' },      { id: 'effets', label: 'Effets', icon: '🎛️' },
  { id: 'sono', label: 'Sono', icon: '📢' },          { id: 'studio', label: 'Studio', icon: '🎙️' },
  { id: 'djing', label: 'DJ', icon: '💿' },           { id: 'accessoires', label: 'Accessoires', icon: '🧰' },
  { id: 'autre', label: 'Autre', icon: '📦' },
]
export const trocKind = (k: string) => TROC_KINDS.find(x => x.id === k) || TROC_KINDS[0]
export const trocCategory = (c: string) => TROC_CATEGORIES.find(x => x.id === c) || TROC_CATEGORIES[TROC_CATEGORIES.length - 1]

export function trocPrice(l: Pick<TrocListing, 'kind' | 'price_cents'>) {
  if (l.kind === 'don') return 'Gratuit'
  if (l.price_cents == null) return l.kind === 'troc' ? 'À troquer' : 'À échanger'
  const e = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: l.price_cents % 100 ? 2 : 0 }).format(l.price_cents / 100)
  return l.kind === 'vente' ? e : `${e} ou échange`
}

export function trocError(msg: string) {
  if (msg.includes('TROC_BLOQUE')) return `VibzGuard a refusé l’annonce : ${msg.split('TROC_BLOQUE:')[1]?.trim() || 'contenu non autorisé'}.`
  if (msg.includes('TROC_FLOOD')) return '10 annonces par jour maximum : réessaie demain.'
  if (msg.includes('TROC_BANNI')) return 'Ton compte est suspendu.'
  if (msg.includes('PHOTO_FLOOD')) return '20 photos par heure maximum.'
  if (msg.includes('VIBZGUARD_BLOCK')) return `🛡️ VibzGuard | ${msg.split('VIBZGUARD_BLOCK:')[1]?.trim() || 'légende refusée'}`
  if (/troc_listings|photo_shares|chat-photos|troc-photos|Bucket not found|schema cache/.test(msg)) return 'Le Troc n’est pas encore installé sur le serveur (migrations Supabase à passer).'
  return msg
}

// ── Liens entrants depuis TrocMusic : ?tab=troc|messenger &chat=<membre> &troc=<annonce> ──
// Gardés en sessionStorage pour survivre à la connexion, puis retirés de l'adresse.
export type TrocIntent = { tab?: string; chat?: string; troc?: string }
const INTENT_KEY = 'vibz_troc_intent'
const UUID = /^[0-9a-f-]{36}$/i

/** Mémorise l'intention ; renvoie l'adresse nettoyée à remettre via le routeur (null si rien à faire) */
export function rememberTrocIntent(): string | null {
  if (typeof window === 'undefined') return null
  const q = new URLSearchParams(window.location.search)
  const intent: TrocIntent = {}
  const tab = q.get('tab')
  if (tab && ['troc', 'messenger', 'salons', 'discover', 'profile'].includes(tab)) intent.tab = tab
  if (UUID.test(q.get('chat') || '')) intent.chat = q.get('chat')!
  if (UUID.test(q.get('troc') || '')) intent.troc = q.get('troc')!
  if (!Object.keys(intent).length) return null
  try { sessionStorage.setItem(INTENT_KEY, JSON.stringify(intent)) } catch {}
  ;['tab', 'chat', 'troc', 'from'].forEach(k => q.delete(k))
  const rest = q.toString()
  return window.location.pathname + (rest ? `?${rest}` : '')
}

export function takeTrocIntent(): TrocIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY)
    if (!raw) return null
    sessionStorage.removeItem(INTENT_KEY)
    return JSON.parse(raw)
  } catch { return null }
}

// ── Photos ────────────────────────────────────────────────────────────
/** 1600 px max, JPEG ~80 % ; retire les métadonnées EXIF (position GPS) */
export async function compressPhoto(file: Blob, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Image illisible'))), 'image/jpeg', 0.8))
}

const fileName = (uid: string) => `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`

/** Photo d'annonce (bucket public troc-photos, partagé avec TrocMusic) */
export async function uploadTrocPhoto(uid: string, file: Blob): Promise<string> {
  const path = fileName(uid)
  const { error } = await supabase.storage.from('troc-photos').upload(path, await compressPhoto(file), { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw new Error(trocError(error.message))
  return supabase.storage.from('troc-photos').getPublicUrl(path).data.publicUrl
}

// ── Photos partagées dans un tchat / salon (bucket privé + consentement) ──
export type PhotoShare = {
  id: string; sender_id: string; conversation_id: string | null; salon_id: string | null
  path: string; caption: string | null; is_troc: boolean; listing_id: string | null; created_at: string
}
export type PhotoConsent = { share_id: string; user_id: string; decision: 'accepted' | 'declined' }

export async function sharePhoto(uid: string, file: Blob, where: { conversation_id?: string; salon_id?: string }, caption: string, isTroc: boolean) {
  const path = fileName(uid)
  const up = await supabase.storage.from('chat-photos').upload(path, await compressPhoto(file), { contentType: 'image/jpeg' })
  if (up.error) throw new Error(trocError(up.error.message))
  const { data, error } = await supabase.from('photo_shares')
    .insert({ sender_id: uid, path, caption: caption.trim() || null, is_troc: isTroc, ...where }).select('*').single()
  if (error) {
    await supabase.storage.from('chat-photos').remove([path])
    throw new Error(trocError(error.message))
  }
  return data as PhotoShare
}

export async function decidePhoto(shareId: string, uid: string, decision: 'accepted' | 'declined') {
  const { error } = await supabase.from('photo_share_consents')
    .upsert({ share_id: shareId, user_id: uid, decision, decided_at: new Date().toISOString() })
  if (error) throw new Error(trocError(error.message))
}

/** Adresse temporaire (1 h) : seulement si je suis l'auteur ou si j'ai accepté */
export async function photoUrl(path: string) {
  const { data } = await supabase.storage.from('chat-photos').createSignedUrl(path, 3600)
  return data?.signedUrl || null
}

export async function removeShare(s: PhotoShare) {
  await supabase.from('photo_shares').delete().eq('id', s.id)
  await supabase.storage.from('chat-photos').remove([s.path])
}

/** L'auteur transforme sa photo privée en photo d'annonce publique */
export async function shareToTrocPhoto(uid: string, s: PhotoShare) {
  const { data, error } = await supabase.storage.from('chat-photos').download(s.path)
  if (error || !data) throw new Error('Photo introuvable.')
  return uploadTrocPhoto(uid, data)
}

// Ouvre l'onglet Troc avec un brouillon d'annonce (depuis une photo partagée)
export const TROC_DRAFT_EVENT = 'vibz:troc-draft'
export type TrocDraft = { photos: string[]; title?: string; shareId?: string }

/** Depuis une photo partagée : copie publique puis ouverture du formulaire de l'onglet Troc */
export async function openShareAsTrocDraft(uid: string, s: PhotoShare) {
  const url = await shareToTrocPhoto(uid, s)
  window.dispatchEvent(new CustomEvent<TrocDraft>(TROC_DRAFT_EVENT, { detail: { photos: [url], title: s.caption || '', shareId: s.id } }))
}
