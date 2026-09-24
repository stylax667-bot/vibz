import { useTheme } from '../../lib/theme'
import type { AvatarFields } from '../../lib/avatar'

interface Props {
  p: (AvatarFields & { display_name?: string | null; username?: string | null; is_online?: boolean }) | null | undefined
  size?: number
  online?: boolean     // affiche la pastille verte de présence
  ring?: string        // couleur de bordure (par défaut celle du thème)
  onClick?: () => void
  title?: string
}

// Avatar carré : photo du membre, sinon emoji d'instrument (avatar fixé), sinon initiales.
export default function Avatar({ p, size = 36, online, ring, onClick, title }: Props) {
  const { theme: tk } = useTheme()
  const radius = Math.max(4, Math.round(size * 0.18))
  const border = `${size >= 60 ? 2 : 1.5}px solid ${ring || tk.border}`
  const box: React.CSSProperties = {
    width: size, height: size, borderRadius: radius, border, boxSizing: 'border-box',
    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const initials = (p?.display_name || p?.username || '?').slice(0, 2).toUpperCase()

  return (
    <div onClick={onClick} title={title}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: onClick ? 'pointer' : undefined }}>
      {p?.avatar_url ? (
        <img src={p.avatar_url} alt="" width={size} height={size} loading="lazy"
          style={{ ...box, objectFit: 'cover', display: 'block', background: tk.bg2 }} />
      ) : p?.avatar_emoji ? (
        <div style={{ ...box, fontSize: size * 0.58, lineHeight: 1, background: tk.isDark ? `linear-gradient(135deg,${tk.pinkLight},${tk.blueLight})` : 'linear-gradient(135deg,#FFF0F5,#F0F7FD)' }}>
          {p.avatar_emoji}
        </div>
      ) : (
        <div style={{
          ...box, fontSize: size * 0.36, fontWeight: 800, color: tk.pinkDark,
          background: tk.isDark ? `linear-gradient(135deg,${tk.pinkLight},${tk.blueLight})` : 'linear-gradient(135deg,#FFF0F5,#F0F7FD)',
        }}>{initials}</div>
      )}
      {(online ?? p?.is_online) && (
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: Math.max(8, size * 0.26), height: Math.max(8, size * 0.26), borderRadius: '50%', background: '#22c55e', border: `2px solid ${tk.surface}` }} />
      )}
    </div>
  )
}
