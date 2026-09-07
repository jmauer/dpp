-- ============================================================
-- DPP Dashboard – Initiales Supabase-Schema
--
-- Modellierung: Kernfelder als echte Spalten (filter- und sortierbar),
-- die verschachtelten Strukturen aus dem TS-Interface `Product`
-- (materials, regulations, supplyChain, gaps, certifications) als jsonb.
-- Das haelt die erste Migration klein; einzelne jsonb-Felder koennen
-- spaeter in eigene Tabellen normalisiert werden, wenn darauf
-- tatsaechlich gejoint oder aggregiert werden muss.
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Mandanten ───────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ── Profile (1:1 zu auth.users, traegt Rolle + Mandant) ─────
create type public.user_role as enum ('admin', 'manager', 'viewer');

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  company_id  uuid references public.companies (id) on delete set null,
  email       text not null,
  first_name  text not null default '',
  last_name   text not null default '',
  role        public.user_role not null default 'viewer',
  language    text not null default 'de',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  last_login_at timestamptz
);

-- ── Produkte ────────────────────────────────────────────────
create type public.product_status as enum ('ok', 'warn', 'crit', 'draft');

create table if not exists public.products (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete cascade,

  name                text not null,
  sku                 text not null,
  category            text not null default '',
  emoji               text not null default '',
  icon_bg             text not null default '',
  icon_color          text not null default '',

  status              public.product_status not null default 'draft',
  completeness        smallint not null default 0
                        check (completeness between 0 and 100),

  description         text not null default '',
  manufacturer        text not null default '',
  manufacturing_date  date,
  country_of_origin   text not null default '',
  weight              text not null default '',
  co2_total           text not null default '',
  energy_class        text not null default '',
  repairability_index smallint not null default 0
                        check (repairability_index between 0 and 10),
  recycling_rate      text not null default '',

  -- verschachtelte Strukturen aus dem TS-Interface
  materials           jsonb not null default '[]'::jsonb,
  regulations         jsonb not null default '[]'::jsonb,
  supply_chain        jsonb not null default '[]'::jsonb,
  gaps                jsonb not null default '[]'::jsonb,
  certifications      jsonb not null default '[]'::jsonb,

  -- oeffentlich per /p/<public_slug> abrufbar
  public_slug         text unique default encode(gen_random_bytes(9), 'base64'),
  is_public           boolean not null default false,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists products_company_sku_key
  on public.products (company_id, sku);
create index if not exists products_company_status_idx
  on public.products (company_id, status);

-- updated_at automatisch pflegen
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- Grundregel: ein User sieht ausschliesslich Daten seines Mandanten.
-- ============================================================

alter table public.companies enable row level security;
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;

-- Hilfsfunktion: Mandant des angemeldeten Users.
-- SECURITY DEFINER + leerer search_path, damit die Policies sich nicht
-- rekursiv selbst auswerten.
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- profiles: eigenes Profil lesen/aendern, Kollegen lesen
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid() or company_id = public.current_company_id()
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- companies: nur den eigenen Mandanten
drop policy if exists companies_select on public.companies;
create policy companies_select on public.companies
  for select using (id = public.current_company_id());

-- products: lesen im eigenen Mandanten
drop policy if exists products_select on public.products;
create policy products_select on public.products
  for select using (company_id = public.current_company_id());

-- products: schreiben nur admin/manager (entspricht auth.can('write'))
drop policy if exists products_insert on public.products;
create policy products_insert on public.products
  for insert with check (
    company_id = public.current_company_id()
    and public.current_user_role() in ('admin', 'manager')
  );

drop policy if exists products_update on public.products;
create policy products_update on public.products
  for update using (
    company_id = public.current_company_id()
    and public.current_user_role() in ('admin', 'manager')
  );

drop policy if exists products_delete on public.products;
create policy products_delete on public.products
  for delete using (
    company_id = public.current_company_id()
    and public.current_user_role() = 'admin'
  );

-- ============================================================
-- Oeffentlicher Produktpass (/p/<slug>) – ohne Login lesbar.
-- Keine RLS-Policy auf products fuer anon: stattdessen eine View,
-- die ausschliesslich freigegebene Produkte und nur die fuer die
-- Oeffentlichkeit bestimmten Felder zeigt.
-- ============================================================
create or replace view public.public_product_passports
with (security_invoker = off) as
  select
    public_slug, name, sku, category, emoji, description,
    manufacturer, manufacturing_date, country_of_origin, weight,
    materials, regulations, supply_chain, certifications,
    co2_total, energy_class, repairability_index, recycling_rate,
    updated_at
  from public.products
  where is_public = true;

grant select on public.public_product_passports to anon, authenticated;

-- ── Neues auth.users → automatisch ein Profil anlegen ────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
