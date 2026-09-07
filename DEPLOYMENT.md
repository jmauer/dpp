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
3. Schema einspielen – Dashboard → **SQL Editor** → die Migrationen der Reihe
   nach ausfuehren:
   - [0001_init.sql](supabase/migrations/0001_init.sql) – Tabellen, RLS, oeffentliche View
   - [0002_public_view.sql](supabase/migrations/0002_public_view.sql) – Status-Felder in der View
   - [0003_profiles_personal_number.sql](supabase/migrations/0003_profiles_personal_number.sql) – Personalnummer

   Danach optional [supabase/seed.sql](supabase/seed.sql) fuer Beispieldaten
   (E-Mail darin vorher anpassen).

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
   | `SUPABASE_SERVICE_KEY` | `<service_role key>`                | **nur Server**, siehe unten      |
   | `LEGACY_API_BASE`      | `http://116.203.22.63:5005`         | nur noch fuer Restbestaende      |
   | `NUXT_PUBLIC_API_BASE` | `/api/legacy`                       | nicht auf die http-URL aendern   |

   `SUPABASE_SERVICE_KEY` wird ausschliesslich von
   [server/api/team/invite.post.ts](server/api/team/invite.post.ts) benutzt, um
   Benutzer anzulegen - das geht nur ueber die Admin-API. Der Schluessel umgeht
   saemtliche RLS-Policies und darf **niemals** als `NUXT_PUBLIC_*` gesetzt werden.

   `NUXT_APP_BASE_URL` wird auf Vercel **nicht** gesetzt (Default `/`).

4. Deploy ausloesen. Die Region ist ueber [vercel.json](vercel.json) auf `fra1`
   festgelegt.

5. Nach dem Deploy in Supabase unter **Authentication → URL Configuration**
   die Vercel-Domain als `Site URL` und die Preview-Domains als
   `Redirect URLs` eintragen.

---

## 5. Stand der Migration

Erledigt:

- **Auth laeuft ueber Supabase Auth.** Die Session liegt in einem Cookie und ist
  serverseitig lesbar, deshalb prueft [app/middleware/auth.ts](app/middleware/auth.ts)
  wieder beim SSR. Das fruehere Client-Guard-Plugin ist entfallen - geschuetzte
  Seiten blitzen nicht mehr kurz auf.
- **Produkte kommen aus Postgres.** `fetchAll`, `fetchOne`, `create`, `update`
  und `remove` in [app/stores/products.ts](app/stores/products.ts) sprechen die
  Tabelle direkt an; RLS filtert den Mandanten, ein `company_id`-Filter im Code
  ist nicht noetig. Die Uebersetzung snake_case ↔ camelCase steht in
  [app/utils/product-mapper.ts](app/utils/product-mapper.ts).
- **Der oeffentliche Pass wird serverseitig gerendert.**
  [app/pages/p/[id].vue](app/pages/p/%5Bid%5D.vue) liest per `useAsyncData` aus der
  View `public_product_passports` und liefert bei unbekanntem Slug echtes 404.
  Adressiert wird ueber `public_slug`, nicht mehr ueber die Produkt-ID.
- **Team-Verwaltung.** Liste aus `profiles`; das Anlegen laeuft ueber
  [server/api/team/invite.post.ts](server/api/team/invite.post.ts), weil dafuer
  der service_role-Key noetig ist. Die Route prueft, dass der Aufrufer Admin ist.

Noch offen:

- **Zwei-Faktor-Authentifizierung** (`setTwoFactor`) ist nicht angebunden.
  Supabase kann MFA/TOTP, es fehlt der Enrollment-Dialog mit QR-Code.
- **Die Legacy-API und ihr Proxy** werden von der App nicht mehr aufgerufen.
  [server/api/legacy/[...path].ts](server/api/legacy/%5B...path%5D.ts) und
  `LEGACY_API_BASE` koennen entfallen, sobald sicher ist, dass nichts mehr
  daran haengt.
- **Vorbestehende Typfehler** in `settings/dpp.vue`, `supply-chain.vue`,
  `settings/notifications.vue`, `LanguageSwitcher.vue`, `stores/notifications.ts`
  und der i18n-Option `lazy` - unabhaengig von der Migration, `nuxi typecheck`
  listet sie auf.
- **`public/.htaccess`** stammt vom Apache-Setup und wird von Vercel ignoriert.
