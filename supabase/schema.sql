-- ============================================================
-- Verso V2 — initial schema with Row-Level Security
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)
-- Idempotent: safe to re-run.
-- ============================================================

-- 1) Tables ---------------------------------------------------

create table if not exists public.items (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('article','pdf')),
  title        text not null,
  byline       text,
  site_name    text,
  url          text,
  excerpt      text,
  thumb        text,
  word_count   integer,
  read_minutes integer,
  archived     boolean not null default false,
  bookmarked   boolean not null default false,
  progress     real    not null default 0,
  created_at   bigint  not null,
  updated_at   bigint  not null
);

create index if not exists items_user_updated_idx
  on public.items (user_id, updated_at desc);

create table if not exists public.articles (
  item_id     text primary key references public.items(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  html        text not null,
  text_length integer not null
);

create table if not exists public.highlights (
  id         text primary key,
  item_id    text not null references public.items(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  color      text not null check (color in ('key','insight','important','question')),
  text       text not null,
  prefix     text not null default '',
  suffix     text not null default '',
  page       integer,
  note       text,
  created_at bigint not null
);

create index if not exists highlights_item_idx
  on public.highlights (item_id, created_at);
create index if not exists highlights_user_idx
  on public.highlights (user_id, created_at desc);

create table if not exists public.pdfs (
  item_id      text primary key references public.items(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  byte_size    bigint
);

create table if not exists public.user_settings (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  theme        text not null default 'paper',
  font_mode    text not null default 'editorial',
  font_size    integer not null default 19,
  line_height  real    not null default 1.7,
  column_width integer not null default 720,
  updated_at   bigint not null
);

-- 2) Row-Level Security --------------------------------------

alter table public.items          enable row level security;
alter table public.articles       enable row level security;
alter table public.highlights     enable row level security;
alter table public.pdfs           enable row level security;
alter table public.user_settings  enable row level security;

-- items
drop policy if exists "items: owner read"   on public.items;
drop policy if exists "items: owner write"  on public.items;
create policy "items: owner read"  on public.items
  for select using (auth.uid() = user_id);
create policy "items: owner write" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- articles
drop policy if exists "articles: owner read"   on public.articles;
drop policy if exists "articles: owner write"  on public.articles;
create policy "articles: owner read"  on public.articles
  for select using (auth.uid() = user_id);
create policy "articles: owner write" on public.articles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- highlights
drop policy if exists "highlights: owner read"   on public.highlights;
drop policy if exists "highlights: owner write"  on public.highlights;
create policy "highlights: owner read"  on public.highlights
  for select using (auth.uid() = user_id);
create policy "highlights: owner write" on public.highlights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pdfs
drop policy if exists "pdfs: owner read"   on public.pdfs;
drop policy if exists "pdfs: owner write"  on public.pdfs;
create policy "pdfs: owner read"  on public.pdfs
  for select using (auth.uid() = user_id);
create policy "pdfs: owner write" on public.pdfs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_settings
drop policy if exists "settings: owner read"   on public.user_settings;
drop policy if exists "settings: owner write"  on public.user_settings;
create policy "settings: owner read"  on public.user_settings
  for select using (auth.uid() = user_id);
create policy "settings: owner write" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Realtime -------------------------------------------------
-- Add tables to the realtime publication so the client can subscribe.
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.highlights;

-- 4) Storage bucket for PDFs ----------------------------------
-- Create the bucket and lock it down so users can only see/write
-- objects under their own user_id prefix.
insert into storage.buckets (id, name, public)
  values ('pdfs','pdfs', false)
on conflict (id) do nothing;

drop policy if exists "pdfs storage: owner read"   on storage.objects;
drop policy if exists "pdfs storage: owner write"  on storage.objects;
drop policy if exists "pdfs storage: owner delete" on storage.objects;

create policy "pdfs storage: owner read" on storage.objects
  for select using (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "pdfs storage: owner write" on storage.objects
  for insert with check (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "pdfs storage: owner delete" on storage.objects
  for delete using (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
