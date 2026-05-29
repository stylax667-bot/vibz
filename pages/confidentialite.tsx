import Head from 'next/head'
import { useState, useEffect } from 'react'

const pink  = '#E07A9A'
const green = '#52C07A'
const blue  = '#6BB8E8'
const font  = 'Nunito, sans-serif'

const SECTIONS = [
  { id:'intro',        label:'Introduction',                    icon:'📜' },
  { id:'responsable',  label:'Responsable de traitement',       icon:'🏛️' },
  { id:'collecte',     label:'Données collectées',              icon:'📥' },
  { id:'finalites',    label:'Finalités & bases légales',       icon:'⚖️' },
  { id:'non_collecte', label:'Ce que nous ne faisons jamais',   icon:'🚫' },
  { id:'vibzguard',    label:'VibzGuard & analyse IA',          icon:'🛡️' },
  { id:'conservation', label:'Durée de conservation',           icon:'⏱️' },
  { id:'partage',      label:'Partage des données',             icon:'🔗' },
  { id:'securite',     label:'Sécurité technique',              icon:'🔐' },
  { id:'droits',       label:'Vos droits RGPD',                 icon:'✅' },
  { id:'cookies',      label:'Cookies & traceurs',              icon:'🍪' },
  { id:'mineurs',      label:'Mineurs & données sensibles',     icon:'🧒' },
  { id:'transferts',   label:'Transferts hors UE',              icon:'🌍' },
  { id:'contact',      label:'Contact & réclamations',          icon:'📧' },
]

