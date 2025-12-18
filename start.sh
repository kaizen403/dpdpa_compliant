#!/bin/bash

# DataVault Development Startup Script

echo "🔐 Starting DataVault - DPDPA Compliant Personal Data Locker"
echo "============================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker first."
    exit 1
fi

# Start PostgreSQL
echo "📦 Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing root dependencies..."
    npm install
fi

if [ ! -d "fe/node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    cd fe && npm install && cd ..
fi

if [ ! -d "be/node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    cd be && npm install && cd ..
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd be && npx prisma generate && cd ..

# Run migrations
echo "🗄️  Running database migrations..."
cd be && npx prisma migrate dev --name init && cd ..

# Seed database (optional)
read -p "🌱 Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd be && npx prisma db seed && cd ..
fi

# Start the application
echo ""
echo "🚀 Starting application..."
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo ""
npm run dev
