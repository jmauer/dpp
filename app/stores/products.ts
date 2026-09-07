import { defineStore } from 'pinia'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ProductStatus = 'ok' | 'warn' | 'crit' | 'draft'
export type GapType       = 'missing' | 'outdated' | 'unverified'
export type SupplyStage   = 'raw' | 'preproduction' | 'manufacturing' | 'logistics' | 'endoflife'
export type SupplyStatus  = 'ok' | 'warn' | 'neutral'
export type RegStatus     = 'ok' | 'warn' | 'crit' | 'pending'

export interface DppGap {
  id:          string
  label:       string
  type:        GapType
  regulation?: string
  deadline?:   string          // ISO date string
  resolvedAt?: string
}

export interface Material {
  name:     string
  pct:      number             // 0–100
  recycled: boolean
}

export interface Regulation {
  name:   string
  status: RegStatus
  note?:  string
}

export interface SupplyStep {
  stage:           SupplyStage
  label:           string
  emoji:           string
  status:          SupplyStatus
  supplier?:       string
  country?:        string
  certifiedUntil?: string      // ISO date string
  co2?:            string      // e.g. "12 kg CO₂e" or "—"
}

export interface Product {
  id:                 string
  name:               string
  sku:                string
  category:           string
  emoji:              string
  iconBg:             string
  iconColor:          string
  status:             ProductStatus
  statusLabel:        string
  completeness:       number       // 0–100
  gaps:               DppGap[]
  description:        string
  manufacturer:       string
  manufacturingDate:  string       // ISO date string
  countryOfOrigin:    string
  weight:             string
  materials:          Material[]
  co2Total:           string
  energyClass:        string
  repairabilityIndex: number       // 0–10, 0 = not set
  recyclingRate:      string
  regulations:        Regulation[]
  supplyChain:        SupplyStep[]
  certifications:     string[]
  createdAt:          string       // ISO date string
  updatedAt:          string       // ISO date string
}

// Partial used when creating/updating a product
export type ProductDraft = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'statusLabel' | 'completeness'>

export interface ProductFilter {
  search:   string
  status:   ProductStatus | 'all'
  category: string | 'all'
  sortBy:   'name' | 'completeness' | 'updatedAt' | 'gaps'
  sortDir:  'asc' | 'desc'
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const MISSING_SENTINEL = /^—/

function isDataPresent(val: string | undefined | null): boolean {
  if (!val) return false
  return !MISSING_SENTINEL.test(val.trim())
}

/**
 * Derive status + completeness from the product's current data.
 * Keeps UI consistent without having to manually set these fields.
 */
function deriveStatus(product: Omit<Product, 'status' | 'statusLabel' | 'completeness'>): Pick<Product, 'status' | 'statusLabel' | 'completeness'> {
  const criticalGaps = product.gaps.filter(g => !g.resolvedAt && (g.type === 'missing' || (g.deadline && new Date(g.deadline) < new Date()))).length
  const totalGaps    = product.gaps.filter(g => !g.resolvedAt).length
  const pct          = product.completeness ?? 100    // keep caller-provided value if present

  let status: ProductStatus
  let statusLabel: string

  if (pct === 0) {
    status = 'draft'; statusLabel = 'Entwurf'
  } else if (criticalGaps > 0 || pct < 50) {
    status = 'crit'; statusLabel = 'Kritisch'
  } else if (totalGaps > 0 || pct < 85) {
    status = 'warn'; statusLabel = 'Lückenhaft'
  } else {
    status = 'ok'; statusLabel = 'Vollständig'
  }

  return { status, statusLabel, completeness: pct }
}

function now(): string {
  return new Date().toISOString()
}

function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6)
}


// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useProductsStore = defineStore('products', () => {

  // ── State ─────────────────────────────────
  const _products   = ref<Product[]>([])
  const isLoading   = ref(false)
  const isSaving    = ref(false)
  const error       = ref<string | null>(null)
  const lastFetched = ref<string | null>(null)

  const filters = ref<ProductFilter>({
    search:   '',
    status:   'all',
    category: 'all',
    sortBy:   'updatedAt',
    sortDir:  'desc',
  })

  // ── Getters ───────────────────────────────

  /** All products (unfiltered, reactive) */
  const products = computed(() => _products.value)

  /** All unique categories */
  const categories = computed<string[]>(() => {
    const set = new Set(_products.value.map(p => p.category))
    return Array.from(set).sort()
  })

  /** Filtered + sorted product list */
  const filtered = computed<Product[]>(() => {
    const { search, status, category, sortBy, sortDir } = filters.value
    const q = search.trim().toLowerCase()

    let list = _products.value.filter(p => {
      const matchSearch   = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.manufacturer.toLowerCase().includes(q)
      const matchStatus   = status   === 'all' || p.status   === status
      const matchCategory = category === 'all' || p.category === category
      return matchSearch && matchStatus && matchCategory
    })

    list = [...list].sort((a, b) => {
      let va: string | number
      let vb: string | number
      switch (sortBy) {
        case 'name':         va = a.name;         vb = b.name;         break
        case 'completeness': va = a.completeness; vb = b.completeness; break
        case 'gaps':         va = a.gaps.filter(g => !g.resolvedAt).length; vb = b.gaps.filter(g => !g.resolvedAt).length; break
        case 'updatedAt':
        default:             va = a.updatedAt;    vb = b.updatedAt;    break
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  })

  /** Aggregated KPI stats */
  const stats = computed(() => {
    const all = _products.value
    const totalGaps    = all.reduce((sum, p) => sum + p.gaps.filter(g => !g.resolvedAt).length, 0)
    const criticalGaps = all.reduce((sum, p) => sum + p.gaps.filter(g => !g.resolvedAt && g.type === 'missing').length, 0)
    const avgComplete  = all.length ? Math.round(all.reduce((s, p) => s + p.completeness, 0) / all.length) : 0

    const byStatus: Record<ProductStatus, number> = { ok: 0, warn: 0, crit: 0, draft: 0 }
    all.forEach(p => byStatus[p.status]++)

    // Nearest deadline across all open gaps
    const deadlines = all
      .flatMap(p => p.gaps.filter(g => !g.resolvedAt && g.deadline))
      .map(g => g.deadline!)
      .sort()
    const nextDeadline = deadlines[0] ?? null

    return {
      total:        all.length,
      avgComplete,
      totalGaps,
      criticalGaps,
      byStatus,
      nextDeadline,
      complianceRate: avgComplete,
    }
  })

  /** Products with at least one open critical gap (for the gap overview page) */
  const withCriticalGaps = computed(() =>
    _products.value
      .filter(p => p.gaps.some(g => !g.resolvedAt && (g.type === 'missing' || (g.deadline && new Date(g.deadline) < new Date()))))
      .sort((a, b) => a.completeness - b.completeness)
  )

  /** All open gaps across all products, sorted by deadline then severity */
  const allOpenGaps = computed(() =>
    _products.value
      .flatMap(p => p.gaps
        .filter(g => !g.resolvedAt)
        .map(g => ({ ...g, productId: p.id, productName: p.name, productEmoji: p.emoji, productSku: p.sku }))
      )
      .sort((a, b) => {
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline)
        if (a.deadline) return -1
        if (b.deadline) return 1
        const order: GapType[] = ['missing', 'outdated', 'unverified']
        return order.indexOf(a.type) - order.indexOf(b.type)
      })
  )

  // ── Actions ───────────────────────────────

  /** Find one product by id (reactive) */
  function getById(id: string): Product | null {
    return _products.value.find(p => p.id === id) ?? null
  }

  /** Find one product by SKU */
  function getBySku(sku: string): Product | null {
    return _products.value.find(p => p.sku.toLowerCase() === sku.toLowerCase()) ?? null
  }

  /**
   * Fetch all products from API.
   * Falls back to current state on error so the UI never breaks.
   * TODO: replace URL with your actual backend.
   */
  async function fetchAll(): Promise<void> {
    isLoading.value = true
    error.value     = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<Product[]>('/getAllProducts')
      _products.value = Array.isArray(data) ? data : []
      lastFetched.value = now()
    } catch (e: any) {
      error.value = e?.message ?? 'Fehler beim Laden der Produkte'
      console.error('[ProductStore] fetchAll:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch a single product from the API and merge it into the list.
   */
  async function fetchOne(id: string): Promise<Product | null> {
    isLoading.value = true
    error.value     = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<Product | null>(`/getProduct/${id}`)
      if (data && typeof data === 'object' && data.id) {
        _merge(data)
        return data
      }
      return null
    } catch (e: any) {
      error.value = e?.message ?? 'Fehler beim Laden des Produkts'
      console.error('[ProductStore] fetchOne:', e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create a new product.
   * Optimistic: adds locally immediately, rolls back on error.
   */
  async function create(draft: Omit<ProductDraft, 'completeness'> & { completeness?: number }): Promise<Product | null> {
    isSaving.value = true
    error.value    = null

    const tempId   = generateId(draft.name)
    const ts       = now()
    const derived  = deriveStatus({ ...draft, id: tempId, createdAt: ts, updatedAt: ts, completeness: draft.completeness ?? 0 } as any)
    const newProduct: Product = {
      ...draft,
      id:          tempId,
      createdAt:   ts,
      updatedAt:   ts,
      ...derived,
    }

    // Optimistic insert
    _products.value = [newProduct, ..._products.value]

    try {
      const { apiFetch } = useApi()
      const saved = await apiFetch<Product | null>('/createProduct', {
        method: 'POST',
        body:   newProduct,
      })
      // Replace the optimistic entry with the server response if it returns one.
      if (saved && typeof saved === 'object' && saved.id) {
        _products.value = _products.value.map(p => p.id === tempId ? saved : p)
        return saved
      }
      return newProduct
    } catch (e: any) {
      // Roll back
      _products.value = _products.value.filter(p => p.id !== tempId)
      error.value = e?.message ?? 'Fehler beim Erstellen des Produkts'
      return null
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Update fields on an existing product.
   * Optimistic update with rollback.
   */
  async function update(id: string, patch: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    isSaving.value = true
    error.value    = null

    const idx = _products.value.findIndex(p => p.id === id)
    if (idx === -1) { isSaving.value = false; return null }

    const prev    = { ..._products.value[idx] }
    const updated: Product = {
      ...prev,
      ...patch,
      id,
      updatedAt: now(),
    }
    // Re-derive status if completeness or gaps changed
    const derived = deriveStatus(updated)
    Object.assign(updated, derived)

    // Optimistic update
    _products.value = _products.value.map(p => p.id === id ? updated : p)

    try {
      // await $fetch(`/api/products/${id}`, { method: 'PATCH', body: patch })
      await new Promise(r => setTimeout(r, 400))
      return updated
    } catch (e: any) {
      // Roll back
      _products.value = _products.value.map(p => p.id === id ? prev : p)
      error.value = e?.message ?? 'Fehler beim Speichern'
      return null
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Delete a product. Optimistic with rollback.
   */
  async function remove(id: string): Promise<boolean> {
    isSaving.value = true
    error.value    = null

    const prev = [..._products.value]
    _products.value = _products.value.filter(p => p.id !== id)

    try {
      // await $fetch(`/api/products/${id}`, { method: 'DELETE' })
      await new Promise(r => setTimeout(r, 350))
      return true
    } catch (e: any) {
      _products.value = prev
      error.value = e?.message ?? 'Fehler beim Löschen'
      return false
    } finally {
      isSaving.value = false
    }
  }

  // ── Gap management ────────────────────────

  /** Mark a gap as resolved (optimistic, recalculates status) */
  async function resolveGap(productId: string, gapId: string): Promise<boolean> {
    isSaving.value = true
    const product = getById(productId)
    if (!product) { isSaving.value = false; return false }

    const prevGaps = [...product.gaps]
    const newGaps  = product.gaps.map(g => g.id === gapId ? { ...g, resolvedAt: now() } : g)
    const openCount = newGaps.filter(g => !g.resolvedAt).length
    // Recalculate completeness: simple heuristic (100% minus 10% per open gap, floor 0)
    const newCompleteness = Math.max(0, Math.min(100, Math.round(100 - openCount * 10)))

    await update(productId, { gaps: newGaps, completeness: newCompleteness })
    isSaving.value = false
    return true
  }

  /** Add a new gap to a product */
  async function addGap(productId: string, gap: Omit<DppGap, 'id'>): Promise<boolean> {
    const product = getById(productId)
    if (!product) return false
    const newGap: DppGap = { ...gap, id: `gap-${Date.now()}` }
    const newGaps = [...product.gaps, newGap]
    const result  = await update(productId, { gaps: newGaps })
    return result !== null
  }

  // ── Filter helpers ─────────────────────────

  function setFilter<K extends keyof ProductFilter>(key: K, value: ProductFilter[K]) {
    filters.value[key] = value
  }

  function resetFilters() {
    filters.value = { search: '', status: 'all', category: 'all', sortBy: 'updatedAt', sortDir: 'desc' }
  }

  // ── Internal ───────────────────────────────

  function _merge(incoming: Product) {
    const idx = _products.value.findIndex(p => p.id === incoming.id)
    if (idx >= 0) {
      _products.value = _products.value.map(p => p.id === incoming.id ? incoming : p)
    } else {
      _products.value = [incoming, ..._products.value]
    }
  }

  // ─────────────────────────────────────────
  return {
    // state
    isLoading,
    isSaving,
    error,
    lastFetched,
    filters,
    // getters
    products,
    filtered,
    categories,
    stats,
    withCriticalGaps,
    allOpenGaps,
    // actions
    getById,
    getBySku,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    resolveGap,
    addGap,
    setFilter,
    resetFilters,
  }
})
