# Admin User Guide

## Overview
A comprehensive in-app user guide for ZANECO admin panel, accessible from the sidebar navigation. All content is hardcoded in a single Vue page with a sticky table-of-contents sidebar.

## Route
- `/admin/guide` — `name: 'admin-guide'`, `meta: { auth: true, title: 'User Guide' }`
- Added to `navItems` and `mobileNav` in AdminLayout

## Layout
Two-column within the existing admin shell:
- **Left:** Sticky ToC sidebar (240px) with section links and scroll-spy highlighting
- **Right:** Scrollable content with 7 sections

## Sections
1. **Overview & Getting Started** — system purpose, login, navigation
2. **Managing Appointments** — list view, filters, detail view, status actions
3. **Offices & Concern Types** — managing offices, concern categories
4. **Schedules & Calendar** — monthly calendar, schedule management
5. **Reports & Analytics** — dashboard, reports, PDF export
6. **Admin Users & Permissions** — user roles, CRUD, activation
7. **Notifications & Audit Logs** — notification queue, audit trail

## Technical Details
- Scroll-spy via `IntersectionObserver` watching each section
- Each ToC item is an `<a href="#section-id">` for smooth scroll
- No backend API needed — static content only
- Uses existing design tokens (colors, spacing, fonts)

## Files Changed
- `frontend/src/pages/admin/GuidePage.vue` — NEW
- `frontend/src/router/index.js` — add route
- `frontend/src/layouts/AdminLayout.vue` — add nav items
