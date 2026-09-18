<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">{{ t('settings.nav.notifications') }}</h1>
          <p class="g-page-sub">Steuern Sie, wann und wie Sie über DPP-Ereignisse informiert werden.</p>
        </div>
      </div>

      <!-- ── Channels ── -->
      <section class="settings-section" aria-labelledby="s-channels">
        <div class="section-header">
          <h2 id="s-channels" class="section-title">Kanäle</h2>
        </div>
        <div class="g-card channels-card">
          <div v-for="ch in channels" :key="ch.id" class="channel-row">
            <span class="ch-icon" aria-hidden="true">{{ ch.icon }}</span>
            <div class="ch-info">
              <div class="ch-name">{{ ch.name }}</div>
              <div class="ch-desc">{{ ch.desc }}</div>
              <div v-if="ch.id === 'email' && auth.user?.email" class="ch-target">
                {{ auth.user.email }}
              </div>
              <div v-if="ch.id === 'slack' || ch.id === 'webhook'" class="ch-connect-row">
                <template v-if="connecting === ch.id">
                  <input
                    v-model.trim="connectUrl"
                    type="url"
                    class="g-input ch-url-input"
                    :placeholder="ch.id === 'slack' ? 'https://hooks.slack.com/services/…' : 'https://erp.meinefirma.de/hooks/dpp'"
                    :aria-label="`Ziel-URL für ${ch.name}`"
                    @keyup.enter="confirmConnect(ch)"
                  />
                  <button class="g-btn g-btn-primary sm" :disabled="!isValidUrl(connectUrl)" @click="confirmConnect(ch)">
                    {{ t('common.save') }}
                  </button>
                  <button class="g-btn g-btn-secondary sm" @click="cancelConnect">{{ t('common.cancel') }}</button>
                </template>
                <template v-else-if="ch.connected">
                  <span class="ch-target">{{ ch.target }}</span>
                  <button class="g-btn g-btn-secondary sm" @click="startConnect(ch)">Ändern</button>
                  <button class="g-btn g-btn-secondary sm" @click="disconnect(ch)">Trennen</button>
                </template>
                <button v-else class="g-btn g-btn-secondary sm" @click="startConnect(ch)">
                  {{ ch.id === 'slack' ? 'Mit Slack verbinden →' : 'Webhook konfigurieren →' }}
                </button>
              </div>
            </div>
            <div class="ch-right">
              <span v-if="ch.connected" class="connected-badge">Verbunden</span>
              <label
                class="g-toggle"
                :aria-label="`${ch.name} ${ch.active ? 'deaktivieren' : 'aktivieren'}`"
              >
                <input
                  type="checkbox"
                  v-model="ch.active"
                  :disabled="!ch.connected"
                />
                <span class="g-toggle-track" />
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Event preferences ── -->
      <section class="settings-section" aria-labelledby="s-events">
        <div class="section-header">
          <div>
            <h2 id="s-events" class="section-title">Ereignis-Einstellungen</h2>
            <p class="section-sub">Konfigurieren Sie Benachrichtigungen je Ereignistyp.</p>
          </div>
        </div>
        <div class="g-card events-card">
          <!-- Header row -->
          <div class="events-header">
            <span class="eh-label">Ereignis</span>
            <span
              v-for="ch in activeChannels"
              :key="ch.id"
              class="eh-ch"
              :title="ch.name"
              aria-hidden="true"
            >{{ ch.icon }}</span>
            <span class="eh-freq">Häufigkeit</span>
          </div>

          <!-- Event rows -->
          <div
            v-for="evt in events"
            :key="evt.id"
            class="event-row"
          >
            <div class="evt-info">
              <div class="evt-name">{{ evt.name }}</div>
              <div class="evt-desc">{{ evt.desc }}</div>
            </div>
            <div
              v-for="ch in activeChannels"
              :key="ch.id"
              class="evt-ch-cell"
            >
              <input
                type="checkbox"
                v-model="evt.channels[ch.id]"
                class="evt-check"
                :aria-label="`${evt.name} via ${ch.name}`"
              />
            </div>
            <div class="evt-freq-cell">
              <select
                v-model="evt.frequency"
                class="g-input freq-select"
                :aria-label="`Häufigkeit für ${evt.name}`"
              >
                <option value="immediate">Sofort</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="never">Nie</option>
              </select>
            </div>
          </div>

          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save">
              {{ t('common.save') }}
            </button>
            <Transition name="fade">
              <span v-if="saved" class="saved-hint" role="status">
                ✓ {{ t('settings.dpp.saved') }}
              </span>
            </Transition>
          </div>
        </div>
      </section>

      <!-- ── Weekly digest ── -->
      <section class="settings-section" aria-labelledby="s-digest">
        <div class="section-header">
          <div>
            <h2 id="s-digest" class="section-title">Wöchentliche Zusammenfassung</h2>
            <p class="section-sub">Kompakte Übersicht aller DPP-Aktivitäten per E-Mail.</p>
          </div>
          <label class="g-toggle" aria-label="Wöchentlicher Digest aktivieren">
            <input type="checkbox" v-model="digest.active" />
            <span class="g-toggle-track" />
          </label>
        </div>
        <Transition name="expand">
          <div v-if="digest.active" class="g-card digest-options">
            <div class="form-row">
              <div class="field">
                <label for="digest-day">Versand am</label>
                <select id="digest-day" v-model="digest.day" class="g-input">
                  <option value="1">Montag</option>
                  <option value="2">Dienstag</option>
                  <option value="4">Donnerstag</option>
                  <option value="5">Freitag</option>
                </select>
              </div>
              <div class="field">
                <label for="digest-time">Uhrzeit</label>
                <input
                  id="digest-time"
                  v-model="digest.time"
                  type="time"
                  class="g-input"
                />
              </div>
            </div>
          </div>
        </Transition>
      </section>

    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
