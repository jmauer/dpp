import type { Product } from '~/stores/products'
import { exportCsv, exportJson, type CsvColumn } from '~/utils/export'

/**
 * useDppExport – alle Export-Aktionen des Dashboards an einer Stelle.
 *
 * Die Export-Buttons auf Dashboard, Produktliste, Compliance, Lieferkette und
 * Einzel-DPP nutzen dieselben Bausteine, damit Spalten und Dateinamen
 * ueberall gleich aussehen.
 */
export function useDppExport() {
  const store         = useProductsStore()
  const notifications = useNotificationsStore()

  /** Offene Luecken eines Produkts zaehlen. */
  const openGaps = (p: Product) => p.gaps.filter(g => !g.resolvedAt).length

  /** Nach jedem Export eine Bestaetigung ins Benachrichtigungspanel legen. */
  function _notify(title: string, body: string) {
    notifications.push({
      type:     'export',
      severity: 'ok',
      title,
      body,
    })
  }

  // ── Produktliste ──────────────────────────

  const productColumns: CsvColumn<Product>[] = [
    { header: 'SKU',                 value: p => p.sku },
    { header: 'Name',                value: p => p.name },
    { header: 'Kategorie',           value: p => p.category },
    { header: 'Hersteller',          value: p => p.manufacturer },
    { header: 'Herkunftsland',       value: p => p.countryOfOrigin },
    { header: 'Status',              value: p => p.statusLabel },
    { header: 'Vollständigkeit (%)', value: p => p.completeness },
    { header: 'Offene Lücken',       value: p => openGaps(p) },
    { header: 'CO2 gesamt',          value: p => p.co2Total },
    { header: 'Energieklasse',       value: p => p.energyClass },
    { header: 'Reparierbarkeit',     value: p => p.repairabilityIndex || '' },
    { header: 'Recyclingquote',      value: p => p.recyclingRate },
    { header: 'Zertifizierungen',    value: p => p.certifications },
    { header: 'Zuletzt geändert',    value: p => new Date(p.updatedAt).toLocaleDateString('de-DE') },
  ]

  /** Produktliste als Tabelle – fuer Excel und Reporting. */
  function exportProductsCsv(products: Product[] = store.filtered, basename = 'DPP-Produkte') {
    if (!products.length) return false
    exportCsv(basename, products, productColumns)
    _notify('Export erstellt', `${products.length} Produkte wurden als CSV exportiert.`)
    return true
  }

  /** Vollstaendiger, maschinenlesbarer Export aller Produktpaesse. */
  function exportProductsJson(products: Product[] = store.products, basename = 'DPP-Gesamtexport') {
    if (!products.length) return false
    exportJson(basename, {
      exportedAt: new Date().toISOString(),
      schema:     'passport-dpp/v1',
      count:      products.length,
      products,
    })
    _notify('Export erstellt', `${products.length} Produktpässe wurden als JSON exportiert.`)
    return true
  }

  /** Einzelner Produktpass als JSON. */
  function exportProduct(product: Product) {
    exportJson(`DPP-${product.sku}`, {
      exportedAt: new Date().toISOString(),
      schema:     'passport-dpp/v1',
      product,
    })
    _notify('Produktpass exportiert', `„${product.name}" wurde als JSON heruntergeladen.`)
    return true
  }

  // ── Compliance / Luecken ──────────────────

  /** Alle offenen Datenluecken als Tabelle – Basis fuer Massnahmenlisten. */
  function exportGapsCsv(basename = 'DPP-Datenluecken') {
    const gaps = store.allOpenGaps
    if (!gaps.length) return false

    const typeLabel: Record<string, string> = {
      missing:    'Fehlt',
      outdated:   'Veraltet',
      unverified: 'Nicht verifiziert',
    }

    exportCsv(basename, gaps, [
      { header: 'Produkt',      value: g => g.productName },
      { header: 'SKU',          value: g => g.productSku },
      { header: 'Lücke',        value: g => g.label },
      { header: 'Typ',          value: g => typeLabel[g.type] ?? g.type },
      { header: 'Regulierung',  value: g => g.regulation ?? '' },
      { header: 'Frist',        value: g => g.deadline ? new Date(g.deadline).toLocaleDateString('de-DE') : '' },
      { header: 'Tage bis Frist', value: g => g.deadline
        ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86_400_000)
        : '' },
    ])
    _notify('Compliance-Export erstellt', `${gaps.length} offene Datenlücken wurden als CSV exportiert.`)
    return true
  }

  // ── Lieferkette ───────────────────────────

  /** Lieferkette aller Produkte, eine Zeile pro Stufe. */
  function exportSupplyChainCsv(products: Product[] = store.products, basename = 'DPP-Lieferkette') {
    const rows = products.flatMap(p =>
      p.supplyChain.map(step => ({ product: p, step })),
    )
    if (!rows.length) return false

    const statusLabel: Record<string, string> = { ok: 'OK', warn: 'Warnung', neutral: 'Neutral' }

    exportCsv(basename, rows, [
      { header: 'Produkt',        value: r => r.product.name },
      { header: 'SKU',            value: r => r.product.sku },
      { header: 'Stufe',          value: r => r.step.label },
      { header: 'Lieferant',      value: r => r.step.supplier ?? '' },
      { header: 'Land',           value: r => r.step.country ?? '' },
      { header: 'CO2',            value: r => r.step.co2 ?? '' },
      { header: 'Status',         value: r => statusLabel[r.step.status] ?? r.step.status },
      { header: 'Zertifiziert bis', value: r => r.step.certifiedUntil
        ? new Date(r.step.certifiedUntil).toLocaleDateString('de-DE')
        : '' },
    ])
    _notify('Lieferketten-Export erstellt', `${rows.length} Lieferkettenstufen wurden als CSV exportiert.`)
    return true
  }

  return {
    exportProductsCsv,
    exportProductsJson,
    exportProduct,
    exportGapsCsv,
    exportSupplyChainCsv,
  }
}
