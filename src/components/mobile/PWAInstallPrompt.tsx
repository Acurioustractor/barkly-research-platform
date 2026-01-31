'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone,
  Download,
  X,
  CheckCircle,
  Share,
  Home,
  Wifi,
  Battery,
  Bell,
  Zap
} from 'lucide-react';
import { mobileOptimizationService, PWAInstallPrompt as PWAStatus } from '@/lib/community/mobile-optimization-service';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function PWAInstallPrompt({ 
  onInstall,
  onDismiss,
  className = ''
}: PWAInstallPromptProps) {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Get initial PWA status
    updatePWAStatus();
    
    // Listen for PWA install availability
    window.addEventListener('pwa-install-available', handlePWAAvailable);
    window.addEventListener('appinstalled', handlePWAInstalled);
    
    return () => {
      window.removeEventListener('pwa-install-available', handlePWAAvailable);
      window.removeEventListener('appinstalled', handlePWAInstalled);
    };
  }, []);

  const updatePWAStatus = () => {
    const status = mobileOptimizationService.getPWAStatus();
    setPwaStatus(status);
  };

  const handlePWAAvailable = () => {
    updatePWAStatus();
    setIsDismissed(false); // Show prompt when available
  };

  const handlePWAInstalled = () => {
    updatePWAStatus();
    setIsInstalling(false);
  };

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      const success = await mobileOptimizationService.installPWA();
      
      if (success) {
        onInstall?.();
        updatePWAStatus();
      } else {
        setIsInstalling(false);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);
  };

  // Don't show if PWA is already installed, not available, or dismissed
  if (!pwaStatus?.canInstall || pwaStatus.isInstalled || isDismissed) {
    return null;
  }

  const features = [
    {
      icon: Home,
      title: 'Home Screen Access',
      description: 'Add to your home screen for quick access'
    },
    {
      icon: Wifi,
      title: 'Offline Support',
      description: 'Access cached content when offline'
    },
    {
      icon: Bell,
      title: 'Push Notifications',
      description: 'Get notified about community updates'
    },
    {
      icon: Zap,
      title: 'Faster Loading',
      description: 'Optimized performance and caching'
    },
    {
      icon: Battery,
      title: 'Battery Efficient',
      description: 'Designed for mobile battery life'
    },
    {
      icon: Smartphone,
      title: 'Native Feel',
      description: 'App-like experience on your device'
    }
  ];

  return (
    <div className={className}>
      {/* Compact Banner */}
      {!showDetails && (
        <Alert className="border-blue-200 bg-blue-50">
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">Install Community Intelligence App</div>
                <div className="text-sm text-gray-600">
                  Get the full mobile experience with offline support
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleShowDetails}
                >
                  Learn More
                </Button>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={isInstalling}
                >
                  {isInstalling ? (
                    <Download className="h-3 w-3 mr-1 animate-pulse" />
                  ) : (
                    <Download className="h-3 w-3 mr-1" />
                  )}
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="p-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Card */}
      {showDetails && (
        <Card className="border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Install Our App</CardTitle>
                  <p className="text-sm text-gray-600">
                    Get the best mobile experience for Community Intelligence
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(false)}
                className="p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{feature.title}</div>
                      <div className="text-xs text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Installation Benefits */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Why Install?</span>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Works offline - access your community data anywhere</li>
                <li>• Faster loading with intelligent caching</li>
                <li>• Native mobile experience with touch optimizations</li>
                <li>• Push notifications for important updates</li>
                <li>• No app store required - installs directly</li>
              </ul>
            </div>

            {/* Browser-specific Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="font-medium text-sm mb-2">Installation Instructions:</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Chrome/Edge:</strong> Tap "Install" button above</div>
                <div><strong>Safari:</strong> Tap <Share className="h-3 w-3 inline" /> then "Add to Home Screen"</div>
                <div><strong>Firefox:</strong> Tap menu → "Install" or "Add to Home Screen"</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleDismiss}
              >
                Maybe Later
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="min-w-[100px]"
                >
                  {isInstalling ? (
                    <>
                      <Download className="h-4 w-4 mr-2 animate-pulse" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Install Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installation Success */}
      {pwaStatus?.isInstalled && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">App Installed Successfully!</div>
            <div className="text-sm text-gray-600">
              You can now access Community Intelligence from your home screen.
              {pwaStatus.installDate && (
                <span className="block mt-1">
                  Installed on {new Date(pwaStatus.installDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}