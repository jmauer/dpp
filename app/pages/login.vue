<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-header">
        <h2>Willkommen zurück</h2>
        <p>Melden Sie sich bei Ihrem PassPort DPP-Konto an.</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">E-Mail-Adresse</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Emailunternehmen.de"
            autocomplete="email"
            :class="{ error: auth.error }"
            required
          />
        </div>

        <div class="field">
          <label for="password">
            Passwort
            <a href="#" class="forgot-link">Vergessen?</a>
          </label>
          <div class="password-wrap">
            <input
              id="password"
              v-model="password"
              :type="showPw ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              :class="{ error: auth.error }"
              required
            />
            <button type="button" class="pw-toggle" @click="showPw = !showPw" :aria-label="showPw ? 'Passwort verbergen' : 'Passwort anzeigen'">
              <svg v-if="!showPw" width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M3 3l14 14M12.45 12.45A2.5 2.5 0 0 1 7.55 7.55M17.94 10c-.29.61-.69 1.22-1.19 1.79M8.35 4.18C8.88 4.07 9.43 4 10 4c5 0 8 6 8 6a14.7 14.7 0 0 1-1.5 2.16M2.06 10c.29-.61.69-1.22 1.19-1.79M2 2l2.31 2.31" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </div>

        <div v-if="auth.error" class="error-msg" role="alert">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ auth.error }}
        </div>

        <button type="submit" class="btn-login" :disabled="auth.isLoading">
          <span v-if="!auth.isLoading">Anmelden</span>
          <span v-else class="spinner-wrap">
            <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" stroke-dasharray="40 20" stroke-linecap="round"/></svg>
            Anmelden…
          </span>
        </button>
      </form>

      <div class="demo-hint">
        <strong>Demo-Zugangsdaten:</strong><br>
        <code>demo@passport-dpp.de</code> / <code>Demo12!</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'auth' })

const auth = useAuthStore()
const router = useRouter()

const email    = ref('')
const password = ref('')
const showPw   = ref(false)

async function handleLogin() {
  const ok = await auth.login({ email: email.value, password: password.value })
  if (ok) router.push('/dashboard')
}
</script>

<style scoped>
.login-wrap {
  width: 100%;
  max-width: 380px;
}

.login-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.login-header {
  margin-bottom: 1.75rem;
}

.login-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-1);
  letter-spacing: -0.02em;
  margin-bottom: 5px;
}

.login-header p {
  font-size: 13px;
  color: var(--color-text-2);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: 12px;
  color: var(--color-brand);
  text-decoration: none;
  font-weight: 400;
}

input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  background: var(--color-bg);
  color: var(--color-text-1);
  outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}

input::placeholder { color: var(--color-text-3); }
input:focus { border-color: var(--color-brand); box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
input.error { border-color: var(--color-crit); }

.password-wrap {
  position: relative;
}
.password-wrap input { padding-right: 38px; }

.pw-toggle {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: var(--color-text-3); display: flex; align-items: center;
}
.pw-toggle:hover { color: var(--color-text-1); }

.error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-crit);
  background: var(--color-crit-bg);
  padding: 8px 10px;
  border-radius: 8px;
}

.btn-login {
  width: 100%;
  padding: 10px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  cursor: pointer;
  transition: background 0.12s;
  margin-top: 0.25rem;
}
.btn-login:hover:not(:disabled) { background: var(--color-brand-dark); }
.btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

.spinner-wrap {
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.demo-hint {
  margin-top: 1.25rem;
  padding: 10px 12px;
  background: var(--color-surface-2);
  border-radius: 8px;
  font-size: 12px;
  color: var(--color-text-2);
  line-height: 1.7;
  border: 1px solid var(--color-border);
}

code {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  background: var(--color-bg);
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}
</style>
