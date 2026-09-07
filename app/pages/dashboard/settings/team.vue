<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">{{ t('settings.nav.team') }}</h1>
          <p class="g-page-sub">Teammitglieder verwalten und Rollen zuweisen</p>
        </div>
        <button class="g-btn g-btn-primary" @click="showCreate = true">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Benutzer anlegen
        </button>
      </div>

      <!-- ── Role info ── -->
      <div class="role-cards">
        <div v-for="role in roles" :key="role.key" class="g-card role-card">
          <div class="role-header">
            <span class="role-icon" aria-hidden="true">{{ role.icon }}</span>
            <span class="role-badge" :class="`rb-${role.key}`">{{ role.name }}</span>
          </div>
          <p class="role-desc">{{ role.desc }}</p>
          <ul class="role-perms">
            <li v-for="perm in role.perms" :key="perm">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ perm }}
            </li>
          </ul>
        </div>
      </div>

      <!-- ── Members table ── -->
      <div class="g-card members-card">
        <div class="card-header">
          <h2 class="card-title">Teammitglieder <span class="member-count">{{ filteredMembers.length }}</span></h2>
          <div class="header-controls">
            <div class="search-wrap">
              <svg class="search-icon" width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
                <path d="M15 15l-2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <input v-model="search" type="search" class="search-input" placeholder="Mitglied suchen…" />
            </div>
            <select v-model="roleFilter" class="g-input role-filter">
              <option value="all">Alle Rollen</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="viewer">Leser</option>
            </select>
          </div>
        </div>

        <div class="g-table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Mitglied</th>
                <th class="hide-mobile">Personalnr.</th>
                <th>Rolle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in filteredMembers" :key="m.id" class="table-row">
                <td>
                  <div class="member-cell">
                    <div class="member-avatar" :aria-label="m.name">{{ m.initials }}</div>
                    <div>
                      <div class="member-name">
                        {{ m.name }}
                        <span v-if="isMe(m)" class="you-tag">Du</span>
                      </div>
                      <div class="member-email">{{ m.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="cell-muted hide-mobile">{{ m.personalNummer || '—' }}</td>
                <td>
                  <span class="role-badge" :class="`rb-${m.role}`">{{ roleName(m.role) }}</span>
                </td>
              </tr>
              <tr v-if="store.isLoading && filteredMembers.length === 0">
                <td colspan="3" class="cell-empty">Benutzer werden geladen…</td>
              </tr>
              <tr v-else-if="filteredMembers.length === 0">
                <td colspan="3" class="cell-empty">{{ store.error || 'Keine Mitglieder gefunden.' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Create user modal ── -->
      <Teleport to="body">
        <Transition name="overlay">
          <div v-if="showCreate" class="g-modal-overlay" @click.self="closeCreate" role="dialog" aria-labelledby="create-title" aria-modal="true">
            <div class="g-modal invite-modal">
              <div class="modal-header">
                <h3 id="create-title" class="modal-title">Benutzer anlegen</h3>
                <button class="modal-close" :aria-label="t('common.close')" @click="closeCreate">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
              </div>
              <form class="modal-body" novalidate @submit.prevent="submitCreate">
                <div class="form-row">
                  <div class="field">
                    <label for="cu-first">Vorname *</label>
                    <input id="cu-first" v-model.trim="createForm.firstName" type="text" class="g-input" placeholder="Booster" required />
                  </div>
                  <div class="field">
                    <label for="cu-last">Nachname *</label>
                    <input id="cu-last" v-model.trim="createForm.lastName" type="text" class="g-input" placeholder="Master" required />
                  </div>
                </div>
                <div class="field">
                  <label for="cu-email">E-Mail-Adresse *</label>
                  <input id="cu-email" v-model.trim="createForm.email" type="email" class="g-input" placeholder="kollegin@firma.de" required />
                </div>
                <div class="form-row">
                  <div class="field">
                    <label for="cu-pn">Personalnummer</label>
                    <input id="cu-pn" v-model.trim="createForm.personalNummer" type="text" class="g-input" placeholder="1337" />
                  </div>
                  <div class="field">
                    <label for="cu-role">Rolle</label>
                    <select id="cu-role" v-model="createForm.role" class="g-input">
                      <option value="viewer">Leser – kann Pässe ansehen</option>
                      <option value="manager">Manager – kann Pässe bearbeiten</option>
                      <option value="admin">Administrator – voller Zugriff</option>
                    </select>
                  </div>
                </div>
                <div class="field">
                  <label for="cu-pw">Passwort *</label>
                  <input id="cu-pw" v-model="createForm.password" type="password" class="g-input" autocomplete="new-password" placeholder="••••••••" required />
                </div>

                <div v-if="store.error" class="create-error" role="alert">{{ store.error }}</div>

                <div class="modal-actions">
                  <button type="submit" class="g-btn g-btn-primary" style="flex:1" :disabled="store.isSaving || !canCreate">
                    {{ store.isSaving ? 'Wird angelegt …' : 'Benutzer anlegen' }}
                  </button>
                  <button type="button" class="g-btn g-btn-secondary" style="flex:1" @click="closeCreate">
                    {{ t('common.cancel') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- ── Toast ── -->
      <Teleport to="body">
        <Transition name="toast">
          <div v-if="toast" class="g-toast" role="status" aria-live="polite">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ toast }}
          </div>
        </Transition>
      </Teleport>

    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
import type { CreateUserPayload, TeamUser } from '~/stores/users'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { t }  = useI18n()
const auth   = useAuthStore()
const store  = useUsersStore()

const search     = ref('')
const roleFilter = ref('all')
const showCreate = ref(false)
const toast      = ref<string | null>(null)

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => { toast.value = null }, 3000)
}

// Load real users when the page opens
onMounted(() => { store.fetchAll() })

// Roles info
const roles = [
  {
    key: 'admin', icon: '👑', name: 'Administrator',
    desc: 'Vollzugriff auf alle Funktionen und Einstellungen.',
    perms: ['DPPs erstellen & löschen', 'Team verwalten', 'Einstellungen ändern', 'API-Schlüssel verwalten'],
  },
  {
    key: 'manager', icon: '✏️', name: 'Manager',
    desc: 'Kann Produktpässe bearbeiten und Berichte erstellen.',
    perms: ['DPPs bearbeiten', 'Lieferkette pflegen', 'Berichte exportieren'],
  },
  {
    key: 'viewer', icon: '👁️', name: 'Leser',
    desc: 'Kann alle Daten lesen, aber nichts ändern.',
    perms: ['DPPs ansehen', 'Berichte einsehen', 'QR-Codes scannen'],
  },
]

const roleNames: Record<string, string> = { admin: 'Administrator', manager: 'Manager', viewer: 'Leser' }
function roleName(role: string) { return roleNames[role] ?? role }

function isMe(m: TeamUser) {
  return !!auth.user && m.email.toLowerCase() === auth.user.email.toLowerCase()
}

const filteredMembers = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.users.filter(m => {
    const matchSearch = !q
      || m.name.toLowerCase().includes(q)
      || m.email.toLowerCase().includes(q)
      || m.personalNummer.toLowerCase().includes(q)
    const matchRole = roleFilter.value === 'all' || m.role === roleFilter.value
    return matchSearch && matchRole
  })
})

