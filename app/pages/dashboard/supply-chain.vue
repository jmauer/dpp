<template>
  <div class="g-page">

    <!-- ── Header ── -->
    <div class="g-page-header">
      <div>
        <h1 class="g-page-title">{{ t('supplyChain.title') }}</h1>
        <p class="g-page-sub">
          {{ t('supplyChain.subtitle', { products: store.products.length, suppliers: totalSuppliers }) }}
        </p>
      </div>
      <div class="header-actions">
        <button class="g-btn g-btn-secondary hide-mobile">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ t('common.export') }}
        </button>
        <button class="g-btn g-btn-primary hide-mobile">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ t('supplyChain.addSupplier') }}
        </button>
      </div>
    </div>

    <!-- ── KPIs ── -->
    <div class="kpi-grid g-grid-4">
      <div class="g-card kpi-card">
        <div class="kpi-icon" style="background:var(--color-ok-bg);color:var(--color-ok-dark)">🏭</div>
        <div class="kpi-body">
          <div class="kpi-label">{{ t('supplyChain.kpi.totalSuppliers') }}</div>
          <div class="kpi-value">{{ totalSuppliers }}</div>
          <div class="kpi-delta delta-pos">{{ t('supplyChain.kpi.euShare', { n: 68 }) }}</div>
        </div>
      </div>
      <div class="g-card kpi-card">
        <div class="kpi-icon" style="background:var(--color-warn-bg);color:var(--color-warn-dark)">⚠️</div>
        <div class="kpi-body">
          <div class="kpi-label">{{ t('supplyChain.kpi.supplyGaps') }}</div>
          <div class="kpi-value">{{ supplyGapsCount }}</div>
          <div class="kpi-delta delta-neg">{{ t('supplyChain.kpi.critical', { n: criticalSupplyGaps }) }}</div>
        </div>
      </div>
      <div class="g-card kpi-card">
        <div class="kpi-icon" style="background:var(--color-info-bg);color:var(--color-info-dark)">🌍</div>
        <div class="kpi-body">
          <div class="kpi-label">{{ t('supplyChain.kpi.countries') }}</div>
          <div class="kpi-value">{{ uniqueCountries }}</div>
          <div class="kpi-delta delta-pos">EU-Anteil 68 %</div>
        </div>
      </div>
      <div class="g-card kpi-card">
        <div class="kpi-icon" style="background:var(--color-ok-bg);color:var(--color-ok-dark)">🌱</div>
        <div class="kpi-body">
          <div class="kpi-label">{{ t('supplyChain.kpi.avgCo2') }}</div>
          <div class="kpi-value">163 kg</div>
          <div class="kpi-delta delta-pos">−12 % vs. Vorjahr</div>
        </div>
      </div>
    </div>

    <!-- ── Product selector — scalable ── -->
    <div class="g-card selector-card">
      <div class="selector-header">
        <h2 class="selector-title">{{ t('supplyChain.selectProduct') }}</h2>
        <div class="selector-controls">
          <!-- Search -->
          <div class="search-wrap">
            <svg class="search-icon" width="13" height="13" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
              <path d="M15 15l-2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <input
              v-model="productSearch"
              :placeholder="t('supplyChain.searchProducts')"
              class="search-input"
              type="search"
              aria-label="Produkt suchen"
            />
          </div>
          <!-- Status filter -->
          <div class="status-filter" role="group" :aria-label="t('common.filter')">
            <button
              v-for="f in productFilters"
              :key="f.value"
              class="filter-btn"
              :class="{ active: productStatusFilter === f.value }"
              :aria-pressed="productStatusFilter === f.value"
              @click="productStatusFilter = f.value"
            >
              <span class="filter-dot" :style="{ background: f.color }" aria-hidden="true"/>
              {{ f.label }}
              <span class="filter-count">{{ f.count }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Product list — scrollable, virtualisation-ready -->
      <div class="product-list" role="listbox" :aria-label="t('supplyChain.selectProduct')">

        <!-- Empty search state -->
        <div v-if="filteredProducts.length === 0" class="list-empty">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M15 15l-2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ t('common.noData') }}
        </div>

        <!-- Product items -->
        <button
          v-for="p in filteredProducts"
          :key="p.id"
          class="product-item"
          :class="{ active: selectedId === p.id, [`status-${p.status}`]: true }"
          role="option"
          :aria-selected="selectedId === p.id"
          @click="selectedId = p.id"
        >
          <div class="item-icon" :style="{ background: p.iconBg, color: p.iconColor }" aria-hidden="true">
            {{ p.emoji }}
          </div>
          <div class="item-info">
            <div class="item-name">{{ p.name }}</div>
            <div class="item-meta">
              <span class="item-sku">{{ p.sku }}</span>
              <span class="item-sep" aria-hidden="true">·</span>
              <span class="item-cat">{{ p.category }}</span>
            </div>
          </div>
          <div class="item-right">
            <!-- Supply chain completeness mini bar -->
            <div class="item-chain-dots" :aria-label="`Lieferkette: ${chainCompleteness(p)} % vollständig`">
              <div
                v-for="step in p.supplyChain"
                :key="step.stage"
                class="chain-mini-dot"
                :class="`cdot-${step.status}`"
                :title="t(`supplyChain.stages.${step.stage}`) + ': ' + t(`supplyChain.status.${step.status}`)"
              />
            </div>
            <span class="item-pct" :class="`pct-${p.status}`">{{ chainCompleteness(p) }} %</span>
          </div>
        </button>

      </div>

      <!-- Pagination info when many results -->
      <div v-if="store.products.length > 20" class="list-footer">
        {{ filteredProducts.length }} / {{ store.products.length }} {{ t('supplyChain.productsShown') }}
      </div>
    </div>

    <!-- ── Chain detail ── -->
    <div v-if="selected" class="chain-detail">

      <!-- Product info bar -->
      <div class="g-card prod-info-bar">
        <div class="pib-left">
          <div class="prod-ico" :style="{ background: selected.iconBg, color: selected.iconColor }" aria-hidden="true">
            {{ selected.emoji }}
          </div>
          <div>
            <h2 class="prod-name">{{ selected.name }}</h2>
            <p class="prod-meta">
              <code class="sku">{{ selected.sku }}</code>
              <span aria-hidden="true">·</span>
              {{ selected.category }}
            </p>
          </div>
        </div>
        <div class="pib-right">
          <div class="chain-completeness-row">
            <span class="chain-comp-label">{{ t('products.detail.completeness') }}</span>
            <span class="chain-comp-val" :class="`pct-${selected.status}`">{{ chainCompleteness(selected) }} %</span>
          </div>
          <span class="g-badge" :class="badgeClass(selected.status)">
            {{ t(`products.status.${selected.status}`) }}
          </span>
          <NuxtLink :to="`/dashboard/products/${selected.id}`" class="g-btn g-btn-secondary sm-btn">
            {{ t('products.detail.back') === 'Produktpässe' ? 'Produktpass' : t('products.detail.back') }} →
          </NuxtLink>
        </div>
      </div>

      <!-- Visual flow -->
      <div class="g-card chain-flow-card">
        <div class="chain-flow" role="list" :aria-label="`Lieferkette: ${selected.name}`">
          <div
            v-for="(step, i) in selected.supplyChain"
            :key="step.stage"
            class="flow-item"
            role="listitem"
          >
            <div class="flow-node" :class="`node-${step.status}`">
              <div class="flow-emoji" aria-hidden="true">{{ step.emoji }}</div>
              <div class="flow-ring" :class="`ring-${step.status}`" aria-hidden="true"/>
            </div>
            <div class="flow-label">{{ t(`supplyChain.stages.${step.stage}`) }}</div>
            <div v-if="i < selected.supplyChain.length - 1" class="flow-arrow" aria-hidden="true">
              <svg width="24" height="10" viewBox="0 0 24 10" fill="none">
                <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- CO₂ track -->
        <div class="co2-track" aria-label="CO₂ Verlauf">
          <span class="co2-track-label">CO₂</span>
          <div class="co2-steps">
            <div v-for="step in selected.supplyChain" :key="step.stage + '-co2'" class="co2-step">
              <span
                class="co2-val"
                :class="step.co2?.startsWith('−') ? 'co2-neg' : !step.co2 || step.co2.startsWith('—') ? 'co2-miss' : 'co2-pos'"
              >{{ step.co2 ?? '—' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step detail cards -->
      <div class="step-cards">
        <div
          v-for="step in selected.supplyChain"
          :key="step.stage + '-card'"
          class="g-card step-card"
          :class="`step-${step.status}`"
        >
          <div class="step-top">
            <div class="step-emoji-wrap" :class="`ew-${step.status}`" aria-hidden="true">{{ step.emoji }}</div>
            <div class="step-info">
              <div class="step-stage">{{ t(`supplyChain.stages.${step.stage}`) }}</div>
              <div class="step-supplier" :class="{ missing: !isSupplierPresent(step.supplier) }">
                {{ isSupplierPresent(step.supplier) ? step.supplier : t('supplyChain.fields.notCaptured') }}
              </div>
            </div>
            <span class="step-status-badge" :class="`ssb-${step.status}`">
              <span class="sdot" :class="`sdot-${step.status}`" aria-hidden="true"/>
              {{ t(`supplyChain.status.${step.status}`) }}
            </span>
          </div>

          <dl class="step-meta">
            <div class="meta-item">
              <dt class="meta-label">{{ t('supplyChain.fields.country') }}</dt>
              <dd class="meta-val">{{ isPresent(step.country) ? step.country : '—' }}</dd>
            </div>
            <div class="meta-item">
              <dt class="meta-label">{{ t('supplyChain.fields.co2') }}</dt>
              <dd class="meta-val mono" :class="step.co2?.startsWith('−') ? 'co2-neg' : ''">
                {{ isPresent(step.co2) ? step.co2 : '—' }}
              </dd>
            </div>
            <div class="meta-item">
              <dt class="meta-label">{{ t('supplyChain.fields.certifiedUntil') }}</dt>
              <dd class="meta-val">{{ step.certifiedUntil ?? '—' }}</dd>
            </div>
          </dl>

          <div v-if="step.status === 'warn'" class="step-alert" role="alert">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 3L18 17H2L10 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M10 9v3M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            {{ t('supplyChain.incompleteWarning') }}
          </div>
        </div>
      </div>
    </div>

    <!-- ── No product selected ── -->
    <div v-else-if="filteredProducts.length > 0" class="select-prompt g-card">
      <div class="prompt-icon" aria-hidden="true">🔗</div>
      <p class="prompt-text">{{ t('supplyChain.selectPrompt') }}</p>
    </div>

    <!-- ── All suppliers table ── -->
    <div class="g-card suppliers-card">
      <div class="card-header">
        <h2 class="card-title">{{ t('supplyChain.allSuppliers') }}</h2>
        <div class="supplier-filters" role="group">
          <button
            v-for="f in supplierFilterOptions"
            :key="f.value"
            class="sf-btn"
            :class="{ active: supplierFilter === f.value }"
            :aria-pressed="supplierFilter === f.value"
            @click="supplierFilter = f.value"
          >{{ f.label }}</button>
        </div>
      </div>
      <div class="g-table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('supplyChain.fields.supplier') }}</th>
              <th>Stufe</th>
              <th class="hide-mobile">Produkte</th>
              <th class="hide-mobile">{{ t('supplyChain.fields.country') }}</th>
              <th class="hide-mobile">{{ t('supplyChain.fields.co2') }}</th>
              <th>{{ t('common.status') ?? 'Status' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filteredSuppliers" :key="s.name + s.stage" class="table-row">
              <td>
                <div class="sup-cell">
                  <div class="sup-avatar" aria-hidden="true">{{ s.name.charAt(0) }}</div>
                  <span class="sup-name">{{ s.name }}</span>
                </div>
              </td>
              <td><span class="stage-tag">{{ t(`supplyChain.stages.${s.stage}`) }}</span></td>
              <td class="cell-muted hide-mobile">{{ s.products.join(', ') }}</td>
              <td class="cell-muted hide-mobile">{{ s.country }}</td>
              <td class="cell-muted mono hide-mobile">{{ s.co2 }}</td>
              <td>
                <span class="sup-status" :class="`sup-${s.status}`">
                  <span class="sdot" :class="`sdot-${s.status === 'ok' ? 'ok' : s.status === 'warn' ? 'warn' : 'neutral'}`" aria-hidden="true"/>
                  {{ s.statusLabel }}
                </span>
              </td>
            </tr>
            <tr v-if="filteredSuppliers.length === 0">
              <td colspan="6" class="cell-empty">{{ t('common.noData') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { Product, SupplyStep } from '~/stores/products'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { t } = useI18n()
const store = useProductsStore()

// ── Product selector state ─────────────────────────────
const selectedId          = ref<string | null>(null)
const productSearch       = ref('')
const productStatusFilter = ref<'all' | 'ok' | 'warn' | 'crit' | 'draft'>('all')
const supplierFilter      = ref('all')

const selected = computed(() =>
  selectedId.value ? store.getById(selectedId.value) : null
)

// Product filter options with live counts
const productFilters = computed(() => [
  { value: 'all',   label: t('products.filters.all'),   color: 'var(--color-text-3)', count: store.products.length },
  { value: 'ok',    label: t('products.filters.ok'),    color: 'var(--color-ok)',     count: store.stats.byStatus.ok },
  { value: 'warn',  label: t('products.filters.warn'),  color: 'var(--color-warn)',   count: store.stats.byStatus.warn },
  { value: 'crit',  label: t('products.filters.crit'),  color: 'var(--color-crit)',   count: store.stats.byStatus.crit },
  { value: 'draft', label: t('products.filters.draft'), color: 'var(--color-text-3)', count: store.stats.byStatus.draft },
])

// Filtered + searched product list — scales to any number of products
const filteredProducts = computed(() => {
  const q      = productSearch.value.trim().toLowerCase()
  const status = productStatusFilter.value

  return store.products.filter(p => {
    const matchStatus = status === 'all' || p.status === status
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)  ||
      p.category.toLowerCase().includes(q) ||
      p.manufacturer.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })
})

// Auto-select first product when filter changes and current is no longer visible
watch(filteredProducts, (list) => {
  if (selectedId.value && !list.find(p => p.id === selectedId.value)) {
    selectedId.value = list[0]?.id ?? null
  }
  // Auto-select first if nothing selected yet
  if (!selectedId.value && list.length > 0) {
    selectedId.value = list[0].id
  }
}, { immediate: true })

// ── Chain helpers ──────────────────────────────────────

function isPresent(val?: string | null): boolean {
  return !!val && !val.startsWith('—') && !val.startsWith('Nicht') && !val.startsWith('Unbekannt')
}

function isSupplierPresent(val?: string): boolean {
  return !!val && isPresent(val) && val !== 'Diverse'
}

/** % of supply steps with status 'ok' */
function chainCompleteness(p: Product): number {
  if (!p.supplyChain.length) return 0
  const ok = p.supplyChain.filter(s => s.status === 'ok').length
  return Math.round((ok / p.supplyChain.length) * 100)
}

function badgeClass(status: string) {
  return {
    'g-badge-ok':      status === 'ok',
    'g-badge-crit':    status === 'crit',
    'g-badge-warn':    status === 'warn',
    'g-badge-neutral': status === 'draft',
  }
}

// ── KPI aggregations ───────────────────────────────────

const totalSuppliers = computed(() => {
  const names = new Set<string>()
  store.products.forEach(p =>
    p.supplyChain.forEach(s => { if (isSupplierPresent(s.supplier)) names.add(s.supplier!) })
  )
  return names.size
})

const supplyGapsCount = computed(() =>
  store.products.reduce((n, p) =>
    n + p.supplyChain.filter(s => s.status !== 'ok').length, 0)
)

const criticalSupplyGaps = computed(() =>
  store.products.reduce((n, p) =>
    n + p.supplyChain.filter(s => s.status === 'warn').length, 0)
)

const uniqueCountries = computed(() => {
  const countries = new Set<string>()
  store.products.forEach(p =>
    p.supplyChain.forEach(s => { if (isPresent(s.country) && s.country) countries.add(s.country) })
  )
  return countries.size
})

// ── Supplier table ─────────────────────────────────────

interface SupplierRow {
  name:        string
  stage:       string
  stageLabel:  string
  products:    string[]
  country:     string
  co2:         string
  status:      string
  statusLabel: string
}

const allSuppliers = computed<SupplierRow[]>(() => {
  const map = new Map<string, SupplierRow>()
  store.products.forEach(p => {
    p.supplyChain.forEach(s => {
      if (!isSupplierPresent(s.supplier)) return
      const key = s.supplier! + '|' + s.stage
      if (map.has(key)) {
        map.get(key)!.products.push(p.sku)
      } else {
        const isOk = s.status === 'ok'
        map.set(key, {
          name:        s.supplier!,
          stage:       s.stage,
          stageLabel:  s.label,
          products:    [p.sku],
          country:     s.country ?? '—',
          co2:         s.co2    ?? '—',
          status:      isOk ? 'ok' : s.status === 'warn' ? 'warn' : 'neutral',
          statusLabel: isOk ? t('supplyChain.status.ok') : s.status === 'warn' ? t('supplyChain.status.warn') : t('supplyChain.status.neutral'),
        })
      }
    })
  })
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const supplierFilterOptions = computed(() => [
  { value: 'all',  label: t('supplyChain.filterAll') },
  { value: 'ok',   label: t('supplyChain.filterVerified') },
  { value: 'warn', label: t('supplyChain.filterPending') },
  { value: 'neutral', label: t('supplyChain.filterCritical') },
])

const filteredSuppliers = computed(() => {
  if (supplierFilter.value === 'all') return allSuppliers.value
  return allSuppliers.value.filter(s => s.status === supplierFilter.value)
})
</script>

<style scoped>
.header-actions { display: flex; gap: 8px; align-items: center; }

/* ── KPI ── */
.kpi-card  { display: flex; align-items: flex-start; gap: 12px; }
.kpi-icon  { width: 38px; height: 38px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.kpi-label { font-size: 11px; color: var(--color-text-2); text-transform: uppercase; letter-spacing: 0.04em; }
.kpi-value { font-size: 21px; font-weight: 700; letter-spacing: -0.02em; margin: 3px 0 2px; }
.kpi-delta { font-size: 11px; }
.delta-pos { color: var(--color-ok); }
.delta-neg { color: var(--color-crit); }

/* ── Selector card ── */
.selector-card { padding: 0; overflow: hidden; }
.selector-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap; gap: 10px;
  background: var(--color-surface-2);
}
.selector-title { font-size: 13px; font-weight: 600; white-space: nowrap; margin-top: 2px; }
.selector-controls { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex: 1; justify-content: flex-end; }

.search-wrap { position: relative; }
.search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--color-text-3); pointer-events: none; }
.search-input {
  padding: 7px 10px 7px 28px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  font-size: 12px; font-family: inherit;
  background: var(--color-surface); color: var(--color-text-1); outline: none;
  width: 200px;
}
.search-input:focus { border-color: var(--color-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand) 12%, transparent); }
.search-input::placeholder { color: var(--color-text-3); }
.search-input::-webkit-search-cancel-button { display: none; }

.status-filter { display: flex; gap: 4px; flex-wrap: wrap; }
.filter-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 10px; border-radius: 20px; font-size: 11px; font-family: inherit;
  border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-2);
  cursor: pointer; transition: all var(--t-fast);
}
.filter-btn:hover { background: var(--color-surface-2); color: var(--color-text-1); }
.filter-btn.active { background: var(--color-surface-3, var(--color-surface-2)); color: var(--color-text-1); font-weight: 500; border-color: var(--color-border-strong); }
.filter-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.filter-count { font-size: 10px; background: var(--color-bg); border-radius: 8px; padding: 1px 5px; color: var(--color-text-3); }

/* ── Product list ── */
.product-list {
  display: flex; flex-direction: column;
  max-height: 320px; overflow-y: auto;
}

.list-empty {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 2.5rem; font-size: 13px; color: var(--color-text-3);
}

.product-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 1.25rem; border: none; background: none;
  cursor: pointer; font-family: inherit; text-align: left;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--t-fast);
}
.product-item:last-child { border-bottom: none; }
.product-item:hover  { background: var(--color-surface-2); }
.product-item.active { background: color-mix(in srgb, var(--color-brand) 8%, transparent); }
.product-item.active .item-name { color: var(--color-brand-dark); font-weight: 600; }

