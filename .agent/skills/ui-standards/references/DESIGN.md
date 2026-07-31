# Design Standards: Modern Minimalist & Monoline UI

This document establishes the UI/UX guidelines, design principles, and frontend implementation rules for **Recurr**. All developers and automated agents must adhere to these standards to ensure visual consistency, accessibility, and clean code execution.

---

## 1. Design System Vision: Modern Minimalist & Monoline

Recurr's design direction is a **Modern Minimalist & Monoline** interface. It uses sharp, high-contrast, structural boundaries instead of soft shadows and rounded corners.

### Key Tenets
*   **Monoline Structure**: UI elements are defined by crisp, 1-pixel borders (`border` or `ring-1`) with uniform thickness. Avoid double borders, heavy drop shadows, or multi-layered card elevations.
*   **No Rounded Corners**: Every element in the interface has a corner radius of `0px` (`rounded-none`). This rule is absolute and applies to buttons, inputs, cards, dialogs, calendars, badges, and images.
*   **High Information Density**: The layout is compact, space-efficient, and optimized for mobile-first PWA usage. It avoids excessive whitespace, using strict line boundaries to separate sections.
*   **Accessible High Contrast**: Clean typographic hierarchy paired with a neutral palette that is compliant with WCAG AA accessibility standards.

---

## 2. Color Palette, Accessibility & Theme Compliance

All color tokens, light/dark theme variables, Tailwind CSS v4 `@theme inline` mappings, and `@layer base` defaults are defined directly in `app/globals.css`. **Do not hardcode or duplicate raw color values in component code or documentation.** Refer directly to `app/globals.css` as the single source of truth so token modifications automatically adapt throughout the application.

### Theme & Token Rules

1. **Single Source of Truth**: All native CSS variables (in `:root` and `.dark`), OKLCH values, theme extensions (`@theme inline`), and global base rules live in `app/globals.css`.
2. **Use Semantic Utility Classes Only**: Always use semantic Tailwind utility classes (`bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-card-foreground`, `bg-primary`, `bg-sidebar`, `text-sidebar-foreground`, `border-sidebar-border`, etc.) instead of hardcoded hex codes, RGB strings, or arbitrary OKLCH values.
3. **Accessibility & WCAG AA Compliance**:
   - All text must meet WCAG 2.1 AA contrast requirements (minimum **4.5:1** for body text, **3:1** for large text).
   - Use `text-foreground` for main content and `text-muted-foreground` for subtle metadata or secondary labels. Never use ultra-light shades that degrade legibility.
4. **Interactive State Contrast**:
   - Hover, focus, and active states must remain distinct.
   - Focused elements must display a sharp 1px ring (`focus-visible:ring-1 focus-visible:ring-ring/50`) and border update (`focus-visible:border-ring`).
5. **Color as Meaning**:
   - Never rely on color alone to convey subscription or payment state. Pair visual color indicators with explicit text labels (e.g., "Paid", "Unpaid", "Overdue").
6. **State Colors Apply to Text & Borders Only (Never Background Fills)**:
   - Semantic feedback tokens (such as `--destructive`, `--warning`, `--success`) must be applied to text (`text-destructive`, `text-warning`, `text-success`) and borders (`border-destructive`, `border-warning`), **never as background fills** (avoid `bg-destructive`, `bg-destructive/10`, etc.).
   - Status badges and labels must maintain a monoline aesthetic — a bordered/outlined chip with colored text — to ensure predictable contrast across light/dark themes and preserve the flat, monoline look.

---

## 3. Corner Radius Policy (Absolute Zero)

To enforce the monoline aesthetic, the corner radius must remain strictly **zero**.

*   **Global CSS Configuration**: `--radius` is set to `0px` in `app/globals.css`.
*   **Tailwind Utility**: Use `rounded-none` for all custom layout containers.
*   **Nested Elements**: Any media, image, background hover states, or inner blocks must also use `rounded-none` to prevent visual leakage.
    *   *Example in Card:* `*:[img:first-child]:rounded-none`

---

## 4. Typography Hierarchy & Scaling Instructions

Font family tokens (`--font-sans`, `--font-heading`) and global font rules (`html { @apply font-sans; }`) are configured directly in `app/globals.css`.

### Typography Instructions & Rules

1. **Font Family Application**:
   - Use `font-sans` for standard body text, paragraph copy, form controls, buttons, and general UI chrome.
   - Use `font-heading` for main page titles, card headers, section headings, and modal headers.
   - Use `font-mono` for technical values, IDs, inline code, and transaction references.
