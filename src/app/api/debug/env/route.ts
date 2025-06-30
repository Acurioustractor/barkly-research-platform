import { NextResponse } from 'next/server';
import { getAvailableEnvVars } from '@/lib/database-safe';

export async function GET() {
  try {
    const envVars = getAvailableEnvVars();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
      vercelEnv: process.env.VERCEL_ENV,
      envVars,
      // Show first few chars of actual URLs if they exist (for debugging)
      urlPreview: {
        DATABASE_URL: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'not set',
        POSTGRES_URL: process.env.POSTGRES_URL?.substring(0, 20) + '...' || 'not set',
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL?.substring(0, 20) + '...' || 'not set',
        POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING?.substring(0, 20) + '...' || 'not set',
        SUPABASE_URL: process.env.SUPABASE_URL?.substring(0, 20) + '...' || 'not set',
      },
      // Additional Supabase-specific vars
      supabaseVars: {
        SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
        SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
        SUPABASE_SERVICE_KEY: Boolean(process.env.SUPABASE_SERVICE_KEY),
        NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get environment info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}