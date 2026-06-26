# ZANECO Consumer Appointment Scheduling System

Web-based appointment scheduling platform for Zamboanga del Norte Electric Cooperative (ZANECO) customer service offices.

## Overview

Consumers can schedule appointments online at any of five ZANECO service offices for billing clarifications and account concerns. The system manages time slots, sends SMS/email notifications, and provides administrators with full appointment lifecycle management and reporting tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vue 3 + Vite (pnpm workspace) |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (Prisma ORM) |
| **Auth** | JWT + bcrypt |
| **Validation** | Joi |
| **Charts** | Chart.js + vue-chartjs |
| **PDF** | pdfmake (server-side) |
| **Notifications** | DB-backed queue with worker (Twilio, SendGrid, or free alternatives) |

## Offices

| Office | Location |
|--------|----------|
| Main Office | Poblacion, Dipolog City |
| Sindangan Area Services | Sindangan, Zamboanga del Norte |
| Liloy Area Services | Liloy, Zamboanga del Norte |
| Piñan Area Services | Piñan, Zamboanga del Norte |
| Dipolog Area Services | Minaog, Dipolog City, Zamboanga del Norte |

## Quick Start

### Option A — Local (pnpm)

#### Prerequisites

- Node.js 18+ ([download](https://nodejs.org)) — ships with `corepack` (no global pnpm install needed)
- **Node.js 25+**: corepack is no longer bundled; install it first: `npm install -g corepack`
- **PostgreSQL 14+** ([download](https://www.postgresql.org/download/)) — or use Docker option below

```bash
# Enable pnpm (one-time per machine)
corepack enable

# Install all dependencies (frontend + backend)
pnpm install

# Apply schema & seed the database (requires PostgreSQL running)
pnpm run seed

# Start both dev servers at once
pnpm run dev

# Or start them separately:
pnpm run dev:backend  # API on port 8000 (with --watch)
pnpm run dev:frontend # SPA on port 3500
```

### Option B — Docker

#### Prerequisites

- Docker Desktop ([download](https://www.docker.com/products/docker-desktop/))

```bash
# Build and start all services (postgres + backend + frontend)
docker compose up

# Seed the database (first time or reset)
docker compose run backend pnpm run seed
```

Then open **http://localhost:3500**. The frontend proxies `/api` requests to the backend container automatically.

### Notification Providers (Free Alternatives)

The notification worker (`backend/worker.js`) currently simulates sending. For real delivery, wire one of these:

| Channel | Provider | Free Tier | Setup |
|---------|----------|-----------|-------|
| **SMS** | Twilio | $15 trial credit, then pay-per-use | Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in `.env` |
| **SMS** | Vonage (Nexmo) | €2 trial credit | Set `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_FROM` |
| **SMS** | Textbelt | 1 free SMS/day, then pay | `TEXTBELT_API_KEY` |
| **Email** | SendGrid | 100 emails/day free | `SENDGRID_API_KEY` + `EMAIL_FROM` |
| **Email** | Resend | 3,000 emails/month free | `RESEND_API_KEY` + `EMAIL_FROM` |
| **Email** | Brevo (Sendinblue) | 300 emails/day free | `BREVO_API_KEY` + `EMAIL_FROM` |
| **Email** | SMTP2GO | 1,000 emails/month free | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |

To wire a provider, replace `simulateSend()` in `backend/worker.js` with the SDK call for your chosen service.

### Access

| Portal | URL | Credentials |
|--------|-----|-------------|
| **Consumer** | http://localhost:3500 | No login required |
| **Admin** | http://localhost:3500/admin/login | admin@zaneco.ph / admin123 |

## Project Structure

```
ZANECO-Appointments-System/
├── frontend/              # Vue 3 + Vite SPA
│   ├── Dockerfile         # Dev container (port 3500, hot-reload)
│   ├── vite.config.js     # Vite config with API proxy
│   └── src/
│       ├── api/           # Axios API client modules
│       ├── components/    # Shared + page-specific components
│       ├── layouts/       # Consumer and admin layout shells
│       ├── pages/         # Consumer portal + admin dashboard pages
│       ├── stores/        # Pinia state management
│       ├── router/        # Vue Router with auth guards
│       ├── composables/   # useToast, useClock
│       ├── utils/         # Formatters, validators
│       └── assets/        # CSS variables + global styles
├── backend/               # Express + PostgreSQL (Prisma) API
│   ├── Dockerfile         # Dev container (port 8000, --watch)
│   ├── config.js          # Environment config loader
│   ├── server.js          # Express app entry point
│   ├── worker.js          # Notification + reminder queue
│   ├── services/          # Business logic services
│   │   ├── pdfGenerator.js # PDF report generation (pdfmake)
│   │   └── emailService.js # Email via Nodemailer
│   ├── routes/            # Auth, appointments, offices, reports, etc.
│   ├── middleware/        # Auth, errors, logger, rate limiting
│   └── db/                # Database adapter (Prisma Client)
│   ├── prisma/            # Schema, seed, migrations (Prisma)
├── docker-compose.yml     # Three services: postgres + backend + frontend
├── .dockerignore
├── AGENTS.md              # Agent/contributor guide
└── docs/                  # System design, API spec, ERD, wireframes
```

## Documentation

Full documentation is available in the `docs/` directory:

- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) — Complete system design (19 sections)
- [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md) — Full REST API with request/response examples
- [`docs/ERD.md`](docs/ERD.md) — Entity Relationship Diagram and index strategy
- [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) — UI/UX wireframes for all pages
- [`docs/QUICK_REFERENCE.md`](docs/QUICK_REFERENCE.md) — At-a-glance system summary

## Features

### Consumer Portal
- Book appointments (5-step wizard: info → concern → office → schedule → review)
- View appointment details by reference number
- Reschedule or cancel appointments (mobile-verified)
- SMS/email confirmation

### Admin Dashboard
- Dashboard with stats cards, weekly chart, recent appointments with inline actions
- Full appointment management (confirm, complete, cancel, no-show, archive, delete)
- Office management with toggle switches, schedule editor, slot generation
- Concern type CRUD
- Admin user management (super admin only)
- Calendar view with daily breakdown
- Report generation with PDF and CSV export (with office/concern type filters)
- Notification log with resend
- Audit trail viewer
- Dark mode toggle

## Production Deployment

### 1. Server Setup

Recommended: Ubuntu 22.04+ with Nginx + Let's Encrypt SSL.

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install nodejs nginx

# Install pnpm
npm install -g pnpm pm2
```

### 2. Deploy

```bash
# Replace with your actual deployment repository URL
git clone <your-repo-url> /var/www/zaneco
cd /var/www/zaneco
pnpm install
pnpm run seed

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values
```

### 3. Environment Variables (`backend/.env`)

```env
NODE_ENV=production
PORT=8000
JWT_SECRET=<generate a random 64-char string>
CORS_ORIGIN=https://appointments.zaneco.ph
DATABASE_URL=postgresql://zaneco:secret@localhost:5432/zaneco_appointments
# Add your notification provider keys here
```

### 4. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name appointments.zaneco.ph;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name appointments.zaneco.ph;

    ssl_certificate /etc/letsencrypt/live/appointments.zaneco.ph/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appointments.zaneco.ph/privkey.pem;

    root /var/www/zaneco/frontend/dist;
    index index.html;

    # SPA — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5. PM2 Process Manager

```bash
cd /var/www/zaneco/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### 6. SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d appointments.zaneco.ph
```

### 7. Database Backups

Add this cron job (`crontab -e`):

```cron
# Daily database backup at 2 AM
0 2 * * * pg_dump -U zaneco -d zaneco_appointments | gzip > /var/backups/zaneco/zaneco-$(date +\%Y\%m\%d).sql.gz
# Keep 30 days
0 3 * * * find /var/backups/zaneco/ -name "*.sql.gz" -mtime +30 -delete
```

### 8. Monitoring

```bash
pm2 monit                    # Real-time metrics
pm2 logs zaneco-api          # Tail logs
# Or view logs via /api/v1/health endpoint + request_logs table
```

## Changelog / Bug Fix History

### June 2026 — Major Bug Fix Pass

The following critical and high-severity bugs were identified during a comprehensive codebase audit and fixed:

**Database & Schema**
- `createdAt`/`updatedAt` fields changed from `String @default("now()")` to `DateTime @default(now())` / `@updatedAt` across all 9 models — auto-updates now work, string-based date comparisons no longer produce wrong results
- Added `onDelete: Restrict|SetNull` on all relation fields to prevent foreign key violation crashes
- Added missing indexes on foreign key columns (`concernTypeId`, `processedBy`, `Administrator.officeId`)
- `Administrator.refreshToken` marked `@unique` to prevent token collisions
- Seed admin accounts now reference the actual `MainOffice.id` instead of hardcoded `1`
- Seed time slots no longer span the lunch break (fixed `11:30-13:00` → correct 30-min slots), and the last hour (`16:30-17:00`) is now generated

**Backend Routes**
- Reference number generation LIKE pattern fixed (`"ZNC" + y + m + "%"` instead of `y + m + "%"`) — every booking after the first no longer fails with a unique constraint violation
- Slot capacity check moved inside interactive `$transaction` — TOCTOU race condition eliminated (was allowing oversubscription)
- Auto-generated time slots now respect `OfficeSchedule` and office `openingTime`/`closingTime` instead of hardcoded `08:00-17:00` with lunch at 12:00
- Admin status changes no longer double-decrement `bookedCount` on terminal→terminal transitions
- Admin reschedule now checks new slot capacity before incrementing
- Refresh token rotation implemented on `/auth/refresh` (stolen tokens now expire after use)
- Dynamic `import('uuid')` replaced with `crypto.randomUUID()` (synchronous, better performance)
- `req.params` in `reports.js` renamed to `req.queryParams` to avoid overwriting Express route params
- LEFT JOIN queries in reports fixed (`WHERE a.office_id = $N` → `(a.office_id = $N OR a.office_id IS NULL)`) to prevent implicit INNER JOIN
- 200ms constant-time delay added to forgot-password flow to prevent email enumeration timing attack
- Schedule entries validation added in `adminOffices.js`

**Backend Middleware & Services**
- `middleware/auth.js`: Converted from `.then().catch()` dangling promise chain to `async/await`; added `lockedUntil` check; improved error messages
- `middleware/rateLimitBooking.js`: Wrapped with `asyncHandler` — a database error no longer crashes the server
- `services/pdfGenerator.js`: Module-scope `fs.readFileSync` wrapped in try/catch — missing `logo_combined.b64` no longer crashes server startup
- `services/emailService.js`: Logo attachment is now conditional (`fs.existsSync`) — missing logo file no longer kills all email sending
- `worker.js`: Notification queue changed from fire-and-forget `.then()` to sequential `await` — dangling promises and unhandled rejections eliminated; notifications with `retryCount >= 3` are now marked `failed` (not stuck in `retrying` forever)

**Backend Server**
- Dashboard summary route now applies `officeFilter` for non-`super_admin` roles — no more data leakage to staff
- Converted to `asyncHandler` pattern (consistent with rest of codebase)

**Frontend Core**
- 401 interceptor only clears admin token for admin API requests, not consumer endpoints
- Role-based route guard added — staff users can no longer access super_admin routes via direct URL
- `AppointmentsPage`: Pagination range now shows correct range, `perPage` selector actually works, tab counts reflect total (not current page), stale race conditions in date watchers eliminated
- `AppointmentDetail`: `saveNotes()` has proper error handling; unsaved notes no longer sent with status changes; fetch failures show error state instead of blank page
- `LoginPage`: Uses `router.push` instead of `window.location.replace` (no full page reload)
- `OfficesPage`: Standardized `active`/`is_active` naming; removed silent fallback data on API failure
- All consumer pages: Silent mock-data fallbacks removed — users now see proper error messages when the backend is unavailable
- `CancelAppointment`: Fixed missing `data` argument in API call
- `BookingConfirmation`: Stepper now shows correct 5-step flow matching the booking wizard

**Config & Deployment**
- `CORS_ORIGIN` default changed from `5173` to `3500` (was blocking production requests)
- `JWT_SECRET` now has a `required()` guard — missing secret fails early and loudly
- `docker-compose.yml`: Added `restart: unless-stopped` to all services; PostgreSQL host port changed to `5433`
- `.dockerignore`: `assets` pattern prefixed with `/` to prevent excluding `frontend/src/assets/`
- `start.sh`: Added trap handler for background process cleanup
- `start.bat`: Added `call` before pnpm exec commands
- `scripts/setup-db.sh`: Input validation added for SQL injection prevention

## License

Proprietary — ZANECO
