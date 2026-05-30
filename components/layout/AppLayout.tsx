import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import DiscoverPage from '../discover/DiscoverPage'
import MessengerPage from '../chat/MessengerPage'
import SalonsPage from '../salons/SalonsPage'
import ProfilePage from '../profile/ProfilePage'
import ShareModal from '../shared/ShareModal'
import DonationBanner from '../shared/DonationBanner'

type Tab = 'discover' | 'messenger' | 'salons' | 'profile'
interface Props { user: User }

export default function AppLayout({ user }: Props) {
  const [tab, setTab] = useState<Tab>('discover')
  const [showShare, setShowShare] = useState(false)
  const { theme: t, toggle } = useTheme()

  const tabs = [
    { id: 'discover'  as Tab, icon: '🔍', label: 'Découvrir' },
    { id: 'messenger' as Tab, icon: '💬', label: 'Messages'  },
    { id: 'salons'    as Tab, icon: '🎵', label: 'Salons'    },
    { id: 'profile'   as Tab, icon: '👤', label: 'Profil'    },
  ]

  const initials = (user.email || 'U').slice(0, 2).toUpperCase()
  const f = 'Nunito, sans-serif'

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 20, fontFamily: f,
    border: active ? `1px solid ${t.pink}88` : '1px solid transparent',
    background: active ? t.pinkLight : 'transparent',
    color: active ? t.pinkDark : t.textMuted,
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bg2, fontFamily: f }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 60,
        background: t.navBg,
        borderBottom: `1px solid ${t.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 2px 12px ${t.shadow}`,
        transition: 'background 0.25s, border-color 0.25s',
      }}>

        {/* Logo */}
        <div onClick={() => setTab('discover')} title="Retour à l'accueil"
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 22, fontWeight: 800, letterSpacing: -1, color: t.text, cursor: 'pointer', userSelect: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, fontSize: 20,
            background: `linear-gradient(135deg,${t.pinkLight},${t.blueLight},${t.greenLight})`,
            border: `1.5px solid ${t.pink}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🦋</div>
          Vib<span style={{ color: t.pink }}>z</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(tb => (
            <button key={tb.id} style={tabBtn(tab === tb.id)} onClick={() => setTab(tb.id)}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* Actions droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          {/* Bouton partager l'app */}
          <button
            onClick={() => setShowShare(true)}
            title="Partager Vibz avec tes amis"
            style={{
              padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${t.pink}44`,
              background: t.pinkLight, fontSize: 11, fontFamily: f,
              fontWeight: 800, color: t.pinkDark,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
            }}
          >🚀 Partager</button>

          {/* IA Guard badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: t.guardBg, color: t.guardText,
          }}>
            <div style={{ width: 7, height: 7, background: t.green, borderRadius: '50%' }} />
            IA Guard
          </div>

          {/* Toggle dark mode */}
          <button
            onClick={toggle}
            title={t.isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            style={{
              width: 40, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: t.isDark
                ? `linear-gradient(135deg,#3A4A70,#2A3A60)`
                : `linear-gradient(135deg,#FFF0C0,#FFD060)`,
              position: 'relative', transition: 'background 0.3s', flexShrink: 0,
              boxShadow: `0 2px 8px ${t.shadow}`, padding: 0,
            }}
            aria-label="Basculer mode sombre"
          >
            <div style={{
              position: 'absolute', top: 3,
              left: t.isDark ? 18 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: t.isDark ? '#9BA8C8' : '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.25s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
            }}>
              {t.isDark ? '🌙' : '☀️'}
            </div>
          </button>

          {/* Avatar initiales */}
          <div
            onClick={() => setTab('profile')}
            style={{
              width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
              background: t.pinkLight, color: t.pinkDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800,
              border: `2px solid ${t.pink}44`,
            }}
          >{initials}</div>

          {/* Déconnexion */}
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
              border: `1px solid ${t.border}`,
              background: 'transparent', fontSize: 12, fontFamily: f,
              fontWeight: 700, color: t.textMuted,
              transition: 'all 0.15s',
            }}
          >Déconnexion</button>
        </div>
      </nav>

      {/* ── Contenu ── */}
      <div style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {tab === 'discover'  && <DiscoverPage user={user} onMessage={() => setTab('messenger')} />}
        {tab === 'messenger' && <MessengerPage user={user} />}
        {tab === 'salons'    && <SalonsPage user={user} />}
        {tab === 'profile'   && <ProfilePage user={user} />}
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${t.border}`,
        background: t.navBg,
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 20, flexWrap: 'wrap',
        transition: 'background 0.25s',
      }}>
        <span style={{ fontSize: 11, color: t.textMuted, fontFamily: f }}>
          🦋 Vibz — {new Date().getFullYear()}
        </span>
        {[
          { label: 'Conditions d\'utilisation',    href: '/conditions'      },
          { label: 'Politique de confidentialité', href: '/confidentialite' },
          { label: 'Contact',                      href: 'mailto:contact@vibz.app' },
        ].map(l => (
          <a key={l.href} href={l.href}
            target={l.href.startsWith('mailto') ? '_blank' : undefined}
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: t.textMuted, fontFamily: f, textDecoration: 'none', fontWeight: 700, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = t.pink)}
            onMouseLeave={e => (e.currentTarget.style.color = t.textMuted)}
          >{l.label}</a>
        ))}

        {/* Don Ko-fi — discret dans le footer */}
        <DonationBanner variant="footer" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: t.textMuted, fontWeight: 700 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, background: t.green, borderRadius: '50%' }}/>
          RGPD · VibzGuard actif
        </div>
      </footer>

      {/* Modal partage app */}
      {showShare && (
        <ShareModal context={{ type: 'app' }} onClose={() => setShowShare(false)} />
      )}
    </div>
  )
}
