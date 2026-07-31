# ZANECO Appointments System — Agent Guide

## Repo structure

pnpm monorepo with two packages:
- `frontend/` — Vue 3 + Vite SPA (port 3500, proxies `/api` → `localhost:8000`, listens on all interfaces for local network access)
- `backend/` — Express 4 + PostgreSQL (Prisma ORM) (port 8000)

## Prerequisites

- **Node.js 18+** — ships with `corepack` (no global pnpm install needed).
- **Node.js 25+** — corepack is no longer bundled; install it first: `npm install -g corepack`

## Commands

| Action | Command |
|--------|---------|
| Enable pnpm (one-time) | `corepack enable` |
| Install all | `pnpm install` |
| Apply schema & seed DB | `pnpm run seed` |
| Start both dev servers | `pnpm run dev` |
| Start backend only (with --watch) | `pnpm run dev:backend` |
| Start frontend only | `pnpm run dev:frontend` |
| Build frontend | `pnpm run build` |
| Create DB role & database (Windows) | `scripts\setup-db.bat` |
| One-click start (Windows) | Double-click `start.bat` |
| One-click start (macOS/Linux) | `./start.sh` |
| Docker (both services) | `docker compose up` |
| Docker seed DB | `docker compose run backend pnpm run seed` |

## One-click launcher scripts

- `start.bat` (Windows) and `start.sh` (macOS/Linux) require **only Node.js 18+** — no pnpm install, no Docker.
- Script checks for Node.js, enables corepack (built-in), runs `pnpm install` if needed, seeds the DB if empty, starts both servers, and opens the browser.
- Two separate terminal windows on Windows (one per server), background processes on macOS/Linux.
- Close the windows / Ctrl+C to stop.
- **Windows note**: `start.bat` automatically invokes `scripts\setup-db.bat` to create the PostgreSQL role and database if they don't exist. PostgreSQL 17 must be installed and the service running at `localhost:5432`. If `psql` is not in your PATH, `setup-db.bat` will try `C:\Program Files\PostgreSQL\17\bin`.

## Docker

- `docker compose up` for dev (three containers: postgres:5432, frontend:3500, backend:8000).
- PostgreSQL container has a health check — backend waits for it before serving.
- `DATABASE_URL` env var configures the Prisma connection. Inside Docker it points to `postgresql://zaneco:secret@postgres:5432/zaneco_appointments`.
- `VITE_API_PROXY` env var configures the Vite proxy target (`frontend/vite.config.js`). Inside Docker it points to `http://backend:8000`; defaults to `http://localhost:8000` for local dev. The Vite dev server binds to all interfaces (`host: true`) so other devices on the local network can access the frontend.
- Anonymous volumes (`/app/*/node_modules`) prevent bind-mounts from overwriting installed deps.
- Named volume `zaneco-pg-data` persists PostgreSQL data across container restarts.
- File watching uses `CHOKIDAR_USEPOLLING=1` for all containers (needed for bind mounts on macOS/Windows).

## Database

- PostgreSQL via Prisma ORM (`@prisma/client` + `pg`).
- Schema defined in `backend/prisma/schema.prisma` — 9 models: Office, OfficeSchedule, TimeSlot, ConcernType, Administrator, Appointment, Notification, RequestLog, AuditLog.
- Migrations managed by Prisma Migrate (no manual SQL files).
- Run `pnpm run seed` to apply schema (`prisma db push`) and insert seed data.
- **Note**: `createdAt`/`updatedAt` fields use `DateTime` type with `@default(now())` / `@updatedAt`. The `updatedAt` field auto-updates on any write. When reading these fields in JavaScript, use `.toISOString()` for string formatting. Raw SQL queries can compare with proper `timestamp` operators.

## Key gotchas

