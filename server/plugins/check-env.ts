/**
 * Frueher, verstaendlicher Hinweis bei fehlender Konfiguration.
 *
 * Die App spricht die Legacy-API ueber den Proxy unter
 * server/api/legacy/[...path].ts an. Fehlt dessen Basisadresse,
 * schlagen saemtliche Datenabrufe fehl - hier wird das einmal
 * beim Start deutlich gemacht statt erst im Netzwerk-Tab.
 */
export default defineNitroPlugin(() => {
  if (!process.env.LEGACY_API_BASE) {
    console.warn(
      '\n[config] LEGACY_API_BASE ist nicht gesetzt - es gilt der Standardwert '
      + 'aus nuxt.config.ts.\n[config] In Vercel unter Settings -> Environment '
      + 'Variables setzen, falls die API woanders laeuft.\n',
    )
  }
})
