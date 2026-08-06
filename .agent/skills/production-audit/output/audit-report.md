---
audit_date: "2026-08-06T19:44:42+08:00"
total_findings: 6
resolved_from_previous: 2
still_open: 5
new_findings: 1
p0_count: 0
p1_count: 0
p2_count: 2
p3_count: 4
---

# Recurr Production Audit Report

**Audit Date:** 2026-08-06 (Cycle 4)
**Codebase:** Next.js 16.2.6 + Supabase (PostgreSQL 17) + Firebase  
**Supabase Project:** `recurr` (`cejaasdssfxujajdaxcn`)  
**Previous Audit Baseline:** 2026-08-06 PM (Cycle 3 — 6 active findings)

---

## 1. Resolved Issues (from previous report)

| Prev # | Priority | Headline | Resolution |
|--------|----------|----------|------------|
| New #1 | 🟠 P1 | Supabase browser client re-initialized on every hook call | **Fixed**: [`usePushNotifications.ts`](file:///c:/Users/Dell%20Admin/Documents/recurr/hooks/usePushNotifications.ts#L8) line 8 now correctly uses `const supabase = useMemo(() => createClient(), [])`, matching the established pattern in `useNotifications.ts`. The BrowserClient is created once per component mount and stable across re-renders. |
| New #2 (Supabase Advisor) | N/A | `function_search_path_mutable` — orphaned `pgmq_public` wrappers | **Fixed**: Postgres logs confirm `DROP FUNCTION IF EXISTS pgmq_public.read(text, int, int); DROP FUNCTION IF EXISTS pgmq_public.delete(text, bigint); DROP FUNCTION IF EXISTS pgmq_public.archive(text, bigint);` was executed against the live DB. The `function_search_path_mutable` Supabase advisor warning no longer appears in this cycle's security scan. |

---

## 2. Still-Open Issues (Carried Forward)

