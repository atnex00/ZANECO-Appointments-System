#!/usr/bin/env bash
set -euo pipefail

# ZANECO Appointments — PostgreSQL setup script
# Creates the role and database expected by DATABASE_URL in backend/.env
# Requires: PostgreSQL installed, `psql` accessible, postgres role available via peer auth.

DB_NAME="${DB_NAME:-zaneco_appointments}"
DB_USER="${DB_USER:-zaneco}"
DB_PASS="${DB_PASS:-secret}"

USER_REGEX='^[a-zA-Z0-9_]+$'
PASS_REGEX='^[a-zA-Z0-9_!@#$%^&*()]+$'
if [[ ! "$DB_USER" =~ $USER_REGEX ]]; then echo "Invalid DB_USER"; exit 1; fi
if [[ ! "$DB_PASS" =~ $PASS_REGEX ]]; then echo "Invalid DB_PASS contains unsafe chars"; exit 1; fi

echo "Setting up PostgreSQL role and database..."

# Create role if it doesn't exist
psql -U postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  && echo "Role '${DB_USER}' already exists" \
  || {
    psql -U postgres -c "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';"
    echo "Created role '${DB_USER}'"
  }

# Create database if it doesn't exist
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  && echo "Database '${DB_NAME}' already exists" \
  || {
    psql -U postgres -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
    echo "Created database '${DB_NAME}'"
  }

# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
psql -U postgres -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};" 2>/dev/null || true

echo "PostgreSQL setup complete."
