// Page publique d'un profil — cible des liens « Partager mon profil ».
// Rendue côté serveur pour que l'aperçu (WhatsApp, Messenger…) affiche le nom du membre.
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from '../../lib/theme'
import { SITE_URL } from '../../lib/site'
import Avatar from '../../components/shared/Avatar'

type PublicProfile = {
  id: string
  display_name: string
  bio: string | null
  city: string | null
  instruments: string[]
  music_genres: string[]
  avatar_url: string | null
  avatar_emoji: string | null
}

export const getServerSideProps: GetServerSideProps<{ p: PublicProfile }> = async ({ params, res }) => {
  const id = String(params?.id || '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { notFound: true }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(`Profil indisponible : ${error.message}`)   // panne ≠ profil inexistant
  if (!data || data.is_banned) return { notFound: true }

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  return {
    props: {
      p: {
        id: data.id,
        display_name: data.display_name || data.username || 'Membre Vibz',
        bio: data.bio || null,
        city: data.show_location === false ? null : (data.city || null),
        instruments: data.instruments || [],
        music_genres: data.music_genres || [],
        avatar_url: data.avatar_url || null,
        avatar_emoji: data.avatar_emoji || null,
      },
    },
  }
}

export default function PublicProfilePage({ p }: { p: PublicProfile }) {
  const { theme: tk } = useTheme()
  const url = `${SITE_URL}/profil/${p.id}`
  const title = `${p.display_name} sur Vibz`
  const desc = [p.instruments.slice(0, 3).join(', '), p.city].filter(Boolean).join(' · ') || 'Rencontres entre musiciens et musiciennes'
  const chip: React.CSSProperties = { padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta key="description" name="description" content={desc} />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={url} />
        <meta key="og:title" property="og:title" content={title} />
        <meta key="og:description" property="og:description" content={desc} />
        <meta key="og:url" property="og:url" content={url} />
        <meta key="og:type" property="og:type" content="profile" />
        {p.avatar_url && <meta property="og:image" content={p.avatar_url} />}
      </Head>
      <main style={{ minHeight: '100vh', background: tk.bg2, color: tk.text, fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 420, background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 24, padding: '28px 22px', textAlign: 'center', boxShadow: `0 12px 40px ${tk.shadow}` }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <Avatar p={p} size={96} ring={tk.pink} online={false} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', overflowWrap: 'anywhere' }}>{p.display_name}</h1>
          {p.city && <div style={{ fontSize: 14, color: tk.textMuted, marginBottom: 12 }}>📍 {p.city}</div>}
          {p.instruments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
              {p.instruments.map(i => <span key={i} style={{ ...chip, background: tk.pinkLight, color: tk.pinkDark }}>🎵 {i}</span>)}
            </div>
          )}
          {p.music_genres.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
              {p.music_genres.map(g => <span key={g} style={{ ...chip, background: tk.blueLight, color: tk.blueDark }}>{g}</span>)}
            </div>
          )}
          {p.bio && <p style={{ fontSize: 14, lineHeight: 1.55, color: tk.textSub, margin: '12px 0 0', whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{p.bio}</p>}
          <a href="/" style={{ display: 'inline-block', marginTop: 22, padding: '12px 24px', borderRadius: 24, background: tk.pink, color: 'white', fontWeight: 800, fontSize: 15, textDecoration: 'none' }}>
            Rejoindre {p.display_name} sur Vibz 🦋
          </a>
          <div style={{ marginTop: 14, fontSize: 12, color: tk.textMuted }}>Rencontres entre musiciens et musiciennes</div>
        </div>
      </main>
    </>
  )
}
