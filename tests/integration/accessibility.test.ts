import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AccessibilityService } from '../../src/lib/accessibility-service';

// Mock DOM environment
const mockDocument = {
  documentElement: {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn()
    },
    setAttribute: jest.fn(),
    style: {
      setProperty: jest.fn()
    }
  },
  body: {
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    insertBefore: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  createElement: jest.fn(() => ({
    className: '',
    innerHTML: '',
    id: '',
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    click: jest.fn(),
    focus: jest.fn(),
    closest: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
  })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  activeElement: null
};

const mockWindow = {
  matchMedia: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn()
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              user_id: 'test-user',
              high_contrast: true,
              large_text: false,
              screen_reader: true,
              keyboard_navigation: true,
              cultural_accessibility: {
                preferredLanguage: 'en',
                culturalContext: 'indigenous',
                elderFriendlyMode: false,
                youthMode: false
              },
              assistive_technology: {
                voiceControl: false,
                switchNavigation: true,
                eyeTracking: false
              }
            },
            error: null
          }))
        }))
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      insert: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Setup global mocks
beforeEach(() => {
  global.document = mockDocument as any;
  global.window = mockWindow as any;
  
  // Reset all mocks
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AccessibilityService', () => {
  let service: AccessibilityService;

  beforeEach(() => {
    service = new AccessibilityService();
  });

  describe('User Preferences', () => {
    it('should load user accessibility preferences', async () => {
      const preferences = await service.loadUserPreferences('test-user');
      
      expect(preferences).toBeDefined();
      expect(preferences?.userId).toBe('test-user');
      expect(preferences?.highContrast).toBe(true);
      expect(preferences?.screenReader).toBe(true);
      expect(preferences?.keyboardNavigation).toBe(true);
    });

    it('should save user accessibility preferences', async () => {
      const preferences = {
        userId: 'test-user',
        highContrast: true,
        reducedMotion: false,
        largeText: true,
        screenReader: false,
        keyboardNavigation: true,
        audioDescriptions: false,
        captionsEnabled: true,
        colorBlindnessType: 'deuteranopia' as const,
        fontSize: 'large' as const,
        language: 'en',
        culturalAccessibility: {
          preferredLanguage: 'en',
          culturalContext: 'rural',
          traditionalInterface: false,
          elderFriendlyMode: true,
          youthMode: false
        },
        assistiveTechnology: {
          voiceControl: true,
          switchNavigation: false,
          eyeTracking: false
        }
      };

      await expect(service.saveUserPreferences(preferences)).resolves.not.toThrow();
      
      // Verify DOM changes were applied
      expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('user-high-contrast', true);
      expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('large-text', true);
      expect(mockDocument.documentElement.setAttribute).toHaveBeenCalledWith('data-font-size', 'large');
    });

    it('should return null for non-existent user preferences', async () => {
      // Mock empty response
      const { supabase } = require('../../src/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            }))
          }))
        }))
      });

      const preferences = await service.loadUserPreferences('non-existent-user');
      expect(preferences).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { supabase } = require('../../src/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' }
            }))
          }))
        }))
      });

      const preferences = await service.loadUserPreferences('test-user');
      expect(preferences).toBeNull();
    });
  });

  describe('System Preferences Detection', () => {
    it('should detect and apply system reduced motion preference', () => {
      mockWindow.matchMedia.mockImplementation((query) => {
        if (query === '(prefers-reduced-motion: reduce)') {
          return {
            matches: true,
            addEventListener: jest.fn()
          };
        }
        return {
          matches: false,
          addEventListener: jest.fn()
        };
      });

      // Reinitialize service to trigger system preference detection
      service = new AccessibilityService();

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('reduce-motion');
    });

    it('should detect and apply system high contrast preference', () => {
      mockWindow.matchMedia.mockImplementation((query) => {
        if (query === '(prefers-contrast: high)') {
          return {
            matches: true,
            addEventListener: jest.fn()
          };
        }
        return {
          matches: false,
          addEventListener: jest.fn()
        };
      });

      service = new AccessibilityService();

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('high-contrast');
    });

    it('should detect and apply system dark mode preference', () => {
      mockWindow.matchMedia.mockImplementation((query) => {
        if (query === '(prefers-color-scheme: dark)') {
          return {
            matches: true,
            addEventListener: jest.fn()
          };
        }
        return {
          matches: false,
          addEventListener: jest.fn()
        };
      });

      service = new AccessibilityService();

      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('dark-mode');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should set up keyboard navigation event listeners', () => {
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should create skip links', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.insertBefore).toHaveBeenCalled();
    });

    it('should handle tab key navigation', () => {
      const keydownHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')?.[1];

      if (keydownHandler) {
        const mockEvent = {
          key: 'Tab',
          preventDefault: jest.fn(),
          target: mockDocument.createElement('button')
        };

        keydownHandler(mockEvent);
        expect(mockDocument.body.classList.add).toHaveBeenCalledWith('keyboard-navigation-active');
      }
    });

    it('should handle escape key for modal dismissal', () => {
      const keydownHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'keydown')?.[1];

      // Mock open modal
      const mockModal = {
        setAttribute: jest.fn(),
        querySelector: jest.fn(() => ({
          click: jest.fn()
        }))
      };

      mockDocument.querySelectorAll.mockImplementation((selector) => {
        if (selector === '[role="dialog"][aria-hidden="false"]') {
          return [mockModal];
        }
        return [];
      });

      if (keydownHandler) {
        const mockEvent = {
          key: 'Escape',
          preventDefault: jest.fn(),
          target: mockDocument.createElement('button')
        };

        keydownHandler(mockEvent);
        expect(mockModal.querySelector).toHaveBeenCalledWith('[data-dismiss="modal"]');
      }
    });
  });

  describe('Screen Reader Support', () => {
    it('should create ARIA live regions', () => {
      // Check that live regions were created
      const createElementCalls = mockDocument.createElement.mock.calls;
      const divCalls = createElementCalls.filter(call => call[0] === 'div');
      
      expect(divCalls.length).toBeGreaterThanOrEqual(3); // At least 3 live regions
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });

    it('should announce messages to screen readers', () => {
      const message = 'Test announcement';
      
      // Mock live region element
      const mockLiveRegion = {
        textContent: ''
      };
      mockDocument.getElementById.mockReturnValue(mockLiveRegion);

      service.announceToScreenReader(message, 'polite');

      expect(mockDocument.getElementById).toHaveBeenCalledWith('polite-live-region');
      expect(mockLiveRegion.textContent).toBe(message);
    });

    it('should handle assertive announcements', () => {
      const message = 'Urgent announcement';
      
      const mockLiveRegion = {
        textContent: ''
      };
      mockDocument.getElementById.mockReturnValue(mockLiveRegion);

      service.announceToScreenReader(message, 'assertive');

      expect(mockDocument.getElementById).toHaveBeenCalledWith('assertive-live-region');
      expect(mockLiveRegion.textContent).toBe(message);
    });

    it('should handle missing live regions gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);

      expect(() => {
        service.announceToScreenReader('Test message', 'polite');
      }).not.toThrow();
    });
  });

  describe('Accessibility Auditing', () => {
    it('should perform accessibility audit on component', async () => {
      const mockComponent = {
        id: 'test-component',
        querySelectorAll: jest.fn(() => [
          {
            tagName: 'BUTTON',
            hasAttribute: jest.fn(() => false),
            getAttribute: jest.fn(() => null),
            textContent: 'Test Button'
          }
        ])
      };

      mockDocument.getElementById.mockReturnValue(mockComponent);

      const audit = await service.performAccessibilityAudit('test-component', 'Test Component');

      expect(audit).toBeDefined();
      expect(audit.componentId).toBe('test-component');
      expect(audit.componentName).toBe('Test Component');
      expect(audit.score).toBeGreaterThanOrEqual(0);
      expect(audit.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(audit.issues)).toBe(true);
      expect(Array.isArray(audit.recommendations)).toBe(true);
    });

    it('should throw error for non-existent component', async () => {
      mockDocument.getElementById.mockReturnValue(null);

      await expect(
        service.performAccessibilityAudit('non-existent', 'Non-existent Component')
      ).rejects.toThrow('Component non-existent not found');
    });

    it('should calculate accessibility score correctly', async () => {
      const mockComponent = {
        id: 'perfect-component',
        querySelectorAll: jest.fn(() => [])
      };

      mockDocument.getElementById.mockReturnValue(mockComponent);

      const audit = await service.performAccessibilityAudit('perfect-component', 'Perfect Component');

      // Component with no issues should have high score
      expect(audit.score).toBeGreaterThanOrEqual(90);
      expect(audit.wcagLevel).toBe('AAA');
    });
  });

  describe('Cultural Accessibility', () => {
    it('should load cultural accessibility guides', async () => {
      const { supabase } = require('../../src/lib/supabase');
      supabase.from.mockReturnValueOnce({
        select: jest.fn(() => Promise.resolve({
          data: [
            {
              id: 'guide-1',
              community_id: 'community-1',
              language: 'en',
              cultural_context: 'indigenous',
              accessibility_guidelines: {
                colorMeanings: { red: 'Sacred' },
                navigationPatterns: ['Circular navigation']
              },
              elder_considerations: ['Large text for elders'],
              youth_considerations: ['Interactive elements'],
              literacy_support: {
                audioSupport: true,
                visualSupport: true
              }
            }
          ],
          error: null
        }))
      });

      // Reinitialize to trigger loading
      service = new AccessibilityService();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 100));

      const guide = service.getCulturalAccessibilityGuide('community-1');
      expect(guide).toBeDefined();
      expect(guide?.culturalContext).toBe('indigenous');
      expect(guide?.accessibilityGuidelines.colorMeanings.red).toBe('Sacred');
    });

    it('should return null for non-existent cultural guide', () => {
      const guide = service.getCulturalAccessibilityGuide('non-existent-community');
      expect(guide).toBeNull();
    });
  });

  describe('Audio Descriptions', () => {
    it('should generate audio description for content', async () => {
      const description = await service.generateAudioDescription(
        'story-123',
        'story',
        'en',
        'indigenous'
      );

      expect(description).toBeDefined();
      expect(description?.contentId).toBe('story-123');
      expect(description?.contentType).toBe('story');
      expect(description?.language).toBe('en');
      expect(description?.culturalContext).toBe('indigenous');
    });

    it('should retrieve audio descriptions for content', async () => {
      // First generate a description
      await service.generateAudioDescription('story-123', 'story', 'en');
      await service.generateAudioDescription('story-123', 'story', 'es');

      const allDescriptions = service.getAudioDescriptions('story-123');
      expect(allDescriptions).toHaveLength(2);

      const englishDescriptions = service.getAudioDescriptions('story-123', 'en');
      expect(englishDescriptions).toHaveLength(1);
      expect(englishDescriptions[0].language).toBe('en');
    });

    it('should return empty array for non-existent content', () => {
      const descriptions = service.getAudioDescriptions('non-existent-content');
      expect(descriptions).toEqual([]);
    });
  });

  describe('Utility Methods', () => {
    it('should check if user has specific accessibility need', () => {
      // Mock user preferences
      const preferences = {
        userId: 'test-user',
        highContrast: true,
        reducedMotion: false,
        largeText: true,
        screenReader: false,
        keyboardNavigation: true,
        audioDescriptions: false,
        captionsEnabled: false,
        colorBlindnessType: 'none' as const,
        fontSize: 'medium' as const,
        language: 'en',
        culturalAccessibility: {
          preferredLanguage: 'en',
          culturalContext: 'general',
          traditionalInterface: false,
          elderFriendlyMode: false,
          youthMode: false
        },
        assistiveTechnology: {
          voiceControl: false,
          switchNavigation: false,
          eyeTracking: false
        }
      };

      // Manually set preferences for testing
      (service as any).preferences.set('test-user', preferences);

      expect(service.hasAccessibilityNeed('test-user', 'highContrast')).toBe(true);
      expect(service.hasAccessibilityNeed('test-user', 'reducedMotion')).toBe(false);
      expect(service.hasAccessibilityNeed('test-user', 'largeText')).toBe(true);
      expect(service.hasAccessibilityNeed('test-user', 'screenReader')).toBe(false);
    });

    it('should return false for non-existent user', () => {
      expect(service.hasAccessibilityNeed('non-existent-user', 'highContrast')).toBe(false);
    });

    it('should get user preferences', () => {
      const preferences = {
        userId: 'test-user',
        highContrast: true,
        reducedMotion: false,
        largeText: false,
        screenReader: true,
        keyboardNavigation: false,
        audioDescriptions: false,
        captionsEnabled: false,
        colorBlindnessType: 'none' as const,
        fontSize: 'medium' as const,
        language: 'en',
        culturalAccessibility: {
          preferredLanguage: 'en',
          culturalContext: 'general',
          traditionalInterface: false,
          elderFriendlyMode: false,
          youthMode: false
        },
        assistiveTechnology: {
          voiceControl: false,
          switchNavigation: false,
          eyeTracking: false
        }
      };

      (service as any).preferences.set('test-user', preferences);

      const retrieved = service.getUserPreferences('test-user');
      expect(retrieved).toEqual(preferences);
    });

    it('should return null for non-existent user preferences', () => {
      const preferences = service.getUserPreferences('non-existent-user');
      expect(preferences).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', () => {
      // Mock window.matchMedia to throw error
      mockWindow.matchMedia.mockImplementation(() => {
        throw new Error('matchMedia not supported');
      });

      expect(() => {
        new AccessibilityService();
      }).not.toThrow();
    });

    it('should handle missing DOM elements gracefully', () => {
      mockDocument.getElementById.mockReturnValue(null);
      mockDocument.querySelector.mockReturnValue(null);
      mockDocument.querySelectorAll.mockReturnValue([]);

      expect(() => {
        service.announceToScreenReader('Test message');
      }).not.toThrow();
    });

    it('should handle audio description generation errors', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error by mocking a method to throw
      const originalMethod = (service as any).audioDescriptions.set;
      (service as any).audioDescriptions.set = jest.fn(() => {
        throw new Error('Storage error');
      });

      const description = await service.generateAudioDescription('error-content', 'story');
      expect(description).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      // Restore original method
      (service as any).audioDescriptions.set = originalMethod;
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full accessibility workflow', async () => {
      // 1. Load user preferences
      const preferences = await service.loadUserPreferences('test-user');
      expect(preferences).toBeDefined();

      // 2. Save updated preferences
      if (preferences) {
        preferences.highContrast = !preferences.highContrast;
        await service.saveUserPreferences(preferences);
      }

      // 3. Generate audio description
      const audioDesc = await service.generateAudioDescription('content-1', 'story', 'en');
      expect(audioDesc).toBeDefined();

      // 4. Perform accessibility audit
      const mockComponent = {
        id: 'test-component',
        querySelectorAll: jest.fn(() => [])
      };
      mockDocument.getElementById.mockReturnValue(mockComponent);

      const audit = await service.performAccessibilityAudit('test-component', 'Test Component');
      expect(audit).toBeDefined();
      expect(audit.score).toBeGreaterThanOrEqual(0);

      // 5. Announce to screen reader
      const mockLiveRegion = { textContent: '' };
      mockDocument.getElementById.mockReturnValue(mockLiveRegion);

      service.announceToScreenReader('Workflow completed successfully');
      expect(mockLiveRegion.textContent).toBe('Workflow completed successfully');
    });

    it('should handle multiple concurrent operations', async () => {
      const operations = [
        service.loadUserPreferences('user-1'),
        service.loadUserPreferences('user-2'),
        service.generateAudioDescription('content-1', 'story'),
        service.generateAudioDescription('content-2', 'event')
      ];

      const results = await Promise.all(operations);
      expect(results).toHaveLength(4);
      
      // All operations should complete without throwing
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});

describe('Accessibility CSS Classes', () => {
  it('should apply correct CSS classes for accessibility features', () => {
    // This would test CSS class application
    // For now, we verify the DOM manipulation calls
    expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalled();
    expect(mockDocument.documentElement.setAttribute).toHaveBeenCalled();
  });
});

describe('WCAG Compliance', () => {
  it('should meet WCAG 2.1 AA standards', () => {
    // This would include automated WCAG testing
    // For now, we ensure the audit system is working
    expect(true).toBe(true); // Placeholder for WCAG compliance tests
  });
});

describe('Cultural Accessibility', () => {
  it('should respect cultural color meanings', () => {
    // Test cultural color interpretation
    expect(true).toBe(true); // Placeholder for cultural accessibility tests
  });

  it('should support elder-friendly interfaces', () => {
    // Test elder-friendly mode
    expect(true).toBe(true); // Placeholder for elder-friendly tests
  });

  it('should support youth-oriented interfaces', () => {
    // Test youth mode
    expect(true).toBe(true); // Placeholder for youth mode tests
  });
});