- **No test framework, no linter, no typechecker** — none installed. `npm run build` on frontend is the only verification.
- **Express 4 does not catch async errors in route handlers** — every `async (req, res) =>` handler MUST be wrapped with `asyncHandler()` (imported from `middleware/errors.js`) or use explicit try/catch. Without it, an unhandled promise rejection crashes the server. All routes in `backend/routes/` now use `asyncHandler`. The `rateLimitBooking` middleware is also wrapped.
- **No empty catch blocks** — every `catch {}` must at minimum log the error with `console.error`. Silent catches hide bugs. User-facing actions (status updates, saves) should also show an `alert()` so the operator knows something went wrong.
- **PostgreSQL raw queries use `$N` placeholders** — Prisma v6 with PostgreSQL requires `$1`, `$2`, etc. in `$queryRawUnsafe`. Do NOT use `?` placeholders (MySQL-style). The `dateFilter` middleware in `reports.js` builds correct `$N` params.
- **Use interactive transactions for conditional updates** — `$transaction(async (tx) => { ... })` supports read-then-write patterns. The array form `$transaction([...])` only accepts `PrismaPromise` instances — chaining `.then()` on a PrismaPromise returns a regular Promise and throws `"All elements of the array need to be Prisma Client promises"`. **Booking and reschedule routes now use interactive transactions** to prevent TOCTOU race conditions on slot capacity.
- **Auth**: Admin JWT stored in `localStorage` key `admin_token`. The axios interceptor (`frontend/src/api/client.js`) attaches it automatically and redirects to `/admin/login` on 401. **The interceptor only clears the token for admin API requests** (checks URL prefix `/admin/` or `Authorization` header) — consumer endpoint 401s don't log the admin out.
- **Login uses `router.push`** — `LoginPage.vue` navigates with Vue Router, not `window.location.replace`.
- **Role-based route guard** — The Vue Router (`frontend/src/router/index.js`) now checks `meta.role` on admin routes. Staff users are redirected to their dashboard if they try to access super_admin routes by URL.
- **Notifications**: `backend/worker.js` runs a 30s interval. Uses sequential `await` (no dangling `.then()` promises). Wire real providers via `.env` (see README). Notifications with `retryCount >= 3` are marked `failed` (not stuck in `retrying`).
- **Email receipts**: `backend/services/emailService.js` sends confirmation emails via Nodemailer (fire-and-forget after booking). Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` in `.env`. Unconfigured SMTP silently skips — no crash. For Gmail, use an [App Password](https://myaccount.google.com/apppasswords) (requires 2FA). **Logo attachment is optional** — missing `logo-combined.png` won't kill email sending.
- **Prisma ORM** — All DB access goes through Prisma Client. Schema at `backend/prisma/schema.prisma`. Reports with complex aggregations use `$queryRaw` with PostgreSQL syntax.
- **`generateSlots` button was removed** — The "Generate Slots" button was removed from the offices page because the backend route `POST /admin/offices/:id/generate-slots` was never implemented. The docs reference this endpoint but it exists nowhere in the code. Re-add the button only after implementing the endpoint with `TimeSlot` generation from `OfficeSchedule` data within a date range. **Slots are now auto-generated on booking** based on `OfficeSchedule` and office hours, not hardcoded 08:00-17:00.
- **Reference numbers** — Format: `ZNC` + YY + MM + 6-digit sequence. The `LIKE` pattern in `appointments.js` uses `'ZNC' || y || m || '%'` (not bare `y + m + '%'`).
- **`updatedAt` is `DateTime @updatedAt`** — it auto-updates. Do NOT manually set `updatedAt` in `update()` calls (the Prisma `@updatedAt` attribute handles it).
- **PDF generation** — `logo_combined.b64` is loaded lazily with a try/catch fallback. Missing file no longer crashes server startup.
- **Auth middleware uses `async/await`** — `middleware/auth.js` is an async function, not a `.then().catch()` chain. It also checks `lockedUntil` and distinguishes DB errors from "account not found".
- **CORS_ORIGIN defaults to `http://localhost:3500`** — matches the frontend dev server port. Update for production.
- **Dashboard summary** (`/api/v1/admin/dashboard/summary`) applies `officeFilter` for `office_manager` and `staff` roles — no data leakage.
- **Refresh token rotation** — `/api/v1/auth/refresh` generates a new refresh token on each use (old one is invalidated).
- **Reset password timing** — A 200ms constant-time delay is applied when the email is not found to prevent email enumeration.

## Style conventions

- Vue 3 `<script setup>` + Composition API everywhere.
- Plain CSS with custom properties in `assets/styles/variables.css` — no Tailwind or UI framework.
- Icons: Google Material Symbols via CDN `<span class="material-symbols-outlined">icon_name</span>`.
- Backend: CommonJS `require` (not ESM). Frontend: ESM `import`.
- Column mapping for reports/data tables uses `COLUMN_LABELS` objects (both in frontend `ReportsPage.vue` and backend `pdfGenerator.js`).
- API responses use `{ success: true, data: ... }` or `{ success: false, error: { code, message } }` envelope.
- Admin route protection via `meta.auth` in Vue Router (`frontend/src/router/index.js`).

## Installed skills (`.opencode/skills/`)

Four skills are available. The agent loads them automatically when the task matches, but these are the triggers:

| Skill | When to use | Key rule |
|-------|-------------|----------|
| `brainstorming` | Before any creative or feature work — new pages, components, backend features, behavior changes | **Hard gate**: no code until design is presented and approved. Must write `docs/design/YYYY-MM-DD-<topic>-design.md`. |
| `collab-design` | When working on the col.lab collaboration platform UI | Student-focused, warm aesthetic, coral/teal palette, existing architecture constraints. |
| `frontend-design` | When building new UI components or reshaping existing ones | Use two-pass process: first design a color/type/layout/signature token system, then build. Avoid generic defaults. |
| `find-skills` | When user asks "how do I do X" or "find a skill for X" | Check `skills.sh` leaderboard first, verify install counts and source reputation. |

## Key entrypoints

| What | Path |
|------|------|
| Frontend entry | `frontend/src/main.js` |
| Router | `frontend/src/router/index.js` |
| API client | `frontend/src/api/client.js` (base: `/api/v1`) |
| Backend entry | `backend/server.js` |
| Auth middleware | `backend/middleware/auth.js` |
| Error middleware | `backend/middleware/errors.js` |
| DB adapter | `backend/db/database.js` |
| Booking store | `frontend/src/stores/booking.js` |
| PDF reports | `backend/services/pdfGenerator.js` |
| Report routes | `backend/routes/reports.js` |
| Admin offices route | `backend/routes/adminOffices.js` |
| Admin offices page | `frontend/src/pages/admin/OfficesPage.vue` |