/* Left border accent by status */
.product-item.status-crit  { border-left: 3px solid var(--color-crit); padding-left: calc(1.25rem - 3px); }
.product-item.status-warn  { border-left: 3px solid var(--color-warn); padding-left: calc(1.25rem - 3px); }
.product-item.status-ok    { border-left: 3px solid var(--color-ok);   padding-left: calc(1.25rem - 3px); }
.product-item.status-draft { border-left: 3px solid var(--color-text-3); padding-left: calc(1.25rem - 3px); }

.item-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 13px; font-weight: 500; color: var(--color-text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.item-sku  { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--color-text-3); }
.item-sep  { color: var(--color-text-3); font-size: 10px; }
.item-cat  { font-size: 11px; color: var(--color-text-2); }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }

/* Mini chain dots — 5 dots, one per stage */
.item-chain-dots { display: flex; gap: 3px; align-items: center; }
.chain-mini-dot { width: 8px; height: 8px; border-radius: 50%; }
.cdot-ok      { background: var(--color-ok); }
.cdot-warn    { background: var(--color-warn); }
.cdot-neutral { background: var(--color-border-strong); }

.item-pct { font-size: 11px; font-weight: 600; }
.pct-ok    { color: var(--color-ok); }
.pct-warn  { color: var(--color-warn); }
.pct-crit  { color: var(--color-crit); }
.pct-draft { color: var(--color-text-3); }

