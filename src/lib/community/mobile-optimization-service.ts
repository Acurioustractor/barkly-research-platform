import { supabase } from '@/lib/db/supabase';

export interface MobileOptimizationConfig {
  enableOfflineMode: boolean;
  cacheStrategy: 'aggressive' | 'conservative' | 'minimal';
  syncInterval: number; // minutes
  maxCacheSize: number; // MB
  priorityFeatures: string[];
  compressionLevel: 'low' | 'medium' | 'high';
  adaptiveLoading: boolean;
  touchOptimizations: boolean;
}

export interface OfflineData {
  id: string;
  type: 'community' | 'story' | 'document' | 'event' | 'indicator';
  data: any;
  lastUpdated: Date;
  priority: 'high' | 'medium' | 'low';
  size: number; // bytes
  communityId?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  syncInProgress: boolean;
  errors: string[];
  dataFreshness: {
    [key: string]: Date;
  };
}

export interface PWAInstallPrompt {
  canInstall: boolean;
  installPrompt: any;
  isInstalled: boolean;
  installDate?: Date;
}

/**
 * Mobile Optimization Service
 * Handles offline capabilities, PWA features, and mobile-specific optimizations
 */
export class MobileOptimizationService {
  private config: MobileOptimizationConfig;
  private syncStatus: SyncStatus;
  private offlineStorage: Map<string, OfflineData> = new Map();
  private syncQueue: Array<{ action: string; data: any; timestamp: Date }> = [];
  private installPrompt: PWAInstallPrompt = {
    canInstall: false,
    installPrompt: null,
    isInstalled: false
  };

  constructor(config?: Partial<MobileOptimizationConfig>) {
    this.config = {
      enableOfflineMode: true,
      cacheStrategy: 'conservative',
      syncInterval: 15,
      maxCacheSize: 50, // 50MB
      priorityFeatures: ['community-health', 'stories', 'events'],
      compressionLevel: 'medium',
      adaptiveLoading: true,
      touchOptimizations: true,
      ...config
    };

    this.syncStatus = {
      isOnline: navigator.onLine,
      lastSync: null,
      pendingUploads: 0,
      pendingDownloads: 0,
      syncInProgress: false,
      errors: [],
      dataFreshness: {}
    };

    this.initializeService();
  }

  /**
   * Initialize the mobile optimization service
   */
  private async initializeService(): Promise<void> {
    try {
      // Set up online/offline event listeners
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // Set up PWA install prompt handling
      window.addEventListener('beforeinstallprompt', this.handleInstallPrompt.bind(this));

      // Initialize offline storage
      await this.initializeOfflineStorage();

      // Set up periodic sync
      this.setupPeriodicSync();

      // Apply mobile optimizations
      this.applyMobileOptimizations();

      console.log('Mobile optimization service initialized');
    } catch (error) {
      console.error('Error initializing mobile optimization service:', error);
    }
  }

  /**
   * Initialize offline storage with IndexedDB
   */
  private async initializeOfflineStorage(): Promise<void> {
    try {
      // Check if IndexedDB is available
      if (!('indexedDB' in window)) {
        console.warn('IndexedDB not available, offline mode disabled');
        this.config.enableOfflineMode = false;
        return;
      }

      // Load cached data from IndexedDB
      const cachedData = await this.loadFromIndexedDB();
      cachedData.forEach(item => {
        this.offlineStorage.set(item.id, item);
      });

      console.log(`Loaded ${cachedData.length} items from offline storage`);
    } catch (error) {
      console.error('Error initializing offline storage:', error);
    }
  }

  /**
   * Handle online event
   */
  private async handleOnline(): Promise<void> {
    console.log('Device came online');
    this.syncStatus.isOnline = true;
    
    // Trigger sync when coming online
    await this.syncData();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('Device went offline');
    this.syncStatus.isOnline = false;
  }

