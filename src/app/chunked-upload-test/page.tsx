'use client';

import { useState } from 'react';
import { chunkedUploader } from '@/utils/chunked-upload-client';

export default function ChunkedUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProgress(0);
      setStatus('');
      setDocumentId(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setStatus('Starting upload...');

    try {
      const result = await chunkedUploader.uploadFile({
        file,
        category: 'test',
        source: 'chunked-upload-test',
        tags: 'large-file-test',
        onProgress: (prog) => {
          setProgress(prog);
          setStatus(`Uploading... ${Math.round(prog)}%`);
        },
        onChunkUploaded: (chunkIndex, totalChunks) => {
          setStatus(`Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
        },
        onComplete: (docId) => {
          setDocumentId(docId);
          setStatus('Upload complete! Starting processing...');
          startProcessingMonitor(docId);
        },
        onError: (error) => {
          setStatus(`Upload failed: ${error}`);
        }
      });

      if (result.success) {
        setStatus('Upload completed successfully');
      } else {
        setStatus(`Upload failed: ${result.error}`);
      }

    } catch (error) {
      setStatus(`Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const startProcessingMonitor = async (docId: string) => {
    setProcessing(true);
    setProcessingProgress(0);
    setProcessingStatus('Starting processing...');

    try {
      await chunkedUploader.monitorProcessing(
        docId,
        (status, message, progress) => {
          setProcessingStatus(`${status}: ${message}`);
          if (progress !== undefined) {
            setProcessingProgress(progress);
          }
        },
        () => {
          setProcessingStatus('Processing completed successfully!');
          setProcessing(false);
        },
        (error) => {
          setProcessingStatus(`Processing failed: ${error}`);
          setProcessing(false);
        }
      );
    } catch (error) {
      setProcessingStatus(`Monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Chunked Upload Test</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select PDF File (supports large files up to 50MB)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={uploading || processing}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p><strong>File:</strong> {file.name}</p>
            <p><strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong>Chunks:</strong> {Math.ceil(file.size / (2 * 1024 * 1024))}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading || processing}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : processing ? 'Processing...' : 'Upload File'}
        </button>

        {status && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{status}</p>
            {uploading && (
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-600 mt-1">{Math.round(progress)}% complete</p>
              </div>
            )}
          </div>
        )}

        {documentId && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800"><strong>Document ID:</strong> {documentId}</p>
          </div>
        )}

        {processing && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">{processingStatus}</p>
            <div className="mt-2">
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-yellow-600 mt-1">{Math.round(processingProgress)}% complete</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="font-semibold mb-2">How it works:</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Files are split into 2MB chunks to bypass Vercel's 4.5MB limit</li>
          <li>• Each chunk is uploaded separately using Edge Functions</li>
          <li>• Processing uses streaming for real-time progress updates</li>
          <li>• Edge Functions provide better timeout handling (60s vs 25s)</li>
          <li>• Supports files up to 50MB with proper progress tracking</li>
        </ul>
      </div>
    </div>
  );
}