/**
 * Zeilentypen der Supabase-Tabellen.
 *
 * Bewusst `type` statt `interface`: supabase-js verlangt fuer Rows
 * `Record<string, unknown>`. Interfaces erfuellen das mangels
 * Index-Signatur nicht - das Schema gilt dann als ungueltig und jede
 * Abfrage ist als `never` typisiert.
 *
 * Handgepflegt statt generiert, damit kein CLI-Zugriff auf das Projekt
 * noetig ist. Muss mit supabase/migrations/ synchron gehalten werden.
 */
// Bewusst ohne Import aus den Stores: die Stores importieren ihrerseits
// den Supabase-Client, dessen Typen wiederum auf diese Datei zeigen.
// Ein Import hier erzeugt einen Zyklus, an dem die Typaufloesung scheitert.
type ProductStatusEnum = 'ok' | 'warn' | 'crit' | 'draft'
type UserRoleEnum      = 'admin' | 'manager' | 'viewer'

export type ProductRow = {
  id:                  string
  company_id:          string
  name:                string
  sku:                 string
  category:            string
  emoji:               string
  icon_bg:             string
  icon_color:          string
  status:              ProductStatusEnum
  completeness:        number
  description:         string
  manufacturer:        string
  manufacturing_date:  string | null
  country_of_origin:   string
  weight:              string
  co2_total:           string
  energy_class:        string
  repairability_index: number
  recycling_rate:      string
  materials:           unknown
  regulations:         unknown
  supply_chain:        unknown
  gaps:                unknown
  certifications:      unknown
  public_slug:         string | null
  is_public:           boolean
  created_at:          string
  updated_at:          string
}

/** Spalten der oeffentlichen View – ohne company_id, gaps, is_public. */
export type PublicPassportRow = Omit<
  ProductRow,
  'id' | 'company_id' | 'gaps' | 'is_public'
>

export type ProfileRow = {
  id:              string
  company_id:      string | null
  email:           string
  personal_number: string
  first_name:    string
  last_name:     string
  role:          UserRoleEnum
  language:      string
  avatar_url:    string | null
  created_at:    string
  last_login_at: string | null
}

export type CompanyRow = {
  id:         string
  name:       string
  created_at: string
}

/**
 * Schema-Typ im Format, das supabase-js erwartet.
 * Ohne diesen Typ sind `insert`/`update` als `never` typisiert und
 * jeder Schreibzugriff scheitert schon in der Typpruefung.
 */
export interface Database {
  public: {
    Tables: {
      products: {
        Row:    ProductRow
        Insert: Partial<ProductRow> & Pick<ProductRow, 'company_id'>
        Update: Partial<ProductRow>
        // Pflichtfeld laut GenericTable von supabase-js. Fehlt es, gilt das
        // Schema als ungueltig und jedes insert/update wird zu `never`.
        Relationships: []
      }
      profiles: {
        Row:    ProfileRow
        Insert: Partial<ProfileRow> & Pick<ProfileRow, 'id' | 'email'>
        Update: Partial<ProfileRow>
        Relationships: []
      }
      companies: {
        Row:    CompanyRow
        Insert: Partial<CompanyRow> & Pick<CompanyRow, 'name'>
        Update: Partial<CompanyRow>
        Relationships: []
      }
    }
    Views: {
      public_product_passports: {
        Row: PublicPassportRow
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: {
      user_role:      'admin' | 'manager' | 'viewer'
      product_status: 'ok' | 'warn' | 'crit' | 'draft'
    }
  }
}
