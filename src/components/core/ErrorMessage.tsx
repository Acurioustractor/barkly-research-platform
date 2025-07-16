import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'error' | 'warning' | 'info';
  className?: string;
}

export function ErrorMessage({ 
  title = "Something went wrong", 
  message, 
  action,
  variant = 'error',
  className = ''
}: ErrorMessageProps) {
  const variants = {
    error: {
      containerClass: 'border-red-200 bg-red-50',
      titleClass: 'text-red-800',
      messageClass: 'text-red-700',
      iconClass: 'text-red-600'
    },
    warning: {
      containerClass: 'border-yellow-200 bg-yellow-50',
      titleClass: 'text-yellow-800', 
      messageClass: 'text-yellow-700',
      iconClass: 'text-yellow-600'
    },
    info: {
      containerClass: 'border-blue-200 bg-blue-50',
      titleClass: 'text-blue-800',
      messageClass: 'text-blue-700', 
      iconClass: 'text-blue-600'
    }
  };

  const styles = variants[variant];

  return (
    <div className={`border p-4 rounded-lg ${styles.containerClass} ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${styles.iconClass}`} />
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${styles.titleClass}`}>
            {title}
          </h3>
          <p className={`mt-1 text-sm ${styles.messageClass}`}>
            {message}
          </p>
          {action && (
            <div className="mt-3">
              <Button
                onClick={action.onClick}
                variant="ghost"
                size="sm"
                className={`${styles.titleClass} hover:bg-white/50`}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Specific error components for common cases
export function UploadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Upload Failed"
      message={message}
      action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
      variant="error"
    />
  );
}

export function ProcessingError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Processing Failed"
      message={message}
      action={onRetry ? { label: "Retry Processing", onClick: onRetry } : undefined}
      variant="error"
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorMessage
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
      variant="warning"
    />
  );
}