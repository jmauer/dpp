<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">{{ t('settings.dpp.title') }}</h1>
          <p class="g-page-sub">{{ t('settings.dpp.subtitle') }}</p>
        </div>
      </div>

      <!-- ── Completeness thresholds ── -->
      <section class="settings-section" aria-labelledby="s-thresh">
        <div class="section-header">
          <div>
            <h2 id="s-thresh" class="section-title">{{ t('settings.dpp.thresholds') }}</h2>
            <p class="section-sub">Definieren Sie, ab wann ein DPP als „vollständig", „lückenhaft" oder „kritisch" gilt.</p>
          </div>
        </div>
        <div class="g-card">
          <div class="threshold-list">
            <div v-for="th in thresholds" :key="th.key" class="threshold-row">
              <div class="th-left">
                <span class="th-dot" :class="`dot-${th.color}`" aria-hidden="true"/>
                <div>
                  <div class="th-name">{{ th.name }}</div>
                  <div class="th-desc">{{ th.desc }}</div>
                </div>
              </div>
              <div class="th-right">
                <span class="th-prefix">ab</span>
                <input
                  v-model.number="th.value"
                  type="number" min="0" max="100"
                  class="g-input num-input"
                  :aria-label="`Schwellenwert für ${th.name}`"
                />
                <span class="th-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Visual preview bar -->
          <div class="threshold-preview" aria-hidden="true">
            <div class="preview-bar">
              <div class="pb-seg pb-crit"  :style="{ width: thresholds[0].value + '%' }" />
              <div class="pb-seg pb-warn"  :style="{ width: (thresholds[1].value - thresholds[0].value) + '%' }" />
              <div class="pb-seg pb-ok"    :style="{ width: (100 - thresholds[1].value) + '%' }" />
            </div>
            <div class="preview-labels">
              <span class="pl-crit">0–{{ thresholds[0].value }} % {{ t('products.status.crit') }}</span>
              <span class="pl-warn">{{ thresholds[0].value }}–{{ thresholds[1].value }} % {{ t('products.status.warn') }}</span>
              <span class="pl-ok">{{ thresholds[1].value }}–100 % {{ t('products.status.ok') }}</span>
            </div>
          </div>

          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save('thresholds')">{{ t('settings.dpp.save') }}</button>
            <Transition name="fade"><span v-if="saved.thresholds" class="saved-hint" role="status">{{ t('settings.dpp.saved') }}</span></Transition>
          </div>
        </div>
      </section>

      <!-- ── Required fields ── -->
      <section class="settings-section" aria-labelledby="s-fields">
        <div class="section-header">
          <div>
            <h2 id="s-fields" class="section-title">{{ t('settings.dpp.requiredFields') }}</h2>
            <p class="section-sub">Diese Felder müssen ausgefüllt sein, damit ein DPP als vollständig gilt.</p>
          </div>
          <button class="g-btn g-btn-secondary sm" @click="addField">
            {{ t('settings.dpp.addField') }}
          </button>
        </div>
        <div class="g-card">
          <div class="fields-list" role="list">
            <div
              v-for="(f, i) in requiredFields"
              :key="f.id"
              class="field-row"
              role="listitem"
            >
              <span class="drag-handle" aria-hidden="true">⠿</span>
              <div class="field-row-inputs">
                <input v-model="f.label" class="g-input field-label-input" placeholder="Feldname" :aria-label="`Feldname ${i + 1}`" />
                <select v-model="f.regulation" class="g-input field-reg-select" :aria-label="`Verordnung für Feld ${i + 1}`">
                  <option value="">Keine Verordnung</option>
                  <option v-for="reg in regulationOptions" :key="reg" :value="reg">{{ reg }}</option>
                </select>
              </div>
              <label class="g-toggle" :aria-label="`Feld ${f.label || i + 1} ${f.active ? 'deaktivieren' : 'aktivieren'}`">
                <input type="checkbox" v-model="f.active" />
                <span class="g-toggle-track" />
              </label>
              <button
                class="remove-btn"
                :aria-label="`Feld ${f.label || i + 1} entfernen`"
                @click="requiredFields.splice(i, 1)"
              >
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save('fields')">{{ t('settings.dpp.save') }}</button>
            <Transition name="fade"><span v-if="saved.fields" class="saved-hint" role="status">{{ t('settings.dpp.saved') }}</span></Transition>
          </div>
        </div>
      </section>

      <!-- ── QR & Public URL ── -->
      <section class="settings-section" aria-labelledby="s-qr">
        <div class="section-header">
          <div>
            <h2 id="s-qr" class="section-title">{{ t('settings.dpp.qrSection') }}</h2>
            <p class="section-sub">Konfigurieren Sie den öffentlichen Produktpass-Link und den QR-Code.</p>
          </div>
        </div>
        <div class="g-card">
          <div class="form-grid">
            <div class="field full">
              <label>Basis-URL öffentlicher Produktpass</label>
              <div class="url-wrap">
                <span class="url-prefix">https://</span>
                <input v-model="qr.baseDomain" type="text" class="g-input url-input" placeholder="passport.meinefirma.de" />
                <span class="url-suffix">/p/&lt;id&gt;</span>
              </div>
              <p class="field-hint">Beispiel: https://{{ qr.baseDomain || 'passport.meinefirma.de' }}/p/em-400x</p>
            </div>

            <div class="field">
              <label for="qr-ec">QR-Code Fehlerkorrektur</label>
              <select id="qr-ec" v-model="qr.errorCorrection" class="g-input">
                <option value="L">L – Niedrig (7 %)</option>
                <option value="M">M – Mittel (15 %)</option>
                <option value="Q">Q – Gut (25 %)</option>
                <option value="H">H – Hoch (30 %) – empfohlen</option>
              </select>
            </div>

            <div class="field">
              <label for="qr-color">QR-Code Farbe</label>
              <div class="color-row">
                <input id="qr-color" v-model="qr.color" type="color" class="color-picker" :aria-label="qr.color" />
                <input v-model="qr.color" type="text" class="g-input color-text" aria-label="Hex-Farbe" />
              </div>
            </div>

            <div class="field full">
              <label>Logo im QR-Code</label>
              <div class="radio-group" role="radiogroup" aria-label="Logo-Auswahl">
                <label v-for="lo in logoOptions" :key="lo.value" class="radio-opt" :class="{ selected: qr.logo === lo.value }">
                  <input type="radio" v-model="qr.logo" :value="lo.value" class="sr-only" />
                  {{ lo.label }}
                </label>
              </div>
            </div>

            <div class="field full">
              <label class="toggle-label">
                <span>Öffentliche Ansicht ohne Login zugänglich</span>
                <label class="g-toggle" aria-label="Öffentlicher Zugang">
                  <input type="checkbox" v-model="qr.publicAccess" />
                  <span class="g-toggle-track" />
                </label>
              </label>
              <p class="field-hint">Wenn deaktiviert, müssen Besucher sich anmelden, um den Produktpass zu sehen.</p>
            </div>

            <div class="field full">
              <label class="toggle-label">
                <span>Datenlücken in der öffentlichen Ansicht anzeigen</span>
                <label class="g-toggle" aria-label="Datenlücken anzeigen">
                  <input type="checkbox" v-model="qr.showGapsPublic" />
                  <span class="g-toggle-track" />
                </label>
              </label>
            </div>
          </div>
          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save('qr')">{{ t('settings.dpp.save') }}</button>
            <Transition name="fade"><span v-if="saved.qr" class="saved-hint" role="status">{{ t('settings.dpp.saved') }}</span></Transition>
          </div>
        </div>
      </section>

      <!-- ── Auto gap detection ── -->
      <section class="settings-section" aria-labelledby="s-auto">
        <div class="section-header">
          <div>
            <h2 id="s-auto" class="section-title">{{ t('settings.dpp.autoGap') }}</h2>
            <p class="section-sub">Das System prüft regelmäßig alle Produkte und meldet neue Lücken automatisch.</p>
          </div>
        </div>
        <div class="g-card">
          <div class="toggle-rows">
            <div v-for="opt in autoGapOptions" :key="opt.key" class="toggle-row">
              <div class="toggle-row-info">
                <div class="toggle-row-title">{{ opt.title }}</div>
                <div class="toggle-row-desc">{{ opt.desc }}</div>
              </div>
              <label class="g-toggle" :aria-label="`${opt.title} ${opt.value ? 'deaktivieren' : 'aktivieren'}`">
                <input type="checkbox" v-model="opt.value" />
                <span class="g-toggle-track" />
              </label>
            </div>
          </div>

          <div class="g-divider" />

          <div class="field" style="max-width:240px">
            <label for="interval">Prüfintervall</label>
            <select id="interval" v-model="autoGapInterval" class="g-input">
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
          </div>

          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save('autoGap')">{{ t('settings.dpp.save') }}</button>
            <Transition name="fade"><span v-if="saved.autoGap" class="saved-hint" role="status">{{ t('settings.dpp.saved') }}</span></Transition>
          </div>
        </div>
      </section>

    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })
