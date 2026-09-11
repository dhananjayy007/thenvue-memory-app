'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem('thenvue_theme') || localStorage.getItem('memory_theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  try {
    localStorage.setItem('thenvue_theme', theme)
    localStorage.setItem('memory_theme', theme)
  } catch {
    // Ignore storage errors
  }
  // Dispatch custom event so all mounted listeners stay in sync
  window.dispatchEvent(new CustomEvent('thenvue-theme-change', { detail: theme }))
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const initial = getInitialTheme()
    setTheme(initial)
    applyTheme(initial)

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>
      if (customEvent.detail) {
        setTheme(customEvent.detail)
      }
    }

    window.addEventListener('thenvue-theme-change', handleThemeChange)

    // Listen to system preference changes if user hasn't explicitly set a preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = (e: MediaQueryListEvent) => {
      try {
        const hasSaved = localStorage.getItem('thenvue_theme') || localStorage.getItem('memory_theme')
        if (!hasSaved) {
          const next = e.matches ? 'dark' : 'light'
          setTheme(next)
          applyTheme(next)
        }
      } catch {}
    }
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      window.removeEventListener('thenvue-theme-change', handleThemeChange)
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  return [theme, toggle]
}
