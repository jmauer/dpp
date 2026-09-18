<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">{{ t('settings.nav.integrations') }}</h1>
          <p class="g-page-sub">Verbinden Sie PassPort DPP mit Ihren bestehenden Systemen</p>
        </div>
      </div>

      <!-- ── API Keys ── -->
      <section class="settings-section" aria-labelledby="s-api">
        <div class="section-header">
          <div>
            <h2 id="s-api" class="section-title">API-Schlüssel</h2>
            <p class="section-sub">Für externe Systemzugriffe auf Ihre DPP-Daten.</p>
          </div>
          <button class="g-btn g-btn-primary sm" @click="createKey">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Neuer Schlüssel
          </button>
        </div>

        <div class="g-card keys-card">
          <div v-for="key in apiKeys" :key="key.id" class="key-row">
            <div class="key-left">
              <input
                v-model.trim="key.name"
                class="key-name-input"
                :aria-label="`Name des Schlüssels ${key.name}`"
                placeholder="Name des Schlüssels"
                @change="persist"
              />
              <div class="key-meta">
                <span v-for="s in key.scopes" :key="s" class="scope-tag">{{ s }}</span>
              </div>
              <div class="key-dates">
                Erstellt {{ formatDate(key.createdAt) }}
                <span class="key-sep" aria-hidden="true">·</span>
                Zuletzt verwendet {{ key.lastUsed ?? 'Nie' }}
              </div>
            </div>
            <div class="key-right">
              <code
                class="key-value"
                :class="{ copied: copiedKey === key.id }"
                :title="t('common.copy')"
                @click="copyKey(key.id)"
              >
                {{ revealed === key.id
                    ? key.value
                    : key.value.slice(0, 12) + '••••••••••••' }}
              </code>
              <button
                class="icon-action"
                :aria-label="revealed === key.id ? 'Verbergen' : 'Anzeigen'"
                @click="revealed = revealed === key.id ? null : key.id"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z" stroke="currentColor" stroke-width="1.5"/>
                  <circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
              <button
                class="icon-action"
                :aria-label="t('common.copy')"
                @click="copyKey(key.id)"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M4 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.5"/>
                </svg>
              </button>
              <button
                class="icon-action danger"
                :aria-label="`Schlüssel ${key.name} löschen`"
                @click="deleteKey(key.id)"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M4 6h12M8 6V4h4v2M7 6v10h6V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="apiKeys.length === 0" class="empty-row">
            Noch keine API-Schlüssel erstellt.
          </div>
        </div>

        <p class="docs-hint">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v5M10 7v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Dokumentation und Beispiele unter
          <a href="https://docs.passport-dpp.de/api" target="_blank" rel="noopener" class="docs-link">
            docs.passport-dpp.de/api ↗
          </a>
        </p>
      </section>

      <!-- ── Webhooks ── -->
      <section class="settings-section" aria-labelledby="s-webhooks">
        <div class="section-header">
          <div>
            <h2 id="s-webhooks" class="section-title">Webhooks</h2>
            <p class="section-sub">Echtzeit-Events an Ihre Endpunkte senden, wenn sich DPP-Daten ändern.</p>
          </div>
          <button class="g-btn g-btn-secondary sm" @click="addWebhook">
            + Webhook hinzufügen
          </button>
        </div>

        <div class="g-card webhooks-card">
          <div v-for="wh in webhooks" :key="wh.id" class="webhook-row">
            <div class="wh-status-dot" :class="wh.active ? 'dot-ok' : 'dot-neutral'" :aria-label="wh.active ? 'Aktiv' : 'Inaktiv'"/>
            <div class="wh-info">
              <input
                v-model.trim="wh.url"
                type="url"
                class="wh-url-input mono"
                :aria-label="`Ziel-URL des Webhooks`"
                placeholder="https://erp.meinefirma.de/hooks/dpp"
                @change="persist"
              />
              <div class="wh-events">
                <label v-for="ev in webhookEvents" :key="ev" class="wh-event-chip" :class="{ active: wh.events.includes(ev) }">
                  <input type="checkbox" :checked="wh.events.includes(ev)" @change="toggleWebhookEvent(wh, ev)" />
                  {{ ev }}
                </label>
              </div>
            </div>
            <div class="wh-last">
              <span class="wh-status-code" :class="wh.lastStatus === 200 ? 'code-ok' : 'code-err'">
                {{ wh.lastStatus ? `HTTP ${wh.lastStatus}` : '—' }}
              </span>
              <span class="wh-time">{{ wh.lastFired ?? 'Nie' }}</span>
            </div>
            <label class="g-toggle" :aria-label="`Webhook ${wh.url} ${wh.active ? 'deaktivieren' : 'aktivieren'}`">
              <input type="checkbox" v-model="wh.active" @change="persist" />
              <span class="g-toggle-track" />
            </label>
            <button
              class="icon-action danger"
              :aria-label="`Webhook ${wh.url} löschen`"
              @click="deleteWebhook(wh.id)"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M4 6h12M8 6V4h4v2M7 6v10h6V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div v-if="webhooks.length === 0" class="empty-row">
            Noch keine Webhooks konfiguriert.
          </div>
        </div>
      </section>

      <!-- ── System integrations ── -->
      <section class="settings-section" aria-labelledby="s-systems">
        <div class="section-header">
          <h2 id="s-systems" class="section-title">System-Integrationen</h2>
          <p class="section-sub-inline">ERP, PLM und weitere Datenquellen anbinden</p>
        </div>

        <div class="integrations-grid">
          <div
            v-for="int in integrations"
            :key="int.id"
            class="g-card integration-card"
            :class="{ connected: int.connected }"
          >
            <div class="int-header">
              <span class="int-icon" aria-hidden="true">{{ int.icon }}</span>
              <span class="int-status-badge" :class="int.connected ? 'ib-connected' : 'ib-available'">
                {{ int.connected ? '● Verbunden' : 'Verfügbar' }}
              </span>
            </div>
            <div class="int-name">{{ int.name }}</div>
            <div class="int-desc">{{ int.desc }}</div>
            <div v-if="int.connected && int.since" class="int-since">Verbunden seit {{ int.since }}</div>
            <button
              class="g-btn int-btn"
              :class="int.connected ? 'g-btn-secondary' : 'g-btn-primary'"
              @click="toggleIntegration(int)"
            >
              {{ int.connected ? 'Trennen' : 'Verbinden' }}
            </button>
          </div>
        </div>
      </section>

    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
