/**
 * Zentrale Definition der oeffentlich erreichbaren Routen.
 * Wird von der Route-Middleware und vom initialen Client-Guard genutzt,
 * damit beide garantiert dieselbe Regel anwenden.
 */
export function isPublicRoute(path: string): boolean {
  const publicRoutes = ['/login']
  return publicRoutes.includes(path) || path.startsWith('/p/')
}
