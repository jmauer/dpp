<template>
  <div v-if="product">

    <!-- Hero -->
    <div class="hero">
      <div class="hero-left">
        <div class="hero-icon" :style="{ background: product.iconBg, color: product.iconColor }">
          {{ product.emoji }}
        </div>
        <div>
          <div class="hero-eyebrow">Digitaler Produktpass · {{ product.category }}</div>
          <h1 class="hero-title">{{ product.name }}</h1>
          <div class="hero-meta">
            <span class="mono">{{ product.sku }}</span>
            <span class="sep">·</span>
            <span>{{ product.manufacturer }}</span>
            <span class="sep">·</span>
            <span>{{ product.countryOfOrigin }}</span>
          </div>
        </div>
      </div>
      <div class="hero-right">
        <div class="status-block" :class="`status-${product.status}`">
          <div class="status-dot" :class="`dot-${product.status}`" />
          <div>
            <div class="status-label">DPP-Status</div>
            <div class="status-val">{{ product.statusLabel }}</div>
          </div>
        </div>
        <div class="comp-block">
          <div class="comp-top">
            <span class="comp-label">Vollständigkeit</span>
            <span class="comp-pct">{{ product.completeness }} %</span>
          </div>
          <div class="comp-bar"><div class="comp-fill" :class="`fill-${product.status}`" :style="{ width: product.completeness + '%' }" /></div>
        </div>
        <div class="verified-tag">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M10 2L17 5V10C17 13.866 13.866 17 10 18C6.134 17 3 13.866 3 10V5L10 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Verifiziert · PassPort DPP Plattform
        </div>
      </div>
    </div>

    <!-- Certifications strip -->
    <div v-if="product.certifications.length" class="cert-strip">
      <span class="cert-strip-label">Zertifikate & Normen</span>
      <div class="cert-list">
        <span v-for="c in product.certifications" :key="c" class="cert-tag">{{ c }}</span>
      </div>
    </div>

    <!-- Main content -->
    <div class="content-grid">

      <!-- LEFT: product data -->
      <div class="content-left">

        <!-- Description -->
        <section class="section">
          <h2 class="section-title">Produktbeschreibung</h2>
          <p class="section-text">{{ product.description }}</p>
        </section>

        <!-- Key data -->
        <section class="section">
          <h2 class="section-title">Technische Produktdaten</h2>
          <div class="data-table">
            <div class="data-row"><span class="data-key">Hersteller</span><span class="data-val">{{ product.manufacturer }}</span></div>
            <div class="data-row"><span class="data-key">Herstellungsland</span><span class="data-val">{{ product.countryOfOrigin }}</span></div>
            <div class="data-row"><span class="data-key">Fertigungsdatum</span><span class="data-val">{{ formatDate(product.manufacturingDate) }}</span></div>
            <div class="data-row"><span class="data-key">Gewicht</span><span class="data-val">{{ product.weight }}</span></div>
            <div class="data-row">
              <span class="data-key">Energieklasse</span>
              <span class="data-val">
                <span v-if="product.energyClass !== '—'" class="energy-badge">{{ product.energyClass }}</span>
                <span v-else class="missing-val">Nicht angegeben</span>
              </span>
            </div>
            <div class="data-row">
              <span class="data-key">CO₂-Gesamtbilanz</span>
              <span class="data-val co2-val">{{ product.co2Total }}</span>
            </div>
            <div class="data-row">
              <span class="data-key">Reparierbarkeitsindex</span>
              <span class="data-val">
                <span v-if="product.repairabilityIndex > 0" class="repair-score" :class="product.repairabilityIndex >= 7 ? 'score-ok' : product.repairabilityIndex >= 4 ? 'score-warn' : 'score-crit'">
                  {{ product.repairabilityIndex }} / 10
                </span>
                <span v-else class="missing-val">Nicht angegeben</span>
              </span>
            </div>
            <div class="data-row"><span class="data-key">Recyclingquote</span><span class="data-val">{{ product.recyclingRate }}</span></div>
          </div>
        </section>

        <!-- Materials -->
        <section class="section">
          <h2 class="section-title">Materialzusammensetzung</h2>
          <div v-if="product.materials.length" class="materials">
            <div v-for="m in product.materials" :key="m.name" class="mat-row">
              <div class="mat-header">
                <span class="mat-name">{{ m.name }}</span>
                <div class="mat-right">
                  <span v-if="m.recycled" class="recycled-badge">♻ Recycelt</span>
                  <span class="mat-pct-val">{{ m.pct }} %</span>
                </div>
              </div>
              <div class="mat-bar"><div class="mat-fill" :style="{ width: m.pct + '%' }" /></div>
            </div>
          </div>
          <div v-else class="data-missing-block">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Materialangaben sind noch nicht hinterlegt.
          </div>
        </section>

        <!-- Supply chain -->
        <section class="section">
          <h2 class="section-title">Lieferkette</h2>
          <div class="supply-chain">
            <div
              v-for="(step, i) in product.supplyChain"
              :key="step.stage"
              class="chain-card"
              :class="`chain-${step.status}`"
            >
              <div class="chain-step-num">{{ i + 1 }}</div>
              <div class="chain-emoji">{{ step.emoji }}</div>
              <div class="chain-body">
                <div class="chain-stage">{{ step.label }}</div>
                <div class="chain-supplier">
                  <span v-if="step.supplier && !step.supplier.startsWith('—')">{{ step.supplier }}</span>
                  <span v-else class="chain-missing">Nicht erfasst</span>
                </div>
                <div v-if="step.country && !step.country.startsWith('—') && !step.country.startsWith('Nicht')" class="chain-country">
                  📍 {{ step.country }}
                </div>
              </div>
              <div class="chain-co2" v-if="step.co2 && !step.co2.startsWith('—')">
                <span class="co2-label">CO₂</span>
                <span class="co2-val">{{ step.co2 }}</span>
              </div>
              <div class="chain-status-dot" :class="`dot-${step.status}`" />
              <div v-if="i < product.supplyChain.length - 1" class="chain-connector">→</div>
            </div>
          </div>
        </section>

        <!-- Compliance -->
        <section class="section">
          <h2 class="section-title">Regulatorik & Compliance</h2>
          <div class="reg-grid">
            <div
              v-for="r in product.regulations"
              :key="r.name"
              class="reg-card"
              :class="`reg-${r.status}`"
            >
              <div class="reg-icon" :class="`reg-icon-${r.status}`">
                <svg v-if="r.status === 'ok'" width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else-if="r.status === 'crit'" width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 2L18 17H2L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                <svg v-else width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v4M10 14v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </div>
              <div class="reg-body">
                <div class="reg-name">{{ r.name }}</div>
                <div class="reg-status">{{ regLabel(r.status) }}</div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- RIGHT: QR + share -->
      <div class="content-right">

        <!-- QR Share Card -->
        <div class="qr-card">
          <div class="qr-card-header">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="12" y="2" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="12" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M12 12h2v2h-2zM16 12v2M12 16h2M16 16v2M14 14h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Produktpass teilen
          </div>
          <p class="qr-hint">Scannen Sie diesen QR-Code, um den Produktpass direkt aufzurufen – ohne Anmeldung.</p>
          <div class="qr-wrap">
            <canvas ref="qrCanvas" width="200" height="200" class="qr-canvas" />
            <div class="qr-logo">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#1D9E75"/><path d="M14 5L19.5 8.25V14.75L14 18L8.5 14.75V8.25L14 5Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/><circle cx="14" cy="11.5" r="2" fill="white"/></svg>
            </div>
          </div>

          <div class="url-row">
            <span class="url-text">{{ currentUrl }}</span>
            <button class="copy-btn" :class="{ copied }" @click="copyUrl">
              {{ copied ? '✓ Kopiert' : 'Kopieren' }}
            </button>
          </div>

          <div class="share-actions">
            <button class="btn-dl" @click="downloadQr">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M3 14v3h14v-3M10 3v10M7 10l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              QR herunterladen
            </button>
            <button class="btn-share" @click="shareUrl">
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="15" cy="5" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="10" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 9l6-3M7 11l6 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Teilen
            </button>
          </div>
        </div>

        <!-- DPP info box -->
        <div class="info-box">
          <h3 class="info-title">Was ist ein Digitaler Produktpass?</h3>
          <p class="info-text">Der Digitale Produktpass (DPP) ist ein EU-weites Instrument zur Steigerung der Produkttransparenz entlang der gesamten Wertschöpfungskette. Er enthält standardisierte Informationen zu Materialien, CO₂-Bilanz, Lieferkette und Recyclingfähigkeit.</p>
          <div class="info-links">
            <a href="https://ec.europa.eu/environment/ecodesign" target="_blank" class="info-link">EU ESPR-Verordnung ↗</a>
            <a href="https://environment.ec.europa.eu/topics/waste-and-recycling/batteries_en" target="_blank" class="info-link">EU Batterieverordnung ↗</a>
          </div>
        </div>

        <!-- Timestamp -->
        <div class="timestamp-card">
          <div class="ts-row">
            <span class="ts-label">Zuletzt aktualisiert</span>
            <span class="ts-val">{{ formatDate(product.manufacturingDate) }}</span>
          </div>
          <div class="ts-row">
            <span class="ts-label">DPP-ID</span>
            <span class="ts-val mono small">DPP-{{ product.id.toUpperCase() }}-2026</span>
          </div>
          <div class="ts-row">
            <span class="ts-label">Ausgestellt von</span>
            <span class="ts-val">{{ product.manufacturer }}</span>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Not found -->
  <div v-else class="not-found">
    <div class="nf-inner">
      <div class="nf-icon">🔍</div>
      <h1>Produktpass nicht gefunden</h1>
      <p>Der angeforderte Produktpass existiert nicht oder wurde entfernt.</p>
      <a href="/" class="nf-link">Zur Startseite</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'
