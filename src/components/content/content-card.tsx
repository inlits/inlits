import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Star, Play } from 'lucide-react';
import { useOptimisticMutation } from '@/lib/hooks/use-optimistic-mutation';
import { supabase } from '@/lib/supabase';
import { ContentTypeIcon } from './content-type-icon';
import { ImageLoader } from '../image-loader';
import { useAuth } from '@/lib/auth';
import type { ContentItem } from '@/lib/types';

interface ContentCardProps {
  item: ContentItem & { bookmarked?: boolean };
  activeShelf?: string | null;
  onAddToShelf?: (contentId: string, contentType: string) => void;
}

export const ContentCard = memo(function ContentCard({ item, activeShelf, onAddToShelf }: ContentCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = React.useState(item.bookmarked || false);

  const { mutate: toggleBookmark } = useOptimisticMutation({
    mutationFn: async () => {
      if (!user) {
        navigate('/signin');
        return isBookmarked;
      }

      try {
        if (isBookmarked) {
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('content_id', item.id)
            .eq('content_type', item.type)
            .eq('user_id', user.id);

          if (error) throw error;
          return false;
        } else {
          const { error } = await supabase
            .from('bookmarks')
            .insert({
              content_id: item.id,
              content_type: item.type,
              user_id: user.id
            });

          if (error) throw error;
          return true;
        }
      } catch (error) {
        console.error('Bookmark operation failed:', error);
        throw error;
      }
    },
    optimisticUpdate: () => {
      setIsBookmarked(!isBookmarked);
    },
    rollbackUpdate: () => {
      setIsBookmarked(!isBookmarked);
    },
    invalidateQueries: ['bookmarks']
  });

  const handleClick = () => {
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
    }
  };

  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If we're in "add to shelf" mode, use that function instead
    if (activeShelf && onAddToShelf) {
      onAddToShelf(item.id, item.type);
      return;
    }
    
    try {
      await toggleBookmark();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Determine aspect ratio based on content type
  const getAspectRatio = () => {
    switch (item.type) {
      case 'ebook':
        return 'aspect-[2/3]'; // Book standard size
      case 'article':
      case 'podcast':
      case 'audiobook':
        return 'aspect-video'; // 16:9 ratio
      default:
        return 'aspect-video';
    }
  };

  // Safely get creator name for display
  const getCreatorName = () => {
    return item.creator?.name || 'Unknown Creator';
  };

  // Safely get creator initial for avatar fallback
  const getCreatorInitial = () => {
    const name = getCreatorName();
    return name[0]?.toUpperCase() || 'U';
  };

  return (
    <div 
      onClick={handleClick}
      className="group relative bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Thumbnail with fixed aspect ratio */}
      <div className={`relative ${getAspectRatio()}`}>
        <ImageLoader
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover"
          lowQualityUrl={`${item.thumbnail}&w=50`}
          fallback={
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ContentTypeIcon type={item.type} className="w-8 h-8 text-muted-foreground" />
            </div>
          }
        />
        
        {/* Content type badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-background/90 text-xs font-medium flex items-center gap-1 shadow-sm">
          <ContentTypeIcon type={item.type} className="w-3 h-3" />
          <span className="capitalize">{item.type}</span>
        </div>

        {/* Play button for audio content */}
        {(item.type === 'audiobook' || item.type === 'podcast') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Content Details - Three Row Layout */}
      <div className="p-3 space-y-1.5">
        {/* Title - One or two lines */}
        <h3 className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Creator Info */}
        {item.creator && (
          <Link
            to={`/creator/${item.creator.id}`}
            className="flex items-center gap-2 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0">
              <ImageLoader
                src={item.creator.avatar}
                alt={getCreatorName()}
                className="w-full h-full object-cover"
                lowQualityUrl={`${item.creator.avatar}&w=20`}
                fallback={
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-xs font-medium">
                      {getCreatorInitial()}
                    </span>
                  </div>
                }
              />
            </div>
            <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {getCreatorName()}
            </span>
          </Link>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{item.duration}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span>{item.rating?.toFixed(1) || '4.5'}</span>
          </div>
        </div>
      </div>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmarkClick}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
      >
        <Bookmark className={`w-4 h-4 ${isBookmarked || (activeShelf && item.bookmarked) ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
});