import type { SystemIntegration, Webhook } from '~/stores/settings'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { t }    = useI18n()
const settings = useSettingsStore()

onMounted(() => { settings.fetchAll() })

const apiKeys      = computed(() => settings.state.integrations.apiKeys)
const webhooks     = computed(() => settings.state.integrations.webhooks)
const integrations = computed(() => settings.state.integrations.systems)

const revealed   = ref<string | null>(null)
const copiedKey  = ref<string | null>(null)

/**
 * Diese Seite hat bewusst keinen Speichern-Button: jede Aenderung ist eine
 * abgeschlossene Aktion (Schluessel anlegen, Webhook abschalten). Deshalb
 * wird nach jeder Mutation direkt persistiert.
 */
function persist() {
  return settings.save('integrations')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── API Keys ──────────────────────────────

async function copyKey(id: string) {
  const key = apiKeys.value.find(k => k.id === id)
  if (!key) return
  try {
    await navigator.clipboard.writeText(key.value)
    copiedKey.value = id
    setTimeout(() => { if (copiedKey.value === id) copiedKey.value = null }, 2000)
  } catch {
    // Clipboard ohne Nutzergeste oder ohne https – dann wenigstens aufdecken,
    // damit der Wert von Hand kopiert werden kann.
    revealed.value = id
  }
}

/**
 * Schluesselwert erzeugen. `crypto.getRandomValues` statt Math.random:
 * ein API-Schluessel darf nicht vorhersagbar sein.
 */
function generateKeyValue(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const body = Array.from(bytes, b => alphabet[b % alphabet.length]).join('')
  return `ppdpp_live_sk_${body}`
}

async function createKey() {
  const id = `k-${Date.now()}`
  settings.state.integrations.apiKeys.push({
    id,
    name:      'Neuer API-Schlüssel',
    scopes:    ['read'],
    createdAt: new Date().toISOString().slice(0, 10),
    lastUsed:  null,
    value:     generateKeyValue(),
  })
  revealed.value = id   // einmal zeigen – danach ist er nur noch maskiert sichtbar
  await persist()
}

async function deleteKey(id: string) {
  const key = apiKeys.value.find(k => k.id === id)
  if (!key) return
  if (!confirm(`Schlüssel „${key.name}" endgültig löschen? Systeme, die ihn verwenden, verlieren den Zugriff.`)) return

  const idx = settings.state.integrations.apiKeys.findIndex(k => k.id === id)
  if (idx >= 0) settings.state.integrations.apiKeys.splice(idx, 1)
  if (revealed.value === id) revealed.value = null
  await persist()
}

// ── Webhooks ──────────────────────────────

const webhookEvents = [
  'product.created',
  'product.updated',
  'gap.created',
  'gap.resolved',
  'compliance.changed',
]

async function addWebhook() {
  settings.state.integrations.webhooks.push({
    id:         `wh-${Date.now()}`,
    url:        '',
    events:     ['product.updated'],
    active:     false,
    lastStatus: null,
    lastFired:  null,
  })
  await persist()
}

async function deleteWebhook(id: string) {
  const idx = settings.state.integrations.webhooks.findIndex(w => w.id === id)
  if (idx < 0) return
  settings.state.integrations.webhooks.splice(idx, 1)
  await persist()
}

async function toggleWebhookEvent(webhook: Webhook, event: string) {
  webhook.events = webhook.events.includes(event)
    ? webhook.events.filter(e => e !== event)
    : [...webhook.events, event]
  await persist()
}

// ── System-Integrationen ──────────────────

async function toggleIntegration(int: SystemIntegration) {
  int.connected = !int.connected
  int.since = int.connected
    ? new Date().toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
    : null
  await persist()
}
</script>

<style scoped>
.settings-section    { display: flex; flex-direction: column; gap: 10px; }
.section-header      { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-title       { font-size: 14px; font-weight: 600; }
.section-sub         { font-size: 12px; color: var(--color-text-2); margin-top: 3px; line-height: 1.5; }
.section-sub-inline  { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }
.g-btn.sm            { font-size: 12px; padding: 6px 12px; }

/* API Keys */
.keys-card  { overflow: hidden; padding: 0; }
.key-row    { display: flex; align-items: center; gap: 12px; padding: 13px 1.1rem; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; }
.key-row:last-child { border-bottom: none; }
.key-left   { flex: 1; min-width: 0; }
.key-name   { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
.key-meta   { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 3px; }
.scope-tag  { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 6px; background: var(--color-ok-bg); color: var(--color-ok-dark); font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.03em; }
.key-dates  { font-size: 11px; color: var(--color-text-3); }
.key-sep    { margin: 0 4px; }
.key-right  { display: flex; align-items: center; gap: 6px; flex-shrink: 0; flex-wrap: wrap; }
.key-value  {
  font-size: 11px; font-family: 'DM Mono', monospace;
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  padding: 4px 9px; border-radius: 6px; cursor: pointer;
  color: var(--color-text-2); max-width: 220px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  display: block;
}

.icon-action {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--color-border); background: var(--color-surface);
  color: var(--color-text-2); display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0; min-height: unset;
}
.icon-action:hover { background: var(--color-surface-2); color: var(--color-text-1); }
.icon-action.danger:hover { background: var(--color-crit-bg); color: var(--color-crit); border-color: color-mix(in srgb, var(--color-crit) 25%, transparent); }

.empty-row { padding: 2rem; text-align: center; font-size: 13px; color: var(--color-text-3); }

.docs-hint { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-2); margin-top: 4px; }
.docs-link { color: var(--color-brand); text-decoration: none; }
.docs-link:hover { color: var(--color-brand-dark); }

/* Webhooks */
.webhooks-card { overflow: hidden; padding: 0; }
.webhook-row   { display: flex; align-items: center; gap: 11px; padding: 12px 1.1rem; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; }
.webhook-row:last-child { border-bottom: none; }
.wh-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dot-ok      { background: var(--color-ok); }
.dot-neutral { background: var(--color-text-3); }
.wh-info  { flex: 1; min-width: 0; }
.wh-url   { font-size: 12px; font-family: 'DM Mono', monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wh-events { font-size: 11px; color: var(--color-text-3); margin-top: 2px; }
.wh-last  { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.wh-status-code { font-size: 12px; font-weight: 600; }
.code-ok   { color: var(--color-ok); }
.code-err  { color: var(--color-crit); }
.wh-time   { font-size: 11px; color: var(--color-text-3); margin-top: 1px; }

/* Integrations grid */
.integrations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.integration-card {
  display: flex; flex-direction: column; gap: 7px;
  transition: box-shadow var(--t-fast);
}
.integration-card:hover { box-shadow: var(--shadow-md); }
.integration-card.connected {
  border-color: color-mix(in srgb, var(--color-ok) 25%, transparent);
}
.int-header { display: flex; align-items: center; justify-content: space-between; }
.int-icon   { font-size: 22px; }
.int-status-badge { font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 10px; white-space: nowrap; }
.ib-connected { background: var(--color-ok-bg);   color: var(--color-ok); }
.ib-available { background: var(--color-surface-2); color: var(--color-text-3); border: 1px solid var(--color-border); }
.int-name  { font-size: 13px; font-weight: 600; }
.int-desc  { font-size: 12px; color: var(--color-text-2); line-height: 1.5; flex: 1; }
.int-since { font-size: 11px; color: var(--color-text-3); }
.int-btn   { width: 100%; justify-content: center; margin-top: 4px; }

.mono { font-family: 'DM Mono', monospace; }

/* Responsive */
@media (max-width: 1024px) {
  .integrations-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .integrations-grid { grid-template-columns: 1fr; }
  .key-value { max-width: 140px; }
  .wh-last { display: none; }
}

.key-name-input {
  font-size: 13px; font-weight: 500; color: var(--color-text-1);
  background: none; border: 1px solid transparent; border-radius: 6px;
  padding: 2px 6px; margin-left: -6px; width: 100%; max-width: 280px;
}
.key-name-input:hover { border-color: var(--color-border); }
.key-name-input:focus { border-color: var(--color-brand); outline: none; background: var(--color-surface); }

.key-value.copied { color: var(--color-ok); }

.wh-url-input {
  font-size: 12px; width: 100%;
  background: none; border: 1px solid transparent; border-radius: 6px;
  padding: 2px 6px; margin-left: -6px; color: var(--color-text-1);
}
.wh-url-input:hover { border-color: var(--color-border); }
.wh-url-input:focus { border-color: var(--color-brand); outline: none; background: var(--color-surface); }

.wh-events { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
.wh-event-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; padding: 2px 7px; border-radius: 999px;
  border: 1px solid var(--color-border); color: var(--color-text-3);
  cursor: pointer; user-select: none;
}
.wh-event-chip input { display: none; }
.wh-event-chip.active { border-color: var(--color-brand); color: var(--color-brand); }
</style>
