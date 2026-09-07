# Deployment – Supabase & Vercel

Die App laeuft im SSR-Modus auf Vercel. Supabase wird parallel zur bestehenden
Legacy-API aufgebaut; beide koennen eine Zeit lang nebeneinander laufen.

---

## Architektur

```
Browser  ──https──►  Vercel (Nuxt SSR)
                        │
                        ├──► /api/legacy/*  ──http──►  116.203.22.63:5005   (Bestand)
                        │    serverseitiger Proxy
                        │
                        └──► Supabase  (Postgres + Auth + RLS)              (Aufbau)
```

**Warum der Proxy:** Die Legacy-API spricht `http` ohne TLS. Vercel liefert
ausschliesslich `https` aus, und Browser blockieren solche Aufrufe als Mixed
Content. Der Client ruft deshalb den relativen Pfad `/api/legacy/*` auf,
[server/api/legacy/[...path].ts](server/api/legacy/%5B...path%5D.ts) leitet
serverseitig weiter. Das loest zugleich CORS. Die http-Adresse taucht dadurch
nirgends im Client-Bundle auf.

---

## 1. Repository vorbereiten

Aktuell existiert weder ein Commit noch ein Remote – Vercel braucht beides.

```bash
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin git@github.com:<org>/dpp-dashboard.git
git push -u origin main
```

Vor dem ersten Push pruefen, dass `.env` nicht mitgeht:

```bash
git check-ignore -v .env    # muss eine Zeile aus .gitignore ausgeben
```

---

## 2. Supabase-Projekt anlegen

1. Auf [supabase.com/dashboard](https://supabase.com/dashboard) ein Projekt
   anlegen. **Region:** `eu-central-1 (Frankfurt)` – gleiche Region wie die
   Vercel-Funktionen, spart Latenz und haelt die Daten in der EU.
2. Datenbank-Passwort sicher ablegen.
3. Schema einspielen – Dashboard → **SQL Editor** → Inhalt von
   [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)
   einfuegen und ausfuehren.

   Alternativ mit der CLI:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

4. Keys holen: **Project Settings → API**
   - `Project URL`  → `SUPABASE_URL`
   - `anon public`  → `SUPABASE_KEY`

   Der `anon`-Key darf im Client landen – die Absicherung leisten die
   RLS-Policies. Der `service_role`-Key darf **niemals** in den Client
   und gehoert nicht in eine `NUXT_PUBLIC_*`-Variable.

5. Ersten Mandanten und Benutzer anlegen:

   ```sql
   insert into public.companies (name) values ('Deine Firma GmbH');
   -- Danach unter Authentication → Users einen User anlegen und verknuepfen:
   update public.profiles
      set company_id = (select id from public.companies limit 1),
          role       = 'admin'
    where email = 'deine@mail.de';
   ```

---

## 3. Lokal testen

```bash
cp .env.example .env     # und Supabase-Werte eintragen
npm install
npm run dev
```

Produktionsbuild lokal gegenpruefen:

```bash
npm run build
node .output/server/index.mjs      # http://localhost:3000
```

---

## 4. Vercel-Projekt anlegen

1. [vercel.com/new](https://vercel.com/new) → Repository importieren.
2. Framework-Preset: **Nuxt.js** (wird i.d.R. automatisch erkannt).
   Build Command, Output Directory und Install Command unveraendert lassen –
   Nitro erzeugt das Vercel-Format selbst.
3. **Environment Variables** setzen (fuer *Production*, *Preview* und
   *Development*):

   | Name                   | Wert                                | Hinweis                          |
   | ---------------------- | ----------------------------------- | -------------------------------- |
   | `SUPABASE_URL`         | `https://<ref>.supabase.co`         | aus Schritt 2                    |
   | `SUPABASE_KEY`         | `<anon public key>`                 | aus Schritt 2                    |
   | `LEGACY_API_BASE`      | `http://116.203.22.63:5005`         | nur serverseitig genutzt         |
   | `NUXT_PUBLIC_API_BASE` | `/api/legacy`                       | nicht auf die http-URL aendern   |

   `NUXT_APP_BASE_URL` wird auf Vercel **nicht** gesetzt (Default `/`).

4. Deploy ausloesen. Die Region ist ueber [vercel.json](vercel.json) auf `fra1`
   festgelegt.

5. Nach dem Deploy in Supabase unter **Authentication → URL Configuration**
   die Vercel-Domain als `Site URL` und die Preview-Domains als
   `Redirect URLs` eintragen.

---

## 5. Offene Punkte fuer die Migration

Diese Punkte sind bewusst noch nicht umgesetzt, damit der Bestand weiterlaeuft:

- **Auth liegt weiterhin im `localStorage`** ([app/stores/auth.ts](app/stores/auth.ts)).
  Deshalb kann die Route-Middleware serverseitig nicht pruefen; den ersten
  Seitenaufruf sichert [app/plugins/auth-guard.client.ts](app/plugins/auth-guard.client.ts)
  ab. Beim Umstieg auf Supabase Auth wandert die Session in ein Cookie und die
  Pruefung kann zurueck in die SSR-Middleware – dann entfaellt das Plugin und
  das kurze Aufblitzen geschuetzter Seiten.
- **`@nuxtjs/supabase` laeuft mit `redirect: false`** ([nuxt.config.ts](nuxt.config.ts)).
  Sonst wuerde das Modul jede Route auf `/login` umleiten und die bestehende
  API-Key-Auth aushebeln. Erst umstellen, wenn Supabase Auth uebernimmt.
- **Die oeffentliche Seite `/p/[id]`** laedt ihre Daten in `onMounted`, also
  weiterhin clientseitig. Fuer echtes SEO muss das auf `useAsyncData` gegen die
  View `public_product_passports` umgestellt werden.
- **Store-Actions mit `// TODO: real API`** (`updateProfile`, `changePassword`,
  `setTwoFactor`) sind noch Attrappen mit `setTimeout`.
- **`public/.htaccess`** stammt vom Apache-Setup und wird von Vercel ignoriert.
  Kann entfallen, sobald Apache nicht mehr genutzt wird.


Test