# Production Audit Checklist

This is the exhaustive checklist used by the `production-audit` skill. Each section describes what to look for, how to investigate, and what constitutes a finding.

---

## SQL Queries for Supabase MCP

Use these with the Supabase MCP `execute_sql` tool during Phase 2.

### List All Indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### RLS Status for All Tables

```sql
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relname;
```

### RLS Policies Per Table

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### SECURITY DEFINER Functions

```sql
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  p.prosecdef AS is_security_definer,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;
```

### Tables Without Indexes (Warning)

```sql
SELECT c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes i
    WHERE i.schemaname = 'public'
      AND i.tablename = c.relname
      AND i.indexname NOT LIKE '%_pkey'
  )
ORDER BY c.relname;
```

### Active Triggers

```sql
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### Table Row Counts (Approximate)

```sql
SELECT
  relname AS table_name,
  n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

---

## Security Checks

### S1. Edge Function Authentication
- **What**: Every Supabase Edge Function must validate an `Authorization` header or `CRON_SECRET` before processing requests.
- **How**: Read each file under `supabase/functions/*/index.ts`. Check the first lines of the handler for auth validation.
- **Finding if**: The handler processes requests without checking `Authorization` header.
- **Priority**: P0

### S2. Cron Job Auth Headers
- **What**: Cron jobs calling edge functions via `pg_net.http_post()` must include auth headers.
- **How**: Search migration files for `cron.schedule` and inspect the `headers` parameter.
- **Finding if**: The headers JSON does not include an `Authorization` key.
- **Priority**: P0

### S3. Server Action Input Validation
- **What**: All server action parameters (`id` strings, form data) must be validated with Zod schemas.
- **How**: Read all `"use server"` files. Check that every function parameter is validated before use.
- **Finding if**: Any `id: string` parameter is used in a `.eq("id", id)` call without prior `z.string().uuid()` validation.
- **Priority**: P0

### S4. SECURITY DEFINER Triggers
- **What**: PostgreSQL functions marked `SECURITY DEFINER` bypass RLS. They must validate user ownership internally.
- **How**: Use the SQL query above to list all `SECURITY DEFINER` functions. Review their bodies for `user_id` checks.
- **Finding if**: A SECURITY DEFINER function inserts, updates, or deletes without checking row ownership.
- **Priority**: P1

### S5. Data Exposure via Over-Fetching
- **What**: Server components should not fetch sensitive columns (e.g., `fcm_token`) and pass them to client components.
- **How**: Search for `.select("*")` in server components. Trace the data flow to see if it reaches a `"use client"` component.
- **Finding if**: Sensitive fields are serialized to the client via React props.
- **Priority**: P1

### S6. Rate Limiting on Auth Actions
- **What**: Signup, login, and password reset server actions should be rate-limited.
- **How**: Check server actions for any rate-limiting mechanism (middleware, in-memory store, Redis, or Supabase built-in limits).
- **Finding if**: No rate limiting is present.
- **Priority**: P1

### S7. Password Policy Strength
- **What**: Zod validation for passwords should enforce sufficient complexity.
- **How**: Read `lib/validations/auth.ts`. Check min length, character class requirements.
- **Finding if**: Password is < 10 chars, or missing uppercase/lowercase/number/special requirements.
- **Priority**: P2

### S8. Secret Management
- **What**: `.gitignore` must cover all env files. `.env.example` must not contain actual values.
- **How**: Read `.gitignore` and `.env.example`.
- **Finding if**: Env files are not gitignored, or `.env.example` has filled-in values.
- **Priority**: P3

---

## Performance Checks

### P1. Query Column Selection
- **What**: Supabase queries should select only needed columns, not `*`.
- **How**: `grep` for `.select("*")` across all `.ts`/`.tsx` files.
- **Finding if**: Any query uses `select("*")` when a subset of columns would suffice.
- **Priority**: P1

### P2. Missing Database Indexes
- **What**: Tables queried with `.eq()`, `.gte()`, `.order()` should have corresponding indexes.
- **How**: Compare the "List All Indexes" SQL output with the queries in server components/actions.
- **Finding if**: A frequently queried column or column combination has no index.
- **Priority**: P1

### P3. Analytics Computation Efficiency
- **What**: Functions that process arrays (filtering, reducing) should minimize passes.
- **How**: Read `lib/analytics.ts` and count how many times the payments/subscriptions arrays are iterated.
- **Finding if**: The same array is iterated 3+ times when a single-pass reduce would suffice.
- **Priority**: P2

### P4. Eager SDK Initialization
- **What**: Heavy SDKs (Firebase Messaging, Analytics) should lazy-load.
- **How**: Read `lib/firebase.ts`. Check if modules are initialized at import time.
- **Finding if**: `getMessaging()` or similar is called at module scope unconditionally.
- **Priority**: P2

### P5. Missing Memoization
- **What**: Expensive computations in render paths should be wrapped in `useMemo`.
- **How**: Search for inline `.sort()`, `.filter()`, or `.map()` chains in component render bodies.
- **Finding if**: Sorting or filtering runs on every render without memoization.
- **Priority**: P2

### P6. Redundant Client Re-initialization
- **What**: Supabase browser clients should be created once, not per render.
- **How**: Check hooks for `createClient()` calls outside `useMemo`.
- **Finding if**: `createClient()` is called in a hook body without memoization.
- **Priority**: P1

