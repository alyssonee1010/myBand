#!/bin/bash

echo "🎸 MyBand Setup"
echo "==============="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# Install root dependencies
echo ""
echo "📥 Installing root dependencies..."
npm install

# Setup API
echo ""
echo "🔧 Setting up API..."
cd apps/api

# Create .env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file in apps/api. Please update DATABASE_URL with your PostgreSQL connection"
fi

# Setup Web
cd ../web

# Create .env file
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "📝 Created .env.local file in apps/web"
fi

cd ../..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Update DATABASE_URL in apps/api/.env with your PostgreSQL connection string"
echo "   - postgresql://user:password@localhost:5432/myband_dev"
echo ""
echo "2. Run Prisma migrations to create the database:"
echo "   npm run db:push --workspace=@myband/api"
echo ""
echo "3. Start development servers:"
echo "   Terminal 1: npm run dev --workspace=@myband/api"
echo "   Terminal 2: npm run dev --workspace=@myband/web"
echo ""
echo "4. Open http://localhost:3000 in your browser"
