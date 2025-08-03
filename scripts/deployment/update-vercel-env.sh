#!/bin/bash

echo "Updating DATABASE_URL in Vercel..."

# Remove existing
vercel env rm DATABASE_URL production --yes
vercel env rm DATABASE_URL preview --yes  
vercel env rm DATABASE_URL development --yes

# Add new
echo "postgresql://postgres.xnifhejavwvbdkcakakn:4yudLcwvPKdgoYmK@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true" | vercel env add DATABASE_URL production
echo "postgresql://postgres.xnifhejavwvbdkcakakn:4yudLcwvPKdgoYmK@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true" | vercel env add DATABASE_URL preview
echo "postgresql://postgres.xnifhejavwvbdkcakakn:4yudLcwvPKdgoYmK@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true" | vercel env add DATABASE_URL development

echo "✅ DATABASE_URL updated in all environments!"