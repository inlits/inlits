import React, { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { FileUpload } from './file-upload';
import { ImageLoader } from '../image-loader';
import type { StorageBucket } from '@/lib/storage';

interface ImageUploadProps {
  bucket: StorageBucket;
  onUploadComplete: (url: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait';
  defaultImage?: string;
  maxSize?: number;
}

export function ImageUpload({
  bucket,
  onUploadComplete,
  onError,
  className = '',
  aspectRatio = 'square',
  defaultImage,
  maxSize = 2 * 1024 * 1024 // 2MB default for images
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImage || null);

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[2/3]'
  }[aspectRatio];

  const handleUploadComplete = (url: string) => {
    setPreviewUrl(url);
    onUploadComplete(url);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onUploadComplete('');
  };

  return (
    <div className={`relative ${aspectRatioClass} ${className}`}>
      {previewUrl ? (
        <div className="relative w-full h-full">
          <ImageLoader
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors rounded-lg group">
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleRemoveImage}
                className="p-2 rounded-full bg-white/10 backdrop-blur hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <FileUpload
          bucket={bucket}
          accept="image/jpeg,image/png,image/webp"
          maxSize={maxSize}
          onUploadComplete={handleUploadComplete}
          onError={onError}
          className="w-full h-full"
        >
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ImageIcon className="w-8 h-8 mb-2" />
            <p className="text-sm font-medium">Click or drag to upload</p>
            <p className="text-xs mt-1">Maximum size: {maxSize / 1024 / 1024}MB</p>
          </div>
        </FileUpload>
      )}
    </div>
  );
}