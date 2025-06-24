import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useLocation, Link } from 'react-router-dom';
import { AudioPlayer } from '@/components/audio/audio-player';
import { useAudio } from '@/lib/audio-context';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  AlertCircle, 
  Heart, 
  Share2, 
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface AudioContent {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
    verified?: boolean;
  };
  thumbnail: string;
  audio_url?: string;
  chapters?: Array<{
    id: number;
    title: string;
    audio_url: string;
    duration: string;
  }>;
  type: 'audiobook' | 'podcast';
  category?: string;
  rating?: number;
  views?: number;
  likes?: number;
}

interface Review {
  id: string;
  author: {
    name: string;
    avatar: string;
    username: string;
  };
  rating: number;
  content: string;
  created_at: string;
  likes: number;
  replies?: Review[];
}

export function PlayerPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { setCurrentAudio, setPlayerVisible } = useAudio();
  const [content, setContent] = useState<AudioContent | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Get content type and ID from the URL
  // Format: article-uuid or book-uuid
  const [contentType, contentId] = id?.includes('-') 
    ? [id.split('-')[0], id.substring(id.indexOf('-') + 1)] 
    : [null, null];

  useEffect(() => {
    const loadContent = async () => {
      if (!contentType || !contentId) return;

      try {
        setLoading(true);
        setError(null);

        // Load content based on type
        const table = contentType === 'audiobook' ? 'audiobooks' : 'podcast_episodes';
        const { data: contentData, error: contentError } = await supabase
          .from(table)
          .select(`
            *,
            author:profiles!${table}_author_id_fkey (
              id,
              name,
              username,
              avatar_url,
              verified
            ),
            chapters:audiobook_chapters (*)
          `)
          .eq('id', contentId)
          .eq('status', 'published')
          .single();

        if (contentError) throw contentError;
        if (!contentData) throw new Error('Content not found');

        // Format content data
        const formattedContent: AudioContent = {
          id: contentData.id,
          title: contentData.title,
          description: contentData.description,
          author: {
            id: contentData.author.id,
            name: contentData.author.name || contentData.author.username,
            username: contentData.author.username,
            // Ensure we have a fallback for avatar
            avatar: contentData.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${contentData.author.id}`,
            verified: contentData.author.verified
          },
          thumbnail: contentData.cover_url || `https://source.unsplash.com/random/800x800?${contentType}&sig=${contentData.id}`,
          audio_url: contentData.audio_url,
          chapters: contentData.chapters?.sort((a: any, b: any) => a.order - b.order),
          type: contentType as 'audiobook' | 'podcast',
          category: contentData.category,
          rating: 0,
          views: 0,
          likes: 0
        };

        setContent(formattedContent);

        // Set audio context with the correct data
        setCurrentAudio({
          title: formattedContent.title,
          author: formattedContent.author.name,
          thumbnail: formattedContent.thumbnail,
          contentUrl: location.pathname,
          audioUrl: formattedContent.audio_url,
          chapters: formattedContent.chapters,
          type: formattedContent.type
        });
        setPlayerVisible(true);

        // Load reviews
        const { data: commentsData } = await supabase
          .from('comments')
          .select(`
            *,
            author:profiles!comments_user_id_fkey (
              name,
              username,
              avatar_url
            )
          `)
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .order('created_at', { ascending: false });

        if (commentsData && commentsData.length > 0) {
          setReviews(commentsData.map(comment => ({
            id: comment.id,
            author: {
              name: comment.author.name || comment.author.username,
              username: comment.author.username,
              avatar: comment.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${comment.id}`
            },
            rating: comment.rating || 0,
            content: comment.content,
            created_at: comment.created_at,
            likes: 0
          })));
        }

        // Record view if user is logged in
        if (user) {
          await supabase
            .from('content_views')
            .insert({
              content_id: contentId,
              content_type: contentType,
              viewer_id: user.id,
              viewed_at: new Date().toISOString()
            });
        }
      } catch (err) {
        console.error('Error loading content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [contentType, contentId, user, location.pathname, setCurrentAudio, setPlayerVisible]);

  const handleLike = async () => {
    if (!user || !content) return;

    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);

      // Update likes in database
      const { error } = await supabase
        .from('content_likes')
        .upsert({
          user_id: user.id,
          content_id: content.id,
          content_type: contentType,
          liked: newLikedState
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating like:', error);
      setIsLiked(!isLiked); // Revert on error
    }
  };

  const handleShare = async () => {
    try {
      // First try Web Share API
      if (navigator.share && navigator.canShare?.({
        title: content?.title,
        text: `Check out "${content?.title}" by ${content?.author.name}`,
        url: window.location.href
      })) {
        await navigator.share({
          title: content?.title,
          text: `Check out "${content?.title}" by ${content?.author.name}`,
          url: window.location.href
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      // Only show error if it's not a user cancellation
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content || !newReview.trim() || !userRating) return;

    setSubmittingReview(true);
    try {
      const { error: reviewError } = await supabase
        .from('comments')
        .insert({
          content: newReview,
          user_id: user.id,
          content_id: content.id,
          content_type: contentType,
          rating: userRating
        });

      if (reviewError) throw reviewError;

      // Reload reviews
      const { data: newReviews } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!comments_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .eq('content_id', content.id)
        .eq('content_type', contentType)
        .order('created_at', { ascending: false });

      if (newReviews) {
        setReviews(newReviews.map(review => ({
          id: review.id,
          author: {
            name: review.author.name || review.author.username,
            username: review.author.username,
            avatar: review.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${review.author.id}`
          },
          rating: review.rating || 0,
          content: review.content,
          created_at: review.created_at,
          likes: 0
        })));
      }
      setNewReview('');
      setUserRating(0);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!contentType || !contentId) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-semibold">Content not found</h1>
          <p className="text-muted-foreground">
            {error || "The content you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        {/* Cover Image */}
        <div className="aspect-square max-w-sm mx-auto mb-8 rounded-lg overflow-hidden bg-muted">
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.src = `https://source.unsplash.com/random/800x800?${content.type}&sig=${content.id}`;
            }}
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6">{content.title}</h1>

        {/* Author and Social Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b pb-6 gap-4">
          {/* Author Info */}
          <Link 
            to={`/creator/${content.author.username}`}
            className="flex items-center gap-3 hover:text-primary transition-colors"
          >
            <img
              src={content.author.avatar}
              alt={content.author.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = `https://source.unsplash.com/random/100x100?face&sig=${content.author.id}`;
              }}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{content.author.name}</span>
                {content.author.verified && (
                  <span className="text-primary">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{content.author.username}</p>
            </div>
          </Link>

          {/* Social Actions */}
          {user ? (
            <div className="flex items-center gap-6">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 ${
                  isLiked ? 'text-red-500' : 'hover:text-red-500'
                } transition-colors`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{content.likes}</span>
              </button>

              <button
                onClick={() => window.location.href = '#reviews'}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">{reviews.length}</span>
              </button>

              <button
                onClick={handleShare}
                className="hover:text-primary transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => setUserRating(star)}
                    className={`p-1 ${star <= userRating ? 'text-yellow-500' : 'text-muted-foreground'}`}
                  >
                    <Star className={`w-5 h-5 ${star <= userRating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Link 
              to="/signin" 
              className="text-sm text-primary hover:underline"
            >
              Sign in to rate and review
            </Link>
          )}
        </div>

        {/* Description */}
        <div className="mb-8">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center justify-between w-full py-2 text-sm font-medium"
          >
            <span>Description</span>
            {showDescription ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showDescription && (
            <p className="mt-2 text-sm text-muted-foreground">
              {content.description}
            </p>
          )}
        </div>

        {/* Reviews & Discussions */}
        <div id="reviews" className="space-y-6">
          <h2 className="text-lg font-semibold">
            Reviews & Discussions ({reviews.length})
          </h2>

          {user ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Write a review..."
                className="w-full h-24 px-3 py-2 text-sm rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newReview.trim() || !userRating || submittingReview}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Posting...' : 'Post Review'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Please <Link to="/signin" className="text-primary hover:underline">sign in</Link> to review
              </p>
            </div>
          )}

          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="space-y-3 pb-6 border-b last:border-0">
                <Link 
                  to={`/creator/${review.author.username}`}
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <img
                    src={review.author.avatar}
                    alt={review.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = `https://source.unsplash.com/random/100x100?face&sig=${review.id}`;
                    }}
                  />
                  <div>
                    <div className="font-medium">{review.author.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'text-yellow-500 fill-current'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm">{review.content}</p>

                <div className="flex items-center gap-4">
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Like ({review.likes})
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Reply
                  </button>
                </div>

                {/* Replies */}
                {review.replies?.map((reply) => (
                  <div key={reply.id} className="ml-12 space-y-3 mt-4 pt-4 border-t">
                    <Link 
                      to={`/creator/${reply.author.username}`}
                      className="flex items-center gap-3 hover:text-primary transition-colors"
                    >
                      <img
                        src={reply.author.avatar}
                        alt={reply.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = `https://source.unsplash.com/random/100x100?face&sig=${reply.id}`;
                        }}
                      />
                      <div>
                        <div className="font-medium text-sm">{reply.author.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(reply.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                    <p className="text-sm">{reply.content}</p>
                    <div className="flex items-center gap-4">
                      <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Like ({reply.likes})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No reviews yet. Be the first to review!
              </div>
            )}
          </div>
        </div>
      </div>

      <AudioPlayer
        title={content.title}
        author={content.author.name}
        thumbnail={content.thumbnail}
        type={content.type}
      />
    </div>
  );
}