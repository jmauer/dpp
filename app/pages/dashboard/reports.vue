<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Berichte</h1>
        <p class="page-sub">Exportierbare Compliance- und DPP-Berichte für Behörden, Kunden und interne Audits</p>
      </div>
    </div>

    <!-- Quick export -->
    <div ref="quickExportsEl" class="quick-exports">
      <div
        v-for="r in quickReports"
        :key="r.title"
        class="quick-card"
        :class="`qc-${r.color}`"
      >
        <div class="qc-icon">{{ r.icon }}</div>
        <div class="qc-body">
          <div class="qc-title">{{ r.title }}</div>
          <div class="qc-sub">{{ r.sub() }}</div>
        </div>
        <button class="qc-btn" :disabled="busy === r.key" @click="runReport(r)">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 14v3h14v-3M10 3v10M7 10l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ r.format }}
        </button>
      </div>
    </div>

    <div class="two-col">

      <!-- Report history -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Berichtsverlauf</h2>
          <button class="btn-secondary sm" @click="scrollToQuickExports">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v6M7 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Neuer Bericht
          </button>
        </div>
        <div class="report-list">
          <div v-if="!reportHistory.length" class="rep-empty">
            Noch kein Bericht erzeugt. Wählen Sie oben einen Bericht aus.
          </div>
          <div
            v-for="rep in reportHistory"
            :key="rep.id"
            class="report-row"
          >
            <div class="rep-icon" :class="`ri-${rep.type}`">{{ rep.icon }}</div>
            <div class="rep-body">
              <div class="rep-name">{{ rep.name }}</div>
              <div class="rep-meta">{{ rep.date }} · {{ rep.format }} · {{ rep.size }}</div>
            </div>
            <span class="rep-status" :class="`rs-${rep.status}`">
              <span class="rs-dot" />{{ repStatusLabel(rep.status) }}
            </span>
            <button
              class="rep-dl"
              :disabled="!rep.payload"
              :title="rep.payload ? 'Herunterladen' : 'Nur in der Sitzung erzeugte Berichte lassen sich erneut laden'"
              @click="downloadReport(rep)"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 14v3h14v-3M10 3v10M7 10l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Scheduled reports -->
      <div class="right-col">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Geplante Berichte</h2>
          </div>
          <div class="sched-list">
            <div v-for="s in scheduled" :key="s.name" class="sched-row">
              <div class="sched-left">
                <div class="sched-icon">{{ s.icon }}</div>
                <div>
                  <div class="sched-name">{{ s.name }}</div>
                  <div class="sched-freq">{{ s.frequency }}</div>
                </div>
              </div>
              <div class="sched-right">
                <div class="sched-next">{{ s.next }}</div>
                <label class="toggle">
                  <input type="checkbox" v-model="s.active" />
                  <span class="toggle-track" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="card stat-card">
          <div class="card-header"><h2 class="card-title">Berichts-Statistik</h2></div>
          <div class="stat-grid">
            <div class="stat-item">
              <div class="stat-val">{{ reportStats.generated }}</div>
              <div class="stat-label">Berichte erstellt</div>
            </div>
            <div class="stat-item">
              <div class="stat-val">{{ reportStats.thisMonth }}</div>
              <div class="stat-label">Heute</div>
            </div>
            <div class="stat-item">
              <div class="stat-val">{{ reportStats.products }}</div>
              <div class="stat-label">Erfasste Produkte</div>
            </div>
            <div class="stat-item">
              <div class="stat-val">{{ reportStats.volume }}</div>
              <div class="stat-label">Erzeugtes Volumen</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export toast -->
    <Teleport to="body">
      <div v-if="exportToast" class="toast">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        „{{ exportToast }}" wurde heruntergeladen.
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { downloadFile, exportJson, toCsv, dateStamp, safeFilename, type CsvColumn } from '~/utils/export'
import type { Product } from '~/stores/products'

definePageMeta({ layout: 'default', middleware: 'auth' })

const store    = useProductsStore()
const settings = useSettingsStore()

onMounted(() => {
  store.fetchAll()
  settings.fetchAll()
})

const exportToast   = ref<string | null>(null)
const busy          = ref<string | null>(null)
const quickExportsEl = ref<HTMLElement | null>(null)

function toast(title: string) {
  exportToast.value = title
  setTimeout(() => { if (exportToast.value === title) exportToast.value = null }, 3000)
}

