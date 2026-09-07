/**
 * Frueher, verstaendlicher Abbruch bei fehlender Konfiguration.
 *
 * Hintergrund: Fehlen SUPABASE_URL / SUPABASE_KEY zur Laufzeit, wirft das
 * Supabase-Plugin beim Setup. Die Nuxt-Plugin-Kette bricht dann ab, bevor
 * Pinia initialisiert ist - Pinias `app:rendered`-Hook ist zu dem Zeitpunkt
 * aber schon registriert und laeuft trotzdem. Ergebnis ist ein 500 mit
 * "Cannot read properties of undefined (reading 'state')" auf JEDER Route,
 * in dem die eigentliche Ursache nirgends auftaucht.
 *
 * Dieser Check macht daraus eine eindeutige Meldung beim Serverstart.
 */
export default defineNitroPlugin(() => {
  const required = ['SUPABASE_URL', 'SUPABASE_KEY'] as const
  const missing = required.filter(k => !process.env[k])

  if (missing.length > 0) {
    console.error(
      `\n[config] Fehlende Environment-Variablen: ${missing.join(', ')}\n` +
      `[config] In Vercel unter Settings -> Environment Variables setzen ` +
      `(Production, Preview und Development) und anschliessend neu deployen.\n` +
      `[config] Ohne diese Werte antwortet jede Route mit HTTP 500.\n`,
    )
  }
})
