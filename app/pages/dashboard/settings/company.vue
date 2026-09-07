<template>
  <SettingsLayout>
    <div class="g-page">
      <div class="g-page-header">
        <div>
          <h1 class="g-page-title">{{ t('settings.nav.company') }}</h1>
          <p class="g-page-sub">Unternehmensprofil, Branding und Billing verwalten</p>
        </div>
      </div>

      <!-- ── Company info ── -->
      <section class="settings-section" aria-labelledby="s-company">
        <div class="section-header">
          <h2 id="s-company" class="section-title">Unternehmensprofil</h2>
        </div>
        <div class="g-card form-card">
          <!-- Logo -->
          <div class="logo-row">
            <div class="company-logo" aria-label="Firmenlogo">
              <span>{{ auth.user?.company?.charAt(0) ?? 'M' }}</span>
            </div>
            <div class="logo-info">
              <button class="g-btn g-btn-secondary sm">Logo hochladen</button>
              <p class="field-hint">PNG oder SVG, empfohlen 200×200 px</p>
            </div>
          </div>

          <div class="g-divider" />

          <form class="form-grid" novalidate @submit.prevent="save('company')">
            <div class="field full">
              <label for="co-name">Unternehmensname</label>
              <input id="co-name" v-model="company.name" type="text" class="g-input" placeholder="Muster GmbH" />
            </div>
            <div class="field">
              <label for="co-legal">Rechtsform</label>
              <select id="co-legal" v-model="company.legalForm" class="g-input">
                <option value="GmbH">GmbH</option>
                <option value="AG">AG</option>
                <option value="GmbH & Co. KG">GmbH & Co. KG</option>
                <option value="OHG">OHG</option>
                <option value="SE">SE</option>
                <option value="other">Sonstige</option>
              </select>
            </div>
            <div class="field">
              <label for="co-industry">Branche</label>
              <select id="co-industry" v-model="company.industry" class="g-input">
                <option value="manufacturing">Fertigung & Industrie</option>
                <option value="automotive">Automotive</option>
                <option value="electronics">Elektronik</option>
                <option value="energy">Energie</option>
                <option value="chemical">Chemie</option>
                <option value="other">Sonstige</option>
              </select>
            </div>
            <div class="field">
              <label for="co-size">Unternehmensgröße</label>
              <select id="co-size" v-model="company.size" class="g-input">
                <option value="1-50">1–50 Mitarbeiter</option>
                <option value="51-250">51–250 Mitarbeiter</option>
                <option value="251-1000">251–1.000 Mitarbeiter</option>
                <option value="1001+">Über 1.000 Mitarbeiter</option>
              </select>
            </div>
            <div class="field">
              <label for="co-country">Land</label>
              <select id="co-country" v-model="company.country" class="g-input">
                <option value="DE">🇩🇪 Deutschland</option>
                <option value="AT">🇦🇹 Österreich</option>
                <option value="CH">🇨🇭 Schweiz</option>
                <option value="FR">🇫🇷 Frankreich</option>
                <option value="NL">🇳🇱 Niederlande</option>
                <option value="other">Anderes EU-Land</option>
              </select>
            </div>
            <div class="field full">
              <label for="co-web">Website</label>
              <input id="co-web" v-model="company.website" type="url" class="g-input" placeholder="https://www.meinefirma.de" />
            </div>
            <div class="field full">
              <label for="co-vat">USt-IdNr.</label>
              <input id="co-vat" v-model="company.vatId" type="text" class="g-input" placeholder="DE123456789" />
              <p class="field-hint">Wird auf DPP-Berichten und Exporten angezeigt.</p>
            </div>

            <div class="form-footer full">
              <button type="submit" class="g-btn g-btn-primary">{{ t('common.save') }}</button>
              <Transition name="fade">
                <span v-if="saved.company" class="saved-hint" role="status">✓ {{ t('settings.dpp.saved') }}</span>
              </Transition>
            </div>
          </form>
        </div>
      </section>

      <!-- ── DPP branding ── -->
      <section class="settings-section" aria-labelledby="s-branding">
        <div class="section-header">
          <h2 id="s-branding" class="section-title">DPP-Branding</h2>
          <p class="section-sub-inline">Öffentliche Produktpässe mit Ihrem Design</p>
        </div>
        <div class="g-card form-card">
          <div class="form-grid">
            <div class="field">
              <label for="brand-color">Primärfarbe</label>
              <div class="color-row">
                <input id="brand-color" v-model="branding.primaryColor" type="color" class="color-picker" />
                <input v-model="branding.primaryColor" type="text" class="g-input color-text" />
              </div>
            </div>
            <div class="field">
              <label for="brand-font">Schriftart</label>
              <select id="brand-font" v-model="branding.font" class="g-input">
                <option value="DM Sans">DM Sans (Standard)</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="system">Systemschrift</option>
              </select>
            </div>
            <div class="field full">
              <label class="toggle-label">
                <span>Firmenlogo auf öffentlichen Pässen zeigen</span>
                <label class="g-toggle" aria-label="Firmenlogo anzeigen">
                  <input type="checkbox" v-model="branding.showLogo" />
                  <span class="g-toggle-track" />
                </label>
              </label>
            </div>
            <div class="field full">
              <label class="toggle-label">
                <span>„Powered by PassPort DPP" Footer ausblenden</span>
                <label class="g-toggle" aria-label="PassPort Footer ausblenden">
                  <input type="checkbox" v-model="branding.hideFooter" />
                  <span class="g-toggle-track" />
                </label>
              </label>
              <p class="field-hint">Nur im Enterprise-Plan verfügbar.</p>
            </div>
          </div>
          <div class="form-footer">
            <button class="g-btn g-btn-primary" @click="save('branding')">{{ t('common.save') }}</button>
            <Transition name="fade">
              <span v-if="saved.branding" class="saved-hint" role="status">✓ {{ t('settings.dpp.saved') }}</span>
            </Transition>
          </div>
        </div>
      </section>

      <!-- ── Plan & Billing ── -->
      <section class="settings-section" aria-labelledby="s-billing">
        <div class="section-header">
          <h2 id="s-billing" class="section-title">Plan & Billing</h2>
        </div>
        <div class="g-card plan-card">
          <div class="plan-info">
            <div class="plan-badge">Enterprise</div>
            <div class="plan-desc">
              Unbegrenzte Produktpässe · 24 EU-Sprachen · Dedizierter Support · SLA 99,9 %
            </div>
          </div>
          <div class="plan-divider" />
          <div class="plan-stats">
            <div class="ps-item">
              <div class="ps-val">2.847</div>
              <div class="ps-label">Aktive Pässe</div>
            </div>
            <div class="ps-item">
              <div class="ps-val">∞</div>
              <div class="ps-label">Limit</div>
            </div>
            <div class="ps-item">
              <div class="ps-val">187</div>
              <div class="ps-label">Lieferanten</div>
            </div>
            <div class="ps-item">
              <div class="ps-val">24</div>
              <div class="ps-label">Sprachen</div>
            </div>
          </div>
          <div class="plan-footer">
            <div class="renewal-info">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 7v3l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              Verlängerung am 1. Januar 2027
            </div>
            <button class="g-btn g-btn-secondary sm">Rechnung herunterladen</button>
          </div>
        </div>
      </section>

    </div>
  </SettingsLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const { t }  = useI18n()
