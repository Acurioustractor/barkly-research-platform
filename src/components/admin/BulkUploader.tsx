'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { cn } from '@/utils/cn';

interface BulkUploadProps {
  onUploadComplete?: (results: any) => void;
  className?: string;
}

interface UploadState {
  uploading: boolean;
  dragActive: boolean;
  files: File[];
  results: any | null;
  error: string | null;
  progress: number;
  currentFile: string;
}

export const BulkUploader: React.FC<BulkUploadProps> = ({
  onUploadComplete,
  className
}) => {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    dragActive: false,
    files: [],
    results: null,
    error: null,
    progress: 0,
    currentFile: ''
  });

  const [options, setOptions] = useState({
    source: 'bulk_upload',
    category: 'community_research',
    tags: 'youth,community,research'
  });

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Validate file types
    const validFiles = fileArray.filter(file => file.type === 'application/pdf');
    const invalidCount = fileArray.length - validFiles.length;
    
    if (invalidCount > 0) {
      setState(prev => ({
        ...prev,
        error: `${invalidCount} file(s) skipped. Only PDF files are supported.`
      }));
    }

    // Validate file sizes (50MB limit for bulk)
    const maxSize = 50 * 1024 * 1024;
    const validSizeFiles = validFiles.filter(file => file.size <= maxSize);
    const oversizedCount = validFiles.length - validSizeFiles.length;
    
    if (oversizedCount > 0) {
      setState(prev => ({
        ...prev,
        error: `${oversizedCount} file(s) skipped. Files must be under 50MB.`
      }));
    }

    // Limit number of files (100 max for bulk)
    const maxFiles = 100;
    const finalFiles = validSizeFiles.slice(0, maxFiles);
    
    setState(prev => ({
      ...prev,
      files: [...prev.files, ...finalFiles],
      error: finalFiles.length === 0 ? 'No valid files selected' : null
    }));
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: false }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: false }));
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const uploadFiles = async () => {
    if (state.files.length === 0) return;

    setState(prev => ({ ...prev, uploading: true, error: null, progress: 0 }));

    try {
      const formData = new FormData();
      
      state.files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('source', options.source);
      formData.append('category', options.category);
      formData.append('tags', options.tags);

      const response = await fetch('/api/upload-simple', {
        method: 'POST',
        body: formData,
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const text = await response.text();
        result = { error: `Server error: ${response.status} ${response.statusText}`, details: text.substring(0, 200) + '...' };
      }

      if (!response.ok) {
        throw new Error(result.error || `Upload failed with status ${response.status}`);
      }

      setState(prev => ({
        ...prev,
        results: result,
        uploading: false,
        progress: 100
      }));

      onUploadComplete?.(result);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        uploading: false,
        progress: 0
      }));
    }
  };

  const resetUpload = () => {
    setState({
      uploading: false,
      dragActive: false,
      files: [],
      results: null,
      error: null,
      progress: 0,
      currentFile: ''
    });
  };

  const removeFile = (index: number) => {
    setState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bulk Document Upload</CardTitle>
        <CardDescription>
          Upload multiple PDF documents for batch processing. Supports up to 100 files, 50MB each.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.results ? (
          <>
            {/* Upload Options */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium mb-2">Source</label>
                <select
                  value={options.source}
                  onChange={(e) => setOptions(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  disabled={state.uploading}
                >
                  <option value="bulk_upload">Bulk Upload</option>
                  <option value="community_research">Community Research</option>
                  <option value="policy_documents">Policy Documents</option>
                  <option value="interviews">Interviews</option>
                  <option value="surveys">Surveys</option>
                  <option value="reports">Reports</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={options.category}
                  onChange={(e) => setOptions(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border rounded-md"
                  disabled={state.uploading}
                >
                  <option value="community_research">Community Research</option>
                  <option value="youth_voice">Youth Voice</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="cultural">Cultural</option>
                  <option value="policy">Policy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={options.tags}
                  onChange={(e) => setOptions(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="youth,community,research"
                  className="w-full p-2 border rounded-md"
                  disabled={state.uploading}
                />
              </div>
            </div>

            {/* Upload Area */}
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                state.dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                state.uploading && 'opacity-50 cursor-not-allowed'
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <svg
                  className="mx-auto h-12 w-12 text-muted-foreground"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <p className="text-lg font-medium">Drop PDF files here</p>
                  <p className="text-muted-foreground">or click to browse (up to 100 files, 50MB each)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="sr-only"
                  id="bulk-file-upload"
                  disabled={state.uploading}
                />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('bulk-file-upload')?.click()}
                  disabled={state.uploading}
                >
                  Choose Files
                </Button>
              </div>
            </div>

            {/* File List */}
            {state.files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Selected Files ({state.files.length})</h4>
                  <Button variant="ghost" size="sm" onClick={resetUpload}>
                    Clear All
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {state.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={state.uploading}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {state.error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{state.error}</p>
              </div>
            )}

            {/* Upload Progress */}
            {state.uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing documents...</span>
                  <span>{Math.round(state.progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Button */}
            {state.files.length > 0 && (
              <Button
                variant="primary"
                onClick={uploadFiles}
                disabled={state.uploading}
                className="w-full"
              >
                {state.uploading ? 'Processing Documents...' : `Process ${state.files.length} Documents`}
              </Button>
            )}
          </>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Bulk Upload Complete</h4>
              <Button variant="secondary" onClick={resetUpload}>
                Upload More Documents
              </Button>
            </div>
            
            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{state.results.summary.successful}</div>
                  <p className="text-xs text-muted-foreground">Successful</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">{state.results.summary.failed}</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{state.results.summary.totalChunks}</div>
                  <p className="text-xs text-muted-foreground">Chunks Created</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{state.results.summary.totalThemes}</div>
                  <p className="text-xs text-muted-foreground">Themes Identified</p>
                </CardContent>
              </Card>
            </div>

            {/* Success Message */}
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-sm text-success">
                ✓ {state.results.message}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};