const { t } = useI18n()

const saved = reactive<Record<string, boolean>>({})

async function save(key: string) {
  await new Promise(r => setTimeout(r, 500))
  saved[key] = true
  setTimeout(() => { saved[key] = false }, 3000)
}

const thresholds = reactive([
  { key: 'crit', name: t('products.status.crit'), desc: 'DPP ist unvollständig – dringend Handlungsbedarf', color: 'crit', value: 50 },
  { key: 'warn', name: t('products.status.warn'), desc: 'DPP hat kleinere Lücken – Nachbesserung empfohlen',  color: 'warn', value: 85 },
])

const requiredFields = ref([
  { id: 'f1', label: 'CO₂-Gesamtbilanz',              regulation: 'EU ESPR', active: true  },
  { id: 'f2', label: 'Materialzusammensetzung',        regulation: 'EU ESPR', active: true  },
  { id: 'f3', label: 'Reparierbarkeitsindex',          regulation: 'EU ESPR', active: true  },
  { id: 'f4', label: 'Recyclingquote',                 regulation: 'EU ESPR', active: true  },
  { id: 'f5', label: 'REACH-Stoffdeklaration',         regulation: 'REACH',   active: true  },
  { id: 'f6', label: 'CE-Konformitätserklärung',       regulation: 'CE',      active: true  },
  { id: 'f7', label: 'Lieferanten Tier-1 verifiziert', regulation: 'LkSG',    active: true  },
  { id: 'f8', label: 'State of Health (Batterien)',    regulation: 'EU Batterieverordnung', active: false },
])

