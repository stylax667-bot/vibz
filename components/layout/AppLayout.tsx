import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import DiscoverPage from '../discover/DiscoverPage'
import MessengerPage from '../chat/MessengerPage'
import SalonsPage from '../salons/SalonsPage'
import ProfilePage from '../profile/ProfilePage'

type Tab = 'discover' | 'messenger' | 'salons' | 'profile'
interface Props { user: User }

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '7px 16px',
  borderRadius: 20,
  border: active ? '0.5px solid #D4537E' : '0.5px solid transparent',
  background: active ? '#FBEAF0' : 'transparent',
  color: active ? '#4B1528' : '#6b7280',
  fontWeight: 700, fontSize: 13,
  cursor: 'pointer', fontFamily: 'Syne, sans-serif',
  display: 'flex', alignItems: 'center', gap: 6,
  transition: 'all 0.15s',
})

export default function AppLayout({ user }: Props) {
  const [tab, setTab] = useState<Tab>('discover')

  const tabs = [
    { id: 'discover' as Tab, icon: '🔍', label: 'Découvrir' },
    { id: 'messenger' as Tab, icon: '💬', label: 'Messages' },
    { id: 'salons' as Tab, icon: '🎵', label: 'Salons' },
    { id: 'profile' as Tab, icon: '👤', label: 'Profil' },
  ]

  const initials = (user.email || 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9f8f7', fontFamily: 'Syne, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 60, background: 'white', borderBottom: '0.5px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 800, letterSpacing: -1, color: '#1a1a1a' }}>
          <div style={{ width: 32, height: 26, background: '#D4537E', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✉️</div>
          Vib<span style={{ color: '#D4537E' }}>z</span>
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(t => (
            <button key={t.id} style={tabBtnStyle(tab === t.id)} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#E1F5EE', color: '#085041', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            <div style={{ width: 7, height: 7, background: '#1D9E75', borderRadius: '50%' }} />
            IA Guard actif
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EEEDFE', color: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, cursor: 'pointer' }} onClick={() => setTab('profile')}>
            {initials}
          </div>
          <button style={{ padding: '6px 12px', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, background: 'transparent', fontSize: 12, cursor: 'pointer', fontFamily: 'Syne, sans-serif', color: '#6b7280' }} onClick={() => supabase.auth.signOut()}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {tab === 'discover' && <DiscoverPage user={user} onMessage={() => setTab('messenger')} />}
        {tab === 'messenger' && <MessengerPage user={user} />}
        {tab === 'salons' && <SalonsPage user={user} />}
        {tab === 'profile' && <ProfilePage user={user} />}
      </div>
    </div>
  )
}
