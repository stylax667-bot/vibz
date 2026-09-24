// URL publique du site — utilisée pour tous les liens de partage.
// NEXT_PUBLIC_SITE_URL (Vercel) peut la remplacer, par exemple pour un environnement de test.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vibzmusic.fr').replace(/\/$/, '')
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')
