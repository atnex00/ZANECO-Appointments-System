# Consumer Frontend Animations

## Overview
Add smooth, subtle, professional-grade animations to the consumer-facing pages: page route transitions, element entrance animations on scroll, and micro-interactions for UI elements.

## Principles
- **Subtle & professional** — short durations, gentle movements, no gimmicks
- **Zero new dependencies** — use Vue built-ins (`<Transition>`) and vanilla CSS + IntersectionObserver
- **Graceful degradation** — animation is enhancement; content is always accessible
- **Consistent values** — shared timing/easing via CSS custom properties

## Animation Constants

| Property     | Value                              |
|-------------|-----------------------------------|
| Duration    | 250ms (micro), 350ms (entrance), 300ms (route) |
| Easing      | `cubic-bezier(0.4, 0, 0.2, 1)`   |
| Slide distance | translateY(12px)               |
| Stagger delay | 80ms between siblings           |
| Fade in     | opacity 0 → 1                     |

## 1. Page Route Transitions

**File:** `ConsumerLayout.vue`

Wrap `<router-view>` in `<Transition>` with a named mode `out-in`:

- Leaving page: fade-out + slight scale-down (0.98) over 200ms
- Entering page: fade-in + slide-up (12px) over 300ms with 50ms delay

CSS classes: `.page-enter-active`, `.page-leave-active`, `.page-enter-from`, `.page-leave-to`

## 2. Element Entrance Animations

**New composable:** `composables/useInView.js`

- Uses `IntersectionObserver` with `threshold: 0.1` and `rootMargin: '0px 0px -40px 0px'`
- Returns a `ref<boolean>` that becomes `true` when element enters viewport
- Automatically disconnects observer after first trigger
- Accepts optional `delay` parameter for staggering

**Usage:** Elements receive a CSS class `.animate-in` with `opacity: 0; transform: translateY(12px)` and transition to `opacity: 1; transform: translateY(0)` when the ref triggers.

**Staggered lists:** Parent container passes `index * 80ms` as delay to each child.

**Applied to HomePage:**
- Hero section (no delay, appears immediately)
- Step cards (staggered 80ms)
- Office cards (staggered 80ms)
- Section titles and descriptions (200ms delay)

## 3. Micro-interactions

**Navigation links:** Background tint on hover already exists. Add subtle underline slide-in using pseudo-element.

**Buttons:** 
- Primary: add `transform: translateY(-1px)` + stronger shadow on hover; `scale(0.97)` on active
- Outline: border-color and text-color transition; add background fill

**Form inputs (BookingFlow):**
- Focus: border-color transition to primary, box-shadow inset glow
- Label float animation (if using floating labels)

**Cards:**
- Office cards: existing lift on hover is good; add `box-shadow` transition matching duration
- Step cards: gentle lift on hover

## Files Changed
- `frontend/src/layouts/ConsumerLayout.vue` — page transition wrapper
- `frontend/src/composables/useInView.js` — NEW composable
- `frontend/src/pages/consumer/HomePage.vue` — scroll-triggered entrance animations
- `frontend/src/pages/consumer/BookingFlow.vue` — form input micro-interactions
- `frontend/src/assets/` — if global animation keyframes are needed

## Testing
- Visual inspection on route changes (smooth, no flicker)
- Scroll-triggered animations on HomePage (all sections animate on first scroll)
- Hover/active states on buttons and cards
- Ensure no layout shift from animation elements (use `will-change: transform, opacity`)
