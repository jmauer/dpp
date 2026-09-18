# Deployment auf den Flask-Server

Anleitung, um das Dashboard vom bestehenden Flask-Backend (`application.py` +
`service/views.py`) ausliefern zu lassen — ohne Vercel und ohne Node auf dem Server.

Frontend und API laufen danach unter derselben Origin: Flask beantwortet sowohl
`GET /dashboard` (die App) als auch `GET /getAllProducts` (die API). Damit
entfallen CORS und das Mixed-Content-Problem, wegen dem es auf Vercel den
Nitro-Proxy unter `/api/legacy` gibt — den es im statischen Build nicht mehr gibt.

---

## Schritt 1 — Build erzeugen

```bash
npm run build:flask
```

Beim ersten Lauf wird `.env.flask` aus `.env.flask.example` angelegt. Die Werte
passen für ein Deployment unter `http://<host>:5005/`; liegt die App in einem
Unterverzeichnis, dort `NUXT_APP_BASE_URL` anpassen.

Ergebnis:

```
dist-flask/
├── templates/index.html      → die SPA-Shell, die Flask rendert
└── static/
    ├── _nuxt/                → JS, CSS, Fonts, i18n-Chunks
    ├── css/  fonts/          → Google-Fonts (lokal gebundlet)
    ├── favicon.ico
    └── robots.txt
dpp-dashboard-flask.zip       → beides zusammen, zum Hochladen
```

Warum die Aufteilung: Flask rendert Templates aus `templates/`, liefert aber
Dateien aus `static/` aus. Nuxt kennt diese Trennung nicht und legt alles flach
in `.output/public` ab — das Skript sortiert es um.

---

## Schritt 2 — Flask-Route anpassen (einmalig)

Die `index.html` referenziert ihre Assets als `/_nuxt/…`, Flask liefert `static/`
aber standardmäßig unter `/static/…` aus. Ohne Anpassung lädt die Seite weiß mit
lauter 404ern.

In `service/views.py` zuerst **`current_app` zur bestehenden flask-Importzeile
ergänzen** — `os`, `send_from_directory` und `render_template` sind dort schon
drin, `current_app` fehlt:

```python
from flask import (Flask, redirect, request, jsonify, Response, send_file,
                   Blueprint, abort, send_from_directory, render_template,
                   current_app)   # <- current_app ist neu
```

Fehlt das, liefert `/` noch die Seite, aber jede andere Route antwortet mit
`500 NameError: name 'current_app' is not defined` — denn nur bei `/` ist
`path` leer und der Dateicheck wird übersprungen.

Dann die bestehende Catch-all-Route ersetzen:

```python
@apolloBlp.route("/", defaults={"path": ""})
@apolloBlp.route("/<path:path>")
def index(path):
    # Existiert die angefragte Datei wirklich (z.B. /_nuxt/entry.abc.js),
    # direkt ausliefern. Alles andere ist eine Client-Route der SPA
    # (/dashboard/products/42, /p/xyz) und bekommt die Shell.
    # Keine Dotfiles ausliefern (.htaccess, .env, ...) - die wuerden hier
    # sonst als Klartext im Browser landen.
    if path and not any(part.startswith(".") for part in path.split("/")):
        candidate = os.path.join(current_app.static_folder, path)
        if os.path.isfile(candidate):
            return send_from_directory(current_app.static_folder, path)
    return render_template("index.html")
```

Die echten API-Routen (`/getProduct/<ID>`, `/authentication`, …) sind
spezifischer und gewinnen gegen den Catch-all — an denen ändert sich nichts.

> Der Dateicheck ist bewusst so gelöst und nicht über
> `Flask(__name__, static_url_path='')`: dabei kollidiert die Static-Regel
> `/<path:filename>` mit dem Catch-all `/<path:path>`, und welche zuerst greift,
> hängt an der Registrierungsreihenfolge.

---

## Schritt 3 — Hochladen

`dpp-dashboard-flask.zip` auf den Server legen und neben `application.py` entpacken:

```bash
scp dpp-dashboard-flask.zip <user>@<host>:/pfad/zu/dpp/
ssh <user>@<host>
cd /pfad/zu/dpp
rm -rf static templates          # alten Build wegräumen (siehe Hinweis unten)
unzip -o dpp-dashboard-flask.zip
```

`rm -rf static` entfernt auch alte `_nuxt/`-Dateien aus früheren Builds. Deren
Namen enthalten einen Content-Hash, sie werden also nie überschrieben und sammeln
sich sonst an. Falls in `static/` noch andere Dateien liegen, die nicht vom
Frontend stammen, nur `static/_nuxt` löschen statt `static` komplett.