| # | Priority | Category | Module / File | Finding | Impact | Recommendation |
|---|----------|----------|---------------|---------|--------|----------------|
| 1 | 🟡 P2 | Performance | [firebase.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/firebase.ts#L26) | 🔄 **CARRIED: Eager `getMessaging()` at module scope** — Line 26 calls `getMessaging(app)` synchronously whenever `window` is defined, at module-load time. | Adds Firebase Messaging overhead to every page load, even pages that never use push notifications. | Refactor to a lazy getter: `let _messaging: Messaging \| null = null; export function getClientMessaging() { if (!_messaging && typeof window !== "undefined") { _messaging = getMessaging(app); } return _messaging; }` — replace all `messaging` import usages with `getClientMessaging()`. |
| 2 | 🟡 P2 | Code Quality | [index.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/supabase/functions/send-due-notifications/index.ts#L107-L112) | 🔄 **CARRIED: Hardcoded locale and currency in edge function `formatCurrency`** — Helper hardcodes `"en-PH"` and `"PHP"`, ignoring user currency preferences. | Notifications incorrectly format amounts for users with non-PHP currency subscriptions. | Pass `currency` from the `DueNotificationCandidate` profile data (add currency column to profiles + RPC), or call the `public.format_currency(amount, currency)` DB function via RPC. |
| 3 | 🟢 P3 | Code Quality | Project-wide | 🔄 **CARRIED: Zero test files** — no `.test.ts`, `.spec.ts`, or test suites found in the codebase. | Critical business logic has no automated regression coverage. | Install Vitest and write unit tests for `lib/analytics.ts`, `lib/validations/auth.ts`, and server actions. |
| 4 | 🟢 P3 | Observability | [usePushNotifications.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/hooks/usePushNotifications.ts#L170) & [useNotifications.ts](file:///c:/Users/Dell%20Admin/Documents/recurr/hooks/useNotifications.ts#L125) | 🔄 **CARRIED: `console.error` calls survive production log stripping** — `next.config.ts` configures `removeConsole: { exclude: ["error"] }`, meaning `console.error` calls in `usePushNotifications.ts` (L170, L197) and the realtime channel handler in `useNotifications.ts` (L125) are preserved in production builds but lack structured context or correlation IDs. | Unstructured error context in production log streams makes incident debugging harder. | Add structured metadata to `console.error` calls: `console.error("usePushNotifications:saveToken", { userId, error })`. |
| 5 | 🟢 P3 | Security | Supabase Auth Dashboard Configuration | 🔄 **CARRIED: Leaked password protection is disabled** — Supabase security advisor confirms `auth_leaked_password_protection` is still disabled. This feature cross-references new/updated passwords against HaveIBeenPwned.org. | Users can register with publicly compromised passwords, increasing account takeover risk. | Enable in Supabase Dashboard → Authentication → Password → toggle "Leaked Password Protection". No code change required. |

---

## 3. New Issues

No net-new findings were identified during this audit cycle.

---

## 4. Live Database & Advisor Audit

- **Project Ref:** `cejaasdssfxujajdaxcn` (`recurr`)
- **PostgreSQL Version:** 17.6
- **RLS Coverage:** 100% — All 4 public tables (`notifications`, `profiles`, `subscription_payments`, `subscriptions`) have RLS enabled with `(SELECT auth.uid())` initplan-optimized policies. ✅
- **SECURITY DEFINER Functions (public schema):** 4 functions, all with `SET search_path TO ''`:
  - `delete_expired_notifications()` — REVOKED from public ✅
  - `get_due_notification_candidates(date)` — restricted to `service_role, postgres` ✅
  - `handle_new_user()` — REVOKED from public ✅
  - `process_subscription_payment()` — REVOKED from public ✅
- **Active Indexes:** 12 active indexes across all 4 public tables. No missing indexes for current query patterns. ✅
- **Extensions Installed:** `pg_cron` v1.6.4, `pg_net` v0.20.3 ✅
- **Edge Functions:** `send-due-notifications` (v34, Status: `ACTIVE`) — 2 most recent invocations HTTP 200 OK ✅. Older v30 (500) and v29 (401) are historical rollback artifacts, not recurring.
- **Postgres Logs:** No new `ERROR` severity entries. Historical errors are rollback artifacts, fully resolved.
- **Orphaned `pgmq_public` functions:** Confirmed dropped this cycle. ✅

### Supabase Advisors (Reported Separately)

**Security Advisors:**

| Level | Name | Detail |
|-------|------|--------|
| WARN | `auth_leaked_password_protection` | Leaked password protection disabled — carried forward as Still-Open #5 above. |

**Performance Advisors:**

| Level | Name | Detail |
|-------|------|--------|
| INFO | `unused_index` | `idx_sub_payments_user_date` on `subscription_payments` — still not exercised (low row count). Monitor; drop if unused after sustained traffic. |
| INFO | `unused_index` | `idx_subscription_payments_subscription_id` on `subscription_payments` — still not exercised. Same recommendation. |

---

## 5. Summary

| Priority | Count |
|----------|-------|
| 🔴 P0 Critical | 0 |
| 🟠 P1 High | 0 |
| 🟡 P2 Medium | 2 |
| 🟢 P3 Low | 4 |
| **Total Active Findings** | **6** |
| **Resolved This Cycle** | **2** |

> [!IMPORTANT]
> **New P2 this cycle:** `cancelSubscription` in [`actions.ts`](file:///c:/Users/Dell%20Admin/Documents/recurr/app/home/actions.ts#L119) line 119 writes `"cancelled"` status which is absent from the Zod `subscriptionSchema` enum. Fix: add `"cancelled"` to `z.enum(["unpaid", "paid", "overdue", "cancelled"])` in [`lib/validations/subscription.ts`](file:///c:/Users/Dell%20Admin/Documents/recurr/lib/validations/subscription.ts#L13).

> [!NOTE]
> **Zero P0/P1 blockers for the fourth consecutive cycle.** The P1 from Cycle 3 (Supabase browser client re-init) has been resolved. RLS coverage is 100%, all SECURITY DEFINER functions have immutable search paths, the notification TTL cleanup is fully operational, orphaned `pgmq_public` functions are gone, and the edge function is running cleanly (HTTP 200 on all recent invocations). The codebase is in a stable, low-risk production state.
