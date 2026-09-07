<template>
  <div class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">Regulatorik & Compliance</h1>
        <p class="page-sub">Übersicht über alle geltenden EU-Verordnungen und deren Erfüllungsgrad</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 14v3h14v-3M10 3v10M7 10l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Compliance-Bericht
        </button>
      </div>
    </div>

    <!-- Overall score banner -->
    <div class="score-banner">
      <div class="score-circle">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#E1F5EE" stroke-width="8"/>
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke="#1D9E75" stroke-width="8"
            stroke-linecap="round"
            stroke-dasharray="213.6"
            stroke-dashoffset="12.3"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div class="score-inner">
          <span class="score-num">94</span>
          <span class="score-unit">%</span>
        </div>
      </div>
      <div class="score-info">
        <div class="score-title">Gesamt-Compliance-Score</div>
        <p class="score-desc">Ihr Unternehmen erfüllt 94 % aller relevanten EU-Anforderungen. 2 Verordnungen haben noch offene Punkte, die innerhalb der nächsten 30 Tage geschlossen werden sollten.</p>
        <div class="score-tags">
          <span class="stag stag-ok">5 Anforderungen erfüllt</span>
          <span class="stag stag-warn">2 in Bearbeitung</span>
          <span class="stag stag-crit">1 kritisch offen</span>
        </div>
      </div>
      <div class="score-deadline">
        <div class="dl-label">Nächste Frist</div>
        <div class="dl-date">27. Juni 2026</div>
        <div class="dl-what">REACH-Stoffdeklaration SM-9</div>
        <div class="dl-days">in 30 Tagen</div>
      </div>
    </div>

    <!-- Regulation cards -->
    <div class="reg-section-title">Verordnungen im Detail</div>
    <div class="reg-cards">
      <div
        v-for="reg in regulations"
        :key="reg.name"
        class="reg-card"
        :class="`reg-${reg.overall}`"
        @click="selectedReg = selectedReg === reg.name ? null : reg.name"
      >
        <div class="reg-card-top">
          <div class="reg-icon-wrap" :class="`riw-${reg.overall}`">
            <svg v-if="reg.overall === 'ok'" width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <svg v-else-if="reg.overall === 'crit'" width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 2L18 17H2L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="reg-card-info">
            <div class="reg-card-name">{{ reg.name }}</div>
            <div class="reg-card-sub">{{ reg.description }}</div>
          </div>
          <div class="reg-card-right">
            <span class="reg-badge" :class="`rb-${reg.overall}`">{{ regLabel(reg.overall) }}</span>
            <div class="reg-pct">{{ reg.pct }} %</div>
            <svg class="chevron" :class="{ open: selectedReg === reg.name }" width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <div class="reg-prog-bar">
          <div class="reg-prog-fill" :class="`rpf-${reg.overall}`" :style="{ width: reg.pct + '%' }" />
        </div>

        <!-- Expanded: per-product status -->
        <div v-if="selectedReg === reg.name" class="reg-expanded">
          <div class="re-label">Status je Produkt</div>
          <div class="re-products">
            <div
              v-for="p in productRegStatus(reg.name)"
              :key="p.sku"
              class="re-prod-row"
            >
              <span class="re-emoji">{{ p.emoji }}</span>
              <span class="re-name">{{ p.name }}</span>
              <span class="re-status" :class="`re-${p.status}`">{{ regLabel(p.status) }}</span>
            </div>
          </div>
          <div v-if="reg.deadline" class="re-deadline">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Nächste Frist: <strong>{{ reg.deadline }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Matrix: products × regulations -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Compliance-Matrix</h2>
        <p class="card-sub">Alle Produkte × alle Verordnungen</p>
      </div>
      <div class="matrix-wrap">
        <table class="matrix">
          <thead>
            <tr>
              <th class="matrix-product-col">Produkt</th>
              <th v-for="reg in regulations" :key="reg.name" class="matrix-reg-col">
                <div class="reg-th">{{ reg.shortName }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in store.products" :key="p.id" class="matrix-row">
              <td class="matrix-prod-cell">
                <span class="mp-emoji">{{ p.emoji }}</span>
                <span class="mp-name">{{ p.name }}</span>
              </td>
              <td
                v-for="reg in regulations"
                :key="reg.name"
                class="matrix-status-cell"
              >
                <div class="matrix-dot-wrap">
                  <div class="matrix-dot" :class="`md-${getProductRegStatus(p, reg.name)}`" :title="`${p.name} · ${reg.name}`" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="matrix-legend">
          <span class="ml-item"><span class="ml-dot md-ok" />Erfüllt</span>
          <span class="ml-item"><span class="ml-dot md-warn" />In Bearbeitung</span>
          <span class="ml-item"><span class="ml-dot md-crit" />Kritisch</span>
          <span class="ml-item"><span class="ml-dot md-pending" />Ausstehend</span>
          <span class="ml-item"><span class="ml-dot md-na" />Nicht relevant</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const store = useProductsStore()
const selectedReg = ref<string | null>(null)

const regulations = [
  { name: 'EU ESPR', shortName: 'ESPR', description: 'Ökodesign-Verordnung – Nachhaltigkeit & Reparierbarkeit', overall: 'warn', pct: 80, deadline: '31. Dezember 2026' },
  { name: 'EU Batterieverordnung', shortName: 'Batterie', description: 'Nachhaltigkeitsanforderungen für Batterieprodukte', overall: 'crit', pct: 48, deadline: '27. Juni 2026' },
  { name: 'REACH', shortName: 'REACH', description: 'Chemikalienregulierung – Stoffe in Erzeugnissen', overall: 'warn', pct: 74, deadline: '27. Juni 2026' },
  { name: 'RoHS', shortName: 'RoHS', description: 'Beschränkung gefährlicher Stoffe in Elektrogeräten', overall: 'ok', pct: 100, deadline: null },
  { name: 'CE-Kennzeichnung', shortName: 'CE', description: 'Konformitätserklärung für den EU-Binnenmarkt', overall: 'ok', pct: 96, deadline: null },
  { name: 'LkSG', shortName: 'LkSG', description: 'Lieferkettensorgfaltspflichtengesetz (Deutschland)', overall: 'warn', pct: 67, deadline: '1. Januar 2027' },
  { name: 'ISO 14040 LCA', shortName: 'LCA', description: 'Lebenszyklusanalyse nach ISO-Norm', overall: 'warn', pct: 60, deadline: null },
]

function regLabel(s: string) {
  return { ok: 'Erfüllt', warn: 'In Bearbeitung', crit: 'Kritisch', pending: 'Ausstehend', na: 'N/A' }[s] ?? s
}

function getProductRegStatus(product: any, regName: string) {
  const r = product.regulations?.find((r: any) => r.name === regName)
  if (!r) return 'na'
  return r.status
}

function productRegStatus(regName: string) {
  return store.products.map(p => ({
    name: p.name,
    sku: p.sku,
    emoji: p.emoji,
    status: getProductRegStatus(p, regName),
  }))
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; }
.page-title  { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
.page-sub    { font-size: 13px; color: var(--color-text-2); margin-top: 3px; }
.header-actions { display: flex; gap: 8px; }
.btn-secondary { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-1); }
.btn-secondary:hover { background: var(--color-surface-2); }

/* Score banner */
.score-banner {
  display: flex; align-items: center; gap: 24px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 14px; padding: 1.5rem;
}
.score-circle { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
.score-inner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.score-num { font-size: 22px; font-weight: 700; letter-spacing: -0.03em; }
.score-unit { font-size: 13px; color: var(--color-text-2); align-self: flex-end; margin-bottom: 4px; }
.score-info { flex: 1; }
.score-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
.score-desc  { font-size: 13px; color: var(--color-text-2); line-height: 1.6; margin-bottom: 10px; }
.score-tags  { display: flex; gap: 8px; flex-wrap: wrap; }
.stag { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; }
.stag-ok   { background: var(--color-ok-bg);   color: #085041; }
.stag-warn { background: var(--color-warn-bg);  color: #412402; }
.stag-crit { background: var(--color-crit-bg);  color: #4A1B0C; }
.score-deadline { min-width: 160px; background: var(--color-crit-bg); border: 1px solid rgba(216,90,48,0.2); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 3px; }
.dl-label { font-size: 10px; font-weight: 500; color: var(--color-crit); text-transform: uppercase; letter-spacing: 0.05em; }
.dl-date  { font-size: 16px; font-weight: 700; color: var(--color-crit); }
.dl-what  { font-size: 11px; color: var(--color-text-2); }
.dl-days  { font-size: 11px; font-weight: 600; color: var(--color-crit); }

/* Reg cards */
.reg-section-title { font-size: 12px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.05em; }
.reg-cards { display: flex; flex-direction: column; gap: 8px; }
.reg-card {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 1rem 1.1rem; cursor: pointer;
  transition: box-shadow 0.12s;
}
.reg-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.reg-ok   { border-left: 3px solid var(--color-ok); }
.reg-warn { border-left: 3px solid var(--color-warn); }
.reg-crit { border-left: 3px solid var(--color-crit); }

.reg-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.reg-icon-wrap { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.riw-ok   { background: var(--color-ok-bg);   color: var(--color-ok); }
.riw-warn { background: var(--color-warn-bg);  color: var(--color-warn); }
.riw-crit { background: var(--color-crit-bg);  color: var(--color-crit); }
.reg-card-info { flex: 1; }
.reg-card-name { font-size: 13px; font-weight: 600; }
.reg-card-sub  { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }
.reg-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.reg-badge { font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 500; }
.rb-ok   { background: var(--color-ok-bg);   color: #085041; }
.rb-warn { background: var(--color-warn-bg);  color: #412402; }
.rb-crit { background: var(--color-crit-bg);  color: #4A1B0C; }
.reg-pct { font-size: 14px; font-weight: 600; min-width: 36px; text-align: right; }
.chevron { color: var(--color-text-3); transition: transform 0.2s; }
.chevron.open { transform: rotate(180deg); }

.reg-prog-bar { height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.reg-prog-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }
.rpf-ok   { background: var(--color-ok); }
.rpf-warn { background: var(--color-warn); }
.rpf-crit { background: var(--color-crit); }

/* Expanded */
.reg-expanded { margin-top: 12px; border-top: 1px solid var(--color-border); padding-top: 12px; }
.re-label { font-size: 11px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
.re-products { display: flex; flex-direction: column; gap: 5px; }
.re-prod-row { display: flex; align-items: center; gap: 9px; padding: 6px 10px; border-radius: 7px; background: var(--color-surface-2); font-size: 13px; }
.re-emoji { font-size: 15px; }
.re-name  { flex: 1; font-weight: 500; }
.re-status { font-size: 11px; font-weight: 500; }
.re-ok      { color: var(--color-ok); }
.re-warn    { color: var(--color-warn); }
.re-crit    { color: var(--color-crit); }
.re-pending { color: var(--color-info); }
.re-na      { color: var(--color-text-3); }
.re-deadline { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-crit); margin-top: 10px; }

/* Card */
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; }
.card-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); background: var(--color-surface-2); }
.card-title  { font-size: 13px; font-weight: 600; }
.card-sub    { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }

/* Matrix */
.matrix-wrap { overflow-x: auto; }
.matrix { width: 100%; border-collapse: collapse; font-size: 13px; }
.matrix th { padding: 10px 8px; border-bottom: 1px solid var(--color-border); background: var(--color-surface-2); font-size: 11px; font-weight: 500; color: var(--color-text-3); text-align: center; }
.matrix-product-col { text-align: left !important; padding-left: 16px !important; min-width: 200px; }
.matrix-reg-col { min-width: 80px; }
.reg-th { writing-mode: horizontal-tb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.03em; }
.matrix-row td { padding: 10px 8px; border-bottom: 1px solid var(--color-border); }
.matrix-row:last-child td { border-bottom: none; }
.matrix-row:hover td { background: var(--color-surface-2); }
.matrix-prod-cell { display: flex; align-items: center; gap: 8px; padding-left: 16px !important; }
.mp-emoji { font-size: 15px; }
.mp-name  { font-size: 12px; font-weight: 500; }
.matrix-status-cell { text-align: center; }
.matrix-dot-wrap { display: flex; justify-content: center; align-items: center; }
.matrix-dot { width: 14px; height: 14px; border-radius: 50%; }
.md-ok      { background: var(--color-ok); }
.md-warn    { background: var(--color-warn); }
.md-crit    { background: var(--color-crit); }
.md-pending { background: var(--color-info); }
.md-na      { background: var(--color-border); }
.matrix-legend { display: flex; gap: 16px; padding: 10px 16px; border-top: 1px solid var(--color-border); background: var(--color-surface-2); flex-wrap: wrap; }
.ml-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-text-2); }
.ml-dot  { width: 10px; height: 10px; border-radius: 50%; }
</style>
