-- Crash breadcrumbs: fatal JS errors persisted on-device at crash time are
-- uploaded here on the next launch (src/lib/crash-report.ts). Write-only for
-- clients: anyone may insert, nobody may read/change rows through the API —
-- read them in the dashboard SQL editor.

create table if not exists public.crash_reports (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  crashed_at timestamptz,
  app_version text,
  is_fatal boolean,
  message text,
  stack text
);

alter table public.crash_reports enable row level security;

create policy "crash_reports_insert_any"
  on public.crash_reports for insert
  to anon, authenticated
  with check (true);
-- no select/update/delete policies: API clients can only write
