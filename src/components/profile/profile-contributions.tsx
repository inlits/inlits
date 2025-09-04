import React from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { MessageSquare, ThumbsUp, Users } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface Contribution {
  id: string;
  type: 'comment' | 'rating' | 'discussion';
  title: string;
  excerpt: string;
  likes: number;
  rating?: number;
  timestamp: string;
  content?: {
    name: string;
    type: string;
  };
}

export function ProfileContributions({ profile }: { profile?: any }) {
  const { user } = useAuth();
  const [contributions, setContributions] = React.useState<Contribution[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadContributions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Load comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            content_id,
            content_type
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (commentsError) throw commentsError;

        // Load ratings
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('ratings')
          .select(`
            id,
            rating,
            created_at,
            content_id,
            content_type
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (ratingsError) throw ratingsError;

        // Format contributions
        const formattedContributions: Contribution[] = [];

        // Add comments
        (commentsData || []).forEach(comment => {
          formattedContributions.push({
            id: comment.id,
            type: 'comment',
            title: `Comment on ${comment.content_type}`,
            excerpt: comment.content.substring(0, 100) + '...',
            likes: 0, // TODO: Implement comment likes
            timestamp: comment.created_at,
            content: {
              name: comment.content_type,
              type: comment.content_type
            }
          });
        });

        // Add ratings
        (ratingsData || []).forEach(rating => {
          formattedContributions.push({
            id: rating.id,
            type: 'rating',
            title: `Rated ${rating.content_type}`,
            excerpt: `Gave ${rating.rating} stars`,
            likes: 0,
            rating: rating.rating,
            timestamp: rating.created_at,
            content: {
              name: rating.content_type,
              type: rating.content_type
            }
          });
        });

        // Sort by timestamp
        formattedContributions.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setContributions(formattedContributions.slice(0, 5));
      } catch (error) {
        console.error('Error loading contributions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContributions();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Contributions</h2>
        <div className="flex items-center gap-2">
          <button className="text-sm text-primary hover:underline">
            View all
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {contributions.length > 0 ? contributions.map((contribution) => (
          <div
            key={contribution.id}
            className="bg-card border rounded-lg p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span className="capitalize">{contribution.type}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(contribution.timestamp)}</span>
                  {contribution.content && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{contribution.content.type}</span>
                    </>
                  )}
                </div>
                <h3 className="font-medium">{contribution.title}</h3>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground">
              {contribution.excerpt}
            </p>
            
            {contribution.rating && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={`text-sm ${star <= contribution.rating! ? 'text-yellow-500' : 'text-muted-foreground'}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                <ThumbsUp className="w-4 h-4" />
                <span>{contribution.likes}</span>
              </button>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No contributions yet. Start engaging with content to see your activity here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}