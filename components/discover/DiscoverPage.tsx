import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../../lib/supabase'

interface Props { user: User; onMessage: () => void }

const INSTRUMENTS = ['Guitare', 'Piano', 'Basse', 'Batterie', 'Chant', 'Saxo', 'Violon', 'DJ', 'Ukulélé', 'Flûte']
const SOCIAL_FILTERS = ['SoundCloud', 'Instagram', 'YouTube', 'LinkedIn', 'Facebook', 'TikTok']
const EMOJI_MAP: Record<string, string> = { Guitare:'🎸', Piano:'🎹', Basse:'🎸', Batterie:'🥁', Chant:'🎤', Saxo:'🎷', Violon:'🎻', DJ:'🎧', Ukulélé:'🪕', Flûte:'🪈' }
const BANNER_BG: Record<string, string> = { Guitare:'#EEEDFE', Piano:'#E1F5EE', Basse:'#FAEEDA', Batterie:'#FBEAF0', Chant:'#E1F5EE', Saxo:'#FAEEDA', DJ:'#EEEDFE', Violon:'#FBEAF0' }

const chipStyle = (on: boolean): React.CSSProperties => ({
  padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
  border: on ? '0.5px solid #1D9E75' : '0.5px solid rgba(0,0,0,0.1)',
  background: on ? '#E1F5EE' : 'white', color: on ? '#085041' : '#6b7280',
  cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.1s',
})