import type { Database, PublicPassportRow } from '~/types/database'

definePageMeta({ layout: 'public' })

const route    = useRoute()
const supabase = useSupabaseClient<Database>()

/**
 * Der Routenparameter ist der `public_slug` aus der Datenbank.
 * Gelesen wird die View `public_product_passports` - sie zeigt nur
 * freigegebene Produkte und blendet interne Felder (Mandant, Lueckenliste)
 * aus. Dadurch ist die Seite ohne Login abrufbar.
 *
 * useAsyncData statt onMounted: so wird der Pass serverseitig gerendert
 * und ist fuer Suchmaschinen und Link-Vorschauen sichtbar.
 */
const slug = computed(() => String(route.params.id ?? ''))

const { data: product } = await useAsyncData(
  () => `passport-${slug.value}`,
  async () => {
    const { data, error } = await supabase
      .from('public_product_passports')
      .select('*')
      .eq('public_slug', slug.value)
      .maybeSingle()

    if (error) {
      console.error('[Passport] Laden fehlgeschlagen:', error.message)
      return null
    }
    return data ? publicRowToProduct(data as unknown as PublicPassportRow) : null
  },
  { watch: [slug] },
)

// Nicht gefundene Paesse sollen auch wirklich 404 liefern, nicht 200.
if (import.meta.server && !product.value) {
  const event = useRequestEvent()
  if (event) setResponseStatus(event, 404)
}

