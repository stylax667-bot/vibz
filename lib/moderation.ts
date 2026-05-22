// =============================================
// VibzGuard — Modération IA
// Détection harcèlement, trolls, spam
// =============================================

const TOXIC_PATTERNS = [
  // Insultes directes
  /\b(idiot|imbécile|con|connard|salope|pute|merde|enculé|fdp|bâtard|abruti)\b/i,
  // Harcèlement
  /\b(tue.toi|va.mourir|je.vais.te|t.es.nul|personne.t.aime)\b/i,
  // Spam patterns
  /(.)\1{6,}/, // caractères répétés
  /(https?:\/\/[^\s]+\s*){3,}/, // trop de liens
]

const WARNING_PATTERNS = [
  /\b(stupid|nul|débile|gros.nul)\b/i,
  /[A-Z]{10,}/, // majuscules excessives
  /!{4,}/, // points d'exclamation excessifs
]

export type ModerationResult = {
  isBlocked: boolean
  isWarning: boolean
  score: number // 0-1
  reason?: string
  suggestion?: string
}

export function moderateMessage(content: string): ModerationResult {
  if (!content || content.trim().length === 0) {
    return { isBlocked: false, isWarning: false, score: 0 }
  }

  const text = content.toLowerCase()

  // Vérification patterns bloquants
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isBlocked: true,
        isWarning: false,
        score: 0.9,
        reason: 'Contenu inapproprié détecté',
        suggestion: 'Ce message contient des termes prohibés et ne peut pas être envoyé.',
      }
    }
  }

  // Vérification patterns d'avertissement
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isBlocked: false,
        isWarning: true,
        score: 0.5,
        reason: 'Ton potentiellement agressif',
        suggestion: 'Attention à ton ton — VibzGuard surveille les échanges pour le confort de tous.',
      }
    }
  }

  // Score de spam basique (longueur anormale)
  if (content.length > 1000) {
    return {
      isBlocked: false,
      isWarning: true,
      score: 0.4,
      reason: 'Message très long',
      suggestion: 'Les messages très longs peuvent être perçus comme du spam.',
    }
  }

  return { isBlocked: false, isWarning: false, score: 0 }
}

export function getIAGuardMessage(result: ModerationResult): string {
  if (result.isBlocked) {
    return `🛡️ VibzGuard | Message bloqué : ${result.reason}. ${result.suggestion}`
  }
  if (result.isWarning) {
    return `⚠️ VibzGuard | ${result.suggestion}`
  }
  return ''
}
