export default defineNuxtRouteMiddleware((to) => {
  // Die Session liegt im localStorage und ist serverseitig nicht lesbar.
  // Wuerde hier trotzdem geprueft, landete jeder SSR-Request auf /login.
  // Client-Navigationen prueft diese Middleware, den ersten Seitenaufruf
  // uebernimmt app/plugins/auth-guard.client.ts.
  if (import.meta.server) return

  const auth = useAuthStore()

  // Restore session on first navigation
  if (auth.status === 'idle') {
    auth.init()
  }

  // Not authenticated → redirect to login, remember where they wanted to go
  if (!auth.isAuthenticated && !isPublicRoute(to.path)) {
    auth.setReturnPath(to.fullPath)
    return navigateTo('/login')
  }

  // Already authenticated → don't show login again
  if (auth.isAuthenticated && to.path === '/login') {
    return navigateTo(auth.returnPath || '/dashboard')
  }
})
