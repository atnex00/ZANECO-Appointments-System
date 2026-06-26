# ZANECO Appointments — Frontend Full Redesign

**Date**: 2026-06-26
**Status**: Approved ✅

## Overview

Full visual redesign of all 24 pages across consumer and admin sides. A documented design system (tokens, component specs, layout patterns) is established first, then applied to 6 high-traffic pages in the first wave, with remaining 18 pages following in the second wave.

## Design Philosophy

ZANECO is a provincial electric cooperative — solid, trustworthy, human. Amber is the anchor (energy, power at dusk, service crews), applied with depth and restraint. Photos in key locations can be swapped later.

---

## 1. Color System

| Token | Hex | Role |
|-------|-----|------|
| `--color-primary` | `#b45309` | Deep amber — buttons, headings |
| `--color-primary-accent` | `#d97706` | Warm amber — hover, active |
| `--color-primary-surface` | `#fffbeb` | Cream — page bg, card surfaces |
| `--color-text` | `#292524` | Warm charcoal — body text |
| `--color-text-muted` | `#78716c` | Warm gray — secondary text |
| `--color-border` | `#e7e5e4` | Warm gray — borders |
| `--color-surface-admin` | `#1c1917` | Dark warm — admin sidebar |
| `--color-glow` | `rgba(251,191,36,0.3)` | Amber glow — focus, hover |
| `--color-shadow-amber` | `rgba(217,119,6,0.15)` | Amber shadow — elevated items |
| `--color-success` | `#16a34a` | Green — confirmed |
| `--color-danger` | `#dc2626` | Red — cancelled |

## 2. Typography

| Level | Font | Size | Weight | L-height | Where |
|-------|------|------|--------|----------|-------|
| Display | Playfair Display | 2.5rem | 700 | 1.2 | Hero h1, welcome |
| Section | Playfair Display | 1.75rem | 600 | 1.25 | h2, sections |
| Subsection | Inter | 1.25rem | 600 | 1.4 | h3, card titles |
| Body | Inter | 1rem | 400 | 1.6 | Paragraphs, labels |
| Small | Inter | 0.875rem | 400 | 1.5 | Captions, meta |
| Tiny | Inter | 0.75rem | 500 | 1.4 | Badges, timestamps |

## 3. Layout

- Consumer: section pad 4rem→6rem, hero 100vh photo+overlay, content max 1200px
- Admin: table rows 56px, cell pad 16px, sidebar active = amber left border 4px
- Booking: stepper 40px circles, elevated panels, receipt-style review

## 4. Signature — Amber Glow

Every focusable element shares the same amber glow on interaction:
- `:focus-visible`: `0 0 0 3px rgba(251,191,36,0.3)`
- Button hover: lift + shadow
- Card hover: amber left border + shadow
- Table row hover: cream tint
- Nav active: amber left border (admin) / underline (consumer)

## 5. Component Changes

Stepper (40px circles, amber fill, animation), cards (32px pad, hover shadow), tables (56px rows, cream alt, amber header border), buttons (44px height, glow hover), inputs (14px pad, glow focus), badges (left-border accent), skeleton (amber shimmer), empty state (icon+action pattern)

## 6. Wave 1 — Full Redesign (6 pages)

1. ConsumerLayout — solid amber header border, glow nav, footer contact info
2. HomePage — 100vh hero photo+overlay, 3-step icon cards, office grid
3. BookingFlow — elevated step panels, amber stepper, receipt review
4. AdminLayout — amber left-border active, tighter sidebar
5. DashboardPage — glass stat cards, amber accent numbers, recent table
6. AppointmentsPage — hover rows, pill filters, left-border badges

## 7. Wave 2 — Token Swap (18 pages)

Token+component application to remaining pages.

## 8. Implementation Order

1. `variables.css` update
2. `main.css` update
3. ConsumerLayout redesign
4. HomePage redesign
5. BookingFlow redesign
6. AdminLayout redesign
7. DashboardPage redesign
8. AppointmentsPage redesign
9. Remaining 18 pages
10. `pnpm run build` verify
