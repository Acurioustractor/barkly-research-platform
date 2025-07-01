'use client';

import React, { useState, useEffect } from 'react';
import { logger, LogLevel, LogEntry } from '@/lib/logger';

export function MonitoringDashboard() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | undefined>(undefined);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const interval = autoRefresh ? setInterval(() => {
      setLogs(logger.getRecentLogs(filter));
    }, 1000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter, autoRefresh]);

  useEffect(() => {
    setLogs(logger.getRecentLogs(filter));
  }, [filter]);

  const levelColors = {
    [LogLevel.DEBUG]: 'text-gray-600',
    [LogLevel.INFO]: 'text-blue-600',
    [LogLevel.WARN]: 'text-yellow-600',
    [LogLevel.ERROR]: 'text-red-600',
    [LogLevel.FATAL]: 'text-red-800 font-bold',
  };

  const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 w-96 max-h-96 bg-white border-l border-t border-gray-200 shadow-lg rounded-tl-lg overflow-hidden">
      <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Monitoring Dashboard</h3>
        <div className="flex items-center gap-2">
          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-3 h-3"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => logger.clearLogs()}
            className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="p-2 border-b border-gray-200">
        <select
          value={filter ?? ''}
          onChange={(e) => setFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="text-xs border border-gray-300 rounded px-2 py-1 w-full"
        >
          <option value="">All Levels</option>
          {levelNames.map((name, level) => (
            <option key={level} value={level}>
              {name} and above
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-auto h-80 text-xs font-mono">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No logs to display</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log, index) => (
              <div key={index} className="p-2 hover:bg-gray-50">
                <div className="flex items-start gap-2">
                  <span className={`font-semibold ${levelColors[log.level]}`}>
                    {levelNames[log.level]}
                  </span>
                  <div className="flex-1">
                    <div className="break-words">{log.message}</div>
                    {log.context && (
                      <div className="mt-1 text-gray-600">
                        {JSON.stringify(log.context, null, 2)}
                      </div>
                    )}
                    {log.error && (
                      <div className="mt-1 text-red-600">
                        Error: {log.error.message}
                        {log.error.stack && (
                          <details className="mt-1">
                            <summary className="cursor-pointer">Stack trace</summary>
                            <pre className="text-xs overflow-auto">{log.error.stack}</pre>
                          </details>
                        )}
                      </div>
                    )}
                    <div className="mt-1 text-gray-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}