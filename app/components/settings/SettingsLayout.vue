<template>
  <div class="settings-shell">

    <!-- ── Settings sidebar nav ── -->
    <aside class="settings-nav" aria-label="Einstellungen Navigation">
      <div class="nav-header">
        <h2 class="nav-heading">{{ t('settings.title') }}</h2>
      </div>

      <nav class="nav-body">
        <div class="nav-group-label">{{ t('settings.sections.account') }}</div>

        <NuxtLink to="/dashboard/settings/profile" class="nav-item" active-class="active">
          <User class="nav-icon" :size="16" aria-hidden="true"/>
          {{ t('settings.nav.profile') }}
        </NuxtLink>

        <NuxtLink to="/dashboard/settings/company" class="nav-item" active-class="active">
          <Building2 class="nav-icon" :size="16" aria-hidden="true"/>
          {{ t('settings.nav.company') }}
        </NuxtLink>

        <div class="nav-group-label">{{ t('settings.sections.dpp') }}</div>

        <NuxtLink to="/dashboard/settings/dpp" class="nav-item" active-class="active">
          <BadgeAlert class="nav-icon" :size="16" aria-hidden="true"/>
          {{ t('settings.nav.dpp') }}
        </NuxtLink>

        <NuxtLink to="/dashboard/settings/regulations" class="nav-item" active-class="active">
          <ShieldCheck class="nav-icon" :size="16" aria-hidden="true"/>
          {{ t('settings.nav.regulations') }}
        </NuxtLink>

        <NuxtLink to="/dashboard/settings/notifications" class="nav-item" active-class="active">
          <BellRing class="nav-icon" :size="16" aria-hidden="true"/>
          {{ t('settings.nav.notifications') }}
        </NuxtLink>

        <div class="nav-group-label">{{ t('settings.sections.system') }}</div>

        <NuxtLink to="/dashboard/settings/integrations" class="nav-item" active-class="active">
          <Webhook class="nav-icon" :size="16" aria-hidden="true"/>
          {{ t('settings.nav.integrations') }}
        </NuxtLink>

        <NuxtLink to="/dashboard/settings/team" class="nav-item" active-class="active">
          <Users class="nav-icon" :size="16" aria-hidden="true"/>
          {{ t('settings.nav.team') }}
        </NuxtLink>
      </nav>
    </aside>

    <!-- ── Content ── -->
    <main class="settings-content" id="settings-content">
      <slot />
    </main>

  </div>
</template>

<script setup lang="ts">
import { User, Users, Building2, BadgeAlert, ShieldCheck, BellRing, Webhook } from '@lucide/vue';
const { t } = useI18n()
</script>

<style scoped>
.settings-shell {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  align-items: start;
}

/* ── Settings nav ── */
.settings-nav {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: sticky;
  top: calc(var(--topbar-h) + 16px);
}

.nav-header {
  padding: 0.9rem 1rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.nav-heading {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-1);
  letter-spacing: -0.01em;
}

.nav-body {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-group-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.7rem 0.5rem 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-2);
  text-decoration: none;
  transition: background var(--t-fast), color var(--t-fast);
}
.nav-item:hover  { background: var(--color-surface-2); color: var(--color-text-1); }
.nav-item.active {
  background: var(--color-brand-light);
  color: var(--color-brand-dark);
  font-weight: 500;
}

.nav-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

/* ── Content ── */
.settings-content { min-width: 0; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .settings-shell { grid-template-columns: 180px 1fr; gap: 14px; }
}

@media (max-width: 767px) {
  .settings-shell {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .settings-nav {
    position: static;
    /* Horizontal scroll on mobile */
    overflow-x: auto;
  }

  .nav-body {
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
    gap: 4px;
    padding: 0.4rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .nav-body::-webkit-scrollbar { display: none; }

  .nav-group-label { display: none; }

  .nav-item {
    flex-shrink: 0;
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
    font-size: 10px;
    text-align: center;
    white-space: nowrap;
  }

  .nav-icon { width: 18px; height: 18px; }
}
</style>
