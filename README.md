# ZANECO Consumer Appointment Scheduling System

Web-based appointment scheduling platform for Zamboanga del Norte Electric Cooperative (ZANECO) customer service offices.

## Overview

Consumers can schedule appointments online at any of five ZANECO service offices for billing clarifications and account concerns. The system manages time slots, sends SMS/email confirmations, and provides administrators with full appointment lifecycle management and reporting tools.

## Features

- **Consumer Portal**: Book, view, reschedule, and cancel appointments
- **Admin Dashboard**: Manage appointments, offices, schedules, and users
- **Notifications**: SMS and email confirmations, reminders, and alerts
- **Reports**: Generate and export appointment analytics to PDF/Excel
- **Multi-Office**: 5 office locations with independent scheduling

## Offices

| Office | Location |
|--------|----------|
| Main Office | Poblacion, Dipolog City |
| Sindangan Area Services | Sindangan, Zamboanga del Norte |
| Liloy Area Services | Liloy, Zamboanga del Norte |
| Piñan Area Services | Piñan, Zamboanga del Norte |
| Dipolog Area Services | Minaog, Dipolog City, Zamboanga del Norte |

## Tech Stack (Recommended)

- **Backend**: Laravel 11.x (PHP 8.2+)
- **Frontend**: Vue.js 3 + PrimeVue
- **Database**: PostgreSQL 15+
- **Cache/Queue**: Redis 7+
- **Notifications**: Twilio (SMS), AWS SES (Email)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/atnex00/zaneco-appointments-sys.git
cd appointments-system

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate --seed

# Run development servers
php artisan serve
npm run dev
```

## Documentation

Full documentation is available in the `docs/` directory:

- [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) - Complete system design including requirements, architecture, API specs, and database schema
- [`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md) - Complete REST API specification with request/response examples
- [`docs/ERD.md`](docs/ERD.md) - Entity Relationship Diagram and index strategy
- [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) - UI/UX wireframes for consumer portal and admin dashboard
- [`docs/QUICK_REFERENCE.md`](docs/QUICK_REFERENCE.md) - At-a-glance summary of the entire system
- `database/migrations/` - SQL migration files
- `database/seeders/` - Seed data scripts

## License

Proprietary - ZANECO
