import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ── Palettes ──────────────────────────────────────────────────────────────────
export const LIGHT: VibzTheme = {
  isDark: false,
  bg:          '#FFFFFF',
  bg2:         '#F8FBFF',
  surface:     '#FFFFFF',
  surface2:    '#F8FBFF',
  border:      '#EEF2FA',
  borderStrong:'rgba(107,184,232,0.22)',
  text:        '#1A1E2E',
  textSub:     '#4A5470',
  textMuted:   '#9BA8C0',
  navBg:       '#FFFFFF',
  inputBg:     '#F8FBFF',
  pink:        '#E07A9A',
  green:       '#52C07A',
  blue:        '#6BB8E8',
  pinkLight:   '#FFF0F5',
  greenLight:  '#F0FBF4',
  blueLight:   '#F0F7FD',
  pinkDark:    '#7A1F40',
  greenDark:   '#1A6645',
  blueDark:    '#2A6090',
  guardBg:     '#D6F5E6',
  guardText:   '#1A6645',
  shadow:      'rgba(107,184,232,0.10)',
  overlay:     'rgba(26,30,46,0.55)',
  modBg:       '#FBF3EA',
  modText:     '#7A4A20',
  modBorder:   '#E8A06A',
  scrollThumb: 'rgba(107,184,232,0.3)',
}

export const DARK: VibzTheme = {
  isDark: true,
  bg:          '#0D1117',
  bg2:         '#161B26',
  surface:     '#1C2233',
  surface2:    '#222840',
  border:      '#2A3350',
  borderStrong:'rgba(107,184,232,0.18)',
  text:        '#E2E8F8',
  textSub:     '#9BA8C8',
  textMuted:   '#5A6A8A',
  navBg:       '#111520',
  inputBg:     '#1A2035',
  pink:        '#E07A9A',
  green:       '#52C07A',
  blue:        '#6BB8E8',
  pinkLight:   'rgba(224,122,154,0.12)',
  greenLight:  'rgba(82,192,122,0.12)',
  blueLight:   'rgba(107,184,232,0.12)',
  pinkDark:    '#F0A0BC',
  greenDark:   '#6DE09A',
  blueDark:    '#8CCEF2',
  guardBg:     'rgba(82,192,122,0.15)',
  guardText:   '#6DE09A',
  shadow:      'rgba(0,0,0,0.40)',
  overlay:     'rgba(0,0,0,0.72)',
  modBg:       'rgba(232,160,106,0.12)',
  modText:     '#E8B06A',
  modBorder:   '#9A6030',
  scrollThumb: 'rgba(107,184,232,0.20)',
}

export interface VibzTheme {
  isDark: boolean
  bg: string; bg2: string
  surface: string; surface2: string
  border: string; borderStrong: string
  text: string; textSub: string; textMuted: string
  navBg: string; inputBg: string
  pink: string; green: string; blue: string
  pinkLight: string; greenLight: string; blueLight: string
  pinkDark: string; greenDark: string; blueDark: string
  guardBg: string; guardText: string
  shadow: string; overlay: string
  modBg: string; modText: string; modBorder: string
  scrollThumb: string
}

// ── Contexte ──────────────────────────────────────────────────────────────────
const Ctx = createContext<{ theme: VibzTheme; toggle: () => void }>({
  theme: LIGHT, toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  // Lire la préférence sauvegardée + préférence système
  useEffect(() => {
    const saved = localStorage.getItem('vibz-theme')
    if (saved) {
      setIsDark(saved === 'dark')
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  // Appliquer data-theme sur <html> (pour les CSS variables globaux)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('vibz-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggle = () => setIsDark(v => !v)
  const theme  = isDark ? DARK : LIGHT

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export function useTheme() {
  return useContext(Ctx)
}
