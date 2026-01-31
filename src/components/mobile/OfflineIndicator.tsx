'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Badge, Progress, Alert, AlertDescription } from '@/components/core';
import { 
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Upload,
  Clock,
  AlertTriangle,
  CheckCircle,
  Database,
  Smartphone,
  Signal
} from 'lucide-react';
import { mobileOptimizationService, SyncStatus } from '@/lib/community/mobile-optimization-service';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  communityId?: string;
}

export default function OfflineIndicator({ 
  className = '',
  showDetails = false,
  communityId 
}: OfflineIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    // Initial status load
    updateStatus();
    
    // Set up periodic updates
    const statusInterval = setInterval(updateStatus, 2000);
    
    // Set up event listeners
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Get connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionInfo(connection);
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        setConnectionInfo({...connection});
      });
    }
    
    return () => {
      clearInterval(statusInterval);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  const updateStatus = () => {
    const status = mobileOptimizationService.getSyncStatus();
    const stats = mobileOptimizationService.getCacheStats();
    
    setSyncStatus(status);
    setCacheStats(stats);
    
    // Calculate sync progress
    if (status.syncInProgress) {
      const total = status.pendingUploads + status.pendingDownloads;
      const completed = total - status.pendingUploads - status.pendingDownloads;
      setSyncProgress(total > 0 ? (completed / total) * 100 : 0);
    } else {
      setSyncProgress(0);
    }
  };

  const handleOnlineStatus = () => {
    updateStatus();
  };

  const handleOfflineStatus = () => {
    updateStatus();
  };

  const handleSync = async () => {
    await mobileOptimizationService.syncData();
    updateStatus();
  };

  const getConnectionQuality = () => {
    if (!syncStatus?.isOnline) return 'offline';
    if (!connectionInfo) return 'unknown';
    
    switch (connectionInfo.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'poor';
      case '3g':
        return 'fair';
      case '4g':
        return 'good';
      default:
        return 'excellent';
    }
  };

  const getConnectionIcon = () => {
    if (!syncStatus?.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    const quality = getConnectionQuality();
    switch (quality) {
      case 'poor':
        return <Signal className="h-4 w-4 text-red-500" />;
      case 'fair':
        return <Signal className="h-4 w-4 text-yellow-500" />;
      case 'good':
        return <Signal className="h-4 w-4 text-green-500" />;
      case 'excellent':
        return <Wifi className="h-4 w-4 text-green-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!syncStatus?.isOnline) return 'bg-red-500';
    if (syncStatus.syncInProgress) return 'bg-blue-500';
    if (syncStatus.pendingUploads > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!syncStatus?.isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStatus.pendingUploads > 0) return 'Pending sync';
    return 'Online';
  };

  const formatLastSync = (lastSync: Date | null) => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatCacheSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  if (!syncStatus) {
    return null;
  }

  // Compact indicator for mobile
  if (!showDetails && !isExpanded) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="relative">
          {getConnectionIcon()}
          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getStatusColor()}`} />
        </div>
        
        {syncStatus.syncInProgress && (
          <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
        )}
        
        {syncStatus.pendingUploads > 0 && (
          <Badge variant="secondary" className="text-xs px-1 py-0">
            {syncStatus.pendingUploads}
          </Badge>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="p-1 h-auto text-xs"
        >
          {getStatusText()}
        </Button>
      </div>
    );
  }

  // Detailed view
  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <span className="font-medium">{getStatusText()}</span>
              {!showDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 h-auto"
                >
                  ×
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {syncStatus.isOnline && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncStatus.syncInProgress}
                >
                  {syncStatus.syncInProgress ? (
                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Sync
                </Button>
              )}
            </div>
          </div>

          {/* Connection Details */}
          {connectionInfo && syncStatus.isOnline && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Connection:</span>
                <div className="font-medium capitalize">
                  {connectionInfo.effectiveType?.replace('-', ' ') || 'Unknown'}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Speed:</span>
                <div className="font-medium">
                  {connectionInfo.downlink ? `${connectionInfo.downlink}Mbps` : 'Unknown'}
                </div>
              </div>
            </div>
          )}

          {/* Sync Progress */}
          {syncStatus.syncInProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing data...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {/* Pending Operations */}
          {(syncStatus.pendingUploads > 0 || syncStatus.pendingDownloads > 0) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {syncStatus.pendingUploads > 0 && (
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-orange-500" />
                  <span>{syncStatus.pendingUploads} uploads pending</span>
                </div>
              )}
              {syncStatus.pendingDownloads > 0 && (
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-blue-500" />
                  <span>{syncStatus.pendingDownloads} downloads pending</span>
                </div>
              )}
            </div>
          )}

          {/* Last Sync */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Last sync: {formatLastSync(syncStatus.lastSync)}</span>
            </div>
          </div>

          {/* Cache Statistics */}
          {cacheStats && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Offline Cache</span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatCacheSize(cacheStats.totalSize)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span>Total items: </span>
                  <span className="font-medium">{cacheStats.totalItems}</span>
                </div>
                <div>
                  <span>Stories: </span>
                  <span className="font-medium">{cacheStats.itemsByType.story || 0}</span>
                </div>
                <div>
                  <span>Events: </span>
                  <span className="font-medium">{cacheStats.itemsByType.event || 0}</span>
                </div>
                <div>
                  <span>Indicators: </span>
                  <span className="font-medium">{cacheStats.itemsByType.indicator || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Offline Mode Alert */}
          {!syncStatus.isOnline && (
            <Alert className="border-orange-200 bg-orange-50">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="text-sm">
                You're offline. You can still view cached content and make changes that will sync when you're back online.
              </AlertDescription>
            </Alert>
          )}

          {/* Sync Errors */}
          {syncStatus.errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <div className="font-medium mb-1">Sync Issues:</div>
                <ul className="list-disc list-inside space-y-1">
                  {syncStatus.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success State */}
          {syncStatus.isOnline && 
           syncStatus.pendingUploads === 0 && 
           syncStatus.pendingDownloads === 0 && 
           !syncStatus.syncInProgress && 
           syncStatus.errors.length === 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                All data is synchronized and up to date.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}