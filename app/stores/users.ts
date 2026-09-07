import { defineStore } from 'pinia'
import type { UserRole } from './auth'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Cleaned-up user as used throughout the UI. */
export interface TeamUser {
  id:             string
  personalNummer: string
  firstName:      string
  lastName:       string
  name:           string
  email:          string
  role:           UserRole
  initials:       string
}

/** Fields collected in the UI when creating a user. */
export interface CreateUserPayload {
  personalNummer: string
  firstName:      string
  lastName:       string
  password:       string
  role:           UserRole
  email:          string
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildInitials(first: string, last: string, fallback: string): string {
  const a = first.trim()[0] ?? ''
  const b = last.trim()[0]  ?? ''
  const initials = `${a}${b}`.toUpperCase()
  return initials || (fallback.trim()[0]?.toUpperCase() ?? '?')
}

/**
 * Normalize a raw user object from the backend into a `TeamUser`.
 * Accepts both PascalCase (e.g. `FirstName`, `EMail`) and camelCase keys
 * so it survives small backend response differences.
 */
function normalizeUser(raw: unknown): TeamUser | null {
  if (!raw || typeof raw !== 'object') return null
  const u = raw as Record<string, unknown>

  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      if (u[k] != null && u[k] !== '') return String(u[k])
    }
    return ''
  }

  const personalNummer = pick('PersonalNummer', 'personalNummer', 'personalnummer')
  const firstName      = pick('FirstName', 'firstName', 'firstname')
  const lastName       = pick('LastName', 'lastName', 'lastname')
  const email          = pick('EMail', 'email', 'eMail', 'Email')
  const role           = (pick('Role', 'role').toLowerCase() || 'viewer') as UserRole
  const id             = pick('id', 'Id', 'ID', 'PersonalNummer', 'personalNummer') || email
  const name           = `${firstName} ${lastName}`.trim() || email

  if (!id && !email) return null

  return {
    id,
    personalNummer,
    firstName,
    lastName,
    name,
    email,
    role,
    initials: buildInitials(firstName, lastName, name),
  }
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useUsersStore = defineStore('users', () => {

  // ── State ─────────────────────────────────
  const _users    = ref<TeamUser[]>([])
  const isLoading  = ref(false)
  const isSaving   = ref(false)
  const error      = ref<string | null>(null)

  // ── Getters ───────────────────────────────
  const users = computed(() => _users.value)

  // ── Actions ───────────────────────────────

  /**
   * Fetch all users from the API.
   */
  async function fetchAll(): Promise<void> {
    isLoading.value = true
    error.value     = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<unknown>('/getUser')
      const list = Array.isArray(data) ? data : (data ? [data] : [])
      _users.value = list.map(normalizeUser).filter((u): u is TeamUser => u !== null)
    } catch (e: any) {
      error.value = e?.message ?? 'Fehler beim Laden der Benutzer'
      console.error('[UsersStore] fetchAll:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new user.
   * Sends the PascalCase body the backend expects and, on success,
   * adds the new user to the local list.
   */
  async function create(payload: CreateUserPayload): Promise<TeamUser | null> {
    isSaving.value = true
    error.value    = null
    try {
      const { apiFetch } = useApi()
      const body = {
        PersonalNummer: payload.personalNummer,
        FirstName:      payload.firstName,
        LastName:       payload.lastName,
        Password:       payload.password,
        Role:           payload.role,
        EMail:          payload.email,
      }
      const saved = await apiFetch<unknown>('/createUser', { method: 'POST', body })

      // Use the server response if it returns the created user, otherwise
      // fall back to the data we just submitted.
      const created = normalizeUser(saved) ?? normalizeUser({ ...body, id: payload.personalNummer })
      if (created) _users.value = [created, ..._users.value]
      return created
    } catch (e: any) {
      error.value = e?.message ?? 'Fehler beim Anlegen des Benutzers'
      console.error('[UsersStore] create:', e)
      return null
    } finally {
      isSaving.value = false
    }
  }

  return {
    // state
    isLoading,
    isSaving,
    error,
    // getters
    users,
    // actions
    fetchAll,
    create,
  }
})
