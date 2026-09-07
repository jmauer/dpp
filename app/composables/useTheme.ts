/**
 * useTheme — Dark Mode management
 *
 * - Reads system preference on first load
 * - Persists manual override in localStorage
 * - Sets [data-theme] on <html> for CSS targeting
 * - Reactive `isDark` for components
 *
 * Usage:
 *   const { isDark, toggle, setTheme } = useTheme()
 */

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'dpp-theme'

export function useTheme() {
  const theme  = useState<Theme>('theme', () => 'system')
  const isDark = useState<boolean>('isDark', () => false)

  function getSystemDark(): boolean {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  function applyTheme(t: Theme) {
    const html    = document.documentElement
    const dark    = t === 'dark' || (t === 'system' && getSystemDark())
    isDark.value  = dark
    html.setAttribute('data-theme', dark ? 'dark' : 'light')
    // Persist only manual overrides
    if (t === 'system') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, t)
    }
  }

  function setTheme(t: Theme) {
    theme.value = t
    applyTheme(t)
  }

  function toggle() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  function init() {
    if (typeof window === 'undefined') return

    // Restore saved preference
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initial: Theme = saved ?? 'system'
    theme.value = initial
    applyTheme(initial)

    // Watch system preference changes (only relevant in 'system' mode)
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => {
        if (theme.value === 'system') applyTheme('system')
      })
  }

  return { theme, isDark, setTheme, toggle, init }
}
