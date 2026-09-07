import { defineStore } from 'pinia'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type UserRole   = 'admin' | 'manager' | 'viewer'
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

export interface User {
  id:               string
  name:             string
  firstName:        string
  lastName:         string
  email:            string
  role:             UserRole
  company:          string
  companyId:        string
  avatarInitials:   string
  avatarUrl?:       string
  language:         string       // BCP-47 e.g. 'de', 'en'
  createdAt:        string       // ISO
  lastLoginAt:      string       // ISO
  twoFactorEnabled: boolean
}

export interface LoginCredentials {
  email:    string
  password: string
}

/** Raw response shape returned by the backend `/authentication` endpoint. */
export interface LoginResponse {
  api_key: string
  role:    UserRole
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const API_KEY_KEY = 'dpp-api-key'
const USER_KEY     = 'dpp-user'



// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

function parseUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null
  const u = raw as Record<string, unknown>
  if (!u.id || !u.email) return null
  const name = String(u.name ?? '')
  return {
    id:               String(u.id),
    name,
    firstName:        String(u.firstName ?? name.split(' ')[0] ?? ''),
    lastName:         String(u.lastName  ?? name.split(' ').slice(1).join(' ') ?? ''),
    email:            String(u.email),
    role:             (u.role as UserRole) ?? 'viewer',
    company:          String(u.company   ?? ''),
    companyId:        String(u.companyId ?? ''),
    avatarInitials:   String(u.avatarInitials ?? buildInitials(name)),
    avatarUrl:        u.avatarUrl ? String(u.avatarUrl) : undefined,
    language:         String(u.language  ?? 'de'),
    createdAt:        String(u.createdAt  ?? new Date().toISOString()),
    lastLoginAt:      String(u.lastLoginAt ?? new Date().toISOString()),
    twoFactorEnabled: Boolean(u.twoFactorEnabled ?? false),
  }
}

function isLocalStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useAuthStore = defineStore('auth', () => {

  // ── State ─────────────────────────────────

  const user       = ref<User | null>(null)
  const apiKey     = ref<string | null>(null)
  const status     = ref<AuthStatus>('idle')
  const error      = ref<string | null>(null)
  const returnPath = ref<string>('/dashboard')

  // ── Computed ──────────────────────────────

  const isAuthenticated = computed(() =>
    user.value !== null && apiKey.value !== null
  )

  const isLoading = computed(() => status.value === 'loading')

  const isAdmin   = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => ['admin', 'manager'].includes(user.value?.role ?? ''))
  const isViewer  = computed(() => user.value?.role === 'viewer')

  const config = useRuntimeConfig()

  /** Role-based permission check */
  function can(action: 'read' | 'write' | 'admin'): boolean {
    if (!isAuthenticated.value) return false
    switch (action) {
      case 'read':  return true
      case 'write': return isManager.value
      case 'admin': return isAdmin.value
      default:      return false
    }
  }

  // ── Persistence (manual — no pinia plugin needed) ──

  function _persist() {
    if (!isLocalStorageAvailable()) return
    if (user.value && apiKey.value) {
      try {
        localStorage.setItem(USER_KEY,    JSON.stringify(user.value))
        localStorage.setItem(API_KEY_KEY, apiKey.value)
      } catch { /* Storage full — fail silently */ }
    } else {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(API_KEY_KEY)
    }
  }

  function _restore(): boolean {
    if (!isLocalStorageAvailable()) return false
    try {
      const rawUser   = localStorage.getItem(USER_KEY)
      const storedKey = localStorage.getItem(API_KEY_KEY)
      if (!rawUser || !storedKey) return false

      const restored = parseUser(JSON.parse(rawUser))
      if (!restored) {
        _clear(false)
        return false
      }

      user.value   = restored
      apiKey.value = storedKey
      status.value = 'authenticated'
      return true
    } catch {
      _clear(false)
      return false
    }
  }

  function _clear(persist = true) {
    user.value   = null
    apiKey.value = null
    status.value = 'idle'
    error.value  = null
    if (persist && isLocalStorageAvailable()) {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(API_KEY_KEY)
    }
  }

  /** Build a User object from the entered email and the role the backend returns. */
  function _buildUser(email: string, role: UserRole): User {
    const local     = email.split('@')[0] ?? email
    const parts     = local.split(/[._-]/).filter(Boolean)
    const cap       = (s: string) => s ? s[0]!.toUpperCase() + s.slice(1) : ''
    const firstName = cap(parts[0] ?? '')
    const lastName  = parts.slice(1).map(cap).join(' ')
    const name      = `${firstName} ${lastName}`.trim() || email
    const nowIso    = new Date().toISOString()

    return {
      id:               `usr_${local}`,
      name,
      firstName,
      lastName,
      email,
      role,
      company:          '',
      companyId:        '',
      avatarInitials:   buildInitials(name) || (email[0]?.toUpperCase() ?? '?'),
      avatarUrl:        undefined,
      language:         'de',
      createdAt:        nowIso,
      lastLoginAt:      nowIso,
      twoFactorEnabled: false,
    }
  }

  // ── Public actions ────────────────────────

  /**
   * Call once in app.vue onMounted() to restore session from localStorage.
   */
  function init(): boolean {
    return _restore()
  }

  /**
   * Log in with email + password.
   * On success the backend returns an `api_key` (persisted and sent with every
   * subsequent request, see `useApi`) and the user's `role`.
   * Returns true on success.
   */
  async function login(credentials: LoginCredentials): Promise<boolean> {
    status.value = 'loading'
    error.value  = null

    try {
      const data = await $fetch<LoginResponse>('/authentication', {
        baseURL: config.public.apiBase,
        method:  'POST',
        body: {
          EMail:    credentials.email,
          Password: credentials.password,
          Web:      true,
        },
      })

      if (!data?.api_key) throw new Error('Ungültige Serverantwort.')

      apiKey.value = data.api_key
      user.value   = _buildUser(credentials.email, data.role ?? 'viewer')
      status.value = 'authenticated'
      _persist()
      return true

    } catch (e: unknown) {
      _clear(false)
      error.value  = _resolveLoginError(e)
      status.value = 'error'
      return false
    }
  }

  /** Map a failed login request to a user-facing German message. */
  function _resolveLoginError(e: unknown): string {
    const status = (e as { statusCode?: number; response?: { status?: number } })
      ?.statusCode ?? (e as { response?: { status?: number } })?.response?.status
    if (status === 401 || status === 403) return 'E-Mail oder Passwort leider falsch.'
    if (status && status >= 500)          return 'Server nicht erreichbar. Bitte später erneut versuchen.'
    return e instanceof Error ? e.message : 'Anmeldung fehlgeschlagen.'
  }

  /**
   * Log out — clears all auth state and redirects to /login.
   */
  async function logout(redirect = true): Promise<void> {
    try {
      // TODO: notify backend
      // await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Always clear local state regardless
    } finally {
      _clear()
      if (redirect) {
        await navigateTo('/login')
      }
    }
  }

  /**
   * Update profile fields (name, language, avatar …).
   * Optimistic update — rolls back on error.
   */
  async function updateProfile(patch: Partial<Pick<User,
    'firstName' | 'lastName' | 'email' | 'language' | 'avatarUrl'
  >>): Promise<boolean> {
    if (!user.value) return false

    const prev      = { ...user.value }
    const firstName = patch.firstName ?? user.value.firstName
    const lastName  = patch.lastName  ?? user.value.lastName

    // Optimistic update
    user.value = {
      ...user.value,
      ...patch,
      name:           `${firstName} ${lastName}`.trim(),
      avatarInitials: buildInitials(`${firstName} ${lastName}`),
    }
    _persist()

    try {
      // TODO: real API
      // await $fetch('/api/users/me', { method: 'PATCH', body: patch })
      await new Promise(r => setTimeout(r, 500))
      return true
    } catch {
      user.value = prev   // Roll back
      _persist()
      return false
    }
  }

  /**
   * Change password.
   */
  async function changePassword(payload: {
    currentPassword: string
    newPassword:     string
  }): Promise<boolean> {
    error.value = null
    try {
      // TODO: real API
      // await $fetch('/api/auth/change-password', { method: 'POST', body: payload })
      await new Promise(r => setTimeout(r, 600))
      if (payload.currentPassword !== 'Demo12,') {
        throw new Error('Aktuelles Passwort ist falsch.')
      }
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Passwort konnte nicht geändert werden.'
      return false
    }
  }

  /**
   * Toggle 2-factor authentication.
   */
  async function setTwoFactor(enabled: boolean): Promise<boolean> {
    if (!user.value) return false
    try {
      // TODO: real API
      // await $fetch('/api/auth/2fa', { method: 'PATCH', body: { enabled } })
      await new Promise(r => setTimeout(r, 400))
      user.value = { ...user.value, twoFactorEnabled: enabled }
      _persist()
      return true
    } catch {
      return false
    }
  }

  /** Clear error state — useful when leaving a failed login page. */
  function clearError() {
    error.value = null
    if (status.value === 'error') status.value = 'idle'
  }

  /** Where to navigate after successful login (set by auth middleware). */
  function setReturnPath(path: string) {
    returnPath.value = path
  }

  // ─────────────────────────────────────────
  return {
    // State (readonly outside store)
    user:             readonly(user),
    apiKey:           readonly(apiKey),
    status:           readonly(status),
    error:            readonly(error),
    returnPath:       readonly(returnPath),
    // Getters
    isAuthenticated,
    isLoading,
    isAdmin,
    isManager,
    isViewer,
    // Actions
    can,
    init,
    login,
    logout,
    updateProfile,
    changePassword,
    setTwoFactor,
    clearError,
    setReturnPath,
  }
})
