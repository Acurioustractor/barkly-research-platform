// Real-time service for dashboard updates
export interface RealtimeUpdate {
  type: 'community_health' | 'document_processed' | 'status_change' | 'service_update' | 'story_added';
  communityId?: string;
  data: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RealtimeSubscription {
  id: string;
  types: string[];
  communityId?: string;
  callback: (update: RealtimeUpdate) => void;
}

class RealtimeService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private updateQueue: RealtimeUpdate[] = [];
  private isProcessing = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateCheck: Date = new Date();

  /**
   * Subscribe to real-time updates
   */
  subscribe(
    types: string[], 
    callback: (update: RealtimeUpdate) => void,
    communityId?: string
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      types,
      communityId,
      callback
    });

    // Start polling if this is the first subscription
    if (this.subscriptions.size === 1) {
      this.startPolling();
    }

    return subscriptionId;
  }

  /**
   * Unsubscribe from updates
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
    
    // Stop polling if no more subscriptions
    if (this.subscriptions.size === 0) {
      this.stopPolling();
    }
  }

  /**
   * Manually trigger an update check
   */
  async checkForUpdates(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      // Check for community health updates
      await this.checkCommunityHealthUpdates();
      
      // Check for document processing updates
      await this.checkDocumentUpdates();
      
      // Check for status changes
      await this.checkStatusChanges();
      
      // Process queued updates
      await this.processUpdateQueue();
      
      this.lastUpdateCheck = new Date();
    } catch (error) {
      console.error('Error checking for updates:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Add an update to the queue (for manual triggering)
   */
  queueUpdate(update: RealtimeUpdate): void {
    this.updateQueue.push(update);
    this.processUpdateQueue();
  }

  /**
   * Start automatic polling for updates
   */
  private startPolling(): void {
    if (this.pollingInterval) return;
    
    // Poll every 30 seconds
    this.pollingInterval = setInterval(() => {
      this.checkForUpdates();
    }, 30000);
    
    // Initial check
    this.checkForUpdates();
  }

  /**
   * Stop automatic polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Check for community health updates
   */
  private async checkCommunityHealthUpdates(): Promise<void> {
    try {
      const response = await fetch('/api/intelligence/health-dashboard?type=summary');
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.success && data.data.last_calculation) {
        const lastCalc = new Date(data.data.last_calculation);
        
        if (lastCalc > this.lastUpdateCheck) {
          this.queueUpdate({
            type: 'community_health',
            data: data.data,
            timestamp: lastCalc,
            priority: 'medium'
          });
        }
      }
    } catch (error) {
      console.error('Error checking community health updates:', error);
    }
  }

  /**
   * Check for document processing updates
   */
  private async checkDocumentUpdates(): Promise<void> {
    try {
      // Check for recently processed documents
      const response = await fetch(`/api/documents/list?processed_since=${this.lastUpdateCheck.toISOString()}`);
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.documents && data.documents.length > 0) {
        data.documents.forEach((doc: any) => {
          this.queueUpdate({
            type: 'document_processed',
            communityId: doc.community_id,
            data: {
              documentId: doc.id,
              title: doc.title || doc.filename,
              communityId: doc.community_id,
              processedAt: doc.processed_at
            },
            timestamp: new Date(doc.processed_at || doc.created_at),
            priority: 'low'
          });
        });
      }
    } catch (error) {
      console.error('Error checking document updates:', error);
    }
  }

  /**
   * Check for status changes
   */
  private async checkStatusChanges(): Promise<void> {
    try {
      const response = await fetch('/api/intelligence/community-status?type=changes&days=1');
      if (!response.ok) return;
      
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        data.data.forEach((change: any) => {
          if (change.statusChanged || Math.abs(change.scoreChange) >= 5) {
            this.queueUpdate({
              type: 'status_change',
              communityId: change.communityId,
              data: change,
              timestamp: new Date(change.lastUpdated),
              priority: change.statusChanged ? 'high' : 'medium'
            });
          }
        });
      }
    } catch (error) {
      console.error('Error checking status changes:', error);
    }
  }

  /**
   * Process the update queue and notify subscribers
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.updateQueue.length === 0) return;
    
    // Sort by priority and timestamp
    this.updateQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return b.timestamp.getTime() - a.timestamp.getTime(); // Newer first
    });
    
    // Process updates
    const updates = [...this.updateQueue];
    this.updateQueue = [];
    
    for (const update of updates) {
      this.notifySubscribers(update);
    }
  }

  /**
   * Notify relevant subscribers of an update
   */
  private notifySubscribers(update: RealtimeUpdate): void {
    for (const subscription of this.subscriptions.values()) {
      // Check if subscriber is interested in this update type
      if (!subscription.types.includes(update.type)) continue;
      
      // Check if subscriber is interested in this community
      if (subscription.communityId && update.communityId && 
          subscription.communityId !== update.communityId) continue;
      
      try {
        subscription.callback(update);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    }
  }

  /**
   * Get current subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get last update check time
   */
  getLastUpdateCheck(): Date {
    return this.lastUpdateCheck;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// React hook for using real-time updates
export function useRealtimeUpdates(
  types: string[], 
  onUpdate: (update: RealtimeUpdate) => void,
  communityId?: string
) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  const subscriptionRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // Subscribe to updates
    subscriptionRef.current = realtimeService.subscribe(
      types,
      (update) => {
        onUpdate(update);
        setLastUpdate(update.timestamp);
      },
      communityId
    );
    
    setIsConnected(true);
    
    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        realtimeService.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      setIsConnected(false);
    };
  }, [types.join(','), communityId]);

  // Manual refresh function
  const refresh = React.useCallback(() => {
    realtimeService.checkForUpdates();
  }, []);

  return {
    isConnected,
    lastUpdate,
    refresh,
    subscriptionCount: realtimeService.getSubscriptionCount()
  };
}

// Import React for the hook
import React from 'react';