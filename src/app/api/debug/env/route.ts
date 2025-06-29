import { NextResponse } from 'next/server';
import { getAvailableEnvVars } from '@/lib/database-safe';

export async function GET() {
  try {
    const envVars = getAvailableEnvVars();
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
      envVars,
      // Show first few chars of actual URLs if they exist (for debugging)
      urlPreview: {
        DATABASE_URL: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'not set',
        POSTGRES_URL: process.env.POSTGRES_URL?.substring(0, 20) + '...' || 'not set',
        POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL?.substring(0, 20) + '...' || 'not set',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get environment info', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}