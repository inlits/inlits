import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause, Clock, Minus, AlertCircle } from 'lucide-react';
import { ContentTypeIcon } from '../content/content-type-icon';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { ContentItem } from '@/lib/types';

interface LibraryItemProps {
  item: ContentItem;
  onRemove?: (item: ContentItem) => Promise<void>;
  progress?: number;
}

export function LibraryItem({ item, onRemove, progress }: LibraryItemProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate a deterministic progress value based on item ID if not provided
  const itemProgress = progress !== undefined 
    ? progress 
    : item.id 
      ? parseInt(item.id.substring(0, 8), 16) % 101 // 0-100 range
      : 0;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || !onRemove) return;
    
    try {
      setIsRemoving(true);
      setError(null);
      await onRemove(item);
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Navigate based on content type
    switch (item.type) {
      case 'article':
        navigate(`/reader/article-${item.id}`);
        break;
      case 'ebook':
        navigate(`/reader/book-${item.id}`);
        break;
      case 'audiobook':
      case 'podcast':
        navigate(`/player/${item.type}-${item.id}`);
        break;
      default:
        // Default fallback
        navigate(`/content/${item.id}`);
    }
  };

  return (
    <div 
      className="group relative flex-shrink-0 w-[200px]"
      onMouseEnter={() => setShowRemove(true)}
      onMouseLeave={() => setShowRemove(false)}
    >
      {/* Remove button */}
      {showRemove && onRemove && (
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-lg border hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title="Remove from shelf"
        >
          {isRemoving ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute -top-8 right-0 z-20 p-2 bg-destructive text-destructive-foreground text-xs rounded shadow-lg whitespace-nowrap">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div 
        onClick={handleClick}
        className="cursor-pointer space-y-3"
      >
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = `https://source.unsplash.com/random/400x600?${item.type}&sig=${item.id}`;
            }}
          />
          
          {/* Content type badge */}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/90 text-xs font-medium flex items-center gap-1 shadow-sm">
            <ContentTypeIcon type={item.type} className="w-3 h-3" />
            <span className="capitalize">{item.type}</span>
          </div>

          {/* Progress bar */}
          {itemProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${itemProgress}%` }}
              />
            </div>
          )}

          {/* Play/Pause button for audio/video content */}
          {(item.type === 'audiobook' || item.type === 'podcast') && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Play className="w-6 h-6 text-primary-foreground ml-1" />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Content info */}
        <div className="space-y-1">
          <h3 className="font-medium line-clamp-2 text-sm group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {itemProgress > 0 
                ? `${Math.round(itemProgress)}% complete` 
                : item.duration}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}