// Create user
const createForm = reactive<CreateUserPayload>({
  personalNummer: '',
  firstName:      '',
  lastName:       '',
  password:       '',
  role:           'viewer',
  email:          '',
})

const canCreate = computed(() =>
  createForm.firstName.trim().length > 0 &&
  createForm.lastName.trim().length  > 0 &&
  createForm.email.trim().length     > 0 &&
  createForm.password.length         > 0
)

function resetCreateForm() {
  createForm.personalNummer = ''
  createForm.firstName      = ''
  createForm.lastName       = ''
  createForm.password       = ''
  createForm.role           = 'viewer'
  createForm.email          = ''
}

function closeCreate() {
  showCreate.value = false
  store.error = null
}

async function submitCreate() {
  if (!canCreate.value) return
  const created = await store.create({ ...createForm })
  if (!created) return   // store.error is shown in the modal
  showToast(`Benutzer ${created.name} wurde angelegt`)
  resetCreateForm()
  showCreate.value = false
}
</script>

<style scoped>
/* Role cards */
.role-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.role-card  { display: flex; flex-direction: column; gap: 8px; }
.role-header { display: flex; align-items: center; gap: 8px; }
.role-icon   { font-size: 18px; }
.role-badge  { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; }
.rb-admin   { background: var(--color-crit-bg); color: var(--color-crit-dark); }
.rb-manager { background: var(--color-info-bg); color: var(--color-info-dark); }
.rb-viewer  { background: var(--color-surface-2); color: var(--color-text-2); border: 1px solid var(--color-border); }
.role-desc  { font-size: 12px; color: var(--color-text-2); line-height: 1.5; }
.role-perms { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.role-perms li { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-text-2); }
.role-perms li svg { color: var(--color-ok); flex-shrink: 0; }

