// Fenêtre « Comment je suis relié à ce membre » : la chaîne maillon par maillon.
import { useEffect, useState } from 'react'
import { useTheme } from '../../lib/theme'
import { fetchChain, degreeLabel, type ChainStep } from '../../lib/sixDegres'
import Avatar from './Avatar'

interface Props {
  targetId: string
  targetName: string
  onClose: () => void
}

const f = 'Nunito,sans-serif'

export default function SixDegresChain({ targetId, targetName, onClose }: Props) {
  const { theme: t } = useTheme()
  const [chain, setChain] = useState<ChainStep[] | null>(null)

  useEffect(() => { fetchChain(targetId).then(setChain) }, [targetId])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.surface, borderRadius: 20, padding: 22, maxWidth: 380, width: '100%', maxHeight: '85vh', overflowY: 'auto', border: `1px solid ${t.border}`, fontFamily: f }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>🕸️ Toi et {targetName}</div>

        {chain === null ? (
          <div style={{ fontSize: 13, color: t.textMuted, padding: '20px 0' }}>Recherche du chemin…</div>
        ) : chain.length === 0 ? (
          <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.6, margin: '10px 0 16px' }}>
            Aucune chaîne de 6 maillons ou moins ne vous relie encore. Connecte-toi avec des membres et invite tes amis musiciens : chaque nouveau lien rapproche tout Vibz.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: t.textMuted, margin: '4px 0 16px' }}>
              {degreeLabel(chain.length - 1)} · {chain.length - 1} poignée{chain.length > 2 ? 's' : ''} de main
            </div>
            {chain.map((s, i) => (
              <div key={s.id}>
                {s.link && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 4px 16px' }}>
                    <div style={{ width: 2, height: 22, background: s.link === 'invitation' ? t.green : t.pink, borderRadius: 1 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>
                      {s.link === 'invitation' ? '🌱 invitation' : '🤝 connexion'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar p={{ display_name: s.display_name || '', avatar_url: s.avatar_url, avatar_emoji: s.avatar_emoji, instruments: s.instruments || [] }} size={34} online={false} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i === 0 ? 'Toi' : s.display_name || 'Membre'}
                    </div>
                    {s.instruments?.[0] && <div style={{ fontSize: 11, color: t.textMuted }}>{s.instruments[0]}</div>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <button onClick={onClose} style={{ marginTop: 18, width: '100%', padding: 12, borderRadius: 12, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: f }}>
          Fermer
        </button>
      </div>
    </div>
  )
}
