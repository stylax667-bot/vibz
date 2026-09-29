// GET /api/og — image d'aperçu des liens partagés (WhatsApp, Facebook, X, LinkedIn, Discord…)
// et image de story (format=story, 1080×1920) pour Instagram, TikTok, Snapchat.
// Aucun texte libre n'est accepté : un profil par son id, des ingrédients du catalogue,
// un badge connu. Impossible de fabriquer une fausse image Vibz avec n'importe quel message.
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { CATALOG_BY_ID } from '../../lib/musicCatalog'

export const config = { runtime: 'edge' }

const BADGES: Record<string, { icon: string; name: string }> = {
  graine:  { icon: '🌱', name: 'Première graine' },
  connect: { icon: '🤝', name: 'Connecteur' },
  tisseur: { icon: '🕸️', name: 'Tisseur' },
  onde:    { icon: '🌊', name: 'Onde de choc' },
  monde:   { icon: '🌍', name: 'Relié à tout Vibz' },
}

type Member = { tagline: string | null; display_name: string; instruments: string[]; music_genres: string[]; city: string | null; avatar_url: string | null }

async function member(id: string): Promise<Member | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  let rows: Record<string, any>[] = []
  try {
    const r = await fetch(`${url}/rest/v1/profiles?id=eq.${id}&select=tagline,display_name,username,instruments,music_genres,city,show_location,avatar_url,is_banned`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } })
    rows = r.ok ? await r.json() : []
  } catch { return null }   // base injoignable : image générique plutôt qu'une erreur
  const p = rows[0]
  if (!p || p.is_banned) return null
  return {
    display_name: (p.display_name || p.username || 'Membre Vibz').slice(0, 40),
    tagline: p.tagline ? String(p.tagline).slice(0, 90) : null,
    instruments: (p.instruments || []).slice(0, 3),
    music_genres: (p.music_genres || []).slice(0, 3),
    city: p.show_location === false ? null : (p.city || null),
    avatar_url: p.avatar_url || null,
  }
}

async function font(weight: 700 | 800) {
  try {
    const r = await fetch(`https://cdn.jsdelivr.net/fontsource/fonts/nunito@latest/latin-${weight}-normal.woff`)
    return r.ok ? await r.arrayBuffer() : null
  } catch { return null }
}

const INK = '#1A1E2E'
const SUB = '#4A5068'

export default async function handler(req: NextRequest) {
  const q = new URL(req.url).searchParams
  const story = q.get('format') === 'story'
  const W = story ? 1080 : 1200
  const H = story ? 1920 : 630
  const t = q.get('t') || 'app'

  let icon = '🦋'
  let kicker = 'Rencontres entre musiciens et musiciennes'
  let title = 'Vibz'
  let lines: string[] = ['Trouve avec qui jouer, près de chez toi']
  let chips: string[] = []
  let photo: string | null = null

  if (t === 'profile' || t === 'collab') {
    const m = await member(q.get('id') || '')
    if (m) {
      title = m.display_name
      photo = m.avatar_url
      icon = '🎵'
      kicker = t === 'collab' ? 'Cherche des musiciens pour jouer' : 'Musicien·ne sur Vibz'
      lines = [m.tagline ? `« ${m.tagline} »` : '', m.city ? `📍 ${m.city}` : ''].filter(Boolean)
      chips = [...m.instruments, ...m.music_genres].slice(0, 5)
    }
  } else if (t === 'mix') {
    const tags = (q.get('tags') || '').split(/[+ ,]/).filter(id => CATALOG_BY_ID[id]).slice(0, 6)
    if (tags.length) {
      icon = CATALOG_BY_ID[tags[0]].emoji
      kicker = 'Un mélange à rejoindre sur Vibz'
      title = tags.map(id => CATALOG_BY_ID[id].label).join(' × ')
      lines = ['Qui en est ? 🎛️']
      chips = tags.map(id => `${CATALOG_BY_ID[id].emoji} ${CATALOG_BY_ID[id].label}`)
    }
  } else if (t === 'badge') {
    const b = BADGES[q.get('b') || '']
    const n = Math.max(0, Math.min(1_000_000, parseInt(q.get('n') || '0', 10) || 0))
    if (b) {
      icon = b.icon
      kicker = 'Badge débloqué sur Vibz'
      title = b.name
      lines = [`Mon réseau touche ${n} musicien${n > 1 ? 's' : ''}`, 'On relie tout le monde en 6 poignées de main ?']
    }
  } else if (t === 'match') {
    icon = '💘'
    kicker = 'Nouveau match musical'
    title = 'Et toi, qui vibre comme toi ?'
    lines = ['Rencontres et collabs entre musiciens']
  }

  const [f700, f800] = await Promise.all([font(700), font(800)])
  const fonts = [
    f700 && { name: 'Nunito', data: f700, weight: 700 as const, style: 'normal' as const },
    f800 && { name: 'Nunito', data: f800, weight: 800 as const, style: 'normal' as const },
  ].filter(Boolean) as { name: string; data: ArrayBuffer; weight: 700 | 800; style: 'normal' }[]

  const s = story ? 1.35 : 1
  const titleSize = Math.round((title.length > 26 ? 60 : 78) * s)

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: story ? '140px 90px' : '60px 72px', fontFamily: 'Nunito',
        background: 'linear-gradient(135deg, #FADADD 0%, #C8E6F5 50%, #C8EFD4 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', width: 64 * s, height: 64 * s, borderRadius: 18 * s, background: 'white', alignItems: 'center', justifyContent: 'center', fontSize: 40 * s }}>🦋</div>
          <div style={{ display: 'flex', fontSize: 40 * s, fontWeight: 800, color: INK, letterSpacing: -1 }}>Vibz</div>
        </div>

        <div style={{ display: 'flex', flexDirection: story ? 'column' : 'row', alignItems: story ? 'flex-start' : 'center', gap: 48 * s }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={220 * s} height={220 * s} style={{ borderRadius: 44 * s, border: '6px solid white', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', width: 220 * s, height: 220 * s, borderRadius: 999, background: '#15171F', alignItems: 'center', justifyContent: 'center', border: '6px solid white' }}>
              <div style={{ display: 'flex', width: 100 * s, height: 100 * s, borderRadius: 999, background: '#F9F8F7', alignItems: 'center', justifyContent: 'center', fontSize: 64 * s }}>{icon}</div>
            </div>
          )}
          <div style={story ? { display: 'flex', flexDirection: 'column', width: '100%', gap: 12 * s } : { display: 'flex', flexDirection: 'column', flex: 1, gap: 12 * s }}>
            <div style={{ display: 'flex', fontSize: 30 * s, fontWeight: 700, color: '#C4547A' }}>{kicker}</div>
            <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 800, color: INK, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
            {lines.map(l => <div key={l} style={{ display: 'flex', fontSize: 32 * s, fontWeight: 700, color: SUB }}>{l}</div>)}
            {chips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                {chips.map(c => <div key={c} style={{ display: 'flex', padding: `${8 * s}px ${20 * s}px`, borderRadius: 999, background: 'white', fontSize: 26 * s, fontWeight: 700, color: INK }}>{c}</div>)}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 30 * s, fontWeight: 800, color: INK }}>vibzmusic.fr</div>
          <div style={{ display: 'flex', padding: `${12 * s}px ${28 * s}px`, borderRadius: 999, background: '#E07A9A', color: 'white', fontSize: 28 * s, fontWeight: 800 }}>Gratuit · Rejoins-nous</div>
        </div>
      </div>
    ),
    {
      width: W, height: H, emoji: 'twemoji', fonts: fonts.length ? fonts : undefined,
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
    },
  )
}
