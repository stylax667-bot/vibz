import type { AppProps } from 'next/app'
import Head from 'next/head'
import { ThemeProvider } from '../lib/theme'
import FinanceWidget from '../components/shared/FinanceWidget'
import '../styles/globals.css'

import { SITE_URL } from '../lib/site'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
    <>
      <FinanceWidget />
      <Head>
        <title>Vibz — Rencontres entre musiciens et musiciennes, chat rétro années 90</title>
        <meta name="description" content="Vibz permet aux musiciens et musiciennes de se rencontrer et de discuter dans un cadre rétro des années 90 : messagerie nostalgique, salons à thèmes, rencontres authentiques." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111520" media="(prefers-color-scheme: dark)" />
        <meta property="og:title" content="Vibz — Musiciens & musiciennes, chat rétro années 90" />
        <meta property="og:description" content="Discute avec d'autres musiciens et musiciennes dans un cadre rétro des années 90. Salons à thèmes, rencontres authentiques, modération IA." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:locale" content="fr_FR" />
        <link rel="icon" href="/favicon.ico" />
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
