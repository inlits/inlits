import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Play, Pause } from 'lucide-react';
import { ContentTypeIcon } from '../content/content-type-icon';
import type { ContentItem } from '@/lib/types';

interface HistoryItemProps {
  item: ContentItem & { progress?: number };
}

export function HistoryItem({ item }: HistoryItemProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPlaying(!isPlaying);
  };

  const getContentUrl = () => {
    switch (item.type) {
      case 'article':
        return `/reader/article-${item.id}`;
      case 'book':
        return `/reader/book-${item.id}`;
      case 'audiobook':
      case 'podcast':
        return `/player/${item.type}-${item.id}`;
      default:
        return `/content/${item.id}`;
    }
  };

  return (
    <Link
      to={getContentUrl()}
      className="group block bg-card border rounded-lg p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          <div className="w-40 h-24 rounded-md overflow-hidden">
            <img
              src={item.thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = `https://source.unsplash.com/random/400x240?${item.type}&sig=${item.id}`;
              }}
            />
          </div>

          {/* Progress bar */}
          {item.progress !== undefined && item.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}

          {/* Play button for audio/video content */}
          {(item.type === 'audiobook' || item.type === 'podcast') && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Play className="w-5 h-5 text-primary-foreground ml-1" />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ContentTypeIcon type={item.type} className="w-4 h-4" />
                  <span className="capitalize">{item.type}</span>
                </div>
                <span>•</span>
                <span>{item.creator.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{item.duration}</span>
            </div>
          </div>

          {item.progress !== undefined && (
            <div className="mt-2 text-sm text-muted-foreground">
              {item.progress === 100 ? (
                <span className="text-primary">Completed</span>
              ) : (
                <span>{Math.round(item.progress)}% complete</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}