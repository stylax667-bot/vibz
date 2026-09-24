import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import { useSalonHeartbeat, keepSalonAlive, closeSalon } from '../../lib/salons'
import { AssistantChat } from '../shared/AssistantBox'
import { ASSISTANT_ENABLED } from '../../lib/assistant/config'
import DiscoverPage from '../discover/DiscoverPage'
import MessengerPage from '../chat/MessengerPage'
import SalonsPage from '../salons/SalonsPage'
import ProfilePage from '../profile/ProfilePage'
import { SITE_URL } from '../../lib/site'
import Avatar from '../shared/Avatar'
import { AVATAR_EVENT, type AvatarFields } from '../../lib/avatar'

type Tab = 'discover' | 'messenger' | 'salons' | 'profile'
interface Props { user: User }

export default function AppLayout({ user }: Props) {
  const [tab, setTab] = useState<Tab>('discover')
  const { theme: t, toggle } = useTheme()
  const [shareToast, setShareToast] = useState(false)
  const [showDon, setShowDon]       = useState(false)
  const [showMenu, setShowMenu]     = useState(false)
  // Profil avec qui ouvrir une conversation (depuis Découvrir)
  const [chatWith, setChatWith]     = useState<Profile | null>(null)
  // Salon à ouvrir (depuis Découvrir) et salon actuellement consulté
  const [salonToOpen, setSalonToOpen]       = useState<string | null>(null)
  const [mixToOpen, setMixToOpen]           = useState<{ tags: string[]; name?: string } | null>(null)
  const isMobile = useIsMobile()
  const [myAvatar, setMyAvatar] = useState<AvatarFields & { display_name?: string }>({ display_name: user.email || 'U' })

  // Avatar du membre connecté, mis à jour dès qu'il le change depuis son profil
  useEffect(() => {
    supabase.from('profiles').select('display_name, avatar_url, avatar_emoji').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setMyAvatar(a => ({ ...a, ...data, display_name: data.display_name || a.display_name })) })
    const onChange = (e: Event) => setMyAvatar(a => ({ ...a, ...(e as CustomEvent<Partial<AvatarFields>>).detail }))
    window.addEventListener(AVATAR_EVENT, onChange)
    return () => window.removeEventListener(AVATAR_EVENT, onChange)
  }, [user.id])

  // Signe de vie dans mes salons + rappel à l'admin toutes les 45 min
  const { checks, dismiss } = useSalonHeartbeat(user.id)
  const [checkBusy, setCheckBusy] = useState(false)
  const adminCheck = checks[0]
  const answerCheck = async (keep: boolean) => {
    if (!adminCheck) return
    setCheckBusy(true)
    await (keep ? keepSalonAlive(adminCheck.id) : closeSalon(adminCheck.id))
    setCheckBusy(false)
    dismiss(adminCheck.id)
  }

  const openSalon = (id: string) => { setSalonToOpen(id); setTab('salons') }
  const openMix = (tags: string[], name?: string) => { setMixToOpen({ tags, name }); setTab('salons') }

  // Hauteur disponible pour le contenu des onglets — exposée aux pages via --vz-app-h
  const NAV_H    = isMobile ? 56 : 60
  const TABBAR_H = 62
  const appHeight = isMobile
    ? `calc(100dvh - ${NAV_H + TABBAR_H}px - env(safe-area-inset-bottom))`
    : `calc(100vh - ${NAV_H}px)`

  const handleShare = async () => {
    const url  = SITE_URL
    const data = { title:'Vibz — Rencontres & Musiciens', text:'La plateforme qui connecte les âmes sœurs et les musiciens 🦋', url }
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share(data) } catch (_) { /* annulé */ }
    } else {
      navigator.clipboard.writeText(url)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    }
  }

  const tabs = [
    { id: 'discover'  as Tab, icon: '🔍', label: 'Découvrir' },
    { id: 'messenger' as Tab, icon: '💬', label: 'Messages'  },
    { id: 'salons'    as Tab, icon: '🎵', label: 'Salons'    },
    { id: 'profile'   as Tab, icon: '👤', label: 'Profil'    },
  ]

  const legalLinks = [
    { label: 'Conditions d\'utilisation',      href: '/conditions'      },
    { label: 'Politique de confidentialité',   href: '/confidentialite' },
    { label: 'Mentions légales',              href: '/mentions-legales' },
    { label: 'Contact',                        href: 'mailto:michael_chesne@outlook.fr' },
  ]

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: t.bg2, fontFamily: f, ['--vz-app-h' as string]: appHeight }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px', height: NAV_H, gap: 8,
        background: t.navBg,
        borderBottom: `1px solid ${t.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 2px 12px ${t.shadow}`,
        transition: 'background 0.25s, border-color 0.25s',
      }}>

        {/* Logo */}
        <div onClick={() => setTab('discover')} title="Retour à l'accueil"
          style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: isMobile ? 20 : 22, fontWeight: 800, letterSpacing: -1, color: t.text, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, fontSize: 20,
            background: `linear-gradient(135deg,${t.pinkLight},${t.blueLight},${t.greenLight})`,
            border: `1.5px solid ${t.pink}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>🦋</div>
          <span>Vib<span style={{ color: t.pink }}>z</span></span>
        </div>

        {/* Tabs (desktop) — sur mobile ils passent dans la barre du bas */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(tb => (
              <button key={tb.id} style={tabBtn(tab === tb.id)} onClick={() => setTab(tb.id)}>
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>
        )}

        {/* Toast "lien copié" */}
        {shareToast && (
          <div style={{ position:'fixed', top:NAV_H + 12, left:'50%', transform:'translateX(-50%)', background:t.green, color:'white', padding:'10px 20px', borderRadius:12, fontWeight:700, fontSize:13, zIndex:200, boxShadow:`0 4px 16px ${t.green}55`, fontFamily:f }}>
            🔗 Lien copié !
          </div>
        )}

        {/* Modal donation */}
        {showDon && (
          <div style={{ position:'fixed', inset:0, zIndex:500, background:t.overlay, backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:isMobile ? 16 : 20 }}
            onClick={() => setShowDon(false)}>
            <div onClick={e=>e.stopPropagation()} style={{ background:t.surface, borderRadius:28, maxWidth:420, width:'100%', padding:isMobile ? 22 : 28, border:`1px solid ${t.border}`, boxShadow:`0 32px 80px ${t.shadow}` }}>
              <div style={{ fontSize:20, fontWeight:800, color:t.text, marginBottom:4 }}>☕ Soutenir Vibz</div>
              <div style={{ fontSize:13, color:t.textMuted, marginBottom:20, lineHeight:1.6 }}>
                Vibz est gratuit pour toujours. Si tu aimes la plateforme, un petit don aide à couvrir les coûts serveur et à développer de nouvelles fonctionnalités 🙏
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {[
                  { label:'☕ 1 café — 3€',              url:'https://ko-fi.com/vibzapp', bg: t.isDark ? 'rgba(232,160,106,0.15)' : '#FAEEDA', color:'#A05A10' },
                  { label:'🎵 1 mois de soutien — 5€',   url:'https://ko-fi.com/vibzapp', bg: t.isDark ? 'rgba(167,139,219,0.15)' : '#EDE8F8', color:'#5B3FAD' },
                  { label:'🏆 Montant libre — Ko-fi',    url:'https://ko-fi.com/vibzapp', bg: t.isDark ? 'rgba(82,192,122,0.15)' : '#D6F5E6',  color:'#1A6645' },
                ].map(d => (
                  <a key={d.label} href={d.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:'block', padding:'12px 16px', borderRadius:14, background:d.bg, color:d.color, fontWeight:800, fontSize:13, cursor:'pointer', textDecoration:'none', transition:'opacity 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.opacity='0.8')}
                    onMouseLeave={e=>(e.currentTarget.style.opacity='1')}
                  >{d.label}</a>
                ))}
              </div>
              <button onClick={() => setShowDon(false)}
                style={{ width:'100%', padding:'11px', borderRadius:14, border:`1px solid ${t.border}`, background:'transparent', color:t.textMuted, cursor:'pointer', fontFamily:f, fontWeight:700, fontSize:13 }}>
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Actions droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 10 }}>

          {!isMobile && (
            <>
              {/* Partager l'app */}
              <button
                onClick={handleShare}
                title="Partager Vibz"
                style={{
                  padding: '6px 14px', borderRadius: 20, border: `1px solid ${t.border}`,
                  background: t.blueLight, color: t.blueDark,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: f,
                  transition: 'all 0.15s',
                }}
              >🚀 Partager</button>

              {/* Don */}
              <button
                onClick={() => setShowDon(true)}
                title="Soutenir Vibz"
                style={{
                  padding: '6px 14px', borderRadius: 20, border: `1px solid ${t.border}`,
                  background: t.isDark ? 'rgba(232,160,106,0.12)' : '#FBF3EA',
                  color: t.isDark ? '#E8B87A' : '#A05A10',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: f,
                  transition: 'all 0.15s',
                }}
              >☕ Soutenir</button>

              {/* IA Guard badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: t.guardBg, color: t.guardText,
              }}>
                <div style={{ width: 7, height: 7, background: t.green, borderRadius: '50%' }} />
                IA Guard
              </div>
            </>
          )}

          {/* Toggle dark mode */}
          <button
            onClick={toggle}
            title={t.isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-label="Basculer mode sombre"
            style={{
              width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: t.isDark
                ? 'linear-gradient(135deg,#0E1A2E,#1A2A48)'
                : 'linear-gradient(135deg,#F5E88A,#F0C832)',
              position: 'relative', flexShrink: 0, padding: 0,
              boxShadow: t.isDark
                ? `0 0 0 1px #1E2E48, 0 2px 8px rgba(0,0,0,0.50), inset 0 1px 0 rgba(107,184,232,0.08)`
                : `0 0 0 1px rgba(200,160,20,0.30), 0 2px 8px rgba(240,200,50,0.25)`,
              transition: 'background 0.35s ease, box-shadow 0.35s ease',
            }}
          >
            {/* Piste étoilée en dark */}
            {t.isDark && (
              <>
                <div style={{ position:'absolute', top:5, left:8,  width:2, height:2, borderRadius:'50%', background:'rgba(107,184,232,0.7)' }}/>
                <div style={{ position:'absolute', top:9, left:14, width:1.5, height:1.5, borderRadius:'50%', background:'rgba(224,122,154,0.6)' }}/>
                <div style={{ position:'absolute', top:6, left:20, width:1, height:1, borderRadius:'50%', background:'rgba(255,255,255,0.5)' }}/>
              </>
            )}
            {/* Soleil rayons */}
            {!t.isDark && (
              <div style={{ position:'absolute', top:4, left:4, width:10, height:10, borderRadius:'50%', background:'rgba(255,255,255,0.5)', boxShadow:'0 0 6px rgba(255,255,255,0.8)' }}/>
            )}
            {/* Curseur */}
            <div style={{
              position: 'absolute', top: 3,
              left: t.isDark ? 20 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: t.isDark
                ? 'radial-gradient(circle at 35% 35%, #C8D8F0, #8A9DBB)'
                : 'radial-gradient(circle at 35% 35%, #FFFFFF, #F5D840)',
              boxShadow: t.isDark
                ? '0 1px 4px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.15)'
                : '0 1px 6px rgba(180,120,0,0.40), inset 0 1px 0 rgba(255,255,255,0.80)',
              transition: 'left 0.30s cubic-bezier(0.34,1.56,0.64,1), background 0.30s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, userSelect: 'none',
            }}>
              {t.isDark ? '🌙' : '☀️'}
            </div>
          </button>

          {/* Avatar du membre */}
          <Avatar p={myAvatar} size={34} ring={`${t.pink}66`} online={false} onClick={() => setTab('profile')} title="Mon profil" />

          {isMobile ? (
            /* Menu (mobile) : Partager, Soutenir, Déconnexion, liens légaux */
            <button onClick={() => setShowMenu(true)} aria-label="Menu"
              style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
              ☰
            </button>
          ) : (
            /* Déconnexion */
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
          )}
        </div>
      </nav>

      {/* ── Menu mobile (feuille du bas) ── */}
      {isMobile && showMenu && (
        <div onClick={() => setShowMenu(false)}
          style={{ position:'fixed', inset:0, zIndex:450, background:t.overlay, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e => e.stopPropagation()} className="animate-slide-up"
            style={{ width:'100%', background:t.surface, borderRadius:'22px 22px 0 0', padding:'10px 16px calc(16px + env(safe-area-inset-bottom))', border:`1px solid ${t.border}`, fontFamily:f }}>
            <div style={{ width:40, height:4, borderRadius:2, background:t.border, margin:'0 auto 14px' }}/>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:t.guardText, background:t.guardBg, padding:'6px 12px', borderRadius:20, width:'fit-content', marginBottom:8 }}>
              <span style={{ width:7, height:7, background:t.green, borderRadius:'50%' }}/> IA Guard actif
            </div>
            {[
              { label:'🚀 Partager Vibz', onClick: () => { setShowMenu(false); handleShare() }, danger: false },
              { label:'☕ Soutenir Vibz', onClick: () => { setShowMenu(false); setShowDon(true) }, danger: false },
              { label:'🚪 Déconnexion',   onClick: () => supabase.auth.signOut(), danger: true },
            ].map(item => (
              <button key={item.label} onClick={item.onClick}
                style={{ display:'block', width:'100%', textAlign:'left', padding:'14px 12px', borderRadius:14, border:'none', background:'transparent', color: item.danger ? t.pink : t.text, fontSize:15, fontWeight:700, fontFamily:f, cursor:'pointer' }}>
                {item.label}
              </button>
            ))}
            <div style={{ height:1, background:t.border, margin:'8px 0 12px' }}/>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px 16px', padding:'0 12px' }}>
              {legalLinks.map(l => (
                <a key={l.href} href={l.href} style={{ fontSize:12, color:t.textMuted, fontWeight:700, textDecoration:'none' }}>{l.label}</a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Contenu ── */}
      <div style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', minWidth: 0 }}>
        {tab === 'discover'  && <DiscoverPage user={user} onMessage={p => { setChatWith(p); setTab('messenger') }} onOpenSalon={openSalon} onMix={openMix} />}
        {tab === 'messenger' && <MessengerPage user={user} initialContact={chatWith} onContactOpened={() => setChatWith(null)} />}
        {tab === 'salons'    && <SalonsPage user={user} initialSalonId={salonToOpen} onInitialSalonOpened={() => setSalonToOpen(null)} initialMix={mixToOpen} onInitialMixUsed={() => setMixToOpen(null)} />}
        {tab === 'profile'   && <ProfilePage user={user} />}
      </div>

      {/* Assistant IA, disponible sur tous les onglets */}
      {ASSISTANT_ENABLED && <AssistantChat onOpenSalon={openSalon} onMix={tags => openMix(tags)}
        bottomOffset={isMobile ? TABBAR_H + 14 : 64} />}

      {/* L'admin confirme toutes les 45 min que son salon continue */}
      {adminCheck && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: f }}>
          <div role="alertdialog" aria-label="Le salon continue ?" style={{ background: t.surface, color: t.text, borderRadius: 20, padding: 22, maxWidth: 400, width: '100%', border: `1px solid ${t.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: 34, marginBottom: 6 }}>{adminCheck.icon || '🎛️'}</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>« {adminCheck.name} » tient toujours ?</div>
            <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.55, marginBottom: 18 }}>
              Tu es l’admin de ce salon ({adminCheck.member_count} membre{adminCheck.member_count > 1 ? 's' : ''}). Vibz te le demande toutes les 45 minutes :
              on continue, ou on le ferme ? S’il est fermé, ses messages sont effacés.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button disabled={checkBusy} onClick={() => answerCheck(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: f }}>🔒 Fermer le salon</button>
              <button disabled={checkBusy} onClick={() => answerCheck(true)} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: t.green, color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: f }}>✅ On continue</button>
            </div>
          </div>
        </div>
      )}

      {isMobile ? (
        <>
          {/* ── Barre d'onglets (mobile) ── */}
          <div style={{ height:`calc(${TABBAR_H}px + env(safe-area-inset-bottom))`, flexShrink:0 }}/>
          <nav className="vz-safe-bottom" style={{
            position:'fixed', left:0, right:0, bottom:0, zIndex:120,
            background:t.navBg, borderTop:`1px solid ${t.border}`,
            boxShadow:`0 -2px 12px ${t.shadow}`,
            display:'grid', gridTemplateColumns:`repeat(${tabs.length}, 1fr)`,
          }}>
            {tabs.map(tb => {
              const active = tab === tb.id
              return (
                <button key={tb.id} onClick={() => setTab(tb.id)} aria-current={active ? 'page' : undefined}
                  style={{ height:TABBAR_H, border:'none', background:'transparent', cursor:'pointer', fontFamily:f, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, color: active ? t.pink : t.textMuted, padding:0 }}>
                  <span style={{ fontSize:21, lineHeight:1, filter: active ? 'none' : 'grayscale(0.6)', opacity: active ? 1 : 0.75 }}>{tb.icon}</span>
                  <span style={{ fontSize:11, fontWeight:800 }}>{tb.label}</span>
                  <span style={{ width:18, height:3, borderRadius:2, background: active ? t.pink : 'transparent', marginTop:1 }}/>
                </button>
              )
            })}
          </nav>
        </>
      ) : (
        /* ── Footer légal (desktop) ── */
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
          {legalLinks.map(l => (
            <a key={l.href} href={l.href}
              target={l.href.startsWith('mailto') ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: t.textMuted, fontFamily: f, textDecoration: 'none', fontWeight: 700, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = t.pink)}
              onMouseLeave={e => (e.currentTarget.style.color = t.textMuted)}
            >{l.label}</a>
          ))}
          <button
            onClick={() => setShowDon(true)}
            style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:11, color:t.textMuted, fontFamily:f, fontWeight:700, padding:0, transition:'color 0.15s' }}
            onMouseEnter={e=>(e.currentTarget.style.color=t.pink)}
            onMouseLeave={e=>(e.currentTarget.style.color=t.textMuted)}
          >☕ Soutenir Vibz</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: t.textMuted, fontWeight: 700 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, background: t.green, borderRadius: '50%' }}/>
            RGPD · VibzGuard actif
          </div>
        </footer>
      )}
    </div>
  )
}
