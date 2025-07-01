'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/core/Card';
import { Button } from '@/components/core/Button';
import { cn } from '@/utils/cn';
import dynamic from 'next/dynamic';

const AIProviderStatus = dynamic(() => import('./AIProviderStatus'), {
  ssr: false,
  loading: () => <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
});

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
  statusMessage: string;
  extractSystems: boolean;
}

export const BulkUploaderSSE: React.FC<BulkUploadProps> = ({
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
    currentFile: '',
    statusMessage: '',
    extractSystems: false
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

    // Limit number of files (20 max)
    const maxFiles = 20;
    const finalFiles = validSizeFiles.slice(0, maxFiles);
    
    setState(prev => ({
      ...prev,
      files: [...prev.files, ...finalFiles],
      error: finalFiles.length === 0 ? 'No valid files selected' : null
    }));
  }, []);

  const uploadFiles = async () => {
    if (state.files.length === 0) return;

    setState(prev => ({ 
      ...prev, 
      uploading: true, 
      error: null, 
      progress: 0,
      statusMessage: 'Connecting to server...'
    }));

    try {
      const formData = new FormData();
      state.files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add processing options
      formData.append('extractSystems', state.extractSystems.toString());

      // Create an EventSource connection for SSE
      const response = await fetch('/api/documents/upload-sse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'status':
                  setState(prev => ({ ...prev, statusMessage: data.message }));
                  break;
                
                case 'file_start':
                  setState(prev => ({ 
                    ...prev, 
                    currentFile: data.fileName,
                    progress: data.progress,
                    statusMessage: `Processing ${data.fileName}...`
                  }));
                  break;
                
                case 'file_complete':
                  setState(prev => ({ 
                    ...prev, 
                    progress: data.progress,
                    statusMessage: `Completed ${data.fileName}`
                  }));
                  break;
                
                case 'file_error':
                  console.error(`Error processing ${data.fileName}:`, data.error);
                  break;
                
                case 'complete':
                  setState(prev => ({
                    ...prev,
                    results: data,
                    uploading: false,
                    progress: 100,
                    statusMessage: 'Upload complete!'
                  }));
                  onUploadComplete?.(data);
                  break;
                
                case 'error':
                  throw new Error(data.message);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        uploading: false,
        progress: 0,
        statusMessage: ''
      }));
    }
  };

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

  const resetUpload = () => {
    setState({
      uploading: false,
      dragActive: false,
      files: [],
      results: null,
      error: null,
      progress: 0,
      currentFile: '',
      statusMessage: ''
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Real-Time Document Upload</CardTitle>
            <CardDescription>
              Upload PDF documents with real-time progress tracking. Supports up to 20 files, 10MB each.
            </CardDescription>
          </div>
          <AIProviderStatus />
        </div>
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
                  <p className="text-muted-foreground">or click to browse (up to 20 files, 10MB each)</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="sr-only"
                  id="bulk-file-upload-sse"
                  disabled={state.uploading}
                />
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('bulk-file-upload-sse')?.click()}
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

            {/* Processing Options */}
            {state.files.length > 0 && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium text-sm">Processing Options</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state.extractSystems}
                      onChange={(e) => setState(prev => ({ ...prev, extractSystems: e.target.checked }))}
                      disabled={state.uploading}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-sm font-medium">Extract Systems Map Data</p>
                      <p className="text-xs text-muted-foreground">
                        Identify entities and relationships for systems mapping (requires AI)
                      </p>
                    </div>
                  </label>
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
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{state.statusMessage}</span>
                  <span>{Math.round(state.progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                {state.currentFile && (
                  <p className="text-sm text-muted-foreground text-center">
                    Processing: {state.currentFile}
                  </p>
                )}
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
              <h4 className="font-medium">Upload Complete</h4>
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