### P7. Push Token Registration on Every Mount
- **What**: Service Worker registration and FCM token refresh should not run on every page navigation.
- **How**: Read `home-client.tsx` and `usePushNotifications.ts`. Check if `requestAndSaveToken()` runs unconditionally in `useEffect`.
- **Finding if**: The effect has no guard to skip when the token is already cached.
- **Priority**: P1

---

## Scalability Checks

### SC1. Unbounded Queries
- **What**: Queries without `.limit()` or pagination can return unbounded result sets.
- **How**: Check all Supabase queries. Note which ones lack pagination controls.
- **Finding if**: A query fetches all rows for a user without any limit.
- **Priority**: P1 (for high-growth tables like `subscription_payments`)

### SC2. Edge Function Over-Fetching
- **What**: Edge functions should not load all rows from a table into memory.
- **How**: Read edge function code. Check for queries without filters.
- **Finding if**: An edge function fetches all profiles/subscriptions without filtering.
- **Priority**: P1

### SC3. Notification TTL Enforcement
- **What**: Notifications should be auto-cleaned based on `notification_ttl_days`.
- **How**: Check for cron jobs or triggers that delete old notifications.
- **Finding if**: No cleanup mechanism exists despite the TTL setting being in the schema/store.
- **Priority**: P1

### SC4. Realtime Channel Filtering
- **What**: Supabase Realtime subscriptions should filter by `user_id` to avoid broadcasting all changes.
- **How**: Read Realtime channel subscriptions in hooks. Check for `filter` parameter.
- **Finding if**: The channel subscribes to `event: "*"` without a user-scoped filter.
- **Priority**: P2

---

## Resilience Checks

### R1. Error Boundaries
- **What**: Every route segment should have an `error.tsx`. The app root should have `global-error.tsx`.
- **How**: Scan `app/` directory for `error.tsx`, `global-error.tsx`, `not-found.tsx`.
- **Finding if**: Any of these files are missing.
- **Priority**: P0

### R2. Optimistic Update Rollback
- **What**: Optimistic updates should rollback on server error.
- **How**: Read hooks that perform optimistic updates (e.g., `useNotifications`). Check if they revert state on failure.
- **Finding if**: Server action errors are swallowed without reverting the optimistic state.
- **Priority**: P2

### R3. Transaction Atomicity
- **What**: Multi-step mutations should be atomic (all succeed or all fail).
- **How**: Read server actions that perform multiple Supabase calls. Check for transaction boundaries.
- **Finding if**: Multiple independent writes are performed sequentially without transactional guarantees. One can succeed and the other fail, leaving inconsistent state.
- **Priority**: P2

### R4. Duplicate Payment Records
- **What**: Payment recording should happen in exactly one place (either trigger or application code, not both).
- **How**: Compare the `renewSubscription` server action with the `process_subscription_payment` trigger.
- **Finding if**: Both the trigger AND the server action insert into `subscription_payments` for the same operation path.
- **Priority**: P2

---

## Code Quality Checks

### CQ1. Monolithic Components
- **What**: Component files exceeding ~300 lines should be decomposed.
- **How**: Check file sizes in `components/`. Any file over 300 lines is a candidate.
- **Finding if**: A single file contains multiple components, helper functions, and dialog logic.
- **Priority**: P2

### CQ2. Duplicate Code
- **What**: Near-identical files indicate missing abstraction.
- **How**: Compare similar files (e.g., `add-subscription-form.tsx` vs `edit-subscription-form.tsx`).
- **Finding if**: Two files share 80%+ of the same code.
- **Priority**: P3

### CQ3. Zustand State Mutations
- **What**: Zustand state should only be modified via `set()`, never mutated directly.
- **How**: Read store files. Search for direct property assignments like `pending.isUndone = true`.
- **Finding if**: State is mutated outside of `set()`.
- **Priority**: P3

### CQ4. Hardcoded Values
- **What**: Locale, currency, magic numbers should be configurable.
- **How**: Read utility files. Check for hardcoded locale strings.
- **Finding if**: A value that should vary per user/environment is hardcoded.
- **Priority**: P2

### CQ5. Test Coverage
- **What**: Critical business logic should have unit tests.
- **How**: Search for test files (`*.test.ts`, `*.spec.ts`, `__tests__/`).
- **Finding if**: Zero test files exist.
- **Priority**: P3

### CQ6. AGENTS.md Rule Violations
- **What**: The project's `AGENTS.md` defines forbidden patterns (e.g., `any` type, TODO comments, console logs).
- **How**: Read `AGENTS.md` and grep for violations.
- **Finding if**: Any forbidden pattern is found in production code.
- **Priority**: P2

---

## Observability Checks

### O1. Error Monitoring
- **What**: An error monitoring service (Sentry, LogRocket, etc.) should be integrated.
- **How**: Check `package.json` for monitoring dependencies. Check `app/layout.tsx` for initialization.
- **Finding if**: No error monitoring is configured.
- **Priority**: P3

### O2. Structured Logging
- **What**: Server actions and edge functions should use structured logging, not bare `console.log`.
- **How**: Grep for `console.log` in production code (excluding edge functions where it's the only option).
- **Finding if**: Server-side code uses `console.log` without structure.
- **Priority**: P3

### O3. Production Console Removal
- **What**: `next.config.ts` should strip console logs in production builds.
- **How**: Read `next.config.ts` for `compiler.removeConsole` configuration.
- **Finding if**: Console removal is not configured.
- **Priority**: P3 (not a finding if already configured)
