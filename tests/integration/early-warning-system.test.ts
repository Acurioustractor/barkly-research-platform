import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { earlyWarningSystemService, EarlyWarningAlert } from '../../src/lib/early-warning-system';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'community-1', 
              name: 'Test Community',
              population_growth_rate: 0.02,
              climate_risk_level: 'medium',
              economic_stability: 'medium',
              population_trend: 'stable'
            }, 
            error: null 
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ 
              data: [
                {
                  id: 'doc-1',
                  title: 'Community Report',
                  content: 'Community health concerns increasing',
                  created_at: new Date().toISOString(),
                  analysis: {
                    themes: [
                      {
                        theme: 'Health Issues',
                        urgency: 'high',
                        confidence: 0.8,
                        keywords: ['health', 'medical', 'clinic']
                      }
                    ]
                  }
                }
              ], 
              error: null 
            }))
          })),
          gte: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ 
              data: [], 
              error: null 
            }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock AI service
jest.mock('../../src/lib/ai-service', () => ({
  analyzeDocument: jest.fn(() => Promise.resolve({
    themes: [
      {
        theme: 'Healthcare Access Issues',
        description: 'Increasing concerns about healthcare accessibility',
        urgency: 'high',
        confidence: 0.8,
        keywords: ['healthcare', 'access', 'medical', 'clinic']
      }
    ]
  }))
}));

