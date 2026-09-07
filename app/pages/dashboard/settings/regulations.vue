<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">{{ t('settings.nav.regulations') }}</h1>
          <p class="g-page-sub">Aktive EU-Verordnungen und Fristen für Ihr Unternehmen konfigurieren</p>
        </div>
      </div>

      <!-- ── Active regulations ── -->
      <section class="settings-section" aria-labelledby="s-regs">
        <div class="section-header">
          <h2 id="s-regs" class="section-title">Aktive Verordnungen</h2>
        </div>
        <div class="g-card reg-card">
          <div class="reg-rows">
            <div v-for="reg in regulations" :key="reg.id" class="reg-row">
              <div class="reg-row-left">
                <span class="reg-flag" :aria-label="reg.isEu ? 'EU' : 'National'" aria-hidden="true">
                  {{ reg.isEu ? '🇪🇺' : '🇩🇪' }}
                </span>
                <div class="reg-info">
                  <div class="reg-name">{{ reg.name }}</div>
                  <div class="reg-desc">{{ reg.description }}</div>
                  <div class="reg-meta">
                    <span
                      v-if="reg.deadline"
                      class="reg-deadline"
                      :class="daysUntil(reg.deadline) <= 30 ? 'deadline-crit' : 'deadline-normal'"
                    >
                      📅 {{ formatDate(reg.deadline) }}
                      <span v-if="daysUntil(reg.deadline) <= 30">({{ t('common.daysLeft', { n: daysUntil(reg.deadline) }) }})</span>
                    </span>
                    <a :href="reg.link" target="_blank" rel="noopener" class="reg-link">Offizieller Text ↗</a>
                  </div>
                </div>
              </div>
              <div class="reg-row-right">
                <span class="g-badge" :class="statusBadge(reg.status)">{{ t(`compliance.status.${reg.status}`) }}</span>
                <label class="g-toggle" :aria-label="`${reg.name} ${reg.active ? 'deaktivieren' : 'aktivieren'}`">
                  <input type="checkbox" v-model="reg.active" />
                  <span class="g-toggle-track" />
                </label>
              </div>
            </div>
          </div>
          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save('regs')">{{ t('common.save') }}</button>
            <Transition name="fade"><span v-if="saved.regs" class="saved-hint" role="status">✓ {{ t('settings.dpp.saved') }}</span></Transition>
          </div>
        </div>
      </section>

      <!-- ── Deadline management ── -->
      <section class="settings-section" aria-labelledby="s-dl">
        <div class="section-header">
          <h2 id="s-dl" class="section-title">Fristenmanagement</h2>
          <p class="section-sub-inline">Vorlaufzeit für Benachrichtigungen</p>
        </div>
        <div class="g-card">
          <div class="deadline-list">
            <div v-for="d in deadlineSettings" :key="d.key" class="deadline-row">
              <div class="dl-info">
                <div class="dl-label">{{ d.label }}</div>
                <div class="dl-desc">{{ d.desc }}</div>
              </div>
              <div class="dl-input-wrap">
                <input
                  v-model.number="d.days"
                  type="number" min="1" max="365"
                  class="g-input num-input"
                  :aria-label="`${d.label}: Tage`"
                />
                <span class="dl-suffix">Tage vorher</span>
              </div>
            </div>
          </div>
          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save('deadlines')">{{ t('common.save') }}</button>
            <Transition name="fade"><span v-if="saved.deadlines" class="saved-hint" role="status">✓ {{ t('settings.dpp.saved') }}</span></Transition>
          </div>
        </div>
      </section>

      <!-- ── Upcoming deadlines ── -->
      <section class="settings-section" aria-labelledby="s-upcoming">
        <div class="section-header">
          <h2 id="s-upcoming" class="section-title">Anstehende Fristen</h2>
          <p class="section-sub-inline">Nächste 90 Tage</p>
        </div>
        <div class="g-card deadlines-card">
          <div v-if="upcomingDeadlines.length === 0" class="empty-state">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Keine Fristen in den nächsten 90 Tagen
          </div>
          <div v-for="d in upcomingDeadlines" :key="d.id" class="upcoming-row" :class="d.daysLeft <= 14 ? 'row-crit' : d.daysLeft <= 30 ? 'row-warn' : ''">
            <div class="severity-bar" :class="d.daysLeft <= 14 ? 'sev-crit' : d.daysLeft <= 30 ? 'sev-warn' : 'sev-ok'" aria-hidden="true"/>
            <div class="upcoming-info">
              <div class="upcoming-title">{{ d.label }}</div>
              <div class="upcoming-meta">{{ d.product }} · {{ d.regulation }}</div>
            </div>
            <div class="upcoming-date">
              <div class="date-val">{{ formatDate(d.date) }}</div>
              <div class="date-days" :class="d.daysLeft <= 14 ? 'days-crit' : 'days-muted'">
                {{ t('common.daysLeft', { n: d.daysLeft }) }}
              </div>
            </div>
            <NuxtLink :to="`/dashboard/products/${d.productId}`" class="g-btn g-btn-secondary sm">→</NuxtLink>
          </div>
        </div>
      </section>

    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
