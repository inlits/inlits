import { supabase } from './supabase';
import { withRetry } from './supabase';
import { validateFileUpload, logSecurityEvent } from './security';

export type StorageBucket = 'article-covers' | 'book-covers' | 'audiobook-covers' | 'books' | 'audiobooks' | 'profile-avatars' | 'profile-covers' | 'message-images';

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
    if (bucket.includes('covers') || bucket === 'profile-avatars' || bucket === 'profile-covers' || bucket === 'message-images') {
      const result = validateFileUpload(file, ['jpg', 'jpeg', 'png', 'webp'], 5 * 1024 * 1024);
      if (!result.isValid) {
        throw new Error(result.error);
      }
    } else if (bucket === 'audiobooks') {
      const result = validateFileUpload(file, ['mp3', 'wav', 'aac', 'm4a'], 100 * 1024 * 1024);
      if (!result.isValid) {
        throw new Error(result.error);
      }
    } else if (bucket === 'books') {
      const result = validateFileUpload(file, ['pdf', 'epub', 'mobi'], 50 * 1024 * 1024);
      if (!result.isValid) {
        throw new Error(result.error);
      }
    }
  }

  private generateFilePath(file: File, customPath?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    return customPath || `${timestamp}-${randomString}.${extension}`;
  }

  private sanitizeFileName(fileName: string): string {
    // Remove potentially dangerous characters
    return fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  async upload({ bucket, file, path, onProgress }: UploadOptions): Promise<string> {
    try {
      // Get user ID for security logging
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Validate file
      this.validateFile(file, bucket);

      // Generate file path if not provided
      const sanitizedPath = path ? this.sanitizeFileName(path) : null;
      const filePath = this.generateFilePath(file, sanitizedPath);

      // Log upload attempt
      await logSecurityEvent('file_upload_attempt', {
        bucket,
        fileType: file.type,
        fileSize: file.size,
        filePath
      }, userId);

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

      // Log successful upload
      await logSecurityEvent('file_upload_success', {
        bucket,
        fileType: file.type,
        fileSize: file.size,
        filePath: data.path,
        publicUrl
      }, userId);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      
      // Log upload failure
      const { data: { user } } = await supabase.auth.getUser();
      await logSecurityEvent('file_upload_failed', {
        bucket,
        fileType: file.type,
        fileSize: file.size,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, user?.id);
      
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
      // Get user ID for security logging
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Log removal attempt
      await logSecurityEvent('file_removal_attempt', {
        bucket,
        filePath: path
      }, userId);

      const { error } = await withRetry(
        () => supabase.storage
          .from(bucket)
          .remove([path]),
        this.maxRetries
      );

      if (error) throw error;

      // Log successful removal
      await logSecurityEvent('file_removal_success', {
        bucket,
        filePath: path
      }, userId);
    } catch (error) {
      console.error('Remove error:', error);
      
      // Log removal failure
      const { data: { user } } = await supabase.auth.getUser();
      await logSecurityEvent('file_removal_failed', {
        bucket,
        filePath: path,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, user?.id);
      
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