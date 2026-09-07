import type { NitroFetchOptions } from 'nitropack'

/**
 * useApi – authenticated wrapper around `$fetch`.
 *
 * Every request targets the configured backend (`apiBase`). When the user is
 * logged in, the stored `api_key` is sent as the `Authorization` header on
 * every request (works for GET and POST alike).
 *
 * Usage:
 *   const { apiFetch } = useApi()
 *   const all = await apiFetch<Product[]>('/getAllProducts')                       // GET
 *   const p   = await apiFetch<Product>('/createProduct', { method: 'POST', body }) // POST
 */
export function useApi() {
  const auth   = useAuthStore()
  const config = useRuntimeConfig()

  function apiFetch<T>(
    url: string,
    opts: NitroFetchOptions<string> = {},
  ): Promise<T> {
    return $fetch<T>(url, {
      baseURL: config.public.apiBase,
      ...opts,
      headers: {
        ...(auth.apiKey ? { Authorization: auth.apiKey } : {}),
        ...opts.headers,
      },
    }) as Promise<T>
  }

  return { apiFetch }
}
