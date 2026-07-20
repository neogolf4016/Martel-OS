# Martel OS architecture review

Status: Phase 1 review and compatibility refactor
Baseline: production commit `43afb28`
Production database changes in this phase: none

## Executive assessment

The current application is a useful, working grocery/meal/inventory dashboard and its two-session Supabase realtime behavior must be preserved. It is not yet a safe foundation for family finance, documents, medical information, or a multi-module operating system.

The highest-risk issue is authorization. `NEXT_PUBLIC_HOUSEHOLD_KEY` is shipped to every browser, while the current RLS policies allow every authenticated user to read or modify every `app_state` row. The key selects a row; it is not an access-control boundary.

The second major constraint is the single JSONB snapshot. Every module writes the full object, producing last-write-wins behavior. Simultaneous edits to different areas can overwrite one another, records cannot be queried or audited efficiently, and integrations cannot safely upsert individual transactions or calendar events.

## Findings by priority

### Critical

1. Household isolation is absent. Any authenticated account can access all household snapshots.
2. Sensitive domains have no role model. Finance, documents, family health, and integrations require owner/admin/adult/child/service permissions.
3. The browser writes the entire household state directly. There is no trusted service boundary for imports, bank synchronization, AI actions, or privileged operations.

### High

1. `Dashboard.tsx` combines navigation, data access, synchronization, calculations, mutations, import/export, and six screens.
2. One JSON row creates concurrency conflicts and prevents record-level realtime, history, search, reporting, and foreign-key integrity.
3. There is no migration history; the schema is a single mutable setup file.
4. JSON import is structurally unvalidated and can replace all household data.
5. Errors are reduced to a sync badge. There is no recoverable error UI, structured logging, retry queue, or conflict handling.

### Medium

1. The PWA manifest has no icons and there is no service worker/offline mutation queue.
2. There are no automated tests, CI checks, linting, or accessibility regression checks.
3. Navigation has no URLs, route-level loading boundaries, deep links, or command/search architecture.
4. UI tokens exist only as global CSS variables; dark mode and a reusable component system are not established.
5. README deployment guidance references a different repository and contains encoding artifacts.

## Phase 1 decision

The app now has module boundaries under `src/modules`, shared UI under `src/shared`, a shell under `src/shell`, and a single compatibility data hook under `src/services/household-state`. The compatibility hook deliberately retains the production `app_state` contract so the grocery list and realtime behavior do not change.

No normalized migration should be applied until a household is created, both existing accounts are attached to it, production data is backed up, and a repeatable backfill/reconciliation test passes.

## Release gates

- Existing account sign-in succeeds.
- Existing grocery state loads without reset.
- Check, add, and quantity changes synchronize between two sessions.
- Meal planning, inventory, budget, JSON export/import, reset, and sign-out still work.
- A backup of `app_state` exists before any database migration.
- RLS is tested with two Martel accounts and a third non-member account.
