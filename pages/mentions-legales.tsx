import Head from 'next/head'
import { useTheme } from '../lib/theme'

const font = 'Nunito, sans-serif'

export default function MentionsLegales() {
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
        <title>Mentions légales — Vibz</title>
        <meta name="robots" content="index,follow" />
      </Head>
      <div style={{ background: tk.bg, minHeight: '100vh', padding: '32px 16px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <a href="/" style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: tk.textMuted, textDecoration: 'none' }}>← Retour à Vibz</a>
          <h1 style={{ fontFamily: font, fontSize: 28, fontWeight: 800, color: tk.text, margin: '16px 0 24px' }}>Mentions légales</h1>

          <article style={card}>
            <h2 style={h2}>Éditeur du site</h2>
            <p style={{ margin: 0 }}>
              Le site <strong>Vibz</strong> (https://www.vibz.fr) est édité par :<br />
              <strong>Yves-Marie CHENOT</strong>, entrepreneur individuel (EI), micro-entrepreneur<br />
              Nom commercial : Vibz<br />
              Adresse : Mairie de Pont-Saint-Martin, 44860 Pont-Saint-Martin<br />
              SIREN / SIRET : immatriculation en cours<br />
              Activité : rencontres entre musiciens et musiciennes (code APE en cours d’attribution)<br />
              Email : michael_chesne@outlook.fr
            </p>
          </article>

          <article style={card}>
            <h2 style={h2}>Directeur de la publication</h2>
            <p style={{ margin: 0 }}>Yves-Marie CHENOT, en qualité d&apos;éditeur.</p>
          </article>

          <article style={card}>
            <h2 style={h2}>Hébergement</h2>
            <p style={{ margin: 0 }}>
              <strong>Application web :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com<br />
              <strong>Base de données et authentification :</strong> Supabase Inc. (serveurs situés dans l&apos;Union européenne) — supabase.com
            </p>
          </article>

          <article style={card}>
            <h2 style={h2}>Propriété intellectuelle</h2>
            <p style={{ margin: 0 }}>
              L&apos;ensemble des éléments du site (marque, logo, textes, graphismes, code) est la propriété de l&apos;éditeur, sauf mention contraire.
              Toute reproduction sans autorisation écrite est interdite. Les contenus publiés par les membres restent leur propriété ;
              ils concèdent à Vibz le droit de les afficher dans le cadre du service.
            </p>
          </article>

          <article style={card}>
            <h2 style={h2}>Données personnelles</h2>
            <p style={{ margin: 0 }}>
              Le traitement de vos données est détaillé dans notre <a href="/confidentialite" style={{ color: tk.text, fontWeight: 700 }}>politique de confidentialité</a>.
              Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et d&apos;opposition, que vous pouvez exercer à michael_chesne@outlook.fr.
              En cas de désaccord, vous pouvez saisir la CNIL (cnil.fr).
            </p>
          </article>

          <article style={card}>
            <h2 style={h2}>Signalement de contenu illicite</h2>
            <p style={{ margin: 0 }}>
              Pour signaler un contenu illicite ou un profil abusif, écrivez à michael_chesne@outlook.fr.
              Consultez aussi nos <a href="/conditions" style={{ color: tk.text, fontWeight: 700 }}>conditions d&apos;utilisation</a>.
            </p>
          </article>

          <p style={{ fontFamily: font, fontSize: 12, color: tk.textMuted, textAlign: 'center' }}>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </>
  )
}