const { t } = useI18n()
const store  = useProductsStore()
const saved  = reactive<Record<string, boolean>>({})

async function save(key: string) {
  await new Promise(r => setTimeout(r, 500))
  saved[key] = true
  setTimeout(() => { saved[key] = false }, 3000)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}
function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}
function statusBadge(s: string) {
  return { 'g-badge-ok': s==='ok', 'g-badge-crit': s==='crit', 'g-badge-warn': s==='warn', 'g-badge-neutral': s==='inactive' || s==='pending' }
}

const regulations = reactive([
  { id: 'espr',    name: 'EU ESPR',                    description: 'Ökodesign-Verordnung für nachhaltige Produkte',                  isEu: true,  active: true,  status: 'warn', deadline: '2026-12-31', link: 'https://ec.europa.eu/environment/ecodesign' },
  { id: 'battery', name: 'EU Batterieverordnung',      description: 'Nachhaltigkeits- und Sicherheitsanforderungen für Batterien',    isEu: true,  active: true,  status: 'crit', deadline: '2026-06-11', link: 'https://environment.ec.europa.eu/topics/waste-and-recycling/batteries_en' },
  { id: 'reach',   name: 'REACH',                      description: 'Registrierung, Bewertung und Zulassung chemischer Stoffe',        isEu: true,  active: true,  status: 'warn', deadline: '2026-06-27', link: 'https://echa.europa.eu/regulations/reach/understanding-reach' },
  { id: 'rohs',    name: 'RoHS',                       description: 'Beschränkung gefährlicher Stoffe in Elektro- und Elektronikgeräten', isEu: true, active: true, status: 'ok',   deadline: null,         link: 'https://ec.europa.eu/environment/topics/waste-and-recycling/rohs-directive_en' },
  { id: 'ce',      name: 'CE-Kennzeichnung',           description: 'Konformitätskennzeichnung für den EU-Binnenmarkt',               isEu: true,  active: true,  status: 'ok',   deadline: null,         link: 'https://ec.europa.eu/growth/single-market/ce-marking_en' },
  { id: 'lksg',    name: 'LkSG',                       description: 'Lieferkettensorgfaltspflichtengesetz (Deutschland)',              isEu: false, active: true,  status: 'warn', deadline: '2027-01-01', link: 'https://www.bafa.de/DE/Lieferketten/lieferketten_node.html' },
  { id: 'lca',     name: 'ISO 14040 – LCA',            description: 'Lebenszyklusanalyse nach ISO-Norm',                              isEu: false, active: true,  status: 'warn', deadline: null,         link: 'https://www.iso.org/standard/37456.html' },
  { id: 'iso9001', name: 'ISO 9001 Qualitätsmanagement',description: 'Qualitätsmanagementsystem-Zertifizierung',                     isEu: false, active: false, status: 'inactive', deadline: null,      link: 'https://www.iso.org/standard/62085.html' },
])

const deadlineSettings = reactive([
  { key: 'critical', label: 'Kritische Warnung',  desc: 'E-Mail + Dashboard-Alert',                    days: 14 },
  { key: 'warning',  label: 'Frühe Warnung',       desc: 'Dashboard-Hinweis',                           days: 30 },
  { key: 'reminder', label: 'Erinnerung',          desc: 'Wöchentliche Erinnerungs-E-Mail ab dieser Vorlaufzeit', days: 60 },
])

