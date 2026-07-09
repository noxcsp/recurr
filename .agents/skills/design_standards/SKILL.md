---
name: design_standards
description: Applies and enforces modern minimalist, monoline UI design standards with shadcn, ensuring no rounded corners and transparent/border-only error/success states.
---

# Design Standards: Modern Minimalist & Monoline UI

Apply this skill whenever creating, modifying, or refactoring user interfaces, components, forms, notifications, or layouts.

---

## 1. Core Principles

- **Modern Minimalist & Monoline Look**: Rely on high contrast, clean grid layout structure, precise alignments, and generous spacing rather than complex backgrounds, drop-shadows, or heavy fills.
- **Strictly Square Borders (No Rounded Corners)**: Enforce sharp corners for all structural, UI, and interactive elements.
- **No Background Color for Success & Error States**: Alert banners, status states, inline warnings, and form validations must never use filled background containers. They must use colored monoline borders, colored text, or icons on a transparent (or default card/popover) background.
- **Borders & Rules**: Use thin, 1px rules/borders (`border`, `border-input`, `border-border`) to segregate sections instead of colored container blocks.

---

## 2. Coding Guidelines & Checklist

### ❌ Prohibited Patterns
- **No rounding classes**: Do not use `rounded`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, or `rounded-full` utility classes on elements like inputs, cards, buttons, checkboxes, dialogs, badges, or menus.
- **No status fills**: Avoid classes like `bg-destructive/15`, `bg-red-50`, `bg-green-50`, `bg-emerald-100`, etc., for displaying status warnings or success messages.

###  Required Patterns
- **Enforce theme radius override**: The theme's `--radius` CSS variable in `app/globals.css` must be set to `0px` (or `0rem`).
- **Use border or text colors for statuses**:
  - **Error state**: Use `text-destructive` and/or `border-destructive` with a transparent background.
  - **Success state**: Use `text-primary` (or custom brand text color) and/or `border-primary` with a transparent background.
- **Explicit `rounded-none` safety**: In cases where shadcn components or third-party styles try to apply rounding, explicitly append `rounded-none` to override.

---

## 3. UI Component Examples

### Form Fields & Inputs
Inputs should always be square, styled with monoline borders, and have minimal active states.
```tsx
// Good: Square input, transparent background, monoline outline on focus
<Input className="rounded-none border-input bg-transparent" />
```

### Error & Success Notification Boxes
Never use filled-background containers. Use thin monoline borders and clear colors.

```tsx
// ❌ BAD
<div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3">
  Error occurred
</div>

//  GOOD: Minimalist monoline border, transparent background, destructive text
<div className="border border-destructive text-destructive text-xs p-3 font-medium">
  Error occurred
</div>

//  GOOD: High-contrast minimalist text-only alert with icon
<div className="flex items-center gap-2 text-xs font-medium text-destructive">
  <AlertCircle className="size-4" />
  <span>Error occurred</span>
</div>

//  GOOD: Success message styled with a primary border
<div className="border border-primary text-primary text-xs p-4 text-center">
  Settings saved successfully.
</div>
```

### Buttons & Call-to-Actions
Buttons are styled with sharp corners.
```tsx
// Good: Button styled with sharp corners
<Button className="rounded-none border border-transparent bg-primary text-primary-foreground">
  Continue
</Button>
```
