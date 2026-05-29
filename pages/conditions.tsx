import Head from 'next/head'
import { useState } from 'react'

const pink  = '#E07A9A'
const green = '#52C07A'
const blue  = '#6BB8E8'
const font  = 'Nunito, sans-serif'

const SECTIONS = [
  { id:'preambule',     label:'Préambule',                     icon:'📜' },
  { id:'acces',         label:'Accès & inscription',           icon:'🔑' },
  { id:'charte',        label:'Charte comportementale',        icon:'🤝' },
  { id:'ia_guard',      label:'IA Guard — Modération',         icon:'🛡️' },
  { id:'donnees',       label:'Données & vie privée',          icon:'🔒' },
  { id:'contenu',       label:'Contenu publié',                icon:'✍️' },
  { id:'sanctions',     label:'Sanctions & exclusions',        icon:'⚖️' },
  { id:'mineurs',       label:'Protection des mineurs',        icon:'🧒' },
  { id:'partage',       label:'Partage & réseaux externes',    icon:'🔗' },
  { id:'responsabilite',label:'Responsabilité',                icon:'📋' },
  { id:'contact',       label:'Signalement & recours',         icon:'📢' },
  { id:'modifications', label:'Évolution des CGU',             icon:'🔄' },
]

export default function Conditions() {
  const [active, setActive] = useState('preambule')

  const scrollTo = (id: string) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const s: React.CSSProperties = {
    fontFamily: font,
    fontSize: 14,
    lineHeight: 1.85,
    color: '#1A1E2E',
  }

  const h2Style: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 800,
    color: '#1A1E2E',
    marginBottom: 10,
    marginTop: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const h3Style: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 800,
    color: '#1A1E2E',
    marginBottom: 6,
    marginTop: 18,
  }

  const box = (bg: string, border: string, color: string): React.CSSProperties => ({
    background: bg,
    border: `1.5px solid ${border}`,
    borderRadius: 12,
    padding: '14px 18px',
    marginBottom: 14,
    fontSize: 13,
    color,
    fontWeight: 600,
    lineHeight: 1.7,
  })

  const art = (id: string, icon: string, title: string, children: React.ReactNode) => (
    <article id={id} style={{ background: 'white', border: '1.5px solid #EEF2FA', borderRadius: 20, padding: '28px 32px', marginBottom: 24, scrollMarginTop: 80 }}>
      <h2 style={h2Style}><span style={{ fontSize: 22 }}>{icon}</span>{title}</h2>
      <div style={s}>{children}</div>
    </article>
  )

  const li = (text: React.ReactNode) => (
    <li style={{ marginBottom: 6, paddingLeft: 4 }}>{text}</li>
  )

  const ul = (items: React.ReactNode[]) => (
    <ul style={{ paddingLeft: 20, marginBottom: 14, marginTop: 6 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 6, paddingLeft: 4 }}>{item}</li>)}
    </ul>
  )

  return (
    <>
      <Head>
        <title>Conditions d&apos;Utilisation — Vibz</title>
        <meta name="description" content="Conditions Générales d'Utilisation de la plateforme Vibz. Charte comportementale, IA Guard, protection des données et des mineurs." />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F8FBFF', fontFamily: font }}>

        {/* ── Header ── */}
        <div style={{
          background: 'white',
          borderBottom: '1.5px solid #EEF2FA',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 12px rgba(107,184,232,0.08)',
        }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>🦋</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1A1E2E' }}>
              Vib<span style={{ color: pink }}>z</span>
            </span>
          </a>
          <div style={{ width: 1, height: 24, background: '#EEF2FA' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9BA8C0' }}>Conditions Générales d&apos;Utilisation</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#9BA8C0', fontWeight: 600 }}>
            Version 1.0 — Mai 2026
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32, alignItems: 'start' }}>

          {/* ── Sommaire sticky ── */}
          <nav style={{ position: 'sticky', top: 80, background: 'white', border: '1.5px solid #EEF2FA', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9BA8C0', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Sommaire</div>
            {SECTIONS.map(sec => (
              <button
                key={sec.id}
                onClick={() => scrollTo(sec.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: 'none',
                  background: active === sec.id ? `${pink}12` : 'transparent',
                  color: active === sec.id ? pink : '#6B7A9A',
                  fontFamily: font,
                  fontSize: 12,
                  fontWeight: active === sec.id ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s',
                  borderLeft: active === sec.id ? `3px solid ${pink}` : '3px solid transparent',
                }}
              >
                <span style={{ fontSize: 14 }}>{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            ))}

            {/* Accepter */}
            <div style={{ marginTop: 16, padding: '12px', background: `${green}12`, borderRadius: 12, border: `1px solid ${green}44`, fontSize: 11, color: '#2A7A4A', fontWeight: 700, textAlign: 'center', lineHeight: 1.6 }}>
              En utilisant Vibz vous acceptez l&apos;intégralité de ces conditions.
            </div>
          </nav>

          {/* ── Contenu ── */}
          <main>

            {/* Bannière solennelle */}
            <div style={{
              background: `linear-gradient(135deg, ${pink}18, ${blue}18)`,
              border: `1.5px solid ${pink}33`,
              borderRadius: 20,
              padding: '24px 32px',
              marginBottom: 28,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🦋</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1E2E', marginBottom: 6 }}>
                Conditions Générales d&apos;Utilisation — Vibz
              </div>
              <div style={{ fontSize: 13, color: '#9BA8C0', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
                Ces conditions définissent les règles de vie de la communauté Vibz.
                Elles sont <strong style={{ color: '#1A1E2E' }}>contractuelles</strong> et s&apos;appliquent à chaque membre,
                visiteur et tout contenu publié sur la plateforme.
                L&apos;IA Guard veille à leur application <strong style={{ color: '#1A1E2E' }}>24h/24, 7j/7, sans exception.</strong>
              </div>
            </div>

            {/* ── Art. 1 — Préambule ── */}
            {art('preambule', '📜', 'Article 1 — Préambule & Objet',
              <>
                <p style={{ marginTop: 0 }}>
                  Vibz est une plateforme de rencontres amoureuses et musicales, conçue pour favoriser des échanges
                  authentiques, respectueux et bienveillants. Elle s&apos;adresse à toute personne majeure souhaitant
                  rencontrer d&apos;autres passionnés de musique ou trouver une relation sincère.
                </p>
                <p>
                  Vibz repose sur un principe fondamental : <strong>la sécurité de chaque membre prime sur tout autre
                  intérêt</strong>. La modération est assurée en première ligne par <strong>VibzGuard</strong>, une intelligence
                  artificielle dédiée, intransigeante et non négociable. VibzGuard n&apos;est pas une option — c&apos;est
                  le gardien permanent de la communauté.
                </p>
                <div style={box(`${blue}12`, `${blue}44`, '#2A6090')}>
                  📌 L&apos;utilisation de Vibz, sous quelque forme que ce soit (navigation, inscription, publication, messagerie),
                  vaut acceptation pleine, entière et sans réserve des présentes Conditions Générales d&apos;Utilisation (CGU).
                </div>
              </>
            )}

            {/* ── Art. 2 — Accès ── */}
            {art('acces', '🔑', 'Article 2 — Accès & Inscription',
              <>
                <h3 style={h3Style}>2.1 Conditions d&apos;accès</h3>
                {ul([
                  <>L&apos;inscription est réservée aux personnes <strong>âgées d&apos;au moins 18 ans</strong>.</>,
                  <>Toute fausse déclaration concernant l&apos;âge entraîne la <strong>suspension immédiate et définitive</strong> du compte.</>,
                  'Un visiteur peut accéder aux salons en mode limité (10 messages par salon) sans inscription.',
                  'L\'accès complet (messagerie privée, matchs, profil) nécessite une inscription avec email valide ou OAuth (Google, Discord, Facebook, Microsoft).',
                ])}

                <h3 style={h3Style}>2.2 Unicité du compte</h3>
                {ul([
                  'Chaque personne physique ne peut créer qu\'un seul et unique compte Vibz.',
                  <>La détection de comptes multiples (multi-comptes) entraîne la <strong>suppression de tous les comptes concernés</strong> sans avertissement préalable.</>,
                  'Il est strictement interdit de créer un compte au nom d\'une autre personne ou d\'une entité fictive.',
                ])}

                <h3 style={h3Style}>2.3 Identité & authenticité</h3>
                {ul([
                  'Le pseudo et les informations de profil doivent être personnels et non trompeurs.',
                  'L\'usurpation d\'identité (se faire passer pour un autre membre, une célébrité, un modérateur Vibz) est un motif d\'exclusion définitive et peut faire l\'objet d\'un signalement aux autorités compétentes.',
                  'Les photos de profil doivent représenter la personne réelle (pas de robots, d\'avatars trompeurs ou de photos de tiers sans consentement).',
                ])}
              </>
            )}

            {/* ── Art. 3 — Charte ── */}
            {art('charte', '🤝', 'Article 3 — Charte Comportementale',
              <>
                <div style={box('#FFF5F8', `${pink}44`, '#7A1F40')}>
                  🚨 Cette charte est non négociable. Toute violation expose son auteur à des sanctions immédiates,
                  pouvant aller jusqu&apos;à l&apos;exclusion définitive de la plateforme et au signalement aux autorités.
                </div>

                <h3 style={h3Style}>3.1 Comportements strictement interdits</h3>
                {ul([
                  <><strong>Harcèlement sous toutes ses formes</strong> : harcèlement moral, sexuel, discriminatoire, de groupe (cyber-meute), harcèlement répété après refus de contact.</>,
                  <><strong>Insultes, menaces et intimidation</strong> : propos dégradants, menaces de mort ou de violence, chantage, intimidation psychologique.</>,
                  <><strong>Cyberviolence sexuelle</strong> : demandes ou envois non sollicités de contenus sexuels, sollicitations sexuelles auprès de membres non consentants, sexualisation d&apos;un membre contre son gré.</>,
                  <><strong>Discrimination</strong> : tout propos ou comportement discriminant fondé sur l&apos;origine, la religion, le genre, l&apos;orientation sexuelle, le handicap, l&apos;apparence physique ou toute autre caractéristique personnelle.</>,
                  <><strong>Doxxing</strong> : diffusion publique ou privée des informations personnelles d&apos;un membre (adresse, lieu de travail, numéro de téléphone, photos privées) sans son consentement explicite.</>,
                  <><strong>Manipulation & isolation</strong> : tenter d&apos;éloigner un membre de la plateforme pour l&apos;isoler, exercer une emprise psychologique ou affective.</>,
                  <><strong>Spam & contenu promotionnel non autorisé</strong> : envoi massif de messages identiques, publicité non sollicitée, sollicitations commerciales, arnaques financières.</>,
                  <><strong>Incitation à la haine ou à la violence</strong> : apologie du terrorisme, du génocide, de la torture, de la violence faite aux personnes ou aux animaux.</>,
                  <><strong>Propagande & désinformation</strong> : diffusion de fausses informations susceptibles de nuire à des individus, de la propagande politique extrémiste.</>,
                ])}

                <h3 style={h3Style}>3.2 Règles de courtoisie</h3>
                {ul([
                  'Le respect mutuel est la première condition de votre présence sur Vibz.',
                  'Accepter un refus de contact est obligatoire. Insister après un refus explicite constitue du harcèlement.',
                  'Les désaccords musicaux ou personnels se règlent dans le calme. Tout débordement déclenche VibzGuard.',
                  'Les membres vulnérables, en situation de détresse ou exprimant des idées noires doivent être orientés vers les ressources d\'aide disponibles — ne jamais les cibler.',
                ])}
              </>
            )}

            {/* ── Art. 4 — IA Guard ── */}
            {art('ia_guard', '🛡️', 'Article 4 — VibzGuard : Modération par Intelligence Artificielle',
              <>
                <div style={box(`${green}12`, `${green}44`, '#2A7A4A')}>
                  VibzGuard est le modérateur principal de Vibz. Son fonctionnement est automatique, continu et sans
                  appel possible dans les cas de harcèlement avéré ou de divulgation de données personnelles.
                </div>

                <h3 style={h3Style}>4.1 Fonctionnement de VibzGuard</h3>
                <p>
                  VibzGuard analyse en temps réel l&apos;intégralité des messages envoyés dans les salons et en messagerie privée.
                  Il détecte et traite automatiquement :
                </p>
                {ul([
                  <><strong>Niveau 1 — Données personnelles</strong> : numéros de téléphone, adresses email, adresses postales, IBAN, numéros de sécurité sociale, tokens ou mots de passe → <strong>Blocage immédiat + notification modération</strong></>,
                  <><strong>Niveau 2 — Harcèlement & cyberviolence</strong> : insultes graves, menaces, body shaming, sexualisation non consentie, incitation au suicide → <strong>Blocage immédiat + notification modération + flag du compte</strong></>,
                  <><strong>Niveau 3 — Tentative d&apos;isolement</strong> : incitation à quitter la plateforme, redirection vers d&apos;autres canaux (WhatsApp, Telegram…) à des fins de contournement de la modération → <strong>Blocage + avertissement</strong></>,
                  <><strong>Niveau 4 — Spam & contenu promotionnel</strong> : liens en masse, contenus promotionnels, escroqueries → <strong>Blocage immédiat</strong></>,
                  <><strong>Niveau 5 — Ton agressif</strong> : insultes légères, majuscules excessives, langage offensant → <strong>Avertissement visible, message autorisé</strong></>,
                ])}

                <h3 style={h3Style}>4.2 Actions automatiques de VibzGuard</h3>
                {ul([
                  <><strong>Blocage de message</strong> : le message n&apos;est jamais envoyé ni stocké. L&apos;auteur reçoit une explication détaillée.</>,
                  <><strong>Avertissement</strong> : le message est envoyé mais accompagné d&apos;un avertissement public de VibzGuard visible par tous les participants du salon.</>,
                  <><strong>Flag de compte</strong> : le compte est marqué pour revue humaine accélérée. Trois flags = suspension préventive automatique.</>,
                  <><strong>Suspension préventive</strong> : accès à la messagerie et aux salons coupé dans l&apos;attente d&apos;une revue humaine (délai max 48h).</>,
                  <><strong>Notification modération</strong> : les cas graves sont transmis en temps réel à l&apos;équipe de modération Vibz.</>,
                ])}

                <h3 style={h3Style}>4.3 Limites & recours</h3>
                {ul([
                  'VibzGuard peut produire des faux positifs. En cas de blocage injustifié, le membre peut contacter la modération via le formulaire de signalement.',
                  'Les décisions de VibzGuard concernant le harcèlement avéré ne sont pas négociables et ne font pas l\'objet d\'appel immédiat.',
                  'Vibz se réserve le droit d\'améliorer VibzGuard à tout moment pour renforcer la protection des membres.',
                ])}
              </>
            )}

            {/* ── Art. 5 — Données ── */}
            {art('donnees', '🔒', 'Article 5 — Données Personnelles & Vie Privée',
              <>
                <div style={box(`${blue}12`, `${blue}44`, '#2A6090')}>
                  Vibz applique le Règlement Général sur la Protection des Données (RGPD — UE 2016/679).
                  Vos données vous appartiennent. Vibz les utilise uniquement pour faire fonctionner le service.
                </div>

                <h3 style={h3Style}>5.1 Données collectées</h3>
                {ul([
                  'Email, pseudo, date d\'inscription (données d\'identification).',
                  'Informations de profil voluntairement renseignées : ville, bio, instruments, genres musicaux.',
                  'Messages privés et messages dans les salons (analysés par VibzGuard, non revendus).',
                  'Données de navigation anonymisées à des fins d\'amélioration du service.',
                ])}

                <h3 style={h3Style}>5.2 Ce que Vibz ne fait jamais</h3>
                {ul([
                  'Vibz ne vend jamais vos données à des tiers.',
                  'Vibz ne partage jamais vos informations avec des annonceurs.',
                  'Vibz ne lit pas vos messages privés sauf en cas de signalement validé par un membre.',
                  'Vibz ne demande jamais vos coordonnées bancaires, numéro de sécurité sociale ou pièces d\'identité.',
                ])}

                <h3 style={h3Style}>5.3 Vos droits RGPD</h3>
                {ul([
                  <><strong>Droit d&apos;accès</strong> : vous pouvez demander une copie de toutes vos données à tout moment.</>,
                  <><strong>Droit de rectification</strong> : vous pouvez corriger toute donnée inexacte.</>,
                  <><strong>Droit à l&apos;effacement</strong> : vous pouvez demander la suppression totale de votre compte et de vos données.</>,
                  <><strong>Droit à la portabilité</strong> : vous pouvez exporter vos données dans un format standard.</>,
                  <><strong>Droit d&apos;opposition</strong> : vous pouvez vous opposer à tout traitement de vos données.</>,
                ])}
                <p>Pour exercer vos droits : <strong>privacy@vibz.app</strong> — voir aussi notre{' '}
                  <a href="/confidentialite" style={{ color: blue, fontWeight: 800 }}>Politique de Confidentialité complète →</a>
                </p>

                <h3 style={h3Style}>5.4 Sécurité des données</h3>
                {ul([
                  'Toutes les données sont chiffrées en transit (HTTPS/TLS 1.3) et au repos.',
                  'L\'authentification utilise des tokens JWT sécurisés avec expiration automatique.',
                  'Les mots de passe sont hachés (bcrypt). Vibz ne connaît jamais votre mot de passe en clair.',
                  'En cas de violation de données, vous serez notifié dans les 72h conformément au RGPD.',
                ])}
              </>
            )}

            {/* ── Art. 6 — Contenu ── */}
            {art('contenu', '✍️', 'Article 6 — Contenu Publié & Propriété Intellectuelle',
              <>
                <h3 style={h3Style}>6.1 Responsabilité de l&apos;auteur</h3>
                <p>
                  Chaque membre est seul responsable du contenu qu&apos;il publie (messages, photos, liens, informations de profil).
                  Vibz ne valide pas les contenus a priori mais dispose du droit de supprimer tout contenu violant les présentes CGU.
                </p>

                <h3 style={h3Style}>6.2 Contenus interdits</h3>
                {ul([
                  'Contenus à caractère pornographique, pédopornographique ou sexuellement explicites non sollicités.',
                  'Contenus portant atteinte à la vie privée d\'un tiers (photos volées, enregistrements sans consentement).',
                  'Contenus soumis à droits d\'auteur partagés sans autorisation de l\'ayant-droit.',
                  'Liens vers des sites de téléchargement illégal, de piratage ou de contenu nuisible.',
                  'Fausses informations présentées comme vraies (fake news) causant un préjudice identifiable.',
                ])}

                <h3 style={h3Style}>6.3 Licence d&apos;utilisation</h3>
                <p>
                  En publiant du contenu sur Vibz, vous accordez à Vibz une licence limitée, non exclusive, révocable,
                  permettant l&apos;affichage de ce contenu aux autres membres dans le cadre du service.
                  Vibz n&apos;acquiert aucun droit de propriété sur votre contenu. Cette licence prend fin à la suppression du contenu.
                </p>
              </>
            )}

            {/* ── Art. 7 — Sanctions ── */}
            {art('sanctions', '⚖️', 'Article 7 — Sanctions & Exclusions',
              <>
                <div style={box('#FFF5F8', `${pink}44`, '#7A1F40')}>
                  Le barème suivant est indicatif. VibzGuard et l&apos;équipe de modération se réservent le droit
                  d&apos;appliquer des sanctions plus sévères en cas de gravité particulière, sans avertissement préalable.
                </div>

                <h3 style={h3Style}>7.1 Barème des sanctions</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FBFF' }}>
                        {['Infraction', 'Sanction automatique (IA)', 'Sanction humaine possible'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#9BA8C0', fontSize: 11, letterSpacing: 0.5, borderBottom: '1.5px solid #EEF2FA' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Ton agressif (1ʳᵉ fois)', 'Avertissement public', '—'],
                        ['Insulte légère répétée', 'Avertissement + flag', 'Suspension 24h'],
                        ['Spam / contenu promo', 'Blocage du message', 'Suspension 7j'],
                        ['Partage données perso d\'un tiers', 'Blocage + flag + notification', 'Suspension 30j'],
                        ['Harcèlement avéré', 'Blocage + flag + suspension préventive', 'Exclusion définitive'],
                        ['Menaces / violence', 'Blocage immédiat + suspension', 'Exclusion + signalement forces de l\'ordre'],
                        ['Contenu pédopornographique', 'Blocage immédiat + suspension totale', 'Exclusion définitive + signalement PHAROS obligatoire'],
                        ['Usurpation d\'identité', 'Suspension préventive', 'Exclusion définitive'],
                        ['Multi-compte après exclusion', 'Détection + blocage', 'Exclusion définitive de tous les comptes'],
                      ].map(([inf, ia, hum], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#F8FBFF' }}>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #F0F2F8', fontWeight: 600 }}>{inf}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #F0F2F8', color: '#C07040' }}>{ia}</td>
                          <td style={{ padding: '10px 14px', borderBottom: '1px solid #F0F2F8', color: '#7A1F40', fontWeight: ia === '—' ? 400 : 700 }}>{hum}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 style={h3Style}>7.2 Recours</h3>
                {ul([
                  'Toute suspension peut faire l\'objet d\'une contestation dans les 72 heures via appeal@vibz.app.',
                  'Les exclusions définitives pour harcèlement avéré, contenu pédopornographique ou menaces physiques ne peuvent pas faire l\'objet d\'un recours.',
                  'Vibz n\'est pas tenu de restituer les données d\'un compte exclu pour faute grave.',
                ])}
              </>
            )}

            {/* ── Art. 8 — Mineurs ── */}
            {art('mineurs', '🧒', 'Article 8 — Protection des Mineurs',
              <>
                <div style={box('#FFF5F8', `${pink}44`, '#7A1F40')}>
                  🔴 Vibz est <strong>strictement réservé aux personnes majeures (18 ans et plus)</strong>.
                  La protection des mineurs est une priorité absolue et non négociable.
                </div>

                {ul([
                  'Toute inscription implique une déclaration sur l\'honneur d\'être majeur.',
                  'Tout contenu à caractère sexuel impliquant un mineur (réel ou fictif) est <strong>immédiatement signalé aux autorités (PHAROS / Cybercrime)</strong>.',
                  'Si un membre soupçonne qu\'un utilisateur est mineur, il doit le signaler immédiatement via le bouton "Signaler".',
                  'Les échanges à caractère romantique ou sexuel avec un utilisateur dont la minorité est suspectée entraînent une exclusion définitive et un signalement aux forces de l\'ordre.',
                  'Vibz coopère pleinement avec les autorités judiciaires en cas d\'enquête impliquant la protection de mineurs.',
                ])}
              </>
            )}

            {/* ── Art. 9 — Partage ── */}
            {art('partage', '🔗', 'Article 9 — Partage & Réseaux Externes',
              <>
                <h3 style={h3Style}>9.1 Partage vers l&apos;extérieur</h3>
                <p>
                  Vibz permet à chaque membre de lier son profil à des plateformes externes (SoundCloud, Instagram,
                  Spotify, YouTube, etc.) dans le respect des règles suivantes :
                </p>
                {ul([
                  'Seuls les liens vous appartenant peuvent figurer dans votre profil. Partager le profil d\'un tiers sans son consentement est interdit.',
                  'Les liens doivent pointer vers des contenus légaux. Tout lien vers du contenu illégal, offensant ou violant les droits d\'un tiers sera supprimé.',
                  'Vibz ne peut être tenu responsable du contenu hébergé sur des plateformes externes.',
                  'Le partage du lien de profil Vibz vers l\'extérieur (réseaux sociaux, sites tiers) est autorisé et encouragé dans le respect de l\'identité de chaque membre.',
                ])}

                <h3 style={h3Style}>9.2 Vie privée & consentement</h3>
                {ul([
                  <>Il est <strong>strictement interdit</strong> de partager des captures d&apos;écran de conversations privées sans le consentement explicite de tous les participants.</>,
                  'La diffusion de messages privés reçus, même partiellement, sans accord de leur auteur constitue une violation de la vie privée.',
                  'La règle d\'or : ne partagez jamais en dehors de Vibz ce que l\'autre n\'a pas consenti à rendre public.',
                ])}
              </>
            )}

            {/* ── Art. 10 — Responsabilité ── */}
            {art('responsabilite', '📋', 'Article 10 — Responsabilité de Vibz',
              <>
                {ul([
                  'Vibz est un intermédiaire technique. Il ne peut être tenu responsable des comportements individuels de ses membres.',
                  'Vibz déploie VibzGuard et met en place tous les moyens raisonnables pour prévenir les abus, sans pouvoir garantir leur absence totale.',
                  'Vibz ne peut être tenu responsable des dommages résultant d\'une utilisation frauduleuse, détournée ou non conforme aux présentes CGU.',
                  'Vibz ne garantit pas la disponibilité continue du service (maintenance, incidents techniques) mais s\'engage à informer les membres en cas d\'interruption planifiée.',
                  'Les interactions entre membres (rencontres, collaborations musicales, relations amoureuses) sont sous la responsabilité exclusive des membres concernés.',
                ])}
              </>
            )}

            {/* ── Art. 11 — Signalement ── */}
            {art('contact', '📢', 'Article 11 — Signalement & Recours',
              <>
                <h3 style={h3Style}>11.1 Comment signaler un comportement</h3>
                {ul([
                  'Bouton "Signaler" disponible sur chaque message, profil et conversation.',
                  'Email de modération : moderation@vibz.app (réponse sous 48h ouvrées).',
                  'En cas d\'urgence (menace physique immédiate) : contactez directement le 17 (Police) ou le 3114 (numéro national de prévention du suicide).',
                ])}

                <h3 style={h3Style}>11.2 Traitement des signalements</h3>
                {ul([
                  'Tout signalement déclenche une revue humaine dans les 48h.',
                  'L\'auteur du signalement est protégé : son identité n\'est jamais communiquée au membre signalé.',
                  'Les faux signalements répétés (signalements abusifs visant à nuire à un membre) sont sanctionnés.',
                ])}

                <h3 style={h3Style}>11.3 Ressources d&apos;aide</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: '🆘 3114', desc: 'Prévention suicide — 24h/24' },
                    { label: '📞 3919', desc: 'Violences conjugales — 24h/24' },
                    { label: '📞 0800 05 95 95', desc: 'Net Écoute — cyberharcèlement' },
                    { label: '🌐 cybermalveillance.gouv.fr', desc: 'Plateforme officielle' },
                  ].map(r => (
                    <div key={r.label} style={{ padding: '12px 16px', background: '#F8FBFF', borderRadius: 12, border: '1.5px solid #EEF2FA' }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1E2E', marginBottom: 3 }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: '#9BA8C0' }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Art. 12 — Modifications ── */}
            {art('modifications', '🔄', 'Article 12 — Évolution des CGU',
              <>
                <p style={{ marginTop: 0 }}>
                  Vibz se réserve le droit de modifier les présentes CGU à tout moment. Les membres seront notifiés
                  par email et par bannière dans l&apos;application au moins <strong>15 jours avant l&apos;entrée en vigueur</strong> des
                  nouvelles conditions.
                </p>
                {ul([
                  'La poursuite de l\'utilisation de Vibz après la date d\'entrée en vigueur des nouvelles CGU vaut acceptation.',
                  'En cas de désaccord avec les nouvelles conditions, le membre peut supprimer son compte sans pénalité.',
                  'Les modifications relatives à la protection des données font l\'objet d\'une notification distincte et d\'un délai de 30 jours.',
                ])}

                <div style={box(`${green}12`, `${green}44`, '#2A7A4A')}>
                  📅 <strong>Version actuelle :</strong> 1.0 — Mai 2026<br />
                  📧 <strong>Contact juridique :</strong> legal@vibz.app<br />
                  🏛️ <strong>Droit applicable :</strong> Droit français — Juridiction compétente : Tribunaux français<br />
                  🌍 <strong>RGPD :</strong> Délégué à la Protection des Données — dpo@vibz.app
                </div>
              </>
            )}

            {/* Footer acceptation */}
            <div style={{
              background: `linear-gradient(135deg, ${pink}18, ${blue}18)`,
              border: `1.5px solid ${pink}33`,
              borderRadius: 20,
              padding: '28px 32px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🦋</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1E2E', marginBottom: 8 }}>
                En utilisant Vibz, vous acceptez ces conditions.
              </div>
              <div style={{ fontSize: 13, color: '#9BA8C0', lineHeight: 1.7, marginBottom: 20 }}>
                Ces CGU ont pour unique objectif de protéger chaque membre de la communauté.
                VibzGuard veille. La bienveillance est la seule règle qui compte vraiment.
              </div>
              <a href="/" style={{
                display: 'inline-block',
                padding: '13px 32px',
                borderRadius: 14,
                background: `linear-gradient(135deg, ${pink}, ${blue})`,
                color: 'white',
                fontWeight: 800,
                fontSize: 14,
                textDecoration: 'none',
                fontFamily: font,
                boxShadow: `0 6px 20px ${pink}33`,
              }}>← Retour à Vibz</a>
            </div>

          </main>
        </div>
      </div>
    </>
  )
}