const upcomingDeadlines = computed(() =>
  store.allOpenGaps
    .filter(g => g.deadline && daysUntil(g.deadline) <= 90 && daysUntil(g.deadline) > 0)
    .map(g => ({
      id:         g.id,
      label:      g.label,
      product:    g.productName,
      productId:  g.productId,
      regulation: g.regulation ?? '—',
      date:       g.deadline!,
      daysLeft:   daysUntil(g.deadline!),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
)
</script>

<style scoped>
.settings-section { display: flex; flex-direction: column; gap: 10px; }
.section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-title  { font-size: 14px; font-weight: 600; }
.section-sub-inline { font-size: 12px; color: var(--color-text-2); margin-top: 3px; }

.reg-card { padding: 0; overflow: hidden; }
.reg-rows { display: flex; flex-direction: column; }
.reg-row  { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; padding: 13px 1.1rem; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; }
.reg-row:last-child { border-bottom: none; }
.reg-row-left  { display: flex; align-items: flex-start; gap: 11px; flex: 1; min-width: 0; }
.reg-flag { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
.reg-name { font-size: 13px; font-weight: 600; }
.reg-desc { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }
.reg-meta { display: flex; align-items: center; gap: 12px; margin-top: 5px; flex-wrap: wrap; }
.reg-deadline { font-size: 11px; font-weight: 500; }
.deadline-crit   { color: var(--color-crit); }
.deadline-normal { color: var(--color-text-2); }
.reg-link { font-size: 11px; color: var(--color-brand); text-decoration: none; }
.reg-link:hover { color: var(--color-brand-dark); }
.reg-row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.deadline-list { display: flex; flex-direction: column; gap: 10px; }
.deadline-row  { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-surface-2); border: 1px solid var(--color-border); flex-wrap: wrap; }
.dl-info  { flex: 1; }
.dl-label { font-size: 13px; font-weight: 500; }
.dl-desc  { font-size: 11px; color: var(--color-text-2); margin-top: 2px; }
.dl-input-wrap { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.num-input  { width: 64px !important; text-align: center; padding: 6px 8px; }
.dl-suffix  { font-size: 12px; color: var(--color-text-2); white-space: nowrap; }

.deadlines-card { padding: 0; overflow: hidden; }
.empty-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 2.5rem; font-size: 13px; color: var(--color-ok); }
.upcoming-row { display: flex; align-items: center; gap: 12px; padding: 11px 1.1rem; border-bottom: 1px solid var(--color-border); transition: background var(--t-fast); }
.upcoming-row:last-child { border-bottom: none; }
.row-crit { background: color-mix(in srgb, var(--color-crit) 5%, transparent); }
.row-warn { background: color-mix(in srgb, var(--color-warn) 5%, transparent); }
.severity-bar { width: 4px; height: 36px; border-radius: 2px; flex-shrink: 0; }
.sev-crit { background: var(--color-crit); }
.sev-warn { background: var(--color-warn); }
.sev-ok   { background: var(--color-ok); }
.upcoming-info { flex: 1; min-width: 0; }
.upcoming-title { font-size: 13px; font-weight: 500; }
.upcoming-meta  { font-size: 11px; color: var(--color-text-3); margin-top: 2px; }
.upcoming-date  { text-align: right; flex-shrink: 0; }
.date-val  { font-size: 12px; font-weight: 500; }
.date-days { font-size: 11px; margin-top: 2px; }
.days-crit { color: var(--color-crit); font-weight: 600; }
.days-muted { color: var(--color-text-3); }

.form-footer { display: flex; align-items: center; gap: 12px; padding: 14px 1.1rem; border-top: 1px solid var(--color-border); }
.saved-hint  { font-size: 12px; color: var(--color-ok); font-weight: 500; }
.g-btn.sm    { font-size: 12px; padding: 6px 12px; }

.fade-enter-active, .fade-leave-active { transition: opacity var(--t-fast); }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
