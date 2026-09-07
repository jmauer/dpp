<template>
  <div class="auth-shell">
    <!-- Left: Branding panel -->
    <div class="auth-brand">
      <div class="brand-inner">
        <div class="brand-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="white" fill-opacity="0.15"/>
            <path d="M14 5L19.5 8.25V14.75L14 18L8.5 14.75V8.25L14 5Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
            <circle cx="14" cy="11.5" r="2" fill="white"/>
          </svg>
          <span class="brand-name">PassPort DPP</span>
        </div>

        <div class="brand-tagline">
          <h1>Digitaler Produktpass.<br>Einfach. Compliant. Transparent.</h1>
          <p>Die Enterprise-Plattform für mittelständische und große Unternehmen zur Verwaltung aller EU-konformen Produktpässe.</p>
        </div>

        <div class="brand-stats">
          <div class="stat">
            <span class="stat-val">2.847</span>
            <span class="stat-label">Aktive Pässe</span>
          </div>
          <div class="stat">
            <span class="stat-val">94,2 %</span>
            <span class="stat-label">Compliance-Rate</span>
          </div>
          <div class="stat">
            <span class="stat-val">187</span>
            <span class="stat-label">Verifizierte Lieferanten</span>
          </div>
        </div>

        <p class="brand-legal">EU ESPR-konform · ISO 14040 · Batterieverordnung</p>
      </div>
    </div>

    <!-- Right: Form slot -->
    <div class="auth-form-area">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

/* Brand panel */
.auth-brand {
  background: linear-gradient(145deg, #0F6E56 0%, #1D9E75 50%, #14856A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;
}

.auth-brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%),
    radial-gradient(ellipse 40% 60% at 20% 80%, rgba(0,0,0,0.12) 0%, transparent 60%);
}

.brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 400px;
  color: white;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.brand-tagline h1 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
}

.brand-tagline p {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255,255,255,0.72);
}

.brand-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.stat-val {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.brand-legal {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  letter-spacing: 0.02em;
}

/* Form area */
.auth-form-area {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: var(--color-bg);
}

@media (max-width: 768px) {
  .auth-shell { grid-template-columns: 1fr; }
  .auth-brand { display: none; }
}
</style>
