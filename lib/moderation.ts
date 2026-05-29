// =============================================
// VibzGuard — Modération IA v2.0
// Tolérance zéro : harcèlement, données perso,
// cyberbullying, doxxing, spam, manipulation
// =============================================

// ── DONNÉES SENSIBLES (bloqué immédiatement) ─────────────────────────────────
const SENSITIVE_DATA_PATTERNS = [
  // Numéros de téléphone
  /\b(\+33|0[67])\s?[\d\s\-\.]{9,}\b/,
  /\b0[1-9][\s\-\.]?\d{2}[\s\-\.]?\d{2}[\s\-\.]?\d{2}[\s\-\.]?\d{2}\b/,
  // Emails
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,
  // Adresses physiques (rue, avenue, numéro...)
  /\b\d{1,4}[,\s]+(rue|avenue|boulevard|allée|impasse|route|chemin|place|passage|villa|résidence)\b/i,
  // Numéros de carte bancaire
  /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/,
  // RIB / IBAN
  /\bFR\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{3}\b/i,
  // Numéro de sécu sociale
  /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/,
  // IP address
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  // Mots de passe ou tokens (pattern courant)
  /\b(mot.de.passe|password|mdp|token|secret|api.key)\s*[:=]\s*\S+/i,
  // Snapchat/Insta/TikTok handle partagé de façon suspecte (forcer le partage de réseaux)
  /\b(mon snap|mon insta|mon tiktok|add me on|ajoute.moi sur|snap[:=\s]+\w+)\b/i,
  // Demande de numéro
  /\b(donne.moi (ton|votre) num|envoie.moi (ton|votre) tel|contacte.moi (en privé|au))\b/i,
]

