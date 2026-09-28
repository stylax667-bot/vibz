// Page publique « Supprimer son compte » — lien demandé par Google Play
// (fiche de l'app, rubrique Sécurité des données).
import Head from 'next/head'
import { useTheme } from '../lib/theme'

const font = 'Nunito, sans-serif'
const CONTACT = 'michael_chesne@outlook.fr'

export default function SuppressionCompte() {
  const { theme: tk } = useTheme()

  const card: React.CSSProperties = {
    background: tk.surface, border: `1.5px solid ${tk.border}`,
    borderRadius: 20, padding: '28px 32px', marginBottom: 24,
    fontFamily: font, fontSize: 14, lineHeight: 1.9, color: tk.text,
  }
  const h2: React.CSSProperties = { fontSize: 19, fontWeight: 800, margin: '0 0 12px', paddingBottom: 10, borderBottom: `1.5px solid ${tk.border}` }

  return (
    <>
      <Head>
        <title>Supprimer son compte — Vibz</title>
        <meta name="robots" content="index,follow" />
      </Head>
      <div style={{ background: tk.bg, minHeight: '100vh', padding: '32px 16px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <a href="/" style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: tk.textMuted, textDecoration: 'none' }}>← Retour à Vibz</a>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 800, color: tk.text, margin: '16px 0 24px' }}>Supprimer son compte Vibz</h1>

          <article style={card}>
            <h2 style={h2}>Depuis l&apos;app ou le site</h2>
            <ol style={{ margin: 0, paddingLeft: 20, listStyle: 'decimal' }}>
              <li>Connecte-toi à Vibz (app Android ou www.vibzmusic.fr).</li>
              <li>Ouvre l&apos;onglet <strong>Profil</strong>.</li>
              <li>Tout en bas, touche <strong>Supprimer mon compte</strong>.</li>
              <li>Tape <strong>SUPPRIMER</strong> puis confirme.</li>
            </ol>
          </article>

          <article style={card}>
            <h2 style={h2}>Sans accès à ton compte</h2>
            <p style={{ margin: 0 }}>
              Écris à <a href={`mailto:${CONTACT}?subject=Suppression%20de%20compte`} style={{ color: tk.pink, fontWeight: 700 }}>{CONTACT}</a> depuis
              l&apos;adresse email de ton compte, avec pour objet « Suppression de compte ». La suppression est faite sous 30 jours au plus tard.
            </p>
          </article>

          <article style={card}>
            <h2 style={h2}>Ce qui est effacé</h2>
            <p style={{ margin: 0 }}>
              Immédiatement et définitivement : ton compte, ton profil, ton profil musical, ta photo, tes messages privés et de salons,
              tes likes, tes correspondances, tes réglages et l&apos;historique de modération qui te concerne.
              Plus de détails dans la <a href="/confidentialite" style={{ color: tk.pink, fontWeight: 700 }}>politique de confidentialité</a>.
            </p>
          </article>
        </div>
      </div>
    </>
  )
}
