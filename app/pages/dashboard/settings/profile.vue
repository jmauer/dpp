<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">{{ t('settings.profile.title') }}</h1>
          <p class="g-page-sub">{{ t('settings.profile.subtitle') }}</p>
        </div>
      </div>

      <!-- ── Personal data ── -->
      <section class="settings-section" aria-labelledby="section-personal">
        <div class="section-header">
          <div>
            <h2 id="section-personal" class="section-title">{{ t('settings.profile.personalData') }}</h2>
          </div>
        </div>
        <div class="g-card form-card">
          <!-- Avatar -->
          <div class="avatar-row">
            <div class="avatar-circle" :aria-label="auth.user?.avatarInitials">
              <span v-if="!auth.user?.avatarUrl">{{ auth.user?.avatarInitials }}</span>
              <img v-else :src="auth.user.avatarUrl" :alt="auth.user.name" class="avatar-img"/>
            </div>
            <div class="avatar-info">
              <button class="g-btn g-btn-secondary sm">{{ t('settings.profile.uploadPhoto') ?? 'Bild hochladen' }}</button>
              <p class="field-hint">JPG oder PNG, max. 2 MB</p>
            </div>
          </div>

          <div class="g-divider" />

          <form class="form-grid" novalidate @submit.prevent="saveProfile">
            <div class="field">
              <label for="firstName">{{ t('settings.profile.firstName') }}</label>
              <input id="firstName" v-model="profile.firstName" type="text" class="g-input" :placeholder="t('settings.profile.firstName')" />
            </div>
            <div class="field">
              <label for="lastName">{{ t('settings.profile.lastName') }}</label>
              <input id="lastName" v-model="profile.lastName" type="text" class="g-input" :placeholder="t('settings.profile.lastName')" />
            </div>
            <div class="field full">
              <label for="email">{{ t('settings.profile.email') }}</label>
              <div class="input-badge-wrap">
                <input id="email" v-model="profile.email" type="email" class="g-input" :placeholder="t('auth.emailPlaceholder')" />
                <span class="verified-badge">
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ t('common.verified') }}
                </span>
              </div>
              <p class="field-hint">{{ t('settings.profile.emailHint') ?? 'Nach Änderung erhalten Sie eine Bestätigungs-E-Mail.' }}</p>
            </div>
            <div class="field full">
              <label for="role">{{ t('settings.profile.role') }}</label>
              <input id="role" :value="roleLabel" type="text" class="g-input" disabled />
            </div>
            <div class="field full">
              <label for="language">{{ t('settings.profile.language') }}</label>
              <select id="language" v-model="profile.language" class="g-input select-input">
                <option v-for="loc in availableLocales" :key="loc.code" :value="loc.code">
                  {{ loc.flag }} {{ loc.name }}
                </option>
              </select>
            </div>

            <div class="form-footer full">
              <button type="submit" class="g-btn g-btn-primary" :disabled="profileSaving">
                <span v-if="profileSaving" class="g-spinner" aria-hidden="true" />
                {{ profileSaving ? t('settings.profile.saving') : t('settings.profile.saveChanges') }}
              </button>
              <Transition name="fade">
                <span v-if="profileSaved" class="saved-hint" role="status">{{ t('settings.profile.saved') }}</span>
              </Transition>
            </div>
          </form>
        </div>
      </section>

      <!-- ── Password ── -->
      <section class="settings-section" aria-labelledby="section-pw">
        <div class="section-header">
          <div>
            <h2 id="section-pw" class="section-title">{{ t('settings.profile.password.title') }}</h2>
          </div>
        </div>
        <div class="g-card form-card">
          <form class="form-grid" novalidate @submit.prevent="savePassword">
            <div class="field full">
              <label for="currentPw">{{ t('settings.profile.password.current') }}</label>
              <div class="pw-wrap">
                <input id="currentPw" v-model="passwords.current" :type="show.current ? 'text' : 'password'" class="g-input" placeholder="••••••••" autocomplete="current-password" />
                <button type="button" class="pw-eye" :aria-label="show.current ? t('auth.hidePassword') : t('auth.showPassword')" @click="show.current = !show.current">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
              </div>
            </div>
            <div class="field">
              <label for="newPw">{{ t('settings.profile.password.new') }}</label>
              <div class="pw-wrap">
                <input id="newPw" v-model="passwords.next" :type="show.next ? 'text' : 'password'" class="g-input" placeholder="••••••••" autocomplete="new-password" />
                <button type="button" class="pw-eye" :aria-label="show.next ? t('auth.hidePassword') : t('auth.showPassword')" @click="show.next = !show.next">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
              </div>
              <div v-if="passwords.next" class="strength-row" role="status" :aria-label="`Passwortstärke: ${pwStrength.label}`">
                <div class="strength-bar" aria-hidden="true">
                  <div class="strength-fill" :class="pwStrength.cls" :style="{ width: pwStrength.pct + '%' }" />
                </div>
                <span class="strength-label" :class="pwStrength.cls">{{ pwStrength.label }}</span>
              </div>
            </div>
            <div class="field">
              <label for="confirmPw">{{ t('settings.profile.password.confirm') }}</label>
              <div class="pw-wrap">
                <input id="confirmPw" v-model="passwords.confirm" :type="show.confirm ? 'text' : 'password'" class="g-input" :class="{ error: passwords.confirm && passwords.next !== passwords.confirm }" placeholder="••••••••" autocomplete="new-password" />
                <button type="button" class="pw-eye" :aria-label="show.confirm ? t('auth.hidePassword') : t('auth.showPassword')" @click="show.confirm = !show.confirm">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
              </div>
              <p v-if="passwords.confirm && passwords.next !== passwords.confirm" class="field-error" role="alert">
                {{ t('settings.profile.password.mismatch') }}
              </p>
            </div>
            <div v-if="auth.error" class="error-msg full" role="alert">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ auth.error }}
            </div>
            <div class="form-footer full">
              <button type="submit" class="g-btn g-btn-primary" :disabled="!canSavePw">
                {{ t('settings.profile.password.change') }}
              </button>
              <Transition name="fade">
                <span v-if="pwSaved" class="saved-hint" role="status">{{ t('settings.profile.saved') }}</span>
              </Transition>
            </div>
          </form>
        </div>
      </section>

      <!-- ── 2FA ── -->
      <section class="settings-section" aria-labelledby="section-2fa">
        <div class="section-header">
          <div>
            <h2 id="section-2fa" class="section-title">{{ t('settings.profile.tfa.title') }}</h2>
          </div>
          <span class="tfa-badge" :class="tfa.enabled ? 'tfa-on' : 'tfa-off'">
            {{ tfa.enabled ? t('settings.profile.tfa.active') : t('settings.profile.tfa.inactive') }}
          </span>
        </div>
        <div class="g-card form-card">
          <div class="tfa-options" role="radiogroup" :aria-label="t('settings.profile.tfa.title')">
            <label v-for="opt in tfaOptions" :key="opt.id" class="tfa-option" :class="{ selected: tfa.method === opt.id, disabled: !tfa.enabled }">
              <input type="radio" v-model="tfa.method" :value="opt.id" :disabled="!tfa.enabled" class="sr-only" />
              <span class="tfa-icon" aria-hidden="true">{{ opt.icon }}</span>
              <div class="tfa-info">
                <div class="tfa-name">{{ opt.name }}</div>
                <div class="tfa-desc">{{ opt.desc }}</div>
              </div>
              <svg v-if="tfa.method === opt.id && tfa.enabled" width="14" height="14" viewBox="0 0 20 20" fill="none" class="tfa-check" aria-hidden="true">
                <path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </label>
          </div>
          <div class="form-footer">
            <button class="g-btn" :class="tfa.enabled ? 'g-btn-secondary' : 'g-btn-primary'" @click="toggleTfa">
              {{ tfa.enabled ? t('settings.profile.tfa.disable') : t('settings.profile.tfa.enable') }}
            </button>
          </div>
        </div>
      </section>

      <!-- ── Sessions ── -->
      <section class="settings-section" aria-labelledby="section-sessions">
        <div class="section-header">
          <div>
            <h2 id="section-sessions" class="section-title">{{ t('settings.profile.sessions.title') }}</h2>
          </div>
          <button class="g-btn g-btn-secondary sm danger-ghost" @click="revokeAll">
            {{ t('settings.profile.sessions.revokeAll') }}
          </button>
        </div>
        <div class="g-card sessions-card">
          <div v-for="s in sessions" :key="s.id" class="session-row">
            <span class="session-icon" aria-hidden="true">{{ s.icon }}</span>
            <div class="session-info">
              <div class="session-device">
                {{ s.device }}
                <span v-if="s.current" class="current-tag">{{ t('settings.profile.sessions.current') }}</span>
              </div>
              <div class="session-meta">{{ s.location }} · {{ s.lastSeen }}</div>
            </div>
            <button v-if="!s.current" class="g-btn g-btn-secondary sm" @click="revokeSession(s.id)">
              {{ t('settings.profile.sessions.revoke') }}
            </button>
          </div>
        </div>
      </section>

      <!-- ── Danger zone ── -->
      <section class="settings-section danger-section" aria-labelledby="section-danger">
        <h2 id="section-danger" class="section-title danger-title">{{ t('settings.profile.danger.title') }}</h2>
        <div class="g-card form-card">
          <div class="danger-row">
            <div>
              <div class="danger-label">{{ t('settings.profile.danger.deactivate') }}</div>
              <div class="danger-desc">{{ t('settings.profile.danger.deactivateDesc') ?? 'Ihr Konto wird gesperrt. Ein Administrator kann es reaktivieren.' }}</div>
            </div>
            <button class="g-btn btn-danger">{{ t('settings.profile.danger.deactivate') }}</button>
          </div>
          <div class="g-divider" />
          <div class="danger-row">
            <div>
              <div class="danger-label">{{ t('settings.profile.danger.delete') }}</div>
              <div class="danger-desc">{{ t('settings.profile.danger.deleteDesc') ?? 'Alle Ihre Daten werden dauerhaft und unwiderruflich gelöscht.' }}</div>
            </div>
            <button class="g-btn btn-danger">{{ t('settings.profile.danger.delete') }}</button>
          </div>
        </div>
      </section>
    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { t, locale, locales } = useI18n()
