import type { AppProps } from 'next/app'
import Head from 'next/head'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Vibz — Rencontres amoureuses & musiciens</title>
        <meta name="description" content="Vibz — La plateforme qui connecte les âmes sœurs et les musiciens du monde entier. Messagerie MSN, salons Caramail, rencontres authentiques." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Vibz — Rencontres & Musique" />
        <meta property="og:description" content="Trouve ton âme sœur ou ton prochain partenaire musical. Messagerie MSN, salons Caramail, modération IA." />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}