// SSR-sicher: useRequestURL kennt die Adresse auch ohne window.
const currentUrl = computed(() => new URL(`/p/${slug.value}`, useRequestURL().origin).toString())

useHead(() => ({
  title: product.value ? `${product.value.name} – Digitaler Produktpass` : 'Produktpass nicht gefunden',
  meta: product.value
    ? [
        { name: 'description', content: product.value.description },
        { property: 'og:title', content: `${product.value.name} – Digitaler Produktpass` },
        { property: 'og:description', content: product.value.description },
        { property: 'og:url', content: currentUrl.value },
      ]
    : [{ name: 'robots', content: 'noindex' }],
}))

const qrCanvas = ref<HTMLCanvasElement | null>(null)
const copied   = ref(false)

onMounted(() => renderQr())
watch(qrCanvas, () => renderQr())

async function renderQr() {
  if (!qrCanvas.value) return
  await QRCode.toCanvas(qrCanvas.value, currentUrl.value, {
    width: 200,
    margin: 1,
    color: { dark: '#1A1916', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  })
}

function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

function regLabel(s: string) {
  return { ok: 'Erfüllt', warn: 'In Bearbeitung', crit: 'Lücken offen', pending: 'Ausstehend' }[s] ?? s
}

async function copyUrl() {
  await navigator.clipboard.writeText(currentUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

async function shareUrl() {
  if (navigator.share) {
    await navigator.share({
      title: product.value?.name ?? 'Digitaler Produktpass',
      text: `Digitaler Produktpass: ${product.value?.name}`,
      url: currentUrl.value,
    })
  } else {
    copyUrl()
  }
}

function downloadQr() {
  if (!qrCanvas.value) return
  const link = document.createElement('a')
  link.download = `DPP-QR-${product.value?.sku ?? 'pass'}.png`
  link.href = qrCanvas.value.toDataURL('image/png')
  link.click()
}
</script>

<style scoped>
/* Hero */
.hero {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 24px; margin-bottom: 1.5rem; flex-wrap: wrap;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px; padding: 1.5rem;
}
.hero-left  { display: flex; align-items: flex-start; gap: 14px; }
.hero-icon  { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
.hero-eyebrow { font-size: 11px; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.hero-title { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--color-text-1); margin-bottom: 6px; }
.hero-meta  { font-size: 13px; color: var(--color-text-2); display: flex; align-items: center; flex-wrap: wrap; gap: 0; }
.sep { margin: 0 6px; color: var(--color-text-3); }
.mono { font-family: 'DM Mono', monospace; font-size: 12px; }

.hero-right { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; min-width: 200px; }

.status-block { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 10px; }
.status-ok   { background: var(--color-ok-bg); }
.status-crit { background: var(--color-crit-bg); }
.status-warn { background: var(--color-warn-bg); }
.status-draft { background: var(--color-surface-2); border: 1px solid var(--color-border); }
.status-dot  { width: 8px; height: 8px; border-radius: 50%; }
.dot-ok      { background: var(--color-ok); }
.dot-crit    { background: var(--color-crit); }
.dot-warn    { background: var(--color-warn); }
.dot-neutral { background: var(--color-text-3); }
.status-label { font-size: 11px; color: var(--color-text-2); }
.status-val   { font-size: 13px; font-weight: 600; }

.comp-block { width: 100%; }
.comp-top { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
.comp-label { color: var(--color-text-2); }
.comp-pct   { font-weight: 600; }
.comp-bar   { height: 5px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
.comp-fill  { height: 100%; border-radius: 3px; }
.fill-ok    { background: var(--color-ok); }
.fill-crit  { background: var(--color-crit); }
.fill-warn  { background: var(--color-warn); }
.fill-draft { background: var(--color-text-3); }

.verified-tag {
  font-size: 11px; display: flex; align-items: center; gap: 5px;
  color: var(--color-brand-dark); background: var(--color-ok-bg);
  padding: 4px 10px; border-radius: 20px;
  border: 1px solid rgba(29,158,117,0.2);
}

/* Cert strip */
.cert-strip {
  display: flex; align-items: center; gap: 12px;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 10px 16px;
  margin-bottom: 1.5rem;
}
.cert-strip-label { font-size: 11px; font-weight: 500; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
.cert-list  { display: flex; flex-wrap: wrap; gap: 6px; }
.cert-tag   { font-size: 11px; padding: 3px 10px; border-radius: 6px; background: var(--color-ok-bg); color: var(--color-brand-dark); border: 1px solid rgba(29,158,117,0.15); font-family: 'DM Mono', monospace; }

/* Content grid */
.content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
.content-left { display: flex; flex-direction: column; gap: 0; }
.content-right { display: flex; flex-direction: column; gap: 14px; position: sticky; top: 72px; }

/* Sections */
.section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 12px;
}
.section-title { font-size: 13px; font-weight: 600; color: var(--color-text-1); margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border); }
.section-text  { font-size: 13px; color: var(--color-text-2); line-height: 1.7; }

/* Data table */
.data-table { display: flex; flex-direction: column; }
.data-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid var(--color-border); font-size: 13px; }
.data-row:last-child { border-bottom: none; }
.data-key { color: var(--color-text-2); }
.data-val { font-weight: 500; text-align: right; }
.co2-val  { font-family: 'DM Mono', monospace; font-size: 12px; }
.missing-val { color: var(--color-text-3); font-weight: 400; font-style: italic; }

.energy-badge { background: var(--color-ok-bg); color: var(--color-brand-dark); padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.repair-score { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
.score-ok   { background: var(--color-ok-bg); color: #085041; }
.score-warn { background: var(--color-warn-bg); color: #412402; }
.score-crit { background: var(--color-crit-bg); color: #4A1B0C; }

/* Materials */
.materials { display: flex; flex-direction: column; gap: 12px; }
.mat-row { display: flex; flex-direction: column; gap: 5px; }
.mat-header { display: flex; align-items: center; justify-content: space-between; }
.mat-name { font-size: 13px; font-weight: 500; }
.mat-right { display: flex; align-items: center; gap: 8px; }
.recycled-badge { font-size: 10px; background: var(--color-ok-bg); color: #085041; padding: 2px 7px; border-radius: 10px; }
.mat-pct-val { font-size: 13px; font-weight: 600; color: var(--color-text-1); }
.mat-bar { height: 5px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
.mat-fill { height: 100%; background: var(--color-brand); border-radius: 3px; }
.data-missing-block { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--color-text-3); padding: 1rem; background: var(--color-surface-2); border-radius: 8px; }

/* Supply chain */
.supply-chain { display: flex; flex-direction: column; gap: 8px; }
.chain-card {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  position: relative;
}
.chain-ok      { border-left: 3px solid var(--color-ok); }
.chain-warn    { border-left: 3px solid var(--color-warn); }
.chain-neutral { border-left: 3px solid var(--color-border-strong); }
.chain-step-num { width: 22px; height: 22px; border-radius: 50%; background: var(--color-surface-2); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: var(--color-text-2); flex-shrink: 0; }
.chain-emoji  { font-size: 20px; flex-shrink: 0; }
.chain-body   { flex: 1; }
.chain-stage  { font-size: 13px; font-weight: 600; }
.chain-supplier { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }
.chain-missing  { color: var(--color-text-3); font-style: italic; }
.chain-country  { font-size: 11px; color: var(--color-text-3); margin-top: 2px; }
.chain-co2 { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
.co2-label { font-size: 10px; color: var(--color-text-3); text-transform: uppercase; letter-spacing: 0.04em; }
.co2-val   { font-size: 12px; font-weight: 600; font-family: 'DM Mono', monospace; }
.chain-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.chain-connector { position: absolute; bottom: -16px; left: 32px; font-size: 14px; color: var(--color-text-3); z-index: 1; }

/* Regulations */
.reg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.reg-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1px solid transparent; }
.reg-ok      { background: var(--color-ok-bg);   border-color: rgba(29,158,117,0.2); }
.reg-warn    { background: var(--color-warn-bg);  border-color: rgba(239,159,39,0.2); }
.reg-crit    { background: var(--color-crit-bg);  border-color: rgba(216,90,48,0.2); }
.reg-pending { background: var(--color-info-bg);  border-color: rgba(24,95,165,0.2); }
.reg-icon    { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.reg-icon-ok      { background: rgba(29,158,117,0.15); color: var(--color-ok); }
.reg-icon-warn    { background: rgba(239,159,39,0.15); color: var(--color-warn); }
.reg-icon-crit    { background: rgba(216,90,48,0.15);  color: var(--color-crit); }
.reg-icon-pending { background: rgba(24,95,165,0.15);  color: var(--color-info); }
.reg-body   { display: flex; flex-direction: column; gap: 2px; }
.reg-name   { font-size: 12px; font-weight: 600; }
.reg-status { font-size: 11px; color: var(--color-text-2); }

/* QR Card (right sidebar) */
.qr-card {
  background: var(--color-surface);
  border: 1px solid rgba(29,158,117,0.25);
  border-radius: 14px; padding: 1.1rem;
  background: linear-gradient(160deg, var(--color-ok-bg) 0%, white 60%);
}
.qr-card-header { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.qr-hint { font-size: 12px; color: var(--color-text-2); line-height: 1.5; margin-bottom: 14px; }
.qr-wrap { position: relative; display: flex; justify-content: center; margin-bottom: 14px; }
.qr-canvas { border-radius: 10px; display: block; }
.qr-logo {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: white; border-radius: 7px; padding: 3px;
  box-shadow: 0 0 0 3px white;
}

.url-row {
  display: flex; align-items: center; gap: 7px;
  background: rgba(0,0,0,0.04); border-radius: 8px;
  padding: 7px 9px; margin-bottom: 12px;
}
.url-text {
  flex: 1; font-size: 10px; font-family: 'DM Mono', monospace;
  color: var(--color-text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.copy-btn {
  font-size: 11px; font-weight: 500; font-family: 'DM Sans', sans-serif;
  padding: 4px 8px; border-radius: 6px; cursor: pointer;
  border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-1);
  white-space: nowrap; transition: all 0.15s;
}
.copy-btn.copied { background: var(--color-ok-bg); color: var(--color-ok); border-color: rgba(29,158,117,0.3); }

.share-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-dl, .btn-share {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border-radius: 8px;
  font-size: 12px; font-weight: 500; font-family: 'DM Sans', sans-serif; cursor: pointer;
}
.btn-dl    { background: var(--color-brand); color: white; border: none; }
.btn-dl:hover { background: var(--color-brand-dark); }
.btn-share { background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-1); }
.btn-share:hover { background: var(--color-surface-2); }

/* Info box */
.info-box {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 1rem;
}
.info-title { font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.info-text  { font-size: 12px; color: var(--color-text-2); line-height: 1.6; margin-bottom: 10px; }
.info-links { display: flex; flex-direction: column; gap: 4px; }
.info-link  { font-size: 12px; color: var(--color-brand); text-decoration: none; }
.info-link:hover { color: var(--color-brand-dark); }

/* Timestamp */
.timestamp-card {
  background: var(--color-surface-2); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 0.85rem;
}
.ts-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; border-bottom: 1px solid var(--color-border); }
.ts-row:last-child { border-bottom: none; padding-bottom: 0; }
.ts-row:first-child { padding-top: 0; }
.ts-label { color: var(--color-text-3); }
.ts-val   { font-weight: 500; }
.small    { font-size: 10px; }

/* Not found */
.not-found { display: flex; align-items: center; justify-content: center; padding: 4rem; }
.nf-inner  { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.nf-icon   { font-size: 3rem; }
.nf-inner h1 { font-size: 20px; font-weight: 600; }
.nf-inner p  { font-size: 14px; color: var(--color-text-2); }
.nf-link { font-size: 14px; color: var(--color-brand); text-decoration: none; }
</style>
