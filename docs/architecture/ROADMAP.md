# Production roadmap

## Phase 1 — stabilize the foundation

- Completed: architectural and security review.
- Completed: split the existing screens into module boundaries.
- Completed: isolate the legacy Supabase snapshot behind one compatibility service.
- Completed: remove existing encoding artifacts and add a typecheck command.
- Completed: true Allan/Stefanie, bidirectional, two-session production regression.

## Phase 2 — identity, households, and normalized grocery data

- In progress: additive household bootstrap and normalized shadow schema.
- Create the Martel household and attach both existing accounts.
- Deploy and adversarially test membership RLS before any screen cutover.
- Back up and backfill groceries, meals, inventory, and budget data without modifying `app_state`.
- Switch groceries to record-level tables/realtime behind a feature flag.
- Add audit history, conflict-safe mutations, deletion/undo, and automated tests.

## Phase 3 — finance and weekly transaction refresh

- Add Plaid Link through a server-side Edge Function.
- Store encrypted provider credentials and cursor state.
- Schedule weekly sync plus an on-demand refresh.
- Normalize merchants and categories; add review/recategorization UI.
- Reconcile dashboard totals with source transactions and expose sync health.

## Phase 4 — family operations

- Family profiles, calendar, chores, projects, documents, notifications.
- Global search, command palette, activity feed, dark mode, PWA offline queue.

## Phase 5 — business modules and AI

- NeoGolf and Coastal Tour share projects, tasks, calendar, files, and finance primitives.
- AI assistant uses permission-scoped retrieval, transparent citations to Martel records, action previews, confirmations, and audit logs.

## Definition of done for every module

- Responsive and keyboard accessible.
- Explicit empty/loading/error/offline states.
- Household-scoped RLS tests, unit tests, and an end-to-end critical path.
- Import/export and recovery behavior documented.
- Observability, audit fields, data retention, and rollback defined.
