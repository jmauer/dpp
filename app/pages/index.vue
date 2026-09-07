<script setup lang="ts">
/**
 * Einstiegsseite – leitet direkt aufs Dashboard weiter.
 *
 * Der Redirect gehoert in die Middleware, nicht ins Setup: ein
 * `await navigateTo(...)` auf oberster Setup-Ebene bricht den SSR-Render
 * mittendrin ab. Der `app:rendered`-Hook von Pinia laeuft danach ohne
 * gebundene Nuxt-Instanz und wirft
 * "Cannot read properties of undefined (reading 'state')".
 * Als Middleware wird der Redirect ausgeliefert, bevor gerendert wird.
 */
definePageMeta({
  middleware: ['auth', () => navigateTo('/dashboard', { replace: true })],
})
</script>

<template>
  <!-- Wird nie sichtbar: die Middleware leitet vorher weiter. -->
  <div />
</template>
