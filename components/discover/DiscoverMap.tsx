import { useEffect, useRef, useState } from 'react'
import type { Map as LMap, Marker } from 'leaflet'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'

// Carte des musiciens présents, en temps réel — partagée avec le site vitrine
// (vibz-vitrine.vercel.app, même canal). Règles de confidentialité :
// - désactivée par défaut, jamais réactivée automatiquement ;
// - position arrondie dans le navigateur avant envoi (≈ 5 km ou ≈ 1 km) ;
// - anonyme : le canal est public, on n'y envoie ni identifiant ni pseudo ;
// - Realtime « presence » : rien n'est enregistré, le point disparaît à la déconnexion.

const CANAL = 'vibz-vitrine-carte'
const PAS = { ville: 0.05, quartier: 0.01 } as const
type Precision = keyof typeof PAS
const EMOJIS = ['🎸', '🎹', '🥁', '🎤', '🎻', '🎷', '🎧', '🎵']

interface Point { id: string; lat: number; lng: number; e: string; m?: boolean }

function arrondir(lat: number, lng: number, precision: Precision) {
  const p = PAS[precision]
  const pLng = p / Math.max(0.2, Math.cos(lat * Math.PI / 180))
  return { lat: +(Math.round(lat / p) * p).toFixed(4), lng: +(Math.round(lng / pLng) * pLng).toFixed(4) }
}

// Décalage d'affichage stable, pour que deux personnes d'une même cellule ne se superposent pas
function decalage(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return { lat: ((h & 0xff) / 255 - 0.5) * 0.006, lng: (((h >> 8) & 0xff) / 255 - 0.5) * 0.008 }
}

const valide = (p: Partial<Point>) =>
  typeof p.lat === 'number' && typeof p.lng === 'number' && p.lat >= -85 && p.lat <= 85 && p.lng >= -180 && p.lng <= 180

// Emoji proposé d'après le premier instrument du profil
export function emojiPourInstrument(instr?: string) {
  const s = (instr || '').toLowerCase()
  if (/guitar|basse|ukul/.test(s)) return '🎸'
  if (/piano|clavier|synth|orgue/.test(s)) return '🎹'
  if (/batter|percu/.test(s)) return '🥁'
  if (/chant|voix|rap/.test(s)) return '🎤'
  if (/violon|violoncelle|alto|contrebasse|harpe/.test(s)) return '🎻'
  if (/sax|trompette|flute|flûte|clarinette|trombone/.test(s)) return '🎷'
  if (/dj|mao|prod/.test(s)) return '🎧'
  return '🎵'
}

