# Frontend Design Overhaul

**Date**: 2026-06-26
**Status**: Approved for implementation
**Approach**: Visual Layer Reskin (Approach 2)

## Scope

### What we change
- `variables.css` — complete rewrite with unified token system
- `main.css` — add toast/notification styles, remove duplicate badge system
- `index.html` — load secondary typeface (Playfair Display) via Google Fonts
- `ConsumerLayout.vue` — minor color token swaps
- `AdminLayout.vue` — swap blue palette → warm amber variant, replace green nav active with amber-based tokens
- `LoginPage.vue` — remove references to unloaded fonts (Hanken Grotesk, Geist), use actual loaded typefaces from tokens
- All admin pages — swap hardcoded colors for token references
- All consumer pages — swap hardcoded colors, rewrite error/empty messages
- `HomePage.vue` — swap custom button classes for global `.btn` variants
- New: `useToast.js` composable + `ToastContainer.vue` component
- New: apply signature amber glow to nav bars, focus rings, loading states

### What we keep unchanged
- All page layouts and component structure
- Routing, stores, API layer
- The booking stepper and office cards (they work)
- The admin sidebar navigation structure
- The consumer header layout
- `prefers-reduced-motion` support

## 1. Color System

```css
/* Primary — Warm amber/energy (shared consumer + admin) */
--color-primary-50:  #fffbeb
--color-primary-100: #fef3c7
--color-primary-200: #fde68a
--color-primary-400: #fbbf24   /* main accent */
--color-primary-500: #f59e0b
--color-primary-600: #d97706
--color-primary-700: #b45309
--color-primary-900: #78350f

/* Neutral */
--color-neutral-50:  #f9fafb
--color-neutral-100: #f3f4f6
--color-neutral-200: #e5e7eb
--color-neutral-400: #9ca3af
--color-neutral-600: #4b5563
--color-neutral-700: #374151
--color-neutral-900: #111827

/* Admin surface — darker warm variant, NOT cool blue */
--color-surface-admin:  #1c1917  /* warm charcoal */
--color-surface-card:   #292524  /* instead of #1f2937 */

/* Semantic */
--color-success: #16a34a
--color-warning: #d97706
--color-danger:  #dc2626
--color-info:    #2563eb

/* Signature — amber glow */
--color-glow: rgba(251, 191, 36, 0.3)
--color-shadow-amber: rgba(217, 119, 6, 0.15)
```

## 2. Typography

- **Primary face**: Inter (already loaded) — body, UI labels, tables
- **Secondary face**: Playfair Display (loaded via Google Fonts) — headings, hero title, welcome messages
- Remove all references to unloaded faces (Hanken Grotesk, Geist)

## 3. Signature Element — Amber Glow

Applied to:
- `:focus-visible` ring on all inputs and buttons (`box-shadow: 0 0 0 3px var(--color-glow)`)
- Active nav item left border or background (`background: linear-gradient(90deg, rgba(251,191,36,0.15) 0%, transparent 100%)`)
- Loading skeleton pulse color (`background: linear-gradient(90deg, transparent, var(--color-primary-200), transparent)`)

## 4. Toast Notification System

- `useToast()` composable (`frontend/src/composables/useToast.js`)
- `<ToastContainer>` rendered in layouts
- Types: `success`, `error`, `warning`, `info`
- Auto-dismiss: 5s (error: 8s), manual dismiss via X button
- Stack vertically, newest at top, max 5 visible
- Replaces all `alert()` calls

## 5. Error/Empty State Message Rewrites

| Before | After |
|--------|-------|
| "Failed to load offices" | "Couldn't load offices — check your connection and try again" |
| "Appointment not found" | "No appointment found with that reference number. Double-check and try again." |
| "No appointments found" | "No appointments yet — book your first one above" |
| "Failed to fetch" network errors | "Connection lost — please try again" |

## 6. Implementation Order

| Step | What | Files |
|------|------|-------|
| 1 | Rewrite `variables.css` with unified token system | `variables.css` |
| 2 | Load Playfair Display in `index.html` | `frontend/index.html` |
| 3 | Create `useToast.js` + `ToastContainer.vue` | New files |
| 4 | Mount toast container in layouts | `App.vue`, `ConsumerLayout.vue`, `AdminLayout.vue` |
| 5 | AdminLayout: swap palette, fix nav active | `AdminLayout.vue` |
| 6 | ConsumerLayout: swap colors → tokens | `ConsumerLayout.vue` |
| 7 | LoginPage: remove unloaded fonts, use tokens | `LoginPage.vue` |
| 8 | All admin pages: replace hardcoded colors | All pages under `pages/admin/` |
| 9 | All consumer pages: replace colors + rewrite messages | All pages under `pages/consumer/` |
| 10 | HomePage: swap custom buttons → global `.btn` | `HomePage.vue` |
| 11 | Add signature amber glow throughout | `variables.css`, layouts |
| 12 | Replace all `alert()` with toast | All affected pages |
| 13 | Remove duplicate `.badge-*` from `main.css` | `main.css` |
| 14 | Verify with `pnpm run build` | — |

## 7. Additional Fixes

- Pagination range display corrected
- Tab counts computed from total dataset (not current page)