const auth = useAuthStore()

// Available locales for language selector
const availableLocales = computed(() =>
  (locales.value as any[]).map(l => ({ code: l.code, name: l.name, flag: l.flag ?? '🌐' }))
)

const roleLabel = computed(() => {
  const map: Record<string, string> = { admin: 'Administrator', manager: 'Manager', viewer: 'Leser' }
  return map[auth.user?.role ?? 'viewer'] ?? auth.user?.role
})

// Profile form
const profile = reactive({
  firstName: auth.user?.firstName ?? '',
  lastName:  auth.user?.lastName  ?? '',
  email:     auth.user?.email     ?? '',
  language:  auth.user?.language  ?? locale.value,
})

const profileSaving = ref(false)
const profileSaved  = ref(false)

async function saveProfile() {
  profileSaving.value = true
  const ok = await auth.updateProfile({
    firstName: profile.firstName,
    lastName:  profile.lastName,
    email:     profile.email,
    language:  profile.language,
  })
  profileSaving.value = false
  if (ok) {
    profileSaved.value = true
    setTimeout(() => { profileSaved.value = false }, 3000)
  }
}

// Password
const passwords = reactive({ current: '', next: '', confirm: '' })
const show       = reactive({ current: false, next: false, confirm: false })
const pwSaved    = ref(false)

