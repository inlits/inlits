import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Share2, MessageSquare, Heart, ChevronUp, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ArticleReaderProps {
  article: {
    id: string;
    title: string;
    content: string;
    author: {
      name: string;
      avatar: string;
    };
    publishedAt: string;
    readTime: string;
    claps: number;
    comments: Comment[];
  };
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  likes: number;
}

export function ArticleReader({ article }: ArticleReaderProps) {
  const { user } = useAuth();
  const [claps, setClaps] = useState(article.claps);
  const [hasClapped, setHasClapped] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle');

  // Handle scroll to track reading progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClap = () => {
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    if (!hasClapped) {
      setClaps(prev => prev + 1);
      setHasClapped(true);
    }
  };

  const handleShare = async () => {
    try {
      // First try Web Share API
      if (navigator.share && navigator.canShare?.({
        title: article.title,
        text: `Check out "${article.title}" by ${article.author.name}`,
        url: window.location.href
      })) {
        await navigator.share({
          title: article.title,
          text: `Check out "${article.title}" by ${article.author.name}`,
          url: window.location.href
        });
        setShareStatus('shared');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setShareStatus('copied');
      }

      // Reset status after 2 seconds
      setTimeout(() => {
        setShareStatus('idle');
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

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/signin';
      return;
    }

    if (!newComment.trim()) return;

    // TODO: Implement comment submission
    setNewComment('');
  };

  const getShareIcon = () => {
    switch (shareStatus) {
      case 'copied':
      case 'shared':
        return <Check className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Share2 className="w-5 h-5" />;
    }
  };

  const getShareTooltip = () => {
    switch (shareStatus) {
      case 'copied':
        return 'Link copied!';
      case 'shared':
        return 'Shared successfully!';
      case 'error':
        return 'Failed to share';
      default:
        return 'Share article';
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary/20 z-50"
        style={{ width: '100%' }}
      >
        <div 
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Author Info */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-medium">{article.author.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{article.readTime}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-8">{article.title}</h1>

        {/* Content */}
        <div 
          className="prose prose-lg max-w-none mb-16"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Action Bar */}
        <div className="sticky bottom-4 flex items-center justify-between">
          <div className="flex items-center gap-4 bg-background/95 backdrop-blur-sm border rounded-full px-6 py-3 shadow-lg">
            {/* Clap Button */}
            <button
              onClick={handleClap}
              className={`flex items-center gap-2 transition-colors ${
                hasClapped ? 'text-primary' : 'hover:text-primary'
              }`}
              title={user ? undefined : 'Sign in to like'}
            >
              <Heart className={`w-5 h-5 ${hasClapped ? 'fill-current' : ''}`} />
              <span>{claps}</span>
            </button>

            {/* Comments Toggle */}
            <button
              onClick={() => user ? setShowComments(!showComments) : window.location.href = '/signin'}
              className="flex items-center gap-2 hover:text-primary transition-colors"
              title={user ? undefined : 'Sign in to comment'}
            >
              <MessageSquare className="w-5 h-5" />
              <span>{article.comments.length}</span>
            </button>

            {/* Share Button */}
            <div className="relative">
              <button
                onClick={handleShare}
                className={`hover:text-primary transition-colors ${
                  shareStatus === 'error' ? 'text-destructive' : ''
                }`}
                title={getShareTooltip()}
              >
                {getShareIcon()}
              </button>
              {shareStatus !== 'idle' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-black/90 rounded whitespace-nowrap">
                  {getShareTooltip()}
                </div>
              )}
            </div>
          </div>

          {/* Scroll to Top */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-background border-l transform transition-transform duration-300 ease-in-out ${
          showComments ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Comments ({article.comments.length})</h2>
            <button
              onClick={() => setShowComments(false)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Close comments"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {article.comments.map(comment => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium">{comment.author.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="text-sm pl-10">{comment.content}</p>
                <div className="flex items-center gap-2 pl-10">
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Like ({comment.likes})
                  </button>
                  <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleComment} className="p-4 border-t">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full h-20 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}