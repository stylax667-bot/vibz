// ── MusicCard — carte de prévisualisation de lien musical ────────────────────
// Utilisé dans les salons, la messagerie et le profil

import { useState } from 'react'
import { detectPlatform, getEmbedUrl } from '../../lib/musicPlatforms'
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

// ── Détecte si un texte de message contient un lien musical ──────────────────
export function extractMusicUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/)
  if (!urlMatch) return null
  const url = urlMatch[0]
  if (detectPlatform(url)) return url
  return null
}
