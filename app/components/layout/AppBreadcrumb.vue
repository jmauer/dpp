<template>
  <nav class="breadcrumb">
    <template v-for="(crumb, i) in crumbs" :key="crumb.path">
      <span v-if="i > 0" class="sep">/</span>
      <NuxtLink v-if="i < crumbs.length - 1" :to="crumb.path" class="crumb-link">
        {{ crumb.label }}
      </NuxtLink>
      <span v-else class="crumb-current">{{ crumb.label }}</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()

const labelMap = computed<Record<string, string>>(() => ({
  '':              t('nav.dashboard'),           
  'dashboard':     t('nav.dashboard'),
  'products':      t('nav.passports'),
  'supply-chain':  t('nav.supplyChain'),
  'compliance':    t('nav.compliance'),
  'reports':       t('nav.reports'),
  'settings':      t('settings.title'),
  'profile':       t('settings.nav.profile'),
  'company':       t('settings.nav.company'),
  'dpp':           t('settings.nav.dpp'),
  'regulations':   t('settings.nav.regulations'),
  'notifications': t('settings.nav.notifications'),
  'integrations':  t('settings.nav.integrations'),
  'team':          t('settings.nav.team'),
}))

const crumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  return parts.map((part, i) => ({
    label: labelMap.value[part] ?? part,
    path:  '/' + parts.slice(0, i + 1).join('/'),
  }))
})
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1;        /* prevent inherited line-height from pushing items */
}
.sep {
  color: var(--color-text-3);
  /* explicit inline-flex so it centres the same as the links */
  display: inline-flex;
  align-items: center;
}
.crumb-link {
  /* inline-flex makes <a> behave like a flex child — same baseline as <span> */
  display: inline-flex;
  align-items: center;
  color: var(--color-text-2);
  text-decoration: none;
  line-height: 1;
}
.crumb-link:hover { color: var(--color-text-1); }
.crumb-current {
  display: inline-flex;
  align-items: center;
  color: var(--color-text-1);
  font-weight: 500;
  line-height: 1;
}
</style>