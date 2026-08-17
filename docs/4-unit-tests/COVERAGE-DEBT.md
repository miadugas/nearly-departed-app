# Coverage Debt Ledger

| path | why hard | escape plan |
| --- | --- | --- |
| supabase/functions/delete-account/index.ts | Deno runtime — no Deno on dev machine, vitest can't import npm: specifiers; auth gating (405/401) and Apple revocation binding are the testable core | Install Deno + `deno test` with fetch/env stubs, or cover via the planned manual integration round trip (SQL row-proof + Apple revocation evidence) before release |
