import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import { storageManager, type StorageBucket } from '@/lib/storage';

interface FileUploadProps {
  bucket: StorageBucket;
  onUploadComplete: (url: string) => void;
  onError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  bucket,
  onUploadComplete,
  onError,
  accept,
  maxSize = 100 * 1024 * 1024, // 100MB default
  className = '',
  children
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    await handleFiles(files);
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    await handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const file = files[0]; // Only handle first file for now

    // Validate file size
    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      onError?.(new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`));
      return;
    }

    // Validate file type
    if (accept && !accept.split(',').some(type => file.type.match(type.trim()))) {
      setError(`Invalid file type. Accepted types: ${accept}`);
      onError?.(new Error(`Invalid file type. Accepted types: ${accept}`));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const url = await storageManager.upload({
        bucket,
        file,
        onProgress: setProgress
      });

      onUploadComplete(url);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed');
      setError(error.message);
      onError?.(error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative ${className}`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        disabled={uploading}
      />

      <div
        className={`w-full h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : error
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-muted-foreground/20 hover:border-primary/50'
        }`}
      >
        {children || (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-2 animate-spin text-primary" />
                <p className="text-sm font-medium">Uploading... {progress.toFixed(0)}%</p>
              </>
            ) : error ? (
              <>
                <AlertCircle className="w-8 h-8 mb-2 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop file here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file size: {maxSize / 1024 / 1024}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}