const regulationOptions = ['EU ESPR', 'REACH', 'EU Batterieverordnung', 'LkSG', 'RoHS', 'CE', 'ISO 14040']

function addField() {
  requiredFields.value.push({ id: `f${Date.now()}`, label: '', regulation: '', active: true })
}

const qr = reactive({
  baseDomain:      'passport.mustergmbh.de',
  errorCorrection: 'H',
  color:           '#1A1916',
  logo:            'brand',
  publicAccess:    true,
  showGapsPublic:  false,
})

const logoOptions = [
  { value: 'brand', label: 'Firmenlogo' },
  { value: 'dpp',   label: 'PassPort DPP Logo' },
  { value: 'none',  label: 'Kein Logo' },
]

const autoGapOptions = reactive([
  { key: 'expiry',    title: 'Ablaufdatum-Prüfung',         desc: 'Zertifikate und Nachweise auf Gültigkeit prüfen',           value: true  },
  { key: 'reg',       title: 'Neue Regulatorik-Pflichten',  desc: 'Bei neuen EU-Anforderungen automatisch Lücken erstellen',   value: true  },
  { key: 'supplier',  title: 'Lieferanten-Änderungen',      desc: 'Neue Lücken erstellen wenn Lieferanten-Daten sich ändern',  value: false },
  { key: 'co2',       title: 'CO₂-Daten veraltet',          desc: 'Lücke erzeugen wenn CO₂-Daten älter als 12 Monate sind',   value: true  },
])

const autoGapInterval = ref('weekly')
</script>

