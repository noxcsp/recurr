---
audit_date: "2026-08-05T23:46:17+08:00"
total_findings: 9
resolved_from_previous: 1
still_open: 9
new_findings: 0
p0_count: 0
p1_count: 0
p2_count: 7
p3_count: 2
---

# Recurr Production Audit Report

**Audit Date:** 2026-08-05  
**Codebase:** Next.js 16.2.6 + Supabase (PostgreSQL 17) + Firebase  
**Supabase Project:** `recurr` (`cejaasdssfxujajdaxcn`)  
**Previous Audit Baseline:** 2026-08-05 (10 findings)

---

## 1. Resolved Issues (from previous report)

The following finding from the previous audit run has been verified as **Resolved**:

| Prev # | Priority | Headline | Resolution |
|--------|----------|----------|------------|
| 8 (Prev New #1) | P1 | Edge function loads ALL profiles into memory in `send-due-notifications/index.ts` | **Fixed**: Replaced unbounded client-side profile fetch with a DB-side JOIN RPC query `get_due_notification_candidates` in migration `20260805230000_get_due_notification_candidates_rpc.sql`. The Edge Function now calls `supabase.rpc("get_due_notification_candidates", { target_date: todayStr })` to process candidate notifications efficiently. |

---

## 2. Still-Open Issues (Carried Forward)

| # | Priority | Category | Module / File | Finding | Impact | Recommendation |
|---|----------|----------|---------------|---------|--------|----------------|
| 1 | P2 | Security | [middleware.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/supabase/middleware.ts#L41-L47) | 🔄 CARRIED: `any` type in middleware — `authError: any` (line 41) and `catch (err: any)` (line 47) violate AGENTS.md rules. | Hides type errors and leads to weaker error handling. | Type `authError` as `Error | null`, catch as `unknown`, and narrow using `instanceof Error`. |
| 2 | P2 | Resilience | [actions.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/app/home/actions.ts#L213-L237) | 🔄 CARRIED: Non-atomic multi-step mutation in `renewSubscription` (trial path) — inserts payment without checking insert error before updating subscription. | Leaves orphan payment records if the subscription update fails after payment insertion. | Check the insert result for errors before proceeding to update, or use a DB RPC function for atomicity. |
| 3 | P2 | Resilience | [useNotifications.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/hooks/useNotifications.ts#L161-L193) | 🔄 CARRIED: Optimistic updates not rolled back on server error — `markAsRead`, `markAllAsRead`, and `deleteNotif` do not revert state if the server action fails. | UI displays incorrect read/deleted state if server action fails. | Capture return value of server actions and revert optimistic state on error. |
| 4 | P2 | Code Quality | [use-subscription-store.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/store/use-subscription-store.ts#L91) | 🔄 CARRIED: Direct Zustand state mutation — `pending.isUndone = true` (lines 91 & 192) and `delete get().committedStatuses[sub.id]` (line 248) mutate state outside `set()`. | Can cause missed re-renders or stale state references. | Use Zustand `set()` immutably for all state modifications. |
| 5 | P2 | Performance | [firebase.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/firebase.ts#L26) | 🔄 CARRIED: Eager `getMessaging()` at module scope — line 26 initializes Firebase Messaging synchronously at module load time. | Unnecessarily adds Firebase Messaging overhead to page loads. | Lazy-load messaging behind an async getter function. |
| 6 | P2 | Scalability | [20260731130000_extend_profiles_notification_settings.sql](file:///c:/Users/Dell%20Admin/Documents/recurr/supabase/migrations/20260731130000_extend_profiles_notification_settings.sql) | 🔄 CARRIED: No notification TTL enforcement — `notification_ttl_days` is configured in profiles but no cron job or trigger cleans up old notifications. | `notifications` table grows unboundedly over time. | Add a daily `pg_cron` job or edge function to delete notifications older than `notification_ttl_days`. |
| 7 | P2 | Code Quality | [index.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/supabase/functions/send-due-notifications/index.ts#L107-L112) | 🔄 CARRIED: Hardcoded locale and currency in `formatCurrency` — helper hardcodes `"en-PH"` and `"PHP"`, duplicating formatting logic and ignoring user currency preferences. | Notifications format currency incorrectly if users support non-PHP currencies. | Pass currency and locale based on profile settings or standard utility function. |
| 8 | P3 | Code Quality | Project-wide | 🔄 CARRIED: Zero test files — no `.test.ts`, `.spec.ts`, or test suites found in the codebase. | Lacks automated regression testing for critical business logic. | Introduce Vitest and write unit tests for `lib/analytics.ts`, `lib/validations/auth.ts`, and server actions. |
| 9 | P3 | Observability | [middleware.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/supabase/middleware.ts) & [useNotifications.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/hooks/useNotifications.ts#L125) & [index.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/supabase/functions/send-due-notifications/index.ts#L186) | 🔄 CARRIED: `console.warn` / `console.log` calls remain in production — console calls are used for auth/realtime/edge warnings without structured context or correlation IDs. | Leaves unstructured warnings in log streams. | Integrate structured logging helper or ensure log parameters include structured metadata. |

---

## 3. New Issues

No net-new findings were identified during this audit cycle.

---

## 4. Live Database & Advisor Audit

- **Project Ref:** `cejaasdssfxujajdaxcn` (`recurr`)
- **PostgreSQL Version:** 17.6
- **RLS Coverage:** 100% (All 4 public tables have RLS enabled and active policies)
- **SECURITY DEFINER RPC:** `get_due_notification_candidates` active (`STABLE SECURITY DEFINER`, `SET search_path TO ''`)
- **Active Indexes:** 12 active indexes across `profiles`, `subscriptions`, `notifications`, and `subscription_payments`
- **Extensions Installed:** `pg_cron` v1.6.4, `pg_net` v0.20.3
- **Edge Functions:** `send-due-notifications` (v32, Status: `ACTIVE`)
- **Supabase Security Advisor:**
  - `auth_leaked_password_protection`: WARN — Leaked password protection is disabled in Supabase Auth config (Requires Supabase Pro plan; skipped per directive).
- **Supabase Performance Advisor:**
  - `unused_index`: `idx_sub_payments_user_date`, `idx_notifications_subscription_id`, `idx_subscription_payments_subscription_id` (Indexes supporting FK cascades / query patterns; active in production).

---

## 5. Summary

| Priority | Count |
|----------|-------|
| 🔴 P0 Critical | 0 |
| 🟠 P1 High | 0 |
| 🟡 P2 Medium | 7 |
| 🟢 P3 Low | 2 |
| **Total Active Findings** | **9** |
| **Resolved from Previous** | **1** |

> [!NOTE]
> All **P0 Critical** security deploy blockers and **P1 High** performance/scalability blockers are **0**. The codebase has zero deploy blockers. The remaining 9 items consist of medium technical debt (P2) and low polish (P3) tasks.
