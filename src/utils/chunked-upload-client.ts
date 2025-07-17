/**
 * Client-side chunked upload utility for handling large files
 * Breaks files into smaller chunks to bypass Vercel's 4.5MB limit
 */

export interface ChunkedUploadOptions {
  file: File;
  chunkSize?: number; // Default 2MB chunks
  category?: string;
  source?: string;
  tags?: string;
  onProgress?: (progress: number) => void;
  onChunkUploaded?: (chunkIndex: number, totalChunks: number) => void;
  onComplete?: (documentId: string) => void;
  onError?: (error: string) => void;
}

export interface ChunkedUploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export class ChunkedUploader {
  private readonly DEFAULT_CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks
  private readonly apiEndpoint = '/api/documents/chunked-upload';

  async uploadFile(options: ChunkedUploadOptions): Promise<ChunkedUploadResult> {
    const {
      file,
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      category = 'general',
      source = 'upload',
      tags = '',
      onProgress,
      onChunkUploaded,
      onComplete,
      onError
    } = options;

    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Only PDF files are supported');
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File too large (maximum 50MB)');
      }

      // Generate unique upload ID
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalChunks = Math.ceil(file.size / chunkSize);

      console.log(`[ChunkedUploader] Starting upload: ${file.name} (${file.size} bytes, ${totalChunks} chunks)`);

      let documentId: string | undefined;

      // Upload chunks sequentially
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        console.log(`[ChunkedUploader] Uploading chunk ${chunkIndex + 1}/${totalChunks} (${chunk.size} bytes)`);

        const formData = new FormData();
        formData.append('file', chunk, `${file.name}_chunk_${chunkIndex}`);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('uploadId', uploadId);
        formData.append('originalName', file.name);
        formData.append('category', category);
        formData.append('source', source);
        formData.append('tags', tags);

        try {
          const response = await fetch(this.apiEndpoint, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Chunk upload failed: ${response.status} ${response.statusText}`);
          }

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || 'Chunk upload failed');
          }

          // Track document ID from final chunk
          if (result.documentId) {
            documentId = result.documentId;
          }

          // Report progress
          const progress = ((chunkIndex + 1) / totalChunks) * 100;
          onProgress?.(progress);
          onChunkUploaded?.(chunkIndex, totalChunks);

          console.log(`[ChunkedUploader] Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`);

        } catch (error) {
          const errorMessage = `Failed to upload chunk ${chunkIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`[ChunkedUploader] ${errorMessage}`);
          onError?.(errorMessage);
          return { success: false, error: errorMessage };
        }
      }

      console.log(`[ChunkedUploader] All chunks uploaded successfully. Document ID: ${documentId}`);

      if (documentId) {
        onComplete?.(documentId);
        return { success: true, documentId };
      } else {
        throw new Error('Upload completed but no document ID received');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      console.error(`[ChunkedUploader] Upload failed: ${errorMessage}`);
      onError?.(errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Monitor processing status via Server-Sent Events
   */
  async monitorProcessing(
    documentId: string,
    onProgress?: (status: string, message: string, progress?: number) => void,
    onComplete?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch('/api/documents/stream-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        throw new Error(`Monitoring failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body not readable');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                onError?.(data.error);
                return;
              }

              if (data.status === 'completed') {
                onComplete?.(data);
                return;
              }

              onProgress?.(data.status, data.message, data.progress);

            } catch (parseError) {
              console.warn('[ChunkedUploader] Failed to parse SSE data:', line);
            }
          }
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Monitoring failed';
      console.error(`[ChunkedUploader] Monitoring error: ${errorMessage}`);
      onError?.(errorMessage);
    }
  }
}

// Export singleton instance
export const chunkedUploader = new ChunkedUploader();