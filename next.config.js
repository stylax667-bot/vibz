/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'graph.facebook.com',
      'platform-lookaside.fbsbx.com',
      'cdn.discordapp.com',
    ],
  },
  // Les anciens liens partagés (vibz-zeta.vercel.app) renvoient vers le domaine officiel
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'vibz-zeta.vercel.app' }],
        destination: 'https://www.vibzmusic.fr/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
