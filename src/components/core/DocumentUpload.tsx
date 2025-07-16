'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Button } from './Button';
import { LoadingSpinner, FileUpload, ErrorMessage, UploadError, HelpTooltip } from './';
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
  progress: number;
  stage: string;
  aiEnabled: boolean;
  processingType: 'quick' | 'standard' | 'deep' | 'world-class';
  priority: 'low' | 'medium' | 'high';
  extractSystems: boolean;
  extractQuotes: boolean;
  extractThemes: boolean;
  extractInsights: boolean;
  jobIds: string[];
  queuedFiles: number;
  completedFiles: number;
  processingMessage: string;
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
    error: null,
    progress: 0,
    stage: '',
    aiEnabled: true,
    processingType: 'standard',
    priority: 'medium',
    extractSystems: true,
    extractQuotes: true,
    extractThemes: true,
    extractInsights: true,
    jobIds: [],
    queuedFiles: 0,
    completedFiles: 0,
    processingMessage: ''
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

    setState(prev => ({ 
      ...prev, 
      uploading: true, 
      error: null, 
      progress: 0, 
      stage: 'Preparing upload...' 
    }));

    try {
      const formData = new FormData();
      state.files.forEach(file => {
        formData.append('files', file);
      });

      // Add AI analysis options
      formData.append('aiEnabled', state.aiEnabled.toString());
      formData.append('processingType', state.processingType);
      formData.append('priority', state.priority);
      formData.append('extractSystems', state.extractSystems.toString());
      formData.append('extractQuotes', state.extractQuotes.toString());
      formData.append('extractThemes', state.extractThemes.toString());
      formData.append('extractInsights', state.extractInsights.toString());

      // Use Server-Sent Events for real-time progress updates
      const response = await fetch('/api/documents/upload-sse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      // Handle Server-Sent Events stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      let result: any = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'init') {
                setState(prev => ({
                  ...prev,
                  stage: data.message || 'Initializing...',
                  processingMessage: data.options?.processingType || 'standard'
                }));
              } else if (data.type === 'file_queued') {
                setState(prev => ({
                  ...prev,
                  progress: data.progress || 0,
                  stage: `Queued: ${data.fileName} (${data.processingMessage || 'processing'})`,
                  jobIds: data.jobId ? [...prev.jobIds, data.jobId] : prev.jobIds,
                  queuedFiles: prev.queuedFiles + 1
                }));
              } else if (data.type === 'file_complete') {
                setState(prev => ({
                  ...prev,
                  progress: data.progress || 0,
                  stage: `Completed: ${data.fileName}`,
                  completedFiles: prev.completedFiles + 1
                }));
              } else if (data.type === 'progress') {
                setState(prev => ({
                  ...prev,
                  progress: data.progress || 0,
                  stage: data.stage || 'Processing...'
                }));
              } else if (data.type === 'complete') {
                result = data.summary;
                setState(prev => ({
                  ...prev,
                  results: result,
                  uploading: false,
                  progress: 100,
                  stage: data.message || 'Complete!'
                }));
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Upload failed');
              }
            } catch (parseError) {
              // Ignore invalid JSON lines
            }
          }
        }
      }

      if (result) {
        onUploadComplete?.(result);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        uploading: false,
        progress: 0,
        stage: ''
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
      stage: '',
      aiEnabled: true,
      processingType: 'standard',
      priority: 'medium',
      extractSystems: true,
      extractQuotes: true,
      extractThemes: true,
      extractInsights: true,
      jobIds: [],
      queuedFiles: 0,
      completedFiles: 0,
      processingMessage: ''
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
        <div className="flex items-center gap-2">
          <CardTitle>Document Upload & Analysis</CardTitle>
          <HelpTooltip content="Upload research documents to automatically extract youth voices, themes, and insights using AI-powered analysis" />
        </div>
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>PDF files only, max {maxFiles} files, 10MB each</span>
                  <HelpTooltip content="Accepted: Research reports, interview transcripts, survey results, and other youth-focused documents" />
                </div>
              </div>
            </div>

            {/* AI Analysis Options */}
            <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">AI Analysis Settings</h4>
                  <HelpTooltip content="Configure how documents will be analyzed using AI-powered extraction" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.aiEnabled}
                    onChange={(e) => setState(prev => ({ ...prev, aiEnabled: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                    disabled={state.uploading}
                  />
                  <span className="text-sm font-medium">Enable AI Analysis</span>
                </label>
              </div>

              {state.aiEnabled && (
                <div className="space-y-4">
                  {/* Processing Type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Processing Type</label>
                    <select
                      value={state.processingType}
                      onChange={(e) => setState(prev => ({ ...prev, processingType: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      disabled={state.uploading}
                    >
                      <option value="quick">Quick - Basic text extraction (fastest)</option>
                      <option value="standard">Standard - Themes + quotes + insights</option>
                      <option value="deep">Deep - Advanced analysis with context</option>
                      <option value="world-class">World-class - Full systems extraction</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Processing Priority</label>
                    <select
                      value={state.priority}
                      onChange={(e) => setState(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      disabled={state.uploading}
                    >
                      <option value="low">Low - Process when resources available</option>
                      <option value="medium">Medium - Standard processing queue</option>
                      <option value="high">High - Priority processing</option>
                    </select>
                  </div>

                  {/* Extraction Options */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Analysis Features</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.extractSystems}
                          onChange={(e) => setState(prev => ({ ...prev, extractSystems: e.target.checked }))}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          disabled={state.uploading}
                        />
                        <span className="text-sm">Extract Systems</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.extractQuotes}
                          onChange={(e) => setState(prev => ({ ...prev, extractQuotes: e.target.checked }))}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          disabled={state.uploading}
                        />
                        <span className="text-sm">Extract Quotes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.extractThemes}
                          onChange={(e) => setState(prev => ({ ...prev, extractThemes: e.target.checked }))}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          disabled={state.uploading}
                        />
                        <span className="text-sm">Extract Themes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={state.extractInsights}
                          onChange={(e) => setState(prev => ({ ...prev, extractInsights: e.target.checked }))}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          disabled={state.uploading}
                        />
                        <span className="text-sm">Generate Insights</span>
                      </label>
                    </div>
                  </div>

                  {/* Processing Time Estimate */}
                  <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Estimated Processing Time:</span>
                    </div>
                    <div className="mt-1">
                      {state.processingType === 'quick' && 'Under 1 minute per document'}
                      {state.processingType === 'standard' && '2-5 minutes per document'}
                      {state.processingType === 'deep' && '5-10 minutes per document'}
                      {state.processingType === 'world-class' && '10-30 minutes per document'}
                    </div>
                  </div>
                </div>
              )}
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
              <UploadError 
                message={state.error} 
                onRetry={() => setState(prev => ({ ...prev, error: null }))}
              />
            )}

            {/* Upload Progress */}
            {state.uploading && (
              <div className="space-y-4">
                <FileUpload />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                  <span>{Math.round(state.progress)}%</span>
                </div>
                {state.stage && (
                  <p className="text-sm text-muted-foreground text-center">
                    {state.stage}
                  </p>
                )}
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
                  {state.uploading ? 'Processing...' : state.aiEnabled ? 'Analyze Documents with AI' : 'Upload Documents'}
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
            <div className="space-y-4">
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-success font-medium">
                  ✓ Upload Complete
                </p>
                <p className="text-xs text-success/80 mt-1">
                  {state.stage}
                </p>
              </div>
              
              {state.results && (
                <div className="p-4 bg-blue/10 border border-blue/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-blue-600">Processing Summary</span>
                  </div>
                  <div className="text-xs text-blue-600/80 space-y-1">
                    {state.results.completed > 0 && (
                      <div>• {state.results.completed} files processed immediately</div>
                    )}
                    {state.results.queued > 0 && (
                      <div>• {state.results.queued} files queued for AI analysis</div>
                    )}
                    {state.results.failed > 0 && (
                      <div>• {state.results.failed} files failed to process</div>
                    )}
                    {state.results.jobIds && state.results.jobIds.length > 0 && (
                      <div>• Background jobs: {state.results.jobIds.length}</div>
                    )}
                  </div>
                  
                  {state.results.nextSteps && (
                    <div className="mt-2 p-2 bg-blue/5 rounded text-xs text-blue-600">
                      {state.results.nextSteps}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};