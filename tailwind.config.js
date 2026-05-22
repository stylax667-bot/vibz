/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vibz: {
          pink: '#D4537E',
          'pink-light': '#FBEAF0',
          'pink-dark': '#4B1528',
          teal: '#1D9E75',
          'teal-light': '#E1F5EE',
          purple: '#7F77DD',
          'purple-light': '#EEEDFE',
          amber: '#EF9F27',
          'amber-light': '#FAEEDA',
          coral: '#D85A30',
        }
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
