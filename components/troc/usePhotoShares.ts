import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { PhotoConsent, PhotoShare } from '../../lib/troc'

// Photos partagées dans une conversation ou un salon + décisions (Voir / Non merci), en temps réel.
export function usePhotoShares(where: { conversationId?: string | null; salonId?: string | null }) {
  const col = where.conversationId ? 'conversation_id' : 'salon_id'
  const id = where.conversationId || where.salonId || null
  const [shares, setShares] = useState<PhotoShare[]>([])
  const [consents, setConsents] = useState<PhotoConsent[]>([])

  const load = useCallback(async () => {
    if (!id) { setShares([]); setConsents([]); return }
    const { data } = await supabase.from('photo_shares').select('*').eq(col, id).order('created_at').limit(100)
    const list = (data as PhotoShare[]) || []
    setShares(list)
    if (list.length) {
      const { data: c } = await supabase.from('photo_share_consents').select('share_id, user_id, decision').in('share_id', list.map(s => s.id))
      setConsents((c as PhotoConsent[]) || [])
    } else setConsents([])
  }, [col, id])

  useEffect(() => {
    load()
    if (!id) return
    const ch = supabase.channel(`photos-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_shares', filter: `${col}=eq.${id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_share_consents' }, p => {
        const row = (p.new || p.old) as PhotoConsent
        setShares(cur => { if (cur.some(s => s.id === row.share_id)) load(); return cur })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [col, id, load])

  const add = (s: PhotoShare) => setShares(cur => (cur.some(x => x.id === s.id) ? cur : [...cur, s]))
  const setDecision = (c: PhotoConsent) =>
    setConsents(cur => [...cur.filter(x => !(x.share_id === c.share_id && x.user_id === c.user_id)), c])

  return { shares, consents, add, setDecision, reload: load }
}
