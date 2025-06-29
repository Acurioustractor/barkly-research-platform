'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './Card';

export const DatabaseStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check database status by trying to hit an API endpoint
    fetch('/api/documents/search?limit=1')
      .then(response => {
        setIsConnected(response.status !== 503);
      })
      .catch(() => {
        setIsConnected(false);
      });
  }, []);

  if (isConnected === null) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
            <span className="text-yellow-800">Checking database connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
              <span className="font-medium text-orange-800">Database not connected</span>
            </div>
            <p className="text-sm text-orange-700">
              Document processing features are disabled until Supabase integration is complete.
            </p>
            <div className="text-xs text-orange-600">
              <strong>Next steps:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Go to your Vercel project dashboard</li>
                <li>Click &quot;Integrations&quot; → &quot;Supabase&quot;</li>
                <li>Follow the setup wizard</li>
                <li>Redeploy your application</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="font-medium text-green-800">Database connected</span>
          <span className="text-sm text-green-600">All features available</span>
        </div>
      </CardContent>
    </Card>
  );
};