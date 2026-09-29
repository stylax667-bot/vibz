// Servi sur /.well-known/assetlinks.json (réécriture dans next.config.js).
// Relie l'app Android (TWA) au site : sans ce fichier, l'app affiche la barre d'adresse Chrome.
// Empreintes SHA-256 dans la variable Vercel ANDROID_SHA256_FINGERPRINTS, séparées par des virgules :
// celle de la clé de signature Play Console + celle de la clé d'importation (PWABuilder).
import type { NextApiRequest, NextApiResponse } from 'next'

const ANDROID_PACKAGE = 'fr.vibzmusic.app'

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS || '')
    .split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).json([{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: { namespace: 'android_app', package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: fingerprints },
  }])
}
