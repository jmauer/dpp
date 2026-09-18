import { defineStore } from 'pinia'

/**
 * Zentraler Einstellungs-Store.
 *
 * Alle Settings-Seiten lasen ihre Werte bisher aus lokalen `reactive()`-
 * Bloecken – nach einem Reload war jede Aenderung weg. Hier liegen sie nun an
 * einer Stelle und werden ueber die Legacy-API persistiert.
 *
 * ── Backend-Vertrag ───────────────────────────────────────────────────────
 *   GET  /getSettings                     -> Partial<SettingsState>
 *   POST /saveSettings  { section, data } -> beliebige Antwort (wird ignoriert)
 *
 * Die Endpunktnamen folgen der Konvention der uebrigen Routen
 * (/getAllProducts, /createProduct, /getUser …). Heissen sie serverseitig
 * anders, sind nur die beiden Konstanten unten anzupassen.
 */

const ENDPOINT_GET  = '/getSettings'
const ENDPOINT_SAVE = '/saveSettings'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SettingsSection =
  | 'company' | 'branding'
  | 'thresholds' | 'fields' | 'qr' | 'autoGap'
  | 'regs' | 'deadlines'
  | 'notifications'
  | 'integrations'

export interface CompanySettings {
  name:      string
  legalForm: string
  industry:  string
  size:      string
  country:   string
  website:   string
  vatId:     string
  /** Data-URL des hochgeladenen Logos, leer = Initiale anzeigen */
  logoUrl:   string
}

export interface BrandingSettings {
  primaryColor: string
  font:         string
  showLogo:     boolean
  hideFooter:   boolean
}

export interface Threshold {
  key:   string
  desc:  string
  color: string
  value: number
}

export interface RequiredField {
  id:         string
  label:      string
  regulation: string
  active:     boolean
}

export interface QrSettings {
  baseDomain:      string
  errorCorrection: string
  color:           string
  logo:            string
  publicAccess:    boolean
  showGapsPublic:  boolean
}

export interface AutoGapOption {
  key:   string
  title: string
  desc:  string
  value: boolean
}

export interface RegulationSetting {
  id:          string
  name:        string
  description: string
  isEu:        boolean
  active:      boolean
  status:      string
  deadline:    string | null
  link:        string
}

export interface DeadlineSetting {
  key:   string
  label: string
  desc:  string
  days:  number
}

export interface NotificationChannel {
  id:        string
  icon:      string
  name:      string
  desc:      string
  active:    boolean
  connected: boolean
  /** Ziel der Verbindung – Slack-Webhook-URL bzw. beliebige HTTP-Endpunkt-URL */
  target?:   string
}

export interface NotificationEvent {
  id:        string
  name:      string
  desc:      string
  channels:  Record<string, boolean>
  frequency: string
}

export interface DigestSettings {
  active: boolean
  day:    string
  time:   string
}

export interface ApiKey {
  id:        string
  name:      string
  scopes:    string[]
  createdAt: string
  lastUsed:  string | null
  value:     string
}

export interface Webhook {
  id:         string
  url:        string
  events:     string[]
  active:     boolean
  lastStatus: number | null
  lastFired:  string | null
}

export interface SystemIntegration {
  id:        string
  icon:      string
  name:      string
  desc:      string
  connected: boolean
  since:     string | null
}

export interface SettingsState {
  company:        CompanySettings
  branding:       BrandingSettings
  thresholds:     Threshold[]
  requiredFields: RequiredField[]
  qr:             QrSettings
  autoGap:        { options: AutoGapOption[]; interval: string }
  regulations:    RegulationSetting[]
  deadlines:      DeadlineSetting[]
  notifications:  {
    channels: NotificationChannel[]
    events:   NotificationEvent[]
    digest:   DigestSettings
  }
  integrations: {
    apiKeys:  ApiKey[]
    webhooks: Webhook[]
    systems:  SystemIntegration[]
  }
}

// ─────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────

/**
 * Ausgangszustand, solange das Backend noch nichts geliefert hat.
 * Bewusst als Funktion: jeder Aufruf liefert frische Objekte, sonst teilen
 * sich Store-Instanzen (und Tests) dieselben verschachtelten Referenzen.
 */
