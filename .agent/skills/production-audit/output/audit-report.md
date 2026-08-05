---
audit_date: "2026-08-05T15:02:00+08:00"
total_findings: 13
resolved_from_previous: 5
still_open: 10
new_findings: 3
p0_count: 0
p1_count: 2
p2_count: 7
p3_count: 2
---

# Recurr Production Audit Report

**Audit Date:** 2026-08-05
**Codebase:** Next.js 16.2.6 + Supabase (PostgreSQL 17) + Firebase
**Supabase Project:** `recurr` (`cejaasdssfxujajdaxcn`)
**Previous Audit:** 2026-08-04 (17 findings)

---

## 1. Resolved Issues

The following findings from previous audit runs have been fully resolved in migrations `20260805052700_patch_advisor_high_priority.sql` and `20260805150200_optimize_indexes_and_drop_unused.sql`:

| Prev # | Priority | Headline | Resolution |
|--------|----------|----------|------------|
| 1 | P0 | Auth bypass when SUPABASE_SECRET_KEY is unset | Fixed: `isAuthorized` now stays `false` when the env var is missing; function returns 401. |
| 2 | P1 | SECURITY DEFINER functions callable via REST | Fixed: REVOKE EXECUTE applied to both functions for public, anon, authenticated roles. Live DB confirmed. |
| 3 | P1 | SECURITY DEFINER functions missing search_path | Fixed: Both functions now carry `SET search_path TO ''`. Live DB definition confirmed. |
| 6 | P1 | RLS policies re-evaluate auth.uid() per row | Fixed: All 12 policies now use `(SELECT auth.uid())` subselect. Live DB policy scan confirmed. |
| New-1 | P1 | Missing composite index on subscription_payments | Fixed: Applied migration `20260805150200` to drop `idx_subscription_payments_user_id`, `idx_profiles_fcm_token`, `idx_subscriptions_category` and create composite index `idx_sub_payments_user_date` on `(user_id, payment_date DESC)`. Live DB confirmed. |

---

## 2. Still-Open Issues (Carried Forward)

| # | Priority | Category | Module / File | Finding | Impact | Recommendation |
|---|----------|----------|---------------|---------|--------|----------------|
| 1 | P1 | Security | lib/validations/auth.ts | CARRIED: Password policy mismatch — Supabase Auth provider requirements updated to require lowercase, uppercase, digits, and symbols. `signupSchema` has digit and symbol checks but is missing lowercase (`/[a-z]/`) and uppercase (`/[A-Z]/`) validations. (Note: Leaked password protection feature ignored per user directive as it requires Supabase Pro plan). | Users entering passwords on signup could pass client Zod validation but fail Supabase Auth provider requirements, leading to unexpected signup errors. | Add `.regex(/[a-z]/, "Password must contain at least one lowercase letter")` and `.regex(/[A-Z]/, "Password must contain at least one uppercase letter")` to `signupSchema` in `lib/validations/auth.ts`. |
| 2 | P1 | Performance | app/home/page.tsx#L31-L36 | CARRIED: `select("*")` on profiles and subscriptions — lines 31 and 36 still fetch all columns. | Over-fetches fcm_token from profiles; serializes it to client React tree via profile prop on HomeClient. | Replace with explicit column selection for both queries. Remove fcm_token from client-facing columns. |
| 3 | P1 | Scalability | hooks/useNotifications.ts#L72-L80 | CARRIED: Realtime channel has no user_id filter — postgres_changes subscription on public.notifications (line 77-80) has no filter param. | Cross-user data leakage potential; all clients receive all users notification events. | Add filter: `filter: user_id=eq.${user.id}` to the postgres_changes subscription. |
| 4 | P2 | Security | lib/supabase/middleware.ts#L41-L47 | CARRIED: `any` type in middleware — `authError: any` on line 41 and `catch (err: any)` on line 47 violate AGENTS.md. | Hides type errors; weaker error handling. | Type authError as `Error | null`, use `catch (err: unknown)`, narrow with `instanceof Error`. |
| 5 | P2 | Resilience | app/home/actions.ts#L213-L237 | CARRIED: Non-atomic multi-step mutation in renewSubscription (trial path) — insert payment then update subscription without checking insert result first. | Phantom payment records if subscription update fails after payment insert. | Check insert error before proceeding to update. Or use a single DB RPC function for atomicity. |
| 6 | P2 | Resilience | hooks/useNotifications.ts#L161-L193 | CARRIED: Optimistic updates not rolled back on server error — markAsRead, markAllAsRead, deleteNotif do not check server action return values. | UI shows stale read/deleted state if server action fails. | Capture result of each server action; revert optimistic state on error. |
| 7 | P2 | Code Quality | lib/store/use-subscription-store.ts | CARRIED: Direct Zustand state mutation — `pending.isUndone = true` on lines 91 and 192. Also line 248: `delete get().committedStatuses[sub.id]` is a direct mutation outside set(). | Missed re-renders; stale references from direct mutation. | Use set() immutably for all state changes including the line 248 delete. |
| 8 | P2 | Performance | lib/firebase.ts#L26 | CARRIED: Eager getMessaging() at module scope — line 26 runs synchronously at import time. | Adds Firebase Messaging SDK to every page bundle unnecessarily. | Lazy-load messaging behind an async getter function. |
| 9 | P2 | Scalability | supabase/migrations/20260731130000 | CARRIED: No notification TTL enforcement — notification_ttl_days stored in profiles but never enforced by any cron, trigger, or application code. | notifications table grows unboundedly. | Add daily pg_cron job to delete notifications older than notification_ttl_days for each user. |
| 10 | P3 | Code Quality | Project-wide | CARRIED: Zero test files — no .test.ts, .spec.ts, .test.tsx, or .spec.tsx files found anywhere. | No automated regression detection for business logic. | Add Vitest; start with unit tests for lib/analytics.ts and auth validation schemas. |

