---
name: recurr-ui-standards
description: Apply Recurr's "Modern Minimalist & Monoline" design system when writing, reviewing, or refactoring any UI code for the Recurr app (React/Tailwind CSS v4 components, pages, layouts, Shadcn/Base UI primitives). Use this skill whenever the user asks to build, style, fix, or review a component, page, form, card, dialog, calendar, badge, button, or any other UI element for Recurr, or mentions "design system," "design.md," "monoline," "typography," "spacing," "mobile-first," "responsive," or "theme" in a Recurr frontend context — even if they don't explicitly ask to "follow the design system." All values, tables, and specs live in references/DESIGN.md — this skill only tells you when and how to consult it.
---

# Recurr UI Standards

`references/DESIGN.md` is the single source of truth for Recurr's design system — colors, typography scale, spacing, breakpoints, corner radius, component rules, everything. This skill does not restate those values. Its job is to make sure you actually read and apply the right section of DESIGN.md at the right time, and to catch the mistakes agents make even after reading it once.

## What to do

1. **Read `references/DESIGN.md` in full before any non-trivial UI task** — new component, new page, or a review touching more than one element. For a one-line tweak to an already-compliant component, you can rely on what you already know from a prior read in this session, but re-read if it's been a while or the task is unfamiliar.
2. **Never invent a value.** If you need a font size, weight, line-height, color token, spacing value, breakpoint behavior, icon size, or border treatment, it is already decided in DESIGN.md — go find it (Sections 2, 4, and 5 cover color, typography, and layout respectively). Do not approximate, round, or pick something that "looks about right."
3. **Treat every rule in DESIGN.md as load-bearing, not stylistic.** Corner radius, shadows, color-as-meaning, and the text-only state-color rule are correctness requirements, not taste. If a request conflicts with one (e.g., "round the corners," "add a shadow," "fill the badge with red"), say so explicitly and default to DESIGN.md unless the user overrides it on the record.
4. **Apply the full responsive typography scale, not just the mobile size.** Every text element needs its mobile, `md:`, and `lg:` classes composed together per Section 4 — don't ship a size with only the base breakpoint and call it done.
5. **Run the self-check below before considering any UI task finished.** If a box can't be checked, fix it now rather than flagging it as a follow-up.

## Self-check before finishing any UI task

- [ ] Re-verified against `references/DESIGN.md`, not memory or a prior similar task
- [ ] Every text element carries its full responsive class string (mobile + `md:` + `lg:`), not just one size
- [ ] Every color used is a semantic token from Section 2 — no hex, no arbitrary OKLCH
- [ ] State/status colors (error, warning, overdue, etc.) are applied to text/border only — no `bg-destructive` or similar background fill
- [ ] Zero corner radius and no blur shadows anywhere, including nested media
- [ ] Mobile (unprefixed) layout is complete and usable on its own before any `md:`/`lg:` override is added
- [ ] Spacing, touch targets, and icon sizes match the scale in Section 5 — no arbitrary one-off values
- [ ] Any new or modified Shadcn/Base UI primitive still satisfies Section 6 (accessibility primitives intact, monoline classes applied, invalid states styled correctly)

If you're ever unsure whether something is covered by DESIGN.md, assume it is and go check — don't guess and don't ask the user to restate what's already documented.