<style scoped>
.settings-section { display: flex; flex-direction: column; gap: 10px; }
.section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-title  { font-size: 14px; font-weight: 600; }
.section-sub    { font-size: 12px; color: var(--color-text-2); margin-top: 3px; line-height: 1.5; }
.g-btn.sm       { font-size: 12px; padding: 6px 12px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field     { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.full       { grid-column: 1 / -1; }
label       { font-size: 12px; font-weight: 500; color: var(--color-text-1); }
.field-hint { font-size: 11px; color: var(--color-text-3); }

/* Thresholds */
.threshold-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.threshold-row  { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 10px 12px; border-radius: var(--radius-md); background: var(--color-surface-2); border: 1px solid var(--color-border); flex-wrap: wrap; }
.th-left  { display: flex; align-items: center; gap: 10px; flex: 1; }
.th-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-ok   { background: var(--color-ok); }
.dot-warn { background: var(--color-warn); }
.dot-crit { background: var(--color-crit); }
.th-name  { font-size: 13px; font-weight: 500; }
.th-desc  { font-size: 11px; color: var(--color-text-2); margin-top: 2px; }
.th-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.th-prefix, .th-suffix { font-size: 12px; color: var(--color-text-2); }
.num-input { width: 64px !important; text-align: center; padding: 6px 8px; }

.threshold-preview { margin-bottom: 14px; }
.preview-bar { height: 8px; border-radius: 4px; overflow: hidden; display: flex; }
.pb-seg  { height: 100%; transition: width var(--t-slow); }
.pb-crit { background: var(--color-crit); }
.pb-warn { background: var(--color-warn); }
.pb-ok   { background: var(--color-ok); }
.preview-labels { display: flex; justify-content: space-between; margin-top: 5px; }
.pl-crit { font-size: 10px; font-weight: 500; color: var(--color-crit); }
.pl-warn { font-size: 10px; font-weight: 500; color: var(--color-warn); }
.pl-ok   { font-size: 10px; font-weight: 500; color: var(--color-ok); }

/* Required fields */
.fields-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 8px; }
.field-row   { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--radius-md); background: var(--color-surface-2); border: 1px solid var(--color-border); }
.drag-handle { color: var(--color-text-3); cursor: grab; font-size: 14px; user-select: none; flex-shrink: 0; }
.field-row-inputs { flex: 1; display: flex; gap: 8px; min-width: 0; flex-wrap: wrap; }
.field-label-input { flex: 1; min-width: 120px; font-size: 12px; padding: 5px 9px; }
.field-reg-select  { min-width: 150px; font-size: 12px; padding: 5px 9px; cursor: pointer; }
.remove-btn { background: none; border: none; cursor: pointer; color: var(--color-text-3); display: flex; align-items: center; padding: 4px; border-radius: var(--radius-sm); min-height: unset; flex-shrink: 0; }
.remove-btn:hover { color: var(--color-crit); background: var(--color-crit-bg); }

/* URL */
.url-wrap   { display: flex; align-items: center; border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; background: var(--color-surface); }
.url-prefix, .url-suffix { padding: 9px 10px; font-size: 12px; color: var(--color-text-3); background: var(--color-surface-2); white-space: nowrap; font-family: 'DM Mono', monospace; border: none; }
.url-prefix { border-right: 1px solid var(--color-border); }
.url-suffix { border-left: 1px solid var(--color-border); }
.url-input  { flex: 1; border: none !important; border-radius: 0 !important; font-family: 'DM Mono', monospace; font-size: 12px; }

/* Color picker */
.color-row    { display: flex; align-items: center; gap: 8px; }
.color-picker { width: 38px; height: 36px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 2px; cursor: pointer; background: none; min-height: unset; }
.color-text   { flex: 1; font-family: 'DM Mono', monospace; font-size: 12px; }

/* Radio group */
.radio-group { display: flex; flex-direction: column; gap: 7px; }
.radio-opt   { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: var(--radius-md); border: 1px solid var(--color-border); cursor: pointer; font-size: 13px; transition: border-color var(--t-fast); }
.radio-opt.selected { border-color: var(--color-brand); background: var(--color-ok-bg); }
.radio-opt:hover:not(.selected) { background: var(--color-surface-2); }

/* Toggle label */
.toggle-label { display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 13px; font-weight: 500; gap: 12px; }

/* Toggle rows */
.toggle-rows { display: flex; flex-direction: column; }
.toggle-row  { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--color-border); gap: 16px; }
.toggle-row:last-child { border-bottom: none; }
.toggle-row-title { font-size: 13px; font-weight: 500; }
.toggle-row-desc  { font-size: 11px; color: var(--color-text-2); margin-top: 2px; }

.form-footer { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid var(--color-border); margin-top: 8px; }
.saved-hint  { font-size: 12px; color: var(--color-ok); font-weight: 500; }

.fade-enter-active, .fade-leave-active { transition: opacity var(--t-fast); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .field.full, .full { grid-column: 1; }
  .field-row-inputs { flex-direction: column; }
  .field-reg-select { min-width: unset; width: 100%; }
}
</style>
