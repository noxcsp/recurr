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

Recurr supports a fully dynamic, light-and-dark theme system configured via **Tailwind CSS v4** and native CSS variables in `app/globals.css`.

### OKLCH Color Tokens
Colors are defined using the `oklch` color space to ensure uniform brightness perception across the spectrum.

| Token | Light Theme Value | Dark Theme Value | Usage |
| :--- | :--- | :--- | :--- |
| `--background` | `oklch(1 0 0)` (Pure White) | `oklch(0.145 0 0)` (Deep Charcoal) | Primary application background |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text and high-contrast lines |
| `--primary` | `oklch(0.52 0.105 223.128)` | `oklch(0.45 0.085 224.283)` | Brand color, primary action buttons |
| `--primary-foreground` | `oklch(0.984 0.019 200.873)` | `oklch(0.984 0.019 200.873)` | Text on top of primary colors |
| `--muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` | Secondary background, disabled states |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Low-contrast text, secondary labels |
| `--border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Standard 1px divider lines |
| `--input` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 15%)` | Form input borders |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Warnings, errors, unpaid/overdue badges |

### Accessibility, Readability & Visibility Rules
*   **Contrast Ratios**: All text must meet WCAG 2.1 AA contrast requirements (minimum **4.5:1** for standard body text, **3:1** for large heading text). 
    *   Standard text must utilize `text-foreground`.
    *   Subtle descriptions, metadata, or placeholders must use `text-muted-foreground`. Do not use lighter text shades that compromise readability.
*   **Interactive State Contrast**: Hover, focus, and active states must remain distinct and visible. When focus is active, elements must display a sharp 1px ring (`focus-visible:ring-1 focus-visible:ring-ring/50`) and border update (`focus-visible:border-ring`).
*   **Color as Meaning**: Never use color alone to convey subscription state (e.g., unpaid vs. paid). Support color indicators (such as badges) with text labels (e.g., "Paid", "Unpaid", "Overdue") to ensure screen-reader and colorblind accessibility.

### Tailwind CSS v4 Theme Map
Native variables are mapped within `@theme inline` in `app/globals.css`. Always use semantic utility classes (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.) instead of hardcoded hex codes or arbitrary OKLCH values.

---

## 3. Corner Radius Policy (Absolute Zero)

To enforce the monoline aesthetic, the corner radius must remain strictly **zero**.

*   **Global CSS Configuration**: `--radius` is set to `0px` in `app/globals.css`.
*   **Tailwind Utility**: Use `rounded-none` for all custom layout containers.
*   **Nested Elements**: Any media, image, background hover states, or inner blocks must also use `rounded-none` to prevent visual leakage.
    *   *Example in Card:* `*:[img:first-child]:rounded-none`

---

## 4. Typography Hierarchy

To maintain visual discipline and high-density legibility, typography uses a highly standardized scale of sizes and font weights.

| Element Level | Font Size | Font Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Page Header / H1** | `text-base` or `text-lg` | `font-semibold` | `leading-none` or `leading-tight` | Main page titles, dashboard headings |
| **Section Title / H2** | `text-sm` | `font-medium` | `leading-snug` | Card titles, calendar month headings |
| **Subsection Header / H3** | `text-xs` | `font-semibold` | `leading-normal` | Form field groups, list category headers |
| **Body Text / Standard** | `text-xs` | `font-normal` | `leading-relaxed` | Main paragraphs, description blocks |
| **Muted Metadata / Subtitle** | `text-[10px]` or `text-xs` | `font-normal` | `leading-normal` | Timestamps, currency labels, secondary text |
| **Interactive Text / Buttons** | `text-xs` | `font-medium` | `leading-none` | Button labels, tabs, form selections |
| **Forms & Input Labels** | `text-xs` | `font-medium` | `leading-none` | Input labels, validation error messages |

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
3.  **Support States**: Style invalid states explicitly with `aria-invalid` classes (e.g., `aria-invalid:border-destructive`).

---

## 7. Verification and Theme Testing

To verify design system compliance:
1.  **Corner Check**: Visually inspect all viewport sizes to confirm there are no border-radii on buttons, inputs, calendars, cards, or dialogs.
2.  **Light/Dark Toggle**: Test the interface in both light and dark modes to verify readability, contrast ratios, and correct color values on interactive elements (e.g., selection highlights and focused inputs).
3.  **Registry Conformity**: Check that any newly added component is declared in the local registry setup and respects the standard styling variables.
4.  **Responsive Check**: Verify that resizing the viewport from narrow mobile widths to desktop layouts preserves grid lines, does not break components, and matches mobile-first priorities.

