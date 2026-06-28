#!/usr/bin/env bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        MMIS — Material Management System             ║"
echo "║              Quick Start Setup                       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from https://nodejs.org"
    exit 1
fi
echo "✅ Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is required."
    exit 1
fi
echo "✅ npm $(npm -v)"

# Check PostgreSQL connection (optional — docker can be used)
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install
echo "✅ Backend dependencies installed"

echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo "✅ Frontend dependencies installed"

echo ""
echo "🗄️  Setting up database..."
cd ../backend

# Check if .env exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "⚠️  Created backend/.env from example."
    echo "    Please edit backend/.env with your database credentials, then re-run this script."
    exit 0
fi

echo "   Generating Prisma client..."
npx prisma generate

echo "   Running database migrations..."
npx prisma migrate dev --name init

echo "   Seeding demo data..."
npx ts-node prisma/seed.ts

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                   Setup Complete! ✅                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Start the backend:  cd backend && npm run dev"
echo "Start the frontend: cd frontend && npm run dev"
echo ""
echo "Open: http://localhost:3000"
echo ""
echo "Demo login credentials:"
echo "  Admin:          admin@mmis.com        / admin123"
echo "  Store Manager:  manager@mmis.com      / manager123"
echo "  Inv. Officer:   officer@mmis.com      / officer123"
echo "  Vendor:         vendor@techsupply.com / vendor123"
echo ""