const pwStrength = computed(() => {
  const p = passwords.next
  if (!p)          return { pct: 0,   label: '',                                       cls: '' }
  if (p.length < 6)return { pct: 20,  label: t('settings.profile.password.strength.weak'),   cls: 'str-crit' }
  if (p.length < 10)return { pct: 55, label: t('settings.profile.password.strength.medium'), cls: 'str-warn' }
  if (/[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p))
    return { pct: 100, label: t('settings.profile.password.strength.strong'), cls: 'str-ok' }
  return { pct: 75, label: t('settings.profile.password.strength.good'), cls: 'str-ok' }
})

const canSavePw = computed(() =>
  passwords.current && passwords.next &&
  passwords.next === passwords.confirm &&
  passwords.next.length >= 8
)

async function savePassword() {
  auth.clearError()
  const ok = await auth.changePassword({
    currentPassword: passwords.current,
    newPassword:     passwords.next,
  })
  if (ok) {
    passwords.current = ''; passwords.next = ''; passwords.confirm = ''
    pwSaved.value = true
    setTimeout(() => { pwSaved.value = false }, 3000)
  }
}

// 2FA
const tfa = reactive({ enabled: auth.user?.twoFactorEnabled ?? false, method: 'totp' })
const tfaOptions = [
  { id: 'totp',  icon: '🔐', name: t('settings.profile.tfa.totp'),        desc: 'Google Authenticator, Authy o.ä.' },
  { id: 'sms',   icon: '📱', name: t('settings.profile.tfa.sms'),         desc: 'Code per SMS an Ihre Handynummer' },
  { id: 'email', icon: '📧', name: t('settings.profile.tfa.emailMethod'), desc: 'Code an Ihre E-Mail-Adresse' },
]

async function toggleTfa() {
  const ok = await auth.setTwoFactor(!tfa.enabled)
  if (ok) tfa.enabled = !tfa.enabled
}

// Sessions
const sessions = ref([
  { id: 's1', icon: '💻', device: 'Chrome – macOS',   location: 'Stuttgart, DE', lastSeen: 'Jetzt aktiv',    current: true  },
  { id: 's2', icon: '📱', device: 'Safari – iPhone',  location: 'Stuttgart, DE', lastSeen: 'Heute, 09:14',   current: false },
  { id: 's3', icon: '💻', device: 'Firefox – Windows',location: 'Berlin, DE',    lastSeen: 'Gestern, 18:42', current: false },
])
function revokeSession(id: string) { sessions.value = sessions.value.filter(s => s.id !== id) }
function revokeAll()               { sessions.value = sessions.value.filter(s => s.current)   }
</script>

