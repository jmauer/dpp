<template>
  <div v-if="product" class="detail-page">

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <NuxtLink to="/dashboard/products" class="back-link">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M13 4L7 10l6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ t('products.title') }}
        </NuxtLink>
        <div class="prod-title-row">
          <div class="prod-ico-lg" :style="{ background: product.iconBg, color: product.iconColor }">
            {{ product.emoji }}
          </div>
          <div>
            <h1 class="page-title">{{ product.name }}</h1>
            <p class="prod-meta">
              <span class="mono">{{ product.sku }}</span>
              <span class="sep">·</span>
              {{ product.category }}
              <span class="sep">·</span>
              {{ product.manufacturer }}
            </p>
          </div>
          <span class="badge" :class="`badge-${product.status}`">{{ product.statusLabel }}</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="showQr = true">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M12 12h2v2h-2zM16 12v2M12 16h2M16 16v2M14 14h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          {{ t('products.qrCode') }}
        </button>
        <a :href="publicUrl" target="_blank" class="btn-secondary-link">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M11 3h6v6M17 3l-8 8M8 5H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ t('products.publicView') }}
        </a>
        <button class="btn-primary">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M3 10v7h14v-7M10 3v10M7 10l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ t('products.exportReport') }}
        </button>
      </div>
    </div>

    <!-- Completeness bar -->
    <div class="completeness-banner" :class="`banner-${product.status}`">
      <div class="completeness-info">
        <span class="comp-label">{{ t('products.completeness') }}</span>
        <span class="comp-val">{{ product.completeness }} %</span>
      </div>
      <div class="comp-bar-outer">
        <div class="comp-bar-fill" :class="`fill-${product.status}`" :style="{ width: product.completeness + '%' }" />
      </div>
      <span v-if="product.gaps.length" class="comp-hint">
        {{ t('products.openGaps', { count: product.gaps.length }) }}
      </span>
      <span v-else class="comp-hint ok">{{ t('products.allComplete') }}</span>
    </div>

    <!-- Main grid -->
    <div class="main-grid">

      <!-- Left col -->
      <div class="left-col">

        <!-- Base data -->
        <div class="card">
          <h2 class="card-title">{{ t('products.productInfo') }}</h2>
          <p class="prod-desc">{{ product.description }}</p>
          <div class="data-grid">
            <div class="data-row"><span class="data-label">Hersteller</span><span class="data-val">{{ product.manufacturer }}</span></div>
            <div class="data-row"><span class="data-label">Herstellungsland</span><span class="data-val">{{ product.countryOfOrigin }}</span></div>
            <div class="data-row"><span class="data-label">Fertigungsdatum</span><span class="data-val">{{ formatDate(product.manufacturingDate) }}</span></div>
            <div class="data-row"><span class="data-label">Gewicht</span><span class="data-val">{{ product.weight }}</span></div>
            <div class="data-row"><span class="data-label">Energieklasse</span><span class="data-val">{{ product.energyClass }}</span></div>
            <div class="data-row"><span class="data-label">CO₂-Gesamtbilanz</span><span class="data-val">{{ product.co2Total }}</span></div>
            <div class="data-row"><span class="data-label">Reparierbarkeitsindex</span>
              <span class="data-val">
                <template v-if="product.repairabilityIndex > 0">
                  <span class="repair-score" :class="product.repairabilityIndex >= 7 ? 'score-ok' : product.repairabilityIndex >= 4 ? 'score-warn' : 'score-crit'">
                    {{ product.repairabilityIndex }} / 10
                  </span>
                </template>
                <template v-else>—</template>
              </span>
            </div>
            <div class="data-row"><span class="data-label">Recyclingquote</span><span class="data-val">{{ product.recyclingRate }}</span></div>
          </div>
        </div>

        <!-- Materials -->
        <div class="card">
          <h2 class="card-title">{{ t('products.materials') }}</h2>
          <div v-if="product.materials.length" class="materials-list">
            <div v-for="m in product.materials" :key="m.name" class="material-row">
              <div class="mat-info">
                <span class="mat-name">{{ m.name }}</span>
                <span v-if="m.recycled" class="recycled-badge">♻ Recycelt</span>
              </div>
              <div class="mat-bar-wrap">
                <div class="mat-bar"><div class="mat-fill" :style="{ width: m.pct + '%' }" /></div>
                <span class="mat-pct">{{ m.pct }} %</span>
              </div>
            </div>
          </div>
          <div v-else class="missing-field">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ t('products.noMaterialData') }}
          </div>
        </div>

        <!-- Data gaps -->
        <div v-if="product.gaps.length" class="card card-alert">
          <h2 class="card-title alert-title">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M10 3L18 17H2L10 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 9v4M10 15v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            {{ t('products.openGaps', { count: product.gaps.length }) }}
          </h2>
          <div class="gaps-list">
            <div v-for="g in product.gaps" :key="g.label" class="gap-item">
              <div class="gap-icon" :class="`gap-${g.type}`">
                <svg v-if="g.type === 'missing'" width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M10 3v14M3 10h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <svg v-else-if="g.type === 'outdated'" width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M3 10a7 7 0 1 1 14 0 7 7 0 0 1-14 0ZM10 7v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                <svg v-else width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M10 3L18 17H2L10 3Z" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v3M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </div>
              <div class="gap-body">
                <span class="gap-label">{{ g.label }}</span>
                <span v-if="g.regulation" class="gap-reg">{{ g.regulation }}</span>
              </div>
              <span v-if="g.deadline" class="gap-deadline">Frist {{ formatDate(g.deadline) }}</span>
              <span class="gap-type-badge" :class="`gtb-${g.type}`">
                {{ g.type === 'missing' ? t('products.gapMissing') : g.type === 'outdated' ? t('products.gapOutdated') : t('products.gapUnverified') }}
              </span>
            </div>
          </div>
          <button class="btn-fix-all">{{ t('products.fixAllGaps') }}</button>
        </div>

      </div>

      <!-- Right col -->
      <div class="right-col">

        <!-- QR card -->
        <div class="card card-qr">
          <div class="qr-header">
            <h2 class="card-title">Öffentlicher Produktpass</h2>
            <span class="public-badge">Ohne Login zugänglich</span>
          </div>
          <p class="qr-desc">Dieser QR-Code verlinkt direkt auf den öffentlichen Produktpass – lesbar von Kunden, Einkäufern und Behörden ohne Anmeldung.</p>

          <div class="qr-canvas-wrap">
            <canvas ref="qrCanvas" width="160" height="160" class="qr-canvas" />
            <div class="qr-logo-overlay">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#1D9E75"/><path d="M14 5L19.5 8.25V14.75L14 18L8.5 14.75V8.25L14 5Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><circle cx="14" cy="11.5" r="2" fill="white"/></svg>
            </div>
          </div>

          <div class="url-box">
            <span class="url-text">{{ publicUrl }}</span>
            <button class="copy-btn" :class="{ copied }" @click="copyUrl">
              <svg v-if="!copied" width="13" height="13" viewBox="0 0 20 20" fill="none"><rect x="6" y="6" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" stroke-width="1.5"/></svg>
              <svg v-else width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ copied ? t('products.copied') : t('products.copyUrl') }}
            </button>
          </div>

          <div class="qr-actions">
            <button class="btn-qr-dl" @click="downloadQr">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 14v3h14v-3M10 3v10M7 10l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {{ t('products.qrDownload') }}
            </button>
            <button class="btn-qr-share" @click="shareUrl">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="15" cy="5" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="10" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9l6-3M7 11l6 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              {{ t('products.qrShare') }}
            </button>
          </div>
        </div>

        <!-- Regulations -->
        <div class="card">
          <h2 class="card-title">Regulatorik & Compliance</h2>
          <div class="reg-list">
            <div v-for="r in product.regulations" :key="r.name" class="reg-item" :class="`reg-item-${r.status}`">
              <span class="reg-dot" :class="`dot-${r.status}`" />
              <span class="reg-name">{{ r.name }}</span>
              <span class="reg-status">{{ regLabel(r.status) }}</span>
            </div>
          </div>

          <div v-if="product.certifications.length" class="certs">
            <div class="cert-title">Zertifikate</div>
            <div class="cert-list">
              <span v-for="c in product.certifications" :key="c" class="cert-tag">{{ c }}</span>
            </div>
          </div>
        </div>

        <!-- Supply chain mini -->
        <div class="card">
          <div class="card-header-row">
            <h2 class="card-title">Lieferkette</h2>
            <NuxtLink to="/dashboard/supply-chain" class="card-link">Vollansicht →</NuxtLink>
          </div>
          <div class="mini-chain">
            <div v-for="(step, i) in product.supplyChain" :key="step.stage" class="chain-step">
              <div class="chain-node" :class="`node-${step.status}`">{{ step.emoji }}</div>
              <div class="chain-label">{{ step.label }}</div>
              <div v-if="step.supplier && step.supplier !== '— fehlt' && step.supplier !== '— nicht definiert'" class="chain-supplier">{{ step.supplier }}</div>
              <div v-else class="chain-supplier missing">Nicht erfasst</div>
              <div v-if="i < product.supplyChain.length - 1" class="chain-arrow">›</div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- QR Modal -->
    <Teleport to="body">
      <div v-if="showQr" class="modal-overlay" @click.self="showQr = false">
        <div class="modal">
          <div class="modal-header">
            <h3>QR-Code – {{ product.name }}</h3>
            <button class="modal-close" @click="showQr = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="qr-modal-wrap">
              <canvas ref="qrModalCanvas" width="240" height="240" class="qr-canvas-lg" />
              <div class="qr-logo-overlay-lg">
                <svg width="36" height="36" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#1D9E75"/><path d="M14 5L19.5 8.25V14.75L14 18L8.5 14.75V8.25L14 5Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><circle cx="14" cy="11.5" r="2" fill="white"/></svg>
              </div>
            </div>
            <p class="modal-url">{{ publicUrl }}</p>
            <div class="modal-actions">
              <button class="btn-primary full" @click="downloadQr">{{ t('products.qrDownload') }}</button>
              <button class="btn-secondary full" @click="copyUrl">{{ copied ? t('products.copied') : t('products.copyUrl') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>

  <div v-else class="not-found">
    <p>{{ t('products.notFound') }}</p>
    <NuxtLink to="/dashboard/products">← {{ t('products.backToOverview') }}</NuxtLink>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { t } = useI18n()
const route = useRoute()
const store = useProductsStore()
const product = computed(() => store.getById(route.params.id as string))

// Load the product pass from the API when the page opens
onMounted(() => { store.fetchOne(route.params.id as string) })

// Public URL for this product
const config = useRuntimeConfig()
const publicUrl = computed(() =>
  `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${product.value?.id}`
)

// QR refs
const qrCanvas = ref<HTMLCanvasElement | null>(null)
const qrModalCanvas = ref<HTMLCanvasElement | null>(null)
const showQr = ref(false)
const copied = ref(false)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function regLabel(s: string) {
  return { ok: 'Erfüllt', warn: 'In Bearbeitung', crit: 'Lücken offen', pending: 'Ausstehend' }[s] ?? s
}

async function renderQr(canvas: HTMLCanvasElement | null, size = 160) {
  if (!canvas || !publicUrl.value) return
  await QRCode.toCanvas(canvas, publicUrl.value, {
    width: size,
    margin: 1,
    color: { dark: '#1A1916', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  })
}

watch(qrCanvas, (c) => { if (c) renderQr(c, 160) })
watch(qrModalCanvas, (c) => { if (c) renderQr(c, 240) })
watch(showQr, async (v) => {
  if (v) {
    await nextTick()
    renderQr(qrModalCanvas.value, 240)
  }
})

onMounted(() => {
  if (qrCanvas.value) renderQr(qrCanvas.value, 160)
})

function downloadQr() {
  const canvas = qrModalCanvas.value ?? qrCanvas.value
  if (!canvas) return
  const link = document.createElement('a')
  link.download = `DPP-QR-${product.value?.sku}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

async function copyUrl() {
  await navigator.clipboard.writeText(publicUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function shareUrl() {
  if (navigator.share) {
    await navigator.share({ title: product.value?.name, url: publicUrl.value })
  } else {
    copyUrl()
  }
}
</script>

<style scoped>
.detail-page { display: flex; flex-direction: column; gap: 16px; }

/* Header */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.header-left { display: flex; flex-direction: column; gap: 10px; }
.back-link {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--color-text-2); text-decoration: none;
}
.back-link:hover { color: var(--color-text-1); }
.prod-title-row { display: flex; align-items: center; gap: 12px; }
.prod-ico-lg { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.page-title { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
.prod-meta { font-size: 12px; color: var(--color-text-2); margin-top: 3px; }
.sep { margin: 0 4px; }
.mono { font-family: 'DM Mono', monospace; font-size: 11px; }

.header-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.btn-primary, .btn-secondary, .btn-secondary-link {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: 'DM Sans', sans-serif; text-decoration: none;
}
.btn-primary { background: var(--color-brand); color: white; border: none; }
.btn-primary:hover { background: var(--color-brand-dark); }
.btn-secondary, .btn-secondary-link { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-1); }
.btn-secondary:hover, .btn-secondary-link:hover { background: var(--color-surface-2); }
.full { width: 100%; justify-content: center; }

.badge { font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 500; white-space: nowrap; }
.badge-ok    { background: var(--color-ok-bg); color: #085041; }
.badge-crit  { background: var(--color-crit-bg); color: #4A1B0C; }
.badge-warn  { background: var(--color-warn-bg); color: #412402; }
.badge-draft { background: var(--color-surface-2); color: var(--color-text-2); border: 1px solid var(--color-border); }

/* Completeness banner */
.completeness-banner {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 16px; border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}
.banner-crit { border-color: rgba(216,90,48,0.25); background: var(--color-crit-bg); }
.banner-ok   { border-color: rgba(29,158,117,0.25); background: var(--color-ok-bg); }
.banner-draft { background: var(--color-surface-2); }
.completeness-info { display: flex; flex-direction: column; }
.comp-label { font-size: 11px; color: var(--color-text-2); text-transform: uppercase; letter-spacing: 0.04em; }
.comp-val   { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
.comp-bar-outer { flex: 1; height: 6px; background: rgba(0,0,0,0.08); border-radius: 3px; overflow: hidden; }
.comp-bar-fill  { height: 100%; border-radius: 3px; transition: width 0.4s; }
.fill-ok    { background: var(--color-ok); }
.fill-crit  { background: var(--color-crit); }
.fill-draft { background: var(--color-text-3); }
.comp-hint { font-size: 12px; color: var(--color-text-2); white-space: nowrap; }
.comp-hint.ok { color: var(--color-ok); }

/* Grid */
.main-grid { display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; }
.left-col, .right-col { display: flex; flex-direction: column; gap: 16px; }

/* Card */
.card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 1.1rem 1.25rem; }
.card-alert { border-color: rgba(216,90,48,0.3); background: var(--color-crit-bg); }
.card-title { font-size: 13px; font-weight: 600; color: var(--color-text-1); margin-bottom: 12px; }
.card-header-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.card-link { font-size: 12px; color: var(--color-brand); text-decoration: none; }

.prod-desc { font-size: 13px; color: var(--color-text-2); line-height: 1.6; margin-bottom: 14px; }

.data-grid { display: flex; flex-direction: column; gap: 0; }
.data-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--color-border); font-size: 13px; }
.data-row:last-child { border-bottom: none; }
.data-label { color: var(--color-text-2); }
.data-val   { font-weight: 500; text-align: right; }

.repair-score { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
.score-ok   { background: var(--color-ok-bg); color: #085041; }
.score-warn { background: var(--color-warn-bg); color: #412402; }
.score-crit { background: var(--color-crit-bg); color: #4A1B0C; }

/* Materials */
.materials-list { display: flex; flex-direction: column; gap: 10px; }
.material-row { display: flex; flex-direction: column; gap: 5px; }
.mat-info { display: flex; align-items: center; gap: 8px; }
.mat-name { font-size: 13px; font-weight: 500; }
.recycled-badge { font-size: 10px; background: var(--color-ok-bg); color: #085041; padding: 1px 6px; border-radius: 10px; }
.mat-bar-wrap { display: flex; align-items: center; gap: 8px; }
.mat-bar { flex: 1; height: 5px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
.mat-fill { height: 100%; background: var(--color-brand); border-radius: 3px; }
.mat-pct { font-size: 11px; color: var(--color-text-2); min-width: 34px; text-align: right; }

.missing-field { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--color-crit); }

/* Gaps */
.alert-title { display: flex; align-items: center; gap: 7px; color: var(--color-crit); }
.gaps-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
.gap-item { display: flex; align-items: center; gap: 10px; padding: 9px 11px; background: white; border-radius: 8px; border: 1px solid rgba(216,90,48,0.15); }
.gap-icon { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.gap-missing    { background: var(--color-crit-bg); color: var(--color-crit); }
.gap-outdated   { background: var(--color-warn-bg); color: var(--color-warn); }
.gap-unverified { background: var(--color-info-bg); color: var(--color-info); }
.gap-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.gap-label { font-size: 12px; font-weight: 500; }
.gap-reg   { font-size: 11px; color: var(--color-text-3); }
.gap-deadline { font-size: 11px; color: var(--color-crit); white-space: nowrap; font-weight: 500; }
.gap-type-badge { font-size: 10px; padding: 2px 7px; border-radius: 10px; white-space: nowrap; font-weight: 500; }
.gtb-missing    { background: var(--color-crit-bg); color: var(--color-crit); }
.gtb-outdated   { background: var(--color-warn-bg); color: var(--color-warn); }
.gtb-unverified { background: var(--color-info-bg); color: var(--color-info); }
.btn-fix-all { font-size: 13px; font-weight: 500; color: var(--color-crit); background: none; border: none; cursor: pointer; padding: 0; }
.btn-fix-all:hover { text-decoration: underline; }

/* QR Card */
.card-qr { border: 1px solid rgba(29,158,117,0.25); background: linear-gradient(to bottom, var(--color-ok-bg), white); }
.qr-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.public-badge { font-size: 10px; padding: 3px 8px; border-radius: 20px; background: var(--color-ok-bg); color: var(--color-brand-dark); border: 1px solid rgba(29,158,117,0.2); font-weight: 500; }
.qr-desc { font-size: 12px; color: var(--color-text-2); line-height: 1.5; margin-bottom: 14px; }
.qr-canvas-wrap { position: relative; display: flex; justify-content: center; margin-bottom: 14px; }
.qr-canvas { border-radius: 10px; display: block; }
.qr-logo-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: white; border-radius: 6px; padding: 3px;
  box-shadow: 0 0 0 2px white;
}
.qr-logo-overlay-lg {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: white; border-radius: 8px; padding: 4px;
  box-shadow: 0 0 0 3px white;
}
.url-box {
  display: flex; align-items: center; gap: 8px;
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  border-radius: 8px; padding: 7px 10px; margin-bottom: 12px;
}
.url-text { flex: 1; font-size: 11px; font-family: 'DM Mono', monospace; color: var(--color-text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.copy-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-family: 'DM Sans', sans-serif; font-weight: 500;
  padding: 4px 8px; border-radius: 6px; cursor: pointer;
  border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-1);
  white-space: nowrap; transition: all 0.12s;
}
.copy-btn.copied { background: var(--color-ok-bg); color: var(--color-ok); border-color: rgba(29,158,117,0.3); }
.qr-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-qr-dl, .btn-qr-share {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 500;
  font-family: 'DM Sans', sans-serif; cursor: pointer;
}
.btn-qr-dl    { background: var(--color-brand); color: white; border: none; }
.btn-qr-dl:hover { background: var(--color-brand-dark); }
.btn-qr-share { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-1); }
.btn-qr-share:hover { background: var(--color-surface-2); }

/* Regulations */
.reg-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.reg-item { display: flex; align-items: center; gap: 9px; padding: 7px 10px; border-radius: 8px; font-size: 13px; }
.reg-item-ok      { background: var(--color-ok-bg); }
.reg-item-warn    { background: var(--color-warn-bg); }
.reg-item-crit    { background: var(--color-crit-bg); }
.reg-item-pending { background: var(--color-info-bg); }
.reg-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.dot-ok      { background: var(--color-ok); }
.dot-warn    { background: var(--color-warn); }
.dot-crit    { background: var(--color-crit); }
.dot-pending { background: var(--color-info); }
.reg-name   { flex: 1; font-weight: 500; }
.reg-status { font-size: 11px; color: var(--color-text-2); }

.cert-title { font-size: 11px; font-weight: 500; color: var(--color-text-2); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
.cert-list  { display: flex; flex-wrap: wrap; gap: 6px; }
.cert-tag   { font-size: 11px; padding: 3px 9px; border-radius: 6px; background: var(--color-surface-2); border: 1px solid var(--color-border); font-family: 'DM Mono', monospace; }

/* Supply chain mini */
.mini-chain { display: flex; align-items: flex-start; gap: 0; justify-content: space-between; padding-top: 4px; }
.chain-step { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; position: relative; }
.chain-node { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; }
.node-ok      { background: var(--color-ok-bg); }
.node-warn    { background: var(--color-warn-bg); }
.node-neutral { background: var(--color-surface-2); }
.chain-label    { font-size: 10px; font-weight: 500; color: var(--color-text-2); text-align: center; }
.chain-supplier { font-size: 9px; color: var(--color-text-3); text-align: center; max-width: 60px; line-height: 1.3; }
.chain-supplier.missing { color: var(--color-crit); }
.chain-arrow { position: absolute; right: -5px; top: 10px; color: var(--color-text-3); font-size: 16px; z-index: 1; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 999;
  backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-surface); border-radius: 16px;
  width: 340px; overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,0.16);
}
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border);
}
.modal-header h3 { font-size: 14px; font-weight: 600; }
.modal-close { background: none; border: none; cursor: pointer; font-size: 16px; color: var(--color-text-2); line-height: 1; }
.modal-body { padding: 1.25rem; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.qr-modal-wrap { position: relative; }
.qr-canvas-lg { border-radius: 12px; display: block; }
.modal-url { font-size: 11px; font-family: 'DM Mono', monospace; color: var(--color-text-2); text-align: center; word-break: break-all; }
.modal-actions { display: flex; flex-direction: column; gap: 8px; width: 100%; }

/* Not found */
.not-found { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 4rem; color: var(--color-text-2); }
</style>
