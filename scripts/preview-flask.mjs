#!/usr/bin/env node
/**
 * Lokale Vorschau des Flask-Builds, ohne Flask.
 *
 * Bildet exakt die Catch-all-Route aus DEPLOY-FLASK.md nach: existierende
 * Datei aus static/ ausliefern, sonst templates/index.html. Damit laesst sich
 * ein Build pruefen, bevor er auf den Server geht - und es beantwortet die
 * Frage, warum man die index.html nicht einfach doppelklicken kann: sie laedt
 * ihr Bundle als <script type="module">, und Modul-Skripte blockiert jeder
 * Browser unter file:// per CORS. Es braucht einen HTTP-Server, egal wie klein.
 *
 *   npm run preview:flask
 *
 * API-Aufrufe (alles, was nicht nach einer Seitennavigation aussieht) werden
 * an die echte Legacy-API weitergereicht, sonst laeuft man hier gegen eine
 * tote Login-Maske. Nur fuer die Vorschau - auf dem Server macht das Flask
 * selbst, weil dort Frontend und API dieselbe Origin haben.
 */
import { createServer, request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = join(root, 'dist-flask', 'static')
const shell = join(root, 'dist-flask', 'templates', 'index.html')
const port = Number(process.env.PORT) || 4173

// Ziel fuer durchgereichte API-Aufrufe: dieselbe Adresse, die der Nitro-Proxy
// im Vercel-Setup benutzt.
const apiTarget = new URL(
  process.env.LEGACY_API_BASE
  || readEnv('.env', 'LEGACY_API_BASE')
  || 'http://116.203.22.63:5005',
)

function readEnv(file, key) {
  const path = join(root, file)
  if (!existsSync(path)) return null
  const match = readFileSync(path, 'utf8').match(new RegExp(`^${key}=(.*)$`, 'm'))
  return match ? match[1].trim() : null
}

if (!existsSync(shell)) {
  console.error('\x1b[31mKein Build gefunden - erst `npm run build:flask` ausfuehren.\x1b[0m')
  process.exit(1)
}

const MIME = {
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain',
  '.html': 'text/html',
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`)
  // normalize + der startsWith-Check unten wehren ../-Ausbrueche ab
  const path = decodeURIComponent(url.pathname).replace(/^\/+/, '')

  // 1. Existierende Datei? Direkt ausliefern - wie send_from_directory.
  //    Dotfiles bleiben aussen vor, genau wie in der Flask-Route.
  if (path && !path.split('/').some((part) => part.startsWith('.'))) {
    const file = normalize(join(staticDir, path))
    if (file.startsWith(staticDir) && existsSync(file) && statSync(file).isFile()) {
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
      createReadStream(file).pipe(res)
      return
    }
  }

  // 2. Seitennavigation? Die SPA-Shell - wie render_template("index.html").
  //    Der Browser schickt dafuer Accept: text/html, $fetch dagegen
  //    application/json. Auf dem Server braucht es diese Unterscheidung nicht,
  //    dort beantwortet Flask die API-Routen selbst.
  if ((req.headers.accept ?? '').includes('text/html')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    createReadStream(shell).pipe(res)
    return
  }

  // 3. Alles andere ist ein API-Aufruf -> an die Legacy-API weiterreichen.
  const send = apiTarget.protocol === 'https:' ? httpsRequest : httpRequest
  const upstream = send(
    {
      protocol: apiTarget.protocol,
      hostname: apiTarget.hostname,
      port: apiTarget.port,
      path: url.pathname + url.search,
      method: req.method,
      headers: {
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        ...(req.headers['content-type'] ? { 'content-type': req.headers['content-type'] } : {}),
        accept: req.headers.accept ?? 'application/json',
      },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
      upstreamRes.pipe(res)
    },
  )
  upstream.on('error', (err) => {
    console.error(`  ! ${req.method} ${url.pathname} -> ${apiTarget.origin}: ${err.message}`)
    res.writeHead(502, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: `Legacy-API nicht erreichbar: ${err.message}` }))
  })
  req.pipe(upstream)
}).listen(port, () => {
  console.log(`
  Flask-Build-Vorschau:  \x1b[36mhttp://localhost:${port}\x1b[0m
  Routing:               identisch zur Catch-all-Route aus DEPLOY-FLASK.md
  API-Aufrufe gehen an:  ${apiTarget.origin}

  Beenden mit Strg+C
`)
})
