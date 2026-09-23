import { useState, useEffect, useMemo } from 'react'
import { CATALOG_BY_ID, searchCatalog, type CatalogItem } from '../../lib/musicCatalog'
import { comboKey, defaultSalonName, type SalonRow } from '../../lib/salons'
import { useIsMobile } from '../../lib/useIsMobile'

interface Props {
  onClose: () => void
  existingSalons: SalonRow[]
  salonCounts: Record<string, number>
  // Crée (ou rejoint) le salon de la combinaison — renvoie un message d'erreur éventuel
  onOpen: (ids: string[], name?: string) => Promise<string | null>
}

export default function VinylMixCreator({ onClose, existingSalons, salonCounts, onOpen }: Props) {
  const isMobile = useIsMobile()
  const [selected, setSelected]   = useState<string[]>([])
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<'Tous' | 'Styles' | 'Instruments'>('Tous')
  const [salonName, setSalonName] = useState('')
  const [angle, setAngle]         = useState(0)
  const [dragOver, setDragOver]   = useState(false)
  const [busy, setBusy]           = useState(false)
  const [error, setError]         = useState('')

  // Rotation vinyle
  useEffect(() => {
    if (selected.length === 0) return
    const id = setInterval(() => setAngle(a => (a + 1.5) % 360), 16)
    return () => clearInterval(id)
  }, [selected.length])

  // Fermeture avec Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const kind = tab === 'Styles' ? 'style' : tab === 'Instruments' ? 'instrument' : undefined
    return searchCatalog(search, kind)
  }, [search, tab])

  // Un salon existe déjà pour cette combinaison exacte → on le rejoint
  const duplicate = useMemo(() => {
    if (selected.length === 0) return null
    const k = comboKey(selected)
    return existingSalons.find(s => s.combo_key === k) || null
  }, [selected, existingSalons])

  const toggle = (id: string) => {
    setError('')
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const id = e.dataTransfer.getData('mix-item')
    if (id && !selected.includes(id)) setSelected(p => [...p, id])
  }

  const handleCreate = async () => {
    if (selected.length === 0 || busy) return
    setBusy(true); setError('')
    const err = await onOpen(selected, duplicate ? undefined : salonName)
    setBusy(false)
    if (err) setError(err)
    else onClose()
  }

  const selectedItems = selected.map(id => CATALOG_BY_ID[id]).filter(Boolean)
  const firstColor = selectedItems[0]?.color || '#5A6A8A'
  const font = 'Nunito, sans-serif'
  const disc = isMobile ? 110 : 140

  const chip = (item: CatalogItem) => {
    const on = selected.includes(item.id)
    return (
      <button
        key={item.id}
        draggable
        onDragStart={e => e.dataTransfer.setData('mix-item', item.id)}
        onClick={() => toggle(item.id)}
        aria-pressed={on}
        style={{
          padding: isMobile ? '8px 12px' : '6px 12px', borderRadius: 20, cursor: 'pointer', userSelect: 'none', fontFamily: font,
          background: on ? `${item.color}28` : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${on ? item.color : 'rgba(255,255,255,0.07)'}`,
          color: on ? item.color : '#9BA8C0', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.12s',
        }}
      >
        <span style={{ fontSize: 13 }}>{item.emoji}</span>
        {item.label}
        {on && <span style={{ fontSize: 10, opacity: 0.8 }}>✓</span>}
      </button>
    )
  }

  const group = (kind: CatalogItem['kind'], title: string, color: string) => {
    const items = filtered.filter(i => i.kind === kind)
    if (!items.length) return null
    return (
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, color, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          {title} <span style={{ fontSize: 9, color: '#5A6A8A', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>{items.length} résultat{items.length > 1 ? 's' : ''}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{items.map(chip)}</div>
      </div>
    )
  }

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16, fontFamily: font }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label="Créer un salon Mix"
        style={{ background: '#161B26', borderRadius: isMobile ? '24px 24px 0 0' : 28, width: '100%', maxWidth: 740, maxHeight: isMobile ? '94dvh' : '90vh', display: 'flex', flexDirection: 'column', border: `1.5px solid ${firstColor}44`, boxShadow: `0 32px 80px ${firstColor}22`, overflow: 'hidden' }}>

        {/* ── En-tête ── */}
        <div style={{ padding: isMobile ? '16px 16px 12px' : '20px 24px 16px', borderBottom: '1.5px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#E2E8F8' }}>🎛️ Créer un salon Mix</div>
              <div style={{ fontSize: 11, color: '#7A8AAA', marginTop: 2 }}>Mélange librement styles et instruments</div>
            </div>
            <button onClick={onClose} aria-label="Fermer" style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9BA8C0', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>✕</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 14, color: '#5A6A8A' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && filtered[0]) { toggle(filtered[0].id); setSearch('') } }}
                placeholder="Rechercher un style ou un instrument…" aria-label="Rechercher un style ou un instrument"
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: '#E2E8F8', fontSize: 13, fontFamily: font, outline: 'none' }} />
              {search && <button onClick={() => setSearch('')} aria-label="Effacer" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#5A6A8A', fontSize: 14, padding: 0 }}>✕</button>}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Tous', 'Styles', 'Instruments'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '8px 12px', borderRadius: 12, border: `1.5px solid ${tab === t ? firstColor : 'rgba(255,255,255,0.08)'}`,
                  background: tab === t ? `${firstColor}22` : 'transparent', color: tab === t ? firstColor : '#7A8AAA',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap',
                }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Corps : vinyle + choix ── */}
        <div style={{ flex: 1, minHeight: 0, display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '200px 1fr', overflow: isMobile ? 'auto' : 'hidden' }}>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '12px 16px' : 20, borderRight: isMobile ? 'none' : '1.5px solid rgba(255,255,255,0.06)', borderBottom: isMobile ? '1.5px solid rgba(255,255,255,0.06)' : 'none', gap: 12 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ width: disc, height: disc, borderRadius: '50%', position: 'relative', flexShrink: 0, boxShadow: `0 0 ${dragOver ? 48 : 24}px ${firstColor}${dragOver ? '88' : '33'}`, transition: 'box-shadow 0.3s' }}
            >
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: `conic-gradient(from ${angle}deg, #0d1117 0deg, #1c2233 60deg, #0d1117 120deg, #161b26 180deg, #0d1117 240deg, #1c2233 300deg, #0d1117 360deg)`,
                border: `2.5px solid ${dragOver ? firstColor : selected.length > 0 ? firstColor + '88' : '#2A3350'}`, position: 'relative',
              }}>
                {[38, 52, 66, 80].map(r => (
                  <div key={r} style={{ position: 'absolute', top: `${50 - r / 2}%`, left: `${50 - r / 2}%`, width: `${r}%`, height: `${r}%`, borderRadius: '50%', border: `1px solid rgba(255,255,255,${selected.length > 0 ? '0.07' : '0.04'})` }} />
                ))}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 44, height: 44, borderRadius: '50%', background: 'radial-gradient(circle at 38% 35%, #ff4040, #990000)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 14 }}>
                  {selected.length || ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: isMobile ? 'flex-start' : 'center', minWidth: 0 }}>
              <div style={{ fontSize: 11, color: dragOver ? firstColor : '#7A8AAA', fontWeight: 700, textAlign: isMobile ? 'left' : 'center', lineHeight: 1.4 }}>
                {dragOver ? '⬇️ Lâche ici !' : selected.length > 0 ? `${selected.length} élément${selected.length > 1 ? 's' : ''} dans ton mix` : 'Touche ou glisse un style / instrument'}
              </div>
              {selectedItems.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: isMobile ? 'flex-start' : 'center' }}>
                  {selectedItems.map(item => (
                    <button key={item.id} onClick={() => toggle(item.id)} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: font, background: `${item.color}22`, border: `1px solid ${item.color}66`, color: item.color }}>
                      {item.emoji} {item.label} ✕
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ overflowY: isMobile ? 'visible' : 'auto', padding: isMobile ? '12px 16px' : '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {duplicate && (
              <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(107,184,232,0.12)', border: '1.5px solid rgba(107,184,232,0.3)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#6BB8E8', marginBottom: 4 }}>🔀 Ce mix existe déjà</div>
                <div style={{ fontSize: 11, color: '#9BA8C0' }}>
                  <strong style={{ color: '#E2E8F8' }}>{duplicate.name}</strong>
                  {' · '}{(salonCounts[duplicate.id] || 0) > 0 ? `${salonCounts[duplicate.id]} connecté${salonCounts[duplicate.id] > 1 ? 's' : ''}` : 'personne en ce moment'}
                </div>
              </div>
            )}
            {(tab === 'Tous' || tab === 'Styles') && group('style', '🎼 Styles musicaux', '#E07A9A')}
            {(tab === 'Tous' || tab === 'Instruments') && group('instrument', '🎵 Instruments', '#52C07A')}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: '#7A8AAA', fontSize: 13 }}>Aucun résultat pour « {search} »</div>
            )}
          </div>
        </div>

        {/* ── Pied ── */}
        <div style={{ padding: isMobile ? '12px 16px calc(12px + env(safe-area-inset-bottom))' : '16px 24px', borderTop: '1.5px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selected.length > 0 && !duplicate && (
            <input value={salonName} onChange={e => setSalonName(e.target.value)} maxLength={80}
              placeholder={`Nom du salon (optionnel) · ${defaultSalonName(selected)}`}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${firstColor}44`, background: 'rgba(255,255,255,0.04)', color: '#E2E8F8', fontSize: 13, fontFamily: font, outline: 'none', boxSizing: 'border-box' }} />
          )}
          {error && <div style={{ fontSize: 12, color: '#E07A7A', fontWeight: 700 }}>⚠️ {error}</div>}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!isMobile && (
              <div style={{ flex: 1, fontSize: 10, color: '#7A8AAA', lineHeight: 1.5 }}>
                🛡️ Salon protégé par <strong style={{ color: '#52C07A' }}>VibzGuard</strong>. Tu pourras le fermer quand tu veux.
              </div>
            )}
            <button onClick={onClose} style={{ padding: '11px 18px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9BA8C0', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap' }}>
              Annuler
            </button>
            <button onClick={handleCreate} disabled={selected.length === 0 || busy}
              style={{
                flex: isMobile ? 1 : undefined, padding: '11px 22px', borderRadius: 14, border: 'none',
                background: selected.length === 0 ? 'rgba(255,255,255,0.05)' : duplicate ? 'linear-gradient(135deg,#6BB8E8,#52C07A)' : `linear-gradient(135deg,${firstColor},#A78BDB)`,
                color: selected.length === 0 ? '#5A6A8A' : 'white', fontWeight: 800, fontSize: 13,
                cursor: selected.length === 0 ? 'not-allowed' : busy ? 'wait' : 'pointer', fontFamily: font,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
              {busy ? '…' : selected.length === 0 ? 'Sélectionne des éléments' : duplicate ? '🔀 Rejoindre ce salon' : '🎛️ Créer le salon'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
