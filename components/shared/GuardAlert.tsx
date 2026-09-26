import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../lib/theme'
import { BLOCKS_EVENT } from '../../lib/moderation'

// Alerte VibzGuard côté victime : un message grave d'un membre a été bloqué
// avant de lui parvenir. Elle choisit de bloquer ce membre ou de continuer.
// Données : table vibzguard_alerts (supabase/migrations/20260929_vibzguard_alertes.sql).

interface Alert { id: number; offender_id: string; category: string; hits: number; created_at: string }

const LABELS: Record<string, string> = {
  menace: 'des menaces',
  incitation: 'une incitation à te faire du mal',
  haine: 'des propos haineux',
  sexuel: 'une sollicitation sexuelle',
  emprise: 'une tentative d’emprise',
  harcelement: 'des insultes ou du harcèlement',
  arnaque: 'une tentative d’arnaque',
}

export default function GuardAlert({ user }: { user: User }) {
  const { theme: t } = useTheme()
  const f = 'Nunito, sans-serif'
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('vibzguard_alerts')
      .select('id, offender_id, category, hits, created_at')
      .eq('recipient_id', user.id).is('resolved_at', null)
      .order('created_at', { ascending: true })
    if (error || !data) return   // table absente tant que la migration n'est pas passée
    setAlerts(data as Alert[])
    const ids = Array.from(new Set(data.map(a => a.offender_id as string)))
    if (!ids.length) return
    const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids)
    setNames(n => ({ ...n, ...Object.fromEntries((profs || []).map(p => [p.id, p.display_name || 'Un membre'])) }))
  }, [user.id])

  useEffect(() => {
    load()
    const ch = supabase.channel(`guard-alerts-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vibzguard_alerts', filter: `recipient_id=eq.${user.id}` }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [user.id, load])

  const alert = alerts[0]
  if (!alert) return null
  const name = names[alert.offender_id] || 'Un membre'

  const answer = async (block: boolean) => {
    setBusy(true)
    const { error } = await supabase.rpc('resolve_guard_alert', { p_id: alert.id, p_block: block })
    setBusy(false)
    if (error) return
    setAlerts(a => a.filter(x => x.id !== alert.id))
    if (block) window.dispatchEvent(new Event(BLOCKS_EVENT))
  }

  const btn = (bg: string): React.CSSProperties => ({
    flex: '1 1 160px', padding: 12, borderRadius: 12, border: 'none', background: bg,
    color: 'white', fontWeight: 800, fontSize: 14, cursor: busy ? 'wait' : 'pointer', fontFamily: f,
  })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 710, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: f }}>
      <div role="alertdialog" aria-label="Alerte VibzGuard" style={{ background: t.surface, color: t.text, borderRadius: 20, padding: 22, maxWidth: 420, width: '100%', border: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ fontSize: 32, lineHeight: 1 }}>🚨</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>VibzGuard t’a protégé·e</div>
            <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>
              <strong style={{ color: t.text }}>{name}</strong> a tenté de t’envoyer {LABELS[alert.category] || 'un message inapproprié'}
              {alert.hits > 1 ? ` (${alert.hits} messages)` : ''}. VibzGuard l’a bloqué : tu ne l’as pas reçu.
              <br />Que veux-tu faire ?
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button disabled={busy} onClick={() => answer(true)} style={btn('linear-gradient(135deg,#E07A7A,#C4547A)')}>
            🚫 Bloquer définitivement {name}
          </button>
          <button disabled={busy} onClick={() => answer(false)} style={btn('linear-gradient(135deg,#3BAD7A,#1D9E75)')}>
            ✅ Continuer la discussion
          </button>
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 12, lineHeight: 1.5 }}>
          Dans les deux cas, l’équipe de modération a accès au message bloqué. Si tu continues et que ça recommence, VibzGuard te préviendra à nouveau.
        </div>
      </div>
    </div>
  )
}
