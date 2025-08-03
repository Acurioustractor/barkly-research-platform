#!/bin/bash

# For migrations, we need to use the direct connection (not pooled)
# Get the direct connection URL from Supabase dashboard
echo "🔄 Running database migrations..."
echo "Using direct connection for migrations..."

# You'll need to replace [YOUR-PASSWORD] with your actual password
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xnifhejavwvbdkcakakn.supabase.co:5432/postgres" npx prisma migrate deploy

echo "✅ Migrations complete!"