function defaults(): SettingsState {
  return {
    company: {
      name:      '',
      legalForm: 'GmbH',
      industry:  'manufacturing',
      size:      '251-1000',
      country:   'DE',
      website:   '',
      vatId:     '',
      logoUrl:   '',
    },
    branding: {
      primaryColor: '#1D9E75',
      font:         'DM Sans',
      showLogo:     true,
      hideFooter:   false,
    },
    thresholds: [
      { key: 'crit', desc: 'DPP ist unvollständig – dringend Handlungsbedarf', color: 'crit', value: 50 },
      { key: 'warn', desc: 'DPP hat kleinere Lücken – Nachbesserung empfohlen', color: 'warn', value: 85 },
    ],
    requiredFields: [
      { id: 'f1', label: 'CO₂-Gesamtbilanz',              regulation: 'EU ESPR', active: true  },
      { id: 'f2', label: 'Materialzusammensetzung',        regulation: 'EU ESPR', active: true  },
      { id: 'f3', label: 'Reparierbarkeitsindex',          regulation: 'EU ESPR', active: true  },
      { id: 'f4', label: 'Recyclingquote',                 regulation: 'EU ESPR', active: true  },
      { id: 'f5', label: 'REACH-Stoffdeklaration',         regulation: 'REACH',   active: true  },
      { id: 'f6', label: 'CE-Konformitätserklärung',       regulation: 'CE',      active: true  },
      { id: 'f7', label: 'Lieferanten Tier-1 verifiziert', regulation: 'LkSG',    active: true  },
      { id: 'f8', label: 'State of Health (Batterien)',    regulation: 'EU Batterieverordnung', active: false },
    ],
    qr: {
      baseDomain:      '',
      errorCorrection: 'H',
      color:           '#1A1916',
      logo:            'brand',
      publicAccess:    true,
      showGapsPublic:  false,
    },
    autoGap: {
      options: [
        { key: 'expiry',   title: 'Ablaufdatum-Prüfung',        desc: 'Zertifikate und Nachweise auf Gültigkeit prüfen',          value: true  },
        { key: 'reg',      title: 'Neue Regulatorik-Pflichten', desc: 'Bei neuen EU-Anforderungen automatisch Lücken erstellen',  value: true  },
        { key: 'supplier', title: 'Lieferanten-Änderungen',     desc: 'Neue Lücken erstellen wenn Lieferanten-Daten sich ändern', value: false },
        { key: 'co2',      title: 'CO₂-Daten veraltet',         desc: 'Lücke erzeugen wenn CO₂-Daten älter als 12 Monate sind',   value: true  },
      ],
      interval: 'weekly',
    },
    regulations: [
      { id: 'espr',    name: 'EU ESPR',                     description: 'Ökodesign-Verordnung für nachhaltige Produkte',                     isEu: true,  active: true,  status: 'warn',     deadline: '2026-12-31', link: 'https://ec.europa.eu/environment/ecodesign' },
      { id: 'battery', name: 'EU Batterieverordnung',       description: 'Nachhaltigkeits- und Sicherheitsanforderungen für Batterien',       isEu: true,  active: true,  status: 'crit',     deadline: '2026-06-11', link: 'https://environment.ec.europa.eu/topics/waste-and-recycling/batteries_en' },
      { id: 'reach',   name: 'REACH',                       description: 'Registrierung, Bewertung und Zulassung chemischer Stoffe',          isEu: true,  active: true,  status: 'warn',     deadline: '2026-06-27', link: 'https://echa.europa.eu/regulations/reach/understanding-reach' },
      { id: 'rohs',    name: 'RoHS',                        description: 'Beschränkung gefährlicher Stoffe in Elektro- und Elektronikgeräten', isEu: true, active: true,  status: 'ok',       deadline: null,         link: 'https://ec.europa.eu/environment/topics/waste-and-recycling/rohs-directive_en' },
      { id: 'ce',      name: 'CE-Kennzeichnung',            description: 'Konformitätskennzeichnung für den EU-Binnenmarkt',                  isEu: true,  active: true,  status: 'ok',       deadline: null,         link: 'https://ec.europa.eu/growth/single-market/ce-marking_en' },
      { id: 'lksg',    name: 'LkSG',                        description: 'Lieferkettensorgfaltspflichtengesetz (Deutschland)',                isEu: false, active: true,  status: 'warn',     deadline: '2027-01-01', link: 'https://www.bafa.de/DE/Lieferketten/lieferketten_node.html' },
      { id: 'lca',     name: 'ISO 14040 – LCA',             description: 'Lebenszyklusanalyse nach ISO-Norm',                                 isEu: false, active: true,  status: 'warn',     deadline: null,         link: 'https://www.iso.org/standard/37456.html' },
      { id: 'iso9001', name: 'ISO 9001 Qualitätsmanagement', description: 'Qualitätsmanagementsystem-Zertifizierung',                         isEu: false, active: false, status: 'inactive', deadline: null,         link: 'https://www.iso.org/standard/62085.html' },
    ],
    deadlines: [
      { key: 'critical', label: 'Kritische Warnung', desc: 'E-Mail + Dashboard-Alert',                              days: 14 },
      { key: 'warning',  label: 'Frühe Warnung',     desc: 'Dashboard-Hinweis',                                     days: 30 },
      { key: 'reminder', label: 'Erinnerung',        desc: 'Wöchentliche Erinnerungs-E-Mail ab dieser Vorlaufzeit',  days: 60 },
    ],
    notifications: {
      channels: [
        { id: 'email',   icon: '📧', name: 'E-Mail',  desc: 'Benachrichtigungen an Ihre E-Mail-Adresse',     active: true,  connected: true  },
        { id: 'inapp',   icon: '🔔', name: 'In-App',  desc: 'Meldungen im Dashboard-Benachrichtigungspanel', active: true,  connected: true  },
        { id: 'slack',   icon: '💬', name: 'Slack',   desc: 'Nachrichten in einen Slack-Kanal senden',       active: false, connected: false, target: '' },
        { id: 'webhook', icon: '🔗', name: 'Webhook', desc: 'HTTP POST an eine beliebige URL',               active: false, connected: false, target: '' },
      ],
      events: [
        { id: 'gap_new',      name: 'Neue Datenlücke',              desc: 'Eine neue Lücke wurde erkannt',                     channels: { email: true,  inapp: true  }, frequency: 'immediate' },
        { id: 'gap_deadline', name: 'Frist nähert sich',            desc: 'Eine Lücken-Frist ist bald fällig',                 channels: { email: true,  inapp: true  }, frequency: 'immediate' },
        { id: 'gap_resolved', name: 'Lücke geschlossen',            desc: 'Eine Datenlücke wurde behoben',                     channels: { email: false, inapp: true  }, frequency: 'daily'     },
        { id: 'compliance',   name: 'Compliance-Änderung',          desc: 'Ein Compliance-Status hat sich geändert',           channels: { email: true,  inapp: true  }, frequency: 'immediate' },
        { id: 'supplier',     name: 'Lieferanten-Update',           desc: 'Ein Lieferant hat Daten eingereicht oder geändert', channels: { email: false, inapp: true  }, frequency: 'daily'     },
        { id: 'report',       name: 'Bericht fertig',               desc: 'Ein geplanter Bericht wurde generiert',             channels: { email: true,  inapp: true  }, frequency: 'immediate' },
        { id: 'reg_update',   name: 'Neue Regulatorik-Anforderung', desc: 'Eine EU-Verordnung hat neue Pflichtfelder',         channels: { email: true,  inapp: true  }, frequency: 'immediate' },
        { id: 'login',        name: 'Neuer Login',                  desc: 'Anmeldung von einem unbekannten Gerät',             channels: { email: true,  inapp: false }, frequency: 'immediate' },
      ],
      digest: { active: true, day: '1', time: '08:00' },
    },
    integrations: {
      apiKeys:  [],
      webhooks: [],
      systems: [
        { id: 'sap',         icon: '🏢', name: 'SAP S/4HANA',        desc: 'Materialstammdaten und Stücklisten synchronisieren',             connected: false, since: null },
        { id: 'teamcenter',  icon: '⚙️', name: 'Teamcenter PLM',     desc: 'Produktdaten und Revisionen aus Siemens Teamcenter importieren', connected: false, since: null },
        { id: 'excel',       icon: '📊', name: 'Excel / CSV Import', desc: 'Massenimport von Produktdaten über Excel-Vorlagen',              connected: false, since: null },
        { id: 'envirosuite', icon: '🔬', name: 'Envirosuite',        desc: 'CO₂- und Umweltdaten aus Messsystemen übernehmen',               connected: false, since: null },
        { id: 'sharepoint',  icon: '📁', name: 'SharePoint',         desc: 'Zertifikate und Dokumente aus SharePoint verknüpfen',            connected: false, since: null },
        { id: 'rest',        icon: '🔗', name: 'REST API (Push)',    desc: 'Beliebiges System per REST API Push-Integration anbinden',       connected: false, since: null },
      ],
    },
  }
}