  /**
   * Handle PWA install prompt
   */
  private handleInstallPrompt(event: any): void {
    event.preventDefault();
    this.installPrompt.canInstall = true;
    this.installPrompt.installPrompt = event;
    
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  /**
   * Set up periodic sync
   */
  private setupPeriodicSync(): void {
    if (this.config.enableOfflineMode) {
      setInterval(() => {
        if (this.syncStatus.isOnline && !this.syncStatus.syncInProgress) {
          this.syncData();
        }
      }, this.config.syncInterval * 60 * 1000);
    }
  }

  /**
   * Apply mobile-specific optimizations
   */
  private applyMobileOptimizations(): void {
    if (this.config.touchOptimizations) {
      // Add touch-friendly CSS classes
      document.body.classList.add('mobile-optimized');
      
      // Disable zoom on input focus (prevents iOS zoom)
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    }

    if (this.config.adaptiveLoading) {
      // Implement adaptive loading based on connection speed
      this.setupAdaptiveLoading();
    }
  }

  /**
   * Set up adaptive loading based on network conditions
   */
  private setupAdaptiveLoading(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      // Adjust loading strategy based on connection speed
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        this.config.compressionLevel = 'high';
        this.config.cacheStrategy = 'minimal';
      } else if (connection.effectiveType === '3g') {
        this.config.compressionLevel = 'medium';
        this.config.cacheStrategy = 'conservative';
      } else {
        this.config.compressionLevel = 'low';
        this.config.cacheStrategy = 'aggressive';
      }
    }
  }

  /**
   * Cache data for offline use
   */
  public async cacheData(
    id: string,
    type: OfflineData['type'],
    data: any,
    priority: OfflineData['priority'] = 'medium',
    communityId?: string
  ): Promise<void> {
    try {
      const offlineData: OfflineData = {
        id,
        type,
        data: this.compressData(data),
        lastUpdated: new Date(),
        priority,
        size: JSON.stringify(data).length,
        communityId
      };

      // Check cache size limits
      if (await this.checkCacheSize(offlineData.size)) {
        this.offlineStorage.set(id, offlineData);
        await this.saveToIndexedDB(offlineData);
        
        this.syncStatus.dataFreshness[id] = new Date();
      } else {
        console.warn('Cache size limit reached, cannot cache data');
      }
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Retrieve cached data
   */
  public getCachedData(id: string): OfflineData | null {
    const data = this.offlineStorage.get(id);
    if (data) {
      return {
        ...data,
        data: this.decompressData(data.data)
      };
    }
    return null;
  }

  /**
   * Get all cached data by type
   */
  public getCachedDataByType(type: OfflineData['type']): OfflineData[] {
    return Array.from(this.offlineStorage.values())
      .filter(item => item.type === type)
      .map(item => ({
        ...item,
        data: this.decompressData(item.data)
      }));
  }

  /**
   * Get cached data for a specific community
   */
  public getCachedDataByCommunity(communityId: string): OfflineData[] {
    return Array.from(this.offlineStorage.values())
      .filter(item => item.communityId === communityId)
      .map(item => ({
        ...item,
        data: this.decompressData(item.data)
      }));
  }

  /**
   * Add action to sync queue
   */
  public queueForSync(action: string, data: any): void {
    this.syncQueue.push({
      action,
      data,
      timestamp: new Date()
    });
    this.syncStatus.pendingUploads++;
  }

  /**
   * Sync data with server
   */
  public async syncData(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.syncInProgress) {
      return;
    }

    try {
      this.syncStatus.syncInProgress = true;
      this.syncStatus.errors = [];

      // Process sync queue (uploads)
      await this.processSyncQueue();

      // Download fresh data
      await this.downloadFreshData();

      this.syncStatus.lastSync = new Date();
      console.log('Data sync completed successfully');
    } catch (error) {
      console.error('Error during data sync:', error);
      this.syncStatus.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncStatus.syncInProgress = false;
    }
  }

  /**
   * Process sync queue (upload pending changes)
   */
  private async processSyncQueue(): Promise<void> {
    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
        this.syncStatus.pendingUploads--;
      } catch (error) {
        console.error('Error processing sync item:', error);
        // Re-queue failed items
        this.syncQueue.push(item);
      }
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: { action: string; data: any; timestamp: Date }): Promise<void> {
    switch (item.action) {
      case 'create_story':
        await supabase.from('enhanced_community_stories').insert(item.data);
        break;
      case 'update_story':
        await supabase.from('enhanced_community_stories')
          .update(item.data.updates)
          .eq('id', item.data.id);
        break;
      case 'create_event':
        await supabase.from('community_events').insert(item.data);
        break;
      case 'update_event':
        await supabase.from('community_events')
          .update(item.data.updates)
          .eq('id', item.data.id);
        break;
      default:
        console.warn('Unknown sync action:', item.action);
    }
  }

  /**
   * Download fresh data from server
   */
  private async downloadFreshData(): Promise<void> {
    try {
      // Download priority data based on configuration
      for (const feature of this.config.priorityFeatures) {
        await this.downloadFeatureData(feature);
      }
    } catch (error) {
      console.error('Error downloading fresh data:', error);
    }
  }

  /**
   * Download data for specific feature
   */
  private async downloadFeatureData(feature: string): Promise<void> {
    switch (feature) {
      case 'community-health':
        await this.downloadCommunityHealthData();
        break;
      case 'stories':
        await this.downloadStoriesData();
        break;
      case 'events':
        await this.downloadEventsData();
        break;
    }
  }

  /**
   * Download community health data
   */
  private async downloadCommunityHealthData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('community_health_indicators')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        for (const item of data) {
          await this.cacheData(
            `health-${item.id}`,
            'indicator',
            item,
            'high',
            item.community_id
          );
        }
      }
    } catch (error) {
      console.error('Error downloading community health data:', error);
    }
  }

  /**
   * Download stories data
   */
  private async downloadStoriesData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('enhanced_community_stories')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        for (const item of data) {
          await this.cacheData(
            `story-${item.id}`,
            'story',
            item,
            'medium',
            item.community_id
          );
        }
      }
    } catch (error) {
      console.error('Error downloading stories data:', error);
    }
  }

  /**
   * Download events data
   */
  private async downloadEventsData(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(30);

      if (error) throw error;

      if (data) {
        for (const item of data) {
          await this.cacheData(
            `event-${item.id}`,
            'event',
            item,
            'medium',
            item.community_id
          );
        }
      }
    } catch (error) {
      console.error('Error downloading events data:', error);
    }
  }

  /**
   * Check if adding data would exceed cache size limit
   */
  private async checkCacheSize(newDataSize: number): Promise<boolean> {
    const currentSize = Array.from(this.offlineStorage.values())
      .reduce((total, item) => total + item.size, 0);
    
    const totalSize = (currentSize + newDataSize) / (1024 * 1024); // Convert to MB
    
    if (totalSize > this.config.maxCacheSize) {
      // Try to free up space by removing low priority items
      await this.cleanupCache();
      
      // Check again after cleanup
      const newCurrentSize = Array.from(this.offlineStorage.values())
        .reduce((total, item) => total + item.size, 0);
      const newTotalSize = (newCurrentSize + newDataSize) / (1024 * 1024);
      
      return newTotalSize <= this.config.maxCacheSize;
    }
    
    return true;
  }

  /**
   * Clean up cache by removing old and low priority items
   */
  private async cleanupCache(): Promise<void> {
    const items = Array.from(this.offlineStorage.entries())
      .sort(([, a], [, b]) => {
        // Sort by priority (low first) then by age (old first)
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.lastUpdated.getTime() - b.lastUpdated.getTime();
      });

    // Remove oldest 25% of low priority items
    const itemsToRemove = items
      .filter(([, item]) => item.priority === 'low')
      .slice(0, Math.ceil(items.length * 0.25));

    for (const [id] of itemsToRemove) {
      this.offlineStorage.delete(id);
      await this.removeFromIndexedDB(id);
    }

    console.log(`Cleaned up ${itemsToRemove.length} cached items`);
  }

  /**
   * Compress data for storage
   */
  private compressData(data: any): any {
    if (this.config.compressionLevel === 'low') {
      return data;
    }

    try {
      const jsonString = JSON.stringify(data);
      
      if (this.config.compressionLevel === 'high') {
        // Simple compression by removing whitespace and shortening keys
        return JSON.parse(jsonString.replace(/\s+/g, ''));
      }
      
      return data;
    } catch (error) {
      console.error('Error compressing data:', error);
      return data;
    }
  }

  /**
   * Decompress data from storage
   */
  private decompressData(data: any): any {
    // For now, just return the data as-is
    // In a real implementation, this would reverse the compression
    return data;
  }

  /**
   * Install PWA
   */
  public async installPWA(): Promise<boolean> {
    if (!this.installPrompt.canInstall || !this.installPrompt.installPrompt) {
      return false;
    }

    try {
      const result = await this.installPrompt.installPrompt.prompt();
      const accepted = result.outcome === 'accepted';
      
      if (accepted) {
        this.installPrompt.isInstalled = true;
        this.installPrompt.installDate = new Date();
        this.installPrompt.canInstall = false;
        this.installPrompt.installPrompt = null;
      }
      
      return accepted;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get PWA install status
   */
  public getPWAStatus(): PWAInstallPrompt {
    return { ...this.installPrompt };
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalItems: number;
    totalSize: number;
    itemsByType: { [key: string]: number };
    itemsByPriority: { [key: string]: number };
  } {
    const items = Array.from(this.offlineStorage.values());
    
    return {
      totalItems: items.length,
      totalSize: items.reduce((total, item) => total + item.size, 0),
      itemsByType: items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      itemsByPriority: items.reduce((acc, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number })
    };
  }

  /**
   * Clear all cached data
   */
  public async clearCache(): Promise<void> {
    this.offlineStorage.clear();
    await this.clearIndexedDB();
    this.syncStatus.dataFreshness = {};
    console.log('Cache cleared');
  }

  /**
   * IndexedDB operations
   */
  private async loadFromIndexedDB(): Promise<OfflineData[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CommunityIntelligenceCache', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readonly');
        const store = transaction.objectStore('offlineData');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('offlineData')) {
          const store = db.createObjectStore('offlineData', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('communityId', 'communityId', { unique: false });
        }
      };
    });
  }

  private async saveToIndexedDB(data: OfflineData): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CommunityIntelligenceCache', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        const putRequest = store.put(data);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async removeFromIndexedDB(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CommunityIntelligenceCache', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        const deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async clearIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CommunityIntelligenceCache', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        const clearRequest = store.clear();
        
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
export const mobileOptimizationService = new MobileOptimizationService();