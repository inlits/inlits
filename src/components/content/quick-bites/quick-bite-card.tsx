import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { useOptimisticMutation } from '@/lib/hooks/use-optimistic-mutation';
import { supabase } from '@/lib/supabase';

export interface QuickBite {
  id: string;
  content: string;
  type: 'quote' | 'poetry' | 'thought';
  creator: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  likes: number;
  comments: number;
  createdAt: string;
  liked?: boolean;
  saved?: boolean;
}

interface QuickBiteCardProps {
  bite: QuickBite;
}

export function QuickBiteCard({ bite }: QuickBiteCardProps) {
  const [isLiked, setIsLiked] = React.useState(bite.liked || false);
  const [likeCount, setLikeCount] = React.useState(bite.likes);

  const { mutate: toggleLike } = useOptimisticMutation({
    mutationFn: async () => {
      if (isLiked) {
        const { error } = await supabase
          .from('quick_bite_likes')
          .delete()
          .eq('bite_id', bite.id);

        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from('quick_bite_likes')
          .insert({ bite_id: bite.id });

        if (error) throw error;
        return true;
      }
    },
    optimisticUpdate: () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => prev + (isLiked ? -1 : 1));
    },
    rollbackUpdate: () => {
      setIsLiked(!isLiked);
      setLikeCount(prev => prev + (isLiked ? 1 : -1));
    },
    invalidateQueries: [`quick-bites:${bite.id}`]
  });

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await toggleLike();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="bg-card border rounded-lg overflow-hidden mb-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <Link 
          to={`/creator/${bite.creator.id}`}
          className="flex items-center gap-2"
        >
          <img
            src={bite.creator.avatar}
            alt={bite.creator.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-medium">{bite.creator.username}</span>
              {bite.creator.verified && (
                <span className="text-primary">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{bite.creator.name}</p>
          </div>
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 py-6 bg-muted/30">
        <p className="text-lg whitespace-pre-line" style={{ fontFamily: 'Georgia, serif' }}>
          {bite.content}
        </p>
        <div className="mt-2">
          <span className="text-sm text-muted-foreground">#{bite.type}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLikeClick}
            className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{likeCount}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{bite.comments}</span>
          </button>
          <button className="hover:text-primary transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <button 
          className={`${bite.saved ? 'text-primary' : 'hover:text-primary'} transition-colors`}
        >
          <Bookmark className={`w-5 h-5 ${bite.saved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}