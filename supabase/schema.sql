-- =====================================================================
--  Colorado Foxes — registrations database (Supabase / Postgres)
--
--  Run this whole file once in Supabase:  Dashboard → SQL Editor → New query
--  → paste → Run.  It is safe to re-run (it only creates what's missing and
--  replaces the functions/policies).
--
--  How data gets in:
--    • Public website forms call the function  submit_registration(...)
--      with the public "anon" key. That function is the ONLY door the public
--      has — visitors can add a registration but can never read, change or
--      delete anything.
--    • Admins (people listed in public.admins) log in on /admin and can
--      read / edit / delete everything.
--    • Any future source (another website, a tournament form, an import
--      script…) can call the same function with its own `source` name, or
--      insert directly while logged in as an admin.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
--  Registration kinds  (add a row here to support a new kind of sign-up)
-- ---------------------------------------------------------------------
create table if not exists public.registration_kinds (
  key        text primary key,          -- used in code, e.g. 'youth'
  label      text not null,             -- shown in the admin, e.g. 'Youth Program'
  sort_order int  not null default 0
);

insert into public.registration_kinds (key, label, sort_order) values
  ('youth',  'Youth Programs',   1),
  ('tryout', 'Pro Team Tryouts', 2)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
--  Registrations  (one row per player / participant)
-- ---------------------------------------------------------------------
create table if not exists public.registrations (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  kind               text not null references public.registration_kinds(key),
  source             text not null default 'website',   -- website, manual, import, …
  season             text,                               -- e.g. 'Fall/Winter 2026'
  program            text,
  location           text,

  player_name        text not null,
  date_of_birth      date,
  guardian_name      text,
  email              text,
  phone              text,

  uniform_size       text,
  position           text,
  experience_level   text,
  notes              text,                               -- what the registrant wrote

  waiver_accepted    boolean not null default false,
  waiver_accepted_at timestamptz,

  -- Admin-managed fields
  payment_status     text not null default 'pending'
                     check (payment_status in ('pending','paid','waived','refunded')),
  gear_status        text not null default 'not_started'
                     check (gear_status in ('not_started','in_production','ready','handed_out')),
  jersey_number      text,
  jersey_name        text,
  status             text not null default 'active'
                     check (status in ('active','cancelled')),
  admin_notes        text,

  -- Anything else a form sends (kept so new forms never lose data)
  extra              jsonb not null default '{}'::jsonb
);

create index if not exists registrations_kind_idx    on public.registrations (kind);
create index if not exists registrations_created_idx on public.registrations (created_at desc);
create index if not exists registrations_email_idx   on public.registrations (lower(email));

-- Keep updated_at fresh
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists registrations_touch on public.registrations;
create trigger registrations_touch before update on public.registrations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
--  Admins  (a logged-in user is an admin only if listed here)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
--  Public submit function — the only thing the website (anon key) can call
-- ---------------------------------------------------------------------
create or replace function public.submit_registration(
  p_kind   text,
  p_data   jsonb,
  p_source text default 'website'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id     uuid;
  v_name   text;
  v_email  text;
  v_dob    date;
  v_known  text[] := array[
    'player_name','full_name','date_of_birth','guardian_name','email','phone',
    'uniform_size','position','experience_level','notes','program','location',
    'season','waiver_accepted','website'
  ];
  v_extra  jsonb := '{}'::jsonb;
  k        text;
begin
  -- Spam honeypot: real people never fill the hidden "website" field
  if coalesce(p_data->>'website', '') <> '' then
    return null;
  end if;

  if not exists (select 1 from registration_kinds where key = p_kind) then
    raise exception 'Unknown registration kind: %', p_kind;
  end if;

  v_name  := left(btrim(coalesce(p_data->>'player_name', p_data->>'full_name', '')), 120);
  v_email := left(lower(btrim(coalesce(p_data->>'email', ''))), 200);

  if v_name = '' then
    raise exception 'Name is required';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email is required';
  end if;

  begin
    v_dob := nullif(p_data->>'date_of_birth', '')::date;
  exception when others then
    raise exception 'Invalid date of birth';
  end;

  -- Light flood protection: max 10 submissions per email per 10 minutes
  if (select count(*) from registrations
      where lower(email) = v_email and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'Too many submissions — please try again later';
  end if;

  -- Keep any fields we don't have a column for
  for k in select jsonb_object_keys(p_data) loop
    if not (k = any(v_known)) then
      v_extra := v_extra || jsonb_build_object(k, left(p_data->>k, 2000));
    end if;
  end loop;

  insert into registrations (
    kind, source, season, program, location,
    player_name, date_of_birth, guardian_name, email, phone,
    uniform_size, position, experience_level, notes,
    waiver_accepted, waiver_accepted_at, extra
  ) values (
    p_kind,
    left(coalesce(nullif(btrim(p_source), ''), 'website'), 60),
    left(nullif(btrim(p_data->>'season'), ''), 80),
    left(nullif(btrim(p_data->>'program'), ''), 200),
    left(nullif(btrim(p_data->>'location'), ''), 120),
    v_name,
    v_dob,
    left(nullif(btrim(p_data->>'guardian_name'), ''), 120),
    v_email,
    left(nullif(btrim(p_data->>'phone'), ''), 40),
    left(nullif(btrim(p_data->>'uniform_size'), ''), 40),
    left(nullif(btrim(p_data->>'position'), ''), 60),
    left(nullif(btrim(p_data->>'experience_level'), ''), 80),
    left(nullif(btrim(p_data->>'notes'), ''), 2000),
    coalesce(p_data->>'waiver_accepted', '') <> '',
    case when coalesce(p_data->>'waiver_accepted', '') <> '' then now() end,
    v_extra
  )
  returning id into v_id;

  return v_id;
end $$;

-- ---------------------------------------------------------------------
--  Security (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.registrations      enable row level security;
alter table public.registration_kinds enable row level security;
alter table public.admins             enable row level security;

-- Registrations: admins only (the public goes through submit_registration)
drop policy if exists "admins read registrations"   on public.registrations;
drop policy if exists "admins insert registrations" on public.registrations;
drop policy if exists "admins update registrations" on public.registrations;
drop policy if exists "admins delete registrations" on public.registrations;
create policy "admins read registrations"   on public.registrations for select to authenticated using (public.is_admin());
create policy "admins insert registrations" on public.registrations for insert to authenticated with check (public.is_admin());
create policy "admins update registrations" on public.registrations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete registrations" on public.registrations for delete to authenticated using (public.is_admin());

-- Kinds: admins can read and add new kinds
drop policy if exists "admins read kinds"  on public.registration_kinds;
drop policy if exists "admins write kinds" on public.registration_kinds;
create policy "admins read kinds"  on public.registration_kinds for select to authenticated using (public.is_admin());
create policy "admins write kinds" on public.registration_kinds for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admins table: an admin can see who the admins are (add admins from the SQL editor)
drop policy if exists "admins read admins" on public.admins;
create policy "admins read admins" on public.admins for select to authenticated using (public.is_admin());

-- The public (anon) can do nothing with the tables directly…
revoke all on public.registrations, public.registration_kinds, public.admins from anon;
-- …only call the submit function
revoke all on function public.submit_registration(text, jsonb, text) from public;
grant execute on function public.submit_registration(text, jsonb, text) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- =====================================================================
--  MAKE YOURSELF AN ADMIN  (after creating your login user)
--  1) Dashboard → Authentication → Users → Add user → email + password
--  2) Run this, with your email:
--
--     insert into public.admins (user_id, email)
--     select id, email from auth.users where email = 'you@example.com'
--     on conflict (user_id) do nothing;
-- =====================================================================