2. **Full Responsive Class Strings**:
   - Every text element must carry a complete responsive class string specifying mobile (unprefixed), tablet (`md:`), and desktop (`lg:`) sizes (e.g. `className="text-lg md:text-xl lg:text-2xl font-heading leading-snug"`).
   - Do not leave breakpoint sizes unspecified or rely on single mobile classes for larger screens.
3. **Predictable Scaling Ratio**:
   - Scale font sizes up by exactly one Tailwind size step per breakpoint jump (mobile → `md:` → `lg:`).
   - Keep `font-weight` and `leading-*` (line height) constant across viewports for a given element level.
4. **Body Text Floor (16px Baseline)**:
   - Body copy and standard paragraph text must not render below `text-base` at `md:` (≥768px) and above to preserve accessibility standards.
5. **High-Density Chrome Exemption**:
   - Metadata, overlines, timestamps, interactive badges, and table chrome use tighter text sizing (`text-xs`/`text-sm`) to preserve high information density.

---

## 5. Layout, Grid & Responsiveness (Mobile-First Rules)

The visual structure relies on crisp borders, line-based divisions, and a strict mobile-first viewport design.

### Mobile-First Layout Responsiveness
Recurr is designed primarily as a mobile-first Progressive Web App (PWA). All layout styling must start with a single-column, touch-optimized structure, scaling gracefully to larger desktop screens.
*   **Default (Mobile)**: Unprefixed Tailwind utilities (e.g., `flex flex-col`, `w-full`) are optimized for mobile portrait viewports (up to `768px`).
*   **Tablet/Desktop Scalability (`md:` / `lg:`)**: Apply responsive prefixes to restructure viewports (e.g., scaling sidebar components, grid calendar boards, or placing edit drawers side-by-side).
*   **Touch Targets**: Buttons, icons, and interactive form cells must have a minimum interactive touch target height/width of `h-8` / `w-8` or include padding utilities ensuring they are easily tappable.
*   **Horizontal Dividers**: Use grid systems or thin horizontal rules to delineate subscriptions in place of card stacks to maximize vertical space.

### 1px Border Rule
*   Do not use standard blur-based shadows (`shadow-md`, `shadow-lg`).
*   Containers are separated using `border border-border` or `ring-1 ring-foreground/10`.
*   Use standard borders for separation, e.g., table cells, list items, card headers, and footers.

### Grid & Alignment
*   Align content to a strict grid. Interactive items must fill their cells fully.
*   Use precise padding utilities (e.g. `px-4 py-3` or `gap-4`). Avoid loose, irregular offsets.

### Iconography
*   Use `lucide-react` for standard icons.
*   Set icon sizes consistently: `size-4` (16px) for normal buttons/inline content, `size-3.5` (14px) for smaller buttons/dense rows.
*   Keep strokes monoline by ensuring icons are rendered crisp without extra bold weights.

---

## 6. Components & Shadcn Configuration

Recurr components are built using **Shadcn** concepts, powered under the hood by **Base UI** primitives (`@base-ui/react`) and styled using Tailwind. They are connected to external component registries.

### Registry Setup
Components are managed and updated via `components.json`, pointing to the Supabase and Acme registries:
```json
"registries": {
  "@supabase": "https://supabase.com/ui/r/{name}.json",
  "@acme": "https://acme.com/r/{name}.json"
}
```

*   **@acme Registry**: Connects high-performance, accessible base UI layouts.
*   **Base UI Integration**: Primitives like `ButtonPrimitive` or `InputPrimitive` provide headless accessibility controls, which are styled inline in `components/ui/` files.

### Implementing Component Primitives

When creating or modifying Shadcn UI files (e.g., `components/ui/button.tsx`, `components/ui/input.tsx`):
1.  **Strictly Extend Primitives**: Retain Base UI primitives for screen reader support and keyboard navigation.
2.  **Apply Monoline Classes**: Make sure `rounded-none`, `border-border`, and `focus-visible:ring-1` are consistently implemented.
3.  **Support States**: Style invalid states explicitly with `aria-invalid` classes applied to text and border color only (e.g., `aria-invalid:border-destructive aria-invalid:text-destructive`) — never a `bg-destructive` fill.

---

## 7. Verification and Theme Testing

To verify design system compliance:
1.  **Corner Check**: Visually inspect all viewport sizes to confirm there are no border-radii on buttons, inputs, calendars, cards, or dialogs.
2.  **Light/Dark Toggle**: Test the interface in both light and dark modes to verify readability, contrast ratios, and correct color values on interactive elements (e.g., selection highlights and focused inputs).
3.  **Registry Conformity**: Check that any newly added component is declared in the local registry setup and respects the standard styling variables.
4.  **Responsive Check**: Verify that resizing the viewport from narrow mobile widths to desktop layouts preserves grid lines, does not break components, and matches mobile-first priorities.