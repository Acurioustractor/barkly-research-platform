import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  initializeProgressMonitoring,
  updateProgressIndicators,
  generateProgressReport,
  getCurrentProgressIndicators,
  getRecentAlerts,
  acknowledgeAlert,
  runAutomatedMonitoring,
  ProgressIndicator,
  ProgressAlert,
  ProgressReport,
  MonitoringConfiguration
} from '../../src/lib/automated-progress-monitoring';

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { name: 'Test Community' }, 
            error: null 
          })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ 
              data: [], 
              error: null 
            }))
          }))
        })),
        gte: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          }))
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ 
            data: [], 
            error: null 
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Mock other services
jest.mock('../../src/lib/community-health-service', () => ({
  getCommunityHealthIndicators: jest.fn(() => Promise.resolve({
    overallScore: 75,
    trend: 'improving'
  }))
}));

jest.mock('../../src/lib/needs-analysis-service', () => ({
  getCommunityNeeds: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../src/lib/service-gap-analysis', () => ({
  getServiceGaps: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../src/lib/success-pattern-service', () => ({
  getSuccessPatterns: jest.fn(() => Promise.resolve([]))
}));

jest.mock('../../src/lib/ai-service', () => ({
  analyzeDocument: jest.fn(() => Promise.resolve({
    analysis: JSON.stringify({
      improvements: ['Community engagement is strong'],
      concerns: ['Some areas need attention'],
      milestones: ['Progress monitoring established'],
      recommendations: ['Continue current initiatives']
    })
  }))
}));