Danach den Flask-Prozess neu starten.

---

## Schritt 4 — Prüfen

Direkt auf dem Server, am Proxy vorbei:

```bash
curl -I http://127.0.0.1:5005/                   # 200, text/html
curl -I http://127.0.0.1:5005/_nuxt/<datei>.js   # 200, application/javascript
curl -I http://127.0.0.1:5005/dashboard          # 200, text/html (SPA-Shell)
curl    http://127.0.0.1:5005/getApiVersion      # weiterhin JSON
```

Danach dasselbe über die öffentliche Adresse, die Apache bedient. Liegt Apache
als Reverse Proxy davor, sollte Flask nur auf `127.0.0.1` lauschen
(`app.run(host='127.0.0.1', ...)`) — mit `0.0.0.0` ist das Backend zusätzlich
unter Port 5005 direkt erreichbar und umgeht Apache samt dessen Headern.

Im Browser mit hartem Reload (Cmd/Strg+Shift+R) laden — sonst hängt der alte
Service-Worker-/Cache-Stand fest.

---

## Was sich gegenüber dem Vercel-Setup ändert

| | Vercel | Flask |
|---|---|---|
| Rendering | SSR (Nitro) | reines SPA |
| API-Aufruf im Browser | `/api/legacy/*` → Nitro-Proxy → Legacy-API | `/*` direkt an Flask |
| `/p/<id>` | serverseitig gerendert | erst nach Hydration im Browser |

Der letzte Punkt ist der relevante Nachteil: die öffentliche DPP-Seite hat für
Crawler und Link-Vorschauen keinen HTML-Inhalt mehr. Der QR-Code-Link
funktioniert für Menschen normal. Wer SSR dort braucht, kommt um einen
Node-Prozess (Vercel, oder `node .output/server/index.mjs` hinter nginx) nicht herum.

Beide Wege bleiben parallel nutzbar — `npm run build:flask` liest `.env.flask`
und fasst weder `.env` noch die Vercel-Konfiguration an.

---

## Kann man die index.html einfach doppelklicken?

Nein — und das liegt nicht am Build, sondern am Browser. Die gebaute Shell
enthält genau eine Script-Zeile:

```html
<script type="module" src="/_nuxt/Bzp8kIO-.js" crossorigin></script>
```

Darin stecken drei unabhängige Gründe, warum `file:///…/index.html` scheitert:

1. **`type="module"`** — Modul-Skripte unterliegen CORS, und eine `file://`-Seite
   hat die Origin `null`. Jeder Browser bricht mit
   *„blocked by CORS policy"* ab. Das ist eine Sicherheitsregel, kein Bug, und
   per Build nicht umgehbar (der Client-Build von Nuxt/Vite ist ESM).
2. **Absolute Pfade** — `/_nuxt/…` zeigt unter `file://` auf die Wurzel deiner
   Festplatte, nicht auf den Build-Ordner.
3. **58 weitere Chunks** werden erst zur Laufzeit nachgeladen (Routen,
   Sprachdateien). Auch das sind Modul-Importe mit demselben Problem.

Eine SPA braucht also immer *irgendeinen* HTTP-Server. Der darf aber winzig sein
— es muss kein Flask und kein Node sein. Was „statisch" praktisch bedeutet:

| Ziel | Weg |
|---|---|
| Build lokal ansehen | `npm run preview:flask` (siehe unten) |
| Nur Dateien auf einen Webserver legen, ohne App-Server | Apache mit DocumentRoot auf den Build — dafür gibt es `npm run deploy:zip` und `public/.htaccess` |
| Flask liefert alles aus | dieses Dokument, `npm run build:flask` |

### Lokale Vorschau

```bash
npm run preview:flask        # http://localhost:4173
```

Der Server bildet die Catch-all-Route aus Schritt 2 exakt nach: existierende
Datei aus `static/`, sonst `templates/index.html`, keine Dotfiles. API-Aufrufe
reicht er an `LEGACY_API_BASE` aus `.env` weiter, damit auch der Login
funktioniert — auf dem Server erledigt das Flask selbst, weil Frontend und API
dort dieselbe Origin haben.

So lässt sich ein Build vollständig prüfen, bevor er hochgeht.

### Die Variante ohne Flask

Soll Apache die Dateien direkt ausliefern und Flask nur noch die API auf 5005
beantworten, ist nicht `build:flask` der richtige Build, sondern der flache:

```bash
npm run deploy:zip           # erzeugt dpp-dashboard-static.zip aus .output/public
```

