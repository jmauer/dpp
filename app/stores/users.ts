import { defineStore } from 'pinia'
import type { UserRole } from './auth'
import type { Database } from '~/types/database'

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
      // RLS gibt genau die Profile des eigenen Mandanten frei.
      const supabase = useSupabaseClient<Database>()
      const { data, error: e } = await supabase
        .from('profiles')
        .select('id, personal_number, first_name, last_name, email, role')
        .order('last_name', { ascending: true })

      if (e) throw new Error(e.message)

      _users.value = (data ?? []).map(r => {
        const row = r as {
          id: string; personal_number: string | null
          first_name: string | null; last_name: string | null
          email: string; role: UserRole
        }
        const firstName = row.first_name ?? ''
        const lastName  = row.last_name  ?? ''
        const name      = `${firstName} ${lastName}`.trim() || row.email
        return {
          id:             row.id,
          personalNummer: row.personal_number ?? '',
          firstName,
          lastName,
          name,
          email:          row.email,
          role:           row.role,
          initials:       buildInitials(firstName, lastName, name),
        }
      })
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
      // Benutzer anlegen geht nur serverseitig (Admin-API mit service_role).
      // Siehe server/api/team/invite.post.ts - dort wird auch geprueft,
      // dass der Aufrufer Administrator ist.
      const created = await $fetch<{
        id: string; email: string; firstName: string
        lastName: string; role: UserRole; personalNummer: string
      }>('/api/team/invite', {
        method: 'POST',
        body: {
          personalNummer: payload.personalNummer,
          firstName:      payload.firstName,
          lastName:       payload.lastName,
          email:          payload.email,
          password:       payload.password,
          role:           payload.role,
        },
      })

      const name = `${created.firstName} ${created.lastName}`.trim() || created.email
      const user: TeamUser = {
        id:             created.id,
        personalNummer: created.personalNummer,
        firstName:      created.firstName,
        lastName:       created.lastName,
        name,
        email:          created.email,
        role:           created.role,
        initials:       buildInitials(created.firstName, created.lastName, name),
      }
      _users.value = [user, ..._users.value]
      return user
    } catch (e: any) {
      error.value = e?.data?.statusMessage ?? e?.statusMessage
                 ?? e?.message ?? 'Fehler beim Anlegen des Benutzers'
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
