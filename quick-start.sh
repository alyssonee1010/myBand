#!/bin/bash

# 🎸 MyBand Quick Start Script
# This script sets up and runs the entire project

set -e

echo "🎸 MyBand - Quick Start"
echo "======================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required. Install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js $(node --version)"
echo ""

# Check for Docker or PostgreSQL
if ! command -v docker &> /dev/null && ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not detected."
    echo "   Install Docker: https://docker.com"
    echo "   Or PostgreSQL: https://postgresql.org"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Install dependencies
echo "📥 Installing dependencies..."
npm install
echo ""

# Step 2: Setup environment files
echo "📝 Setting up environment files..."
if [ ! -f apps/api/.env ]; then
    cp apps/api/.env.example apps/api/.env
    echo "   Created apps/api/.env"
fi

if [ ! -f apps/web/.env.local ]; then
    cp apps/web/.env.example apps/web/.env.local
    echo "   Created apps/web/.env.local"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "==========="
echo ""
echo "1️⃣  Start PostgreSQL:"
echo "   Option A (Docker):"
echo "   docker run --name myband-postgres \\\\"
echo "     -e POSTGRES_PASSWORD=postgres \\\\"
echo "     -e POSTGRES_DB=myband_dev \\\\"
echo "     -p 5432:5432 -d postgres:15"
echo ""
echo "   Option B (Local PostgreSQL):"
echo "   createdb myband_dev"
echo ""
echo "2️⃣  Create database schema:"
echo "   npm run db:push --workspace=@myband/api"
echo ""
echo "3️⃣  Start development servers (open 2 terminals):"
echo "   Terminal 1:"
echo "   npm run dev --workspace=@myband/api"
echo ""
echo "   Terminal 2:"
echo "   npm run dev --workspace=@myband/web"
echo ""
echo "4️⃣  Open browser: http://localhost:3000"
echo ""
echo "For help: Read README.md, SETUP.md, or DEVELOPMENT.md"
