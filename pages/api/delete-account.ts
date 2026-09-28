// POST /api/delete-account — supprime définitivement le compte du membre connecté.
// Exigé par Google Play pour toute app qui permet de créer un compte.
// Le compte auth est effacé ; profil, messages, likes… suivent par cascade
// (migration 20260930_suppression_compte.sql). L'avatar est retiré du stockage.
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

type Reply = { status: 'ok' } | { status: 'error'; message: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Reply>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ status: 'error', message: 'Méthode non autorisée.' })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return res.status(503).json({ status: 'error', message: 'La suppression n\'est pas disponible pour le moment. Écris-nous, on s\'en occupe.' })
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // ── Qui demande ? ──
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  const user = auth.user
  if (!user) return res.status(401).json({ status: 'error', message: 'Reconnecte-toi pour supprimer ton compte.' })

  if (req.body?.confirm !== 'SUPPRIMER') {
    return res.status(400).json({ status: 'error', message: 'Confirmation manquante.' })
  }

  // ── Avatar : fichiers du dossier du membre ──
  const { data: files } = await admin.storage.from('avatars').list(user.id)
  if (files?.length) {
    await admin.storage.from('avatars').remove(files.map(f => `${user.id}/${f.name}`))
  }

  // ── Compte ──
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('delete-account', user.id, error.message)
    return res.status(500).json({ status: 'error', message: 'La suppression a échoué. Réessaie ou écris-nous, on s\'en occupe.' })
  }
  return res.status(200).json({ status: 'ok' })
}
