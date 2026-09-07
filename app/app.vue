<template>
  <NuxtLayout>
    <NuxtPage :transition="pageTransition" />
  </NuxtLayout>
</template>

<script setup lang="ts">
const auth   = useAuthStore()
const { init: initTheme } = useTheme()

// Init theme + restore auth session on mount
onMounted(() => {
  initTheme()
  auth.init()
})

const pageTransition = {
  name: 'page',
  mode: 'out-in' as const,
}
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