export default function DiscoverMap({ defaultEmoji = '🎵' }: { defaultEmoji?: string }) {
  const { theme: tk } = useTheme()
  const isMobile = useIsMobile()
  const boite = useRef<HTMLDivElement>(null)
  const carte = useRef<LMap | null>(null)
  const L = useRef<typeof import('leaflet') | null>(null)
  const marqueurs = useRef<Record<string, Marker>>({})
  const canal = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const connecte = useRef(false)
  const moi = useRef(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2))
  const surveillance = useRef<number | null>(null)
  const brute = useRef<{ lat: number; lng: number } | null>(null)
  const publie = useRef<Omit<Point, 'id'> | null>(null)
  const premiere = useRef(true)

  const [pret, setPret] = useState(false)
  const [points, setPoints] = useState<Point[]>([])
  const [visible, setVisible] = useState(false)
  const [precision, setPrecision] = useState<Precision>('ville')
  const [emoji, setEmoji] = useState(EMOJIS.includes(defaultEmoji) ? defaultEmoji : '🎵')
  const [etat, setEtat] = useState('Tu es invisible.')

  // Carte Leaflet (chargée côté navigateur uniquement)
  useEffect(() => {
    let annule = false
    import('leaflet').then(mod => {
      if (annule || !boite.current || carte.current) return
      L.current = mod
      const m = mod.map(boite.current, { worldCopyJump: true, zoomControl: !isMobile }).setView([46.6, 2.4], 5)
      mod.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 13, // inutile de zoomer plus fin que la précision partagée
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m)
      carte.current = m
      setPret(true)
    })
    return () => {
      annule = true
      carte.current?.remove()
      carte.current = null
      marqueurs.current = {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Canal temps réel
  useEffect(() => {
    const ch = supabase.channel(CANAL, { config: { presence: { key: moi.current } } })
    const lire = () => {
      const st = ch.presenceState() as Record<string, Omit<Point, 'id'>[]>
      setPoints(Object.entries(st).map(([id, l]) => ({ id, ...l[l.length - 1] })).filter(valide))
    }
    ch.on('presence', { event: 'sync' }, lire).subscribe(statut => {
      connecte.current = statut === 'SUBSCRIBED'
      if (connecte.current && publie.current) ch.track(publie.current)
    })
    canal.current = ch
    return () => {
      if (surveillance.current !== null) navigator.geolocation.clearWatch(surveillance.current)
      supabase.removeChannel(ch)
      canal.current = null
    }
  }, [])

  // Marqueurs
  useEffect(() => {
    const m = carte.current, lf = L.current
    if (!m || !lf) return
    const vus = new Set<string>()
    for (const p of points) {
      const d = decalage(p.id)
      const ll: [number, number] = [p.lat + d.lat, p.lng + d.lng]
      const estMoi = p.id === moi.current
      const el = document.createElement('div')
      el.className = 'vz-pastille' + (estMoi ? ' vz-moi' : p.m ? ' vz-membre' : '')
      el.textContent = EMOJIS.includes(p.e) ? p.e : '🎵'
      const icon = lf.divIcon({ html: el, className: '', iconSize: [34, 34], iconAnchor: [17, 17] })
      vus.add(p.id)
      const ex = marqueurs.current[p.id]
      if (ex) ex.setLatLng(ll).setIcon(icon)
      else marqueurs.current[p.id] = lf.marker(ll, { icon, keyboard: false })
        .bindTooltip(estMoi ? 'Toi (position floue)' : p.m ? 'Un membre Vibz, par ici' : 'Un visiteur musicien, par ici')
        .addTo(m)
    }
    for (const id of Object.keys(marqueurs.current)) {
      if (!vus.has(id)) { marqueurs.current[id].remove(); delete marqueurs.current[id] }
    }
  }, [points, pret])

  const publier = (prec = precision, e = emoji) => {
    if (!brute.current) return
    const a = arrondir(brute.current.lat, brute.current.lng, prec)
    const neuf = { lat: a.lat, lng: a.lng, e, m: true }
    const ancien = publie.current
    if (ancien && ancien.lat === neuf.lat && ancien.lng === neuf.lng && ancien.e === neuf.e) return
    publie.current = neuf
    if (canal.current && connecte.current) canal.current.track(neuf)
    if (premiere.current) { premiere.current = false; carte.current?.flyTo([a.lat, a.lng], prec === 'quartier' ? 11 : 9, { duration: 1.2 }) }
    setEtat(`Tu es visible, à ${prec === 'quartier' ? '≈ 1 km' : '≈ 5 km'} près.`)
  }

  const activer = () => {
    if (!('geolocation' in navigator)) { setEtat('Ton navigateur ne permet pas la géolocalisation.'); return }
    setVisible(true)
    setEtat('Localisation…')
    premiere.current = true
    surveillance.current = navigator.geolocation.watchPosition(pos => {
      brute.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      publier()
    }, err => {
      desactiver()
      setEtat(err.code === 1 ? 'Localisation refusée. Tu restes invisible.' : 'Position introuvable. Tu restes invisible.')
    }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 })
  }

  const desactiver = () => {
    if (surveillance.current !== null) navigator.geolocation.clearWatch(surveillance.current)
    surveillance.current = null
    brute.current = null
    publie.current = null
    if (canal.current && connecte.current) canal.current.untrack()
    setVisible(false)
    setEtat('Tu es invisible.')
  }

  // publier() lit l'état courant : on lui passe les nouvelles valeurs au moment du changement
  const changerPrecision = (p: Precision) => { setPrecision(p); publie.current = null; premiere.current = false; publier(p, emoji) }
  const changerEmoji = (e: string) => { setEmoji(e); publier(precision, e) }

  const nbMembres = points.filter(p => p.m).length
  const lbl: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: tk.textMuted }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, flex: 1 }}>
      <style>{`
        .vz-carte .leaflet-tile-pane { filter: ${tk.isDark ? 'invert(1) hue-rotate(180deg) grayscale(.6) brightness(.8)' : 'grayscale(.35) brightness(1.03)'}; }
        .vz-carte.leaflet-container { background: ${tk.bg2}; font-family: Nunito, sans-serif; }
        .vz-pastille { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 17px;
          background: ${tk.surface}; border: 1.5px solid ${tk.border}; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
        .vz-pastille.vz-membre { border-color: ${tk.pink}; }
        .vz-pastille.vz-moi { border: 2.5px solid ${tk.pink}; animation: vzPouls 2.4s ease-out infinite; }
        @keyframes vzPouls { 0% { box-shadow: 0 0 0 0 ${tk.pink}88; } 100% { box-shadow: 0 0 0 14px ${tk.pink}00; } }
        @media (prefers-reduced-motion: reduce) { .vz-pastille.vz-moi { animation: none; } }
      `}</style>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: tk.surface, border: `0.5px solid ${tk.border}` }}>
        <button onClick={() => (visible ? desactiver() : activer())} role="switch" aria-checked={visible}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'Nunito,sans-serif', fontSize: 12.5, fontWeight: 800,
            border: `1px solid ${visible ? tk.pink : tk.border}`, background: visible ? tk.pinkLight : 'transparent', color: visible ? tk.pinkDark : tk.text }}>
          <span aria-hidden="true">{visible ? '📍' : '👻'}</span>{visible ? 'Je suis sur la carte' : 'Apparaître sur la carte'}
        </button>
        <div role="radiogroup" aria-label="Précision affichée" style={{ display: 'flex', gap: 4, opacity: visible ? 1 : 0.45 }}>
          {(['ville', 'quartier'] as Precision[]).map(p => (
            <button key={p} role="radio" aria-checked={precision === p} disabled={!visible} onClick={() => changerPrecision(p)}
              style={{ padding: '6px 10px', borderRadius: 10, fontSize: 11.5, fontWeight: 800, fontFamily: 'Nunito,sans-serif', cursor: visible ? 'pointer' : 'default',
                border: `1px solid ${precision === p ? tk.pink : tk.border}`, background: precision === p ? tk.pinkLight : 'transparent', color: precision === p ? tk.pinkDark : tk.textMuted }}>
              {p === 'ville' ? 'Ville ≈ 5 km' : 'Quartier ≈ 1 km'}
            </button>
          ))}
        </div>
        <select value={emoji} disabled={!visible} onChange={e => changerEmoji(e.target.value)} aria-label="Mon instrument sur la carte"
          style={{ padding: '6px 8px', borderRadius: 10, border: `1px solid ${tk.border}`, background: tk.inputBg, color: tk.text, fontSize: 13, opacity: visible ? 1 : 0.45 }}>
          {EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: tk.text }}>{points.length} <span style={{ fontSize: 11.5, fontWeight: 700, color: tk.textMuted }}>sur la carte</span></div>
          <div style={lbl}>{nbMembres} membre{nbMembres > 1 ? 's' : ''} · {points.length - nbMembres} visiteur{points.length - nbMembres > 1 ? 's' : ''}</div>
        </div>
      </div>

      <div ref={boite} className="vz-carte" role="region" aria-label="Carte des musiciens présents"
        style={{ flex: 1, minHeight: isMobile ? 360 : 420, borderRadius: 16, overflow: 'hidden', border: `0.5px solid ${tk.border}` }} />

      <div role="status" aria-live="polite" style={{ fontSize: 11.5, color: tk.textMuted, lineHeight: 1.5 }}>
        {etat} Anonyme : ni pseudo ni profil sur la carte. Rien n&apos;est enregistré — tu disparais en quittant la page.
      </div>
    </div>
  )
}
