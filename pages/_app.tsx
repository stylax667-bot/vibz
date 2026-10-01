import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import Head from 'next/head'
import { ThemeProvider } from '../lib/theme'
import FinanceWidget from '../components/shared/FinanceWidget'
import '../styles/globals.css'
import 'leaflet/dist/leaflet.css'

import { SITE_URL } from '../lib/site'
import { rememberRef } from '../lib/sixDegres'
import { rememberMix } from '../lib/share'

export default function App({ Component, pageProps }: AppProps) {
  // Service worker : rend l'app installable (Android / Play Store) et affiche une page hors-ligne
  // Lien d'invitation (?ref=) : mémorisé jusqu'à l'inscription
  useEffect(() => { rememberRef(); rememberMix() }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <ThemeProvider>
    <>
      <FinanceWidget />
      <Head>
        <title>Vibz — Rencontres entre musiciens et musiciennes, chat rétro années 90</title>
        <meta key="description" name="description" content="Vibz permet aux musiciens et musiciennes de se rencontrer et de discuter dans un cadre rétro des années 90 : messagerie nostalgique, salons à thèmes, rencontres authentiques." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111520" media="(prefers-color-scheme: dark)" />
        <meta key="og:title" property="og:title" content="Vibz — Musiciens & musiciennes, chat rétro années 90" />
        <meta key="og:description" property="og:description" content="Discute avec d'autres musiciens et musiciennes dans un cadre rétro des années 90. Salons à thèmes, rencontres authentiques, modération automatique." />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:url" property="og:url" content={SITE_URL} />
        <meta property="og:locale" content="fr_FR" />
        <meta key="og:site_name" property="og:site_name" content="Vibz" />
        {/* Image d'aperçu par défaut — les pages profil / mélange la remplacent (même key) */}
        <meta key="og:image" property="og:image" content={`${SITE_URL}/api/og?t=app`} />
        <meta key="og:image:width" property="og:image:width" content="1200" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:image:alt" property="og:image:alt" content="Vibz — rencontres entre musiciens et musiciennes" />
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
        <meta key="twitter:image" name="twitter:image" content={`${SITE_URL}/api/og?t=app`} />
        <link rel="icon" type="image/png" href="/icons/favicon-48.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </Head>
      <Component {...pageProps} />
    </>
    </ThemeProvider>
  )
}