// ── HARCÈLEMENT & CYBERBULLYING (bloqué immédiatement) ───────────────────────
const HARASSMENT_PATTERNS = [
  // Insultes graves
  /\b(fdp|fils de p|enculé|enculer|pute|salope|connard|connasse|bâtard|batard|raclure|ordure|pourriture|déchet|sous.merde)\b/i,
  // Incitation à la violence / au suicide
  /\b(tue.toi|crève|va.te.pendre|va.mourir|je vais te|tu mérites de|t'es qu'une?|nique ta)\b/i,
  // Threats
  /\b(je sais où (tu|vous) (habites?|vis?)|je vais trouver|je t'attends|gare à toi|tu vas le regretter|je vais te trouver)\b/i,
  // Discrimination
  /\b(sale (arabe|noir|blanc|juif|homo|gay|pédé|lesbienne|trans|gouine))\b/i,
  /\b(va dans ton pays|retourne (chez toi|dans ton pays)|espèce de)\b/i,
  // Body shaming / humiliation
  /\b(t'es (moche|laid|grosse?|obèse?|anorexique|difforme)|regarde.toi|pauvre (type|fille|mec))\b/i,
  // Sexualisation non consentie
  /\b(envoie.moi une? (photo|pic|vid)|montre.moi (tes?|ton)|t'as un beau|c'est quoi ton corps)\b/i,
  // Trolling & manipulation
  /\b(personne (ne t'aime|t'aime|ne t'aidera)|tout le monde s'en fout|tu (vaux|sers) à rien|t'as pas d'amis)\b/i,
]

// ── SPAM & ABUS (bloqué) ──────────────────────────────────────────────────────
const SPAM_PATTERNS = [
  /(.)\1{7,}/,                      // caractères répétés (aaaaaaa)
  /(https?:\/\/[^\s]+\s*){3,}/,    // 3+ liens d'affilée
  /(\b\w+\b)(\s+\1){4,}/i,         // mots répétés 5+ fois
  /\b(buy|achat|discount|promo|invest|bitcoin|crypto|forex|gain facile|argent rapide|click here|cliquez ici)\b/i,
]

// ── AVERTISSEMENT (message passe mais avertit) ────────────────────────────────
const WARNING_PATTERNS = [
  /\b(nul|débile|idiot|crétin|imbécile|stupide|bête|con|couillon)\b/i,
  /[A-Z\s]{15,}/,      // écriture tout en majuscules
  /!{4,}/,             // !!!!! excessif
  /\b(ferme.la|ta gueule|casse.toi|dégage|laisse.moi tranquille)\b/i,
  // Début d'échange de coordonnées — avertir avant de bloquer
  /\b(t'as (whatsapp|telegram|signal)|tu (es|es) sur (insta|snap))\b/i,
]

// ── CONTEXTE SUSPECT : demande d'isolement ────────────────────────────────────
// "on se parle en mp", "contacte-moi ailleurs", "passe sur..." = red flag harcèlement
const ISOLATION_PATTERNS = [
  /\b(on (se parle|discute) (en mp|en privé|ailleurs)|contacte.moi (ailleurs|en dehors)|viens (sur|dans) (discord|telegram|whatsapp))\b/i,
  /\b(continue (là|ici) pas|parle.moi (en dehors|hors|en privé de vibz))\b/i,
]

export type ModerationResult = {
  isBlocked: boolean
  isWarning: boolean
  isSensitive: boolean   // donnée perso détectée
  isHarassment: boolean  // harcèlement/cyberbullying
  isIsolation: boolean   // tentative d'isolement de la victime
  score: number          // 0-1
  reason?: string
  suggestion?: string
  guardAction?: 'block' | 'warn' | 'flag' | 'notify_moderator'
}

export function moderateMessage(content: string): ModerationResult {
  if (!content || content.trim().length === 0) {
    return { isBlocked:false, isWarning:false, isSensitive:false, isHarassment:false, isIsolation:false, score:0 }
  }

  // 1. Données sensibles — priorité absolue
  for (const pattern of SENSITIVE_DATA_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isBlocked: true,
        isWarning: false,
        isSensitive: true,
        isHarassment: false,
        isIsolation: false,
        score: 1.0,
        reason: 'Données personnelles détectées',
        suggestion: 'VibzGuard protège votre vie privée. Ne partagez jamais vos coordonnées personnelles (téléphone, email, adresse) dans un salon public. Utilisez la messagerie privée uniquement avec des personnes de confiance.',
        guardAction: 'block',
      }
    }
  }

  // 2. Harcèlement — tolérance zéro
  for (const pattern of HARASSMENT_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isBlocked: true,
        isWarning: false,
        isSensitive: false,
        isHarassment: true,
        isIsolation: false,
        score: 0.95,
        reason: 'Contenu harcelant ou abusif',
        suggestion: 'Ce message viole la Charte Vibz. Harcèlement, insultes et menaces sont strictement interdits. Votre compte peut être suspendu. Si vous êtes victime de harcèlement, utilisez le bouton "Signaler".',
        guardAction: 'notify_moderator',
      }
    }
  }

  // 3. Tentative d'isolement (red flag harcèlement)
  for (const pattern of ISOLATION_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isBlocked: true,
        isWarning: false,
        isSensitive: false,
        isHarassment: false,
        isIsolation: true,
        score: 0.8,
        reason: 'Tentative de déplacement hors plateforme',
        suggestion: 'VibzGuard a détecté une tentative de faire quitter la plateforme à un autre utilisateur. Pour votre sécurité, les échanges restent sur Vibz où la modération vous protège.',
        guardAction: 'flag',
      }
    }
  }

  // 4. Spam
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isBlocked: true,
        isWarning: false,
        isSensitive: false,
        isHarassment: false,
        isIsolation: false,
        score: 0.7,
        reason: 'Spam ou contenu promotionnel',
        suggestion: 'Ce message ressemble à du spam. Les contenus promotionnels non autorisés sont bloqués.',
        guardAction: 'block',
      }
    }
  }

  // 5. Avertissement (ton agressif mais pas bloqué)
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(content)) {
      return {
        isBlocked: false,
        isWarning: true,
        isSensitive: false,
        isHarassment: false,
        isIsolation: false,
        score: 0.45,
        reason: 'Ton potentiellement agressif',
        suggestion: 'VibzGuard surveille les échanges. Restez bienveillant·e — chaque utilisateur mérite le respect.',
        guardAction: 'warn',
      }
    }
  }

  // 6. Message très long = potentiel flood
  if (content.length > 800) {
    return {
      isBlocked: false,
      isWarning: true,
      isSensitive: false,
      isHarassment: false,
      isIsolation: false,
      score: 0.35,
      reason: 'Message exceptionnellement long',
      suggestion: 'Les messages très longs peuvent gêner la conversation. Essayez de synthétiser.',
      guardAction: 'warn',
    }
  }

  return { isBlocked:false, isWarning:false, isSensitive:false, isHarassment:false, isIsolation:false, score:0 }
}

export function getIAGuardMessage(result: ModerationResult): string {
  if (!result.isBlocked && !result.isWarning) return ''
  if (result.isSensitive)   return `🔒 VibzGuard | Données protégées : ${result.suggestion}`
  if (result.isHarassment)  return `🚨 VibzGuard | ${result.suggestion}`
  if (result.isIsolation)   return `⚠️ VibzGuard | ${result.suggestion}`
  if (result.isBlocked)     return `🛡️ VibzGuard | Message bloqué : ${result.reason}. ${result.suggestion}`
  if (result.isWarning)     return `⚠️ VibzGuard | ${result.suggestion}`
  return ''
}

// ── Charte Vibz (affichée à l'entrée des salons) ─────────────────────────────
export const VIBZ_CHARTER = [
  '🔒 Ne partagez jamais vos coordonnées personnelles dans un salon public',
  '🤝 Respectez chaque membre, quelles que soient ses différences',
  '🚫 Zéro tolérance pour le harcèlement, les menaces et la discrimination',
  '🎵 Restez dans l\'esprit Vibz : musique, rencontre, bienveillance',
  '🛡️ VibzGuard surveille 24h/24 — chaque message est analysé',
  '📢 Signalez tout comportement suspect avec le bouton Signaler',
]
