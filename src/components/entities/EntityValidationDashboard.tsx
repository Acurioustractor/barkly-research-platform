/**
 * Entity Validation Dashboard Component
 * Provides comprehensive interface for reviewing and validating AI-extracted entities
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { Input } from '@/components/core/Input';

// Types for validation
interface DocumentEntity {
  id: string;
  documentId: string;
  type: string;
  name: string;
  category?: string;
  confidence?: number;
  context?: string;
  createdAt: string;
  validationStatus?: string;
  validatedBy?: string;
  validatedAt?: string;
  validationNotes?: string;
  mergedWithEntityId?: string;
  suggestedMerges?: string;
  isManual?: boolean;
  qualityScore?: number;
  reviewFlags?: string;
  extractionMethod?: string;
}

interface ValidationAction {
  entityId: string;
  action: 'approve' | 'reject' | 'edit' | 'merge' | 'flag';
  notes?: string;
  newData?: Partial<DocumentEntity>;
  mergeWithEntityId?: string;
}

interface ValidationFilters {
  entityType?: string;
  minConfidence?: number;
  maxConfidence?: number;
  documentId?: string;
  sortBy?: 'confidence' | 'extractedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export const EntityValidationDashboard: React.FC = () => {
  const [entities, setEntities] = useState<DocumentEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ValidationFilters>({
    sortBy: 'confidence',
    sortOrder: 'desc',
    minConfidence: 0.5
  });
  const [editingEntity, setEditingEntity] = useState<DocumentEntity | null>(null);
  const [validationNotes, setValidationNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalEntities, setTotalEntities] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Fetch pending validation entities
  const fetchPendingEntities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: (currentPage * 20).toString(),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.minConfidence && { minConfidence: filters.minConfidence.toString() }),
        ...(filters.maxConfidence && { maxConfidence: filters.maxConfidence.toString() }),
        ...(filters.documentId && { documentId: filters.documentId }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder })
      });

      const response = await fetch(`/api/entities/validation?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch entities');
      }

      if (currentPage === 0) {
        setEntities(data.data.entities);
      } else {
        setEntities(prev => [...prev, ...data.data.entities]);
      }
      
      setTotalEntities(data.data.total);
      setHasMore(data.data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch entities');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Load entities on mount and filter changes
  useEffect(() => {
    setCurrentPage(0);
    fetchPendingEntities();
  }, [filters]);

  useEffect(() => {
    if (currentPage > 0) {
      fetchPendingEntities();
    }
  }, [currentPage]);

  // Handle individual entity validation
  const handleValidateEntity = async (entityId: string, action: ValidationAction['action'], notes?: string, newData?: Partial<DocumentEntity>, mergeWithEntityId?: string) => {
    try {
      const response = await fetch('/api/entities/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityId,
          action,
          userId: 'current-user', // In a real app, get from auth context
          notes,
          newData,
          mergeWithEntityId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate entity');
      }

      // Remove validated entity from the list
      setEntities(prev => prev.filter(e => e.id !== entityId));
      setSelectedEntities(prev => {
        const newSet = new Set(prev);
        newSet.delete(entityId);
        return newSet;
      });

      // Clear editing state if this was the entity being edited
      if (editingEntity?.id === entityId) {
        setEditingEntity(null);
        setValidationNotes('');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate entity');
    }
  };

  // Handle batch validation
  const handleBatchValidation = async (action: ValidationAction['action']) => {
    if (selectedEntities.size === 0) return;

    try {
      const validations = Array.from(selectedEntities).map(entityId => ({
        entityId,
        action,
        notes: validationNotes || undefined
      }));

      const response = await fetch('/api/entities/validation/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validations,
          userId: 'current-user' // In a real app, get from auth context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to batch validate entities');
      }

      // Remove validated entities from the list
      setEntities(prev => prev.filter(e => !selectedEntities.has(e.id)));
      setSelectedEntities(new Set());
      setValidationNotes('');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to batch validate entities');
    }
  };

  // Handle entity selection
  const handleEntitySelect = (entityId: string, selected: boolean) => {
    setSelectedEntities(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(entityId);
      } else {
        newSet.delete(entityId);
      }
      return newSet;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedEntities.size === entities.length) {
      setSelectedEntities(new Set());
    } else {
      setSelectedEntities(new Set(entities.map(e => e.id)));
    }
  };

  // Confidence color helper
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Confidence badge helper
  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Entity Validation Dashboard</h2>
          <p className="text-gray-600">Review and validate AI-extracted entities</p>
        </div>
        <div className="text-sm text-gray-500">
          {totalEntities} entities pending validation
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type
            </label>
            <select
              value={filters.entityType || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="person">Person</option>
              <option value="organization">Organization</option>
              <option value="location">Location</option>
              <option value="concept">Concept</option>
              <option value="event">Event</option>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="method">Method</option>
              <option value="tool">Tool</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Confidence
            </label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={filters.minConfidence || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                minConfidence: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy || 'confidence'}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="confidence">Confidence</option>
              <option value="extractedAt">Date Extracted</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <select
              value={filters.sortOrder || 'desc'}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Batch Actions */}
      {selectedEntities.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedEntities.size} entities selected
              </span>
              <Input
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                placeholder="Add validation notes (optional)"
                className="w-64"
              />
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleBatchValidation('approve')}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Approve All
              </Button>
              <Button
                onClick={() => handleBatchValidation('reject')}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Reject All
              </Button>
              <Button
                onClick={() => handleBatchValidation('flag')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                size="sm"
              >
                Flag All
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Entity List */}
      <div className="space-y-4">
        {/* Select All */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={entities.length > 0 && selectedEntities.size === entities.length}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Select All</span>
          </label>
          <div className="text-sm text-gray-500">
            Showing {entities.length} of {totalEntities} entities
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Loading */}
        {loading && entities.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading entities...</div>
          </div>
        )}

        {/* Entity Cards */}
        {entities.map((entity) => (
          <Card key={entity.id} className="p-4">
            <div className="flex items-start space-x-4">
              {/* Selection Checkbox */}
              <div className="flex-shrink-0 pt-1">
                <input
                  type="checkbox"
                  checked={selectedEntities.has(entity.id)}
                  onChange={(e) => handleEntitySelect(entity.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Entity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {entity.name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {entity.type}
                    </span>
                    {entity.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {entity.category}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(entity.confidence)} bg-gray-100`}>
                      {getConfidenceBadge(entity.confidence)} ({entity.confidence?.toFixed(2) || 'N/A'})
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(entity.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {entity.context && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                    {entity.context}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center space-x-2">
                  <Button
                    onClick={() => handleValidateEntity(entity.id, 'approve')}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleValidateEntity(entity.id, 'reject')}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => setEditingEntity(entity)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleValidateEntity(entity.id, 'flag', 'Flagged for review')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    size="sm"
                  >
                    Flag
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <Button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}

        {/* No Results */}
        {!loading && entities.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No entities found for validation</div>
          </div>
        )}
      </div>

      {/* Edit Entity Modal */}
      {editingEntity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Entity</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    value={editingEntity.name}
                    onChange={(e) => setEditingEntity(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={editingEntity.type}
                    onChange={(e) => setEditingEntity(prev => prev ? { ...prev, type: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="person">Person</option>
                    <option value="organization">Organization</option>
                    <option value="location">Location</option>
                    <option value="concept">Concept</option>
                    <option value="event">Event</option>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="method">Method</option>
                    <option value="tool">Tool</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <Input
                    value={editingEntity.category || ''}
                    onChange={(e) => setEditingEntity(prev => prev ? { ...prev, category: e.target.value } : null)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Context
                  </label>
                  <textarea
                    value={editingEntity.context || ''}
                    onChange={(e) => setEditingEntity(prev => prev ? { ...prev, context: e.target.value } : null)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validation Notes
                  </label>
                  <textarea
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    rows={2}
                    placeholder="Add notes about this validation..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setEditingEntity(null);
                    setValidationNotes('');
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingEntity) {
                      handleValidateEntity(
                        editingEntity.id, 
                        'edit', 
                        validationNotes, 
                        {
                          name: editingEntity.name,
                          type: editingEntity.type,
                          category: editingEntity.category,
                          context: editingEntity.context
                        }
                      );
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}; 