/* Members card */
.members-card { overflow: hidden; padding: 0; }
.card-header  { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--color-border); background: var(--color-surface-2); flex-wrap: wrap; gap: 10px; }
.card-title   { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.member-count { font-size: 11px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 10px; padding: 1px 7px; color: var(--color-text-2); font-weight: 400; }
.header-controls { display: flex; gap: 8px; flex-wrap: wrap; }

.search-wrap { position: relative; }
.search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--color-text-3); pointer-events: none; }
.search-input { padding: 7px 10px 7px 28px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: 12px; font-family: inherit; background: var(--color-surface); color: var(--color-text-1); outline: none; width: 180px; }
.search-input:focus { border-color: var(--color-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand) 12%, transparent); }
.search-input::placeholder { color: var(--color-text-3); }
.search-input::-webkit-search-cancel-button { display: none; }

.role-filter { font-size: 12px; padding: 7px 10px; width: auto; cursor: pointer; }

/* Table */
.table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 480px; }
.table th { text-align: left; font-size: 11px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 14px; border-bottom: 1px solid var(--color-border); }
.table-row td { padding: 11px 14px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.table-row:last-child td { border-bottom: none; }
.table-row:hover td { background: var(--color-surface-2); }
.cell-muted { color: var(--color-text-2); font-size: 12px; }
.cell-empty { padding: 2rem !important; text-align: center; color: var(--color-text-3); }

.member-cell   { display: flex; align-items: center; gap: 10px; }
.member-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--color-brand); color: white;
  font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  position: relative; flex-shrink: 0;
}
.av-online { box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 3.5px var(--color-ok); }
.online-dot {
  position: absolute; bottom: -1px; right: -1px;
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--color-ok); border: 2px solid var(--color-surface);
}
.member-name  { font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.member-email { font-size: 11px; color: var(--color-text-3); margin-top: 1px; }
.you-tag { font-size: 10px; font-weight: 500; background: var(--color-info-bg); color: var(--color-info); padding: 1px 6px; border-radius: 8px; }

.role-select { font-size: 12px; padding: 5px 8px; cursor: pointer; max-width: 150px; }
.role-select:disabled { opacity: 0.5; cursor: not-allowed; }

.status-pill { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 20px; }
.sp-active  { background: var(--color-ok-bg);   color: var(--color-ok-dark); }
.sp-invited { background: var(--color-warn-bg);  color: var(--color-warn-dark); }

.icon-action { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-2); display: flex; align-items: center; justify-content: center; cursor: pointer; min-height: unset; }
.icon-action:hover { background: var(--color-surface-2); color: var(--color-text-1); }
.icon-action.danger:hover { background: var(--color-crit-bg); color: var(--color-crit); border-color: color-mix(in srgb, var(--color-crit) 25%, transparent); }

/* Invite modal */
.invite-modal { max-width: 420px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); }
.modal-title  { font-size: 14px; font-weight: 600; }
.modal-close  { background: none; border: none; cursor: pointer; color: var(--color-text-2); display: flex; align-items: center; padding: 4px; border-radius: var(--radius-sm); min-height: unset; }
.modal-close:hover { background: var(--color-surface-2); color: var(--color-text-1); }
.modal-body   { padding: 1.25rem; display: flex; flex-direction: column; gap: 14px; }
.field        { display: flex; flex-direction: column; gap: 6px; }
label         { font-size: 12px; font-weight: 500; color: var(--color-text-1); }
textarea.g-input { resize: vertical; min-height: 80px; font-family: inherit; }
.modal-actions { display: flex; gap: 8px; margin-top: 4px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.create-error { font-size: 12px; color: var(--color-crit); background: var(--color-crit-bg); padding: 8px 10px; border-radius: 8px; }

/* Transitions */
.overlay-enter-active, .overlay-leave-active { transition: opacity var(--t-base); }
.overlay-enter-from, .overlay-leave-to       { opacity: 0; }
.toast-enter-active,   .toast-leave-active   { transition: opacity var(--t-fast), transform var(--t-fast); }
.toast-enter-from,     .toast-leave-to       { opacity: 0; transform: translateY(8px); }

/* Responsive */
@media (max-width: 1024px) {
  .role-cards { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .role-cards { grid-template-columns: 1fr; }
  .header-controls { flex-direction: column; width: 100%; }
  .search-input { width: 100%; }
  .role-filter  { width: 100%; }
}
</style>
