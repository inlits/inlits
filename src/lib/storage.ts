import { supabase } from './supabase';
import { withRetry } from './supabase';

export type StorageBucket = 'article-covers' | 'book-covers' | 'audiobook-covers' | 'books' | 'audiobooks';

interface UploadOptions {
  bucket: StorageBucket;
  file: File;
  path?: string;
  onProgress?: (progress: number) => void;
}

interface DownloadOptions {
  bucket: StorageBucket;
  path: string;
}

class StorageManager {
  private maxRetries = 3;
  private maxFileSize = 100 * 1024 * 1024; // 100MB
  private allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/m4a'];
  private allowedBookTypes = ['application/pdf', 'application/epub+zip', 'application/x-mobipocket-ebook'];

  private validateFile(file: File, bucket: StorageBucket) {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size must be less than ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check file type based on bucket
    if (bucket.includes('covers')) {
      if (!this.allowedImageTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${this.allowedImageTypes.join(', ')}`);
      }
    } else if (bucket === 'audiobooks') {
      if (!this.allowedAudioTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${this.allowedAudioTypes.join(', ')}`);
      }
    } else if (bucket === 'books') {
      if (!this.allowedBookTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed types: ${this.allowedBookTypes.join(', ')}`);
      }
    }
  }

  private generateFilePath(file: File, customPath?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    return customPath || `${timestamp}-${randomString}.${extension}`;
  }

  async upload({ bucket, file, path, onProgress }: UploadOptions): Promise<string> {
    try {
      // Validate file
      this.validateFile(file, bucket);

      // Generate file path if not provided
      const filePath = this.generateFilePath(file, path);

      // Upload with retry mechanism
      const { data, error } = await withRetry(
        async () => {
          const uploadPromise = supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (onProgress) {
            // Mock progress for now since Supabase doesn't provide upload progress
            const interval = setInterval(() => {
              onProgress(Math.random() * 100);
            }, 100);

            const result = await uploadPromise;

            clearInterval(interval);
            onProgress(100);

            return result;
          }

          return uploadPromise;
        },
        this.maxRetries
      );

      if (error) throw error;
      if (!data) throw new Error('No data received from upload');

      // Get public URL using the new path format
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      // Verify the URL is accessible
      try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Failed to verify file access: ${response.status}`);
        }
      } catch (error) {
        console.error('File verification failed:', error);
        throw new Error('Uploaded file is not publicly accessible');
      }

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async download({ bucket, path }: DownloadOptions): Promise<Blob> {
    try {
      const { data, error } = await withRetry(
        () => supabase.storage
          .from(bucket)
          .download(path),
        this.maxRetries
      );

      if (error) throw error;
      if (!data) throw new Error('No data received');

      return data;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  async remove(bucket: StorageBucket, path: string): Promise<void> {
    try {
      const { error } = await withRetry(
        () => supabase.storage
          .from(bucket)
          .remove([path]),
        this.maxRetries
      );

      if (error) throw error;
    } catch (error) {
      console.error('Remove error:', error);
      throw error;
    }
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }
}

export const storageManager = new StorageManager();