'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '@/utils/cn';

interface ProcessingJob {
  id: string;
  documentId?: string;
  type: 'quick' | 'standard' | 'deep' | 'world-class';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';
  progress: number;
  fileName: string;
  estimatedDuration?: number;
  actualDuration?: number;
  error?: string;
  message?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  estimatedWaitTime: number;
}

interface DocumentProcessingStatusProps {
  jobIds?: string[];
  documentId?: string;
  onJobComplete?: (job: ProcessingJob) => void;
  className?: string;
}

export const DocumentProcessingStatus: React.FC<DocumentProcessingStatusProps> = ({
  jobIds = [],
  documentId,
  onJobComplete,
  className
}) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up Server-Sent Events connection for real-time updates
  useEffect(() => {
    if (jobIds.length === 0 && !documentId) return;

    const params = new URLSearchParams();
    if (jobIds.length > 0) {
      jobIds.forEach(id => params.append('jobId', id));
    }
    if (documentId) {
      params.append('documentId', documentId);
    }

    const eventSource = new EventSource(`/api/jobs/stream?${params}`);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            setConnected(true);
            break;
            
          case 'job:status':
          case 'job:added':
          case 'job:started':
          case 'job:completed':
          case 'job:failed':
          case 'job:retry':
            updateJob(data.job);
            if (data.type === 'job:completed' && onJobComplete) {
              onJobComplete(data.job);
            }
            break;
            
          case 'job:progress':
            updateJobProgress(data.job.id, data.job.progress, data.job.message);
            break;
            
          case 'stats:update':
            setQueueStats(data.stats);
            break;
            
          case 'heartbeat':
            // Keep connection alive
            break;
            
          default:
            console.log('Unknown event type:', data.type);
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setConnected(false);
      setError('Connection lost. Attempting to reconnect...');
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [jobIds.join(','), documentId, onJobComplete]);

  const updateJob = useCallback((updatedJob: ProcessingJob) => {
    setJobs(prev => {
      const existingIndex = prev.findIndex(job => job.id === updatedJob.id);
      if (existingIndex >= 0) {
        const newJobs = [...prev];
        newJobs[existingIndex] = updatedJob;
        return newJobs;
      } else {
        return [...prev, updatedJob];
      }
    });
  }, []);

  const updateJobProgress = useCallback((jobId: string, progress: number, message?: string) => {
    setJobs(prev =>
      prev.map(job =>
        job.id === jobId
          ? { ...job, progress, message: message || job.message }
          : job
      )
    );
  }, []);

  const cancelJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs?action=cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }
      
      const result = await response.json();
      if (result.cancelled) {
        updateJob({ ...jobs.find(j => j.id === jobId)!, status: 'failed', error: 'Cancelled by user' });
      }
    } catch (err) {
      console.error('Error cancelling job:', err);
    }
  };

  const getStatusColor = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'retrying': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: ProcessingJob['type']) => {
    switch (type) {
      case 'quick': return 'Quick';
      case 'standard': return 'Standard';
      case 'deep': return 'Deep Analysis';
      case 'world-class': return 'World-Class';
      default: return type;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (jobs.length === 0 && !queueStats) {
    return null;
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Document Processing Status</span>
          <div className="flex items-center gap-2">
            {connected ? (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Live
              </div>
            ) : (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Disconnected
              </div>
            )}
          </div>
        </CardTitle>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue Statistics */}
        {queueStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{queueStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{queueStats.processing}</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {queueStats.estimatedWaitTime > 0 ? formatDuration(queueStats.estimatedWaitTime * 1000) : '---'}
              </div>
              <div className="text-sm text-gray-600">Est. Wait</div>
            </div>
          </div>
        )}

        {/* Individual Jobs */}
        {jobs.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Processing Jobs</h4>
            {jobs.map((job) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900 truncate" title={job.fileName}>
                      {job.fileName}
                    </h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(job.status)
                      )}>
                        {job.status.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {getTypeLabel(job.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'processing' && (
                      <LoadingSpinner size="sm" />
                    )}
                    {(job.status === 'pending' || job.status === 'processing') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelJob(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === 'processing' && (
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Job Details */}
                <div className="text-sm text-gray-600 space-y-1">
                  {job.estimatedDuration && job.status !== 'completed' && (
                    <div>Estimated duration: {formatDuration(job.estimatedDuration)}</div>
                  )}
                  {job.actualDuration && job.status === 'completed' && (
                    <div>Completed in: {formatDuration(job.actualDuration)}</div>
                  )}
                  {job.error && (
                    <div className="text-red-600 bg-red-50 px-2 py-1 rounded">
                      Error: {job.error}
                    </div>
                  )}
                  {job.documentId && (
                    <div>
                      <a 
                        href={`/documents/${job.documentId}`}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};