import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check for various Supabase/Vercel Postgres environment variable patterns
const getDatabaseUrl = () => {
  // Skip SQLite URLs in production
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
  
  if (isProduction && process.env.DATABASE_URL?.startsWith('file:')) {
    console.warn('[database-safe] Ignoring SQLite URL in production');
    // Don't use SQLite in production
  }
  
  // Use POSTGRES_PRISMA_URL first as it's available in your Vercel deployment
  const url = process.env.POSTGRES_PRISMA_URL || // Vercel Postgres (recommended for Prisma)
              process.env.POSTGRES_URL || 
              process.env.DATABASE_URL || 
              process.env.POSTGRES_URL_NON_POOLING ||
              process.env.SUPABASE_URL;
  
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
    console.log('[database-safe] Checking for database URL:', {
      hasUrl: Boolean(url),
      urlLength: url?.length || 0,
      isProduction,
      envVars: {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
        POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
        POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING),
        SUPABASE_URL: Boolean(process.env.SUPABASE_URL)
      }
    });
  }
  
  return url;
}

const databaseUrl = getDatabaseUrl();

// Set DATABASE_URL if not present but other URLs are available
if (!process.env.DATABASE_URL && databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

// Only create Prisma client if DATABASE_URL exists
export const prisma = databaseUrl 
  ? (globalForPrisma.prisma ?? new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    }))
  : null

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma
}

// Helper function to check if database is available
export const isDatabaseAvailable = () => Boolean(databaseUrl && prisma)

// Debug helper to see what env vars are available
export const getAvailableEnvVars = () => {
  if (typeof window !== 'undefined') return {}; // Don't expose on client
  
  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
    POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING),
    detectedUrl: Boolean(databaseUrl)
  };
}