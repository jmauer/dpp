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
              <div class="key-name">{{ key.name }}</div>
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
              <div class="wh-url mono">{{ wh.url }}</div>
              <div class="wh-events">{{ wh.events.join(' · ') }}</div>
            </div>
            <div class="wh-last">
              <span class="wh-status-code" :class="wh.lastStatus === 200 ? 'code-ok' : 'code-err'">
                {{ wh.lastStatus ? `HTTP ${wh.lastStatus}` : '—' }}
              </span>
              <span class="wh-time">{{ wh.lastFired ?? 'Nie' }}</span>
            </div>
            <label class="g-toggle" :aria-label="`Webhook ${wh.url} ${wh.active ? 'deaktivieren' : 'aktivieren'}`">
              <input type="checkbox" v-model="wh.active" />
              <span class="g-toggle-track" />
            </label>
            <button
              class="icon-action danger"
              :aria-label="`Webhook ${wh.url} löschen`"
              @click="webhooks.splice(webhooks.indexOf(wh), 1)"
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
definePageMeta({ layout: 'default', middleware: 'auth' })

const { t }    = useI18n()
const revealed = ref<string | null>(null)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function copyKey(id: string) {
  const key = apiKeys.find(k => k.id === id)
  if (key) await navigator.clipboard.writeText(key.value)
}

// ── API Keys ──────────────────────────────

const apiKeys = reactive([
  {
    id: 'k1', name: 'Produktion – ERP Sync',
    scopes: ['read', 'write'],
    createdAt: '2026-01-15', lastUsed: 'Heute',
    value: 'ppdpp_live_sk_4fX9mK2rTqNvLa8hWbEzCjPYsUo',
  },
  {
    id: 'k2', name: 'Staging – Test-Umgebung',
    scopes: ['read'],
    createdAt: '2026-03-08', lastUsed: 'vor 3 Tagen',
    value: 'ppdpp_test_sk_7gR3cN5wBmHkPd6yAeVfZxJiSqTu',
  },
])

function createKey() {
  apiKeys.push({
    id:        `k${Date.now()}`,
    name:      'Neuer API-Schlüssel',
    scopes:    ['read'],
    createdAt: new Date().toISOString().slice(0, 10),
    lastUsed:  null as any,
    value:     'ppdpp_live_sk_' + Math.random().toString(36).slice(2, 34),
  })
}

function deleteKey(id: string) {
  const idx = apiKeys.findIndex(k => k.id === id)
  if (idx >= 0) apiKeys.splice(idx, 1)
}

// ── Webhooks ──────────────────────────────

const webhooks = reactive([
  { id: 'wh1', url: 'https://erp.mustergmbh.de/hooks/dpp',  events: ['gap.created', 'product.updated'], active: true,  lastStatus: 200, lastFired: 'vor 2 Std.' },
  { id: 'wh2', url: 'https://n8n.intern/webhook/compliance', events: ['compliance.changed'],             active: false, lastStatus: 500, lastFired: 'vor 2 Tagen' },
])

function addWebhook() {
  webhooks.push({
    id:         `wh${Date.now()}`,
    url:        'https://',
    events:     ['product.updated'],
    active:     false,
    lastStatus: null as any,
    lastFired:  null as any,
  })
}

// ── System integrations ───────────────────

const integrations = reactive([
  { id: 'sap',        icon: '🏢', name: 'SAP S/4HANA',       desc: 'Materialstammdaten und Stücklisten synchronisieren',            connected: true,  since: 'Jan 2026' },
  { id: 'teamcenter', icon: '⚙️', name: 'Teamcenter PLM',    desc: 'Produktdaten und Revisionen aus Siemens Teamcenter importieren', connected: false, since: null },
  { id: 'excel',      icon: '📊', name: 'Excel / CSV Import', desc: 'Massenimport von Produktdaten über Excel-Vorlagen',             connected: true,  since: 'Feb 2026' },
  { id: 'envirosuite',icon: '🔬', name: 'Envirosuite',        desc: 'CO₂- und Umweltdaten aus Messsystemen übernehmen',              connected: false, since: null },
  { id: 'sharepoint', icon: '📁', name: 'SharePoint',         desc: 'Zertifikate und Dokumente aus SharePoint verknüpfen',           connected: false, since: null },
  { id: 'rest',       icon: '🔗', name: 'REST API (Push)',    desc: 'Beliebiges System per REST API Push-Integration anbinden',      connected: false, since: null },
])

function toggleIntegration(int: typeof integrations[0]) {
  int.connected = !int.connected
  if (int.connected) {
    int.since = new Date().toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
  }
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
</style>
