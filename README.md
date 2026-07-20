# Martel OS

Martel OS is a private, mobile-first family operating system. The current production slice includes shared meal planning, groceries, home inventory, food/household budgeting, Supabase authentication, realtime cross-device sync, and JSON backup/restore.

## Architecture status

The application is in a staged migration from a legacy shared JSON snapshot to household-scoped normalized records. The compatibility layer in `src/services/household-state` preserves the existing production behavior. The normalized migrations are additive, but must be applied in order and verified before any screen is switched away from `app_state`.

Read these before changing the database:

- `docs/architecture/ARCHITECTURE_REVIEW.md`
- `docs/architecture/TARGET_ARCHITECTURE.md`
- `docs/architecture/ROADMAP.md`

## Repository structure

```text
app/                    Next.js entry points and global styles
src/core/               current shared domain model
src/modules/            product modules
src/services/           Supabase and state adapters
src/shared/             shared UI primitives
src/shell/              authenticated application shell
supabase/schema.sql     current production-compatible schema
supabase/migrations/    reviewed future migrations
docs/architecture/      review, target design, and rollout plan
```

## Local development

Copy `.env.example` to `.env.local`, fill in the public Supabase values, then run:

```bash
npm install
npm run dev
```

Without Supabase environment variables, the app uses browser storage in local-device mode.

## Required environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=<project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public anon key>
NEXT_PUBLIC_HOUSEHOLD_KEY=<legacy compatibility key>
```

The household key is not a security credential. Current production RLS must be replaced with membership-based RLS before adding finance connections, documents, medical information, or any non-Martel user.

Never expose a Supabase service-role key, bank provider secret, or OAuth client secret to the browser. Privileged integrations belong in server-side functions.

## Verification

```bash
npm run typecheck
npm run build
```

Before release, also complete the two-session grocery sync gates in the architecture review.
