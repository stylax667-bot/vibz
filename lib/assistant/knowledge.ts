// ══════════════════════════════════════════════════════════════════
//  Ce que l'assistant sait du site (outil site_info).
//  Mets ce texte à jour quand le site évolue : l'assistant s'en sert pour
//  répondre aux questions sur le fonctionnement, les règles et la vie privée.
// ══════════════════════════════════════════════════════════════════
import { SALON_BASE_MAX, SALON_EXTEND_MAX, SALON_ADMIN_CHECK_MIN, SALON_IDLE_CLOSE_MIN } from '../salons'
import { AVATAR_LOCK_MONTHS } from '../avatar'

export const KNOWLEDGE: Record<string, string> = {
  presentation: `Vibz relie des musiciens et musiciennes pour des rencontres amoureuses ou des collaborations.
Onglets : Découvrir (profils et vinyle pour composer un salon), Messages (messagerie privée style MSN, Wizz, émojis),
Salons (discussions de groupe créées par les membres), Profil (avatar, instruments, styles, liens musicaux, réseaux).
Inscription réservée aux personnes majeures (18 ans et plus). Connexion par e-mail, Google ou Discord.`,

  salons: `Il n'y a pas de forum ni de salons officiels : tous les salons sont ouverts par les membres à partir
d'ingrédients (styles musicaux et instruments). La liste des salons ouverts est visible de tous ; les messages ne sont
lisibles que par les membres du salon.
- Quand on choisit des ingrédients, Vibz propose : rejoindre le salon qui a déjà les mêmes ingrédients, rejoindre un
  salon proche, créer une annexe (un sous-salon rangé sous le thème du salon principal), changer d'ingrédients, ou
  créer un nouveau salon si aucun n'existe avec exactement ces ingrédients.
- ${SALON_BASE_MAX} membres maximum. Si un quart des membres vote « Agrandir », le salon gagne 4 places (jusqu'à ${SALON_EXTEND_MAX}).
- Privatisation en 2 niveaux : chaque membre peut voter « Privatiser » (il prend part au contrôle du salon) ; quand la
  majorité est d'accord, un membre qui a voté choisit les participants et verrouille le salon. Un salon verrouillé reste
  visible dans la liste mais on y entre sur demande, acceptée par les membres qui le contrôlent. On peut aussi créer
  directement un salon privé.
- L'admin (le créateur, puis le membre le plus ancien) est sollicité toutes les ${SALON_ADMIN_CHECK_MIN} minutes pour
  confirmer que le salon continue ou le fermer.
- Un salon se ferme quand son dernier membre le quitte, ou automatiquement après ${SALON_IDLE_CLOSE_MIN} minutes sans
  aucun membre connecté. Ses messages sont alors effacés.
- Les liens YouTube collés dans une conversation s'affichent en vidéo lisible sur place (sinon lien vers YouTube).`,

  avatar: `Chaque membre choisit un avatar carré depuis son profil (JPEG, PNG, WebP ou GIF, 10 Mo max, au moins
128 × 128 px), recadré puis enregistré en 256 × 256. Chaque image est vérifiée automatiquement : une image
pornographique n'est jamais publiée et l'avatar est fixé sur un emoji d'instrument pendant ${AVATAR_LOCK_MONTHS} mois.`,

  moderation: `VibzGuard analyse les messages (salons et messagerie) et bloque le harcèlement, les insultes, les menaces,
le partage de données personnelles (téléphone, adresse, e-mail…), le spam et la cyberviolence sexuelle.
Sanctions possibles : avertissement, blocage du message, suspension (24 h, 7 j, 30 j) ou exclusion définitive ;
les menaces et contenus illégaux peuvent être signalés aux autorités (PHAROS). On peut bloquer un membre
(bouton Bloquer) et signaler un comportement depuis la messagerie.`,

  vie_privee: `Vibz applique le RGPD : données minimales, jamais revendues. Droits d'accès, de rectification,
d'effacement et d'opposition : écrire à michael_chesne@outlook.fr. Réclamation possible auprès de la CNIL.
Chaque membre choisit quels réseaux sociaux sont visibles et peut masquer sa ville. Les questions posées à
l'assistant IA sont transmises à Anthropic (fournisseur du modèle Claude) pour produire la réponse.`,

  regles: `Règles principales : respect mutuel, accepter un refus de contact, pas de harcèlement, d'insultes, de
discrimination, de contenus sexuels non sollicités, de doxxing, de spam ni d'usurpation d'identité. Un seul compte
par personne. Le pseudo et le profil ne doivent pas être trompeurs.`,

  contact: `Contact et signalements : michael_chesne@outlook.fr. Pages légales : /conditions (conditions
d'utilisation et charte), /confidentialite (politique de confidentialité), /mentions-legales.
Aide : 3114 (prévention suicide, 24 h/24), 3919 (violences conjugales), 0800 05 95 95 (Net Écoute),
cybermalveillance.gouv.fr.`,

  soutien: `Vibz est gratuit. On peut soutenir le projet par un don via Ko-fi (bouton Soutenir) et partager le site.`,
}

export const KNOWLEDGE_TOPICS = Object.keys(KNOWLEDGE)
