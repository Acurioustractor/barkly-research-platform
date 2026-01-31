import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface StoredFile {
  id: string;
  originalName: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
  hash: string;
  url: string;
}

class FileStorageService {
  private readonly storageDir = path.join(process.cwd(), 'public', 'documents');
  private readonly baseUrl = '/documents';

  /**
   * Initialize storage directory
   */
  async ensureStorageDir(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
      throw new Error('Storage system unavailable');
    }
  }

  /**
   * Store file and return storage information
   */
  async storeFile(file: File): Promise<StoredFile> {
    await this.ensureStorageDir();

    // Generate file info
    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileId = crypto.randomUUID();
    const extension = path.extname(file.name) || '';
    const filename = `${fileId}${extension}`;
    const filepath = path.join(this.storageDir, filename);
    const url = `${this.baseUrl}/${filename}`;

    // Check if file already exists (deduplication)
    const existingFile = await this.findFileByHash(hash);
    if (existingFile) {
      console.log(`File already exists with hash ${hash}, returning existing file`);
      return existingFile;
    }

    // Write file to storage
    try {
      await fs.writeFile(filepath, buffer);
      console.log(`Stored file: ${filepath} (${buffer.length} bytes)`);
    } catch (error) {
      console.error('Failed to write file:', error);
      throw new Error('Failed to store file');
    }

    const storedFile: StoredFile = {
      id: fileId,
      originalName: file.name,
      filename,
      filepath,
      mimeType: file.type,
      size: file.size,
      hash,
      url
    };

    return storedFile;
  }

  /**
   * Retrieve file by filename
   */
  async getFile(filename: string): Promise<Buffer | null> {
    const filepath = path.join(this.storageDir, filename);
    
    try {
      const buffer = await fs.readFile(filepath);
      return buffer;
    } catch (error) {
      console.error(`Failed to read file ${filepath}:`, error);
      return null;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    const filepath = path.join(this.storageDir, filename);
    
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file info without reading content
   */
  async getFileInfo(filename: string): Promise<{ size: number; mtime: Date } | null> {
    const filepath = path.join(this.storageDir, filename);
    
    try {
      const stats = await fs.stat(filepath);
      return {
        size: stats.size,
        mtime: stats.mtime
      };
    } catch {
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filename: string): Promise<boolean> {
    const filepath = path.join(this.storageDir, filename);
    
    try {
      await fs.unlink(filepath);
      console.log(`Deleted file: ${filepath}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete file ${filepath}:`, error);
      return false;
    }
  }

  /**
   * Find file by hash (for deduplication)
   */
  private async findFileByHash(hash: string): Promise<StoredFile | null> {
    // This would typically query the database for existing files with the same hash
    // For now, we'll skip deduplication and always store new files
    return null;
  }

  /**
   * Get public URL for file
   */
  getFileUrl(filename: string): string {
    return `${this.baseUrl}/${filename}`;
  }

  /**
   * List all files in storage
   */
  async listFiles(): Promise<string[]> {
    try {
      await this.ensureStorageDir();
      const files = await fs.readdir(this.storageDir);
      return files.filter(file => !file.startsWith('.'));
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }
}

export const fileStorage = new FileStorageService();