/**
 * Welcher Teil des States gehoert zu welchem Save-Button.
 * Die Keys entsprechen den `save('…')`-Aufrufen in den Settings-Seiten.
 */
const SECTION_PAYLOAD: Record<SettingsSection, (s: SettingsState) => unknown> = {
  company:       s => s.company,
  branding:      s => s.branding,
  thresholds:    s => s.thresholds,
  fields:        s => s.requiredFields,
  qr:            s => s.qr,
  autoGap:       s => s.autoGap,
  regs:          s => s.regulations,
  deadlines:     s => s.deadlines,
  notifications: s => s.notifications,
  integrations:  s => s.integrations,
}

/**
 * Eingehende Serverdaten eine Ebene tief ueber die Defaults legen.
 * Flach mergen reicht nicht: liefert das Backend nur `notifications.digest`,
 * wuerden `channels` und `events` sonst verschwinden.
 */
function mergeIncoming(base: SettingsState, incoming: Partial<SettingsState>): SettingsState {
  const out = { ...base } as Record<string, unknown>
  for (const [key, value] of Object.entries(incoming)) {
    if (value === null || value === undefined) continue
    const current = out[key]
    out[key] = (!Array.isArray(value) && typeof value === 'object'
      && !Array.isArray(current) && typeof current === 'object' && current !== null)
      ? { ...current, ...value }
      : value
  }
  return out as unknown as SettingsState
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useSettingsStore = defineStore('settings', () => {

  // ── State ─────────────────────────────────
  const state     = reactive<SettingsState>(defaults())
  const isLoading = ref(false)
  const isSaving  = ref<SettingsSection | null>(null)
  const error     = ref<string | null>(null)
  const loaded    = ref(false)

  /** Pro Sektion: kurzzeitiges „✓ gespeichert“ nach erfolgreichem Save. */
  const saved = reactive<Record<string, boolean>>({})
  const savedTimers: Record<string, ReturnType<typeof setTimeout>> = {}

  // ── Actions ───────────────────────────────

  /**
   * Einstellungen vom Server holen. Wird von jeder Settings-Seite beim
   * Mounten aufgerufen und laedt nur einmal pro Session nach.
   *
   * Schlaegt der Aufruf fehl (z.B. weil die Route noch nicht existiert),
   * bleiben die Defaults stehen – die Seiten sind dann bedienbar, aber der
   * Fehler ist sichtbar.
   */
  async function fetchAll(force = false): Promise<void> {
    if (loaded.value && !force) return
    isLoading.value = true
    error.value     = null
    try {
      const { apiFetch } = useApi()
      const data = await apiFetch<Partial<SettingsState> | null>(ENDPOINT_GET)
      if (data && typeof data === 'object') {
        Object.assign(state, mergeIncoming(defaults(), data))
      }
      loaded.value = true
    } catch (e: any) {
      error.value = e?.message ?? 'Einstellungen konnten nicht geladen werden'
      console.error('[SettingsStore] fetchAll:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Eine Sektion speichern. Gibt true zurueck, wenn der Server bestaetigt hat.
   */
  async function save(section: SettingsSection): Promise<boolean> {
    isSaving.value = section
    error.value    = null
    try {
      const { apiFetch } = useApi()
      await apiFetch(ENDPOINT_SAVE, {
        method: 'POST',
        body:   { section, data: SECTION_PAYLOAD[section](state) },
      })
      _flagSaved(section)
      return true
    } catch (e: any) {
      error.value = e?.message ?? 'Speichern fehlgeschlagen'
      console.error(`[SettingsStore] save(${section}):`, e)
      return false
    } finally {
      isSaving.value = null
    }
  }

  /** „✓ gespeichert“ fuer 3 s zeigen. */
  function _flagSaved(section: string) {
    saved[section] = true
    clearTimeout(savedTimers[section])
    savedTimers[section] = setTimeout(() => { saved[section] = false }, 3000)
  }

  /** Eine Sektion auf die Werkseinstellung zuruecksetzen (ohne zu speichern). */
  function reset(section: keyof SettingsState) {
    const fresh = defaults()
    ;(state as Record<string, unknown>)[section] = fresh[section]
  }

  return {
    // state
    state,
    isLoading,
    isSaving,
    error,
    saved,
    loaded,
    // actions
    fetchAll,
    save,
    reset,
  }
})
