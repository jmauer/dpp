<template>
  <div class="g-page">

    <!-- ── Header ── -->
    <div class="g-page-header">
      <div>
        <h1 class="g-page-title">{{ t('products.title') }}</h1>
        <p class="g-page-sub">
          {{ t('products.subtitle', { filtered: filtered.length, total: products.length }) }}
        </p>
      </div>
      <div class="header-actions">
        <button class="g-btn g-btn-secondary hide-mobile" @click="store.fetchAll()">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M6 10h8M9 15h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          {{ t('products.export') }}
        </button>
        <NuxtLink to="/dashboard/products/new" class="g-btn g-btn-primary">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span class="hide-xs">{{ t('products.newPassport') }}</span>
          <span class="show-xs">{{ t('common.new') }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- ── Filter bar ── -->
    <div class="filter-bar">
      <!-- Search -->
      <div class="search-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M15 15l-2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          :placeholder="t('products.search')"
          class="search-input"
          type="search"
          aria-label="Produkte suchen"
          @input="store.setFilter('search', searchQuery)"
        />
      </div>

      <!-- Status filter chips -->
      <div class="filter-chips" role="group" :aria-label="t('common.filter')">
        <button
          v-for="f in statusFilters"
          :key="f.value"
          class="filter-chip"
          :class="{ active: activeStatus === f.value }"
          :aria-pressed="activeStatus === f.value"
          @click="setStatus(f.value)"
        >
          <span class="chip-dot" :style="{ background: f.color }" aria-hidden="true" />
          <span class="hide-xs">{{ f.label }}</span>
          <span class="chip-count">{{ f.count }}</span>
        </button>
      </div>

      <!-- Sort (desktop) -->
      <div class="sort-wrap hide-mobile">
        <select
          v-model="sortKey"
          class="sort-select"
          :aria-label="t('common.filter')"
          @change="store.setFilter('sortBy', sortKey)"
        >
          <option value="updatedAt">{{ t('products.sort.updated') }}</option>
          <option value="name">{{ t('products.sort.name') }}</option>
          <option value="completeness">{{ t('products.sort.completeness') }}</option>
          <option value="gaps">{{ t('products.sort.gaps') }}</option>
        </select>
        <button class="sort-dir" :aria-label="t('products.sort.direction')" @click="store.setFilter('sortDir', filters.sortDir === 'asc' ? 'desc' : 'asc')">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" :style="{ transform: filters.sortDir === 'asc' ? 'scaleY(-1)' : '' }">
            <path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Loading skeleton ── -->
    <div v-if="store.isLoading" class="skeleton-list">
      <div v-for="i in 5" :key="i" class="skeleton-row g-skeleton" />
    </div>

    <!-- ── Desktop table ── -->
    <div v-else-if="filtered.length" class="g-card hide-mobile table-card">
      <div class="g-table-wrap">
        <table class="product-table">
          <thead>
            <tr>
              <th>{{ t('products.columns.product') }}</th>
              <th class="hide-lg">{{ t('products.columns.category') }}</th>
              <th>{{ t('products.columns.completeness') }}</th>
              <th>{{ t('products.columns.status') }}</th>
              <th>{{ t('products.columns.gaps') }}</th>
              <th class="hide-lg">{{ t('products.columns.compliance') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in filtered"
              :key="p.id"
              class="table-row"
              tabindex="0"
              :aria-label="`${p.name} – ${t(`products.status.${p.status}`)}`"
              @click="navigateTo(`/dashboard/products/${p.id}`)"
              @keydown.enter="navigateTo(`/dashboard/products/${p.id}`)"
            >
              <td>
                <div class="prod-cell">
                  <div class="prod-ico" :style="{ background: p.iconBg, color: p.iconColor }" aria-hidden="true">{{ p.emoji }}</div>
                  <div>
                    <div class="prod-name">{{ p.name }}</div>
                    <div class="prod-sku">{{ p.sku }}</div>
                  </div>
                </div>
              </td>
              <td class="hide-lg cell-muted">{{ p.category }}</td>
              <td>
                <div class="prog-cell">
                  <div class="prog-bar" role="progressbar" :aria-valuenow="p.completeness" aria-valuemin="0" aria-valuemax="100" :aria-label="`${p.completeness}%`">
                    <div class="prog-fill" :class="`fill-${p.status}`" :style="{ width: p.completeness + '%' }" />
                  </div>
                  <span class="prog-val">{{ p.completeness }} %</span>
                </div>
              </td>
              <td>
                <span class="g-badge" :class="badgeClass(p.status)">
                  {{ t(`products.status.${p.status}`) }}
                </span>
              </td>
              <td>
                <span v-if="p.gaps.length" class="gap-pill" :class="p.status === 'crit' ? 'gap-crit' : 'gap-warn'">
                  {{ t('products.gaps.open', { n: p.gaps.length }) }}
                </span>
                <span v-else class="cell-muted">{{ t('products.gaps.none') }}</span>
              </td>
              <td class="hide-lg">
                <div class="reg-dots" aria-label="Compliance Indikatoren">
                  <span
                    v-for="r in p.regulations.slice(0,4)"
                    :key="r.name"
                    class="reg-dot"
                    :class="`reg-${r.status}`"
                    :title="r.name"
                    role="img"
                    :aria-label="`${r.name}: ${t(`compliance.status.${r.status}`)}`"
                  />
                </div>
              </td>
              <td>
                <NuxtLink
                  :to="`/dashboard/products/${p.id}`"
                  class="row-link"
                  :aria-label="`${p.name} details`"
                  @click.stop
                >
                  →
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Mobile card list ── -->
    <div v-else-if="filtered.length" class="mobile-list show-mobile">
      <NuxtLink
        v-for="p in filtered"
        :key="p.id"
        :to="`/dashboard/products/${p.id}`"
        class="mobile-card g-card"
      >
        <div class="mc-top">
          <div class="prod-ico" :style="{ background: p.iconBg, color: p.iconColor }">{{ p.emoji }}</div>
          <div class="mc-info">
            <div class="prod-name">{{ p.name }}</div>
            <div class="prod-sku">{{ p.sku }} · {{ p.category }}</div>
          </div>
          <span class="g-badge" :class="badgeClass(p.status)">
            {{ t(`products.status.${p.status}`) }}
          </span>
        </div>
        <div class="mc-bottom">
          <div class="prog-cell">
            <div class="prog-bar" role="progressbar" :aria-valuenow="p.completeness" aria-valuemin="0" aria-valuemax="100">
              <div class="prog-fill" :class="`fill-${p.status}`" :style="{ width: p.completeness + '%' }" />
            </div>
            <span class="prog-val">{{ p.completeness }} %</span>
          </div>
          <span v-if="p.gaps.length" class="gap-pill" :class="p.status === 'crit' ? 'gap-crit' : 'gap-warn'">
            {{ p.gaps.length }} {{ t('products.columns.gaps').toLowerCase() }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- ── Empty state ── -->
    <div v-else class="empty-state g-card">
      <div class="empty-icon" aria-hidden="true">🔍</div>
      <p class="empty-title">{{ t('common.noData') }}</p>
      <button class="g-btn g-btn-secondary" @click="store.resetFilters()">
        {{ t('common.resetFilters') }}
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { t } = useI18n()
const store = useProductsStore()

const searchQuery = ref(store.filters.search)
const activeStatus = ref<string>(store.filters.status)
const sortKey = ref(store.filters.sortBy)
const filters = computed(() => store.filters)
const filtered = computed(() => store.filtered)
const products = computed(() => store.products)
const stats    = computed(() => store.stats)

// Load real data when the product list opens
onMounted(() => { store.fetchAll() })

const statusFilters = computed(() => [
  { value: 'all',   label: t('products.filters.all'),   color: 'var(--color-text-3)', count: products.value.length },
  { value: 'ok',    label: t('products.filters.ok'),    color: 'var(--color-ok)',     count: stats.value.byStatus.ok },
  { value: 'warn',  label: t('products.filters.warn'),  color: 'var(--color-warn)',   count: stats.value.byStatus.warn },
  { value: 'crit',  label: t('products.filters.crit'),  color: 'var(--color-crit)',   count: stats.value.byStatus.crit },
  { value: 'draft', label: t('products.filters.draft'), color: 'var(--color-text-3)', count: stats.value.byStatus.draft },
])

function setStatus(val: string) {
  activeStatus.value = val
  store.setFilter('status', val as any)
}

function badgeClass(status: string) {
  return {
    'g-badge-ok':      status === 'ok',
    'g-badge-crit':    status === 'crit',
    'g-badge-warn':    status === 'warn',
    'g-badge-neutral': status === 'draft',
  }
}
</script>

<style scoped>
.header-actions { display: flex; gap: 8px; align-items: center; }

/* ── Filter bar ── */
.filter-bar {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
}

.search-wrap {
  position: relative; flex: 1;
  min-width: 200px; max-width: 300px;
}
.search-icon {
  position: absolute; left: 10px; top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-3); pointer-events: none;
}
.search-input {
  width: 100%; padding: 8px 12px 8px 32px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  font-size: 13px; font-family: inherit;
  background: var(--color-surface); color: var(--color-text-1); outline: none;
}
.search-input:focus { border-color: var(--color-brand); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand) 12%, transparent); }
.search-input::placeholder { color: var(--color-text-3); }
.search-input::-webkit-search-cancel-button { display: none; }

.filter-chips { display: flex; gap: 5px; flex-wrap: wrap; }
.filter-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 11px; border-radius: 20px;
  font-size: 12px; font-family: inherit;
  border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text-2);
  cursor: pointer; transition: all var(--t-fast);
}
.filter-chip:hover { background: var(--color-surface-2); color: var(--color-text-1); }
.filter-chip.active { background: var(--color-surface-2); color: var(--color-text-1); font-weight: 500; border-color: var(--color-border-strong); }
.chip-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.chip-count { font-size: 11px; background: var(--color-bg); border-radius: 10px; padding: 1px 6px; color: var(--color-text-3); }

