<template>
  <div class="g-page">

    <!-- ── Header ── -->
    <div class="g-page-header">
      <div>
        <h1 class="g-page-title">Neuen Produktpass erstellen</h1>
        <p class="g-page-sub">Erfassen Sie die Stammdaten, Nachhaltigkeitskennzahlen und Lieferkette des Produkts.</p>
      </div>
      <div class="header-actions">
        <NuxtLink to="/dashboard/products" class="g-btn g-btn-secondary">Abbrechen</NuxtLink>
      </div>
    </div>

    <form class="create-form" novalidate @submit.prevent="submit">

      <!-- ── Stammdaten ── -->
      <section class="g-card form-card">
        <h2 class="section-title">Stammdaten</h2>
        <div class="form-grid">
          <div class="field">
            <label for="p-name">Produktname *</label>
            <input id="p-name" v-model.trim="form.name" type="text" class="g-input" placeholder="Elektromotor EM-400X" required />
          </div>
          <div class="field">
            <label for="p-sku">SKU / Artikelnummer *</label>
            <input id="p-sku" v-model.trim="form.sku" type="text" class="g-input" placeholder="EM-400X" required />
          </div>
          <div class="field">
            <label for="p-category">Kategorie</label>
            <input id="p-category" v-model.trim="form.category" type="text" class="g-input" placeholder="Antriebstechnik" />
          </div>
          <div class="field">
            <label for="p-manufacturer">Hersteller</label>
            <input id="p-manufacturer" v-model.trim="form.manufacturer" type="text" class="g-input" placeholder="Muster GmbH" />
          </div>
          <div class="field">
            <label for="p-date">Herstellungsdatum</label>
            <input id="p-date" v-model="form.manufacturingDate" type="date" class="g-input" />
          </div>
          <div class="field">
            <label for="p-country">Herkunftsland</label>
            <input id="p-country" v-model.trim="form.countryOfOrigin" type="text" class="g-input" placeholder="Deutschland" />
          </div>
          <div class="field">
            <label for="p-weight">Gewicht</label>
            <input id="p-weight" v-model.trim="form.weight" type="text" class="g-input" placeholder="48 kg" />
          </div>
          <div class="field">
            <label for="p-completeness">Vollständigkeit (%)</label>
            <input id="p-completeness" v-model.number="form.completeness" type="number" min="0" max="100" class="g-input" />
          </div>
          <div class="field full">
            <label for="p-desc">Beschreibung</label>
            <textarea id="p-desc" v-model.trim="form.description" class="g-input" rows="3" placeholder="Hocheffizienter Drehstrom-Asynchronmotor für industrielle Anwendungen …"></textarea>
          </div>
        </div>
      </section>

      <!-- ── Darstellung ── -->
      <section class="g-card form-card">
        <h2 class="section-title">Darstellung</h2>
        <div class="form-grid">
          <div class="field">
            <label for="p-emoji">Symbol (Emoji)</label>
            <div class="emoji-row">
              <input id="p-emoji" v-model="form.emoji" type="text" class="g-input emoji-input" maxlength="4" />
              <button
                v-for="e in emojiSuggestions"
                :key="e"
                type="button"
                class="emoji-chip"
                :class="{ active: form.emoji === e }"
                @click="form.emoji = e"
              >{{ e }}</button>
            </div>
          </div>
          <div class="field">
            <label for="p-iconbg">Hintergrundfarbe</label>
            <div class="color-row">
              <input id="p-iconbg" v-model="form.iconBg" type="color" class="color-picker" />
              <input v-model="form.iconBg" type="text" class="g-input color-text" />
            </div>
          </div>
          <div class="field">
            <label for="p-iconcolor">Symbolfarbe</label>
            <div class="color-row">
              <input id="p-iconcolor" v-model="form.iconColor" type="color" class="color-picker" />
              <input v-model="form.iconColor" type="text" class="g-input color-text" />
            </div>
          </div>
          <div class="field">
            <label>Vorschau</label>
            <div class="preview-icon" :style="{ background: form.iconBg, color: form.iconColor }">{{ form.emoji }}</div>
          </div>
        </div>
      </section>

      <!-- ── Nachhaltigkeit ── -->
      <section class="g-card form-card">
        <h2 class="section-title">Nachhaltigkeitskennzahlen</h2>
        <div class="form-grid">
          <div class="field">
            <label for="p-co2">CO₂ gesamt</label>
            <input id="p-co2" v-model.trim="form.co2Total" type="text" class="g-input" placeholder="184 kg CO₂e" />
          </div>
          <div class="field">
            <label for="p-energy">Energieklasse</label>
            <input id="p-energy" v-model.trim="form.energyClass" type="text" class="g-input" placeholder="IE4" />
          </div>
          <div class="field">
            <label for="p-repair">Reparierbarkeitsindex (0–10)</label>
            <input id="p-repair" v-model.number="form.repairabilityIndex" type="number" min="0" max="10" step="0.1" class="g-input" />
          </div>
          <div class="field">
            <label for="p-recycling">Recyclingquote</label>
            <input id="p-recycling" v-model.trim="form.recyclingRate" type="text" class="g-input" placeholder="91 %" />
          </div>
          <div class="field full">
            <label for="p-certs">Zertifizierungen (kommagetrennt)</label>
            <input id="p-certs" v-model="certificationsInput" type="text" class="g-input" placeholder="ISO 9001, IEC 60034, ATEX" />
          </div>
        </div>
      </section>

      <!-- ── Materialien ── -->
      <section class="g-card form-card">
        <div class="section-header">
          <h2 class="section-title">Materialzusammensetzung</h2>
          <button type="button" class="g-btn g-btn-secondary sm" @click="addMaterial">+ Material</button>
        </div>
        <div v-if="materials.length" class="rows">
          <div v-for="(m, i) in materials" :key="i" class="row material-row">
            <input v-model.trim="m.name" type="text" class="g-input" placeholder="Kupfer" />
            <input v-model.number="m.pct" type="number" min="0" max="100" class="g-input pct-input" placeholder="%" />
            <label class="recycled-toggle">
              <input v-model="m.recycled" type="checkbox" /> Recycelt
            </label>
            <button type="button" class="icon-btn" aria-label="Entfernen" @click="materials.splice(i, 1)">✕</button>
          </div>
        </div>
        <p v-else class="field-hint">Noch keine Materialien hinzugefügt.</p>
      </section>

      <!-- ── Regularien ── -->
      <section class="g-card form-card">
        <div class="section-header">
          <h2 class="section-title">Regularien</h2>
          <button type="button" class="g-btn g-btn-secondary sm" @click="addRegulation">+ Regulierung</button>
        </div>
        <div v-if="regulations.length" class="rows">
          <div v-for="(r, i) in regulations" :key="i" class="row reg-row">
            <input v-model.trim="r.name" type="text" class="g-input" placeholder="EU ESPR" />
            <select v-model="r.status" class="g-input">
              <option value="ok">Erfüllt</option>
              <option value="warn">In Bearbeitung</option>
              <option value="crit">Lücken offen</option>
              <option value="pending">Ausstehend</option>
            </select>
            <button type="button" class="icon-btn" aria-label="Entfernen" @click="regulations.splice(i, 1)">✕</button>
          </div>
        </div>
        <p v-else class="field-hint">Noch keine Regularien hinzugefügt.</p>
      </section>

      <!-- ── Lieferkette ── -->
      <section class="g-card form-card">
        <div class="section-header">
          <h2 class="section-title">Lieferkette</h2>
          <button type="button" class="g-btn g-btn-secondary sm" @click="addSupplyStep">+ Schritt</button>
        </div>
        <div v-if="supplyChain.length" class="rows">
          <div v-for="(s, i) in supplyChain" :key="i" class="row supply-row">
            <select v-model="s.stage" class="g-input" @change="s.label = s.label || stageLabels[s.stage]">
              <option v-for="(label, val) in stageLabels" :key="val" :value="val">{{ label }}</option>
            </select>
            <input v-model.trim="s.supplier" type="text" class="g-input" placeholder="Lieferant" />
            <input v-model.trim="s.country" type="text" class="g-input" placeholder="Land" />
            <input v-model.trim="s.co2" type="text" class="g-input" placeholder="12 kg CO₂e" />
            <select v-model="s.status" class="g-input status-select">
              <option value="ok">OK</option>
              <option value="warn">Warnung</option>
              <option value="neutral">Neutral</option>
            </select>
            <button type="button" class="icon-btn" aria-label="Entfernen" @click="supplyChain.splice(i, 1)">✕</button>
          </div>
        </div>
        <p v-else class="field-hint">Noch keine Lieferkettenschritte hinzugefügt.</p>
      </section>

      <!-- ── Fehler ── -->
      <div v-if="store.error" class="error-msg" role="alert">{{ store.error }}</div>

      <!-- ── Footer ── -->
      <div class="form-actions">
        <NuxtLink to="/dashboard/products" class="g-btn g-btn-secondary">Abbrechen</NuxtLink>
        <button type="submit" class="g-btn g-btn-primary" :disabled="store.isSaving || !canSubmit">
          <span v-if="!store.isSaving">Produktpass erstellen</span>
          <span v-else>Wird erstellt …</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Material, Regulation, SupplyStep, SupplyStage } from '~/stores/products'

