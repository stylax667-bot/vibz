// POST /api/avatar — reçoit l'avatar déjà recadré (JPEG carré 256×256),
// vérifie qu'il n'est pas explicite puis l'enregistre sur le profil.
// Une image pornographique fixe l'avatar sur l'emoji d'instrument du membre
// pendant AVATAR_LOCK_MONTHS mois (le verrou est protégé côté base).
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import * as tf from '@tensorflow/tfjs'
import { load, type NSFWJS } from 'nsfwjs/core'
import { MobileNetV2Model } from 'nsfwjs/models/mobilenet_v2'
import * as jpeg from 'jpeg-js'
import {
  AVATAR_LOCK_MONTHS, AVATAR_MAX_UPLOAD_KB, AVATAR_OUTPUT_SIDE,
  instrumentEmoji, isAvatarLocked,
} from '../../lib/avatar'

export const config = { api: { bodyParser: false }, maxDuration: 60 }

const BUCKET = 'avatars'

// Seuils du classifieur (probabilités 0–1)
const EXPLICIT_SINGLE = 0.6    // Porn ou Hentai seul
const EXPLICIT_SUM    = 0.75   // Porn + Hentai cumulés
const SUGGESTIVE      = 0.85   // Sexy : refusée sans sanction

let modelPromise: Promise<NSFWJS> | null = null
function getModel() {
  if (!modelPromise) {
    tf.enableProdMode()
    modelPromise = tf.setBackend('cpu')
      .then(() => load('MobileNetV2', { modelDefinitions: [MobileNetV2Model] }))
      .catch(e => { modelPromise = null; throw e })
  }
  return modelPromise
}

async function readBody(req: NextApiRequest, limit: number): Promise<Buffer | null> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > limit) return null
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

type Reply =
  | { status: 'ok'; url: string }
  | { status: 'locked'; emoji: string; locked_until: string; just_locked: boolean }
  | { status: 'refused' | 'error'; message: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Reply>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ status: 'error', message: 'Méthode non autorisée.' })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return res.status(503).json({ status: 'error', message: 'Le changement d\'avatar n\'est pas encore disponible. Réessaie plus tard.' })
  }
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // ── Qui envoie ? ──
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  const user = auth.user
  if (!user) return res.status(401).json({ status: 'error', message: 'Reconnecte-toi pour changer d\'avatar.' })

  const { data: profile } = await admin.from('profiles')
    .select('instruments, avatar_emoji, avatar_locked_until, avatar_strikes')
    .eq('id', user.id).maybeSingle()
  if (!profile) return res.status(404).json({ status: 'error', message: 'Profil introuvable.' })

  if (isAvatarLocked(profile)) {
    return res.status(423).json({
      status: 'locked', just_locked: false,
      emoji: profile.avatar_emoji || instrumentEmoji(profile.instruments),
      locked_until: profile.avatar_locked_until!,
    })
  }

  // ── Image : un JPEG carré au bon format ──
  const body = await readBody(req, AVATAR_MAX_UPLOAD_KB * 1024)
  if (!body) return res.status(413).json({ status: 'refused', message: `L'image recadrée dépasse ${AVATAR_MAX_UPLOAD_KB} Ko.` })
  if (body.length < 3 || body[0] !== 0xff || body[1] !== 0xd8 || body[2] !== 0xff) {
    return res.status(415).json({ status: 'refused', message: 'Format d\'image non reconnu.' })
  }
  let decoded: { width: number; height: number; data: Uint8Array }
  try {
    decoded = jpeg.decode(body, { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 64 })
  } catch {
    return res.status(415).json({ status: 'refused', message: 'Cette image est illisible, essaie avec une autre.' })
  }
  if (decoded.width !== AVATAR_OUTPUT_SIDE || decoded.height !== AVATAR_OUTPUT_SIDE) {
    return res.status(422).json({ status: 'refused', message: 'L\'avatar doit être un carré recadré depuis Vibz.' })
  }

  // ── Contrôle du contenu ──
  let scores: Record<string, number>
  try {
    const model = await getModel()
    const { width, height, data } = decoded
    const rgb = new Int32Array(width * height * 3)
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgb[j] = data[i]; rgb[j + 1] = data[i + 1]; rgb[j + 2] = data[i + 2]
    }
    const input = tf.tensor3d(rgb, [height, width, 3], 'int32')
    try {
      const preds = await model.classify(input, 5)
      scores = Object.fromEntries(preds.map(p => [p.className, p.probability]))
    } finally {
      input.dispose()
    }
  } catch (e) {
    console.error('[avatar] classification impossible', e)
    return res.status(500).json({ status: 'error', message: 'La vérification de l\'image a échoué, réessaie dans un instant.' })
  }

  const porn = scores.Porn || 0, hentai = scores.Hentai || 0, sexy = scores.Sexy || 0
  const folder = user.id

  if (porn >= EXPLICIT_SINGLE || hentai >= EXPLICIT_SINGLE || porn + hentai >= EXPLICIT_SUM) {
    const until = new Date()
    until.setMonth(until.getMonth() + AVATAR_LOCK_MONTHS)
    const emoji = instrumentEmoji(profile.instruments)
    await admin.from('profiles').update({
      avatar_url: null,
      avatar_emoji: emoji,
      avatar_locked_until: until.toISOString(),
      avatar_strikes: (profile.avatar_strikes || 0) + 1,
    }).eq('id', user.id)
    await removeFiles(admin.storage.from(BUCKET), folder)
    console.warn('[avatar] image explicite, avatar fixé', user.id, { porn, hentai })
    return res.status(200).json({ status: 'locked', just_locked: true, emoji, locked_until: until.toISOString() })
  }

  if (sexy >= SUGGESTIVE) {
    return res.status(422).json({
      status: 'refused',
      message: 'Cette image est trop suggestive pour un avatar Vibz. Choisis-en une autre, plus neutre.',
    })
  }

  // ── Enregistrement ──
  const path = `${folder}/avatar-${Date.now()}.jpg`
  const { error: upErr } = await admin.storage.from(BUCKET)
    .upload(path, body, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
  if (upErr) {
    console.error('[avatar] upload', upErr)
    return res.status(500).json({ status: 'error', message: 'L\'envoi a échoué, réessaie.' })
  }
  const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  const { error: dbErr } = await admin.from('profiles')
    .update({ avatar_url: publicUrl, avatar_emoji: null }).eq('id', user.id)
  if (dbErr) {
    console.error('[avatar] profil', dbErr)
    await admin.storage.from(BUCKET).remove([path])
    return res.status(500).json({ status: 'error', message: 'L\'enregistrement a échoué, réessaie.' })
  }
  await removeFiles(admin.storage.from(BUCKET), folder, path)
  return res.status(200).json({ status: 'ok', url: publicUrl })
}

// Supprime les anciens avatars du membre (sauf `keep`)
type Bucket = ReturnType<ReturnType<typeof createClient>['storage']['from']>
async function removeFiles(bucket: Bucket, folder: string, keep?: string) {
  const { data } = await bucket.list(folder, { limit: 100 })
  const old = (data || []).map(f => `${folder}/${f.name}`).filter(p => p !== keep)
  if (old.length) await bucket.remove(old)
}
