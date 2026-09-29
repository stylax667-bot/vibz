// Six degrés de séparation : invitations + Connexions acceptées (jamais les matchs ni les messages).
// Le calcul se fait côté base (migration 20261001_six_degres.sql).
import { supabase } from './supabase'

export type Degree = { target: string; degree: number; via_id: string; via_name: string | null }

export type ChainStep = {
  step: number
  id: string
  display_name: string | null
  avatar_url: string | null
  avatar_emoji: string | null
  instruments: string[] | null
  link: 'invitation' | 'connexion' | null   // lien avec le maillon précédent
}

export type Reach = { par_degre: number[]; invitations: number; connexions: number; membres: number }

export type ConnectionRow = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
}

// État de la Connexion avec un membre, vu de mon côté
export type ConnState = 'none' | 'sent' | 'received' | 'connected'

export function connState(rows: ConnectionRow[], me: string, other: string): ConnState {
  const r = rows.find(c => (c.requester_id === me && c.addressee_id === other) || (c.requester_id === other && c.addressee_id === me))
  if (!r) return 'none'
  if (r.status === 'accepted') return 'connected'
  return r.requester_id === me ? 'sent' : 'received'
}

export function degreeLabel(d: number) {
  return d === 1 ? '1er degré' : `${d}e degré`
}

export async function fetchDegrees(ids: string[]): Promise<Map<string, Degree>> {
  if (ids.length === 0) return new Map()
  const { data } = await supabase.rpc('six_degres_for', { p_targets: ids })
  return new Map(((data as Degree[] | null) || []).map(d => [d.target, d]))
}

export async function fetchChain(target: string): Promise<ChainStep[]> {
  const { data } = await supabase.rpc('six_degres_path', { p_target: target })
  return (data as ChainStep[] | null) || []
}

export async function fetchReach(): Promise<Reach | null> {
  const { data } = await supabase.rpc('six_degres_reach')
  return (data as Reach | null) || null
}

export async function fetchConnections(me: string): Promise<ConnectionRow[]> {
  const { data } = await supabase.from('connections')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
  return (data as ConnectionRow[] | null) || []
}

// Renvoie 'pending' | 'accepted' | 'limite' | 'refuse'
export async function requestConnection(to: string): Promise<string> {
  const { data, error } = await supabase.rpc('connect_request', { p_to: to })
  return error ? 'refuse' : (data as string)
}

export async function respondConnection(from: string, accept: boolean) {
  await supabase.rpc('connect_respond', { p_from: from, p_accept: accept })
}

export async function removeConnection(other: string) {
  await supabase.rpc('connect_remove', { p_other: other })
}

// ── Invitations : ?ref= mémorisé à l'arrivée, rattaché après l'inscription ──
const REF_KEY = 'vibz_ref'

export function rememberRef() {
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    // La première personne qui a fait découvrir Vibz garde l'invitation
    if (ref && /^[0-9a-f-]{8,36}$/i.test(ref) && !localStorage.getItem(REF_KEY)) localStorage.setItem(REF_KEY, ref)
  } catch { /* stockage indisponible : l'invitation ne sera simplement pas comptée */ }
}

export async function claimStoredInvite(): Promise<string | null> {
  let ref: string | null = null
  try { ref = localStorage.getItem(REF_KEY) } catch { return null }
  if (!ref) return null
  const { data, error } = await supabase.rpc('claim_invite', { p_ref: ref })
  if (!error) { try { localStorage.removeItem(REF_KEY) } catch { /* rien */ } }
  return (data as string | null) || null
}

// ── Badges (symboliques) ──
export type Badge = { id: string; icon: string; name: string; hint: string; earned: boolean }

export function badges(r: Reach): Badge[] {
  const d = r.par_degre
  const upTo = (n: number) => d.slice(0, n).reduce((a, b) => a + b, 0)
  const six = upTo(6)
  return [
    { id: 'graine',   icon: '🌱', name: 'Première graine', hint: '1 ami inscrit grâce à ton lien',        earned: r.invitations >= 1 },
    { id: 'connect',  icon: '🤝', name: 'Connecteur',      hint: '10 membres au 1er degré',               earned: d[0] >= 10 },
    { id: 'tisseur',  icon: '🕸️', name: 'Tisseur',         hint: '50 membres à 3 degrés ou moins',         earned: upTo(3) >= 50 },
    { id: 'onde',     icon: '🌊', name: 'Onde de choc',    hint: '100 membres à 6 degrés ou moins',        earned: six >= 100 },
    { id: 'monde',    icon: '🌍', name: 'Relié à tout Vibz', hint: '90 % des membres à 6 degrés ou moins', earned: r.membres >= 20 && six >= r.membres * 0.9 },
  ]
}