import type { NotificationChannel } from '~/stores/settings'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { t }    = useI18n()
const auth     = useAuthStore()
const settings = useSettingsStore()

onMounted(() => { settings.fetchAll() })

const channels = computed(() => settings.state.notifications.channels)
const events   = computed(() => settings.state.notifications.events)
const digest   = computed(() => settings.state.notifications.digest)
const saved    = computed(() => settings.saved.notifications)

const activeChannels = computed(() => channels.value.filter(c => c.connected))

function save() {
  return settings.save('notifications')
}

// ── Slack / Webhook verbinden ─────────────
// Beide Kanaele brauchen nur eine Ziel-URL; ein OAuth-Flow existiert
// backendseitig nicht. Die URL wird inline erfasst und mitgespeichert.

const connecting = ref<string | null>(null)
const connectUrl = ref('')

function isValidUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function startConnect(channel: NotificationChannel) {
  connecting.value = channel.id
  connectUrl.value = channel.target ?? ''
}

function cancelConnect() {
  connecting.value = null
  connectUrl.value = ''
}

async function confirmConnect(channel: NotificationChannel) {
  if (!isValidUrl(connectUrl.value)) return
  channel.target    = connectUrl.value
  channel.connected = true
  channel.active    = true
  cancelConnect()
  await save()
}

async function disconnect(channel: NotificationChannel) {
  channel.target    = ''
  channel.connected = false
  channel.active    = false
  // Ereignisse, die nur ueber diesen Kanal liefen, wuerden sonst ins Leere laufen.
  settings.state.notifications.events.forEach(e => { delete e.channels[channel.id] })
  await save()
}
</script>

<style scoped>
.settings-section { display: flex; flex-direction: column; gap: 10px; }
.section-header   { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-title    { font-size: 14px; font-weight: 600; }
.section-sub      { font-size: 12px; color: var(--color-text-2); margin-top: 3px; line-height: 1.5; }

/* Channels */
.channels-card { padding: 0; overflow: hidden; }
.channel-row   {
  display: flex; align-items: center; gap: 13px;
  padding: 13px 1.1rem; border-bottom: 1px solid var(--color-border);
}
.channel-row:last-child { border-bottom: none; }
.ch-icon  { font-size: 22px; flex-shrink: 0; }
.ch-info  { flex: 1; min-width: 0; }
.ch-name  { font-size: 13px; font-weight: 500; }
.ch-desc  { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }
.ch-target { font-size: 11px; color: var(--color-text-3); font-family: 'DM Mono', monospace; margin-top: 3px; }
.ch-connect-row { margin-top: 7px; }
.ch-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.connected-badge { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 10px; background: var(--color-ok-bg); color: var(--color-ok-dark); }

/* Events table */
.events-card    { padding: 0; overflow: hidden; }
.events-header  {
  display: flex; align-items: center;
  padding: 10px 1.1rem; border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}
.eh-label { flex: 1; font-size: 11px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; }
.eh-ch    { width: 44px; text-align: center; font-size: 14px; }
.eh-freq  { width: 120px; text-align: right; font-size: 11px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; }

.event-row {
  display: flex; align-items: center;
  padding: 10px 1.1rem; border-bottom: 1px solid var(--color-border);
  transition: background var(--t-fast);
}
.event-row:hover { background: var(--color-surface-2); }
.event-row:last-of-type { border-bottom: none; }

.evt-info  { flex: 1; min-width: 0; }
.evt-name  { font-size: 12px; font-weight: 500; }
.evt-desc  { font-size: 11px; color: var(--color-text-2); margin-top: 2px; }
.evt-ch-cell { width: 44px; display: flex; justify-content: center; flex-shrink: 0; }
.evt-check { width: 16px; height: 16px; accent-color: var(--color-brand); cursor: pointer; }
.evt-freq-cell { width: 120px; display: flex; justify-content: flex-end; flex-shrink: 0; }
.freq-select { font-size: 12px; padding: 4px 7px; width: 115px; cursor: pointer; }

.form-footer { display: flex; align-items: center; gap: 12px; padding: 12px 1.1rem; border-top: 1px solid var(--color-border); }
.saved-hint  { font-size: 12px; color: var(--color-ok); font-weight: 500; }

/* Digest */
.digest-options { padding: 1.1rem; }
.form-row { display: flex; gap: 14px; flex-wrap: wrap; }
.field    { display: flex; flex-direction: column; gap: 6px; }
label     { font-size: 12px; font-weight: 500; color: var(--color-text-1); }

.g-btn.sm { font-size: 12px; padding: 6px 12px; }

/* Transitions */
.fade-enter-active,   .fade-leave-active   { transition: opacity var(--t-fast); }
.fade-enter-from,     .fade-leave-to       { opacity: 0; }
.expand-enter-active, .expand-leave-active { transition: opacity var(--t-base), transform var(--t-base); }
.expand-enter-from,   .expand-leave-to     { opacity: 0; transform: translateY(-6px); }

/* Responsive */
@media (max-width: 640px) {
  .eh-freq, .evt-freq-cell { display: none; }
  .eh-ch, .evt-ch-cell     { width: 36px; }
}

.ch-connect-row  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.ch-url-input    { min-width: 260px; font-size: 12px; }
</style>
