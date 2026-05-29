// ── Détection & configuration des plateformes musicales ──────────────────────

export type MusicPlatformId =
  | 'spotify' | 'deezer' | 'soundcloud' | 'youtube' | 'youtubemusic'
  | 'applemusic' | 'bandcamp' | 'mixcloud' | 'tidal' | 'qobuz'
  | 'audiomack' | 'boomplay' | 'jamendo' | 'other'

export interface MusicPlatform {
  id: MusicPlatformId
  name: string
  icon: string        // emoji
  color: string       // couleur de marque
  bg: string          // fond de la carte
  patterns: RegExp[]  // patterns d'URL
  embedFn?: (url: string) => string | null  // transforme URL → embed src
  placeholder: string
}

export const MUSIC_PLATFORMS: MusicPlatform[] = [
  {
    id: 'spotify',
    name: 'Spotify',
    icon: '🎧',
    color: '#1DB954',
    bg: 'rgba(29,185,84,0.10)',
    placeholder: 'https://open.spotify.com/track/... ou /playlist/... ou /album/...',
    patterns: [/open\.spotify\.com/],
    embedFn: (url) => {
      // open.spotify.com/track/ID → open.spotify.com/embed/track/ID
      const m = url.match(/open\.spotify\.com\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/)
      if (!m) return null
      return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`
    },
  },
  {
    id: 'deezer',
    name: 'Deezer',
    icon: '🎵',
    color: '#A238FF',
    bg: 'rgba(162,56,255,0.10)',
    placeholder: 'https://www.deezer.com/fr/track/... ou /playlist/... ou /album/...',
    patterns: [/deezer\.com/],
    embedFn: (url) => {
      const m = url.match(/deezer\.com\/(?:[a-z]{2}\/)?(track|album|playlist|artist)\/(\d+)/)
      if (!m) return null
      const type = m[1] === 'track' ? 'track' : m[1] === 'album' ? 'album' : m[1] === 'playlist' ? 'playlist' : 'artist'
      return `https://widget.deezer.com/widget/dark/${type}/${m[2]}`
    },
  },
  {
    id: 'soundcloud',
    name: 'SoundCloud',
    icon: '🔊',
    color: '#FF5500',
    bg: 'rgba(255,85,0,0.10)',
    placeholder: 'https://soundcloud.com/artiste/titre ou /sets/playlist',
    patterns: [/soundcloud\.com/],
    embedFn: (url) => {
      // SoundCloud oEmbed — on encode l'URL dans le widget
      const encoded = encodeURIComponent(url)
      return `https://w.soundcloud.com/player/?url=${encoded}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`
    },
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.08)',
    placeholder: 'https://youtu.be/... ou https://www.youtube.com/watch?v=...',
    patterns: [/youtube\.com\/watch/, /youtu\.be\//],
    embedFn: (url) => {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
      if (!m) return null
      return `https://www.youtube.com/embed/${m[1]}?rel=0`
    },
  },
  {
    id: 'youtubemusic',
    name: 'YouTube Music',
    icon: '🎼',
    color: '#FF0000',
    bg: 'rgba(255,0,0,0.08)',
    placeholder: 'https://music.youtube.com/watch?v=...',
    patterns: [/music\.youtube\.com/],
    embedFn: (url) => {
      const m = url.match(/music\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/)
      if (!m) return null
      return `https://www.youtube.com/embed/${m[1]}?rel=0`
    },
  },
  {
    id: 'applemusic',
    name: 'Apple Music',
    icon: '🍎',
    color: '#FC3C44',
    bg: 'rgba(252,60,68,0.10)',
    placeholder: 'https://music.apple.com/fr/album/...',
    patterns: [/music\.apple\.com/],
    embedFn: (url) => {
      // Apple Music embed
      const m = url.match(/music\.apple\.com\/([a-z]{2})\/(.+)/)
      if (!m) return null
      return `https://embed.music.apple.com/${m[1]}/${m[2]}`
    },
  },
  {
    id: 'bandcamp',
    name: 'Bandcamp',
    icon: '📀',
    color: '#1DA0C3',
    bg: 'rgba(29,160,195,0.10)',
    placeholder: 'https://artiste.bandcamp.com/track/... ou /album/...',
    patterns: [/bandcamp\.com/],
    embedFn: () => null, // Bandcamp embed nécessite l'ID interne — pas d'embed direct depuis URL
  },
  {
    id: 'mixcloud',
    name: 'Mixcloud',
    icon: '🌀',
    color: '#52AAD8',
    bg: 'rgba(82,170,216,0.10)',
    placeholder: 'https://www.mixcloud.com/artiste/mix-title/',
    patterns: [/mixcloud\.com/],
    embedFn: (url) => {
      const m = url.match(/mixcloud\.com(\/.+\/)/)
      if (!m) return null
      return `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(m[1])}`
    },
  },
  {
    id: 'tidal',
    name: 'Tidal',
    icon: '🌊',
    color: '#000000',
    bg: 'rgba(0,0,0,0.08)',
    placeholder: 'https://tidal.com/browse/track/... ou /album/...',
    patterns: [/tidal\.com/],
    embedFn: (url) => {
      const m = url.match(/tidal\.com\/browse\/(track|album|playlist)\/(\d+)/)
      if (!m) return null
      return `https://embed.tidal.com/${m[1]}s/${m[2]}`
    },
  },
  {
    id: 'qobuz',
    name: 'Qobuz',
    icon: '🎻',
    color: '#005CC8',
    bg: 'rgba(0,92,200,0.08)',
    placeholder: 'https://www.qobuz.com/fr-fr/album/...',
    patterns: [/qobuz\.com/],
    embedFn: () => null,
  },
  {
    id: 'audiomack',
    name: 'Audiomack',
    icon: '🎤',
    color: '#FFA200',
    bg: 'rgba(255,162,0,0.10)',
    placeholder: 'https://audiomack.com/artiste/song/...',
    patterns: [/audiomack\.com/],
    embedFn: (url) => {
      const m = url.match(/audiomack\.com\/([^/]+)\/(song|album|playlist)\/([^/?]+)/)
      if (!m) return null
      return `https://audiomack.com/embed/${m[1]}/${m[2]}/${m[3]}`
    },
  },
  {
    id: 'jamendo',
    name: 'Jamendo',
    icon: '🎸',
    color: '#00BEA4',
    bg: 'rgba(0,190,164,0.10)',
    placeholder: 'https://www.jamendo.com/track/...',
    patterns: [/jamendo\.com/],
    embedFn: (url) => {
      const m = url.match(/jamendo\.com\/track\/(\d+)/)
      if (!m) return null
      return `https://widgets.jamendo.com/v3/track/${m[1]}/?width=400`
    },
  },
]

// ── Fonctions utilitaires ─────────────────────────────────────────────────────

export function detectPlatform(url: string): MusicPlatform | null {
  if (!url) return null
  for (const p of MUSIC_PLATFORMS) {
    if (p.patterns.some(re => re.test(url))) return p
  }
  // URL générique non reconnue
  if (url.startsWith('http')) {
    return { ...MUSIC_PLATFORMS[MUSIC_PLATFORMS.length - 1], id: 'other', name: 'Lien musical', icon: '🎵', color: '#6BB8E8', bg: 'rgba(107,184,232,0.10)', placeholder: '' }
  }
  return null
}

export function getEmbedUrl(url: string): string | null {
  const platform = detectPlatform(url)
  if (!platform || !platform.embedFn) return null
  return platform.embedFn(url)
}

export interface MusicLink {
  id: string
  url: string
  title: string       // titre saisi manuellement
  platform: MusicPlatformId
  showEmbed: boolean
}
