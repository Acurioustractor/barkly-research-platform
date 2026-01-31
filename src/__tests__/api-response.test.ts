/**
 * Tests for Standardized API Response Format
 */

import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  validateCulturalAccess,
  addCulturalProtocol,
  trackPerformance,
  validateCareCompliance
} from '@/lib/utils/api-response';

describe('API Response Standardization', () => {
  describe('Success Response Creation', () => {
    it('should create a properly formatted success response', () => {
      const data = { id: 1, name: 'Test Document' };
      const message = 'Document retrieved successfully';
      const response = createSuccessResponse(data, message);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.message).toBe(message);
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.version).toBe('1.0');
    });

    it('should include custom metadata', () => {
      const data = { documents: [] };
      const meta = {
        culturalProtocol: 'community' as const,
        requestId: 'req_123'
      };
      
      const response = createSuccessResponse(data, undefined, meta);
      
      expect(response.meta?.culturalProtocol).toBe('community');
      expect(response.meta?.requestId).toBe('req_123');
    });
  });

  describe('Error Response Creation', () => {
    it('should create a properly formatted error response', () => {
      const error = 'Document not found';
      const statusCode = 404;
      const { response, statusCode: returnedStatusCode } = createErrorResponse(error, statusCode);

      expect(response.success).toBe(false);
      expect(response.error).toBe(error);
      expect(returnedStatusCode).toBe(statusCode);
      expect(response.meta?.timestamp).toBeDefined();
    });

    it('should include validation errors', () => {
      const error = 'Validation failed';
      const errors = {
        title: ['Title is required'],
        content: ['Content cannot be empty']
      };
      
      const { response } = createErrorResponse(error, 400, errors);
      
      expect(response.errors).toEqual(errors);
    });

    it('should default to 400 status code', () => {
      const { statusCode } = createErrorResponse('Bad request');
      expect(statusCode).toBe(400);
    });
  });

  describe('Paginated Response Creation', () => {
    it('should create a properly formatted paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const total = 10;
      const page = 1;
      const limit = 3;
      
      const response = createPaginatedResponse(data, total, page, limit);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta?.pagination).toEqual({
        page,
        limit,
        total,
        hasMore: true
      });
    });

    it('should correctly calculate hasMore for last page', () => {
      const data = [{ id: 8 }, { id: 9 }, { id: 10 }];
      const total = 10;
      const page = 4;
      const limit = 3;
      
      const response = createPaginatedResponse(data, total, page, limit);
      
      expect(response.meta?.pagination?.hasMore).toBe(false);
    });
  });

  describe('Cultural Access Validation', () => {
    it('should allow public access to public content', () => {
      const result = validateCulturalAccess('public', 'public');
      expect(result).toBe(true);
    });

    it('should allow community members to access community content', () => {
      const result = validateCulturalAccess('community', 'community');
      expect(result).toBe(true);
    });

    it('should prevent public users from accessing community content', () => {
      const result = validateCulturalAccess('community', 'public');
      expect(result).toBe(false);
    });

    it('should require elder access for sacred content', () => {
      expect(validateCulturalAccess('sacred', 'public')).toBe(false);
      expect(validateCulturalAccess('sacred', 'community')).toBe(false);
      expect(validateCulturalAccess('sacred', 'elder')).toBe(true);
      expect(validateCulturalAccess('sacred', 'admin')).toBe(true);
    });

    it('should respect access hierarchy', () => {
      expect(validateCulturalAccess('public', 'elder')).toBe(true);
      expect(validateCulturalAccess('community', 'elder')).toBe(true);
      expect(validateCulturalAccess('public', 'admin')).toBe(true);
      expect(validateCulturalAccess('community', 'admin')).toBe(true);
    });
  });

  describe('Cultural Protocol Enhancement', () => {
    it('should add cultural protocol metadata to response', () => {
      const baseResponse = createSuccessResponse({ data: 'test' });
      const warnings = ['This content requires cultural sensitivity'];
      
      const enhanced = addCulturalProtocol(baseResponse, 'community', warnings);
      
      expect(enhanced.meta?.culturalProtocol).toBe('community');
      expect(enhanced.meta?.culturalWarnings).toEqual(warnings);
    });

    it('should preserve existing metadata when adding cultural protocol', () => {
      const baseResponse = createSuccessResponse({ data: 'test' }, undefined, {
        requestId: 'req_123'
      });
      
      const enhanced = addCulturalProtocol(baseResponse, 'sacred');
      
      expect(enhanced.meta?.requestId).toBe('req_123');
      expect(enhanced.meta?.culturalProtocol).toBe('sacred');
    });
  });

  describe('Performance Tracking', () => {
    it('should add performance metrics to response', () => {
      const startTime = Date.now() - 1000; // 1 second ago
      const baseResponse = createSuccessResponse({ data: 'test' });
      
      const tracked = trackPerformance(baseResponse, startTime, false);
      
      expect(tracked.meta?.performance?.processingTimeMs).toBeGreaterThan(900);
      expect(tracked.meta?.performance?.processingTimeMs).toBeLessThan(1100);
      expect(tracked.meta?.performance?.cacheHit).toBe(false);
    });

    it('should track cache hits', () => {
      const startTime = Date.now() - 100;
      const baseResponse = createSuccessResponse({ data: 'cached' });
      
      const tracked = trackPerformance(baseResponse, startTime, true);
      
      expect(tracked.meta?.performance?.cacheHit).toBe(true);
      expect(tracked.meta?.performance?.processingTimeMs).toBeLessThan(200);
    });
  });

  describe('CARE+ Compliance Validation', () => {
    it('should validate collective benefit requirement', () => {
      const data = { purpose: 'community development' };
      const userContext = { role: 'community_member', community: 'Tennant Creek' };
      
      const compliance = validateCareCompliance(data, userContext);
      
      expect(compliance.collectiveBenefit).toBe(true);
    });

    it('should validate authority to control', () => {
      const data = { culturalSensitivity: 'community' };
      const userContext = { role: 'community_member', community: 'Tennant Creek' };
      
      const compliance = validateCareCompliance(data, userContext);
      
      expect(compliance.authorityToControl).toBe(true);
    });

    it('should require community context for authority validation', () => {
      const data = { culturalSensitivity: 'community' };
      const userContext = { role: 'public' };
      
      const compliance = validateCareCompliance(data, userContext);
      
      expect(compliance.authorityToControl).toBe(false);
    });

    it('should validate responsibility principle', () => {
      const data = { dataGovernance: 'documented' };
      const userContext = { role: 'researcher', community: 'Tennant Creek' };
      
      const compliance = validateCareCompliance(data, userContext);
      
      expect(compliance.responsibility).toBe(true);
    });

    it('should validate ethics principle', () => {
      const data = { purpose: 'community benefit', harmAssessment: 'completed' };
      const userContext = { role: 'community_leader', community: 'Tennant Creek' };
      
      const compliance = validateCareCompliance(data, userContext);
      
      expect(compliance.ethics).toBe(true);
    });

    it('should validate cultural safety', () => {
      const data = { culturalProtocols: 'implemented', elderApproval: true };
      const userContext = { role: 'elder', community: 'Tennant Creek' };
      
      const compliance = validateCareCompliance(data, userContext);
      
      expect(compliance.culturalSafety).toBe(true);
    });
  });

  describe('Response Integration', () => {
    it('should create a fully compliant Indigenous data response', () => {
      const startTime = Date.now() - 500;
      const data = { 
        story: 'Community success story',
        culturalSensitivity: 'community',
        elderApproval: true
      };
      
      let response = createSuccessResponse(data, 'Story retrieved successfully');
      response = addCulturalProtocol(response, 'community', ['Community members only']);
      response = trackPerformance(response, startTime, false);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(response.meta?.culturalProtocol).toBe('community');
      expect(response.meta?.culturalWarnings).toContain('Community members only');
      expect(response.meta?.performance?.processingTimeMs).toBeDefined();
      expect(response.meta?.timestamp).toBeDefined();
      expect(response.meta?.version).toBe('1.0');
    });
  });
});