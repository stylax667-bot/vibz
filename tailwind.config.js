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
          pink: '#C4547A',
          'pink-light': '#FDE8F2',
          'pink-dark': '#7A1F40',
          teal: '#3BAD7A',
          'teal-light': '#D6F5E6',
          purple: '#A78BDB',
          'purple-light': '#EDE8F8',
          amber: '#E8A06A',
          'amber-light': '#FAEEE0',
          coral: '#E07A7A',
        }
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
        mono: ['Nunito', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