const auth   = useAuthStore()
const saved  = reactive<Record<string, boolean>>({})

async function save(key: string) {
  await new Promise(r => setTimeout(r, 500))
  saved[key] = true
  setTimeout(() => { saved[key] = false }, 3000)
}

const company = reactive({
  name:      auth.user?.company ?? 'Muster GmbH',
  legalForm: 'GmbH',
  industry:  'manufacturing',
  size:      '251-1000',
  country:   'DE',
  website:   'https://www.mustergmbh.de',
  vatId:     'DE123456789',
})

const branding = reactive({
  primaryColor: '#1D9E75',
  font:         'DM Sans',
  showLogo:     true,
  hideFooter:   false,
})
</script>

<style scoped>
.settings-section   { display: flex; flex-direction: column; gap: 10px; }
.section-header     { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.section-title      { font-size: 14px; font-weight: 600; }
.section-sub-inline { font-size: 12px; color: var(--color-text-2); margin-top: 2px; }

.form-card { padding: 1.25rem; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.field     { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.full       { grid-column: 1 / -1; }
label       { font-size: 12px; font-weight: 500; color: var(--color-text-1); }
.field-hint { font-size: 11px; color: var(--color-text-3); }
.g-btn.sm   { font-size: 12px; padding: 6px 12px; }

/* Logo */
.logo-row    { display: flex; align-items: center; gap: 16px; margin-bottom: 14px; }
.company-logo { width: 56px; height: 56px; border-radius: 12px; background: var(--color-brand); color: white; font-size: 22px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.logo-info   { display: flex; flex-direction: column; gap: 5px; }

/* Color picker */
.color-row    { display: flex; align-items: center; gap: 8px; }
.color-picker { width: 38px; height: 36px; border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 2px; cursor: pointer; background: none; min-height: unset; }
.color-text   { flex: 1; font-family: 'DM Mono', monospace; font-size: 12px; }

/* Toggle label */
.toggle-label { display: flex; align-items: center; justify-content: space-between; cursor: pointer; font-size: 13px; font-weight: 500; gap: 12px; }

/* Plan card */
.plan-card   { display: flex; flex-direction: column; gap: 16px; }
.plan-info   { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.plan-badge  { font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; background: linear-gradient(135deg, var(--color-brand), var(--color-brand-dark)); color: white; white-space: nowrap; }
.plan-desc   { font-size: 13px; color: var(--color-text-2); line-height: 1.6; flex: 1; }
.plan-divider { height: 1px; background: var(--color-border); }
.plan-stats  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }
.ps-item     { padding: 12px 14px; border-right: 1px solid var(--color-border); }
.ps-item:last-child { border-right: none; }
.ps-val      { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--color-brand); }
.ps-label    { font-size: 11px; color: var(--color-text-2); margin-top: 3px; }
.plan-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
.renewal-info { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-2); }

.form-footer { display: flex; align-items: center; gap: 12px; padding-top: 14px; border-top: 1px solid var(--color-border); margin-top: 4px; }
.saved-hint  { font-size: 12px; color: var(--color-ok); font-weight: 500; }

.fade-enter-active, .fade-leave-active { transition: opacity var(--t-fast); }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .form-grid  { grid-template-columns: 1fr; }
  .field.full, .full { grid-column: 1; }
  .plan-stats { grid-template-columns: 1fr 1fr; }
  .ps-item:nth-child(2n) { border-right: none; }
  .ps-item { border-bottom: 1px solid var(--color-border); }
  .ps-item:nth-child(3), .ps-item:nth-child(4) { border-bottom: none; }
}
</style>
