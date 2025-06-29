'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './Card';

export const DatabaseStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Check database status by trying to hit an API endpoint
    Promise.all([
      fetch('/api/documents/search?limit=1'),
      fetch('/api/debug/env')
    ])
      .then(async ([searchResponse, debugResponse]) => {
        setIsConnected(searchResponse.status !== 503);
        if (debugResponse.ok) {
          const debug = await debugResponse.json();
          setDebugInfo(debug);
        }
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
            
            {debugInfo && (
              <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                <strong>Debug info:</strong>
                <ul className="mt-1 space-y-1">
                  {Object.entries(debugInfo.envVars || {}).map(([key, value]) => (
                    <li key={key}>
                      {key}: {value ? '✅' : '❌'}
                    </li>
                  ))}
                </ul>
                {debugInfo.urlPreview && (
                  <div className="mt-2">
                    <strong>URL Preview:</strong>
                    <ul className="mt-1">
                      {Object.entries(debugInfo.urlPreview).map(([key, value]) => (
                        <li key={key} className="truncate">
                          {key}: {String(value)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-xs text-orange-600">
              <strong>Next steps:</strong>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Check that Supabase environment variables are set in Vercel</li>
                <li>Ensure DATABASE_URL or POSTGRES_URL is available</li>
                <li>Run database migrations: <code className="bg-orange-200 px-1 rounded">npx prisma db push</code></li>
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