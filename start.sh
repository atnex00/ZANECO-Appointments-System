#!/usr/bin/env bash
set -e

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js 18+ is required but not found."
    echo "Download from: https://nodejs.org"
    exit 1
fi

# Ensure pnpm is available
if ! command -v pnpm &> /dev/null; then
    # Try corepack (built-in pnpm on Node <25, or installable via npm)
    if ! corepack enable 2>/dev/null; then
        echo "corepack not bundled — installing via npm..."
        # Global npm install may fail with EACCES; fall back to user-local prefix
        if ! npm install -g corepack 2>/dev/null; then
            echo "Global npm install needs root. Using user-local prefix instead..."
            npm config set prefix "$HOME/.npm-global"
            export PATH="$HOME/.npm-global/bin:$PATH"
            npm install -g corepack
        fi
        corepack enable
        hash -r 2>/dev/null || true
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules/.pnpm" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Create backend .env from example if missing
if [ ! -f "backend/.env" ] && [ -f "backend/.env.example" ]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from .env.example"
fi

# Generate Prisma client (re-run after dependency updates)
pnpm --filter zaneco-appointments-api exec prisma generate 2>/dev/null || true

# Ensure PostgreSQL role & database exist
scripts/setup-db.sh 2>/dev/null || echo "Warning: DB setup skipped (is PostgreSQL installed?)"

# Apply schema migrations & seed
echo "Fixing existing string timestamps before schema update..."
pnpm --filter zaneco-appointments-api exec node scripts/fix-timestamps.js 2>/dev/null || true
echo "Applying database schema..."
pnpm --filter zaneco-appointments-api exec prisma db push --accept-data-loss || echo "Warning: DB schema sync skipped"
pnpm run seed || echo "Warning: Seed skipped"

trap 'kill $BACKEND_PID $FRONTEND_PID 2>/dev/null' EXIT SIGINT SIGTERM

echo "Starting servers..."

# Start backend
pnpm run dev:backend &
BACKEND_PID=$!

# Start frontend
pnpm run dev:frontend &
FRONTEND_PID=$!

# Wait for servers
sleep 4

# Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3500
elif command -v open &> /dev/null; then
    open http://localhost:3500
fi

echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3500"
echo "Admin:   http://localhost:3500/admin/login"
echo "Network: http://$(hostname -I 2>/dev/null | awk '{print $1}'):3500"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
