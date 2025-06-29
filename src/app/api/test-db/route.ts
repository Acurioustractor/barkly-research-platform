import { NextResponse } from 'next/server';
import { prisma, isDatabaseAvailable, getAvailableEnvVars } from '@/lib/database-safe';

export async function GET() {
  try {
    const envVars = getAvailableEnvVars();
    const dbAvailable = isDatabaseAvailable();
    
    // Try to make a simple database query if available
    let dbTest = null;
    let dbError = null;
    
    if (dbAvailable && prisma) {
      try {
        // Try a simple query to test the connection
        await prisma.$queryRaw`SELECT 1`;
        dbTest = 'Database query successful';
      } catch (error) {
        dbError = error instanceof Error ? error.message : 'Unknown database error';
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        available: dbAvailable,
        envVars,
        connectionTest: dbTest,
        error: dbError
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: Boolean(process.env.VERCEL),
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}