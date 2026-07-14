-- Account sync: favorites + avatar mirror tables.
-- Run this in the Supabase dashboard (SQL editor). Local AsyncStorage stays the
-- source of truth; these tables are a best-effort mirror scoped to auth.uid().

-- ── profiles: one row per user, holds the chosen avatar id ───────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  avatar_id text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user may only touch their own profile row.
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_delete_own"
  on public.profiles for delete
  using (id = auth.uid());

-- ── favorites: one row per (user, saved soul) ────────────────────────────────
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  qid text not null,
  soul jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, qid)
);

alter table public.favorites enable row level security;

-- A user may only touch their own favorite rows.
create policy "favorites_select_own"
  on public.favorites for select
  using (user_id = auth.uid());

create policy "favorites_insert_own"
  on public.favorites for insert
  with check (user_id = auth.uid());

create policy "favorites_update_own"
  on public.favorites for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "favorites_delete_own"
  on public.favorites for delete
  using (user_id = auth.uid());
