-- Run this in Supabase: SQL Editor > New query > paste > Run
-- Safe to run more than once. If you already ran an older version, this upgrades it.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,                                -- Boiler, Pumps, New construction, Gas re-pipes...
  subtype text,                                 -- Steel, Booster, Single units...
  description text,
  photos jsonb not null default '[]'::jsonb,    -- [{url, label, caption}] first photo is the cover
  published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Upgrade from the older version (had a single "type" column)
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'projects' and column_name = 'type') then
    alter table public.projects rename column type to category;
  end if;
end $$;
alter table public.projects add column if not exists subtype text;
alter table public.projects alter column category drop not null;

alter table public.projects enable row level security;

drop policy if exists "public reads published" on public.projects;
drop policy if exists "admin reads all" on public.projects;
drop policy if exists "admin inserts" on public.projects;
drop policy if exists "admin updates" on public.projects;
drop policy if exists "admin deletes" on public.projects;

-- Visitors can only see published projects
create policy "public reads published" on public.projects
  for select using (published = true);

-- Logged-in admin can do everything
create policy "admin reads all" on public.projects
  for select to authenticated using (true);
create policy "admin inserts" on public.projects
  for insert to authenticated with check (true);
create policy "admin updates" on public.projects
  for update to authenticated using (true) with check (true);
create policy "admin deletes" on public.projects
  for delete to authenticated using (true);

-- Photo storage (public so the website can show them)
insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', true)
on conflict (id) do nothing;

drop policy if exists "public reads photos" on storage.objects;
drop policy if exists "admin uploads photos" on storage.objects;
drop policy if exists "admin updates photos" on storage.objects;
drop policy if exists "admin deletes photos" on storage.objects;

create policy "public reads photos" on storage.objects
  for select using (bucket_id = 'project-photos');
create policy "admin uploads photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'project-photos');
create policy "admin updates photos" on storage.objects
  for update to authenticated using (bucket_id = 'project-photos');
create policy "admin deletes photos" on storage.objects
  for delete to authenticated using (bucket_id = 'project-photos');
