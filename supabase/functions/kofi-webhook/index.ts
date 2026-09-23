// ══════════════════════════════════════════════════════════════════
//  Webhook Ko-fi → enregistre chaque don réel dans public.donations
//  Déploiement : supabase functions deploy kofi-webhook --no-verify-jwt
//  Secret requis : KOFI_VERIFICATION_TOKEN (Ko-fi > Settings > API)
// ══════════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  // Ko-fi envoie un formulaire avec un champ « data » contenant du JSON
  const form = await req.formData().catch(() => null)
  const raw  = form?.get('data')
  if (typeof raw !== 'string') return new Response('Bad request', { status: 400 })

  let payload: Record<string, unknown>
  try { payload = JSON.parse(raw) } catch { return new Response('Bad JSON', { status: 400 }) }

  const expected = Deno.env.get('KOFI_VERIFICATION_TOKEN')
  if (!expected || payload.verification_token !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  const amount = Number(payload.amount)
  const txId   = String(payload.kofi_transaction_id || '')
  if (!txId || !Number.isFinite(amount) || amount <= 0) {
    return new Response('Ignored', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Bouton « Send test » de Ko-fi : faux don → on valide juste la connexion
  if (txId === '00000000-1111-2222-3333-444444444444') {
    await supabase.from('project_finances').update({ kofi_connected: true, updated_at: new Date().toISOString() }).eq('id', 1)
    return new Response('test ok', { status: 200 })
  }

  // Aucune donnée personnelle du donateur n'est conservée
  const { error } = await supabase.from('donations').upsert({
    kofi_transaction_id: txId,
    amount,
    currency:    String(payload.currency || 'EUR').toUpperCase(),
    type:        String(payload.type || 'Donation'),
    received_at: typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
  }, { onConflict: 'kofi_transaction_id', ignoreDuplicates: true })
  if (error) return new Response(error.message, { status: 500 })

  await supabase.from('project_finances')
    .update({ kofi_connected: true, updated_at: new Date().toISOString() })
    .eq('id', 1)

  return new Response('ok', { status: 200 })
})