<style scoped>
.settings-section { display: flex; flex-direction: column; gap: 10px; }
.section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-title  { font-size: 14px; font-weight: 600; }

.form-card { padding: 1.25rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field     { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.full       { grid-column: 1 / -1; }
label       { font-size: 12px; font-weight: 500; color: var(--color-text-1); }
.select-input { cursor: pointer; }

.avatar-row  { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
.avatar-circle { width: 52px; height: 52px; border-radius: 50%; background: var(--color-brand); color: white; font-size: 18px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.avatar-img  { width: 100%; height: 100%; object-fit: cover; }
.avatar-info { display: flex; flex-direction: column; gap: 5px; }
.field-hint  { font-size: 11px; color: var(--color-text-3); }
.field-error { font-size: 11px; color: var(--color-crit); }
.g-btn.sm    { font-size: 12px; padding: 6px 12px; }

.input-badge-wrap { position: relative; display: flex; align-items: center; }
.input-badge-wrap .g-input { flex: 1; padding-right: 100px; }
.verified-badge { position: absolute; right: 8px; display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; color: var(--color-ok); background: var(--color-ok-bg); padding: 3px 8px; border-radius: 10px; white-space: nowrap; }

.pw-wrap { position: relative; }
.pw-wrap .g-input { padding-right: 42px; }
.pw-eye  { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--color-text-3); display: flex; align-items: center; padding: 4px; min-height: unset; }
.pw-eye:hover { color: var(--color-text-1); }

.strength-row  { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
.strength-bar  { flex: 1; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 2px; transition: width var(--t-base); }
.str-ok   { background: var(--color-ok);   color: var(--color-ok);   }
.str-warn { background: var(--color-warn);  color: var(--color-warn); }
.str-crit { background: var(--color-crit);  color: var(--color-crit); }
.strength-label { font-size: 11px; font-weight: 500; white-space: nowrap; }

.form-footer { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid var(--color-border); margin-top: 4px; }
.saved-hint  { font-size: 12px; color: var(--color-ok); font-weight: 500; }
.error-msg   { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-crit); background: var(--color-crit-bg); padding: 8px 10px; border-radius: var(--radius-md); }

.tfa-badge { font-size: 11px; font-weight: 500; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
.tfa-on  { background: var(--color-ok-bg);   color: var(--color-ok); }
.tfa-off { background: var(--color-surface-2); color: var(--color-text-3); border: 1px solid var(--color-border); }

.tfa-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.tfa-option { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); cursor: pointer; transition: border-color var(--t-fast); }
.tfa-option.selected { border-color: var(--color-brand); background: var(--color-ok-bg); }
.tfa-option.disabled { opacity: 0.5; cursor: not-allowed; }
.tfa-icon { font-size: 20px; flex-shrink: 0; }
.tfa-name { font-size: 13px; font-weight: 500; }
.tfa-desc { font-size: 11px; color: var(--color-text-2); margin-top: 2px; }
.tfa-check { color: var(--color-brand); margin-left: auto; flex-shrink: 0; }

.sessions-card { overflow: hidden; padding: 0; }
.session-row { display: flex; align-items: center; gap: 12px; padding: 12px 1.1rem; border-bottom: 1px solid var(--color-border); }
.session-row:last-child { border-bottom: none; }
.session-icon   { font-size: 22px; flex-shrink: 0; }
.session-info   { flex: 1; }
.session-device { font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.session-meta   { font-size: 11px; color: var(--color-text-3); margin-top: 2px; }
.current-tag    { font-size: 10px; font-weight: 500; background: var(--color-ok-bg); color: var(--color-ok); padding: 2px 7px; border-radius: 10px; }

.danger-section .section-title { color: var(--color-crit); }
.danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 4px 0; flex-wrap: wrap; }
.danger-label { font-size: 13px; font-weight: 500; }
.danger-desc  { font-size: 12px; color: var(--color-text-2); margin-top: 3px; }
.btn-danger   { background: var(--color-crit-bg); color: var(--color-crit); border: 1px solid color-mix(in srgb, var(--color-crit) 25%, transparent); }
.btn-danger:hover { background: var(--color-crit); color: white; }
.danger-ghost { color: var(--color-crit); border-color: var(--color-border); }
.danger-ghost:hover { background: var(--color-crit-bg); border-color: color-mix(in srgb, var(--color-crit) 25%, transparent); }

.fade-enter-active, .fade-leave-active { transition: opacity var(--t-fast); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .field.full, .full { grid-column: 1; }
}
</style>