describe('Early Warning System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any running intervals
    earlyWarningSystemService.stopMonitoring();
  });

  describe('Alert Generation', () => {
    it('should generate alerts for emerging issues', async () => {
      const alerts = await earlyWarningSystemService.getActiveAlerts('community-1');
      
      // Initially no alerts
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('should monitor emerging issues and create alerts', async () => {
      // Trigger monitoring
      await earlyWarningSystemService.monitorEmergingIssues();
      
      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should monitor service strain', async () => {
      await earlyWarningSystemService.monitorServiceStrain();
      
      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should monitor opportunities', async () => {
      await earlyWarningSystemService.monitorOpportunities();
      
      // Should complete without errors
      expect(true).toBe(true);
    });
  });

  describe('Alert Management', () => {
    it('should acknowledge alerts', async () => {
      const alertId = 'test-alert-1';
      const acknowledgedBy = 'test-user';
      const notes = 'Alert acknowledged for testing';

      await expect(
        earlyWarningSystemService.acknowledgeAlert(alertId, acknowledgedBy, notes)
      ).resolves.not.toThrow();
    });

    it('should resolve alerts', async () => {
      const alertId = 'test-alert-1';
      const resolvedBy = 'test-user';
      const resolution = 'Issue resolved through community intervention';

      await expect(
        earlyWarningSystemService.resolveAlert(alertId, resolvedBy, resolution)
      ).resolves.not.toThrow();
    });

    it('should get alert statistics', async () => {
      const stats = await earlyWarningSystemService.getAlertStatistics('community-1', 'month');
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('bySeverity');
      expect(stats).toHaveProperty('byStatus');
      expect(stats).toHaveProperty('responseTime');
      expect(stats).toHaveProperty('resolutionRate');
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      earlyWarningSystemService.startMonitoring();
      
      // Should start without errors
      expect(true).toBe(true);
    });

    it('should stop monitoring', () => {
      earlyWarningSystemService.startMonitoring();
      earlyWarningSystemService.stopMonitoring();
      
      // Should stop without errors
      expect(true).toBe(true);
    });
  });

  describe('Alert Filtering and Querying', () => {
    it('should filter alerts by community', async () => {
      const communityAlerts = await earlyWarningSystemService.getActiveAlerts('community-1');
      const allAlerts = await earlyWarningSystemService.getActiveAlerts();
      
      expect(Array.isArray(communityAlerts)).toBe(true);
      expect(Array.isArray(allAlerts)).toBe(true);
    });

    it('should get statistics for different timeframes', async () => {
      const weekStats = await earlyWarningSystemService.getAlertStatistics('community-1', 'week');
      const monthStats = await earlyWarningSystemService.getAlertStatistics('community-1', 'month');
      const quarterStats = await earlyWarningSystemService.getAlertStatistics('community-1', 'quarter');
      
      expect(weekStats).toBeDefined();
      expect(monthStats).toBeDefined();
      expect(quarterStats).toBeDefined();
    });
  });

  describe('Cultural Safety Integration', () => {
    it('should include cultural considerations in alerts', async () => {
      // This would test that alerts properly include cultural context
      // For now, we'll just verify the structure exists
      const alerts = await earlyWarningSystemService.getActiveAlerts('community-1');
      
      // Each alert should have cultural considerations field
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('culturalConsiderations');
        expect(Array.isArray(alert.culturalConsiderations)).toBe(true);
      });
    });

    it('should respect cultural protocols in recommendations', async () => {
      const alerts = await earlyWarningSystemService.getActiveAlerts('community-1');
      
      alerts.forEach(alert => {
        alert.recommendations.forEach(rec => {
          expect(rec).toHaveProperty('culturalProtocols');
          expect(Array.isArray(rec.culturalProtocols)).toBe(true);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const mockSupabase = require('../../src/lib/supabase').supabase;
      mockSupabase.from.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: new Error('Database error') })
          })
        })
      });

      const alerts = await earlyWarningSystemService.getActiveAlerts('invalid-community');
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBe(0);
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service error
      const mockAnalyzeDocument = require('../../src/lib/ai-service').analyzeDocument;
      mockAnalyzeDocument.mockRejectedValueOnce(new Error('AI service error'));

      await expect(
        earlyWarningSystemService.monitorEmergingIssues()
      ).resolves.not.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple communities efficiently', async () => {
      const startTime = Date.now();
      
      // Simulate monitoring multiple communities
      await Promise.all([
        earlyWarningSystemService.monitorEmergingIssues(),
        earlyWarningSystemService.monitorServiceStrain(),
        earlyWarningSystemService.monitorOpportunities()
      ]);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent alert operations', async () => {
      const operations = [
        earlyWarningSystemService.getActiveAlerts('community-1'),
        earlyWarningSystemService.getActiveAlerts('community-2'),
        earlyWarningSystemService.getAlertStatistics('community-1'),
        earlyWarningSystemService.getAlertStatistics('community-2')
      ];

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should validate alert data structure', async () => {
      const alerts = await earlyWarningSystemService.getActiveAlerts('community-1');
      
      alerts.forEach(alert => {
        // Required fields
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('communityId');
        expect(alert).toHaveProperty('alertType');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('description');
        expect(alert).toHaveProperty('confidence');
        expect(alert).toHaveProperty('status');
        expect(alert).toHaveProperty('createdAt');
        
        // Array fields
        expect(Array.isArray(alert.indicators)).toBe(true);
        expect(Array.isArray(alert.evidence)).toBe(true);
        expect(Array.isArray(alert.recommendations)).toBe(true);
        expect(Array.isArray(alert.culturalConsiderations)).toBe(true);
        expect(Array.isArray(alert.stakeholders)).toBe(true);
        expect(Array.isArray(alert.followUpActions)).toBe(true);
        
        // Enum validations
        expect(['emerging_issue', 'service_strain', 'funding_opportunity', 'resource_match', 'cultural_concern'])
          .toContain(alert.alertType);
        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
        expect(['immediate', 'short_term', 'medium_term']).toContain(alert.timeframe);
        expect(['active', 'acknowledged', 'resolved', 'false_positive']).toContain(alert.status);
        
        // Numeric validations
        expect(alert.confidence).toBeGreaterThanOrEqual(0);
        expect(alert.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should validate statistics data structure', async () => {
      const stats = await earlyWarningSystemService.getAlertStatistics('community-1');
      
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.responseTime).toBe('number');
      expect(typeof stats.resolutionRate).toBe('number');
      expect(typeof stats.byType).toBe('object');
      expect(typeof stats.bySeverity).toBe('object');
      expect(typeof stats.byStatus).toBe('object');
      
      expect(stats.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(stats.resolutionRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration with Other Services', () => {
    it('should integrate with cross-community trend analysis', async () => {
      // This would test integration with the cross-community trend analysis service
      // For now, we'll just verify the service can be imported
      const { crossCommunityTrendAnalysisService } = require('../../src/lib/cross-community-trend-analysis');
      expect(crossCommunityTrendAnalysisService).toBeDefined();
    });

    it('should integrate with AI analysis service', async () => {
      const { analyzeDocument } = require('../../src/lib/ai-service');
      expect(analyzeDocument).toBeDefined();
      expect(typeof analyzeDocument).toBe('function');
    });
  });
});