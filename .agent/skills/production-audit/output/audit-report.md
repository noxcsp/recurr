---
audit_date: "2026-08-06T16:44:00+08:00"
total_findings: 5
resolved_from_previous: 4
still_open: 5
new_findings: 0
p0_count: 0
p1_count: 0
p2_count: 3
p3_count: 2
---

# Recurr Production Audit Report

**Audit Date:** 2026-08-06  
**Codebase:** Next.js 16.2.6 + Supabase (PostgreSQL 17) + Firebase  
**Supabase Project:** `recurr` (`cejaasdssfxujajdaxcn`)  
**Previous Audit Baseline:** 2026-08-05 (9 active findings)

---

## 1. Resolved & Excluded Issues (from previous report)

The following 4 items from the previous audit baseline are no longer active findings:

| Prev # | Priority | Headline | Resolution |
|--------|----------|----------|------------|
| 1 | P2 | `any` type in middleware | **Fixed**: Updated [middleware.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/supabase/middleware.ts#L41-L51) to type `authError: Error | null` and catch `(err: unknown)`, narrowing with `instanceof Error` per AGENTS.md rules. |
| 2 | P2 | Non-atomic multi-step mutation in `renewSubscription` | **Fixed**: Updated [actions.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/app/home/actions.ts#L213-L226) in `renewSubscription` (trial path) to capture `{ error: paymentError }` from `subscription_payments` insert and return early if payment insertion fails before modifying the subscription record. |
| 3 | P2 | Optimistic updates not rolled back on server error in `useNotifications` | **Fixed**: Updated [useNotifications.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/hooks/useNotifications.ts#L162-L235) (`markAsRead`, `markAllAsRead`, `deleteNotif`) to capture server action return values and call `await refetch(true)` inside `try...catch...finally` blocks to revert optimistic UI state on error. |
| 4 | P2 | Zustand store synchronous status reconciler | **Excluded by Design Directive**: The synchronous flags `pending.isUndone = true` and `delete get().committedStatuses[sub.id]` in [use-subscription-store.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/store/use-subscription-store.ts#L91) are intentional synchronous reconcilers required for Radix Toast callback lifecycle and zero-flicker UI updates. |

---

## 2. Still-Open Issues (Carried Forward)

| # | Priority | Category | Module / File | Finding | Impact | Recommendation |
|---|----------|----------|---------------|---------|--------|----------------|
| 1 | P2 | Performance | [firebase.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/firebase.ts#L26) | 🔄 CARRIED: Eager `getMessaging()` at module scope — line 26 initializes Firebase Messaging synchronously at module load time. | Unnecessarily adds Firebase Messaging overhead to page loads. | Lazy-load messaging behind an async getter function. |
| 2 | P2 | Scalability | [20260731130000_extend_profiles_notification_settings.sql](file:///c:/Users/Dell%20Admin/Documents/recurr/supabase/migrations/20260731130000_extend_profiles_notification_settings.sql) | 🔄 CARRIED: No notification TTL enforcement — `notification_ttl_days` is configured in profiles but no cron job or trigger cleans up old notifications. | `notifications` table grows unboundedly over time. | Add a daily `pg_cron` job or edge function to delete notifications older than `notification_ttl_days`. |
| 3 | P2 | Code Quality | [index.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/supabase/functions/send-due-notifications/index.ts#L107-L112) | 🔄 CARRIED: Hardcoded locale and currency in `formatCurrency` — helper hardcodes `"en-PH"` and `"PHP"`, duplicating formatting logic and ignoring user currency preferences. | Notifications format currency incorrectly if users support non-PHP currencies. | Pass currency and locale based on profile settings or standard utility function. |
| 4 | P3 | Code Quality | Project-wide | 🔄 CARRIED: Zero test files — no `.test.ts`, `.spec.ts`, or test suites found in the codebase. | Lacks automated regression testing for critical business logic. | Introduce Vitest and write unit tests for `lib/analytics.ts`, `lib/validations/auth.ts`, and server actions. |
| 5 | P3 | Observability | [middleware.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/supabase/middleware.ts) & [useNotifications.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/hooks/useNotifications.ts#L125) & [index.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/supabase/functions/send-due-notifications/index.ts#L186) | 🔄 CARRIED: `console.warn` / `console.log` calls remain in production — console calls are used for auth/realtime/edge warnings without structured context or correlation IDs. | Leaves unstructured warnings in log streams. | Integrate structured logging helper or ensure log parameters include structured metadata. |

---

## 3. New Issues

No net-new findings were identified during this audit cycle.

---

## 4. Live Database & Advisor Audit

- **Project Ref:** `cejaasdssfxujajdaxcn` (`recurr`)
- **PostgreSQL Version:** 17.6
- **RLS Coverage:** 100% (All 4 public tables `notifications`, `profiles`, `subscription_payments`, `subscriptions` have RLS enabled and active policies)
- **SECURITY DEFINER RPC:** `get_due_notification_candidates` active (`STABLE SECURITY DEFINER`, `SET search_path TO ''`)
- **Active Indexes:** 12 active indexes across `profiles`, `subscriptions`, `notifications`, and `subscription_payments`
- **Extensions Installed:** `pg_cron` v1.6.4, `pg_net` v0.20.3
- **Edge Functions:** `send-due-notifications` (v32, Status: `ACTIVE`)

---

## 5. Summary

| Priority | Count |
|----------|-------|
| 🔴 P0 Critical | 0 |
| 🟠 P1 High | 0 |
| 🟡 P2 Medium | 3 |
| 🟢 P3 Low | 2 |
| **Total Active Findings** | **5** |
| **Resolved / Excluded** | **4** |

> [!IMPORTANT]
> The original architecture for `use-subscription-store.ts` has been preserved to ensure full compatibility with Radix Toast dismiss lifecycles and zero-flicker UI updates. Total active findings stand at **5**, with **0 deploy blockers** (P0: 0, P1: 0).
