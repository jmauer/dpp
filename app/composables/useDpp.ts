/**
 * useDpp – thin composable layer over the products store.
 * Keeps pages clean: import this instead of wiring stores directly.
 *
 * Usage in any page / component:
 *   const { products, stats, filtered, setSearch, resolveGap } = useDpp()
 */
export function useDpp() {
  const store         = useProductsStore()
  const notifications = useNotificationsStore()

  // ── Convenience shortcuts ──────────────────

  const products         = store.products
  const filtered         = store.filtered
  const stats            = store.stats
  const withCriticalGaps = store.withCriticalGaps
  const allOpenGaps      = store.allOpenGaps
  const categories       = store.categories
  const isLoading        = store.isLoading
  const isSaving         = store.isSaving
  const error            = store.error
  const filters          = store.filters

  // ── Filter helpers ─────────────────────────

  function setSearch(q: string)   { store.setFilter('search', q) }
  function setStatus(s: any)      { store.setFilter('status', s) }
  function setCategory(c: string) { store.setFilter('category', c) }
  function setSortBy(k: any)      { store.setFilter('sortBy', k) }
  function toggleSortDir()        { store.setFilter('sortDir', store.filters.sortDir === 'asc' ? 'desc' : 'asc') }
  function resetFilters()         { store.resetFilters() }

  // ── Gap helpers ───────────────────────────

  async function resolveGap(productId: string, gapId: string) {
    const ok = await store.resolveGap(productId, gapId)
    if (ok) {
      notifications.push({
        type:      'gap_deadline',
        severity:  'ok',
        title:     'Datenlücke geschlossen',
        body:      `Eine offene Lücke wurde erfolgreich als behoben markiert.`,
        productId,
        actionLabel: 'Produkt ansehen',
        actionRoute: `/dashboard/products/${productId}`,
      })
    }
    return ok
  }

  // ── Status helpers ─────────────────────────

  function statusColor(status: string): string {
    return {
      ok:      'var(--color-ok)',
      warn:    'var(--color-warn)',
      crit:    'var(--color-crit)',
      draft:   'var(--color-text-3)',
      pending: 'var(--color-info)',
    }[status] ?? 'var(--color-text-3)'
  }

  function statusBg(status: string): string {
    return {
      ok:      'var(--color-ok-bg)',
      warn:    'var(--color-warn-bg)',
      crit:    'var(--color-crit-bg)',
      draft:   'var(--color-surface-2)',
      pending: 'var(--color-info-bg)',
    }[status] ?? 'var(--color-surface-2)'
  }

  function gapTypeLabel(type: string): string {
    return { missing: 'Fehlt', outdated: 'Veraltet', unverified: 'Nicht verifiziert' }[type] ?? type
  }

  function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
    return new Date(iso).toLocaleDateString('de-DE', opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function daysUntil(iso: string): number {
    return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  }

  return {
    // store passthrough
    store,
    products,
    filtered,
    stats,
    withCriticalGaps,
    allOpenGaps,
    categories,
    isLoading,
    isSaving,
    error,
    filters,
    // methods
    getById:      store.getById,
    getBySku:     store.getBySku,
    fetchAll:     store.fetchAll,
    create:       store.create,
    update:       store.update,
    remove:       store.remove,
    addGap:       store.addGap,
    resolveGap,
    // filter helpers
    setSearch,
    setStatus,
    setCategory,
    setSortBy,
    toggleSortDir,
    resetFilters,
    // display helpers
    statusColor,
    statusBg,
    gapTypeLabel,
    formatDate,
    daysUntil,
  }
}
