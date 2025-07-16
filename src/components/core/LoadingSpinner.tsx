import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  message?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  message,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm', 
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {message && (
        <p className={`mt-2 text-muted-foreground text-center ${textSizes[size]}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// Specific loading components for common cases
export function DocumentProcessing({ filename }: { filename?: string }) {
  return (
    <LoadingSpinner
      size="lg"
      message={filename ? `Processing ${filename}...` : "Processing document..."}
    />
  );
}

export function AIAnalysis() {
  return (
    <LoadingSpinner
      size="lg"
      message="AI is analyzing your document. This may take a few minutes..."
    />
  );
}

export function FileUpload() {
  return (
    <LoadingSpinner
      size="md"
      message="Uploading file..."
    />
  );
}

// Full page loading overlay
export function PageLoading({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background border rounded-lg p-6 shadow-lg">
        <LoadingSpinner
          size="xl"
          message={message || "Loading..."}
        />
      </div>
    </div>
  );
}

// Inline loading for small components
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">{message || "Loading..."}</span>
    </div>
  );
}