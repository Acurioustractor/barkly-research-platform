import React from 'react';
import { Card } from '@/components/core/Card';

interface EntityCardProps {
  entity: {
    id: string;
    name: string;
    type: 'person' | 'organization' | 'location' | 'concept';
    confidence: number;
    context?: string;
    category?: string;
    createdAt: string;
    document?: {
      id: string;
      originalName: string;
      filename: string;
    };
  };
  onClick?: (entity: any) => void;
  showDocument?: boolean;
  showContext?: boolean;
  compact?: boolean;
}

const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  onClick,
  showDocument = true,
  showContext = true,
  compact = false
}) => {
  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'person':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'organization':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'location':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'concept':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
        compact ? 'p-3' : 'p-4'
      }`}
      onClick={() => onClick?.(entity)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {entity.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEntityTypeColor(
                  entity.type
                )}`}
              >
                {entity.type}
              </span>
              {entity.category && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {entity.category}
                </span>
              )}
            </div>
          </div>
          
          {/* Confidence Score */}
          <div className="flex flex-col items-end">
            <div className={`text-sm font-medium ${getConfidenceColor(entity.confidence)}`}>
              {(entity.confidence * 100).toFixed(0)}%
            </div>
            <div className={`text-xs text-gray-500`}>
              {getConfidenceLabel(entity.confidence)}
            </div>
          </div>
        </div>

        {/* Context */}
        {showContext && entity.context && !compact && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Context</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {truncateText(entity.context, 150)}
            </p>
          </div>
        )}

        {/* Document Info */}
        {showDocument && entity.document && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate max-w-32">
                {entity.document.originalName}
              </span>
            </div>
            <span>{formatDate(entity.createdAt)}</span>
          </div>
        )}

        {/* Compact context */}
        {showContext && entity.context && compact && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {truncateText(entity.context, 80)}
          </p>
        )}
      </div>
    </Card>
  );
};

export default EntityCard; 