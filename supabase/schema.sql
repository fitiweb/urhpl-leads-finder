-- Fitiwebs Lead Finder v3
-- Run in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  website text,
  email text,
  phone text,
  address text,
  city text default 'Ibadan',
  state text default 'Oyo',
  source text default 'manual',
  google_place_id text,
  contact_name text,
  service_fit text default 'Website development + SEO',
  lead_status text not null default 'New'
    check (lead_status in ('New','Qualified','Contacted','Replied','Won','Lost','Do not contact')),
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  email_verified text default 'unknown'
    check (email_verified in ('unknown','valid','invalid','accept_all','webmail','disposable','risky')),
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leads_user_place_unique
  on public.leads(user_id, google_place_id)
  where google_place_id is not null;
create unique index if not exists leads_user_email_unique
  on public.leads(user_id, lower(email))
  where email is not null and length(trim(email)) > 0;
create index if not exists leads_user_created_idx on public.leads(user_id, created_at desc);
create index if not exists leads_user_status_idx on public.leads(user_id, lead_status);

alter table public.leads enable row level security;

drop policy if exists "Users can view their own leads" on public.leads;
create policy "Users can view their own leads"
  on public.leads for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert their own leads" on public.leads;
create policy "Users can insert their own leads"
  on public.leads for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update their own leads" on public.leads;
create policy "Users can update their own leads"
  on public.leads for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own leads" on public.leads;
create policy "Users can delete their own leads"
  on public.leads for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.leads to authenticated;
revoke all on public.leads from anon;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
for each row execute function public.set_updated_at();