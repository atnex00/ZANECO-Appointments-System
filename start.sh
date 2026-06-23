#!/usr/bin/env bash
set -e

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js 18+ is required but not found."
    echo "Download from: https://nodejs.org"
    exit 1
fi

# Enable corepack (built-in pnpm; npm install -g corepack for Node 25+)
if ! corepack enable 2>/dev/null; then
    echo "corepack not bundled — installing via npm..."
    npm install -g corepack || { echo "Failed. Try: npm install -g pnpm"; exit 1; }
    corepack enable
fi

# Install dependencies if needed
if [ ! -d "node_modules/.pnpm" ]; then
    echo "Installing dependencies..."
    pnpm install
fi

# Seed database if empty
if [ ! -f "backend/data/zaneco.db" ]; then
    echo "Seeding database..."
    pnpm run seed
fi

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
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
