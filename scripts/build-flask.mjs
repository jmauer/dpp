#!/usr/bin/env node
/**
 * Baut das Frontend so, dass es der Flask-Server ausliefern kann.
 *
 * Flask erwartet die Dateien in zwei getrennten Ordnern, Nuxt legt aber alles
 * flach in .output/public ab. Dieses Skript baut als reines SPA (NUXT_SSR=false
 * aus .env.flask) und sortiert das Ergebnis anschliessend um:
 *
 *   .output/public/index.html   ->  dist-flask/templates/index.html
 *   .output/public/_nuxt/**     ->  dist-flask/static/_nuxt/**
 *   .output/public/favicon.ico  ->  dist-flask/static/favicon.ico
 *   ...                         ->  dist-flask/static/...
 *
 * Die beiden Ordner aus dist-flask/ werden 1:1 neben die application.py
 * gelegt. Details und die noetige Flask-Route: DEPLOY-FLASK.md
 */
import { execFileSync } from 'node:child_process'
import {
  copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dotenvFile = '.env.flask'
const buildDir = join(root, '.output', 'public')
const outDir = join(root, 'dist-flask')
const zipName = 'dpp-dashboard-flask.zip'

const log = (msg) => console.log(`\x1b[36m[flask-build]\x1b[0m ${msg}`)
const warn = (msg) => console.warn(`\x1b[33m[flask-build]\x1b[0m ${msg}`)

function fail(msg) {
  console.error(`\x1b[31m[flask-build] ${msg}\x1b[0m`)
  process.exit(1)
}

// ── 1. Konfiguration ────────────────────────────────────────────────────────
// .env.flask haelt die Werte, die sich vom Vercel-Setup unterscheiden
// (SPA statt SSR, API auf gleicher Origin). Beim ersten Lauf aus dem
// Beispiel anlegen, damit niemand raten muss, welche Keys gebraucht werden.
if (!existsSync(join(root, dotenvFile))) {
  const example = join(root, '.env.flask.example')
  if (!existsSync(example)) fail(`Weder ${dotenvFile} noch .env.flask.example gefunden.`)
  copyFileSync(example, join(root, dotenvFile))
  log(`${dotenvFile} aus .env.flask.example angelegt - Werte bei Bedarf anpassen.`)
}

const env = Object.fromEntries(
  readFileSync(join(root, dotenvFile), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
)

const baseUrl = env.NUXT_APP_BASE_URL || '/'
log(`Modus: SPA  |  API-Basis: ${env.NUXT_PUBLIC_API_BASE || '(Default aus nuxt.config.ts)'}  |  Base-URL: ${baseUrl}`)

// ── 2. Bauen ────────────────────────────────────────────────────────────────
rmSync(join(root, '.output'), { recursive: true, force: true })
rmSync(outDir, { recursive: true, force: true })
rmSync(join(root, zipName), { force: true })

log('nuxt generate laeuft ...')
execFileSync(
  'npx',
  ['nuxi', 'generate', '--dotenv', dotenvFile],
  {
    cwd: root,
    stdio: 'inherit',
    // Sicherheitsnetz, falls NUXT_SSR aus .env.flask entfernt wurde:
    // ohne SPA-Modus entstuenden prerenderte Seiten mit SSR-Payload,
    // die als Fallback fuer /p/<id> nicht sauber hydrieren.
    env: { ...process.env, NUXT_SSR: 'false' },
  },
)

if (!existsSync(join(buildDir, 'index.html'))) {
  fail('Build hat keine .output/public/index.html erzeugt - Abbruch.')
}

// ── 3. In Flask-Struktur umsortieren ────────────────────────────────────────
mkdirSync(join(outDir, 'templates'), { recursive: true })
cpSync(buildDir, join(outDir, 'static'), { recursive: true })

copyFileSync(join(outDir, 'static', 'index.html'), join(outDir, 'templates', 'index.html'))
rmSync(join(outDir, 'static', 'index.html'))

// public/.htaccess gehoert zum alten Apache-Setup, in dem Apache die SPA direkt
// aus einem DocumentRoot ausliefert. Hier waere die Datei nicht nur nutzlos
// (ihr SPA-Fallback zeigt auf ein index.html, das jetzt in templates/ liegt),
// sondern schaedlich: Flask wuerde sie ueber die Catch-all-Route als Klartext
// ausliefern. Gleiches gilt fuer alle anderen Dotfiles.
for (const entry of readdirSync(join(outDir, 'static'))) {
  if (entry.startsWith('.')) {
    rmSync(join(outDir, 'static', entry), { recursive: true, force: true })
    log(`static/${entry} entfernt (gehoert nicht ins Flask-Deployment).`)
  }
}

// Nuxt legt im SPA-Modus fuer jede statische Route eine Kopie derselben Shell
// ab (200.html, 404.html, dashboard/index.html, ...). Den Fallback uebernimmt
// hier die Catch-all-Route in Flask, die Kopien waeren nur Dubletten - und ein
// static/dashboard/index.html wuerde die Route sogar mehrdeutig machen.
let stripped = 0
const stripHtml = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      stripHtml(path)
      if (readdirSync(path).length === 0) rmSync(path, { recursive: true })
    }
    else if (entry.name.endsWith('.html')) {
      rmSync(path)
      stripped++
    }
  }
}
stripHtml(join(outDir, 'static'))
if (stripped) log(`${stripped} doppelte Shell-Kopien aus static/ entfernt.`)

// ── 4. Gegenpruefen, dass die Asset-Pfade zur Flask-Route passen ────────────
const html = readFileSync(join(outDir, 'templates', 'index.html'), 'utf8')
const expectedPrefix = `${baseUrl.replace(/\/+$/, '')}/_nuxt/`
if (!html.includes(expectedPrefix)) {
  warn(`index.html referenziert kein "${expectedPrefix}" - NUXT_APP_BASE_URL in ${dotenvFile} pruefen.`)
}

// ── 5. Packen ───────────────────────────────────────────────────────────────
let zipped = false
try {
  execFileSync('zip', ['-r', '-q', join(root, zipName), 'templates', 'static'], { cwd: outDir })
  zipped = true
}
catch {
  warn('zip nicht verfuegbar - dist-flask/ bleibt entpackt liegen.')
}

const assetCount = readdirSync(join(outDir, 'static', '_nuxt')).length
log('fertig.')
console.log(`
  dist-flask/templates/index.html   -> auf dem Server nach  dpp/templates/index.html
  dist-flask/static/                -> auf dem Server nach  dpp/static/   (${assetCount} Dateien in _nuxt/)${zipped ? `\n  ${zipName}                -> enthaelt beides, zum Hochladen` : ''}

  Vor dem ersten Deploy: die Catch-all-Route in views.py anpassen (DEPLOY-FLASK.md, Schritt 2).
`)