definePageMeta({ layout: 'default', middleware: 'auth' })

const store         = useProductsStore()
const notifications = useNotificationsStore()

const emojiSuggestions = ['📦', '⚡', '⚙️', '🔧', '🔋', '🪑', '👕', '🧴', '💡', '🚗']

const stageLabels: Record<SupplyStage, string> = {
  raw:           'Rohstoffe',
  preproduction: 'Vorproduktion',
  manufacturing: 'Fertigung',
  logistics:     'Logistik',
  endoflife:     'End-of-Life',
}

const stageEmoji: Record<SupplyStage, string> = {
  raw:           '⛏️',
  preproduction: '🏭',
  manufacturing: '⚙️',
  logistics:     '🚛',
  endoflife:     '♻️',
}

const form = reactive({
  name:               '',
  sku:                '',
  category:           '',
  description:        '',
  manufacturer:       '',
  manufacturingDate:  '',
  countryOfOrigin:    '',
  weight:             '',
  emoji:              '📦',
  iconBg:             '#E1F5EE',
  iconColor:          '#0F6E56',
  co2Total:           '',
  energyClass:        '',
  repairabilityIndex: 0,
  recyclingRate:      '',
  completeness:       100,
})

const materials   = ref<Material[]>([])
const regulations = ref<Regulation[]>([])
const supplyChain = ref<SupplyStep[]>([])
const certificationsInput = ref('')

