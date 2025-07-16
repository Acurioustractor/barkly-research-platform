"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/core/Input';
import { Button } from '@/components/core/Button';
import EntityCard from './EntityCard';
import { debounce } from 'lodash';

interface EntitySearchProps {
  onEntitySelect?: (entity: any) => void;
  documentId?: string;
  initialEntityType?: string;
  className?: string;
}

interface SearchFilters {
  entityType: string;
  minConfidence: number;
  searchMode: 'exact' | 'fuzzy' | 'semantic';
  includeContext: boolean;
}

const EntitySearch: React.FC<EntitySearchProps> = ({
  onEntitySelect,
  documentId,
  initialEntityType = '',
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [relatedEntities, setRelatedEntities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    entityType: initialEntityType,
    minConfidence: 0.3,
    searchMode: 'fuzzy',
    includeContext: true
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, currentFilters: SearchFilters) => {
      if (!query.trim() || query.length < 2) {
        setSearchResults([]);
        setSuggestions([]);
        setRelatedEntities([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: query,
          mode: currentFilters.searchMode,
          minConfidence: currentFilters.minConfidence.toString(),
          includeContext: currentFilters.includeContext.toString(),
          limit: '20'
        });

        if (currentFilters.entityType) {
          params.append('type', currentFilters.entityType);
        }

        if (documentId) {
          params.append('documentId', documentId);
        }

        const response = await fetch(`/api/entities/search?${params}`);
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setSearchResults(data.results || []);
        setSuggestions(data.suggestions || []);
        setRelatedEntities(data.relatedEntities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setSearchResults([]);
        setSuggestions([]);
        setRelatedEntities([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [documentId]
  );

  // Effect to trigger search when query or filters change
  useEffect(() => {
    debouncedSearch(searchQuery, filters);
  }, [searchQuery, filters, debouncedSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  const handleEntityClick = (entity: any) => {
    onEntitySelect?.(entity);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setRelatedEntities([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="p-1 h-6 w-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 h-6 w-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Search Status */}
        {isLoading && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg p-3 shadow-lg z-10">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Searching...</span>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && searchQuery && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-10">
            <div className="p-2 border-b border-gray-100">
              <div className="text-xs text-gray-500 font-medium">Suggestions</div>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Search Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
              className="p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Entity Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Entity Type
              </label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="person">Person</option>
                <option value="organization">Organization</option>
                <option value="location">Location</option>
                <option value="concept">Concept</option>
              </select>
            </div>

            {/* Search Mode */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search Mode
              </label>
              <select
                value={filters.searchMode}
                onChange={(e) => handleFilterChange('searchMode', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fuzzy">Fuzzy</option>
                <option value="exact">Exact</option>
                <option value="semantic">Semantic</option>
              </select>
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Confidence ({(filters.minConfidence * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filters.minConfidence}
                onChange={(e) => handleFilterChange('minConfidence', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Include Context */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.includeContext}
                  onChange={(e) => handleFilterChange('includeContext', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Include Context
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Search Results ({searchResults.length})
            </h3>
            <div className="text-xs text-gray-500">
              Mode: {filters.searchMode}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onClick={handleEntityClick}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Related Entities */}
      {relatedEntities.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">
            Related Entities ({relatedEntities.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedEntities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onClick={handleEntityClick}
                compact={true}
                showContext={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && searchResults.length === 0 && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">No entities found for "{searchQuery}"</p>
          <p className="text-xs mt-1">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};

export default EntitySearch; 