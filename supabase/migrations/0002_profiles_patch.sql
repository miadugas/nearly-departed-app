-- Patch: public.profiles pre-existed 0001 (created by the auth signup setup),
-- so `create table if not exists` skipped it. Add the column avatar sync
-- expects, and remove the template-era policies superseded by 0001's.

alter table public.profiles add column if not exists avatar_id text;

-- Template policy `SELECT using (true)` exposed every profile row to anonymous
-- clients. Own-row access is covered by profiles_select_own (0001).
drop policy "profiles readable" on public.profiles;

-- Duplicate of profiles_update_own (0001).
drop policy "update own profile" on public.profiles;
