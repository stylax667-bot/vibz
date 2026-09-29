import { useTheme } from '../../lib/theme'
import type { AvatarFields } from '../../lib/avatar'
import { artFor, type ArtFields } from '../../lib/avatarArt'
import { presenceOf, PRESENCE_COLOR, PRESENCE_LABEL, type Presence, type PresenceFields } from '../../lib/presence'

interface Props {
  p: (AvatarFields & ArtFields & PresenceFields) | null | undefined
  size?: number
  online?: boolean           // false : pas de voyant de présence
  status?: Presence | null   // présence imposée (ex. présence dans un salon)
  ring?: string              // couleur de bordure (par défaut celle du thème)
  onClick?: () => void
  title?: string
  fill?: boolean             // occupe toute la largeur disponible (carré), ex. vue Miniatures
}

// Avatar carré : photo du membre, sinon une image générée — un vinyle aux couleurs
// de ses styles avec son instrument au centre (ou l'emoji fixé après une sanction).
// Voyant : vert en ligne, orange ne pas déranger, rouge hors ligne.
export default function Avatar({ p, size = 36, online, status, ring, onClick, title, fill }: Props) {
  const { theme: tk } = useTheme()
  const radius = fill ? 14 : Math.max(4, Math.round(size * 0.18))
  const border = `${size >= 60 ? 2 : 1.5}px solid ${ring || tk.border}`
  const box: React.CSSProperties = {
    width: fill ? '100%' : size, height: fill ? '100%' : size, borderRadius: radius, border, boxSizing: 'border-box',
    overflow: 'hidden', display: 'block', position: 'relative',
  }

  const knowsPresence = !!p && (p.last_seen !== undefined || p.presence_mode !== undefined || p.is_online !== undefined)
  const dot: Presence | null = online === false ? null : status ?? (knowsPresence ? presenceOf(p) : null)

  const art = p?.avatar_url ? null : artFor(p)

  return (
    <div onClick={onClick} title={title ?? (dot ? PRESENCE_LABEL[dot] : undefined)}
      style={{ position: 'relative', width: fill ? '100%' : size, height: fill ? 'auto' : size, aspectRatio: fill ? '1' : undefined, flexShrink: 0, cursor: onClick ? 'pointer' : undefined }}>
      {p?.avatar_url ? (
        <img src={p.avatar_url} alt="" width={fill ? 256 : size} height={fill ? 256 : size} loading="lazy"
          style={{ ...box, objectFit: 'cover', background: tk.bg2 }} />
      ) : art && (
        <div role="img" aria-label={p?.display_name || 'Avatar'}
          style={{ ...box, background: `linear-gradient(${art.angle}deg, ${art.bg1}, ${art.bg2})` }}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
            <circle cx="50" cy="50" r="41" fill="#15171F" />
            {[37, 33, 29, 25].map(r => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />)}
            <path d="M 50 13 A 37 37 0 0 1 84 36" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="3" strokeLinecap="round"
              transform={`rotate(${art.angle} 50 50)`} />
            <circle cx="50" cy="50" r="19" fill={art.label} />
            <circle cx="50" cy="50" r="19" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1" />
          </svg>
          <img src={art.icon} alt="" draggable={false}
            style={{ position: 'absolute', left: '32%', top: '32%', width: '36%', height: '36%' }} />
        </div>
      )}
      {dot && (
        <div style={{ position: 'absolute', bottom: fill ? 8 : -2, right: fill ? 8 : -2, width: fill ? 16 : Math.max(9, size * 0.28), height: fill ? 16 : Math.max(9, size * 0.28), borderRadius: '50%', background: PRESENCE_COLOR[dot], border: `2px solid ${tk.surface}`, boxSizing: 'border-box', zIndex: fill ? 2 : undefined }} />
      )}
    </div>
  )
}
