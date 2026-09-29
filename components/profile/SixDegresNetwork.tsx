// « Mon réseau » dans le profil : portée à 6 degrés, badges, demandes de Connexion.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import {
  fetchReach, fetchConnections, respondConnection, removeConnection, badges, degreeLabel,
  type Reach, type ConnectionRow,
} from '../../lib/sixDegres'
import Avatar from '../shared/Avatar'

type Mini = { id: string; display_name: string | null; avatar_url: string | null; avatar_emoji: string | null; instruments: string[] | null }

const f = 'Nunito,sans-serif'

export default function SixDegresNetwork({ userId }: { userId: string }) {
  const { theme: t } = useTheme()
  const [reach, setReach] = useState<Reach | null>(null)
  const [conns, setConns] = useState<ConnectionRow[]>([])
  const [people, setPeople] = useState<Map<string, Mini>>(new Map())
  const [visible, setVisible] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const load = useCallback(async () => {
    const [r, c, { data: me }] = await Promise.all([
      fetchReach(),
      fetchConnections(userId),
      supabase.from('profiles').select('six_degres_visible').eq('id', userId).maybeSingle(),
    ])
    setReach(r)
    setConns(c)
    if (me) setVisible(me.six_degres_visible !== false)
    const ids = Array.from(new Set(c.map(x => x.requester_id === userId ? x.addressee_id : x.requester_id)))
    if (ids.length) {
      const { data } = await supabase.from('profiles').select('id, display_name, avatar_url, avatar_emoji, instruments').in('id', ids)
      setPeople(new Map(((data as Mini[] | null) || []).map(p => [p.id, p])))
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const toggleVisible = async () => {
    const v = !visible
    setVisible(v)
    await supabase.from('profiles').update({ six_degres_visible: v }).eq('id', userId)
    load()
  }

  const other = (c: ConnectionRow) => c.requester_id === userId ? c.addressee_id : c.requester_id
  const received = conns.filter(c => c.status === 'pending' && c.addressee_id === userId)
  const connected = conns.filter(c => c.status === 'accepted')

  const total = reach ? reach.par_degre.reduce((a, b) => a + b, 0) : 0
  const max = reach ? Math.max(1, ...reach.par_degre) : 1
  const pct = reach && reach.membres > 0 ? Math.round((total / reach.membres) * 100) : 0

  const personRow = (c: ConnectionRow, actions: React.ReactNode) => {
    const p = people.get(other(c))
    return (
      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
        <Avatar p={p ? { ...p, instruments: p.instruments || [] } : null} size={32} online={false} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p?.display_name || 'Membre'}
        </div>
        {actions}
      </div>
    )
  }
  const smallBtn = (bg: string, color: string, border = 'none'): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 16, border, background: bg, color, fontSize: 12, fontWeight: 800, fontFamily: f, cursor: 'pointer', flexShrink: 0,
  })

  return (
    <div style={{ marginTop: 20, padding: 16, borderRadius: 18, border: `1px solid ${t.border}`, background: t.surface, fontFamily: f }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>🕸️ Mon réseau à 6 degrés</div>
      <div style={{ fontSize: 12, color: t.textMuted, margin: '4px 0 14px', lineHeight: 1.5 }}>
        On dit que tout le monde est relié à tout le monde en 6 poignées de main. Invite tes amis et connecte-toi avec des membres pour relier tout Vibz.
      </div>

      {reach && (
        <>
          <div style={{ fontSize: 13, color: t.text, fontWeight: 700, marginBottom: 10 }}>
            Tu touches <span style={{ color: t.pink }}>{total}</span> membre{total > 1 ? 's' : ''} sur {reach.membres}{reach.membres > 0 ? ` (${pct} %)` : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
            {reach.par_degre.map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 64, fontSize: 11, fontWeight: 700, color: t.textMuted, flexShrink: 0 }}>{degreeLabel(i + 1)}</span>
                <div style={{ flex: 1, height: 10, borderRadius: 5, background: t.bg2, overflow: 'hidden' }}>
                  <div style={{ width: `${(n / max) * 100}%`, height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${t.pink}, ${t.blue})`, transition: 'width .4s' }} />
                </div>
                <span style={{ width: 32, textAlign: 'right', fontSize: 12, fontWeight: 800, color: t.text }}>{n}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            {badges(reach).map(b => (
              <div key={b.id} title={b.hint}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 16, fontSize: 12, fontWeight: 800,
                  border: `1px solid ${b.earned ? t.pink : t.border}`, background: b.earned ? t.pinkLight : 'transparent',
                  color: b.earned ? t.pinkDark : t.textMuted, opacity: b.earned ? 1 : 0.6 }}>
                <span style={{ filter: b.earned ? 'none' : 'grayscale(1)' }}>{b.icon}</span>{b.name}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 12 }}>
            {reach.invitations} ami{reach.invitations > 1 ? 's' : ''} invité{reach.invitations > 1 ? 's' : ''} · {reach.connexions} connexion{reach.connexions > 1 ? 's' : ''}
          </div>
        </>
      )}

      {received.length > 0 && (
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: t.text }}>Demandes de connexion ({received.length})</div>
          {received.map(c => personRow(c, (
            <>
              <button onClick={async () => { await respondConnection(c.requester_id, true); load() }} style={smallBtn(t.pink, 'white')}>Accepter</button>
              <button onClick={async () => { await respondConnection(c.requester_id, false); load() }} style={smallBtn('transparent', t.textMuted, `1px solid ${t.border}`)}>Ignorer</button>
            </>
          )))}
        </div>
      )}

      {connected.length > 0 && (
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 10, marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: t.text }}>Mes connexions ({connected.length})</div>
          {(showAll ? connected : connected.slice(0, 5)).map(c => personRow(c, (
            <button onClick={async () => { await removeConnection(other(c)); load() }} style={smallBtn('transparent', t.textMuted, `1px solid ${t.border}`)}>Retirer</button>
          )))}
          {connected.length > 5 && (
            <button onClick={() => setShowAll(s => !s)} style={{ ...smallBtn('transparent', t.pink), padding: '4px 0' }}>
              {showAll ? 'Voir moins' : `Voir les ${connected.length}`}
            </button>
          )}
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderTop: `1px solid ${t.border}`, paddingTop: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={visible} onChange={toggleVisible} style={{ marginTop: 2, accentColor: t.pink }} />
        <span style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>
          <strong style={{ color: t.text }}>Apparaître dans les chaînes des autres membres.</strong> Seuls tes invitations et tes connexions servent à relier les gens, jamais tes matchs, tes likes ni tes messages.
          Décoché, personne ne passe par toi et tu ne vois plus les chaînes.
        </span>
      </label>
    </div>
  )
}
