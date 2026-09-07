-- ============================================================
-- DPP Dashboard – Beispieldaten
--
-- Voraussetzung: 0001_init.sql ist eingespielt und du hast unter
-- Authentication → Users bereits einen Benutzer angelegt.
--
-- WICHTIG: Unten die E-Mail-Adresse anpassen.
-- Mehrfaches Ausfuehren ist unschaedlich (idempotent ueber sku).
-- ============================================================

-- ── 1. Mandant ──────────────────────────────────────────────
insert into public.companies (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Muster GmbH')
on conflict (id) do nothing;

-- ── 2. Eigenes Profil verknuepfen ───────────────────────────
--     ↓↓↓  HIER DEINE E-MAIL EINTRAGEN  ↓↓↓
update public.profiles
   set company_id = '00000000-0000-4000-8000-000000000001',
       role       = 'admin',
       first_name = coalesce(nullif(first_name, ''), 'Jonathan'),
       last_name  = coalesce(nullif(last_name,  ''), 'Mauer')
 where email = 'deine@mail.de';

-- Kontrolle: muss 1 Zeile liefern, sonst stimmt die E-Mail nicht
do $$
declare n int;
begin
  select count(*) into n from public.profiles
   where company_id = '00000000-0000-4000-8000-000000000001';
  if n = 0 then
    raise exception
      'Kein Profil verknuepft. Stimmt die E-Mail oben? Vorhandene: %',
      (select coalesce(string_agg(email, ', '), '<keine>') from public.profiles);
  end if;
end $$;

-- ── 3. Produkte ─────────────────────────────────────────────
insert into public.products (
  company_id, name, sku, category, emoji, icon_bg, icon_color,
  status, completeness, description, manufacturer, manufacturing_date,
  country_of_origin, weight, co2_total, energy_class,
  repairability_index, recycling_rate,
  materials, regulations, supply_chain, gaps, certifications, is_public
) values
(
  '00000000-0000-4000-8000-000000000001',
  'Elektromotor EM-400X', 'EM-400X', 'Antriebstechnik', '⚙️', '#EEF2FF', '#4F46E5',
  'ok', 94,
  'Hocheffizienter Drehstrom-Asynchronmotor für industrielle Anwendungen.',
  'Muster GmbH', '2025-03-14', 'Deutschland', '48 kg', '184 kg CO₂e', 'IE4',
  8, '91 %',
  '[{"name":"Kupfer","pct":34,"recycled":true},
    {"name":"Elektroblech","pct":41,"recycled":false},
    {"name":"Aluminium","pct":18,"recycled":true},
    {"name":"Kunststoff","pct":7,"recycled":false}]'::jsonb,
  '[{"name":"EU ESPR","status":"ok"},
    {"name":"RoHS","status":"ok"},
    {"name":"REACH","status":"ok","note":"Letzte Prüfung 02/2025"}]'::jsonb,
  '[{"stage":"raw","label":"Rohstoffe","emoji":"⛏️","status":"ok","supplier":"NordMetall AB","country":"Schweden","co2":"62 kg CO₂e"},
    {"stage":"preproduction","label":"Vorfertigung","emoji":"🔩","status":"ok","supplier":"Kern Technik","country":"Deutschland","co2":"31 kg CO₂e"},
    {"stage":"manufacturing","label":"Fertigung","emoji":"🏭","status":"ok","supplier":"Muster GmbH","country":"Deutschland","co2":"58 kg CO₂e"},
    {"stage":"logistics","label":"Logistik","emoji":"🚚","status":"ok","supplier":"TransEuro","country":"EU","co2":"33 kg CO₂e"},
    {"stage":"endoflife","label":"Recycling","emoji":"♻️","status":"ok","country":"Deutschland","co2":"—"}]'::jsonb,
  '[]'::jsonb,
  '["ISO 9001","IEC 60034","ATEX"]'::jsonb,
  true
),
(
  '00000000-0000-4000-8000-000000000001',
  'Getriebe GX-120', 'GX-120', 'Antriebstechnik', '🔧', '#FEF3C7', '#D97706',
  'warn', 68,
  'Zweistufiges Stirnradgetriebe mit hoher Übersetzungsgenauigkeit.',
  'Muster GmbH', '2025-06-02', 'Deutschland', '22 kg', '96 kg CO₂e', 'n/a',
  6, '78 %',
  '[{"name":"Stahl","pct":72,"recycled":true},
    {"name":"Aluminium","pct":21,"recycled":false},
    {"name":"Dichtungen","pct":7,"recycled":false}]'::jsonb,
  '[{"name":"EU ESPR","status":"warn","note":"CO₂-Nachweis Vorkette fehlt"},
    {"name":"RoHS","status":"ok"},
    {"name":"REACH","status":"pending"}]'::jsonb,
  '[{"stage":"raw","label":"Rohstoffe","emoji":"⛏️","status":"warn","supplier":"unbekannt","country":"—","co2":"—"},
    {"stage":"manufacturing","label":"Fertigung","emoji":"🏭","status":"ok","supplier":"Muster GmbH","country":"Deutschland","co2":"54 kg CO₂e"},
    {"stage":"logistics","label":"Logistik","emoji":"🚚","status":"ok","supplier":"TransEuro","country":"EU","co2":"42 kg CO₂e"}]'::jsonb,
  '[{"id":"g1","label":"CO₂-Bilanz der Vorkette fehlt","type":"missing","regulation":"EU ESPR","deadline":"2026-12-31"},
    {"id":"g2","label":"Lieferantennachweis Rohstoffe unvollständig","type":"unverified","regulation":"EU ESPR"}]'::jsonb,
  '["ISO 9001"]'::jsonb,
  false
),
(
  '00000000-0000-4000-8000-000000000001',
  'Sensormodul SM-08', 'SM-08', 'Elektronik', '📡', '#FEE2E2', '#DC2626',
  'crit', 41,
  'Kompaktes IoT-Sensormodul zur Zustandsüberwachung.',
  'Muster GmbH', '2025-08-19', 'Tschechien', '0.3 kg', '12 kg CO₂e', 'n/a',
  3, '54 %',
  '[{"name":"Leiterplatte","pct":48,"recycled":false},
    {"name":"Kunststoffgehäuse","pct":37,"recycled":true},
    {"name":"Seltene Erden","pct":15,"recycled":false}]'::jsonb,
  '[{"name":"EU ESPR","status":"crit","note":"Mehrere Nachweise offen"},
    {"name":"RoHS","status":"warn"},
    {"name":"WEEE","status":"pending"}]'::jsonb,
  '[{"stage":"raw","label":"Rohstoffe","emoji":"⛏️","status":"warn","supplier":"unbekannt","country":"—","co2":"—"},
    {"stage":"manufacturing","label":"Fertigung","emoji":"🏭","status":"ok","supplier":"ElektroCZ s.r.o.","country":"Tschechien","co2":"9 kg CO₂e"}]'::jsonb,
  '[{"id":"g3","label":"Herkunftsnachweis Seltene Erden fehlt","type":"missing","regulation":"EU ESPR","deadline":"2026-06-30"},
    {"id":"g4","label":"WEEE-Registrierung ausstehend","type":"missing","regulation":"WEEE","deadline":"2026-03-31"},
    {"id":"g5","label":"RoHS-Konformitätserklärung veraltet","type":"outdated","regulation":"RoHS"}]'::jsonb,
  '[]'::jsonb,
  false
)
on conflict (company_id, sku) do nothing;

-- ── 4. Ergebnis ─────────────────────────────────────────────
select p.name, p.sku, p.status, p.completeness,
       case when p.is_public then '/p/' || p.public_slug else '(nicht öffentlich)' end as pass_url
  from public.products p
  join public.companies c on c.id = p.company_id
 where c.id = '00000000-0000-4000-8000-000000000001'
 order by p.name;
