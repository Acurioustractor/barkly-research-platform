/**
 * Authentication Middleware for API Routes
 * Validates JWT tokens and user sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface AuthResult {
  authenticated: boolean;
  user?: any;
  error?: string;
}

/**
 * Validate authentication for API routes
 */
export async function validateAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[AUTH] Session validation error:', error);
      return {
        authenticated: false,
        error: 'Authentication validation failed'
      };
    }

    if (!session || !session.user) {
      return {
        authenticated: false,
        error: 'Not authenticated'
      };
    }

    // Check if session is expired
    if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
      return {
        authenticated: false,
        error: 'Session expired'
      };
    }

    return {
      authenticated: true,
      user: session.user
    };

  } catch (error) {
    console.error('[AUTH] Authentication validation error:', error);
    return {
      authenticated: false,
      error: 'Authentication validation failed'
    };
  }
}

/**
 * Check if user has required role/permission
 */
export function hasPermission(user: any, requiredRole: string): boolean {
  if (!user?.user_metadata?.role && !user?.app_metadata?.role) {
    return false;
  }

  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  
  // Define role hierarchy
  const roleHierarchy = {
    'super_admin': 5,
    'admin': 4,
    'community_leader': 3,
    'community_member': 2,
    'public': 1
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
}

/**
 * Create authentication response for unauthorized access
 */
export function createUnauthorizedResponse(message = 'Authentication required'): NextResponse {
  return NextResponse.json(
    { error: message },
    { 
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer',
      }
    }
  );
}

/**
 * Create forbidden response for insufficient permissions
 */
export function createForbiddenResponse(message = 'Insufficient permissions'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Middleware wrapper for protected API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: any) => Promise<NextResponse>,
  options: { requiredRole?: string } = {}
) {
  return async (request: NextRequest) => {
    const authResult = await validateAuth(request);

    if (!authResult.authenticated) {
      return createUnauthorizedResponse(authResult.error);
    }

    // Check role permissions if required
    if (options.requiredRole && !hasPermission(authResult.user, options.requiredRole)) {
      return createForbiddenResponse('Insufficient permissions for this operation');
    }

    // Call the original handler with authenticated user
    return handler(request, authResult.user);
  };
}

/**
 * Extract user ID from authenticated request
 */
export function getUserId(user: any): string | null {
  return user?.id || null;
}

/**
 * Get user role from authenticated user
 */
export function getUserRole(user: any): string {
  return user?.user_metadata?.role || user?.app_metadata?.role || 'public';
}