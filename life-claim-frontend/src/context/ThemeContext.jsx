import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'life-claims-theme'

const ThemeContext = createContext(null)

export const SHELL_THEME = {
  light: {
    pageBg: '#F1F5F9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
    primary: '#1D4ED8',
    hoverBg: '#F8FAFC',
    dropdownShadow: '0 20px 48px rgba(0,0,0,0.12)',
  },
  dark: {
    pageBg: '#0B1220',
    card: '#1E293B',
    border: '#334155',
    borderSubtle: '#273449',
    textPrimary: '#F8FAFC',
    textSecondary: '#E2E8F0',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',
    primary: '#3B82F6',
    hoverBg: '#273449',
    dropdownShadow: '0 20px 48px rgba(0,0,0,0.45)',
  },
}

function readStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const setTheme = (mode) => setThemeState(mode === 'dark' ? 'dark' : 'light')

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      tokens: SHELL_THEME[theme],
      setTheme,
      toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
