export default defineNuxtRouteMiddleware(async (to) => {
  // Die Supabase-Session liegt in einem Cookie und ist damit auch
  // serverseitig lesbar. Anders als bei der frueheren localStorage-Loesung
  // kann hier deshalb schon beim SSR entschieden werden - ein Aufblitzen
  // geschuetzter Seiten gibt es nicht mehr.
  const user = useSupabaseUser()
  const auth = useAuthStore()

  if (user.value) {
    // Rolle und Mandant nachladen (idempotent)
    await auth.loadProfile()
  }

  if (!user.value && !isPublicRoute(to.path)) {
    auth.setReturnPath(to.fullPath)
    return navigateTo('/login')
  }

  if (user.value && to.path === '/login') {
    return navigateTo(auth.returnPath || '/dashboard')
  }
})
