import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Share2, 
  MessageSquare, 
  Heart, 
  ChevronUp, 
  X, 
  AlertCircle, 
  Bookmark,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface ArticleReaderProps {
  article: {
    id: string;
    title: string;
    content: string;
    author: {
      id: string;
      name: string;
      avatar: string;
      username?: string;
    };
    publishedAt: string;
    readTime: string;
    claps: number;
    comments: Comment[];
    category?: string;
    cover_url?: string;
  };
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
    username?: string;
  };
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

export function ArticleReader({ article }: ArticleReaderProps) {
  const { user } = useAuth();
  const [claps, setClaps] = useState(article.claps);
  const [hasClapped, setHasClapped] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle');
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState<Comment[]>(article.comments || []);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const articleRef = useRef<HTMLDivElement>(null);
  const shareOptionsRef = useRef<HTMLDivElement>(null);

  // Check if article is bookmarked
  useEffect(() => {
    if (!user) return;
    
    const checkBookmark = async () => {
      const { data } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', article.id)
        .eq('content_type', 'article')
        .single();
      
      setIsBookmarked(!!data);
    };
    
    checkBookmark();
  }, [user, article.id]);

  // Check if user has clapped
  useEffect(() => {
    if (!user) return;
    
    const checkClap = async () => {
      const { data } = await supabase
        .from('content_likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', article.id)
        .eq('content_type', 'article')
        .single();
      
      setHasClapped(!!data);
    };
    
    checkClap();
  }, [user, article.id]);

  // Handle scroll to track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;
      
      const totalHeight = articleRef.current.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
      
      // Show scroll to top button when user scrolls down
      setShowScrollToTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close share options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target as Node)) {
        setShowShareOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Record view
  useEffect(() => {
    const recordView = async () => {
      if (!user) return;
      
      try {
        await supabase
          .from('content_views')
          .insert({
            content_id: article.id,
            content_type: 'article',
            viewer_id: user.id,
            viewed_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };
    
    recordView();
  }, [article.id, user]);

  const handleClap = async () => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    try {
      const newClapState = !hasClapped;
      setHasClapped(newClapState);
      setClaps(prev => newClapState ? prev + 1 : prev - 1);

      if (newClapState) {
        await supabase
          .from('content_likes')
          .insert({
            user_id: user.id,
            content_id: article.id,
            content_type: 'article'
          });
      } else {
        await supabase
          .from('content_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', article.id)
          .eq('content_type', 'article');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert UI state on error
      setHasClapped(!hasClapped);
      setClaps(prev => hasClapped ? prev - 1 : prev + 1);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);

      if (newBookmarkState) {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            content_id: article.id,
            content_type: 'article'
          });
      } else {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('content_id', article.id)
          .eq('content_type', 'article');
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      // Revert UI state on error
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleShare = async (platform?: string) => {
    try {
      const url = window.location.href;
      const title = article.title;
      const text = `Check out "${title}" by ${article.author.name}`;
      
      if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        setShareStatus('shared');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setShareStatus('shared');
      } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        setShareStatus('shared');
      } else if (platform === 'copy' || !platform) {
        await navigator.clipboard.writeText(url);
        setShareStatus('copied');
      } else if (navigator.share) {
        await navigator.share({
          title,
          text,
          url
        });
        setShareStatus('shared');
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus('copied');
      }

      // Reset status after 2 seconds
      setTimeout(() => {
        setShareStatus('idle');
        setShowShareOptions(false);
      }, 2000);
    } catch (error) {
      // Only show error if it's not a user cancellation
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        setShareStatus('error');
        setTimeout(() => {
          setShareStatus('idle');
        }, 2000);
      }
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          user_id: user.id,
          content_id: article.id,
          content_type: 'article'
        })
        .select(`
          id, 
          content, 
          created_at,
          user_id,
          author:profiles!comments_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Add new comment to the list
      const newCommentObj: Comment = {
        id: data.id,
        content: data.content,
        createdAt: data.created_at,
        author: {
          name: data.author.name || data.author.username,
          avatar: data.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${data.user_id}`,
          username: data.author.username
        },
        likes: 0
      };

      setComments([newCommentObj, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background" ref={articleRef}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div 
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Category */}
        {article.category && (
          <div className="mb-4">
            <span className="text-sm text-primary font-medium">{article.category}</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{article.title}</h1>

        {/* Author Info */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to={`/creator/${article.author.username || article.author.id}`}
            className="flex items-center gap-3 group"
          >
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                img.src = `https://source.unsplash.com/random/100x100?face&sig=${article.author.id}`;
              }}
            />
            <div>
              <h3 className="font-medium group-hover:text-primary transition-colors">{article.author.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{formatDate(article.publishedAt)}</span>
                <span>•</span>
                <span>{article.readTime}</span>
              </div>
            </div>
          </Link>

          {/* Share and Bookmark Buttons */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={shareOptionsRef}>
              <button
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Share article"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              {showShareOptions && (
                <div className="absolute right-0 mt-2 p-2 bg-background border rounded-lg shadow-lg z-10 w-48">
                  <div className="space-y-1">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center gap-2 w-full p-2 text-sm hover:bg-muted rounded-md transition-colors text-left"
                    >
                      <Twitter className="w-4 h-4" />
                      <span>Share on Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="flex items-center gap-2 w-full p-2 text-sm hover:bg-muted rounded-md transition-colors text-left"
                    >
                      <Facebook className="w-4 h-4" />
                      <span>Share on Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="flex items-center gap-2 w-full p-2 text-sm hover:bg-muted rounded-md transition-colors text-left"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>Share on LinkedIn</span>
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex items-center gap-2 w-full p-2 text-sm hover:bg-muted rounded-md transition-colors text-left"
                    >
                      {shareStatus === 'copied' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span>{shareStatus === 'copied' ? 'Copied!' : 'Copy link'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleBookmark}
              className={`p-2 rounded-full hover:bg-muted transition-colors ${isBookmarked ? 'text-primary' : ''}`}
              aria-label={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cover Image */}
        {article.cover_url && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none mb-12 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Article Footer */}
        <div className="border-t pt-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Author Info (Mobile) */}
            <div className="flex items-center gap-4">
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{article.author.name}</h3>
                <Link 
                  to={`/creator/${article.author.username || article.author.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View profile
                </Link>
              </div>
            </div>

            {/* Social Actions */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleClap}
                className={`flex items-center gap-2 ${
                  hasClapped ? 'text-primary' : 'hover:text-primary'
                } transition-colors`}
              >
                <Heart className={`w-5 h-5 ${hasClapped ? 'fill-current' : ''}`} />
                <span>{claps}</span>
              </button>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span>{comments.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className={`border-t pt-8 ${showComments ? 'block' : 'hidden'}`}>
          <h2 className="text-xl font-semibold mb-6">Comments ({comments.length})</h2>
          
          {user ? (
            <form onSubmit={handleComment} className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add to the discussion..."
                className="w-full px-4 py-3 rounded-lg border bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingComment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-muted/30 rounded-lg p-6 text-center mb-8">
              <p className="mb-4">Sign in to join the conversation</p>
              <Link 
                to="/signin" 
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          <div className="space-y-8">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="space-y-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-10 h-10 rounded-full object-cover mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{comment.author.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          Like ({comment.likes})
                        </button>
                        <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-12 space-y-4 border-l-2 border-muted pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <img
                            src={reply.author.avatar}
                            alt={reply.author.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-sm">{reply.author.name}</h5>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm">{reply.content}</p>
                            <button className="text-xs text-muted-foreground hover:text-primary transition-colors mt-1">
                              Like ({reply.likes})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {showScrollToTop && (
          <button
            onClick={scrollToTop}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Comments Sidebar (Mobile) */}
      {showComments && (
        <div className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-background h-full overflow-auto shadow-lg border-l">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h2 className="font-semibold">Comments ({comments.length})</h2>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {user ? (
                <form onSubmit={handleComment} className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add to the discussion..."
                    className="w-full px-4 py-3 rounded-lg border bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-muted/30 rounded-lg p-6 text-center mb-6">
                  <p className="mb-4">Sign in to join the conversation</p>
                  <Link 
                    to="/signin" 
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              <div className="space-y-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-6 last:border-0">
                      <div className="flex items-start gap-3">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{comment.author.name}</h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                              Like ({comment.likes})
                            </button>
                            <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-12 mt-4 space-y-4 border-l-2 border-muted pl-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-3">
                              <img
                                src={reply.author.avatar}
                                alt={reply.author.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-medium text-sm">{reply.author.name}</h5>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.content}</p>
                                <button className="text-xs text-muted-foreground hover:text-primary transition-colors mt-1">
                                  Like ({reply.likes})
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Status Toast */}
      {shareStatus !== 'idle' && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg bg-background border shadow-lg text-sm flex items-center gap-2 z-50">
          {shareStatus === 'copied' && (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span>Link copied to clipboard</span>
            </>
          )}
          {shareStatus === 'shared' && (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span>Shared successfully</span>
            </>
          )}
          {shareStatus === 'error' && (
            <>
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span>Failed to share</span>
            </>
          )}
        </div>
      )}

      {/* Floating Action Bar (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t py-3 px-4 flex items-center justify-between z-40">
        <button
          onClick={handleClap}
          className={`flex items-center gap-2 ${
            hasClapped ? 'text-primary' : 'hover:text-primary'
          } transition-colors`}
        >
          <Heart className={`w-5 h-5 ${hasClapped ? 'fill-current' : ''}`} />
          <span>{claps}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span>{comments.length}</span>
        </button>

        <button
          onClick={() => setShowShareOptions(!showShareOptions)}
          className="hover:text-primary transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button
          onClick={handleBookmark}
          className={`hover:text-primary transition-colors ${isBookmarked ? 'text-primary' : ''}`}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Floating Side Actions (Desktop) */}
      <div className="hidden md:flex fixed left-[calc(50%-350px-80px)] top-1/3 flex-col items-center gap-6 transform -translate-x-full">
        <button
          onClick={handleClap}
          className={`flex flex-col items-center gap-1 group ${
            hasClapped ? 'text-primary' : 'hover:text-primary'
          } transition-colors`}
        >
          <div className="p-3 rounded-full border group-hover:border-primary transition-colors">
            <Heart className={`w-5 h-5 ${hasClapped ? 'fill-current' : ''}`} />
          </div>
          <span className="text-sm">{claps}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex flex-col items-center gap-1 group hover:text-primary transition-colors"
        >
          <div className="p-3 rounded-full border group-hover:border-primary transition-colors">
            <MessageSquare className="w-5 h-5" />
          </div>
          <span className="text-sm">{comments.length}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="flex flex-col items-center gap-1 group hover:text-primary transition-colors"
          >
            <div className="p-3 rounded-full border group-hover:border-primary transition-colors">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-sm">Share</span>
          </button>
        </div>

        <button
          onClick={handleBookmark}
          className={`flex flex-col items-center gap-1 group hover:text-primary transition-colors ${
            isBookmarked ? 'text-primary' : ''
          }`}
        >
          <div className={`p-3 rounded-full border ${
            isBookmarked ? 'border-primary' : 'group-hover:border-primary'
          } transition-colors`}>
            <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-sm">{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    </div>
  );
}