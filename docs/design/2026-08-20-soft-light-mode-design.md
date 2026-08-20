# Soft Light Mode Design

Date: 2026-08-20

## Problem

Light mode is too bright: the pale cream page background (`#fffbeb`) and the near-universal pure white surface (`--color-white`) wash out the UI. The goal is a warmer, softer light palette that keeps the amber ZANECO identity without the glare.

## Scope

- Whole app (consumer portal + admin dashboard) — both share the same design tokens.
- Light mode values only. Dark mode is untouched.

## Approach

Token-level refresh plus a mechanical cleanup of component usages:

1. **Separate the two roles of `--color-white`**:
   - `--color-white` stays `#ffffff` — it is also used for text/icon color on colored surfaces (buttons, active slots, toasts) where pure white preserves contrast.
   - Background usages of `var(--color-white)` (cards, inputs, tables, modals) are switched to `var(--color-bg-card)`, which becomes the warm off-white surface token.

2. **Deepen the page background** and **warm the neutrals** so surfaces read as layered warm paper instead of flat bright white.

## Proposed Palette (light mode only)

| Token | Current | New | Role |
|-------|---------|-----|------|
| `--color-bg` | `#fffbeb` | `#f6f0e3` | Page background (deeper warm cream) |
| `--color-bg-card` | `#ffffff` | `#fffdf7` | Card / input / table surface (warm off-white) |
| `--color-border` | `#e7e5e4` | `#e9e0d0` | Warm sand border |
| `--color-gray-50` | `#fafaf9` | `#f9f6ef` | Subtle warm hover/shade |
| `--color-gray-100` | `#f5f5f4` | `#f3eee3` | Warm subtle shade |
| `--color-sidebar-bg` | `#fef3c7` | `#f9eccf` | Sidebar (slightly deeper amber tint) |
| `--color-sidebar-border` | `#fde68a` | `#f2dfae` | Sidebar border |
| `--color-sidebar-hover` | `#fde68a` | `#f4e3b8` | Sidebar hover |
| `--color-nav-hover` | `#fde68a` | `#f4e3b8` | Nav hover |
| `--color-footer-bg` | `#fef3c7` | `#f9eccf` | Footer |
| `--color-mobile-header-bg` | `#fef3c7` | `#f9eccf` | Mobile header |

Unchanged: `--color-white` (`#ffffff`, text-on-color), all accent colors, dark mode block.

## Verification

- `pnpm run build` passes.
- Visual check in light mode: consumer portal home, booking flow, admin dashboard, offices, appointments; sidebar and cards read as warm layered paper, not flat white.

## Implementation notes

- Only single-line `background: var(--color-white)` / `background-color: var(--color-white)` declarations are flipped to `var(--color-bg-card)` — never `color:` usages.
- Any multi-line declarations found are handled individually.
- After the flip, grep verifies no background usages of `--color-white` remain.