---
name: production-audit
description: >
  Perform a comprehensive production readiness audit of a Next.js + Supabase codebase.
  Activate this skill when the user asks to "audit", "production check", "security scan",
  "performance review", "scalability review", "pre-launch review", "production readiness",
  or any combination of those terms. Also activate when the user mentions "deploy blockers",
  "production issues", "code health", or wants to validate the codebase before shipping.
---

# Production Audit Skill

This skill defines a repeatable, structured methodology for performing a full-stack production readiness audit on the Recurr codebase (Next.js App Router + Supabase + Firebase).

Before starting, read `references/CHECKLIST.md` to understand every check item, its category, priority, and the exact investigation steps.

## Workflow

### Phase 1 — Gather Context

1. Read `.context/SCHEMA.md` for the database architecture.
2. Read `.context/PRD.md` for business logic context (if it exists).
3. Scan the full project directory tree (`app/`, `lib/`, `hooks/`, `contexts/`, `components/`, `supabase/`, `types/`) to build a mental model of the codebase.
4. Read `package.json` to capture the framework version and dependency list.

### Phase 2 — Live Database Checks (Supabase MCP)

Use the Supabase MCP to interrogate the **live** database project before writing a single finding. These MCP calls provide ground truth that static code analysis cannot:

1. **Identify the project** — call `list_projects` to find the Supabase project ID. If multiple projects exist, ask the user which one to audit.
2. **Schema snapshot** — call `list_tables` with `verbose: true` to retrieve every table, column, PK, FK, and constraint in the `public` schema.
3. **Index audit** — run `execute_sql` with the query in the "SQL Queries" section of `references/CHECKLIST.md` to list all user-defined indexes and identify tables missing indexes on frequently queried columns.
4. **RLS coverage** — run `execute_sql` with the RLS query from `references/CHECKLIST.md` to verify every table has RLS enabled and policies defined.
5. **Security advisors** — call `get_advisors` with `type: "security"` to surface Supabase's own security warnings (missing RLS, exposed service keys, etc.).
6. **Performance advisors** — call `get_advisors` with `type: "performance"` to surface Supabase's own performance recommendations (missing indexes, large scans, etc.).
7. **Extension check** — call `list_extensions` to confirm required extensions (`pg_cron`, `pg_net`) are enabled.
8. **Edge function inventory** — call `list_edge_functions` to verify deployed edge functions match what's in `supabase/functions/`.
9. **Recent logs** — call `get_logs` with `service: "edge-function"` and `service: "postgres"` to check for recent errors or warnings.

### Phase 3 — Static Code Analysis

Systematically read and analyze every module in the codebase using the checklist in `references/CHECKLIST.md`. For each category:

- **Security** — auth guards, input validation, RLS, SECURITY DEFINER triggers, edge function auth, secret management, rate limiting, data exposure.
- **Performance** — query efficiency (`select("*")` vs explicit columns), N+1 patterns, missing memoization, eager SDK loading, redundant re-renders.
- **Scalability** — unbounded queries, missing pagination, missing DB indexes, memory-hungry edge functions, notification TTL.
- **Resilience** — error boundaries, graceful degradation, optimistic update rollback, transaction atomicity, idempotency.
- **Code Quality** — monolithic components, duplicate code, state mutation outside Zustand `set()`, hardcoded values, test coverage.
- **Observability** — structured logging, error monitoring integration, production console removal.

### Phase 4 — Compile Report

Output a single artifact file with findings organized as a **priority-tiered table**:

| Priority | Meaning | Criteria |
|----------|---------|----------|
| 🔴 P0 | **Critical** — deploy blocker | Auth bypass, data leakage, unauthenticated endpoints, missing error boundaries |
| 🟠 P1 | **High** — fix before launch | Missing indexes, over-fetching sensitive data, no rate limiting, unchecked error paths |
| 🟡 P2 | **Medium** — technical debt | Duplicate code, hardcoded values, missing memoization, monolithic components |
| 🟢 P3 | **Low** — nice to have | Missing tests, no monitoring, state mutation cosmetics, bundle polish |

Each finding row must include:

1. **#** — sequential number
2. **Category** — Security / Performance / Scalability / Resilience / Code Quality / Observability
3. **Module / File** — clickable file link with line reference
4. **Finding** — bold headline + description of the issue
5. **Impact** — what happens if this is not fixed
6. **Recommendation** — actionable fix, ideally with a code snippet or SQL statement

End the report with a summary count table and callouts (using GitHub `> [!CAUTION]` / `> [!IMPORTANT]`) for the most critical items.

## Important Notes

- **`proxy.ts` is correct for Next.js 16+.** Do NOT flag `proxy.ts` as a broken middleware file. Next.js officially renamed `middleware.ts` → `proxy.ts` starting in version 16. The exported function name should be `proxy` (not `middleware`). See: https://nextjs.org/docs/messages/middleware-to-proxy
- **Always cross-reference code with live DB state.** A migration file may define an index, but it may not have been applied. The Supabase MCP is the source of truth.
- **Do not flag Supabase advisors as your own findings.** Report them in a separate "Supabase Advisors" section, noting the source.
- **Respect the project's tech stack conventions.** Check `AGENTS.md` for rules like "DO NOT use the `any` type" or "DO NOT leave TODO comments." Include violations as Code Quality findings.
