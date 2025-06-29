import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check for various Supabase environment variable patterns
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || 
              process.env.POSTGRES_URL || 
              process.env.SUPABASE_URL ||
              process.env.POSTGRES_PRISMA_URL ||
              process.env.POSTGRES_URL_NON_POOLING;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[database-safe] Checking for database URL:', {
      hasUrl: Boolean(url),
      urlLength: url?.length || 0,
      envVars: {
        DATABASE_URL: Boolean(process.env.DATABASE_URL),
        POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
        POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL)
      }
    });
  }
  
  return url;
}

const databaseUrl = getDatabaseUrl();

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