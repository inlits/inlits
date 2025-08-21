import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { MessageSquare, ThumbsUp, Eye, MessageCircle, Plus, Loader2, AlertCircle } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface Discussion {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  category: string;
  created_at: string;
  updated_at: string;
  club_id: string;
  club: {
    name: string;
  };
}

export function Discussions() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDiscussions = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: discussionsData, error: discussionsError } = await supabase
          .from('book_club_discussions')
          .select(`
            *,
            author:profiles!book_club_discussions_creator_id_fkey (
              id,
              name,
              username,
              avatar_url
            ),
            club:book_clubs!book_club_discussions_club_id_fkey (
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (discussionsError) throw discussionsError;
        setDiscussions(discussionsData || []);
      } catch (err) {
        console.error('Error loading discussions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load discussions');
      } finally {
        setLoading(false);
      }
    };

    loadDiscussions();
  }, []);

  const handleLike = async (id: string) => {
    if (!user) return;

    try {
      // In a real implementation, you would have a likes table
      // For now, we'll just update the UI optimistically
      console.log('Liked discussion:', id);
    } catch (err) {
      console.error('Error liking discussion:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load discussions</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (discussions.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Discussions</h2>
            <p className="text-sm text-muted-foreground">
              Join the conversation and share your knowledge
            </p>
          </div>
          <button 
            onClick={() => {/* TODO: Implement new discussion modal */}}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Discussion
          </button>
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium mb-2">No discussions yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Discussions will be available soon! We're working on exciting features to help you connect with fellow learners and share knowledge.
          </p>
          <button
            onClick={() => {/* TODO: Implement create discussion modal */}}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Start First Discussion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Recent Discussions</h2>
          <p className="text-sm text-muted-foreground">
            Join the conversation and share your knowledge
          </p>
        </div>
        <button 
          onClick={() => {/* TODO: Implement new discussion modal */}}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Discussion
        </button>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <div key={discussion.id} className="bg-card border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={discussion.author.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${discussion.author.id}`}
                    alt={discussion.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium hover:text-primary transition-colors">
                      {discussion.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{discussion.author.name || discussion.author.username}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(discussion.created_at)}</span>
                      <span>•</span>
                      <span className="text-primary">{discussion.club.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <button 
                    onClick={() => handleLike(discussion.id)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>0</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>0</span>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {discussion.content}
              </p>

              {/* Chapter Info */}
              {discussion.chapter && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {discussion.chapter}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}