export default function Confidentialite() {
  const [active, setActive]     = useState('intro')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* ── Styles utilitaires ────────────────────────────────────────────────── */
  const prose: React.CSSProperties = { fontFamily: font, fontSize: 14, lineHeight: 1.9, color: '#1A1E2E' }

  const h2: React.CSSProperties = {
    fontSize: 19, fontWeight: 800, color: '#1A1E2E',
    marginBottom: 12, marginTop: 0,
    display: 'flex', alignItems: 'center', gap: 10,
    paddingBottom: 10, borderBottom: '1.5px solid #EEF2FA',
  }

  const h3: React.CSSProperties = {
    fontSize: 14, fontWeight: 800, color: '#1A1E2E',
    marginBottom: 8, marginTop: 20,
  }

  const card: React.CSSProperties = {
    background: 'white', border: '1.5px solid #EEF2FA',
    borderRadius: 20, padding: '28px 32px', marginBottom: 24,
    scrollMarginTop: 90,
  }

  const notice = (bg: string, border: string, color: string, icon: string, text: React.ReactNode): React.ReactNode => (
    <div style={{
      background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
      padding: '13px 18px', marginBottom: 16,
      fontSize: 13, color, fontWeight: 600, lineHeight: 1.75,
      display: 'flex', gap: 10,
    }}>
      <span style={{ flexShrink: 0, fontSize: 16 }}>{icon}</span>
      <span>{text}</span>
    </div>
  )

  const ul = (...items: React.ReactNode[]) => (
    <ul style={{ paddingLeft: 20, margin: '8px 0 14px' }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 7 }}>{item}</li>)}
    </ul>
  )

  const tag = (label: string, color: string, bg: string) => (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 800, color, background: bg, marginRight: 6,
    }}>{label}</span>
  )

  const dataRow = (name: string, why: string, base: string, retention: string) => (
    <tr style={{ borderBottom: '1px solid #F0F2F8' }}>
      <td style={{ padding: '9px 12px', fontWeight: 700, fontSize: 12 }}>{name}</td>
      <td style={{ padding: '9px 12px', fontSize: 12, color: '#4A5470' }}>{why}</td>
      <td style={{ padding: '9px 12px' }}>
        <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: `${blue}18`, color: '#2A6090' }}>{base}</span>
      </td>
      <td style={{ padding: '9px 12px', fontSize: 12, color: '#9BA8C0', fontWeight: 700 }}>{retention}</td>
    </tr>
  )

  const art = (id: string, icon: string, title: string, children: React.ReactNode) => (
    <article id={id} style={card}>
      <h2 style={h2}><span style={{ fontSize: 24 }}>{icon}</span>{title}</h2>
      <div style={prose}>{children}</div>
    </article>
  )

  /* ── Rendu ─────────────────────────────────────────────────────────────── */
  return (
    <>
      <Head>
        <title>Politique de Confidentialité — Vibz</title>
        <meta name="description" content="Politique de confidentialité renforcée de Vibz. RGPD, protection des données, VibzGuard, droits des utilisateurs." />
      </Head>

      <div style={{ minHeight: '100vh', background: '#F8FBFF', fontFamily: font }}>

        {/* ── Header ── */}
        <div style={{
          background: 'white',
          borderBottom: '1.5px solid #EEF2FA',
          padding: '15px 32px',
          display: 'flex', alignItems: 'center', gap: 16,
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: scrolled ? '0 4px 20px rgba(107,184,232,0.10)' : 'none',
          transition: 'box-shadow 0.2s',
        }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>🦋</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#1A1E2E' }}>
              Vib<span style={{ color: pink }}>z</span>
            </span>
          </a>
          <div style={{ width: 1, height: 22, background: '#EEF2FA' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#9BA8C0' }}>Politique de Confidentialité</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9BA8C0', fontWeight: 600 }}>v1.0 — Mai 2026</span>
            <a href="/conditions" style={{
              padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${pink}44`,
              background: `${pink}10`, color: pink, fontSize: 11, fontWeight: 800,
              textDecoration: 'none',
            }}>CGU →</a>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: '250px 1fr', gap: 32, alignItems: 'start' }}>

          {/* ── Sommaire ── */}
          <nav style={{
            position: 'sticky', top: 78,
            background: 'white', border: '1.5px solid #EEF2FA',
            borderRadius: 20, padding: 18,
            display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#9BA8C0', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' }}>Sommaire</div>
            {SECTIONS.map(sec => (
              <button key={sec.id} onClick={() => scrollTo(sec.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 9, border: 'none',
                background: active === sec.id ? `${blue}14` : 'transparent',
                color: active === sec.id ? '#2A6090' : '#6B7A9A',
                fontFamily: font, fontSize: 12,
                fontWeight: active === sec.id ? 800 : 600,
                cursor: 'pointer', textAlign: 'left',
                borderLeft: active === sec.id ? `3px solid ${blue}` : '3px solid transparent',
                transition: 'all 0.1s',
              }}>
                <span style={{ fontSize: 13 }}>{sec.icon}</span>
                <span style={{ lineHeight: 1.3 }}>{sec.label}</span>
              </button>
            ))}

            <div style={{ marginTop: 14, padding: 12, background: `${green}10`, borderRadius: 12, border: `1.5px solid ${green}33`, fontSize: 11, color: '#2A7A4A', fontWeight: 700, lineHeight: 1.65, textAlign: 'center' }}>
              🛡️ Conforme RGPD<br />
              <span style={{ fontWeight: 600, fontSize: 10, color: '#52A06A' }}>UE 2016/679</span>
            </div>
          </nav>

          {/* ── Articles ── */}
          <main>

            {/* Bandeau d'intro */}
            <div style={{
              background: `linear-gradient(135deg, ${blue}18, ${green}18)`,
              border: `1.5px solid ${blue}33`, borderRadius: 20,
              padding: '26px 32px', marginBottom: 28, textAlign: 'center',
            }}>
              <div style={{ fontSize: 38, marginBottom: 8 }}>🔐</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1E2E', marginBottom: 6 }}>
                Politique de Confidentialité Vibz
              </div>
              <div style={{ fontSize: 13, color: '#6B7A9A', lineHeight: 1.8, maxWidth: 580, margin: '0 auto', marginBottom: 18 }}>
                Chez Vibz, <strong style={{ color: '#1A1E2E' }}>vos données vous appartiennent</strong>. Nous collectons le
                strict minimum, nous ne les revendons jamais, et vous gardez le contrôle total à chaque instant.
                Cette politique s&apos;applique à chaque membre, visiteur et interaction sur la plateforme.
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: '✅ RGPD conforme', bg: `${green}18`, color: '#2A7A4A', border: `${green}44` },
                  { label: '🚫 Zéro revente', bg: `${pink}18`, color: '#7A1F40', border: `${pink}44` },
                  { label: '🔐 Chiffrement bout en bout', bg: `${blue}18`, color: '#2A6090', border: `${blue}44` },
                  { label: '🤝 Droit à l\'oubli garanti', bg: '#F5F0FC', color: '#5040A0', border: '#A78BDB44' },
                ].map(b => (
                  <span key={b.label} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
                    background: b.bg, color: b.color, border: `1.5px solid ${b.border}`,
                  }}>{b.label}</span>
                ))}
              </div>
            </div>

            {/* Art. 1 — Introduction */}
            {art('intro', '📜', 'Article 1 — Introduction',
              <>
                <p style={{ marginTop: 0 }}>
                  La présente Politique de Confidentialité décrit précisément comment <strong>Vibz</strong> collecte,
                  utilise, conserve et protège vos données personnelles, conformément au{' '}
                  <strong>Règlement Général sur la Protection des Données (RGPD — UE 2016/679)</strong> et à la{' '}
                  <strong>loi Informatique et Libertés modifiée</strong>.
                </p>
                {notice(`${blue}12`, `${blue}44`, '#2A6090', '📌',
                  'En utilisant Vibz, vous reconnaissez avoir pris connaissance de la présente Politique de Confidentialité. Elle complète les Conditions Générales d\'Utilisation et fait partie intégrante du contrat vous liant à Vibz.'
                )}
                <p>
                  Cette politique s&apos;applique à :
                </p>
                {ul(
                  'Tous les membres inscrits sur Vibz (comptes actifs ou supprimés).',
                  'Les visiteurs accédant aux salons en mode non connecté.',
                  'Toute interaction avec nos services : site web, API, messagerie, salons, profil.'
                )}
              </>
            )}

            {/* Art. 2 — Responsable */}
            {art('responsable', '🏛️', 'Article 2 — Responsable de Traitement',
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {[
                    { label: 'Entité', value: 'Vibz (structure en cours d\'immatriculation)' },
                    { label: 'Siège social', value: 'France' },
                    { label: 'DPO (Délégué Protection Données)', value: 'dpo@vibz.app' },
                    { label: 'Contact juridique', value: 'legal@vibz.app' },
                    { label: 'Hébergeur données', value: 'Supabase Inc. (serveurs UE — Frankfurt)' },
                    { label: 'Droit applicable', value: 'Droit français — RGPD' },
                  ].map(r => (
                    <div key={r.label} style={{ padding: '12px 16px', background: '#F8FBFF', borderRadius: 12, border: '1.5px solid #EEF2FA' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#9BA8C0', letterSpacing: 0.8, marginBottom: 4, textTransform: 'uppercase' }}>{r.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1E2E' }}>{r.value}</div>
                    </div>
                  ))}
                </div>
                {notice(`${green}12`, `${green}44`, '#2A7A4A', '✅',
                  <>Vibz s&apos;engage à désigner un <strong>Délégué à la Protection des Données (DPO)</strong> indépendant dès que l&apos;effectif et le volume de traitement l&apos;exigeront, conformément à l&apos;article 37 du RGPD.</>
                )}
              </>
            )}

            {/* Art. 3 — Collecte */}
            {art('collecte', '📥', 'Article 3 — Données Collectées',
              <>
                <h3 style={h3}>3.1 Tableau exhaustif des données traitées</h3>
                <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FBFF' }}>
                        {['Donnée', 'Pourquoi', 'Base légale', 'Conservation'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 800, color: '#9BA8C0', fontSize: 10, letterSpacing: 0.5, borderBottom: '1.5px solid #EEF2FA', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRow('Adresse email', 'Identification, connexion, notifications', 'Contrat', '3 ans après dernière activité')}
                      {dataRow('Pseudo / Nom affiché', 'Identification dans la communauté', 'Contrat', 'Durée du compte')}
                      {dataRow('Date de naissance (âge)', 'Vérification majorité 18 ans', 'Obligation légale', '3 ans après dernière activité')}
                      {dataRow('Mot de passe (haché bcrypt)', 'Authentification sécurisée', 'Contrat', 'Durée du compte')}
                      {dataRow('Photo de profil (optionnel)', 'Personnalisation du profil', 'Consentement', 'Durée du compte ou suppression')}
                      {dataRow('Ville / Région (optionnel)', 'Suggestions de matchs géolocalisés', 'Consentement', 'Durée du compte')}
                      {dataRow('Bio, instruments, genres musicaux', 'Personnalisation, matching musical', 'Consentement', 'Durée du compte')}
                      {dataRow('Liens réseaux sociaux (optionnel)', 'Affichage profil public si activé', 'Consentement', 'Jusqu\'à suppression par l\'utilisateur')}
                      {dataRow('Messages dans les salons', 'Service de salon, modération IA', 'Contrat + Intérêt légitime', '1 an glissant')}
                      {dataRow('Messages privés', 'Service de messagerie', 'Contrat', '2 ans glissants')}
                      {dataRow('Likes, matchs', 'Fonctionnalité cœur du service', 'Contrat', 'Durée du compte')}
                      {dataRow('Logs de connexion (IP, heure, device)', 'Sécurité, détection fraude, anti-multi-comptes', 'Intérêt légitime', '90 jours')}
                      {dataRow('Données OAuth (Google, Discord, etc.)', 'Connexion simplifiée (token only, pas de mot de passe)', 'Contrat', 'Durée de la session')}
                      {dataRow('Signalements émis ou reçus', 'Modération, protection communauté', 'Obligation légale', '3 ans')}
                      {dataRow('Cookies de session', 'Maintien de connexion', 'Nécessaire (exempté consentement)', '30 jours')}
                    </tbody>
                  </table>
                </div>

                <h3 style={h3}>3.2 Principe de minimisation</h3>
                {notice(`${green}12`, `${green}44`, '#2A7A4A', '✅',
                  'Vibz applique strictement le principe de minimisation des données (art. 5 RGPD) : seules les données strictement nécessaires au fonctionnement du service sont collectées. Aucune donnée superflue n\'est demandée ni stockée.'
                )}

                <h3 style={h3}>3.3 Données jamais collectées</h3>
                {ul(
                  <>Numéro de sécurité sociale, numéro de carte d&apos;identité ou passeport.</>,
                  <>Coordonnées bancaires, IBAN, numéro de carte de crédit.</>,
                  <>Données de santé, données génétiques ou biométriques.</>,
                  <>Opinions politiques, convictions religieuses ou philosophiques.</>,
                  <>Données de localisation en temps réel (GPS).</>,
                  <>Contenu de vos appareils, contacts téléphoniques ou galerie photo.</>,
                )}
              </>
            )}

            {/* Art. 4 — Finalités */}
            {art('finalites', '⚖️', 'Article 4 — Finalités & Bases Légales',
              <>
                <p style={{ marginTop: 0 }}>
                  Chaque traitement de données sur Vibz repose sur l&apos;une des six bases légales du RGPD.
                  Vibz n&apos;effectue aucun traitement sans base légale identifiée.
                </p>

                {[
                  {
                    base: '📋 Exécution du contrat', color: blue, items: [
                      'Création et gestion de votre compte.',
                      'Fonctionnement de la messagerie privée et des salons.',
                      'Gestion des likes, matchs et interactions.',
                    ]
                  },
                  {
                    base: '✅ Consentement explicite', color: green, items: [
                      'Affichage de votre photo de profil publiquement.',
                      'Affichage de vos liens réseaux sociaux sur votre profil.',
                      'Réception d\'emails de notifications (matchs, messages, événements).',
                      'Partage de votre ville pour les suggestions géolocalisées.',
                    ]
                  },
                  {
                    base: '🔐 Intérêt légitime', color: '#A78BDB', items: [
                      'Analyse des logs de connexion pour détecter les fraudes et multi-comptes.',
                      'Amélioration continue de VibzGuard (modération IA).',
                      'Statistiques d\'utilisation anonymisées pour améliorer le service.',
                    ]
                  },
                  {
                    base: '⚖️ Obligation légale', color: pink, items: [
                      'Conservation des signalements (réquisitions judiciaires éventuelles).',
                      'Signalement aux autorités de contenus illicites (PHAROS, cybercrime).',
                      'Réponse aux demandes légitimes des autorités judiciaires françaises.',
                    ]
                  },
                ].map(g => (
                  <div key={g.base} style={{ padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${g.color}33`, background: `${g.color}0A`, marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: g.color, marginBottom: 8 }}>{g.base}</div>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {g.items.map((it, i) => <li key={i} style={{ fontSize: 13, marginBottom: 4, color: '#4A5470' }}>{it}</li>)}
                    </ul>
                  </div>
                ))}

                {notice('#FFF5F8', `${pink}44`, '#7A1F40', '🚫',
                  <>Vibz n&apos;effectue <strong>aucun profilage commercial, aucune décision automatisée impactant vos droits</strong> (art. 22 RGPD), et aucune vente de profils à des tiers.</>
                )}
              </>
            )}

            {/* Art. 5 — Ce que nous ne faisons jamais */}
            {art('non_collecte', '🚫', 'Article 5 — Ce que Vibz Ne Fait Jamais',
              <>
                {notice('#FFF5F8', `${pink}44`, '#7A1F40', '🔴',
                  'Ces engagements sont absolus, permanents et non modifiables par une quelconque mise à jour future des CGU ou de cette politique, sauf obligation légale contraire expressément identifiée.'
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { icon: '💰', title: 'Zéro revente', desc: 'Nous ne vendons jamais vos données personnelles à des entreprises tierces, annonceurs ou courtiers en données.' },
                    { icon: '📢', title: 'Zéro ciblage publicitaire', desc: 'Vibz ne montre aucune publicité ciblée. Aucun profil publicitaire n\'est constitué à partir de votre comportement.' },
                    { icon: '🤖', title: 'Zéro profilage commercial', desc: 'Vos préférences musicales et relationnelles ne sont jamais utilisées à des fins commerciales ou revendues.' },
                    { icon: '👁️', title: 'Zéro lecture de vos MP', desc: 'Vos messages privés ne sont lus par aucun humain sauf signalement validé par un membre et revue modération.' },
                    { icon: '📍', title: 'Zéro géolocalisation temps réel', desc: 'Vibz ne collecte jamais votre position GPS en temps réel. Seule la ville que vous renseignez manuellement est utilisée.' },
                    { icon: '🏦', title: 'Zéro donnée bancaire', desc: 'Vibz ne demande, ne stocke et ne traite jamais de données bancaires ou de paiement (le service est gratuit).' },
                    { icon: '🧒', title: 'Zéro donnée enfant', desc: 'Aucune donnée concernant un mineur de moins de 18 ans n\'est délibérément collectée ni conservée.' },
                    { icon: '🌐', title: 'Zéro transfert non encadré hors UE', desc: 'Aucune donnée n\'est transférée hors de l\'Union Européenne sans garanties adéquates (voir Art. 13).' },
                  ].map(b => (
                    <div key={b.title} style={{ padding: '16px', background: '#F8FBFF', borderRadius: 14, border: '1.5px solid #EEF2FA' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{b.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1E2E', marginBottom: 4 }}>{b.title}</div>
                      <div style={{ fontSize: 12, color: '#6B7A9A', lineHeight: 1.6 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Art. 6 — VibzGuard */}
            {art('vibzguard', '🛡️', 'Article 6 — VibzGuard & Analyse IA des Messages',
              <>
                {notice(`${green}12`, `${green}44`, '#2A7A4A', '🤖',
                  'VibzGuard est le système d\'intelligence artificielle de modération de Vibz. Son traitement des messages est encadré par le RGPD et repose sur l\'intérêt légitime de protection de la communauté.'
                )}

                <h3 style={h3}>6.1 Ce que VibzGuard analyse</h3>
                {ul(
                  'Le contenu textuel de chaque message (salons publics et messagerie privée).',
                  'La fréquence d\'envoi (détection spam/flood).',
                  'Les patterns comportementaux répétés (harcèlement en série).',
                )}

                <h3 style={h3}>6.2 Ce que VibzGuard ne fait pas</h3>
                {ul(
                  'VibzGuard n\'enregistre pas les messages non problématiques dans une base de données d\'entraînement externe.',
                  'VibzGuard ne constitue pas de profil psychologique ou comportemental à des fins commerciales.',
                  'VibzGuard ne prend aucune décision définitive sans possibilité de recours humain (suspension définitive = revue humaine obligatoire).',
                  <>VibzGuard n&apos;est pas partagé avec des tiers, il est exclusivement opéré par Vibz.</>,
                )}

                <h3 style={h3}>6.3 Transparence algorithmique</h3>
                <p>
                  Conformément à l&apos;article 22 du RGPD, toute décision automatisée impactant significativement
                  un membre (suspension, blocage de compte) peut faire l&apos;objet d&apos;une demande d&apos;explication et
                  d&apos;une revue humaine via <strong>appeal@vibz.app</strong>.
                </p>

                <h3 style={h3}>6.4 Conservation des données de modération</h3>
                {ul(
                  'Les messages bloqués sont conservés 30 jours (pour recours), puis supprimés.',
                  'Les flags de compte sont conservés 1 an pour détecter les récidives.',
                  'Les signalements traités sont conservés 3 ans (obligation légale).',
                )}
              </>
            )}

            {/* Art. 7 — Conservation */}
            {art('conservation', '⏱️', 'Article 7 — Durée de Conservation',
              <>
                {notice(`${blue}12`, `${blue}44`, '#2A6090', '⏱️',
                  'Vibz applique le principe de limitation de la conservation (art. 5 §1 e) RGPD) : aucune donnée n\'est conservée au-delà de ce qui est strictement nécessaire.'
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FBFF' }}>
                        {['Type de donnée', 'Durée', 'Motif'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 800, color: '#9BA8C0', fontSize: 10, letterSpacing: 0.5, borderBottom: '1.5px solid #EEF2FA', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Compte actif (profil, préférences)', 'Durée du compte', 'Service en cours'],
                        ['Messages privés', '2 ans glissants', 'Service + modération'],
                        ['Messages dans les salons', '1 an glissant', 'Historique communauté'],
                        ['Logs de connexion (IP, device)', '90 jours', 'Sécurité, fraude'],
                        ['Signalements & décisions de modération', '3 ans', 'Obligation légale, récidive'],
                        ['Messages bloqués par VibzGuard', '30 jours', 'Recours possible'],
                        ['Données après suppression du compte', '30 jours (délai de grâce)', 'Réactivation possible'],
                        ['Données archivées post-suppression', '1 an (anonymisées)', 'Obligation comptable / légale'],
                        ['Comptes suspendus pour faute grave', '5 ans (identifiants techniques)', 'Prévention multi-comptes'],
                        ['Cookies de session', '30 jours', 'Maintien de connexion'],
                      ].map(([type, duree, motif], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#F8FBFF' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 600 }}>{type}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 800, color: blue }}>{duree}</td>
                          <td style={{ padding: '9px 12px', color: '#6B7A9A' }}>{motif}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: 14 }}>
                  {notice(`${green}12`, `${green}44`, '#2A7A4A', '🗑️',
                    'À l\'issue de chaque délai de conservation, les données sont supprimées automatiquement de façon irréversible ou anonymisées de manière à ne plus permettre l\'identification de la personne concernée.'
                  )}
                </div>
              </>
            )}

            {/* Art. 8 — Partage */}
            {art('partage', '🔗', 'Article 8 — Partage des Données',
              <>
                <h3 style={h3}>8.1 Sous-traitants techniques (liste exhaustive)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                  {[
                    { name: 'Supabase Inc.', role: 'Base de données, authentification, stockage fichiers', location: '🇩🇪 Frankfurt (UE)', garantie: 'Contrat DPA RGPD signé' },
                    { name: 'Vercel Inc.', role: 'Hébergement application, CDN, déploiement', location: '🇪🇺 UE (edge network)', garantie: 'Contrat DPA RGPD signé' },
                    { name: 'Google Fonts', role: 'Polices typographiques (Nunito)', location: '🇺🇸 USA — SCC UE-USA', garantie: 'Clauses Contractuelles Types' },
                  ].map(s => (
                    <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 12, padding: '12px 16px', background: '#F8FBFF', borderRadius: 12, border: '1.5px solid #EEF2FA', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7A9A' }}>{s.role}</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1A1E2E' }}>{s.location}</div>
                        <div style={{ fontSize: 10, color: green, fontWeight: 700 }}>{s.garantie}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <h3 style={h3}>8.2 Partage avec les autorités</h3>
                {notice(`${pink}12`, `${pink}44`, '#7A1F40', '⚖️',
                  'Vibz peut être légalement contraint de communiquer des données aux autorités judiciaires françaises (Police nationale, Gendarmerie, PHAROS) sur présentation d\'une réquisition judiciaire valide. Vibz ne communique que les données strictement exigées par la réquisition.'
                )}

                <h3 style={h3}>8.3 Ce qui n&apos;est jamais partagé</h3>
                {ul(
                  'Aucune donnée n\'est partagée avec des annonceurs ou partenaires commerciaux.',
                  'Aucune donnée n\'est vendue à des courtiers en données.',
                  'Aucune donnée n\'est partagée avec d\'autres plateformes de rencontres concurrentes.',
                  'Le contenu de vos messages privés n\'est jamais partagé avec des tiers, sauf réquisition judiciaire.',
                )}
              </>
            )}

            {/* Art. 9 — Sécurité */}
            {art('securite', '🔐', 'Article 9 — Sécurité Technique',
              <>
                {notice(`${green}12`, `${green}44`, '#2A7A4A', '🔐',
                  'La sécurité de vos données est une priorité technique de premier rang chez Vibz. Nous appliquons l\'état de l\'art en matière de sécurité informatique.'
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { icon: '🔒', title: 'Chiffrement en transit', desc: 'Toutes les communications entre votre navigateur et nos serveurs utilisent TLS 1.3 (HTTPS obligatoire, HSTS activé).' },
                    { icon: '🗄️', title: 'Chiffrement au repos', desc: 'Les données stockées en base de données sont chiffrées par AES-256 au niveau du stockage Supabase.' },
                    { icon: '🔑', title: 'Mots de passe hachés', desc: 'Les mots de passe sont hachés avec bcrypt (coût 12). Vibz ne connaît jamais votre mot de passe en clair.' },
                    { icon: '🪙', title: 'JWT sécurisés', desc: 'L\'authentification utilise des tokens JWT signés avec expiration automatique (1h access, 7j refresh).' },
                    { icon: '🛡️', title: 'RLS Supabase', desc: 'Row Level Security activé sur toutes les tables : chaque utilisateur ne peut accéder qu\'à ses propres données.' },
                    { icon: '🚦', title: 'Rate limiting', desc: 'Protection contre les attaques par force brute : blocage après 5 tentatives échouées, CAPTCHA déclenché.' },
                    { icon: '🔍', title: 'Audit & logs', desc: 'Journalisation des accès administrateurs et des opérations sensibles sur les données personnelles.' },
                    { icon: '🚨', title: 'Notification violation', desc: 'En cas de violation de données, vous serez notifié dans les 72h, conformément à l\'art. 33-34 RGPD.' },
                  ].map(b => (
                    <div key={b.title} style={{ padding: '14px 16px', background: '#F8FBFF', borderRadius: 12, border: '1.5px solid #EEF2FA' }}>
                      <div style={{ fontSize: 20, marginBottom: 5 }}>{b.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 12, color: '#1A1E2E', marginBottom: 4 }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: '#6B7A9A', lineHeight: 1.6 }}>{b.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Art. 10 — Droits */}
            {art('droits', '✅', 'Article 10 — Vos Droits RGPD',
              <>
                {notice(`${blue}12`, `${blue}44`, '#2A6090', '✅',
                  <>Vous disposez de <strong>6 droits fondamentaux</strong> sur vos données, garantis par le RGPD. Vibz s&apos;engage à répondre à toute demande dans un délai maximum de <strong>30 jours</strong>.</>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    {
                      droit: '📂 Droit d\'accès (art. 15)',
                      desc: 'Vous pouvez obtenir à tout moment une copie exhaustive de toutes vos données personnelles que Vibz détient.',
                      comment: 'Réponse sous 30 jours — export au format JSON ou CSV',
                      color: blue,
                    },
                    {
                      droit: '✏️ Droit de rectification (art. 16)',
                      desc: 'Vous pouvez corriger toute donnée inexacte, incomplète ou obsolète directement depuis votre profil ou par demande écrite.',
                      comment: 'Correction immédiate via profil ou sous 15 jours sur demande',
                      color: green,
                    },
                    {
                      droit: '🗑️ Droit à l\'effacement — "droit à l\'oubli" (art. 17)',
                      desc: 'Vous pouvez demander la suppression définitive de votre compte et de l\'ensemble de vos données. La suppression intervient dans les 30 jours, sauf données soumises à obligation légale de conservation.',
                      comment: 'Suppression complète sous 30 jours — délai de grâce 30j avant exécution',
                      color: pink,
                    },
                    {
                      droit: '⏸️ Droit à la limitation (art. 18)',
                      desc: 'Vous pouvez demander la suspension temporaire du traitement de vos données (le compte reste existant mais les données ne sont plus utilisées) pendant l\'examen d\'une contestation.',
                      comment: 'Activation sous 72h sur demande écrite',
                      color: '#A78BDB',
                    },
                    {
                      droit: '📦 Droit à la portabilité (art. 20)',
                      desc: 'Vous pouvez recevoir vos données dans un format structuré, couramment utilisé et lisible par machine (JSON), pour les transmettre à un autre service.',
                      comment: 'Export disponible dans les paramètres du compte ou sur demande',
                      color: '#52A0D8',
                    },
                    {
                      droit: '🚫 Droit d\'opposition (art. 21)',
                      desc: 'Vous pouvez vous opposer à tout moment au traitement de vos données fondé sur l\'intérêt légitime de Vibz (statistiques, amélioration IA). Ce droit ne s\'applique pas aux traitements nécessaires à l\'exécution du contrat.',
                      comment: 'Traitement de l\'opposition sous 30 jours',
                      color: '#C07040',
                    },
                  ].map(r => (
                    <div key={r.droit} style={{ padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${r.color}33`, background: `${r.color}08` }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: r.color, marginBottom: 6 }}>{r.droit}</div>
                      <div style={{ fontSize: 13, color: '#4A5470', lineHeight: 1.7, marginBottom: 6 }}>{r.desc}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9BA8C0' }}>⏱️ {r.comment}</div>
                    </div>
                  ))}
                </div>

                <h3 style={h3}>Comment exercer vos droits</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    { icon: '⚙️', label: 'Via les paramètres', desc: 'Profil → Confidentialité → Mes données' },
                    { icon: '📧', label: 'Par email', desc: 'privacy@vibz.app — réponse sous 30j' },
                    { icon: '🏛️', label: 'Réclamation CNIL', desc: 'cnil.fr si réponse insatisfaisante' },
                  ].map(c => (
                    <div key={c.label} style={{ padding: '14px', background: '#F8FBFF', borderRadius: 12, border: '1.5px solid #EEF2FA', textAlign: 'center' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 12, color: '#1A1E2E', marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 11, color: '#9BA8C0' }}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Art. 11 — Cookies */}
            {art('cookies', '🍪', 'Article 11 — Cookies & Traceurs',
              <>
                {notice(`${green}12`, `${green}44`, '#2A7A4A', '🍪',
                  'Vibz utilise uniquement des cookies strictement nécessaires au fonctionnement du service. Aucun cookie publicitaire, aucun cookie de pistage inter-sites, aucun pixel de suivi tiers.'
                )}

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#F8FBFF' }}>
                        {['Cookie', 'Finalité', 'Durée', 'Consentement'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 800, color: '#9BA8C0', fontSize: 10, letterSpacing: 0.5, borderBottom: '1.5px solid #EEF2FA', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['sb-auth-token', 'Maintien de la session Supabase', '30 jours', tag('Nécessaire', '#2A7A4A', `${green}18`)],
                        ['sb-refresh-token', 'Renouvellement automatique session', '7 jours', tag('Nécessaire', '#2A7A4A', `${green}18`)],
                        ['vibz-theme', 'Préférence d\'affichage (mode clair)', 'Session', tag('Nécessaire', '#2A7A4A', `${green}18`)],
                        ['_vercel-analytics', 'Statistiques anonymes (Vercel Analytics)', '90 jours', tag('Optionnel', '#2A6090', `${blue}18`)],
                      ].map(([name, fin, dur, tag], i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#F8FBFF' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>{name}</td>
                          <td style={{ padding: '9px 12px', color: '#4A5470' }}>{fin}</td>
                          <td style={{ padding: '9px 12px', fontWeight: 700 }}>{dur}</td>
                          <td style={{ padding: '9px 12px' }}>{tag}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p style={{ marginTop: 14, fontSize: 13, color: '#6B7A9A' }}>
                  Les cookies nécessaires sont exemptés de consentement (délibération CNIL — lignes directrices cookies 2020).
                  Le cookie analytics est désactivé par défaut et n&apos;est activé qu&apos;avec votre accord explicite.
                </p>
              </>
            )}

            {/* Art. 12 — Mineurs */}
            {art('mineurs', '🧒', 'Article 12 — Mineurs & Données Sensibles',
              <>
                {notice('#FFF5F8', `${pink}44`, '#7A1F40', '🔴',
                  <>Vibz est <strong>exclusivement réservé aux personnes majeures (18 ans et plus)</strong>. La collecte intentionnelle de données concernant un mineur est strictement prohibée et fera l&apos;objet d&apos;une suppression immédiate et d&apos;un signalement aux autorités compétentes.</>
                )}

                {ul(
                  'Si Vibz constate qu\'un compte appartient à un mineur, le compte est immédiatement suspendu et toutes les données associées supprimées dans les 48h.',
                  'Le parent ou tuteur légal d\'un mineur ayant utilisé Vibz peut contacter privacy@vibz.app pour demander la suppression immédiate de toutes les données.',
                  <>Vibz ne collecte aucune donnée relevant des catégories spéciales au sens de l&apos;art. 9 RGPD (santé, religion, opinions politiques, orientation sexuelle, données biométriques) — sauf consentement explicite et déclaratif du membre pour son orientation sexuelle dans le cadre des préférences de rencontre.</>,
                )}
              </>
            )}

            {/* Art. 13 — Transferts */}
            {art('transferts', '🌍', 'Article 13 — Transferts Hors Union Européenne',
              <>
                <p style={{ marginTop: 0 }}>
                  Vibz héberge la majorité de ses données au sein de l&apos;Union Européenne (serveurs Supabase à Frankfurt, Allemagne).
                  Certains sous-traitants techniques sont établis hors UE. Vibz encadre ces transferts par les garanties suivantes :
                </p>

                {[
                  { dest: '🇺🇸 Vercel Inc. (USA)', garantie: 'Standard Contractual Clauses (SCC) UE-USA + Supplementary Measures', niveau: 'Adéquat' },
                  { dest: '🇺🇸 Google Fonts (USA)', garantie: 'SCC UE-USA — police typographique uniquement (aucune donnée personnelle)', niveau: 'Minime' },
                ].map(t => (
                  <div key={t.dest} style={{ padding: '14px 18px', borderRadius: 12, border: '1.5px solid #EEF2FA', background: '#F8FBFF', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: '#1A1E2E', marginBottom: 3 }}>{t.dest}</div>
                      <div style={{ fontSize: 12, color: '#6B7A9A' }}>{t.garantie}</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: `${green}18`, color: '#2A7A4A', flexShrink: 0 }}>Risque {t.niveau}</span>
                  </div>
                ))}

                {notice(`${blue}12`, `${blue}44`, '#2A6090', '🇪🇺',
                  'Vibz privilégie en permanence des sous-traitants établis dans l\'UE. Tout nouveau sous-traitant hors UE fait l\'objet d\'une analyse d\'impact (AIPD) et d\'une mise à jour de la présente politique avant activation.'
                )}
              </>
            )}

            {/* Art. 14 — Contact */}
            {art('contact', '📧', 'Article 14 — Contact, DPO & Réclamations',
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                  {[
                    { icon: '🔒', label: 'Données & vie privée', email: 'privacy@vibz.app', delai: '30 jours max' },
                    { icon: '🛡️', label: 'DPO (Délégué Protection Données)', email: 'dpo@vibz.app', delai: '30 jours max' },
                    { icon: '⚖️', label: 'Juridique & RGPD', email: 'legal@vibz.app', delai: '15 jours ouvrés' },
                    { icon: '🚨', label: 'Recours modération', email: 'appeal@vibz.app', delai: '72h pour suspensions' },
                  ].map(c => (
                    <div key={c.label} style={{ padding: '16px', background: '#F8FBFF', borderRadius: 14, border: '1.5px solid #EEF2FA' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 12, color: '#1A1E2E', marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 13, color: blue, fontWeight: 700, marginBottom: 3 }}>{c.email}</div>
                      <div style={{ fontSize: 11, color: '#9BA8C0' }}>Réponse sous {c.delai}</div>
                    </div>
                  ))}
                </div>

                <h3 style={h3}>Réclamation auprès de la CNIL</h3>
                <p>
                  Si vous estimez que Vibz ne respecte pas vos droits en matière de données personnelles et que notre
                  réponse est insatisfaisante, vous pouvez introduire une réclamation auprès de la{' '}
                  <strong>Commission Nationale de l&apos;Informatique et des Libertés (CNIL)</strong> :
                </p>
                <div style={{ padding: '14px 18px', background: '#F8FBFF', borderRadius: 12, border: '1.5px solid #EEF2FA', fontSize: 13 }}>
                  🌐 <strong>cnil.fr</strong> — Formulaire en ligne<br />
                  📮 CNIL, 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07<br />
                  📞 01 53 73 22 22
                </div>

                <div style={{ marginTop: 18, padding: '14px 18px', background: `${green}10`, borderRadius: 12, border: `1.5px solid ${green}33`, fontSize: 12, color: '#2A7A4A', fontWeight: 700, lineHeight: 1.75 }}>
                  📅 <strong>Version :</strong> 1.0 — Mai 2026<br />
                  🔄 <strong>Prochaine révision prévue :</strong> Novembre 2026<br />
                  📋 <strong>Historique des versions :</strong> disponible sur demande à legal@vibz.app
                </div>
              </>
            )}

            {/* Footer */}
            <div style={{
              background: `linear-gradient(135deg, ${blue}18, ${green}18)`,
              border: `1.5px solid ${blue}33`, borderRadius: 20,
              padding: '28px 32px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🦋</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1E2E', marginBottom: 8 }}>
                Vos données vous appartiennent. Toujours.
              </div>
              <div style={{ fontSize: 13, color: '#6B7A9A', lineHeight: 1.8, marginBottom: 22, maxWidth: 500, margin: '0 auto 22px' }}>
                Chez Vibz, la confiance se mérite. Cette politique n&apos;est pas un document juridique abstrait —
                c&apos;est un engagement concret envers chaque membre de la communauté.
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <a href="/" style={{ padding: '12px 28px', borderRadius: 14, background: `linear-gradient(135deg,${pink},${blue})`, color: 'white', fontWeight: 800, fontSize: 13, textDecoration: 'none', fontFamily: font }}>
                  ← Retour à Vibz
                </a>
                <a href="/conditions" style={{ padding: '12px 28px', borderRadius: 14, border: `1.5px solid ${blue}44`, background: 'white', color: '#2A6090', fontWeight: 800, fontSize: 13, textDecoration: 'none', fontFamily: font }}>
                  Lire les CGU →
                </a>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  )
}
