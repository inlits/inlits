import { useState } from 'react';
import { storageManager, type StorageBucket } from '../storage';

interface UseStorageOptions {
  bucket: StorageBucket;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useStorage({ bucket, onSuccess, onError }: UseStorageOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (file: File, path?: string) => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const url = await storageManager.upload({
        bucket,
        file,
        path,
        onProgress: setProgress
      });

      onSuccess?.(url);
      return url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const remove = async (path: string) => {
    try {
      await storageManager.remove(bucket, path);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Remove failed');
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  return {
    upload,
    remove,
    uploading,
    progress,
    error
  };
}