const canSubmit = computed(() => form.name.trim().length > 0 && form.sku.trim().length > 0)

function addMaterial()   { materials.value.push({ name: '', pct: 0, recycled: false }) }
function addRegulation() { regulations.value.push({ name: '', status: 'ok' }) }
function addSupplyStep() {
  supplyChain.value.push({ stage: 'raw', label: stageLabels.raw, emoji: stageEmoji.raw, status: 'ok', supplier: '', country: '', co2: '' })
}

async function submit() {
  if (!canSubmit.value) return

  const draft = {
    name:               form.name,
    sku:                form.sku,
    category:           form.category,
    description:        form.description,
    manufacturer:       form.manufacturer,
    manufacturingDate:  form.manufacturingDate,
    countryOfOrigin:    form.countryOfOrigin,
    weight:             form.weight,
    emoji:              form.emoji,
    iconBg:             form.iconBg,
    iconColor:          form.iconColor,
    co2Total:           form.co2Total,
    energyClass:        form.energyClass,
    repairabilityIndex: form.repairabilityIndex,
    recyclingRate:      form.recyclingRate,
    completeness:       form.completeness,
    gaps:               [],
    materials:          materials.value.filter(m => m.name.trim()),
    regulations:        regulations.value.filter(r => r.name.trim()),
    supplyChain:        supplyChain.value
      .filter(s => s.supplier?.trim() || s.label.trim())
      .map(s => ({ ...s, label: s.label || stageLabels[s.stage], emoji: s.emoji || stageEmoji[s.stage] })),
    certifications:     certificationsInput.value.split(',').map(c => c.trim()).filter(Boolean),
  }

  const created = await store.create(draft)
  if (!created) return   // store.error is shown in the template

  notifications.push({
    type:        'system',
    severity:    'ok',
    title:       'Produktpass erstellt',
    body:        `„${created.name}" wurde erfolgreich angelegt.`,
    productId:   created.id,
    actionLabel: 'Produkt ansehen',
    actionRoute: `/dashboard/products/${created.id}`,
  })

  await navigateTo(`/dashboard/products/${created.id}`)
}
</script>

<style scoped>
.create-form { display: flex; flex-direction: column; gap: 16px; }

.form-card { padding: 1.25rem; }
.section-title  { font-size: 14px; font-weight: 600; margin-bottom: 14px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section-header .section-title { margin-bottom: 0; }

.form-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field      { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
label       { font-size: 12px; font-weight: 500; color: var(--color-text-1); }
.field-hint { font-size: 12px; color: var(--color-text-3); }
textarea.g-input { resize: vertical; font-family: inherit; }

.g-btn.sm { font-size: 12px; padding: 6px 12px; }

/* Emoji picker */
.emoji-row    { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.emoji-input  { width: 56px; text-align: center; font-size: 18px; }
.emoji-chip   { width: 34px; height: 34px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); cursor: pointer; font-size: 16px; line-height: 1; }
.emoji-chip:hover  { border-color: var(--color-brand); }
.emoji-chip.active { border-color: var(--color-brand); background: var(--color-brand-bg, rgba(29,158,117,0.12)); }

/* Color picker */
.color-row    { display: flex; align-items: center; gap: 8px; }
.color-picker { width: 38px; height: 36px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 2px; cursor: pointer; background: none; min-height: unset; }
.color-text   { flex: 1; font-family: 'DM Mono', monospace; font-size: 12px; }

.preview-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }

/* Dynamic rows */
.rows { display: flex; flex-direction: column; gap: 10px; }
.row  { display: grid; align-items: center; gap: 8px; }
.material-row { grid-template-columns: 1fr 90px auto auto; }
.reg-row      { grid-template-columns: 1fr 180px auto; }
.supply-row   { grid-template-columns: 160px 1fr 1fr 1fr 120px auto; }
.pct-input    { text-align: right; }
.recycled-toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; white-space: nowrap; }

.icon-btn { width: 32px; height: 32px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-surface); cursor: pointer; color: var(--color-text-3); flex-shrink: 0; }
.icon-btn:hover { color: var(--color-crit); border-color: var(--color-crit); }

.error-msg {
  font-size: 13px; color: var(--color-crit);
  background: var(--color-crit-bg); padding: 10px 12px; border-radius: 8px;
}

.form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 4px; }

@media (max-width: 720px) {
  .form-grid, .material-row, .reg-row, .supply-row { grid-template-columns: 1fr; }
}
</style>
