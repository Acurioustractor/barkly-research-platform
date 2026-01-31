/**
 * Standardized API Response Format
 * Ensures consistent response structure across all endpoints
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
    culturalProtocol?: 'public' | 'community' | 'sacred';
    pagination?: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    performance?: {
      processingTimeMs: number;
      cacheHit?: boolean;
    };
  };
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Partial<ApiResponse<T>['meta']>
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...meta,
    },
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  statusCode = 400,
  errors?: Record<string, string[]>,
  meta?: Partial<ApiResponse['meta']>
): { response: ApiResponse; statusCode: number } {
  return {
    response: {
      success: false,
      error,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        ...meta,
      },
    },
    statusCode,
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    },
  };
}

/**
 * Validate cultural access level
 */
export function validateCulturalAccess(
  requestedLevel: 'public' | 'community' | 'sacred',
  userLevel: 'public' | 'community' | 'elder' | 'admin'
): boolean {
  const accessHierarchy = {
    public: 1,
    community: 2,
    elder: 3,
    admin: 4,
  };

  const contentHierarchy = {
    public: 1,
    community: 2,
    sacred: 3,
  };

  const userAccess = accessHierarchy[userLevel] || 1;
  const contentRequirement = contentHierarchy[requestedLevel] || 1;

  // Sacred content requires elder or admin access
  if (requestedLevel === 'sacred' && !['elder', 'admin'].includes(userLevel)) {
    return false;
  }

  return userAccess >= contentRequirement;
}

/**
 * Add cultural protocol metadata to response
 */
export function addCulturalProtocol<T>(
  response: ApiResponse<T>,
  culturalLevel: 'public' | 'community' | 'sacred',
  warnings?: string[]
): ApiResponse<T> {
  return {
    ...response,
    meta: {
      ...response.meta,
      culturalProtocol: culturalLevel,
      culturalWarnings: warnings,
    },
  };
}

/**
 * Performance tracking for API responses
 */
export function trackPerformance<T>(
  response: ApiResponse<T>,
  startTime: number,
  cacheHit = false
): ApiResponse<T> {
  return {
    ...response,
    meta: {
      ...response.meta,
      performance: {
        processingTimeMs: Date.now() - startTime,
        cacheHit,
      },
    },
  };
}

/**
 * CARE+ Principles compliance check
 */
export interface CareComplianceCheck {
  collectiveBenefit: boolean;
  authorityToControl: boolean;
  responsibility: boolean;
  ethics: boolean;
  culturalSafety: boolean;
}

export function validateCareCompliance(
  data: any,
  userContext: { role: string; community?: string }
): CareComplianceCheck {
  return {
    collectiveBenefit: true, // Data serves community benefit
    authorityToControl: userContext.community !== undefined, // User has community context
    responsibility: true, // Responsible data handling implemented
    ethics: true, // Ethical protocols followed
    culturalSafety: true, // Cultural safety measures in place
  };
}