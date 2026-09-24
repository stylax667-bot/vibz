// ── MusicCard — carte de prévisualisation de lien musical ────────────────────
// Utilisé dans les salons, la messagerie et le profil

import { useState } from 'react'
import { detectPlatform, getEmbedUrl, youtubeId, youtubeEmbedUrl, youtubeThumb } from '../../lib/musicPlatforms'
import { useTheme } from '../../lib/theme'

interface Props {
  url: string
  compact?: boolean   // version petite pour chat
}

export default function MusicCard({ url, compact = false }: Props) {
  const { theme: tk } = useTheme()
  const [embedOpen, setEmbedOpen] = useState(false)

  const platform = detectPlatform(url)
  if (!platform) return null

  // YouTube : miniature tout de suite, lecture sur place au clic, lien de secours
  const ytId = platform.id === 'youtube' || platform.id === 'youtubemusic' ? youtubeId(url) : null
  if (ytId) return <YouTubeCard url={url} id={ytId} compact={compact} />

  const embedUrl = getEmbedUrl(url)

  const embedHeight =
    platform.id === 'youtube' || platform.id === 'youtubemusic' ? (compact ? 200 : 280) :
    platform.id === 'soundcloud' ? 120 :
    152

  return (
    <div style={{
      marginTop: 6,
      borderRadius: compact ? 12 : 16,
      overflow: 'hidden',
      border: `1.5px solid ${platform.color}44`,
      background: tk.isDark
        ? `color-mix(in srgb, ${platform.color} 8%, ${tk.surface})`
        : platform.bg,
      maxWidth: compact ? 360 : 480,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: compact ? '8px 12px' : '12px 16px',
      }}>
        <span style={{ fontSize: compact ? 16 : 20, flexShrink: 0 }}>{platform.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: compact ? 10 : 11, fontWeight: 800, color: platform.color, marginBottom: 1 }}>
            {platform.name}
          </div>
          <a
            href={url} target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: compact ? 11 : 12, color: tk.textSub,
              textDecoration: 'none', fontWeight: 600,
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {url.length > (compact ? 40 : 55) ? url.slice(0, compact ? 40 : 55) + '…' : url}
          </a>
        </div>

        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {/* Ouvrir dans l'app */}
          <a
            href={url} target="_blank" rel="noopener noreferrer"
            style={{
              width: 26, height: 26, borderRadius: 7,
              background: `${platform.color}18`,
              border: `1px solid ${platform.color}44`,
              color: platform.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, textDecoration: 'none', fontWeight: 800,
            }}
            title={`Ouvrir dans ${platform.name}`}
          >↗</a>

          {/* Toggle lecteur */}
          {embedUrl && (
            <button
              onClick={() => setEmbedOpen(v => !v)}
              style={{
                height: 26, padding: '0 10px', borderRadius: 7,
                background: embedOpen ? platform.color : `${platform.color}18`,
                border: `1px solid ${platform.color}44`,
                color: embedOpen ? 'white' : platform.color,
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Nunito, sans-serif',
                display: 'flex', alignItems: 'center', gap: 4,
              }}
              title={embedOpen ? 'Fermer le lecteur' : 'Écouter ici'}
            >
              {embedOpen ? '✕' : '▶'} {embedOpen ? 'Fermer' : 'Écouter'}
            </button>
          )}
        </div>
      </div>

      {/* Lecteur intégré */}
      {embedUrl && embedOpen && (
        <iframe
          src={embedUrl}
          width="100%"
          height={embedHeight}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title={`Lecteur ${platform.name}`}
          style={{ display: 'block', border: 'none' }}
        />
      )}
    </div>
  )
}

// ── Vidéo YouTube intégrée ────────────────────────────────────────────────────
function YouTubeCard({ url, id, compact }: { url: string; id: string; compact: boolean }) {
  const { theme: tk } = useTheme()
  const [playing, setPlaying] = useState(false)
  const [thumbOk, setThumbOk] = useState(true)
  return (
    <div style={{ marginTop: 6, borderRadius: compact ? 12 : 16, overflow: 'hidden', border: '1.5px solid #FF000033', background: tk.surface, width: '100%', maxWidth: compact ? 360 : 480 }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
        {playing ? (
          <iframe src={youtubeEmbedUrl(id, true)} title="Vidéo YouTube" loading="lazy"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }} />
        ) : (
          <button onClick={() => setPlaying(true)} aria-label="Lire la vidéo ici"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer', background: '#111' }}>
            {thumbOk && <img src={youtubeThumb(id)} alt="" loading="lazy" onError={() => setThumbOk(false)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 58, height: 40, borderRadius: 12, background: '#FF0000', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.4)' }}>▶</span>
          </button>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: compact ? '7px 10px' : '9px 14px', fontFamily: 'Nunito, sans-serif' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#FF0000', whiteSpace: 'nowrap' }}>▶️ YouTube</span>
        <span style={{ flex: 1, fontSize: 10.5, color: tk.textMuted, minWidth: 0 }}>
          {playing ? 'La vidéo ne démarre pas ? Son auteur interdit peut-être la lecture hors de YouTube.' : 'Touche la vidéo pour la lire ici'}
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 11, fontWeight: 800, color: '#FF0000', textDecoration: 'none', whiteSpace: 'nowrap' }}>Voir sur YouTube ↗</a>
      </div>
    </div>
  )
}

// ── Détecte si un texte de message contient un lien musical ──────────────────
export function extractMusicUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/)
  if (!urlMatch) return null
  const url = urlMatch[0].replace(/[).,;!?»"']+$/, '')
  if (detectPlatform(url)) return url
  return null
}