Dabei bleibt `index.html` im selben Ordner wie `_nuxt/`, und `public/.htaccess`
übernimmt den SPA-Fallback (Apache braucht dafür `AllowOverride All` und
`a2enmod rewrite headers deflate`). Zwei Dinge sind dann aber zusätzlich nötig,
die im Flask-Weg entfallen:

- `NUXT_PUBLIC_API_BASE` muss auf die absolute Adresse der API zeigen
  (`http://116.203.22.63:5005`), weil die API nicht mehr unter derselben Origin
  liegt.
- Damit wird der Aufruf cross-origin: die CORS-Konfiguration in `application.py`
  muss greifen. Und läuft die Seite über **https**, blockiert der Browser den
  http-Aufruf als Mixed Content — dann braucht die API zwingend TLS oder einen
  Proxy-Pfad im selben vhost.

Genau diese beiden Punkte sind der Grund, warum der Flask-Weg einfacher ist.

---

## Fehlersuche — Apache meldet 503

503 kommt bei einem Reverse-Proxy-Setup (`ProxyPass` auf `127.0.0.1:5005`) fast
immer von Apache selbst: der Upstream antwortet nicht. Apache und der Build sind
dann in Ordnung, der Flask-Prozess ist es nicht. Der Reihe nach:

**1. Lauscht überhaupt etwas auf 5005?**

```bash
ss -lntp | grep 5005          # leer = niemand lauscht
```

**2. Was sagt Apache genau?**

```bash
sudo tail -30 /var/log/apache2/error.log
```

`AH00957`/`(111)Connection refused: AH00957: HTTP: attempt to connect to
127.0.0.1:5005 failed` bestätigt: Apache ist gesund, Flask ist tot.

**3. Flask im Vordergrund starten — hier steht der eigentliche Fehler.**

```bash
cd /pfad/zu/dpp
python3 application.py
```

Erwartet wird `Running on http://0.0.0.0:5005`. Stattdessen:

| Ausgabe | Ursache |
|---|---|
| Prozess endet sofort ohne Fehler | `app.run(...)` am Dateiende fehlt oder ist auskommentiert (siehe Randnotiz oben) |
| `SyntaxError` / `IndentationError` in `views.py` | die eingefügte Catch-all-Route ist falsch eingerückt — sie muss auf Modulebene stehen, nicht in einer anderen Funktion |
| `NameError: name 'current_app' is not defined` | die Importzeile aus Schritt 2 fehlt |
| `OperationalError` / hängt bei `print("davor")` | `application.py` verbindet beim Import zur Datenbank; die ist nicht erreichbar |
| `Address already in use` | ein alter Prozess hält den Port — `pkill -f application.py`, dann neu starten |

**4. Erst wenn Flask direkt antwortet, wieder über Apache testen.**

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5005/getApiVersion   # 200
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5005/                # 200
```

Gibt der erste Aufruf 200 und der zweite 500, liegt es nicht mehr am Prozess,
sondern an den Dateien: `templates/index.html` fehlt oder liegt nicht neben
`application.py`.

**Zur Stabilität:** `python application.py` in einer SSH-Sitzung stirbt mit der
Sitzung. Für dauerhaften Betrieb gehört der Start in einen systemd-Service:

```ini
# /etc/systemd/system/dpp.service
[Unit]
Description=DPP Flask Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/pfad/zu/dpp
ExecStart=/usr/bin/python3 /pfad/zu/dpp/application.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now dpp
systemctl status dpp          # zeigt kuenftig Abstuerze samt Traceback
```

---

## Randnotizen zum Server

Nicht Teil des Frontend-Deployments, fällt beim Hochladen aber auf:

- `application.py` startet mit `app.run(debug=True, host='0.0.0.0')`. Der
  Werkzeug-Debugger im Netz erlaubt Codeausführung — produktiv stattdessen
  `app.debug = True` entfernen und den Prozess mit
  `gunicorn -w 4 -b 127.0.0.1:5005 application:app` starten.

  **Wichtig:** Das ist ein Entweder-oder. gunicorn importiert `application.py`
  und ruft `app` selbst auf — es startet den `app.run(...)`-Block am Dateiende
  *nicht*. Wer weiterhin mit `python application.py` startet, muss `app.run(...)`
  also stehen lassen. Wird beides gemischt (Start per `python application.py`,
  aber `app.run(...)` entfernt), läuft das Skript durch und beendet sich sofort:
  auf Port 5005 lauscht dann nichts und Apache meldet 503.
- `app.config['UPLOAD_FOLDER'] = '/Files'` zeigt auf das Wurzelverzeichnis des
  Servers, nicht auf den `Files`-Ordner des Projekts. Vermutlich gemeint:
  `os.path.join(os.path.dirname(__file__), 'Files')`.