---

## 3. New Issues

| # | Priority | Category | Module / File | Finding | Impact | Recommendation |
|---|----------|----------|---------------|---------|--------|----------------|
| 1 | P1 | Scalability | supabase/functions/send-due-notifications/index.ts#L207-L209 | Edge function loads ALL profiles into memory — `supabase.from("profiles").select(...)` with no limit or filter fetches every registered user on every cron run. | Memory usage and execution time grow linearly with user count. At 10k+ users risks hitting Edge Function memory limits. | Paginate with `.range(offset, offset + batchSize - 1)` in a loop, or restructure as a DB-side JOIN RPC to avoid pulling all profiles into JS memory. |
| 2 | P2 | Code Quality | supabase/functions/send-due-notifications/index.ts#L93-L98 | Hardcoded locale and currency in formatCurrency — local helper hardcodes `"en-PH"` and `"PHP"`. Duplicates logic in lib/utils.ts. | Notification amounts display in wrong currency if app expands beyond PHP. Code duplication creates drift risk. | Store `currency_code` and locale in profiles. Use profile data when formatting. |
| 3 | P3 | Observability | lib/supabase/middleware.ts | console.warn calls remain in production — next.config.ts uses `{ exclude: ["error"] }` which strips log/info/debug but keeps `console.warn`. Middleware uses console.warn for auth failures on line 124 in useNotifications.ts and middleware. | Unstructured warn logs in Vercel Functions output; no correlation IDs. | Either add "warn" to removeConsole exclude list to keep them intentionally, or switch to structured logger for production tracing. |

---

## 4. Database Index Audit & Codebase Cross-Reference

A complete audit of all 12 database indexes was executed via Supabase MCP (`pg_indexes` and `pg_stat_user_indexes`) after executing migration `20260805150200_optimize_indexes_and_drop_unused.sql`:

| Table | Index Name | Definition | In Codebase / Functions Query? | Live DB `idx_scan` | Audit Status & Action Taken |
|-------|------------|------------|--------------------------------|-------------------|-----------------------------|
| `profiles` | `profiles_pkey` | `PRIMARY KEY (id)` | YES (`.eq("id", user.id)`) | 675 scans | ✅ Active |
| `profiles` | `idx_profiles_fcm_token` | `btree (id) WHERE (fcm_token IS NOT NULL)` | NO | 0 scans | 🧹 **DROPPED** (migration 20260805150200) |
| `subscriptions` | `subscriptions_pkey` | `PRIMARY KEY (id)` | YES (`.eq("id", id)`) | 66 scans | ✅ Active |
| `subscriptions` | `idx_subscriptions_user_id` | `btree (user_id)` | YES (`.eq("user_id", user.id)`) | 96 scans | ✅ Active |
| `subscriptions` | `idx_subscriptions_next_due_date` | `btree (next_due_date)` | YES (`send-due-notifications` edge function) | 27 scans | ✅ Active |
| `subscriptions` | `idx_subscriptions_due_status` | `btree (next_due_date, subscription_status)` | YES (`send-due-notifications` edge function) | 28 scans | ✅ Active |
| `subscriptions` | `idx_subscriptions_category` | `btree (category)` | NO | 0 scans | 🧹 **DROPPED** (migration 20260805150200) |
| `notifications` | `notifications_pkey` | `PRIMARY KEY (id)` | YES (`.eq("id", id)`) | 61 scans | ✅ Active |
| `notifications` | `idx_notifications_user_created` | `btree (user_id, created_at DESC)` | YES (`getNotifications` in `notification-actions.ts`) | 478 scans | ✅ Active |
| `notifications` | `idx_notifications_user_read_created` | `btree (user_id, is_read, created_at DESC)` | YES (`getNotifications` unread query) | 658 scans | ✅ Active |
| `notifications` | `idx_notifications_subscription_id` | `btree (subscription_id)` | NO in queries | 0 scans | ℹ️ FK constraint `ON DELETE SET NULL` support |
| `subscription_payments` | `subscription_payments_pkey` | `PRIMARY KEY (id)` | YES | 24 scans | ✅ Active |
| `subscription_payments` | `idx_subscription_payments_user_id` | `btree (user_id)` | NO | 0 scans | 🧹 **REPLACED** (migration 20260805150200) |
| `subscription_payments` | `idx_sub_payments_user_date` | `btree (user_id, payment_date DESC)` | YES (`page.tsx` home payment query) | 0 scans | 🆕 **CREATED** (migration 20260805150200) |
| `subscription_payments` | `idx_subscription_payments_subscription_id` | `btree (subscription_id)` | NO in queries | 0 scans | ℹ️ FK constraint `ON DELETE CASCADE` support |

---

## 5. Summary

| Priority | Count |
|----------|-------|
| P0 Critical | 0 (resolved) |
| P1 High | 2 |
| P2 Medium | 7 |
| P3 Low | 2 |
| Active Findings Total | 11 |
| Resolved from previous | 5 |
