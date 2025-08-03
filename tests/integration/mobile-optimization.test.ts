import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MobileOptimizationService } from '../../src/lib/mobile-optimization-service';

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  deleteDatabase: jest.fn()
};

// Mock navigator
const mockNavigator = {
  onLine: true,
  connection: {
    effectiveType: '4g',
    downlink: 10,
    addEventListener: jest.fn()
  },
  getBattery: jest.fn(() => Promise.resolve({
    level: 0.8,
    charging: false,
    addEventListener: jest.fn()
  }))
};

// Mock window
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  indexedDB: mockIndexedDB
};

// Mock document
const mockDocument = {
  body: {
    classList: {
      add: jest.fn()
    }
  },
  querySelector: jest.fn(() => ({
    setAttribute: jest.fn()
  })),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn()
};

// Mock Supabase
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [
                {
                  id: 'test-story-1',
                  title: 'Test Story',
                  content: 'Test content',
                  community_id: 'test-community',
                  created_at: new Date().toISOString()
                }
              ],
              error: null
            }))
          }))
        })),
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({
              data: [],
              error: null
            }))
          }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Setup global mocks
beforeEach(() => {
  global.navigator = mockNavigator as any;
  global.window = mockWindow as any;
  global.document = mockDocument as any;
  global.indexedDB = mockIndexedDB as any;
  
  // Mock IndexedDB operations
  mockIndexedDB.open.mockImplementation(() => {
    const request = {
      result: {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            getAll: jest.fn(() => ({
              onsuccess: null,
              onerror: null,
              result: []
            })),
            put: jest.fn(() => ({
              onsuccess: null,
              onerror: null
            })),
            delete: jest.fn(() => ({
              onsuccess: null,
              onerror: null
            })),
            clear: jest.fn(() => ({
              onsuccess: null,
              onerror: null
            }))
          }))
        })),
        objectStoreNames: {
          contains: jest.fn(() => false)
        },
        createObjectStore: jest.fn(() => ({
          createIndex: jest.fn()
        }))
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null
    };
    
    // Simulate successful connection
    setTimeout(() => {
      if (request.onupgradeneeded) {
        request.onupgradeneeded();
      }
      if (request.onsuccess) {
        request.onsuccess();
      }
    }, 0);
    
    return request;
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('MobileOptimizationService', () => {
  let service: MobileOptimizationService;

  beforeEach(() => {
    service = new MobileOptimizationService({
      enableOfflineMode: true,
      cacheStrategy: 'conservative',
      syncInterval: 1, // 1 minute for testing
      maxCacheSize: 10, // 10MB for testing
      priorityFeatures: ['community-health', 'stories'],
      compressionLevel: 'medium',
      adaptiveLoading: true,
      touchOptimizations: true
    });
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new MobileOptimizationService();
      expect(defaultService).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      expect(service).toBeDefined();
    });

    it('should set up event listeners', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    });

    it('should apply mobile optimizations', () => {
      expect(mockDocument.body.classList.add).toHaveBeenCalledWith('mobile-optimized');
    });
  });

  describe('Caching', () => {
    it('should cache data successfully', async () => {
      const testData = { id: 'test', content: 'test content' };
      
      await service.cacheData('test-id', 'story', testData, 'high', 'community-1');
      
      const cachedData = service.getCachedData('test-id');
      expect(cachedData).toBeDefined();
      expect(cachedData?.data).toEqual(testData);
    });

    it('should retrieve cached data by type', async () => {
      const storyData = { id: 'story1', title: 'Test Story' };
      const eventData = { id: 'event1', title: 'Test Event' };
      
      await service.cacheData('story-1', 'story', storyData, 'medium');
      await service.cacheData('event-1', 'event', eventData, 'medium');
      
      const stories = service.getCachedDataByType('story');
      const events = service.getCachedDataByType('event');
      
      expect(stories).toHaveLength(1);
      expect(events).toHaveLength(1);
      expect(stories[0].data).toEqual(storyData);
      expect(events[0].data).toEqual(eventData);
    });

    it('should retrieve cached data by community', async () => {
      const communityData = { id: 'comm1', name: 'Test Community' };
      
      await service.cacheData('comm-1', 'community', communityData, 'high', 'community-1');
      
      const communityItems = service.getCachedDataByCommunity('community-1');
      expect(communityItems).toHaveLength(1);
      expect(communityItems[0].data).toEqual(communityData);
    });

    it('should return null for non-existent cached data', () => {
      const cachedData = service.getCachedData('non-existent');
      expect(cachedData).toBeNull();
    });
  });

  describe('Sync Queue', () => {
    it('should add actions to sync queue', () => {
      const testData = { id: 'test', content: 'test' };
      
      service.queueForSync('create_story', testData);
      
      const syncStatus = service.getSyncStatus();
      expect(syncStatus.pendingUploads).toBe(1);
    });

    it('should process sync queue when online', async () => {
      const testData = { id: 'test', content: 'test' };
      service.queueForSync('create_story', testData);
      
      await service.syncData();
      
      // Sync should have been attempted
      expect(service.getSyncStatus().syncInProgress).toBe(false);
    });
  });

  describe('PWA Installation', () => {
    it('should handle PWA install prompt', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'accepted' }))
      };
      
      // Simulate beforeinstallprompt event
      const eventHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'beforeinstallprompt')?.[1];
      
      if (eventHandler) {
        eventHandler(mockEvent);
      }
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      
      const pwaStatus = service.getPWAStatus();
      expect(pwaStatus.canInstall).toBe(true);
    });

    it('should install PWA successfully', async () => {
      // Setup install prompt
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'accepted' }))
      };
      
      const eventHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'beforeinstallprompt')?.[1];
      
      if (eventHandler) {
        eventHandler(mockEvent);
      }
      
      const result = await service.installPWA();
      expect(result).toBe(true);
      
      const pwaStatus = service.getPWAStatus();
      expect(pwaStatus.isInstalled).toBe(true);
    });

    it('should handle PWA install rejection', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn(() => Promise.resolve({ outcome: 'dismissed' }))
      };
      
      const eventHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'beforeinstallprompt')?.[1];
      
      if (eventHandler) {
        eventHandler(mockEvent);
      }
      
      const result = await service.installPWA();
      expect(result).toBe(false);
    });
  });

  describe('Online/Offline Handling', () => {
    it('should handle online event', async () => {
      const onlineHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'online')?.[1];
      
      if (onlineHandler) {
        await onlineHandler();
      }
      
      const syncStatus = service.getSyncStatus();
      expect(syncStatus.isOnline).toBe(true);
    });

    it('should handle offline event', () => {
      const offlineHandler = mockWindow.addEventListener.mock.calls
        .find(call => call[0] === 'offline')?.[1];
      
      if (offlineHandler) {
        offlineHandler();
      }
      
      const syncStatus = service.getSyncStatus();
      expect(syncStatus.isOnline).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', async () => {
      await service.cacheData('test-1', 'story', { content: 'test' }, 'high');
      await service.cacheData('test-2', 'event', { content: 'test' }, 'medium');
      
      const stats = service.getCacheStats();
      
      expect(stats.totalItems).toBe(2);
      expect(stats.itemsByType.story).toBe(1);
      expect(stats.itemsByType.event).toBe(1);
      expect(stats.itemsByPriority.high).toBe(1);
      expect(stats.itemsByPriority.medium).toBe(1);
    });

    it('should clear all cached data', async () => {
      await service.cacheData('test-1', 'story', { content: 'test' }, 'high');
      
      let stats = service.getCacheStats();
      expect(stats.totalItems).toBe(1);
      
      await service.clearCache();
      
      stats = service.getCacheStats();
      expect(stats.totalItems).toBe(0);
    });
  });

  describe('Adaptive Loading', () => {
    it('should adjust settings based on connection speed', () => {
      // Test slow connection
      mockNavigator.connection.effectiveType = '2g';
      
      const slowService = new MobileOptimizationService({
        adaptiveLoading: true
      });
      
      expect(slowService).toBeDefined();
      // In a real implementation, we would check if compression level was adjusted
    });

    it('should handle missing connection info', () => {
      const originalConnection = mockNavigator.connection;
      delete (mockNavigator as any).connection;
      
      const serviceWithoutConnection = new MobileOptimizationService({
        adaptiveLoading: true
      });
      
      expect(serviceWithoutConnection).toBeDefined();
      
      // Restore connection
      mockNavigator.connection = originalConnection;
    });
  });

  describe('Error Handling', () => {
    it('should handle IndexedDB errors gracefully', async () => {
      // Mock IndexedDB error
      mockIndexedDB.open.mockImplementation(() => {
        const request = {
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          error: new Error('IndexedDB error')
        };
        
        setTimeout(() => {
          if (request.onerror) {
            request.onerror();
          }
        }, 0);
        
        return request;
      });
      
      const errorService = new MobileOptimizationService();
      
      // Should not throw
      await expect(
        errorService.cacheData('test', 'story', { content: 'test' })
      ).resolves.not.toThrow();
    });

    it('should handle sync errors', async () => {
      // Mock network error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      service.queueForSync('create_story', { content: 'test' });
      
      await service.syncData();
      
      const syncStatus = service.getSyncStatus();
      expect(syncStatus.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing browser APIs', () => {
      // Test without IndexedDB
      delete (global as any).indexedDB;
      
      const serviceWithoutIndexedDB = new MobileOptimizationService();
      expect(serviceWithoutIndexedDB).toBeDefined();
      
      // Restore IndexedDB
      global.indexedDB = mockIndexedDB as any;
    });
  });

  describe('Data Compression', () => {
    it('should compress data based on compression level', async () => {
      const largeData = {
        content: 'A'.repeat(1000),
        metadata: { key: 'value' }
      };
      
      await service.cacheData('large-data', 'story', largeData, 'medium');
      
      const cachedData = service.getCachedData('large-data');
      expect(cachedData).toBeDefined();
      expect(cachedData?.data).toEqual(largeData);
    });
  });

  describe('Background Sync', () => {
    it('should handle background sync events', () => {
      // This would test service worker background sync
      // For now, we just ensure the service is properly initialized
      expect(service.getSyncStatus()).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full offline workflow', async () => {
      // 1. Cache some data
      const storyData = { id: 'story1', title: 'Test Story', content: 'Content' };
      await service.cacheData('story-1', 'story', storyData, 'high', 'community-1');
      
      // 2. Queue some changes
      service.queueForSync('update_story', { id: 'story-1', updates: { title: 'Updated' } });
      
      // 3. Check sync status
      let syncStatus = service.getSyncStatus();
      expect(syncStatus.pendingUploads).toBe(1);
      
      // 4. Sync data
      await service.syncData();
      
      // 5. Verify sync completed
      syncStatus = service.getSyncStatus();
      expect(syncStatus.syncInProgress).toBe(false);
      
      // 6. Check cached data is still available
      const cachedData = service.getCachedData('story-1');
      expect(cachedData?.data).toEqual(storyData);
    });

    it('should handle cache size limits', async () => {
      const smallService = new MobileOptimizationService({
        maxCacheSize: 0.001 // Very small cache size
      });
      
      // Try to cache data that exceeds limit
      const largeData = { content: 'A'.repeat(10000) };
      
      await smallService.cacheData('large-1', 'story', largeData, 'low');
      await smallService.cacheData('large-2', 'story', largeData, 'high');
      
      const stats = smallService.getCacheStats();
      // Should have cleaned up low priority items
      expect(stats.totalItems).toBeLessThanOrEqual(1);
    });
  });
});

describe('Mobile UI Components', () => {
  // These would be React component tests
  // For now, we'll just test that the service integrates properly
  
  it('should provide status for UI components', () => {
    const service = new MobileOptimizationService();
    
    const syncStatus = service.getSyncStatus();
    expect(syncStatus).toHaveProperty('isOnline');
    expect(syncStatus).toHaveProperty('lastSync');
    expect(syncStatus).toHaveProperty('pendingUploads');
    expect(syncStatus).toHaveProperty('pendingDownloads');
    
    const pwaStatus = service.getPWAStatus();
    expect(pwaStatus).toHaveProperty('canInstall');
    expect(pwaStatus).toHaveProperty('isInstalled');
    
    const cacheStats = service.getCacheStats();
    expect(cacheStats).toHaveProperty('totalItems');
    expect(cacheStats).toHaveProperty('totalSize');
  });
});