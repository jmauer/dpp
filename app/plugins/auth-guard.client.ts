/**
 * Absicherung des ersten Seitenaufrufs.
 *
 * Route-Middleware laeuft beim initialen Load nur auf dem Server und wird
 * waehrend der Hydration nicht wiederholt. Da die Session im localStorage
 * liegt, kann erst hier - im Browser - entschieden werden, ob der Aufruf
 * zulaessig war.
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()

  if (auth.status === 'idle') {
    auth.init()
  }

  const route = useRoute()
  if (!auth.isAuthenticated && !isPublicRoute(route.path)) {
    auth.setReturnPath(route.fullPath)
    await navigateTo('/login', { replace: true })
  }
})
