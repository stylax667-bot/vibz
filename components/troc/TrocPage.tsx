import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, type Profile } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { useIsMobile } from '../../lib/useIsMobile'
import {
  TROC_CATEGORIES, TROC_KINDS, TROC_SELECT, trocCategory, trocError, trocKind, trocLinks, trocPrice, uploadTrocPhoto,
  type TrocDraft, type TrocKind, type TrocListing,
} from '../../lib/troc'
import Avatar from '../shared/Avatar'

// Onglet Troc : succursale de TrocMusic dans Vibz. Mêmes annonces, en temps réel ;
// contact direct par la messagerie Vibz ; renvois fréquents vers le site complet.
const AMBER = '#D9822B', AMBER_DARK = '#A35A12', AMBER_LIGHT = '#FCEBD7'

export default function TrocPage({ user, onMessage, focusId, onFocusUsed, draft, onDraftUsed }: {
  user: User
  onMessage: (p: Profile) => void
  focusId?: string | null
  onFocusUsed?: () => void
  draft?: TrocDraft | null
  onDraftUsed?: () => void
}) {
  const { theme: t } = useTheme()
  const isMobile = useIsMobile()
  const f = 'Nunito, sans-serif'
  const [items, setItems] = useState<TrocListing[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [kind, setKind] = useState<TrocKind | ''>('')
  const [cat, setCat] = useState('')
  const [q, setQ] = useState('')
  const [mineOnly, setMineOnly] = useState(false)
  const [open, setOpen] = useState<TrocListing | null>(null)
  const [form, setForm] = useState<TrocDraft | null>(null)
  const [toast, setToast] = useState('')
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    let req = supabase.from('troc_listings').select(TROC_SELECT).order('created_at', { ascending: false }).limit(80)
    req = mineOnly ? req.eq('seller_id', user.id) : req.in('status', ['active', 'reserve'])
    if (kind) req = req.eq('kind', kind)
    if (cat) req = req.eq('category', cat)
    if (q.trim()) req = req.ilike('title', `%${q.trim()}%`)
    const { data, error } = await req
    setErr(error ? trocError(error.message) : null)
    setItems((data as TrocListing[]) || [])
    setLoading(false)
  }, [kind, cat, q, mineOnly, user.id])

  useEffect(() => { const h = setTimeout(load, q ? 300 : 0); return () => clearTimeout(h) }, [load, q])

  // Nouvelles annonces (TrocMusic ou Vibz) en direct
  useEffect(() => {
    const ch = supabase.channel('troc-listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'troc_listings' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  // Arrivée depuis TrocMusic (?troc=<annonce>) : on ouvre la fiche
  useEffect(() => {
    if (!focusId) return
    supabase.from('troc_listings').select(TROC_SELECT).eq('id', focusId).maybeSingle()
      .then(({ data }) => { if (data) setOpen(data as TrocListing); onFocusUsed?.() })
  }, [focusId, onFocusUsed])

  // Brouillon venu d'une photo partagée dans un tchat/salon
  useEffect(() => { if (draft) { setForm(draft); onDraftUsed?.() } }, [draft, onDraftUsed])

  const contact = async (l: TrocListing) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', l.seller_id).maybeSingle()
    if (data) onMessage(data as Profile)
  }

  const chip = (active: boolean, color = AMBER): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 18, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: f, flexShrink: 0,
    border: `1.5px solid ${active ? color : t.border}`, background: active ? color : t.surface, color: active ? 'white' : t.textSub,
  })

  return (
    <div style={{ minHeight: 'var(--vz-app-h, calc(100vh - 60px))', background: t.bg2, fontFamily: f, padding: isMobile ? 12 : '20px 24px', position: 'relative' }}>
      {/* ── En-tête : la succursale renvoie au site complet ── */}
      <div style={{ borderRadius: 22, padding: isMobile ? 16 : 22, background: `linear-gradient(135deg, ${AMBER} 0%, #E07A9A 70%, #6BB8E8 100%)`, color: 'white', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, opacity: 0.85, textTransform: 'uppercase' }}>Vibz × TrocMusic</div>
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, lineHeight: 1.15, marginTop: 4 }}>🔁 Troc, don & revente de matos</div>
          <div style={{ fontSize: 13, opacity: 0.92, marginTop: 6, lineHeight: 1.5 }}>
            Les annonces de TrocMusic, ici dans Vibz. Même compte, contact par ta messagerie Vibz. Aucun paiement sur le site.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setForm({ photos: [] })} style={{ padding: '11px 18px', borderRadius: 24, border: 'none', background: 'white', color: AMBER_DARK, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: f }}>📸 Publier une annonce</button>
          <a href={trocLinks.home()} target="_blank" rel="noopener noreferrer" style={{ padding: '11px 18px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.7)', color: 'white', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>Ouvrir TrocMusic ↗</a>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : Strat, SM58, Juno…"
          style={{ flex: '1 1 220px', padding: '10px 16px', borderRadius: 22, border: `1.5px solid ${t.border}`, background: t.surface, color: t.text, fontFamily: f, fontSize: 14, outline: 'none' }} />
        <button onClick={() => setMineOnly(v => !v)} style={chip(mineOnly, '#E07A9A')}>📦 Mes annonces</button>
      </div>
      <div className="vz-scroll-x" style={{ display: 'flex', gap: 6, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
        <button onClick={() => setKind('')} style={chip(!kind, t.text)}>Tout</button>
        {TROC_KINDS.map(k => <button key={k.id} onClick={() => setKind(kind === k.id ? '' : k.id)} style={chip(kind === k.id)}>{k.icon} {k.label}</button>)}
        <span style={{ width: 1, background: t.border, margin: '0 4px', flexShrink: 0 }} />
        {TROC_CATEGORIES.map(c => <button key={c.id} onClick={() => setCat(cat === c.id ? '' : c.id)} style={chip(cat === c.id, AMBER_DARK)}>{c.icon} {c.label}</button>)}
      </div>

      {err && <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: t.modBg, color: t.modText, fontSize: 13, fontWeight: 700 }}>{err}</div>}

      {/* ── Annonces ── */}
      {loading ? (
        <div style={{ textAlign: 'center', color: t.textMuted, padding: 40 }}>Chargement des annonces…</div>
      ) : items.length === 0 && !err ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: t.textSub }}>
          <div style={{ fontSize: 40 }}>🎸</div>
          <div style={{ fontWeight: 800, color: t.text, marginTop: 6 }}>{mineOnly ? 'Tu n’as pas encore d’annonce.' : 'Aucune annonce ne correspond.'}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Une photo prise sur le vif suffit pour commencer.</div>
          <button onClick={() => setForm({ photos: [] })} style={{ marginTop: 14, padding: '10px 18px', borderRadius: 22, border: 'none', background: AMBER, color: 'white', fontWeight: 800, cursor: 'pointer', fontFamily: f }}>📸 Publier une annonce</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 200}px, 1fr))`, gap: 12, marginTop: 14 }}>
          {items.flatMap((l, i) => {
            const card = <Card key={l.id} l={l} onOpen={() => setOpen(l)} />
            // Un encart TrocMusic s'intercale après la 8e annonce (ou en fin de liste si moins)
            return i === Math.min(7, items.length - 1) ? [card, <TrocMusicPromo key="promo" />] : [card]
          })}
        </div>
      )}

      <div style={{ textAlign: 'center', margin: '22px 0 8px' }}>
        <a href={trocLinks.home()} target="_blank" rel="noopener noreferrer" style={{ color: AMBER_DARK, fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
          Toutes les annonces, favoris et recherche avancée sur TrocMusic ↗
        </a>
      </div>

      {open && <Detail l={open} me={user.id} onClose={() => setOpen(null)} onContact={() => { contact(open); setOpen(null) }}
        onChanged={() => { setOpen(null); load() }} onError={flash} />}
      {form && <PublishForm user={user} draft={form} onClose={() => setForm(null)}
        onDone={id => { setForm(null); flash('✅ Annonce publiée sur Vibz et TrocMusic'); load(); supabase.from('troc_listings').select(TROC_SELECT).eq('id', id).maybeSingle().then(({ data }) => data && setOpen(data as TrocListing)) }} />}

      {toast && <div style={{ position: 'fixed', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 700, background: t.text, color: t.surface, padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, maxWidth: 'calc(100vw - 24px)' }}>{toast}</div>}
    </div>
  )
}

function Card({ l, onOpen }: { l: TrocListing; onOpen: () => void }) {
  const { theme: t } = useTheme()
  const k = trocKind(l.kind)
  return (
    <button onClick={onOpen} style={{ textAlign: 'left', padding: 0, border: `1px solid ${t.border}`, borderRadius: 16, overflow: 'hidden', background: t.surface, cursor: 'pointer', fontFamily: 'Nunito, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: t.bg2, width: '100%' }}>
        {l.photos[0]
          ? <img src={l.photos[0]} alt={l.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ height: '100%', display: 'grid', placeItems: 'center', fontSize: 40, opacity: 0.4 }}>{trocCategory(l.category).icon}</div>}
        <span style={{ position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 12, background: AMBER_LIGHT, color: AMBER_DARK, fontSize: 11, fontWeight: 800 }}>{k.icon} {k.label}</span>
        {l.status !== 'active' && <span style={{ position: 'absolute', top: 8, right: 8, padding: '3px 9px', borderRadius: 12, background: '#1F1A17', color: 'white', fontSize: 11, fontWeight: 800 }}>{l.status === 'reserve' ? 'Réservé' : 'Terminé'}</span>}
      </div>
      <div style={{ padding: '9px 11px 11px' }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: t.text, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.title}</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: AMBER_DARK, marginTop: 3 }}>{trocPrice(l)}</div>
        {l.city && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>📍 {l.city}</div>}
      </div>
    </button>
  )
}

function TrocMusicPromo() {
  return (
    <a href={trocLinks.deposer()} target="_blank" rel="noopener noreferrer" style={{ borderRadius: 16, padding: 16, background: '#1F1A17', color: 'white', textDecoration: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 180, fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ fontSize: 30 }}>🔁</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16 }}>troc<span style={{ color: AMBER }}>music</span></div>
        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4, lineHeight: 1.45 }}>Le site complet : jusqu’à 8 photos, favoris, partage de tes annonces.</div>
        <div style={{ marginTop: 10, fontWeight: 800, fontSize: 13, color: AMBER }}>Y aller ↗</div>
      </div>
    </a>
  )
}

function Detail({ l, me, onClose, onContact, onChanged, onError }: {
  l: TrocListing; me: string; onClose: () => void; onContact: () => void; onChanged: () => void; onError: (m: string) => void
}) {
  const { theme: t } = useTheme()
  const isMobile = useIsMobile()
  const [i, setI] = useState(0)
  const mine = l.seller_id === me
  const k = trocKind(l.kind); const c = trocCategory(l.category)
  const name = l.seller?.display_name || l.seller?.username || 'Membre'
  const f = 'Nunito, sans-serif'

  const setStatus = async (status: TrocListing['status']) => {
    const { error } = await supabase.from('troc_listings').update({ status }).eq('id', l.id)
    if (error) onError(trocError(error.message)); else onChanged()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 550, background: t.overlay, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20, fontFamily: f }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.surface, color: t.text, width: '100%', maxWidth: 560, maxHeight: isMobile ? '92dvh' : '90vh', overflowY: 'auto', borderRadius: isMobile ? '22px 22px 0 0' : 22, border: `1px solid ${t.border}` }}>
        <div style={{ position: 'relative', background: t.bg2, aspectRatio: '4 / 3' }}>
          {l.photos.length
            ? <img src={l.photos[i]} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            : <div style={{ height: '100%', display: 'grid', placeItems: 'center', fontSize: 60, opacity: 0.4 }}>{c.icon}</div>}
          <button onClick={onClose} aria-label="Fermer" style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        {l.photos.length > 1 && (
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px 0', overflowX: 'auto' }}>
            {l.photos.map((p, j) => <img key={p} src={p} alt="" onClick={() => setI(j)} style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: `2px solid ${i === j ? AMBER : 'transparent'}` }} />)}
          </div>
        )}
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 11, fontWeight: 800 }}>
            <span style={{ padding: '3px 9px', borderRadius: 12, background: AMBER_LIGHT, color: AMBER_DARK }}>{k.icon} {k.label}</span>
            <span style={{ padding: '3px 9px', borderRadius: 12, background: t.bg2, color: t.textSub }}>{c.icon} {c.label}</span>
            {l.source === 'trocmusic' && <span style={{ padding: '3px 9px', borderRadius: 12, background: t.bg2, color: t.textSub }}>publiée sur TrocMusic</span>}
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, marginTop: 10, lineHeight: 1.2 }}>{l.title}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: AMBER_DARK, marginTop: 4 }}>{trocPrice(l)}</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>{[l.brand, l.city].filter(Boolean).join(' · ')}</div>
          {l.wanted && <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: AMBER_LIGHT, color: '#5B3A12', fontSize: 13 }}><strong>Recherche en échange :</strong> {l.wanted}</div>}
          {l.description && <div style={{ marginTop: 12, fontSize: 14, color: t.textSub, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{l.description}</div>}

          {!mine && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, borderRadius: 14, background: t.bg2 }}>
              <Avatar p={{ display_name: name, avatar_url: l.seller?.avatar_url, avatar_emoji: l.seller?.avatar_emoji }} size={38} online={false} />
              <div style={{ flex: 1, fontSize: 13 }}><strong>{name}</strong><div style={{ color: t.textMuted, fontSize: 12 }}>membre de Vibz</div></div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            {mine ? (
              <>
                {l.status !== 'active' && <button onClick={() => setStatus('active')} style={btn(AMBER)}>Remettre en ligne</button>}
                {l.status === 'active' && <button onClick={() => setStatus('reserve')} style={btn(AMBER)}>Marquer réservé</button>}
                {l.status !== 'termine' && <button onClick={() => setStatus('termine')} style={btn(t.textSub)}>Terminé</button>}
                <a href={trocLinks.mine()} target="_blank" rel="noopener noreferrer" style={{ ...btn('#E07A9A'), textDecoration: 'none' }}>Modifier sur TrocMusic ↗</a>
              </>
            ) : (
              <button onClick={onContact} style={{ ...btn('#E07A9A'), flex: '1 1 200px' }}>💬 Écrire à {name}</button>
            )}
            <a href={trocLinks.listing(l.id)} target="_blank" rel="noopener noreferrer" style={{ ...btn(AMBER_DARK, true), textDecoration: 'none' }}>Voir sur TrocMusic ↗</a>
          </div>
          <div style={{ marginTop: 14, fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>🛡️ Aucun paiement ne passe par Vibz ni TrocMusic. Préfère la remise en main propre ; ne paie jamais par carte cadeau ou mandat.</div>
        </div>
      </div>
    </div>
  )
}

const btn = (color: string, ghost = false): React.CSSProperties => ({
  padding: '10px 16px', borderRadius: 22, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Nunito, sans-serif',
  border: ghost ? `1.5px solid ${color}` : 'none', background: ghost ? 'transparent' : color, color: ghost ? color : 'white', textAlign: 'center',
})

function PublishForm({ user, draft, onClose, onDone }: { user: User; draft: TrocDraft; onClose: () => void; onDone: (id: string) => void }) {
  const { theme: t } = useTheme()
  const isMobile = useIsMobile()
  const f = 'Nunito, sans-serif'
  const camRef = useRef<HTMLInputElement>(null)
  const galRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<string[]>(draft.photos)
  const [kind, setKind] = useState<TrocKind>('vente')
  const [category, setCategory] = useState('guitares')
  const [title, setTitle] = useState(draft.title || '')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('city').eq('id', user.id).maybeSingle().then(({ data }) => { if (data?.city) setCity(c => c || data.city) })
  }, [user.id])

  const add = async (fl: FileList | null) => {
    if (!fl?.length) return
    setUploading(true); setErr(null)
    try {
      for (const file of Array.from(fl).slice(0, 4 - photos.length)) {
        const url = await uploadTrocPhoto(user.id, file)
        setPhotos(p => [...p, url])
      }
    } catch (e) { setErr((e as Error).message) }
    setUploading(false)
  }

  const submit = async () => {
    setErr(null)
    const cents = price.trim() ? Math.round(parseFloat(price.replace(',', '.')) * 100) : null
    if (title.trim().length < 3) { setErr('Donne un titre (3 caractères minimum).'); return }
    if (kind === 'vente' && (cents == null || isNaN(cents))) { setErr('Indique un prix pour une vente.'); return }
    setBusy(true)
    const { data, error } = await supabase.from('troc_listings').insert({
      seller_id: user.id, source: 'vibz', kind, category, title: title.trim(), description: description.trim(),
      price_cents: kind === 'don' ? null : (cents != null && !isNaN(cents) ? cents : null),
      city: city.trim() || null, photos,
    }).select('id').single()
    setBusy(false)
    if (error) { setErr(trocError(error.message)); return }
    if (draft.shareId) await supabase.from('photo_shares').update({ listing_id: data.id }).eq('id', draft.shareId)
    onDone(data.id)
  }

  const field: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${t.border}`, background: t.inputBg, color: t.text, fontFamily: f, fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, margin: '12px 0 6px', display: 'block' }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 560, background: t.overlay, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 20, fontFamily: f }}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.surface, color: t.text, width: '100%', maxWidth: 480, maxHeight: isMobile ? '94dvh' : '92vh', overflowY: 'auto', borderRadius: isMobile ? '22px 22px 0 0' : 22, padding: 18, border: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 800 }}>📸 Publier une annonce</div>
          <button onClick={onClose} aria-label="Fermer" style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: t.textMuted }}>✕</button>
        </div>
        <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>Visible aussitôt ici et sur TrocMusic. Les membres te contactent par ta messagerie Vibz.</div>

        <span style={label}>Photos</span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {photos.map(p => (
            <div key={p} style={{ position: 'relative' }}>
              <img src={p} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10 }} />
              <button onClick={() => setPhotos(ps => ps.filter(x => x !== p))} aria-label="Retirer" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', border: 'none', background: t.text, color: t.surface, fontSize: 11, cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          {uploading && <div style={{ width: 72, height: 72, borderRadius: 10, background: AMBER_LIGHT, display: 'grid', placeItems: 'center', fontSize: 11, color: AMBER_DARK, fontWeight: 800 }}>Envoi…</div>}
          {photos.length < 4 && !uploading && (
            <>
              <button onClick={() => camRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 10, border: 'none', background: AMBER, color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: f }}>📷<br />Photo</button>
              <button onClick={() => galRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 10, border: `1.5px dashed ${t.border}`, background: 'transparent', color: t.textSub, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: f }}>🖼️<br />Galerie</button>
            </>
          )}
        </div>
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => { add(e.target.files); e.target.value = '' }} />
        <input ref={galRef} type="file" accept="image/*" multiple hidden onChange={e => { add(e.target.files); e.target.value = '' }} />

        <span style={label}>Type</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {TROC_KINDS.map(k => (
            <button key={k.id} onClick={() => setKind(k.id)} style={{ padding: '9px 4px', borderRadius: 12, border: `1.5px solid ${kind === k.id ? AMBER : t.border}`, background: kind === k.id ? AMBER_LIGHT : 'transparent', color: kind === k.id ? AMBER_DARK : t.textSub, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: f }}>{k.icon}<br />{k.label}</button>
          ))}
        </div>

        <span style={label}>Titre</span>
        <input style={field} value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="Ex. Ampli Fender Blues Junior" />
        <span style={label}>Catégorie</span>
        <select style={field} value={category} onChange={e => setCategory(e.target.value)}>
          {TROC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          {kind !== 'don' && (
            <div style={{ flex: 1 }}>
              <span style={label}>{kind === 'vente' ? 'Prix (€)' : 'Valeur (€)'}</span>
              <input style={field} inputMode="decimal" value={price} onChange={e => setPrice(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder={kind === 'vente' ? '0' : 'facultatif'} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <span style={label}>Ville</span>
            <input style={field} value={city} onChange={e => setCity(e.target.value)} maxLength={80} />
          </div>
        </div>
        <span style={label}>Description</span>
        <textarea style={{ ...field, minHeight: 90, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} placeholder="État, ce qui est fourni… (pas de numéro : VibzGuard le refuse)" />

        {err && <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: t.modBg, color: t.modText, fontSize: 13, fontWeight: 700 }}>{err}</div>}
        <button disabled={busy || uploading} onClick={submit} style={{ width: '100%', marginTop: 14, padding: 13, borderRadius: 14, border: 'none', background: AMBER, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: f, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Publication…' : 'Publier'}
        </button>
        <a href={trocLinks.deposer()} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 12, color: AMBER_DARK, fontWeight: 800, textDecoration: 'none' }}>Plus d’options (8 photos, état, marque, troc souhaité) sur TrocMusic ↗</a>
      </div>
    </div>
  )
}
