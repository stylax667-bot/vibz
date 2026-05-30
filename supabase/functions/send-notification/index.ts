import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { type, userId, fromName } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('notif_email, notif_new_match, notif_new_message, display_name')
      .eq('id', userId)
      .single()

    if (!profile?.notif_email) return new Response('no email', { status: 200 })
    if (type === 'match' && !profile.notif_new_match) return new Response('disabled', { status: 200 })
    if (type === 'message' && !profile.notif_new_message) return new Response('disabled', { status: 200 })

    const isMatch = type === 'match'
    const subject = isMatch ? `🎉 Nouveau match sur Vibz !` : `💬 Nouveau message sur Vibz`
    const html = isMatch
      ? `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
           <h2 style="color:#C4547A">🎉 Tu as un nouveau match !</h2>
           <p>Bonjour <strong>${profile.display_name}</strong>,</p>
           <p><strong>${fromName}</strong> et toi avez matché sur Vibz 🎶💑</p>
           <a href="https://vibz-zeta.vercel.app" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#C4547A;color:white;border-radius:24px;text-decoration:none;font-weight:700">
             Voir le match →
           </a>
           <p style="margin-top:24px;font-size:12px;color:#9ca3af">
             Tu reçois cet email car tu as activé les notifications Vibz.<br>
             <a href="https://vibz-zeta.vercel.app" style="color:#9ca3af">Gérer mes préférences</a>
           </p>
         </div>`
      : `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
           <h2 style="color:#7F77DD">💬 Nouveau message</h2>
           <p>Bonjour <strong>${profile.display_name}</strong>,</p>
           <p><strong>${fromName}</strong> t'a envoyé un message sur Vibz.</p>
           <a href="https://vibz-zeta.vercel.app" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7F77DD;color:white;border-radius:24px;text-decoration:none;font-weight:700">
             Lire le message →
           </a>
           <p style="margin-top:24px;font-size:12px;color:#9ca3af">
             Tu reçois cet email car tu as activé les notifications Vibz.<br>
             <a href="https://vibz-zeta.vercel.app" style="color:#9ca3af">Gérer mes préférences</a>
           </p>
         </div>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vibz <notifications@vibz-zeta.vercel.app>',
        to: profile.notif_email,
        subject,
        html,
      }),
    })

    return new Response('ok', { status: 200 })
  } catch (e) {
    return new Response(String(e), { status: 500 })
  }
})
