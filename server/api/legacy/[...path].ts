/**
 * Proxy auf die Legacy-DPP-API.
 *
 * Warum: Die Legacy-API laeuft unter http:// ohne TLS. Vercel liefert die App
 * ausschliesslich ueber https aus, und Browser blockieren https -> http als
 * Mixed Content. Der Client spricht deshalb den relativen Pfad /api/legacy/*
 * an, dieser Handler leitet serverseitig weiter. Das loest zugleich CORS,
 * weil der Aufruf fuer den Browser same-origin ist.
 *
 * Beispiel: GET /api/legacy/getAllProducts -> GET http://<legacyApiBase>/getAllProducts
 */
export default defineEventHandler(async (event) => {
  const { legacyApiBase } = useRuntimeConfig(event)

  if (!legacyApiBase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'LEGACY_API_BASE ist nicht konfiguriert.',
    })
  }

  const path = getRouterParam(event, 'path') ?? ''
  const search = getRequestURL(event).search
  const target = `${legacyApiBase.replace(/\/+$/, '')}/${path}${search}`

  try {
    return await proxyRequest(event, target, {
      // Nur die Header weiterreichen, die das Backend wirklich braucht.
      // Insbesondere kein host/origin, sonst antwortet das Backend fehlerhaft.
      headers: {
        ...(getHeader(event, 'authorization')
          ? { authorization: getHeader(event, 'authorization')! }
          : {}),
        ...(getHeader(event, 'content-type')
          ? { 'content-type': getHeader(event, 'content-type')! }
          : {}),
        accept: getHeader(event, 'accept') ?? 'application/json',
      },
    })
  } catch (err: unknown) {
    // Upstream-Status erhalten, damit der Client 401/403 weiterhin unterscheiden kann
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage:
        status === 502 ? 'Legacy-API nicht erreichbar.' : 'Legacy-API-Fehler.',
    })
  }
})