function scrollToQuickExports() {
  quickExportsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function repStatusLabel(s: string) {
  return { done: 'Fertig', pending: 'In Erstellung', failed: 'Fehler' }[s] ?? s
}

const openGaps = (p: Product) => p.gaps.filter(g => !g.resolvedAt)

// ─────────────────────────────────────────────
// Berichtsdefinitionen
//
// Jeder Bericht liefert seinen fertigen Inhalt zurueck. Damit landet er
// sowohl im Download als auch im Verlauf – von dort laesst er sich erneut
// laden, ohne ihn neu berechnen zu muessen.
// ─────────────────────────────────────────────

interface ReportOutput {
  content:  string
  mime:     string
  filename: string
}

function csvReport(basename: string, rows: any[], columns: CsvColumn<any>[]): ReportOutput {
  return {
    content:  toCsv(rows, columns),
    mime:     'text/csv;charset=utf-8',
    filename: `${safeFilename(basename)}-${dateStamp()}.csv`,
  }
}

const quickReports = [
  {
    key: 'espr', title: 'EU ESPR Compliance-Bericht', icon: '🛡️', color: 'green', format: 'CSV', type: 'green',
    sub: () => `${store.products.length} Produkte · Stand heute`,
    build: (): ReportOutput => csvReport('ESPR-Compliance', store.products, [
      { header: 'SKU',                 value: (p: Product) => p.sku },
      { header: 'Produkt',             value: (p: Product) => p.name },
      { header: 'Status',              value: (p: Product) => p.statusLabel },
      { header: 'Vollständigkeit (%)', value: (p: Product) => p.completeness },
      { header: 'Offene Lücken',       value: (p: Product) => openGaps(p).length },
      { header: 'ESPR-Status',         value: (p: Product) => p.regulations.find(r => /ESPR/i.test(r.name))?.status ?? 'n/a' },
      { header: 'Reparierbarkeit',     value: (p: Product) => p.repairabilityIndex || '' },
      { header: 'Recyclingquote',      value: (p: Product) => p.recyclingRate },
      { header: 'CO2 gesamt',          value: (p: Product) => p.co2Total },
    ]),
  },
  {
    key: 'full', title: 'DPP-Gesamtexport', icon: '📦', color: 'blue', format: 'JSON', type: 'blue',
    sub: () => `${store.products.length} Produkte · maschinenlesbar`,
    build: (): ReportOutput => ({
      content: JSON.stringify({
        exportedAt: new Date().toISOString(),
        schema:     'passport-dpp/v1',
        count:      store.products.length,
        products:   store.products,
      }, null, 2),
      mime:     'application/json;charset=utf-8',
      filename: `DPP-Gesamtexport-${dateStamp()}.json`,
    }),
  },
  {
    key: 'co2', title: 'CO₂-Bilanz Bericht', icon: '🌱', color: 'teal', format: 'CSV', type: 'teal',
    sub: () => 'Emissionen je Lieferkettenstufe',
    build: (): ReportOutput => csvReport('CO2-Bilanz',
      store.products.flatMap(p => p.supplyChain.map(step => ({ p, step }))),
      [
        { header: 'SKU',       value: (r: any) => r.p.sku },
        { header: 'Produkt',   value: (r: any) => r.p.name },
        { header: 'Stufe',     value: (r: any) => r.step.label },
        { header: 'Lieferant', value: (r: any) => r.step.supplier ?? '' },
        { header: 'Land',      value: (r: any) => r.step.country ?? '' },
        { header: 'CO2',       value: (r: any) => r.step.co2 ?? '' },
        { header: 'CO2 Produkt gesamt', value: (r: any) => r.p.co2Total },
      ]),
  },
  {
    key: 'audit', title: 'Lieferanten-Audit', icon: '🔗', color: 'amber', format: 'CSV', type: 'amber',
    sub: () => 'LkSG-konform · alle Stufen',
    build: (): ReportOutput => csvReport('Lieferanten-Audit',
      store.products.flatMap(p => p.supplyChain.map(step => ({ p, step }))),
      [
        { header: 'Lieferant',        value: (r: any) => r.step.supplier ?? '—' },
        { header: 'Stufe',            value: (r: any) => r.step.label },
        { header: 'Land',             value: (r: any) => r.step.country ?? '' },
        { header: 'Produkt',          value: (r: any) => r.p.name },
        { header: 'SKU',              value: (r: any) => r.p.sku },
        { header: 'Status',           value: (r: any) => r.step.status },
        { header: 'Zertifiziert bis', value: (r: any) => r.step.certifiedUntil ?? '' },
      ]),
  },
]

// ─────────────────────────────────────────────
// Verlauf
// ─────────────────────────────────────────────

interface HistoryEntry {
  id:       string
  name:     string
  date:     string
  format:   string
  size:     string
  type:     string
  icon:     string
  status:   'done' | 'pending' | 'failed'
  /** Nur in dieser Sitzung erzeugte Berichte lassen sich erneut laden. */
  payload?: ReportOutput
}

const reportHistory = ref<HistoryEntry[]>([])

function formatSize(content: string): string {
  const kb = new Blob([content]).size / 1024
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

async function runReport(report: typeof quickReports[number]) {
  busy.value = report.key
  try {
    const output = report.build()
    downloadFile(output.filename, output.content, output.mime)

    reportHistory.value.unshift({
      id:      `${report.key}-${Date.now()}`,
      name:    report.title,
      date:    new Date().toLocaleDateString('de-DE'),
      format:  report.format,
      size:    formatSize(output.content),
      type:    report.type,
      icon:    report.icon,
      status:  'done',
      payload: output,
    })
    toast(report.title)
  } catch (e) {
    console.error('[Reports] runReport:', e)
    reportHistory.value.unshift({
      id:     `${report.key}-${Date.now()}`,
      name:   report.title,
      date:   new Date().toLocaleDateString('de-DE'),
      format: report.format,
      size:   '—',
      type:   report.type,
      icon:   report.icon,
      status: 'failed',
    })
  } finally {
    busy.value = null
  }
}

function downloadReport(rep: HistoryEntry) {
  if (!rep.payload) return
  downloadFile(rep.payload.filename, rep.payload.content, rep.payload.mime)
  toast(rep.name)
}

// ─────────────────────────────────────────────
// Geplante Berichte
// ─────────────────────────────────────────────

const fmtDay = (d: Date) => d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long' })

/** Naechster Monatstag `day`, ab morgen gerechnet. */
function nextMonthly(day: number): string {
  const now  = new Date()
  const next = new Date(now.getFullYear(), now.getMonth(), day)
  if (next <= now) next.setMonth(next.getMonth() + 1)
  return fmtDay(next)
}

/** Naechster Wochentag (0 = Sonntag, 1 = Montag …). */
function nextWeekday(weekday: number): string {
  const next = new Date()
  const diff = (weekday - next.getDay() + 7) % 7 || 7
  next.setDate(next.getDate() + diff)
  return fmtDay(next)
}

/** Erster Tag des naechsten Quartals. */
function nextQuarter(): string {
  const now = new Date()
  const q   = Math.floor(now.getMonth() / 3) + 1
  return fmtDay(new Date(now.getFullYear() + (q > 3 ? 1 : 0), (q % 4) * 3, 1))
}

const scheduled = ref([
  { name: 'Monatlicher Compliance-Check',      icon: '🛡️', frequency: 'Monatlich, 1. des Monats',  next: nextMonthly(1),  active: true  },
  { name: 'Wöchentliche DPP-Zusammenfassung',  icon: '📦', frequency: 'Jede Woche Montag',          next: nextWeekday(1),  active: true  },
  { name: 'Quartals CO₂-Bericht',              icon: '🌱', frequency: 'Quartalsweise',              next: nextQuarter(),   active: true  },
  { name: 'Lieferanten-Statusbericht',         icon: '🔗', frequency: 'Monatlich, 15. des Monats', next: nextMonthly(15), active: false },
])

// ─────────────────────────────────────────────
// Statistik – aus den echten Daten statt fest verdrahtet
// ─────────────────────────────────────────────

const reportStats = computed(() => {
  const thisMonth = new Date().toLocaleDateString('de-DE')
  const totalBytes = reportHistory.value.reduce(
    (sum, r) => sum + (r.payload ? new Blob([r.payload.content]).size : 0), 0,
  )
  return {
    generated:  reportHistory.value.length,
    thisMonth:  reportHistory.value.filter(r => r.date === thisMonth).length,
    products:   store.products.length,
    volume:     totalBytes < 1024 * 1024
      ? `${(totalBytes / 1024).toFixed(1)} KB`
      : `${(totalBytes / 1024 / 1024).toFixed(1)} MB`,
  }
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-title { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
.page-sub   { font-size: 13px; color: var(--color-text-2); margin-top: 3px; }

/* Quick exports */
.quick-exports { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
.quick-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 10px;
  transition: box-shadow 0.12s;
}
.quick-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
.qc-green { border-top: 3px solid var(--color-ok); }
.qc-blue  { border-top: 3px solid var(--color-info); }
.qc-teal  { border-top: 3px solid #14B8A6; }
.qc-amber { border-top: 3px solid var(--color-warn); }
.qc-icon  { font-size: 24px; }
.qc-title { font-size: 13px; font-weight: 600; }
.qc-sub   { font-size: 11px; color: var(--color-text-2); margin-top: 3px; }
.qc-body  { flex: 1; }
.qc-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 7px 12px; border-radius: 8px; font-size: 12px; font-weight: 500;
  font-family: 'DM Sans', sans-serif; cursor: pointer;
  background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text-1);
}
.qc-btn:hover { background: var(--color-brand); color: white; border-color: var(--color-brand); }

/* Layout */
.two-col { display: grid; grid-template-columns: 1fr 340px; gap: 16px; align-items: start; }
.right-col { display: flex; flex-direction: column; gap: 16px; }

/* Card */
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--color-border); background: var(--color-surface-2); }
.card-title  { font-size: 13px; font-weight: 600; }
.btn-secondary { display: flex; align-items: center; gap: 5px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-1); cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 7px; }
.btn-secondary.sm { font-size: 12px; padding: 5px 10px; }
.btn-secondary:hover { background: var(--color-surface-2); }

/* Report list */
.report-list { display: flex; flex-direction: column; }
.report-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 1.1rem; border-bottom: 1px solid var(--color-border);
}
.report-row:last-child { border-bottom: none; }
.report-row:hover { background: var(--color-surface-2); }
.rep-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.ri-green { background: var(--color-ok-bg); }
.ri-blue  { background: var(--color-info-bg); }
.ri-teal  { background: #CCFBF1; }
.ri-amber { background: var(--color-warn-bg); }
.ri-crit  { background: var(--color-crit-bg); }
.rep-body { flex: 1; }
.rep-name { font-size: 13px; font-weight: 500; }
.rep-meta { font-size: 11px; color: var(--color-text-3); margin-top: 2px; }
.rep-status { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.rs-done    { color: var(--color-ok); }
.rs-pending { color: var(--color-warn); }
.rs-failed  { color: var(--color-crit); }
.rs-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.rep-dl {
  width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text-2);
  display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
}
.rep-dl:hover { background: var(--color-brand); color: white; border-color: var(--color-brand); }

/* Scheduled */
.sched-list { display: flex; flex-direction: column; }
.sched-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 1.1rem; border-bottom: 1px solid var(--color-border);
}
.sched-row:last-child { border-bottom: none; }
.sched-left { display: flex; align-items: center; gap: 10px; }
.sched-icon { font-size: 18px; }
.sched-name { font-size: 12px; font-weight: 500; }
.sched-freq { font-size: 11px; color: var(--color-text-3); margin-top: 1px; }
.sched-right { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.sched-next { font-size: 11px; color: var(--color-text-2); }

/* Toggle */
.toggle { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
.toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track {
  width: 32px; height: 18px; background: var(--color-border-strong);
  border-radius: 9px; transition: background 0.2s; display: block;
}
.toggle input:checked + .toggle-track { background: var(--color-brand); }
.toggle-track::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 12px; height: 12px; border-radius: 50%; background: white;
  transition: transform 0.2s;
}
.toggle input:checked ~ .toggle-track::after { transform: translateX(14px); }

/* Stats */
.stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
.stat-item { padding: 14px 1.1rem; border-right: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.stat-item:nth-child(2n) { border-right: none; }
.stat-item:nth-child(3), .stat-item:nth-child(4) { border-bottom: none; }
.stat-val   { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
.stat-label { font-size: 11px; color: var(--color-text-2); }

/* Toast */
.toast {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  background: var(--color-text-1); color: white;
  padding: 10px 16px; border-radius: 10px;
  font-size: 13px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  animation: slide-in 0.2s ease;
}
@keyframes slide-in {
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.rep-empty { font-size: 12px; color: var(--color-text-3); padding: 18px 2px; }
.qc-btn:disabled, .rep-dl:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
