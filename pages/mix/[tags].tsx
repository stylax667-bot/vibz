// Page publique d'un mélange partagé (« Jazz × Batterie × Saxophone ») : aperçu soigné sur
// les réseaux, puis invitation à rejoindre Vibz — le mélange s'ouvre dans l'onglet Salons.
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useTheme } from '../../lib/theme'
import { SITE_URL } from '../../lib/site'
import { CATALOG_BY_ID } from '../../lib/musicCatalog'

type Item = { id: string; label: string; emoji: string; color: string }

export const getServerSideProps: GetServerSideProps<{ items: Item[] }> = async ({ params, res }) => {
  const ids = String(params?.tags || '').split(/[+ ,]/).filter(id => CATALOG_BY_ID[id]).slice(0, 6)
  if (ids.length === 0) return { notFound: true }
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
  return { props: { items: ids.map(id => { const c = CATALOG_BY_ID[id]; return { id, label: c.label, emoji: c.emoji, color: c.color } }) } }
}

export default function MixPage({ items }: { items: Item[] }) {
  const { theme: tk } = useTheme()
  const key = items.map(i => i.id).join('+')
  const name = items.map(i => i.label).join(' × ')
  const url = `${SITE_URL}/mix/${key}`
  const image = `${SITE_URL}/api/og?t=mix&tags=${encodeURIComponent(key)}`
  const desc = `Un mélange ${name} t'attend sur Vibz. Rejoins les musiciens qui le jouent déjà.`

  return (
    <>
      <Head>
        <title>{`${name} — un mélange Vibz`}</title>
        <meta key="description" name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta key="og:title" property="og:title" content={`${name} — un mélange Vibz`} />
        <meta key="og:description" property="og:description" content={desc} />
        <meta key="og:url" property="og:url" content={url} />
        <meta key="og:image" property="og:image" content={image} />
        <meta key="og:image:alt" property="og:image:alt" content={`Mélange ${name}`} />
        <meta key="twitter:image" name="twitter:image" content={image} />
      </Head>
      <main style={{ minHeight: '100vh', background: tk.bg2, color: tk.text, fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 420, background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 24, padding: '28px 22px', textAlign: 'center', boxShadow: `0 12px 40px ${tk.shadow}` }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: tk.pink, marginBottom: 6 }}>🎛️ Un mélange t&apos;attend</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 14px', overflowWrap: 'anywhere' }}>{name}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {items.map(i => (
              <span key={i.id} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: `${i.color}22`, color: tk.text, border: `1px solid ${i.color}66` }}>
                {i.emoji} {i.label}
              </span>
            ))}
          </div>
          <a href={`/?mix=${encodeURIComponent(key)}`} style={{ display: 'inline-block', marginTop: 22, padding: '12px 24px', borderRadius: 24, background: tk.pink, color: 'white', fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            Rejoindre ce mélange 🦋
          </a>
          <div style={{ marginTop: 14, fontSize: 12, color: tk.textMuted }}>Gratuit · rencontres et collabs entre musiciens</div>
        </div>
      </main>
    </>
  )
}
