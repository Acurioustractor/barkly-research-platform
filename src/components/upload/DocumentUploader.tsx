'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadResult {
  documentId: string;
  status: 'COMPLETED' | 'FAILED' | 'PROCESSING';
  progress: number;
  message: string;
  metrics: {
    chunks: number;
    themes: number;
    quotes: number;
    insights: number;
    processingTime: number;
  };
  error?: string;
}

interface UploadSummary {
  totalFiles: number;
  successful: number;
  failed: number;
  totalProcessingTime: number;
  metrics: {
    totalChunks: number;
    totalThemes: number;
    totalQuotes: number;
    totalInsights: number;
  };
}

export function DocumentUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [summary, setSummary] = useState<UploadSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Processing options
  const [enableAI, setEnableAI] = useState(true);
  const [category, setCategory] = useState('general');
  const [source, setSource] = useState('upload');
  const [tags, setTags] = useState('');

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      if (file.type !== 'application/pdf') {
        alert(`${file.name} is not a PDF file`);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name} is larger than 50MB`);
        return false;
      }
      return true;
    });

    setFiles(validFiles);
    setResults([]);
    setSummary(null);
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    setResults([]);
    setSummary(null);

    try {
      const formData = new FormData();
      
      // Add files
      files.forEach(file => {
        formData.append('files', file);
      });

      // Add options
      formData.append('enableAI', enableAI.toString());
      formData.append('category', category);
      formData.append('source', source);
      formData.append('tags', tags);

      const response = await fetch('/api/documents/test-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResults(data.results);
      setSummary(data.summary);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'PROCESSING':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Research Documents</h2>
        
        {/* File Selection */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-900">Choose PDF files</span>
              <p className="text-gray-500 mt-1">Up to 20 files, 50MB each</p>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Selected Files ({files.length})</h3>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    <FileText className="w-4 h-4" />
                    <span className="flex-1">{file.name}</span>
                    <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="general">General Research</option>
                <option value="youth_voice">Youth Voice</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="culture">Cultural</option>
                <option value="policy">Policy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="upload">Manual Upload</option>
                <option value="community_research">Community Research</option>
                <option value="interview">Interview</option>
                <option value="survey">Survey</option>
                <option value="policy_doc">Policy Document</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., youth, education, barkly"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableAI}
                  onChange={(e) => setEnableAI(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Enable AI Analysis (themes, quotes, insights)
                </span>
              </label>
            </div>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Documents...</span>
              </span>
            ) : (
              `Upload ${files.length} Document${files.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-800">Upload Failed</h3>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-2">Processing Complete</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-600 font-medium">{summary.successful}</span>
              <span className="text-green-700"> successful</span>
            </div>
            <div>
              <span className="text-red-600 font-medium">{summary.failed}</span>
              <span className="text-green-700"> failed</span>
            </div>
            <div>
              <span className="text-blue-600 font-medium">{summary.metrics?.totalThemes || 0}</span>
              <span className="text-green-700"> themes</span>
            </div>
            <div>
              <span className="text-purple-600 font-medium">{summary.metrics?.totalQuotes || 0}</span>
              <span className="text-green-700"> quotes</span>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Processing Results</h3>
          </div>
          <div className="divide-y">
            {results.map((result, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium text-gray-900">
                      {files[index]?.name || `Document ${index + 1}`}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {result.metrics.processingTime}ms
                  </span>
                </div>
                
                {result.status === 'COMPLETED' && (
                  <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>{result.metrics.chunks} chunks</div>
                    <div>{result.metrics.themes} themes</div>
                    <div>{result.metrics.quotes} quotes</div>
                    <div>{result.metrics.insights} insights</div>
                  </div>
                )}
                
                {result.error && (
                  <p className="text-sm text-red-600 mt-1">{result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}