<template>
  <div class="public-shell">
    <header class="public-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-mark">
            <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L21 7.5V16.5L14 21L7 16.5V7.5L14 3Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
              <circle cx="14" cy="12" r="2.5" fill="white"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">PassPort DPP</div>
            <div class="brand-sub">Digitaler Produktpass</div>
          </div>
        </div>
        <div class="header-right">
          <span class="eu-tag">
            <svg width="11" height="11" viewBox="0 0 20 20" fill="none"><path d="M10 2L17 5V10C17 13.866 13.866 17 10 18C6.134 17 3 13.866 3 10V5L10 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M7 10l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            EU ESPR-konform
          </span>
          <a href="/login" class="login-link">Anmelden →</a>
        </div>
      </div>
    </header>

    <main class="public-main">
      <slot />
    </main>

    <footer class="public-footer">
      <div class="footer-inner">
        <span>© 2026 PassPort DPP · EU-konformer Digitaler Produktpass</span>
        <span class="footer-links">
          <a href="#">Datenschutz</a>
          <a href="#">Impressum</a>
          <a href="#">API-Dokumentation</a>
        </span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.public-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky; top: 0; z-index: 50;
}

.header-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand { display: flex; align-items: center; gap: 10px; }
.brand-mark {
  width: 30px; height: 30px; border-radius: 7px;
  background: var(--color-brand);
  display: flex; align-items: center; justify-content: center;
}
.brand-name { font-size: 13px; font-weight: 600; color: var(--color-text-1); }
.brand-sub  { font-size: 10px; color: var(--color-text-3); }

.header-right { display: flex; align-items: center; gap: 12px; }

.eu-tag {
  font-size: 11px;
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  background: var(--color-ok-bg); color: var(--color-brand-dark);
  border: 1px solid rgba(29,158,117,0.2);
}

.login-link {
  font-size: 13px; font-weight: 500;
  color: var(--color-brand); text-decoration: none;
}
.login-link:hover { color: var(--color-brand-dark); }

.public-main {
  flex: 1;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  padding: 2rem 1.5rem;
}

.public-footer {
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
  margin-top: 3rem;
}
.footer-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-3);
}
.footer-links { display: flex; gap: 16px; }
.footer-links a { color: var(--color-text-3); text-decoration: none; }
.footer-links a:hover { color: var(--color-text-1); }
</style>
