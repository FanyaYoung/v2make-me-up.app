# Migration Reconciliation (2026-03-16)

## Context
- Original local and remote histories were fully divergent (`65 local-only`, `65 remote-only`).
- Remote history was fetched into `supabase/migrations`.
- Previous local files were backed up to `supabase/migrations_backup_20260316_110943`.

## Comparison method
- Compared backup vs fetched migration SQL by normalized hash (whitespace + repeated semicolon insensitive).
- Found 14 backup-only SQL contents and 14 fetched-only SQL contents.

## Keep (recreate as new forward migrations)
- `20250715180659_5418e7c1-75a3-439c-90be-c86ad65e2f7f.sql`
  - Adds `user_match_usage` table + RLS policies.
- `20250716013944_c7c15d14-7d27-4c2b-a25e-75b9c6d15a1b.sql`
  - Profile/storage schema/policy enhancements.
- `20250805153250_4bdc353a-e94a-4ea9-947a-8325ddee1f20.sql`
  - Performance indexes + RLS/search_path fixes.
- `20250805155918_de1beddd-f742-4cb9-b0db-e64556fc19d9.sql`
  - RLS policy consolidation cleanup.
- `20250805190826_147c213c-8ed3-41c7-9430-14c2df3df6b4.sql`
  - Additional RLS policy performance optimization.
- `20250827223933_d974d8df-873b-4c5b-8aa7-a8becb56c94a.sql`
  - Vector-based foundation matching schema/functions.

## Drop (do not reapply)
- `20250709234620_9cc4bda2-a401-4eac-bc71-7349ae169d63.sql`
  - Duplicate seed content.
- `20250709234709_7ce01595-a931-4c88-838b-702524c22129.sql`
  - Duplicate seed content.
- `20250715180938_d39e1207-b3a1-47b3-b116-04271253c958.sql`
  - Duplicate iteration of `user_match_usage` migration.
- `20250715192241_019a5c1d-cf35-45ff-8fd7-fc2aca9e1da2.sql`
  - Function update iteration not selected for reapply.
- `20250715192509_411b85aa-ac72-4ef7-9952-032e0785be53.sql`
  - User-specific seed/account manipulation (`fanya.uxd@gmail.com`).
- `20250715193004_692e5864-6f15-4d82-a8f9-2e6063a33fd7.sql`
  - User-specific cleanup/seed manipulation.
- `20250728171828_9621a431-1795-46c2-8a42-28212761b8ec.sql`
  - Earlier data-sync iteration.
- `20250728171915_80c5f4dc-2abc-47c8-b9bc-7559cb2badb2.sql`
  - Earlier data-sync iteration.
- `20250728172140_8ac0710f-0e8f-4a6e-a2ab-bff592357c53.sql`
  - Data-sync/seed migration not selected for forward reapply.

## Notes
- No remote DB changes were executed in this reconciliation process.
- Recreated migrations are local files only until explicitly pushed/applied.
