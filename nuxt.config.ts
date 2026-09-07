export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-01-01',

  // SSR aktiv: noetig fuer den Legacy-API-Proxy (Mixed Content) und
  // damit die oeffentliche DPP-Seite /p/[id] serverseitig gerendert wird.
  // Nitro erkennt Vercel beim Deploy automatisch - kein Preset noetig.
  ssr: true,

  app: {
    // Nur relevant, wenn die App als statisches Bundle in einem
    // Unterverzeichnis (Apache) liegt. Auf Vercel immer '/'.
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/supabase',
  ],

  supabase: {
    // Die Absicherung macht app/middleware/auth.ts - sie kennt die
    // oeffentlichen Routen (/login, /p/*) und den Rueckkehrpfad.
    redirect: false,
    // Keine generierten Typen: das Schema steht in app/types/database.ts
    // und wird an useSupabaseClient<Database>() uebergeben.
    types: false,
  },

  googleFonts: {
    families: { 'DM Sans': [300, 400, 500, 600], 'DM Mono': [400, 500] },
    display: 'swap',
  },

  css: ['~/assets/css/main.css'],

  components: {
  dirs: [{ path: '~/components', pathPrefix: false }]
  },

  runtimeConfig: {
    // Serverseitig: echte Legacy-API. Nur der Nitro-Proxy spricht direkt mit ihr,
    // deshalb ist die unverschluesselte http-Adresse hier unproblematisch.
    legacyApiBase: process.env.LEGACY_API_BASE || 'http://116.203.22.63:5005',

    public: {
      // Clientseitig: relativer Proxy-Pfad statt der http-URL.
      // Auf Vercel (https) wuerde ein direkter http-Call als Mixed Content blockiert.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api/legacy',
    },
  },

  i18n: {
    locales: [
      { code: 'de', name: 'Deutsch',    iso: 'de-DE', flag: '🇩🇪', file: 'de.json' },
      { code: 'en', name: 'English',    iso: 'en-GB', flag: '🇬🇧', file: 'en.json' },
      { code: 'fr', name: 'Français',   iso: 'fr-FR', flag: '🇫🇷', file: 'fr.json' },
      { code: 'es', name: 'Español',    iso: 'es-ES', flag: '🇪🇸', file: 'es.json' },
      { code: 'it', name: 'Italiano',   iso: 'it-IT', flag: '🇮🇹', file: 'it.json' },
      { code: 'pl', name: 'Polski',     iso: 'pl-PL', flag: '🇵🇱', file: 'pl.json' },
      { code: 'nl', name: 'Nederlands', iso: 'nl-NL', flag: '🇳🇱', file: 'nl.json' },
      { code: 'pt', name: 'Português',  iso: 'pt-PT', flag: '🇵🇹', file: 'pt.json' },
      { code: 'sv', name: 'Svenska',    iso: 'sv-SE', flag: '🇸🇪', file: 'sv.json' },
      { code: 'da', name: 'Dansk',      iso: 'da-DK', flag: '🇩🇰', file: 'da.json' },
      { code: 'fi', name: 'Suomi',      iso: 'fi-FI', flag: '🇫🇮', file: 'fi.json' },
      { code: 'nb', name: 'Norsk',      iso: 'nb-NO', flag: '🇳🇴', file: 'nb.json' },
      { code: 'cs', name: 'Čeština',    iso: 'cs-CZ', flag: '🇨🇿', file: 'cs.json' },
      { code: 'sk', name: 'Slovenčina', iso: 'sk-SK', flag: '🇸🇰', file: 'sk.json' },
      { code: 'hu', name: 'Magyar',     iso: 'hu-HU', flag: '🇭🇺', file: 'hu.json' },
      { code: 'ro', name: 'Română',     iso: 'ro-RO', flag: '🇷🇴', file: 'ro.json' },
      { code: 'bg', name: 'Български',  iso: 'bg-BG', flag: '🇧🇬', file: 'bg.json' },
      { code: 'hr', name: 'Hrvatski',   iso: 'hr-HR', flag: '🇭🇷', file: 'hr.json' },
      { code: 'el', name: 'Ελληνικά',   iso: 'el-GR', flag: '🇬🇷', file: 'el.json' },
      { code: 'et', name: 'Eesti',      iso: 'et-EE', flag: '🇪🇪', file: 'et.json' },
      { code: 'lv', name: 'Latviešu',   iso: 'lv-LV', flag: '🇱🇻', file: 'lv.json' },
      { code: 'lt', name: 'Lietuvių',   iso: 'lt-LT', flag: '🇱🇹', file: 'lt.json' },
      { code: 'sl', name: 'Slovenščina',iso: 'sl-SI', flag: '🇸🇮', file: 'sl.json' },
      { code: 'mt', name: 'Malti',      iso: 'mt-MT', flag: '🇲🇹', file: 'mt.json' },
    ],
    defaultLocale: 'de',
    langDir: 'i18n/',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie:      true,
      cookieKey:      'dpp-locale',
      redirectOn:     'root',
      alwaysRedirect: false,
      fallbackLocale: 'en',
    },
    lazy: true,
  },

  devtools: { enabled: true },
})
