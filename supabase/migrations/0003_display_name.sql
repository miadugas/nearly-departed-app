-- Patch: add the user-chosen display name to the account profile mirror.
-- Existing own-row RLS policies cover this additive column.

alter table public.profiles add column if not exists display_name text;