.sort-wrap { display: flex; align-items: center; gap: 6px; margin-left: auto; }
.sort-select {
  padding: 7px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
  font-size: 12px; font-family: inherit;
  background: var(--color-surface); color: var(--color-text-1); outline: none; cursor: pointer;
}
.sort-dir {
  width: 32px; height: 32px; border-radius: var(--radius-md);
  border: 1px solid var(--color-border); background: var(--color-surface);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  color: var(--color-text-2); transition: transform var(--t-fast);
}
.sort-dir:hover { background: var(--color-surface-2); }

/* ── Skeleton ── */
.skeleton-list { display: flex; flex-direction: column; gap: 8px; }
.skeleton-row  { height: 52px; border-radius: var(--radius-md); }

/* ── Table ── */
.table-card { overflow: hidden; padding: 0; }
.product-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.product-table th {
  text-align: left; font-size: 11px; font-weight: 500; padding: 10px 14px 10px;
  color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}
.table-row td { padding: 11px 14px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.table-row:last-child td { border-bottom: none; }
.table-row { cursor: pointer; }
.table-row:hover td { background: var(--color-surface-2); }
.table-row:focus { outline: 2px solid var(--color-brand); outline-offset: -2px; }

.prod-cell { display: flex; align-items: center; gap: 10px; }
.prod-ico  { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.prod-name { font-size: 13px; font-weight: 500; }
.prod-sku  { font-size: 11px; color: var(--color-text-3); font-family: 'DM Mono', monospace; margin-top: 1px; }
.cell-muted { color: var(--color-text-2); font-size: 12px; }

.prog-cell { display: flex; align-items: center; gap: 7px; }
.prog-bar  { flex: 1; max-width: 80px; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.prog-fill { height: 100%; border-radius: 2px; transition: width var(--t-slow); }
.fill-ok      { background: var(--color-ok); }
.fill-crit    { background: var(--color-crit); }
.fill-warn    { background: var(--color-warn); }
.fill-draft   { background: var(--color-text-3); }
.prog-val  { font-size: 12px; color: var(--color-text-2); white-space: nowrap; min-width: 32px; }

.gap-pill  { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 10px; }
.gap-crit  { background: var(--color-crit-bg); color: var(--color-crit); }
.gap-warn  { background: var(--color-warn-bg); color: var(--color-warn); }

.reg-dots { display: flex; gap: 4px; align-items: center; }
.reg-dot  { width: 9px; height: 9px; border-radius: 50%; }
.reg-ok      { background: var(--color-ok); }
.reg-warn    { background: var(--color-warn); }
.reg-crit    { background: var(--color-crit); }
.reg-pending { background: var(--color-info); }

.row-link { font-size: 13px; color: var(--color-brand); text-decoration: none; }
.row-link:hover { color: var(--color-brand-dark); }

/* ── Mobile card ── */
.mobile-list { display: flex; flex-direction: column; gap: 8px; }
.show-mobile { display: none; }
.mobile-card { text-decoration: none; color: inherit; display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.mc-top   { display: flex; align-items: center; gap: 10px; }
.mc-info  { flex: 1; min-width: 0; }
.mc-bottom { display: flex; align-items: center; gap: 12px; }

/* ── Empty ── */
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 3rem; text-align: center; }
.empty-icon  { font-size: 2.5rem; }
.empty-title { font-size: 14px; color: var(--color-text-2); margin: 0; }

/* ── Responsive ── */
@media (max-width: 767px) {
  .show-mobile { display: flex; }
  .filter-bar  { gap: 8px; }
  .search-wrap { max-width: 100%; min-width: 100%; order: -1; }
}

@media (max-width: 1024px) {
  .hide-lg { display: none; }
}

.show-xs { display: none; }
.hide-xs { display: inline; }
@media (max-width: 400px) {
  .show-xs { display: inline; }
  .hide-xs { display: none; }
  .filter-chip span:not(.chip-dot):not(.chip-count) { display: none; }
}
</style>
