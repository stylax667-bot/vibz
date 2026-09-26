// =============================================
// VibzGuard — côté application
// L'analyse se fait dans la base (supabase/migrations/20260928_vibzguard_serveur.sql) :
// chaque message inséré passe par un déclencheur impossible à contourner.
// Ici, on ne fait qu'afficher son verdict à l'expéditeur.
// =============================================
import { supabase } from './supabase'

// Code renvoyé par Supabase quand `.insert().select().single()` ne rend aucune
// ligne : c'est le cas quand VibzGuard a refusé le message.
export const isGuardBlocked = (error: { code?: string } | null) => error?.code === 'PGRST116'

const ICONS: Record<string, string> = {
  menace: '🚨', incitation: '🚨', haine: '🚨', sexuel: '🚨', emprise: '🚨', harcelement: '🚨',
  arnaque: '🛡️', donnees: '🔒', coordonnees: '🔒', spam: '🛡️', flood: '⏱️', suspendu: '⛔',
}

// Raison du dernier blocage de l'utilisateur (le journal lui est lisible, à lui seul).
export async function guardBlockMessage(userId: string): Promise<string> {
  const { data } = await supabase.from('vibzguard_log')
    .select('category, reason')
    .eq('user_id', userId).eq('action', 'block')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (!data) return '🛡️ VibzGuard | Message refusé.'
  return `${ICONS[data.category] || '🛡️'} VibzGuard | ${data.reason}`
}

// Avertissement porté par un message accepté (colonne flag_reason).
export const guardWarnMessage = (flagReason?: string | null) =>
  flagReason ? `⚠️ VibzGuard | ${flagReason}` : ''

// Émis quand un blocage est fait hors de la messagerie (alerte VibzGuard) :
// la messagerie recharge alors sa liste de contacts.
export const BLOCKS_EVENT = 'vibz:blocks'
