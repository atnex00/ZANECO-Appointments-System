# ZANECO Consumer Appointment Scheduling System

Web-based appointment scheduling platform for Zamboanga del Norte Electric Cooperative (ZANECO) customer service offices.

## Overview

Consumers can schedule appointments online at any of five ZANECO service offices for billing clarifications and account concerns. The system manages time slots, sends SMS/email notifications, and provides administrators with full appointment lifecycle management and reporting tools.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vue 3 + Vite (pnpm workspace) |
| **Backend** | Node.js + Express |
| **Database** | SQLite (sql.js) |
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

```bash
# Enable pnpm (one-time per machine)
corepack enable

# Install all dependencies (frontend + backend)
pnpm install

# Seed the database
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
# Build and start both services
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
├── backend/               # Express + SQLite API
│   ├── Dockerfile         # Dev container (port 8000, --watch)
│   ├── config.js          # Environment config loader
│   ├── server.js          # Express app entry point
│   ├── worker.js          # Notification + reminder queue
│   ├── services/          # Business logic services
│   │   └── pdfGenerator.js # PDF report generation (pdfmake)
│   ├── routes/            # Auth, appointments, offices, reports, etc.
│   ├── middleware/        # Auth, errors, logger, rate limiting
│   └── db/                # Schema, seed, database adapter (sql.js)
├── docker-compose.yml     # Two services: frontend + backend
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
git clone https://github.com/zaneco/appointments-system.git /var/www/zaneco
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
DB_PATH=./data/zaneco.db
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
pm2 start server.js --name zaneco-api -i 2
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
0 2 * * * cp /var/www/zaneco/backend/data/zaneco.db /var/backups/zaneco/zaneco-$(date +\%Y\%m\%d).db
# Keep 30 days
0 3 * * * find /var/backups/zaneco/ -name "*.db" -mtime +30 -delete
```

### 8. Monitoring

```bash
pm2 monit                    # Real-time metrics
pm2 logs zaneco-api          # Tail logs
# Or view logs via /api/v1/health endpoint + request_logs table
```

## License

Proprietary — ZANECO
