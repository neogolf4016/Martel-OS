# Target architecture

## Product shape

Martel OS is one private household product with independently evolvable modules. The shell owns identity, household selection, navigation, global search, notifications, AI entry points, and offline status. A module owns its domain rules, UI, queries, commands, permissions, and tests.

```text
Browser / installed PWA
  -> Next.js application shell
     -> module UI + module application services
        -> typed repositories
           -> Supabase Postgres / Realtime / Storage
           -> Edge Functions for privileged integrations
```

## Repository direction

```text
src/
  core/                 shared domain primitives and formatting
  modules/
    home/ grocery/ meals/ pantry/ inventory/ finance/
    family/ calendar/ projects/ documents/
    neogolf/ coastal-tour/ ai/ settings/
  services/
    household-state/    temporary production compatibility adapter
    supabase/            browser/server clients and generated database types
  shared/                accessible UI primitives and design tokens
  shell/                 authentication-aware application shell
supabase/
  migrations/            immutable, ordered database changes
  functions/             Plaid/import/AI/document privileged workflows
docs/architecture/       decisions, threat model, data model, release gates
```

## Data and security boundaries

- Every domain record carries `household_id`.
- Membership, not an exposed key, is the authorization boundary.
- RLS is mandatory on every household table and every Storage bucket.
- Finance and sensitive documents add role/category restrictions beyond household membership.
- Edge Functions hold provider secrets and service-role credentials; neither is exposed to the browser.
- Every external synchronization is idempotent and writes an integration run/audit record.
- AI receives the minimum scoped context required for a requested action. Suggested writes require confirmation before execution.

## Migration strategy

1. Keep `app_state` live as the compatibility source.
2. Deploy membership tables and test RLS independently.
3. Backfill normalized meal, grocery, inventory, and budget rows from a frozen snapshot.
4. Dual-read and compare; do not dual-write until reconciliation is observable.
5. Switch one module at a time behind a feature flag, beginning with groceries.
6. Retain the snapshot as a rollback source for a defined period, then archive it read-only.

## Integration strategy

- Weekly bank refresh: Plaid Link for consent; scheduled Edge Function; cursor-based transaction sync; merchant/category normalization; deduplication by provider transaction ID; dashboard queries only confirmed food/household categories.
- Calendar: provider OAuth tokens encrypted server-side; normalized event cache with source identifiers; conflict-aware sync.
- Documents: private Storage bucket, metadata table, signed URLs, optional OCR/index pipeline, retention policy.
- Imports: CSV/JSON/XLSX enter a staging table, validate, preview, then commit through idempotent commands.
