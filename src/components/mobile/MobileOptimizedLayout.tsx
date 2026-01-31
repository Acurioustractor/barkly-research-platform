'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription, Progress } from '@/components/core';
import { 
  Menu,
  X,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Smartphone,
  Battery,
  Signal,
  RefreshCw,
  Settings,
  Home,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Bell,
  User,
  ChevronDown,
  ChevronUp,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { mobileOptimizationService, SyncStatus, PWAInstallPrompt } from '@/lib/community/mobile-optimization-service';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  communityId?: string;
}

export default function MobileOptimizedLayout({ 
  children, 
  currentPage = 'home',
  communityId 
}: MobileOptimizedLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [pwaStatus, setPwaStatus] = useState<PWAInstallPrompt | null>(null);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mobile optimizations
    initializeMobileFeatures();
    
    // Set up status monitoring
    const statusInterval = setInterval(updateStatus, 5000);
    
    // Set up event listeners
    window.addEventListener('pwa-install-available', handlePWAInstallAvailable);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);
    
    // Handle clicks outside menu
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(statusInterval);
      window.removeEventListener('pwa-install-available', handlePWAInstallAvailable);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const initializeMobileFeatures = async () => {
    try {
      // Get initial status
      updateStatus();
      
      // Get connection info
      if ('connection' in navigator) {
        setConnectionInfo((navigator as any).connection);
      }
      
      // Get battery info
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        setBatteryInfo(battery);
        
        // Update battery info when it changes
        battery.addEventListener('chargingchange', () => setBatteryInfo({...battery}));
        battery.addEventListener('levelchange', () => setBatteryInfo({...battery}));
      }
      
      // Apply mobile-specific styles
      applyMobileStyles();
    } catch (error) {
      console.error('Error initializing mobile features:', error);
    }
  };

  const updateStatus = () => {
    setSyncStatus(mobileOptimizationService.getSyncStatus());
    setPwaStatus(mobileOptimizationService.getPWAStatus());
    setCacheStats(mobileOptimizationService.getCacheStats());
  };

  const handlePWAInstallAvailable = () => {
    setPwaStatus(mobileOptimizationService.getPWAStatus());
  };

  const handleOnlineStatus = () => {
    setShowOfflineAlert(false);
    updateStatus();
  };

  const handleOfflineStatus = () => {
    setShowOfflineAlert(true);
    updateStatus();
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  const applyMobileStyles = () => {
    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-layout');
    
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
          );
        }
      });
      
      input.addEventListener('blur', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0'
          );
        }
      });
    });
  };

  const installPWA = async () => {
    const success = await mobileOptimizationService.installPWA();
    if (success) {
      updateStatus();
    }
  };

  const syncData = async () => {
    await mobileOptimizationService.syncData();
    updateStatus();
  };

  const clearCache = async () => {
    await mobileOptimizationService.clearCache();
    updateStatus();
  };

  const getConnectionIcon = () => {
    if (!syncStatus?.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    
    if (connectionInfo) {
      switch (connectionInfo.effectiveType) {
        case 'slow-2g':
        case '2g':
          return <Signal className="h-4 w-4 text-red-500" />;
        case '3g':
          return <Signal className="h-4 w-4 text-yellow-500" />;
        case '4g':
          return <Signal className="h-4 w-4 text-green-500" />;
        default:
          return <Wifi className="h-4 w-4 text-green-500" />;
      }
    }
    
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const getBatteryIcon = () => {
    if (!batteryInfo) return null;
    
    const level = Math.round(batteryInfo.level * 100);
    const isCharging = batteryInfo.charging;
    
    return (
      <div className="flex items-center space-x-1">
        <Battery className={`h-4 w-4 ${
          level > 50 ? 'text-green-500' : 
          level > 20 ? 'text-yellow-500' : 'text-red-500'
        }`} />
        <span className="text-xs">{level}%</span>
        {isCharging && <span className="text-xs text-green-500">⚡</span>}
      </div>
    );
  };

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'community', label: 'Community', icon: Users, path: '/community' },
    { id: 'stories', label: 'Stories', icon: FileText, path: '/stories' },
    { id: 'events', label: 'Events', icon: Calendar, path: '/events' },
    { id: 'insights', label: 'Insights', icon: BarChart3, path: '/insights' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 mobile-optimized">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-lg font-semibold truncate">
              {navigationItems.find(item => item.id === currentPage)?.label || 'Community Intelligence'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            {getConnectionIcon()}
            
            {/* Battery Status */}
            {getBatteryIcon()}
            
            {/* Sync Status */}
            {syncStatus?.syncInProgress && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            )}
            
            {/* Compact Mode Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompactMode(!isCompactMode)}
              className="p-2"
            >
              {isCompactMode ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              {connectionInfo && (
                <span>
                  {connectionInfo.effectiveType?.toUpperCase()} 
                  {connectionInfo.downlink && ` • ${connectionInfo.downlink}Mbps`}
                </span>
              )}
              {syncStatus?.lastSync && (
                <span>
                  Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {cacheStats && (
              <span>
                Cache: {cacheStats.totalItems} items • {Math.round(cacheStats.totalSize / 1024)}KB
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Offline Alert */}
      {showOfflineAlert && (
        <Alert className="m-4 border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're currently offline. Some features may be limited, but you can still access cached content.
          </AlertDescription>
        </Alert>
      )}

      {/* PWA Install Prompt */}
      {pwaStatus?.canInstall && !pwaStatus.isInstalled && (
        <Alert className="m-4 border-blue-200 bg-blue-50">
          <Smartphone className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Install this app for a better mobile experience</span>
            <Button size="sm" onClick={installPWA}>
              Install
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Sync Status Alert */}
      {syncStatus?.pendingUploads > 0 && (
        <Alert className="m-4 border-yellow-200 bg-yellow-50">
          <Upload className="h-4 w-4" />
          <AlertDescription>
            {syncStatus.pendingUploads} changes waiting to sync when online
          </AlertDescription>
        </Alert>
      )}

      <div className="flex">
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
          >
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Navigation</h2>
              </div>
              
              {/* Navigation Items */}
              <nav className="flex-1 p-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === currentPage;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        // Handle navigation
                        setIsMenuOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
              
              {/* Menu Footer */}
              <div className="p-4 border-t space-y-3">
                {/* Sync Controls */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={syncData}
                    disabled={!syncStatus?.isOnline || syncStatus?.syncInProgress}
                    className="w-full"
                  >
                    {syncStatus?.syncInProgress ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Data
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCache}
                    className="w-full"
                  >
                    Clear Cache
                  </Button>
                </div>
                
                {/* Status Summary */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={syncStatus?.isOnline ? "default" : "secondary"}>
                      {syncStatus?.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  
                  {syncStatus?.pendingUploads > 0 && (
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span>{syncStatus.pendingUploads} uploads</span>
                    </div>
                  )}
                  
                  {cacheStats && (
                    <div className="flex justify-between">
                      <span>Cached:</span>
                      <span>{cacheStats.totalItems} items</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Menu Overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 ${isCompactMode ? 'compact-mode' : ''}`}>
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Alternative) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = item.id === currentPage;
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center p-2 ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mobile-specific styles */}
      <style jsx global>{`
        .mobile-optimized {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .mobile-optimized input,
        .mobile-optimized textarea,
        .mobile-optimized select {
          -webkit-user-select: text;
          user-select: text;
        }
        
        .mobile-optimized button,
        .mobile-optimized [role="button"] {
          touch-action: manipulation;
          min-height: 44px;
          min-width: 44px;
        }
        
        .compact-mode {
          font-size: 0.875rem;
        }
        
        .compact-mode .card {
          padding: 0.75rem;
        }
        
        .compact-mode h1,
        .compact-mode h2,
        .compact-mode h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }
        
        @media (max-width: 768px) {
          .mobile-layout {
            padding-bottom: 80px; /* Space for bottom navigation */
          }
        }
        
        /* Touch-friendly scrollbars */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Improve touch targets */
        .mobile-optimized a,
        .mobile-optimized button,
        .mobile-optimized [role="button"],
        .mobile-optimized input[type="checkbox"],
        .mobile-optimized input[type="radio"] {
          min-height: 44px;
          min-width: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Prevent text selection on UI elements */
        .mobile-optimized .ui-element {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Smooth scrolling */
        .mobile-optimized {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        /* Focus styles for accessibility */
        .mobile-optimized *:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .mobile-optimized {
            filter: contrast(1.2);
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .mobile-optimized * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}