#!/bin/bash

# 🎸 MyBand Development Server Builder
# This script builds comprehensive development setup instructions

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          🎸 MyBand - Development Environment Setup            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Detect OS
OS_TYPE=$(uname)
if [ "$OS_TYPE" == "Darwin" ]; then
    OPEN_CMD="open"
elif [ "$OS_TYPE" == "Linux" ]; then
    OPEN_CMD="xdg-open"
else
    OPEN_CMD="start"
fi

echo "📋 SETUP CHECKLIST"
echo "===================="
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION"
else
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm $NPM_VERSION"
else
    echo "❌ npm is not installed"
    exit 1
fi

# Check for PostgreSQL or Docker
if command -v psql &> /dev/null; then
    POSTGRES_VERSION=$(psql --version)
    echo "✅ PostgreSQL installed: $POSTGRES_VERSION"
elif command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker installed: $DOCKER_VERSION"
else
    echo "⚠️  Neither PostgreSQL nor Docker detected"
    echo "   🔗 Install PostgreSQL: https://postgresql.org"
    echo "   🔗 Install Docker: https://docker.com"
fi

echo ""
echo "📦 DEPENDENCIES CHECKLIST"
echo "========================="
echo ""

# Check if node_modules exist
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed (node_modules exists)"
else
    echo "❌ Dependencies not installed"
    echo ""
    echo "   To install, run: npm install"
    exit 1
fi

echo ""
echo "🗄️  DATABASE SETUP"
echo "==================="
echo ""

# Check database configuration
if [ -f "apps/api/.env" ]; then
    DB_URL=$(grep "^DATABASE_URL" apps/api/.env | cut -d '=' -f 2-)
    if [ -z "$DB_URL" ]; then
        echo "⚠️  DATABASE_URL not set in apps/api/.env"
        echo "   Example: postgresql://user:password@localhost:5432/myband"
    else
        echo "✅ DATABASE_URL configured in .env"
    fi
else
    echo "⚠️  apps/api/.env not found"
    echo "   Run: cp apps/api/.env.example apps/api/.env"
    echo "   Then edit DATABASE_URL in apps/api/.env"
fi

echo ""
echo "🚀 READY TO START"
echo "=================="
echo ""

if [ "$1" == "start" ]; then
    echo "Starting MyBand development environment..."
    echo ""
    echo "📡 API Server (Backend) - http://localhost:3001"
    echo "🎨 Web App (Frontend) - http://localhost:3000"
    echo ""
    echo "Opening in browser..."
    $OPEN_CMD "http://localhost:3000" 2>/dev/null || true
    
    echo ""
    echo "🔄 Running development servers (Press Ctrl+C to stop)..."
    echo ""
    
    npm run dev --workspaces
else
    cat << 'EOF'

NEXT STEPS:

1️⃣  Setup Database (first time only):
    cd apps/api
    npm run db:push
    (This creates tables from Prisma schema)

2️⃣  Start Development Servers:
    npm run dev

    This will start:
    - Backend API on http://localhost:3001
    - Frontend on http://localhost:3000

3️⃣  Open in Browser:
    Visit http://localhost:3000 in your browser

4️⃣  Try It Out:
    ➜ Create an account on registration page
    ➜ Create a band
    ➜ Upload content (PDFs, images)
    ➜ Create a setlist
    ➜ Drag and drop to reorder songs

📚 USEFUL COMMANDS:

# View database
npm run db:studio --workspace=@myband/api

# Run database migrations
npm run db:migrate --workspace=@myband/api

# Seed database with test data
npm run db:seed --workspace=@myband/api

# Lint code
npm run lint --workspaces

# Build for production
npm run build --workspaces

🆘 TROUBLESHOOTING:

If port 3000 is in use:
  npx kill-port 3000
  
If port 3001 is in use:
  npx kill-port 3001

If dependencies are broken:
  rm -rf node_modules package-lock.json
  npm install

🔗 DOCUMENTATION:

- README.md - Project overview
- SETUP.md - Installation guide
- DEVELOPMENT.md - Architecture & patterns
- API_REFERENCE.md - Backend API endpoints
- FRONTEND_README.md - Frontend setup guide
- PROJECT_SUMMARY.md - Quick reference

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ready to start? Run: ./start-dev.sh start

Or manually:
  npm run dev

Happy coding! 🎸✨

EOF
fi
