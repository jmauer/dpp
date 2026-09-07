/**
 * Uebersetzung zwischen Supabase-Zeilen (snake_case) und dem
 * Product-Interface der App (camelCase).
 *
 * Die jsonb-Spalten kommen als beliebiges JSON zurueck und werden hier
 * defensiv normalisiert - eine fehlerhafte Zeile darf nicht die ganze
 * Liste unbrauchbar machen.
 */
import type { ProductRow, PublicPassportRow } from '~/types/database'
import type {
  Product, DppGap, Material, Regulation, SupplyStep, ProductStatus,
} from '~/stores/products'

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

/** Anzeigetext zum Status – rein UI, wird nicht gespeichert. */
export function statusLabel(status: ProductStatus): string {
  return {
    ok:    'Vollständig',
    warn:  'Lückenhaft',
    crit:  'Kritisch',
    draft: 'Entwurf',
  }[status] ?? status
}

/** DB-Zeile → Product */
export function rowToProduct(row: ProductRow): Product {
  return {
    id:                 row.id,
    name:               row.name,
    sku:                row.sku,
    category:           row.category ?? '',
    emoji:              row.emoji ?? '',
    iconBg:             row.icon_bg ?? '',
    iconColor:          row.icon_color ?? '',
    status:             row.status,
    statusLabel:        statusLabel(row.status),
    completeness:       row.completeness ?? 0,
    gaps:               asArray<DppGap>(row.gaps),
    description:        row.description ?? '',
    manufacturer:       row.manufacturer ?? '',
    manufacturingDate:  row.manufacturing_date ?? '',
    countryOfOrigin:    row.country_of_origin ?? '',
    weight:             row.weight ?? '',
    materials:          asArray<Material>(row.materials),
    co2Total:           row.co2_total ?? '',
    energyClass:        row.energy_class ?? '',
    repairabilityIndex: row.repairability_index ?? 0,
    recyclingRate:      row.recycling_rate ?? '',
    regulations:        asArray<Regulation>(row.regulations),
    supplyChain:        asArray<SupplyStep>(row.supply_chain),
    certifications:     asArray<string>(row.certifications),
    publicSlug:         row.public_slug ?? null,
    isPublic:           row.is_public ?? false,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  }
}

/**
 * Zeile der oeffentlichen View → Product.
 * Die View liefert weder `id` noch `gaps`; als Kennung dient der Slug,
 * damit die bestehende Pass-Ansicht unveraendert damit arbeiten kann.
 */
export function publicRowToProduct(row: PublicPassportRow): Product {
  return {
    id:                 row.public_slug ?? '',
    name:               row.name,
    sku:                row.sku,
    category:           row.category ?? '',
    emoji:              row.emoji ?? '',
    iconBg:             row.icon_bg ?? '',
    iconColor:          row.icon_color ?? '',
    status:             row.status,
    statusLabel:        statusLabel(row.status),
    completeness:       row.completeness ?? 0,
    gaps:               [],
    description:        row.description ?? '',
    manufacturer:       row.manufacturer ?? '',
    manufacturingDate:  row.manufacturing_date ?? '',
    countryOfOrigin:    row.country_of_origin ?? '',
    weight:             row.weight ?? '',
    materials:          asArray<Material>(row.materials),
    co2Total:           row.co2_total ?? '',
    energyClass:        row.energy_class ?? '',
    repairabilityIndex: row.repairability_index ?? 0,
    recyclingRate:      row.recycling_rate ?? '',
    regulations:        asArray<Regulation>(row.regulations),
    supplyChain:        asArray<SupplyStep>(row.supply_chain),
    certifications:     asArray<string>(row.certifications),
    publicSlug:         row.public_slug ?? null,
    isPublic:           true,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
  }
}

/**
 * Product (oder Entwurf) → Spalten fuer insert/update.
 * `company_id` setzt der Store, `id`/`created_at`/`updated_at`
 * vergibt bzw. pflegt die Datenbank.
 */
export function productToRow(p: Partial<Product>): Partial<ProductRow> {
  const row: Partial<ProductRow> = {}
  const set = <K extends keyof ProductRow>(k: K, v: ProductRow[K] | undefined) => {
    if (v !== undefined) row[k] = v
  }

  set('name',                p.name)
  set('sku',                 p.sku)
  set('category',            p.category)
  set('emoji',               p.emoji)
  set('icon_bg',             p.iconBg)
  set('icon_color',          p.iconColor)
  set('status',              p.status)
  set('completeness',        p.completeness)
  set('description',         p.description)
  set('manufacturer',        p.manufacturer)
  // Leerstring wuerde als date-Spalte einen Fehler werfen
  set('manufacturing_date',  p.manufacturingDate ? p.manufacturingDate.slice(0, 10) : null)
  set('country_of_origin',   p.countryOfOrigin)
  set('weight',              p.weight)
  set('co2_total',           p.co2Total)
  set('energy_class',        p.energyClass)
  set('repairability_index', p.repairabilityIndex)
  set('recycling_rate',      p.recyclingRate)
  set('materials',           p.materials)
  set('regulations',         p.regulations)
  set('supply_chain',        p.supplyChain)
  set('gaps',                p.gaps)
  set('certifications',      p.certifications)
  set('is_public',           p.isPublic)

  return row
}
