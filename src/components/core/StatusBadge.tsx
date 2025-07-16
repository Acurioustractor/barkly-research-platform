import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader2, Archive } from 'lucide-react';

type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ARCHIVED';

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className = '', showIcon = true }: StatusBadgeProps) {
  const statusConfig = {
    PENDING: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: Clock
    },
    PROCESSING: {
      label: 'Processing', 
      className: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Loader2
    },
    COMPLETED: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800 border-green-200', 
      icon: CheckCircle
    },
    FAILED: {
      label: 'Failed',
      className: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertCircle
    },
    ARCHIVED: {
      label: 'Archived',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Archive
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border
      ${config.className} ${className}
    `}>
      {showIcon && (
        <Icon 
          className={`w-3 h-3 ${status === 'PROCESSING' ? 'animate-spin' : ''}`}
        />
      )}
      {config.label}
    </span>
  );
}

// Document processing progress component
interface ProcessingProgressProps {
  status: DocumentStatus;
  progress?: number;
  stage?: string;
}

export function ProcessingProgress({ status, progress, stage }: ProcessingProgressProps) {
  if (status === 'COMPLETED') {
    return <StatusBadge status="COMPLETED" />;
  }

  if (status === 'FAILED') {
    return <StatusBadge status="FAILED" />;
  }

  if (status === 'PROCESSING') {
    return (
      <div className="flex items-center gap-2">
        <StatusBadge status="PROCESSING" />
        {progress !== undefined && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <span>{Math.round(progress || 0)}%</span>
          </div>
        )}
        {stage && (
          <span className="text-xs text-muted-foreground">
            {stage}
          </span>
        )}
      </div>
    );
  }

  return <StatusBadge status={status} />;
}

// File size formatter utility
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Document info display component
interface DocumentInfoProps {
  status: DocumentStatus;
  size: number;
  uploadedAt: string;
  processedAt?: string;
  progress?: number;
  stage?: string;
}

export function DocumentInfo({ 
  status, 
  size, 
  uploadedAt, 
  processedAt,
  progress,
  stage 
}: DocumentInfoProps) {
  const uploadDate = new Date(uploadedAt).toLocaleString();
  const processDate = processedAt ? new Date(processedAt).toLocaleString() : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <ProcessingProgress status={status} progress={progress} stage={stage} />
        <span className="text-xs text-muted-foreground">
          {formatFileSize(size)}
        </span>
      </div>
      
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Uploaded: {uploadDate}</div>
        {processDate && (
          <div>Processed: {processDate}</div>
        )}
      </div>
    </div>
  );
}