create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  org_number text not null unique check (org_number ~ '^[0-9]{9}$'),
  name text not null,
  entity_type text not null check (entity_type <> ''),
  address text not null default '',
  postal_code text not null default '',
  city text not null default '',
  status_text text not null default '',
  source text not null default 'manual',
  created_by uuid not null references auth.users(id) on delete restrict,
  identity_confirmed_at timestamptz,
  identity_locked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.companies add column if not exists status_text text not null default '';
alter table public.companies add column if not exists address text not null default '';
alter table public.companies add column if not exists postal_code text not null default '';
alter table public.companies add column if not exists city text not null default '';
alter table public.companies add column if not exists source text not null default 'manual';
alter table public.companies add column if not exists created_by uuid references auth.users(id) on delete restrict;
alter table public.companies add column if not exists identity_confirmed_at timestamptz;
alter table public.companies add column if not exists identity_locked_at timestamptz;
alter table public.companies add column if not exists created_at timestamptz not null default now();

create table if not exists public.company_memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'reviewer', 'read_only')),
  invited_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

alter table public.company_memberships add column if not exists accepted_at timestamptz;
alter table public.company_memberships add column if not exists created_at timestamptz not null default now();

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  category text not null,
  action text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  income_year integer not null check (income_year between 2000 and 2100),
  document_type text not null,
  name text not null,
  linked_to text not null,
  status text not null default 'attached',
  retention_years integer not null default 5,
  storage_key text not null unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists companies_created_by_idx on public.companies(created_by);
create index if not exists company_memberships_user_id_idx on public.company_memberships(user_id);
create index if not exists audit_events_company_id_created_at_idx on public.audit_events(company_id, created_at desc);
create index if not exists documents_company_id_income_year_idx on public.documents(company_id, income_year);

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.audit_events enable row level security;
alter table public.documents enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.companies to authenticated;
grant select, insert, update on public.company_memberships to authenticated;
grant select, insert on public.audit_events to authenticated;
grant select, insert on public.documents to authenticated;

drop policy if exists "owners can create companies" on public.companies;
create policy "owners can create companies"
on public.companies for insert
to authenticated
with check (created_by = (select auth.uid()));

drop policy if exists "company members can read companies" on public.companies;
create policy "company members can read companies"
on public.companies for select
to authenticated
using (created_by = (select auth.uid()));

drop policy if exists "owners can lock their new company identity" on public.companies;
create policy "owners can lock their new company identity"
on public.companies for update
to authenticated
using (created_by = (select auth.uid()))
with check (created_by = (select auth.uid()));

drop policy if exists "users can read their memberships" on public.company_memberships;
create policy "users can read their memberships"
on public.company_memberships for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "company creator can add owner membership" on public.company_memberships;
create policy "company creator can add owner membership"
on public.company_memberships for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
    from public.companies c
    where c.id = company_memberships.company_id
      and c.created_by = (select auth.uid())
  )
);

drop policy if exists "owners can update their own membership acceptance" on public.company_memberships;
create policy "owners can update their own membership acceptance"
on public.company_memberships for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "company members can read audit events" on public.audit_events;
create policy "company members can read audit events"
on public.audit_events for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships m
    where m.company_id = audit_events.company_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "company members can create audit events for themselves" on public.audit_events;
create policy "company members can create audit events for themselves"
on public.audit_events for insert
to authenticated
with check (
  actor_id = (select auth.uid())
  and (
    exists (
      select 1
      from public.companies c
      where c.id = audit_events.company_id
        and c.created_by = (select auth.uid())
    )
    or exists (
      select 1
      from public.company_memberships m
      where m.company_id = audit_events.company_id
        and m.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "company members can read document metadata" on public.documents;
create policy "company members can read document metadata"
on public.documents for select
to authenticated
using (
  exists (
    select 1
    from public.company_memberships m
    where m.company_id = documents.company_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "owners can create document metadata" on public.documents;
create policy "owners can create document metadata"
on public.documents for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.company_memberships m
    where m.company_id = documents.company_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-documents',
  'company-documents',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg', 'text/csv']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "company members can read company document objects" on storage.objects;
create policy "company members can read company document objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'company-documents'
  and exists (
    select 1
    from public.company_memberships m
    where m.company_id = ((storage.foldername(name))[1])::uuid
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "owners can upload company document objects" on storage.objects;
create policy "owners can upload company document objects"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-documents'
  and exists (
    select 1
    from public.company_memberships m
    where m.company_id = ((storage.foldername(name))[1])::uuid
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  )
);
