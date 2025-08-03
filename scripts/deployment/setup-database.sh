#!/bin/bash

echo "🚀 Setting up database for Barkly Research Platform"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your database credentials"
    exit 1
fi

echo "📊 Running Prisma migrations..."
npx prisma db push

echo ""
echo "🔍 Checking pgvector extension..."
npx prisma db execute --sql "CREATE EXTENSION IF NOT EXISTS vector;" || echo "Note: pgvector extension may need manual setup"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify the database connection in Vercel"
echo "2. Upload a test document at /admin"
echo "3. Check processing at /research"