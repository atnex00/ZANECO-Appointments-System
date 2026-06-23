# ZANECO Appointments System — Agent Guide

## Repo structure

pnpm monorepo with two packages:
- `frontend/` — Vue 3 + Vite SPA (port 3500, proxies `/api` → `localhost:8000`)
- `backend/` — Express 4 + SQLite (sql.js) (port 8000)

## Commands

| Action | Command |
|--------|---------|
| Install all | `pnpm install` |
| Seed DB | `pnpm run seed` |
| Start both dev servers | `pnpm run dev` |
| Start backend only (with --watch) | `pnpm run dev:backend` |
| Start frontend only | `pnpm run dev:frontend` |
| Build frontend | `pnpm run build` |
| One-click start (Windows) | Double-click `start.bat` |
| One-click start (macOS/Linux) | `./start.sh` |
| Docker (both services) | `docker compose up` |
| Docker seed DB | `docker compose run backend pnpm run seed` |

## One-click launcher scripts

- `start.bat` (Windows) and `start.sh` (macOS/Linux) require **only Node.js 18+** — no pnpm install, no Docker.
- Script checks for Node.js, enables corepack (built-in), runs `pnpm install` if needed, seeds the DB if empty, starts both servers, and opens the browser.
- Two separate terminal windows on Windows (one per server), background processes on macOS/Linux.
- Close the windows / Ctrl+C to stop.

## Docker

- `docker compose up` for dev (two containers: frontend:3500, backend:8000).
- `VITE_API_PROXY` env var configures the Vite proxy target (`frontend/vite.config.js`). Inside Docker it points to `http://backend:8000`; defaults to `http://localhost:8000` for local dev.
- Anonymous volumes (`/app/*/node_modules`) prevent bind-mounts from overwriting installed deps.
- Named volume `zaneco-data` persists the SQLite DB across container restarts.
- File watching uses `CHOKIDAR_USEPOLLING=1` for both containers (needed for bind mounts on macOS/Windows).

## Database

- SQLite via `sql.js` — no separate DB server, no migration files.
- Schema applied from `backend/db/schema.sql` on every startup (idempotent).
- DB file at `backend/data/zaneco.db` (gitignored).
- Auto-saves to disk every 5s via `setInterval` (see `backend/db/database.js:119`).
- DB NOT auto-saved after every write — rely on the 5s interval or call `save()` explicitly.

## Key gotchas

- **No test framework, no linter, no typechecker** — none installed. `npm run build` on frontend is the only verification.
- **Booking store (`frontend/src/stores/booking.js`) had a catch block that silently fabricated fake appointments** — the catch in `submitBooking()` previously generated mock data client-side with `Math.random()` reference numbers and saved to `localStorage`. If an API call fails, check that error is properly propagated.
- **PDF generation (`backend/services/pdfGenerator.js`) stores logo as base64 file** (`logo_combined.b64`). If regenerating, re-download the image and re-encode. The `vfs_fonts.js` font data must be `Buffer.from(..., 'base64')` decoded, not used as raw string.
- **Express 4 does not catch async errors in route handlers**; backend routes use `asyncHandler` wrapper (`backend/middleware/errors.js:42`) or explicit try/catch.
- **Auth**: Admin JWT stored in `localStorage` key `admin_token`. The axios interceptor (`frontend/src/api/client.js`) attaches it automatically and redirects to `/admin/login` on 401.
- **Notifications**: `backend/worker.js` runs a 30s interval. Currently simulates sending. Wire real providers via `.env` (see README).
- **Email receipts**: `backend/services/emailService.js` sends confirmation emails via Nodemailer (fire-and-forget after booking). Configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` in `.env`. Unconfigured SMTP silently skips sending — no crash.
- **No SQL ORM** — raw SQL via `prepare()` / `get()` / `all()` / `run()` in `backend/db/database.js`.

## Style conventions

- Vue 3 `<script setup>` + Composition API everywhere.
- Plain CSS with custom properties in `assets/styles/variables.css` — no Tailwind or UI framework.
- Icons: Google Material Symbols via CDN `<span class="material-symbols-outlined">icon_name</span>`.
- Backend: CommonJS `require` (not ESM). Frontend: ESM `import`.
- Column mapping for reports/data tables uses `COLUMN_LABELS` objects (both in frontend `ReportsPage.vue` and backend `pdfGenerator.js`).
- API responses use `{ success: true, data: ... }` or `{ success: false, error: { code, message } }` envelope.
- Admin route protection via `meta.auth` in Vue Router (`frontend/src/router/index.js`).

## Installed skills (`.opencode/skills/`)

Three skills are available. The agent loads them automatically when the task matches, but these are the triggers:

| Skill | When to use | Key rule |
|-------|-------------|----------|
| `brainstorming` | Before any creative or feature work — new pages, components, backend features, behavior changes | **Hard gate**: no code until design is presented and approved. Must write `docs/design/YYYY-MM-DD-<topic>-design.md`. |
| `frontend-design` | When building new UI components or reshaping existing ones | Use two-pass process: first design a color/type/layout/signature token system, then build. Avoid generic defaults. |
| `find-skills` | When user asks "how do I do X" or "find a skill for X" | Check `skills.sh` leaderboard first, verify install counts and source reputation. |

`collab-design` is also installed but applies to a different project (col.lab platform) — not relevant here.

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
