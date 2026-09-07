-- ============================================================
-- Oeffentliche Pass-View um Status-Felder ergaenzen.
--
-- Die Seite /p/<slug> zeigt Status-Badge und Vollstaendigkeit an.
-- Beides ist unkritisch (steht ohnehin auf dem Pass), die interne
-- Lueckenliste `gaps` bleibt bewusst draussen.
-- ============================================================

drop view if exists public.public_product_passports;

create view public.public_product_passports
with (security_invoker = off) as
  select
    public_slug, name, sku, category, emoji, icon_bg, icon_color,
    description, manufacturer, manufacturing_date, country_of_origin,
    weight, materials, regulations, supply_chain, certifications,
    co2_total, energy_class, repairability_index, recycling_rate,
    status, completeness,
    created_at, updated_at
  from public.products
  where is_public = true;

grant select on public.public_product_passports to anon, authenticated;