.list-footer {
  padding: 8px 1.25rem; font-size: 11px; color: var(--color-text-3);
  border-top: 1px solid var(--color-border); background: var(--color-surface-2);
  text-align: center;
}

/* ── Chain detail ── */
.chain-detail { display: flex; flex-direction: column; gap: 12px; }

.prod-info-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.pib-left { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.prod-ico  { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
.prod-name { font-size: 14px; font-weight: 600; }
.prod-meta { font-size: 11px; color: var(--color-text-2); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.sku { font-family: 'DM Mono', monospace; font-size: 10px; background: var(--color-surface-2); padding: 1px 5px; border-radius: 4px; border: 1px solid var(--color-border); }
.pib-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.chain-completeness-row { display: flex; flex-direction: column; align-items: flex-end; }
.chain-comp-label { font-size: 10px; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; }
.chain-comp-val   { font-size: 16px; font-weight: 700; }
.sm-btn { font-size: 12px; padding: 6px 12px; }

/* ── Flow card ── */
.chain-flow-card { overflow: visible; }
.chain-flow {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0; margin-bottom: 1.25rem;
}
.flow-item { display: flex; flex-direction: column; align-items: center; position: relative; flex: 1; }
.flow-node { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; position: relative; margin-bottom: 8px; box-shadow: var(--shadow-sm); }
.node-ok      { background: var(--color-ok-bg); }
.node-warn    { background: var(--color-warn-bg); }
.node-neutral { background: var(--color-surface-2); border: 1px solid var(--color-border); }
.flow-ring { position: absolute; bottom: -1px; right: -1px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--color-surface); }
.ring-ok      { background: var(--color-ok); }
.ring-warn    { background: var(--color-warn); }
.ring-neutral { background: var(--color-text-3); }
.flow-label { font-size: 11px; font-weight: 500; color: var(--color-text-2); text-align: center; }
.flow-arrow { position: absolute; right: -12px; top: 20px; color: var(--color-border-strong); z-index: 1; }

.co2-track { border-top: 1px solid var(--color-border); padding-top: 10px; display: flex; align-items: center; gap: 0; }
.co2-track-label { font-size: 10px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; margin-right: 1rem; }
.co2-steps { display: flex; flex: 1; justify-content: space-around; }
.co2-step  { flex: 1; text-align: center; }
.co2-val   { font-size: 11px; font-family: 'DM Mono', monospace; font-weight: 500; }
.co2-pos   { color: var(--color-text-2); }
.co2-neg   { color: var(--color-ok); }
.co2-miss  { color: var(--color-text-3); }

/* ── Step cards ── */
.step-cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.step-card  { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.step-ok      { border-top: 2px solid var(--color-ok); }
.step-warn    { border-top: 2px solid var(--color-warn); }
.step-neutral { border-top: 2px solid var(--color-border-strong); }

.step-top { display: flex; flex-direction: column; align-items: flex-start; gap: 7px; }
.step-emoji-wrap { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.ew-ok      { background: var(--color-ok-bg); }
.ew-warn    { background: var(--color-warn-bg); }
.ew-neutral { background: var(--color-surface-2); }
.step-stage    { font-size: 12px; font-weight: 600; }
.step-supplier { font-size: 11px; color: var(--color-text-2); }
.step-supplier.missing { color: var(--color-text-3); font-style: italic; }
.step-status-badge { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 500; padding: 3px 8px; border-radius: 10px; }
.ssb-ok      { background: var(--color-ok-bg);   color: var(--color-ok-dark); }
.ssb-warn    { background: var(--color-warn-bg);  color: var(--color-warn-dark); }
.ssb-neutral { background: var(--color-surface-2); color: var(--color-text-2); border: 1px solid var(--color-border); }

.step-meta  { display: flex; flex-direction: column; gap: 5px; border-top: 1px solid var(--color-border); padding-top: 8px; }
.meta-item  { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
.meta-label { color: var(--color-text-3); }
.meta-val   { font-weight: 500; color: var(--color-text-1); }

.step-alert { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; padding: 7px 8px; border-radius: 7px; line-height: 1.4; background: var(--color-warn-bg); color: var(--color-warn-dark); }

/* ── Select prompt ── */
.select-prompt { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 2.5rem; text-align: center; }
.prompt-icon { font-size: 2.5rem; }
.prompt-text { font-size: 14px; color: var(--color-text-2); }

/* ── Supplier table ── */
.suppliers-card { overflow: hidden; padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; border-bottom: 1px solid var(--color-border); background: var(--color-surface-2); flex-wrap: wrap; gap: 8px; }
.card-title  { font-size: 13px; font-weight: 600; }
.supplier-filters { display: flex; gap: 4px; }
.sf-btn { font-size: 12px; padding: 4px 10px; border-radius: 16px; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-2); cursor: pointer; font-family: inherit; transition: all var(--t-fast); }
.sf-btn:hover  { background: var(--color-surface-2); color: var(--color-text-1); }
.sf-btn.active { background: var(--color-text-1); color: var(--color-bg); border-color: var(--color-text-1); }

.table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 500px; }
.table th { text-align: left; font-size: 11px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; padding: 10px 16px; border-bottom: 1px solid var(--color-border); }
.table-row td { padding: 11px 16px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.table-row:last-child td { border-bottom: none; }
.table-row:hover td { background: var(--color-surface-2); }
.cell-empty { padding: 2rem !important; text-align: center; color: var(--color-text-3); }

.sup-cell   { display: flex; align-items: center; gap: 9px; }
.sup-avatar { width: 28px; height: 28px; border-radius: 7px; background: var(--color-surface-2); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: var(--color-text-2); flex-shrink: 0; }
.sup-name   { font-size: 13px; font-weight: 500; }
.stage-tag  { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: var(--color-surface-2); border: 1px solid var(--color-border); color: var(--color-text-2); }
.cell-muted { color: var(--color-text-2); font-size: 12px; }

.sup-status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; }
.sup-ok      { color: var(--color-ok); }
.sup-warn    { color: var(--color-warn); }
.sup-neutral { color: var(--color-text-3); }

.sdot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
.sdot-ok      { background: var(--color-ok); }
.sdot-warn    { background: var(--color-warn); }
.sdot-neutral { background: var(--color-text-3); }
.mono { font-family: 'DM Mono', monospace; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .step-cards { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 767px) {
  .selector-controls { flex-direction: column; align-items: stretch; }
  .search-input { width: 100%; }
  .status-filter { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; }
  .step-cards { grid-template-columns: 1fr 1fr; }
  .chain-flow .flow-label { display: none; }
  .product-list { max-height: 240px; }
  .pib-right { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 480px) {
  .step-cards { grid-template-columns: 1fr; }
  .chain-flow .flow-emoji { font-size: 16px; }
  .flow-node { width: 38px; height: 38px; }
}
</style>
