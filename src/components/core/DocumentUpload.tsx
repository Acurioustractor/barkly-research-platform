'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Button } from './Button';
import { cn } from '@/utils/cn';
import type { ExtractedContent } from '@/utils/document-processor';

export interface DocumentUploadProps {
  onUploadComplete?: (results: ExtractedContent | any) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadState {
  uploading: boolean;
  dragActive: boolean;
  files: File[];
  results: ExtractedContent | any | null;
  error: string | null;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  maxFiles = 5,
  className
}) => {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    dragActive: false,
    files: [],
    results: null,
    error: null
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

    // Validate file sizes (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    const validSizeFiles = validFiles.filter(file => file.size <= maxSize);
    const oversizedCount = validFiles.length - validSizeFiles.length;
    
    if (oversizedCount > 0) {
      setState(prev => ({
        ...prev,
        error: `${oversizedCount} file(s) skipped. Files must be under 10MB.`
      }));
    }

    // Limit number of files
    const finalFiles = validSizeFiles.slice(0, maxFiles);
    
    setState(prev => ({
      ...prev,
      files: finalFiles,
      error: finalFiles.length === 0 ? 'No valid files selected' : null
    }));
  }, [maxFiles]);

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

    setState(prev => ({ ...prev, uploading: true, error: null }));

    try {
      const formData = new FormData();
      state.files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
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
        results: result.data,
        uploading: false
      }));

      onUploadComplete?.(result.data);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        uploading: false
      }));
    }
  };

  const resetUpload = () => {
    setState({
      uploading: false,
      dragActive: false,
      files: [],
      results: null,
      error: null
    });
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
        <CardTitle>Document Upload & Analysis</CardTitle>
        <CardDescription>
          Upload PDF documents to extract insights, themes, and youth voices using AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!state.results ? (
          <>
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
                  aria-hidden="true"
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
                  <p className="text-muted-foreground">or click to browse</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="sr-only"
                  id="file-upload"
                  disabled={state.uploading}
                />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={state.uploading}
                >
                  Choose Files
                </Button>
                <p className="text-sm text-muted-foreground">
                  PDF files only, max {maxFiles} files, 10MB each
                </p>
              </div>
            </div>

            {/* File List */}
            {state.files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Selected Files ({state.files.length})</h4>
                <div className="space-y-2">
                  {state.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
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
                        onClick={() => {
                          setState(prev => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index)
                          }));
                        }}
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

            {/* Upload Button */}
            {state.files.length > 0 && (
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={uploadFiles}
                  disabled={state.uploading}
                  loading={state.uploading}
                  className="flex-1"
                >
                  {state.uploading ? 'Processing...' : 'Analyze Documents'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetUpload}
                  disabled={state.uploading}
                >
                  Clear
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Results Display */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Analysis Complete</h4>
              <Button variant="secondary" onClick={resetUpload}>
                Upload More Documents
              </Button>
            </div>
            
            {/* Processing results will be displayed here */}
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-sm text-success">
                ✓ Successfully processed {state.files.length} document(s)
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};