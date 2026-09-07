import { defineStore } from 'pinia'
import type { Database, ProfileRow } from '~/types/database'

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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0]!.toUpperCase())
    .join('')
}

// ─────────────────────────────────────────────
// Store
//
// Authentifizierung laeuft ueber Supabase Auth. Die Session liegt in
// einem Cookie und ist dadurch auch serverseitig lesbar - anders als
// zuvor beim API-Key im localStorage. Rolle und Mandant stehen in
// public.profiles und werden nach dem Login nachgeladen.
// ─────────────────────────────────────────────

export const useAuthStore = defineStore('auth', () => {

  const supabase      = useSupabaseClient<Database>()
  const supabaseUser  = useSupabaseUser()

  // ── State ─────────────────────────────────

  const _profile   = ref<ProfileRow | null>(null)
  const _company   = ref<string>('')
  const status     = ref<AuthStatus>('idle')
  const error      = ref<string | null>(null)
  const returnPath = ref<string>('/dashboard')

  // ── Computed ──────────────────────────────

  /** Zusammengesetzt aus Supabase-Session und Profilzeile. */
  const user = computed<User | null>(() => {
    const su = supabaseUser.value
    if (!su) return null

    const p         = _profile.value
    const email     = su.email ?? p?.email ?? ''
    const firstName = p?.first_name ?? ''
    const lastName  = p?.last_name ?? ''
    const name      = `${firstName} ${lastName}`.trim() || email

    return {
      id:               su.id,
      name,
      firstName,
      lastName,
      email,
      role:             p?.role ?? 'viewer',
      company:          _company.value,
      companyId:        p?.company_id ?? '',
      avatarInitials:   buildInitials(name) || (email[0]?.toUpperCase() ?? '?'),
      avatarUrl:        p?.avatar_url ?? undefined,
      language:         p?.language ?? 'de',
      createdAt:        p?.created_at ?? su.created_at ?? new Date().toISOString(),
      lastLoginAt:      p?.last_login_at ?? new Date().toISOString(),
      twoFactorEnabled: false,
    }
  })

  const isAuthenticated = computed(() => supabaseUser.value !== null)
  const isLoading       = computed(() => status.value === 'loading')

  const isAdmin   = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => ['admin', 'manager'].includes(user.value?.role ?? ''))
  const isViewer  = computed(() => user.value?.role === 'viewer')

  /** Mandant des angemeldeten Users – vom Products-Store beim Anlegen gebraucht. */
  const companyId = computed(() => _profile.value?.company_id ?? null)

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

  // ── Profil ────────────────────────────────

  /**
   * Laedt Profil und Firmenname. Idempotent: laeuft nur, wenn eine
   * Session besteht und noch nichts geladen ist.
   */
  async function loadProfile(force = false): Promise<void> {
    if (!supabaseUser.value) { _profile.value = null; return }
    if (_profile.value && !force) return

    const { data, error: e } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.value.id)
      .maybeSingle()

    if (e) {
      console.error('[auth] Profil konnte nicht geladen werden:', e.message)
      return
    }

    _profile.value = (data as ProfileRow | null) ?? null

    if (_profile.value?.company_id) {
      const { data: c } = await supabase
        .from('companies')
        .select('name')
        .eq('id', _profile.value.company_id)
        .maybeSingle()
      _company.value = (c as { name: string } | null)?.name ?? ''
    } else {
      _company.value = ''
    }
  }

  /** Beim Start bzw. vor geschuetzten Routen aufrufen. */
  async function init(): Promise<boolean> {
    await loadProfile()
    status.value = isAuthenticated.value ? 'authenticated' : 'idle'
    return isAuthenticated.value
  }

  // ── Public actions ────────────────────────

  async function login(credentials: LoginCredentials): Promise<boolean> {
    status.value = 'loading'
    error.value  = null

    const { error: e } = await supabase.auth.signInWithPassword({
      email:    credentials.email,
      password: credentials.password,
    })

    if (e) {
      error.value  = _resolveAuthError(e.message)
      status.value = 'error'
      return false
    }

    await loadProfile(true)
    status.value = 'authenticated'

    if (!_profile.value?.company_id) {
      error.value = 'Ihr Konto ist keinem Unternehmen zugeordnet. '
                  + 'Bitte wenden Sie sich an Ihre Administration.'
    }
    return true
  }

  /** Supabase-Meldungen in deutsche Klartexte uebersetzen. */
  function _resolveAuthError(msg: string): string {
    const m = msg.toLowerCase()
    if (m.includes('invalid login credentials')) return 'E-Mail oder Passwort leider falsch.'
    if (m.includes('email not confirmed'))       return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.'
    if (m.includes('too many requests'))         return 'Zu viele Versuche. Bitte kurz warten.'
    return msg || 'Anmeldung fehlgeschlagen.'
  }

  async function logout(redirect = true): Promise<void> {
    try {
      await supabase.auth.signOut()
    } finally {
      _profile.value = null
      _company.value = ''
      status.value   = 'idle'
      error.value    = null
      if (redirect) await navigateTo('/login')
    }
  }

  /**
   * Profilfelder aendern. Optimistisch mit Rollback.
   */
  async function updateProfile(patch: Partial<Pick<User,
    'firstName' | 'lastName' | 'email' | 'language' | 'avatarUrl'
  >>): Promise<boolean> {
    if (!_profile.value) return false
    const prev = { ..._profile.value }

    _profile.value = {
      ..._profile.value,
      first_name: patch.firstName ?? _profile.value.first_name,
      last_name:  patch.lastName  ?? _profile.value.last_name,
      language:   patch.language  ?? _profile.value.language,
      avatar_url: patch.avatarUrl ?? _profile.value.avatar_url,
    }

    const { error: e } = await supabase
      .from('profiles')
      .update({
        first_name: _profile.value.first_name,
        last_name:  _profile.value.last_name,
        language:   _profile.value.language,
        avatar_url: _profile.value.avatar_url,
      })
      .eq('id', prev.id)

    if (e) {
      _profile.value = prev
      error.value = 'Profil konnte nicht gespeichert werden.'
      return false
    }

    // E-Mail liegt in auth.users, nicht in profiles
    if (patch.email && patch.email !== prev.email) {
      const { error: mailErr } = await supabase.auth.updateUser({ email: patch.email })
      if (mailErr) {
        error.value = 'Profil gespeichert, aber die E-Mail-Adresse konnte nicht geändert werden.'
        return false
      }
    }
    return true
  }

  async function changePassword(payload: {
    currentPassword: string
    newPassword:     string
  }): Promise<boolean> {
    error.value = null

    // Supabase prueft das alte Passwort nicht mit; deshalb einmal
    // neu anmelden, damit ein falsches Passwort auffaellt.
    const email = user.value?.email
    if (!email) { error.value = 'Nicht angemeldet.'; return false }

    const { error: reauth } = await supabase.auth.signInWithPassword({
      email,
      password: payload.currentPassword,
    })
    if (reauth) {
      error.value = 'Aktuelles Passwort ist falsch.'
      return false
    }

    const { error: e } = await supabase.auth.updateUser({ password: payload.newPassword })
    if (e) {
      error.value = e.message || 'Passwort konnte nicht geändert werden.'
      return false
    }
    return true
  }

  /**
   * Zwei-Faktor-Authentifizierung.
   * Supabase kann das (MFA/TOTP), es ist aber noch nicht angebunden -
   * dafuer braucht es einen Enrollment-Dialog mit QR-Code.
   */
  async function setTwoFactor(_enabled: boolean): Promise<boolean> {
    error.value = 'Zwei-Faktor-Authentifizierung ist noch nicht eingerichtet.'
    return false
  }

  function clearError() {
    error.value = null
    if (status.value === 'error') status.value = 'idle'
  }

  function setReturnPath(path: string) {
    returnPath.value = path
  }

  // ─────────────────────────────────────────
  return {
    // State
    user,
    status:           readonly(status),
    error:            readonly(error),
    returnPath:       readonly(returnPath),
    // Getters
    isAuthenticated,
    isLoading,
    isAdmin,
    isManager,
    isViewer,
    companyId,
    // Actions
    can,
    init,
    loadProfile,
    login,
    logout,
    updateProfile,
    changePassword,
    setTwoFactor,
    clearError,
    setReturnPath,
  }
})
