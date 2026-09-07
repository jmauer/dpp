<template>
  <div class="g-page">

    <!-- ── Header ── -->
    <div class="g-page-header">
      <div>
        <h1 class="g-page-title">{{ t('dashboard.greeting', { name: firstName }) }}</h1>
        <p class="g-page-sub">{{ t('dashboard.subtitle', { date: today }) }}</p>
      </div>
      <div class="header-actions">
        <button class="g-btn g-btn-secondary hide-mobile">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ t('common.export') }}
        </button>
        <button class="g-btn g-btn-primary">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="hide-xs">{{ t('dashboard.newPassport') }}</span>
          <span class="show-xs">{{ t('common.new') }}</span>
        </button>
      </div>
    </div>

    <!-- ── KPI grid ── -->
    <div class="kpi-grid g-grid-4">
      <div v-for="kpi in kpis" :key="kpi.key" class="kpi-card g-card">
        <div class="kpi-icon" :style="{ background: kpi.iconBg, color: kpi.iconColor }" aria-hidden="true">
          {{ kpi.emoji }}
        </div>
        <div class="kpi-body">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-delta" :class="kpi.pos ? 'delta-pos' : 'delta-neg'">
            {{ kpi.delta }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── Main grid ── -->
    <div class="main-grid">

      <!-- Products table -->
      <div class="g-card products-card">
        <div class="card-header">
          <h2 class="card-title">{{ t('dashboard.sections.passports') }}</h2>
          <NuxtLink to="/dashboard/products" class="card-link">
            {{ t('dashboard.sections.viewAll') }} →
          </NuxtLink>
        </div>

        <!-- Mobile: card list -->
        <div class="product-list-mobile show-mobile-flex">
          <NuxtLink
            v-for="p in products.slice(0,4)"
            :key="p.id"
            :to="`/dashboard/products/${p.id}`"
            class="product-card-mobile"
          >
            <div class="pcm-icon" :style="{ background: p.iconBg, color: p.iconColor }">
              {{ p.emoji }}
            </div>
            <div class="pcm-body">
              <div class="pcm-name">{{ p.name }}</div>
              <div class="pcm-sku">{{ p.sku }}</div>
            </div>
            <div class="pcm-right">
              <span class="g-badge" :class="`g-badge-${p.status === 'ok' ? 'ok' : p.status === 'crit' ? 'crit' : p.status === 'warn' ? 'warn' : 'neutral'}`">
                {{ t(`products.status.${p.status}`) }}
              </span>
              <div class="pcm-pct">{{ p.completeness }} %</div>
            </div>
          </NuxtLink>
        </div>

        <!-- Desktop: table -->
        <div class="g-table-wrap hide-mobile">
          <table class="product-table compact">
            <thead>
              <tr>
                <th>{{ t('products.columns.product') }}</th>
                <th>{{ t('products.columns.completeness') }}</th>
                <th>{{ t('products.columns.status') }}</th>
                <th>{{ t('products.columns.gaps') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in products"
                :key="p.id"
                class="table-row"
                @click="navigateTo(`/dashboard/products/${p.id}`)"
              >
                <td>
                  <div class="prod-cell">
                    <div class="prod-ico" :style="{ background: p.iconBg, color: p.iconColor }">
                      {{ p.emoji }}
                    </div>
                    <div>
                      <div class="prod-name">{{ p.name }}</div>
                      <div class="prod-sku">{{ p.sku }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="prog-cell">
                    <div class="prog-bar" role="progressbar" :aria-valuenow="p.completeness" aria-valuemin="0" aria-valuemax="100">
                      <div class="prog-fill" :class="`fill-${p.status}`" :style="{ width: p.completeness + '%' }" />
                    </div>
                    <span class="prog-val">{{ p.completeness }} %</span>
                  </div>
                </td>
                <td>
                  <span class="g-badge" :class="`g-badge-${p.status === 'ok' ? 'ok' : p.status === 'crit' ? 'crit' : p.status === 'warn' ? 'warn' : 'neutral'}`">
                    {{ t(`products.status.${p.status}`) }}
                  </span>
                </td>
                <td>
                  <span v-if="p.gaps.length" class="gap-pill" :class="p.status === 'crit' ? 'gap-crit' : 'gap-warn'">
                    {{ p.gaps.length }}
                  </span>
                  <span v-else class="text-muted">{{ t('common.na') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right column -->
      <div class="right-col">

        <!-- Compliance -->
        <div class="g-card">
          <div class="card-header">
            <h2 class="card-title">{{ t('dashboard.sections.regulations') }}</h2>
            <NuxtLink to="/dashboard/compliance" class="card-link">
              {{ t('dashboard.sections.details') }} →
            </NuxtLink>
          </div>
          <div class="compliance-list">
            <div
              v-for="c in complianceItems"
              :key="c.label"
              class="comp-item"
              :class="`comp-${c.type}`"
            >
              <span class="comp-dot" :class="`dot-${c.type}`" aria-hidden="true" />
              <span class="comp-label">{{ c.label }}</span>
              <span class="comp-status">{{ t(`compliance.status.${c.type}`) }}</span>
            </div>
          </div>
        </div>

        <!-- Supply chain mini -->
        <div class="g-card">
          <div class="card-header">
            <h2 class="card-title">{{ t('dashboard.sections.supplyChain') }}</h2>
            <NuxtLink to="/dashboard/supply-chain" class="card-link">→</NuxtLink>
          </div>
          <div class="chain-row" role="list">
            <div
              v-for="(step, i) in chainSteps"
              :key="step.stage"
              class="chain-step"
              role="listitem"
            >
              <div class="chain-node" :class="`node-${step.status}`" :title="t(`supplyChain.stages.${step.stage}`)">
                {{ step.emoji }}
              </div>
              <div class="chain-label">{{ t(`supplyChain.stages.${step.stage}`) }}</div>
              <svg v-if="i < chainSteps.length - 1" class="chain-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                <path d="M0 4h10M7 1l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Activity ── -->
    <div class="g-card">
      <div class="card-header">
        <h2 class="card-title">{{ t('dashboard.sections.activities') }}</h2>
      </div>
      <div class="activity-grid">
        <div
          v-for="a in activities"
          :key="a.text"
          class="act-row"
        >
          <span class="act-dot" :style="{ background: a.color }" aria-hidden="true" />
          <p class="act-text" v-html="a.text" />
          <time class="act-time">{{ a.time }}</time>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import 'dayjs/locale/de'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { t, locale } = useI18n()
const auth  = useAuthStore()
const store = useProductsStore()

// Locale-aware date
dayjs.locale(locale.value === 'de' ? 'de' : 'en')
const today     = computed(() => dayjs().format('dddd, D. MMMM YYYY'))
const firstName = computed(() => auth.user?.name.split(' ')[0] ?? '')

// Data
const products = computed(() => store.products)
const stats    = computed(() => store.stats)

// Load real data when the dashboard opens
onMounted(() => { store.fetchAll() })

const kpis = computed(() => [
  {
    key: 'passports', emoji: '📦',
    iconBg: '#E1F5EE', iconColor: '#0F6E56',
    label: t('dashboard.kpi.activePassports'),
    value: stats.value.total.toLocaleString(),
    delta: t('dashboard.kpi.thisMonth', { n: 312 }),
    pos: true,
  },
  {
    key: 'compliance', emoji: '🛡️',
    iconBg: '#E6F1FB', iconColor: '#185FA5',
    label: t('dashboard.kpi.complianceRate'),
    value: `${stats.value.complianceRate} %`,
    delta: t('dashboard.kpi.vsLastMonth', { n: 2.1 }),
    pos: true,
  },
  {
    key: 'gaps', emoji: '⚠️',
    iconBg: '#FAECE7', iconColor: '#D85A30',
    label: t('dashboard.kpi.openGaps'),
    value: stats.value.totalGaps.toLocaleString(),
    delta: t('dashboard.kpi.critical', { n: stats.value.criticalGaps }),
    pos: false,
  },
  {
    key: 'suppliers', emoji: '🏭',
    iconBg: '#F5F4F1', iconColor: '#6B6961',
    label: t('dashboard.kpi.suppliers'),
    value: '187',
    delta: t('dashboard.kpi.verified', { n: 94 }),
    pos: true,
  },
])

const complianceItems = [
  { label: 'EU ESPR',                   type: 'ok'   },
  { label: t('brand.batteryReg'),        type: 'ok'   },
  { label: 'EU Lieferkettensorgfalt',   type: 'warn' },
  { label: 'ISO 14040 LCA',             type: 'warn' },
  { label: 'REACH / RoHS',              type: 'crit' },
]

const chainSteps = [
  { stage: 'raw',           emoji: '⛏️', status: 'ok'      },
  { stage: 'preproduction', emoji: '🏭', status: 'ok'      },
  { stage: 'manufacturing', emoji: '⚙️', status: 'warn'    },
  { stage: 'logistics',     emoji: '🚛', status: 'ok'      },
  { stage: 'endoflife',     emoji: '♻️', status: 'neutral' },
]

const activities = [
  { text: '<strong>EM-400X</strong> – DPP vollständig verifiziert', time: 'vor 12 min', color: '#1D9E75' },
  { text: '<strong>LB-2200</strong> – Fehlende CO₂-Daten gemeldet', time: 'vor 1 Std',  color: '#EF9F27' },
  { text: '<strong>Lieferant 42</strong> – Zertifikat hochgeladen',  time: 'vor 3 Std',  color: '#185FA5' },
  { text: '<strong>SM-9</strong> – REACH-Daten fehlen, Frist 30 Tage', time: 'gestern', color: '#D85A30' },
  { text: '<strong>ESPR-Bericht Q2</strong> – Exportiert',           time: 'gestern',    color: '#1D9E75' },
  { text: '<strong>GT-7 Series</strong> – Neuer Pass angelegt',      time: 'vor 2 Tagen',color: '#9C9A95' },
]
</script>

<style scoped>
/* ── KPI ── */
.kpi-card { display: flex; align-items: flex-start; gap: 12px; }
.kpi-icon { width: 38px; height: 38px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.kpi-label { font-size: 11px; color: var(--color-text-2); text-transform: uppercase; letter-spacing: 0.04em; }
.kpi-value { font-size: 21px; font-weight: 700; letter-spacing: -0.02em; margin: 3px 0 2px; }
.kpi-delta { font-size: 11px; }
.delta-pos { color: var(--color-ok); }
.delta-neg { color: var(--color-crit); }

/* ── Main grid ── */
.main-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  align-items: start;
}

.right-col { display: flex; flex-direction: column; gap: 16px; }

/* ── Card shared ── */
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-title  { font-size: 13px; font-weight: 600; }
.card-link   { font-size: 12px; color: var(--color-brand); text-decoration: none; }
.card-link:hover { color: var(--color-brand-dark); }

/* ── Product table ── */
.product-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.product-table th {
  text-align: left; font-size: 11px; font-weight: 500;
  color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em;
  padding: 0 8px 8px; border-bottom: 1px solid var(--color-border);
}
.table-row td { padding: 10px 8px; border-bottom: 1px solid var(--color-border); cursor: pointer; }
.table-row:last-child td { border-bottom: none; }
.table-row:hover td { background: var(--color-surface-2); }

.prod-cell { display: flex; align-items: center; gap: 9px; }
.prod-ico  { width: 30px; height: 30px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.prod-name { font-size: 13px; font-weight: 500; }
.prod-sku  { font-size: 11px; color: var(--color-text-3); font-family: 'DM Mono', monospace; margin-top: 1px; }

.prog-cell { display: flex; align-items: center; gap: 7px; }
.prog-bar  { flex: 1; max-width: 80px; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 2px; transition: width var(--t-slow); }
.fill-ok      { background: var(--color-ok); }
.fill-crit    { background: var(--color-crit); }
.fill-warn    { background: var(--color-warn); }
.fill-draft   { background: var(--color-text-3); }
.prog-val  { font-size: 12px; color: var(--color-text-2); white-space: nowrap; min-width: 32px; }

.gap-pill { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.gap-crit { background: var(--color-crit-bg); color: var(--color-crit); }
.gap-warn { background: var(--color-warn-bg); color: var(--color-warn); }
.text-muted { color: var(--color-text-3); font-size: 12px; }

/* ── Mobile product cards ── */
.product-list-mobile { display: flex; flex-direction: column; gap: 8px; }
.show-mobile-flex { display: none; }
.product-card-mobile {
  display: flex; align-items: center; gap: 10px;
  padding: 10px; border-radius: var(--radius-md);
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  text-decoration: none; color: inherit;
}
.product-card-mobile:hover { background: var(--color-surface-3); }
.pcm-icon  { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.pcm-body  { flex: 1; min-width: 0; }
.pcm-name  { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pcm-sku   { font-size: 11px; color: var(--color-text-3); font-family: 'DM Mono', monospace; margin-top: 1px; }
.pcm-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.pcm-pct   { font-size: 11px; color: var(--color-text-2); }

/* ── Compliance ── */
.compliance-list { display: flex; flex-direction: column; gap: 6px; }
.comp-item { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: var(--radius-md); font-size: 13px; }
.comp-ok   { background: var(--color-ok-bg); }
.comp-warn { background: var(--color-warn-bg); }
.comp-crit { background: var(--color-crit-bg); }
.comp-info { background: var(--color-info-bg); }
.comp-dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-ok    { background: var(--color-ok); }
.dot-warn  { background: var(--color-warn); }
.dot-crit  { background: var(--color-crit); }
.dot-info  { background: var(--color-info); }
.comp-label  { flex: 1; font-size: 12px; font-weight: 500; }
.comp-status { font-size: 11px; color: var(--color-text-2); }

/* ── Supply chain ── */
.chain-row { display: flex; align-items: flex-start; justify-content: space-between; padding-top: 4px; gap: 2px; }
.chain-step { display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; flex: 1; }
.chain-node { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.node-ok      { background: var(--color-ok-bg); }
.node-warn    { background: var(--color-warn-bg); }
.node-neutral { background: var(--color-surface-2); }
.chain-label  { font-size: 9px; color: var(--color-text-3); text-align: center; max-width: 48px; line-height: 1.3; }
.chain-arrow  { position: absolute; right: -6px; top: 13px; color: var(--color-text-3); }

/* ── Activity ── */
.activity-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 2rem; }
.act-row  { display: flex; align-items: flex-start; gap: 9px; padding: 6px 0; }
.act-dot  { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.act-text { font-size: 12px; color: var(--color-text-2); flex: 1; line-height: 1.5; margin: 0; }
.act-text :deep(strong) { color: var(--color-text-1); font-weight: 500; }
.act-time { font-size: 11px; color: var(--color-text-3); white-space: nowrap; flex-shrink: 0; }

/* ── Header actions ── */
.header-actions { display: flex; align-items: center; gap: 8px; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .main-grid { grid-template-columns: 1fr; }
  .right-col { display: grid; grid-template-columns: 1fr 1fr; }
}

@media (max-width: 767px) {
  .show-mobile-flex { display: flex; }
  .activity-grid    { grid-template-columns: 1fr; }
  .right-col        { display: flex; flex-direction: column; }
  .kpi-grid { gap: 8px; }
}

@media (max-width: 480px) {
  .kpi-card { flex-direction: column; gap: 8px; }
  .chain-label { display: none; }
}

.show-xs { display: none; }
.hide-xs  { display: inline; }
@media (max-width: 400px) {
  .show-xs { display: inline; }
  .hide-xs  { display: none; }
}
</style>
