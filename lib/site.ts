// URL publique du site — définir NEXT_PUBLIC_SITE_URL dans Vercel une fois le domaine .fr branché
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://vibz-zeta.vercel.app').replace(/\/$/, '')
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')
