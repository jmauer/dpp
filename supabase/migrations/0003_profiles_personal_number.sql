-- Personalnummer ergaenzen – wird im Team-Bereich erfasst.
alter table public.profiles
  add column if not exists personal_number text not null default '';

-- Eindeutig je Mandant, aber Leerwerte mehrfach zulassen
create unique index if not exists profiles_company_personal_number_key
  on public.profiles (company_id, personal_number)
  where personal_number <> '';