export default function DiscoverPage({ user, onMessage }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [matchName, setMatchName] = useState<string|null>(null)
  const [notif, setNotif] = useState<{ msg: string; color: string }|null>(null)

  const showNotif = (msg: string, color = '#D4537E') => {
    setNotif({ msg, color })
    setTimeout(() => setNotif(null), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)

    const [{ data: blocks }, { data: likes }] = await Promise.all([
      supabase.from('blocks').select('blocked_id'),
      supabase.from('likes').select('to_user').eq('from_user', user.id),
    ])

    setLikedIds(new Set((likes || []).map(l => l.to_user as string)))

    const blockedIds = (blocks || []).map(b => b.blocked_id as string)
    let q = supabase.from('profiles').select('*').neq('id', user.id).eq('is_banned', false)
    if (blockedIds.length > 0) {
      q = q.not('id', 'in', `(${blockedIds.join(',')})`)
    }
    const { data } = await q.order('is_online', { ascending: false }).limit(50)
    setProfiles(data || [])
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  const toggleFilter = (f: string) =>
    setActiveFilters(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f])

  const handleLike = async (targetId: string, name: string) => {
    if (likedIds.has(targetId)) return
    setLikedIds(p => { const s = new Set(Array.from(p)); s.add(targetId); return s })
    await supabase.from('likes').insert({ from_user: user.id, to_user: targetId })
    const { data } = await supabase.from('likes').select('id')
      .eq('from_user', targetId).eq('to_user', user.id).maybeSingle()
    if (data) { setMatchName(name); setTimeout(() => setMatchName(null), 3000) }
  }

  const handleWizzz = async (targetId: string, name: string) => {
    const { error } = await supabase.from('wizzz').insert({ sender_id: user.id, receiver_id: targetId })
    if (error?.message?.includes('rate_limit')) {
      showNotif('⏳ Attends 30s avant de renvoyer un wizzz !', '#6b7280')
    } else if (error) {
      showNotif('Erreur lors du wizzz', '#ef4444')
    } else {
      showNotif(`⚡ Wizzz envoyé à ${name} !`, '#7F77DD')
    }
  }

  const handleBlock = async (targetId: string, name: string) => {
    await supabase.from('blocks').insert({ blocker_id: user.id, blocked_id: targetId })
    setProfiles(p => p.filter(x => x.id !== targetId))
    showNotif(`🚫 ${name} bloqué`, '#6b7280')
  }

  const getSocials = (p: Profile) => {
    const r: { label: string; color: string }[] = []
    if (p.social_soundcloud) r.push({ label: 'SC', color: '#f50' })
    if (p.social_instagram) r.push({ label: 'IG', color: '#C13584' })
    if (p.social_youtube) r.push({ label: 'YT', color: '#FF0000' })
    if (p.social_linkedin) r.push({ label: 'in', color: '#0A66C2' })
    if (p.social_facebook) r.push({ label: 'fb', color: '#1877F2' })
    return r
  }

  const filtered = profiles.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      const match = (p.display_name || '').toLowerCase().includes(q)
        || (p.city || '').toLowerCase().includes(q)
        || (p.instruments || []).some(i => i.toLowerCase().includes(q))
      if (!match) return false
    }
    if (activeFilters.length === 0) return true
    return activeFilters.some(f => {
      if (f === '💑 Rencontre') return (p.looking_for || []).includes('rencontre')
      if (f === '🎸 Musiciens') return (p.instruments || []).length > 0
      if (INSTRUMENTS.includes(f)) return (p.instruments || []).includes(f)
      return true
    })
  })

  const onlineProfiles = profiles.filter(p => p.is_online).slice(0, 4)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', minHeight: 'calc(100vh - 60px)' }}>
      {matchName && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: '#D4537E', color: 'white', padding: '14px 28px', borderRadius: 16, fontWeight: 700, fontSize: 16, zIndex: 999, boxShadow: '0 8px 32px rgba(212,83,126,0.4)' }}>
          🎉 Match avec {matchName} !
        </div>
      )}
      {notif && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: notif.color, color: 'white', padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, zIndex: 999, boxShadow: `0 6px 24px ${notif.color}66` }}>
          {notif.msg}
        </div>
      )}

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, background: 'white' }}>
          <span style={{ fontSize: 16, color: '#6b7280' }}>🔍</span>
          <input
            style={{ border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'Syne,sans-serif', outline: 'none', flex: 1, color: '#1a1a1a' }}
            placeholder="Rechercher par nom, ville, instrument..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['💑 Rencontre', '🎸 Musiciens', ...INSTRUMENTS, ...SOCIAL_FILTERS].map(f => (
            <div key={f} style={chipStyle(activeFilters.includes(f))} onClick={() => toggleFilter(f)}>{f}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>Chargement des profils...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>Aucun profil trouvé</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {filtered.map(p => {
              const inst = p.instruments?.[0] || 'Guitare'
              const liked = likedIds.has(p.id)
              const socials = getSocials(p)
              return (
                <div key={p.id} style={{ background: 'white', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                  <div style={{ height: 56, background: BANNER_BG[inst] || '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, position: 'relative' }}>
                    {EMOJI_MAP[inst] || '🎵'}
                    <button
                      onClick={e => { e.stopPropagation(); handleBlock(p.id, p.display_name || '') }}
                      title="Bloquer cet utilisateur"
                      style={{ position: 'absolute', top: 6, right: 8, background: 'rgba(255,255,255,0.75)', border: 'none', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: '#6b7280', cursor: 'pointer', fontFamily: 'Syne,sans-serif' }}
                    >🚫</button>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      {p.is_online && <span style={{ width: 7, height: 7, background: '#1D9E75', borderRadius: '50%', display: 'inline-block' }} />}
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{p.display_name}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{p.city} · {p.country}</div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                      {(p.instruments || []).map(i => <span key={i} className="tag tag-music">{i}</span>)}
                      {(p.looking_for || []).includes('rencontre') && <span className="tag tag-love">💑</span>}
                      {(p.looking_for || []).includes('collab') && <span className="tag tag-collab">🎵</span>}
                    </div>
                    {socials.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                        {socials.map(s => (
                          <div key={s.label} style={{ width: 22, height: 22, background: s.color, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 800 }}>{s.label}</div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleLike(p.id, p.display_name || '')}
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.08)', background: liked ? '#D4537E' : '#FBEAF0', color: liked ? 'white' : '#D4537E', cursor: 'pointer', fontSize: 15, fontFamily: 'Syne,sans-serif', fontWeight: 700, transition: 'all 0.15s' }}
                      >{liked ? '❤️' : '🤍'}</button>
                      <button
                        onClick={() => handleWizzz(p.id, p.display_name || '')}
                        title="Envoyer un wizzz"
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.08)', background: '#EEEDFE', color: '#3C3489', cursor: 'pointer', fontSize: 15, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}
                      >⚡</button>
                      <button
                        onClick={onMessage}
                        style={{ flex: 1, padding: '7px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.08)', background: '#E1F5EE', color: '#1D9E75', cursor: 'pointer', fontSize: 15, fontFamily: 'Syne,sans-serif', fontWeight: 700 }}
                      >💬</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <aside style={{ borderLeft: '0.5px solid rgba(0,0,0,0.08)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, background: '#f9f8f7' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280' }}>En ligne maintenant</div>
        {onlineProfiles.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b7280' }}>Personne en ligne</div>
        ) : onlineProfiles.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EEEDFE', color: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
              {(p.display_name || '').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{p.display_name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{EMOJI_MAP[p.instruments?.[0] || '']} {p.instruments?.[0]} · {p.city}</div>
            </div>
          </div>
        ))}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#6b7280' }}>Salons actifs 🔥</div>
        {[{ icon: '🎸', name: 'Rock & Rencontre', count: 47 }, { icon: '🎹', name: 'Jazz Lounge', count: 23 }, { icon: '💑', name: 'Coup de foudre', count: 88 }, { icon: '🥁', name: 'Beatmakers', count: 14 }].map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.08)', cursor: 'pointer', background: 'white' }}>
            <span style={{ fontSize: 18 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{s.count} connectés</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#1D9E75' }}>LIVE</span>
          </div>
        ))}
      </aside>
    </div>
  )
}
