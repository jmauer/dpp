import { defineStore } from 'pinia'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type NotificationType = 'gap_deadline' | 'compliance' | 'supplier' | 'system' | 'export'
export type NotificationSeverity = 'info' | 'warn' | 'crit' | 'ok'

export interface Notification {
  id:        string
  type:      NotificationType
  severity:  NotificationSeverity
  title:     string
  body:      string
  readAt?:   string        // ISO – undefined = unread
  createdAt: string        // ISO
  productId?: string       // if linked to a product
  actionLabel?: string
  actionRoute?: string
}

// ─────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'gap_deadline',
    severity: 'crit',
    title: 'Frist in 30 Tagen: REACH SM-9',
    body: 'Die REACH-Stoffdeklaration für Steuerungsmodul SM-9 muss bis zum 27. Juni 2026 eingereicht werden.',
    createdAt: '2026-05-27T08:00:00Z',
    productId: 'sm-9',
    actionLabel: 'Lücke schließen',
    actionRoute: '/dashboard/products/sm-9',
  },
  {
    id: 'n-2',
    type: 'gap_deadline',
    severity: 'crit',
    title: 'Frist in 14 Tagen: Batterieverordnung LB-2200',
    body: 'State of Health Dokumentation für LB-2200 ist bis 11. Juni 2026 fällig (EU Batterieverordnung Art. 13).',
    createdAt: '2026-05-27T08:05:00Z',
    productId: 'lb-2200',
    actionLabel: 'Jetzt bearbeiten',
    actionRoute: '/dashboard/products/lb-2200',
  },
  {
    id: 'n-3',
    type: 'compliance',
    severity: 'warn',
    title: 'Compliance-Rate gesunken',
    body: 'Die Gesamt-Compliance-Rate ist seit letztem Monat um 0,3 % gesunken. 3 Produkte haben neue Datenlücken.',
    createdAt: '2026-05-25T10:00:00Z',
    actionLabel: 'Zur Compliance-Übersicht',
    actionRoute: '/dashboard/compliance',
  },
  {
    id: 'n-4',
    type: 'supplier',
    severity: 'ok',
    title: 'Lieferant verifiziert',
    body: 'Aurubis AG hat ein aktualisiertes ISO 14001-Zertifikat eingereicht. Lieferkette EM-400X ist vollständig.',
    createdAt: '2026-05-22T14:30:00Z',
    productId: 'em-400x',
    readAt: '2026-05-22T15:00:00Z',
  },
  {
    id: 'n-5',
    type: 'export',
    severity: 'ok',
    title: 'ESPR-Bericht Q2 2026 exportiert',
    body: 'Der Compliance-Bericht für Q2 2026 wurde erfolgreich generiert und steht zum Download bereit.',
    createdAt: '2026-05-27T09:12:00Z',
    readAt: '2026-05-27T09:20:00Z',
    actionLabel: 'Herunterladen',
    actionRoute: '/dashboard/reports',
  },
  {
    id: 'n-6',
    type: 'system',
    severity: 'info',
    title: 'EU ESPR Update – neue Pflichtfelder',
    body: 'Ab Q3 2026 sind zusätzliche Felder zur Reparierbarkeit und Verfügbarkeit von Ersatzteilen im DPP verpflichtend.',
    createdAt: '2026-05-20T12:00:00Z',
  },
]

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useNotificationsStore = defineStore('notifications', () => {

  const _items = ref<Notification[]>(structuredClone(SEED_NOTIFICATIONS))

  // ── Getters ───────────────────────────────

  const all = computed(() =>
    [..._items.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  )

  const unread = computed(() =>
    _items.value.filter(n => !n.readAt)
  )

  const unreadCount = computed(() => unread.value.length)

  const critical = computed(() =>
    _items.value.filter(n => n.severity === 'crit' && !n.readAt)
  )

  // ── Actions ───────────────────────────────

  function getById(id: string): Notification | null {
    return _items.value.find(n => n.id === id) ?? null
  }

  function markRead(id: string) {
    _items.value = _items.value.map(n =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    )
  }

  function markAllRead() {
    const ts = new Date().toISOString()
    _items.value = _items.value.map(n => ({ ...n, readAt: n.readAt ?? ts }))
  }

  function dismiss(id: string) {
    _items.value = _items.value.filter(n => n.id !== id)
  }

  function push(notification: Omit<Notification, 'id' | 'createdAt'>) {
    _items.value = [
      {
        ...notification,
        id:        `n-${Date.now()}`,
        createdAt: new Date().toISOString(),
      },
      ..._items.value,
    ]
  }

  /**
   * Scan the product store for upcoming deadlines and push notifications
   * if not already present. Call this on app init or on a timer.
   */
  function syncFromProducts() {
    const productStore = useProductsStore()
    const today = new Date()

    productStore.allOpenGaps.forEach(gap => {
      if (!gap.deadline) return
      const daysLeft = Math.ceil((new Date(gap.deadline).getTime() - today.getTime()) / 86_400_000)
      if (daysLeft > 60) return  // Only notify within 60 days

      const existingId = `auto-gap-${gap.id}`
      if (_items.value.some(n => n.id === existingId)) return

      push({
        id:           existingId as any,  // overridden inside push()
        type:         'gap_deadline',
        severity:     daysLeft <= 14 ? 'crit' : 'warn',
        title:        `${daysLeft <= 14 ? '⚠️ Kritisch' : 'Frist nähert sich'}: ${gap.label}`,
        body:         `${gap.productName} (${gap.productSku}) – Frist: ${new Date(gap.deadline).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}`,
        productId:    gap.productId,
        actionLabel:  'Lücke schließen',
        actionRoute:  `/dashboard/products/${gap.productId}`,
      })
    })
  }

  return {
    all,
    unread,
    unreadCount,
    critical,
    getById,
    markRead,
    markAllRead,
    dismiss,
    push,
    syncFromProducts,
  }
})