describe('Automated Progress Monitoring', () => {
  const testCommunityId = 'test-community-123';
  const testConfiguration: Partial<MonitoringConfiguration> = {
    enabled: true,
    reportingFrequency: 'weekly',
    alertThresholds: {
      improvement: 10,
      decline: -5,
      critical: -15
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeProgressMonitoring', () => {
    it('should initialize monitoring with default configuration', async () => {
      await expect(
        initializeProgressMonitoring(testCommunityId, {})
      ).resolves.not.toThrow();
    });

    it('should initialize monitoring with custom configuration', async () => {
      await expect(
        initializeProgressMonitoring(testCommunityId, testConfiguration)
      ).resolves.not.toThrow();
    });

    it('should handle initialization errors gracefully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      supabase.from.mockReturnValueOnce({
        upsert: jest.fn(() => Promise.resolve({ 
          error: { message: 'Database error' } 
        }))
      });

      await expect(
        initializeProgressMonitoring(testCommunityId, testConfiguration)
      ).rejects.toThrow('Failed to initialize monitoring: Database error');
    });
  });

  describe('updateProgressIndicators', () => {
    it('should update progress indicators successfully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      // Mock configuration retrieval
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                configuration: {
                  enabled: true,
                  categories: {
                    health: { enabled: true, weight: 0.2 },
                    social: { enabled: true, weight: 0.15 },
                    cultural: { enabled: true, weight: 0.2 }
                  },
                  customIndicators: []
                }
              },
              error: null
            }))
          }))
        }))
      });

      // Mock data sources
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [
                  {
                    id: 'event-1',
                    event_type: 'ceremony',
                    current_attendees: 50,
                    cultural_safety: 'restricted'
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      });

      const indicators = await updateProgressIndicators(testCommunityId);
      expect(Array.isArray(indicators)).toBe(true);
    });

    it('should return empty array when monitoring is disabled', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                configuration: { enabled: false }
              },
              error: null
            }))
          }))
        }))
      });

      const indicators = await updateProgressIndicators(testCommunityId);
      expect(indicators).toEqual([]);
    });

    it('should handle missing configuration', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: null
            }))
          }))
        }))
      });

      const indicators = await updateProgressIndicators(testCommunityId);
      expect(indicators).toEqual([]);
    });
  });

  describe('generateProgressReport', () => {
    it('should generate a comprehensive progress report', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      // Mock community data
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { name: 'Test Community' },
              error: null
            }))
          }))
        }))
      });

      // Mock indicators data
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 'health-overall-test',
                  category: 'health',
                  name: 'Overall Health Score',
                  current_value: 75,
                  trend: 'improving',
                  priority: 'high',
                  confidence: 0.9
                }
              ],
              error: null
            }))
          }))
        }))
      });

      // Mock alerts data
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [
                  {
                    id: 'alert-1',
                    type: 'improvement',
                    severity: 'info',
                    title: 'Health Score Improving',
                    acknowledged: false
                  }
                ],
                error: null
              }))
            }))
          }))
        }))
      });

      // Mock configuration
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                configuration: {
                  reportingFrequency: 'weekly',
                  categories: {
                    health: { enabled: true, weight: 0.2 }
                  }
                }
              },
              error: null
            }))
          }))
        }))
      });

      // Mock report save
      supabase.from.mockReturnValueOnce({
        upsert: jest.fn(() => Promise.resolve({ error: null }))
      });

      const report = await generateProgressReport(testCommunityId);
      
      expect(report).toBeDefined();
      expect(report.communityId).toBe(testCommunityId);
      expect(report.communityName).toBe('Test Community');
      expect(typeof report.overallScore).toBe('number');
      expect(report.overallTrend).toMatch(/^(improving|stable|declining)$/);
      expect(report.categoryScores).toBeDefined();
      expect(report.keyInsights).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should handle community not found error', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Not found' }
            }))
          }))
        }))
      });

      await expect(
        generateProgressReport(testCommunityId)
      ).rejects.toThrow('Community not found');
    });
  });

  describe('getCurrentProgressIndicators', () => {
    it('should retrieve current progress indicators', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      const mockIndicators = [
        {
          id: 'health-overall-test',
          category: 'health',
          name: 'Overall Health Score',
          description: 'Community health indicator',
          current_value: 75,
          unit: 'score',
          trend: 'improving',
          trend_strength: 'moderate',
          confidence: 0.9,
          last_updated: new Date().toISOString(),
          data_source: 'Health Service',
          frequency: 'weekly',
          priority: 'high',
          stakeholders: ['Health Coordinator'],
          related_indicators: []
        }
      ];

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: mockIndicators,
              error: null
            }))
          }))
        }))
      });

      const indicators = await getCurrentProgressIndicators(testCommunityId);
      
      expect(Array.isArray(indicators)).toBe(true);
      expect(indicators).toHaveLength(1);
      expect(indicators[0].id).toBe('health-overall-test');
      expect(indicators[0].category).toBe('health');
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database error' }
            }))
          }))
        }))
      });

      const indicators = await getCurrentProgressIndicators(testCommunityId);
      expect(indicators).toEqual([]);
    });
  });

  describe('getRecentAlerts', () => {
    it('should retrieve recent alerts for a community', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      const mockAlerts = [
        {
          id: 'alert-1',
          type: 'decline',
          severity: 'warning',
          title: 'Health Score Declining',
          description: 'Health score has declined by 5%',
          indicator_id: 'health-overall-test',
          indicator_name: 'Overall Health Score',
          current_value: 70,
          change_amount: -5,
          change_percentage: -6.7,
          detected_at: new Date().toISOString(),
          acknowledged: false,
          action_required: true,
          suggested_actions: ['Investigate causes'],
          stakeholders_to_notify: ['Health Coordinator'],
          cultural_considerations: [],
          related_alerts: []
        }
      ];

      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: mockAlerts,
                error: null
              }))
            }))
          }))
        }))
      });

      const alerts = await getRecentAlerts(testCommunityId, 30);
      
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('alert-1');
      expect(alerts[0].severity).toBe('warning');
    });

    it('should use default days parameter', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      });

      const alerts = await getRecentAlerts(testCommunityId);
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an alert successfully', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      });

      await expect(
        acknowledgeAlert('alert-1', 'test-user', 'Acknowledged via test')
      ).resolves.not.toThrow();
    });

    it('should handle acknowledgment errors', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ 
            error: { message: 'Update failed' } 
          }))
        }))
      });

      await expect(
        acknowledgeAlert('alert-1', 'test-user')
      ).rejects.toThrow('Failed to acknowledge alert: Update failed');
    });
  });

  describe('runAutomatedMonitoring', () => {
    it('should run automated monitoring for all enabled communities', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      // Mock enabled communities
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [
              {
                community_id: 'community-1',
                configuration: { enabled: true, reportingFrequency: 'weekly' }
              }
            ],
            error: null
          }))
        }))
      });

      // Mock other required calls for updateProgressIndicators
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { configuration: { enabled: false } },
              error: null
            })),
            order: jest.fn(() => ({
              limit: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        }))
      });

      await expect(runAutomatedMonitoring()).resolves.not.toThrow();
    });

    it('should handle no enabled communities', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      });

      await expect(runAutomatedMonitoring()).resolves.not.toThrow();
    });

    it('should continue processing other communities if one fails', async () => {
      const { supabase } = require('../../src/lib/supabase');
      
      // Mock enabled communities
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [
              {
                community_id: 'community-1',
                configuration: { enabled: true, reportingFrequency: 'weekly' }
              },
              {
                community_id: 'community-2',
                configuration: { enabled: true, reportingFrequency: 'weekly' }
              }
            ],
            error: null
          }))
        }))
      });

      // Mock configuration calls to fail for first community, succeed for second
      let callCount = 0;
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => {
              callCount++;
              if (callCount === 1) {
                return Promise.resolve({
                  data: null,
                  error: { message: 'Configuration error' }
                });
              }
              return Promise.resolve({
                data: { configuration: { enabled: false } },
                error: null
              });
            })
          }))
        }))
      });

      await expect(runAutomatedMonitoring()).resolves.not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full monitoring cycle', async () => {
      // This test would verify the complete flow:
      // 1. Initialize monitoring
      // 2. Update indicators
      // 3. Generate alerts
      // 4. Create report
      // 5. Acknowledge alerts

      const { supabase } = require('../../src/lib/supabase');
      
      // Mock all required database calls
      supabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { name: 'Test Community' },
              error: null
            })),
            order: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            })),
            gte: jest.fn(() => ({
              order: jest.fn(() => Promise.resolve({
                data: [],
                error: null
              }))
            }))
          }))
        })),
        upsert: jest.fn(() => Promise.resolve({ error: null })),
        insert: jest.fn(() => Promise.resolve({ error: null })),
        update: jest.fn(() => Promise.resolve({ error: null }))
      });

      // Initialize monitoring
      await initializeProgressMonitoring(testCommunityId, testConfiguration);

      // Update indicators (would normally create alerts)
      const indicators = await updateProgressIndicators(testCommunityId);

      // Generate report
      const report = await generateProgressReport(testCommunityId);

      expect(report).toBeDefined();
      expect(report.communityId).toBe(testCommunityId);
    });
  });
});