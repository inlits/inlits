import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { MessageSquare, ThumbsUp, Eye, MessageCircle, Plus } from 'lucide-react';
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
  tags: string[];
  likes: number;
  views: number;
  comment_count: number;
  created_at: string;
}

export function Discussions() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDiscussions = async () => {
      try {
        // For now, let's use mock data since we're still setting up the database
        const mockDiscussions: Discussion[] = Array.from({ length: 5 }, (_, i) => ({
          id: `discussion-${i}`,
          title: [
            'Getting Started with Machine Learning',
            'Best Practices for Web Development',
            'Understanding Blockchain Technology',
            'The Future of Artificial Intelligence',
            'Learning Design Patterns in Software Engineering'
          ][i],
          content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
          author: {
            id: `author-${i}`,
            name: `Author ${i + 1}`,
            username: `author${i + 1}`,
            avatar_url: `https://source.unsplash.com/random/100x100?face&sig=${Date.now()}-${i}`
          },
          category: ['Technology', 'Programming', 'Data Science', 'AI', 'Software Engineering'][i],
          tags: ['learning', 'technology', 'education'],
          likes: Math.floor(Math.random() * 100),
          views: Math.floor(Math.random() * 1000),
          comment_count: Math.floor(Math.random() * 50),
          created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString()
        }));

        setDiscussions(mockDiscussions);
      } catch (err) {
        console.error('Error loading discussions:', err);
        setError('Failed to load discussions');
      } finally {
        setLoading(false);
      }
    };

    loadDiscussions();
  }, []);

  const handleLike = async (id: string) => {
    if (!user) return;

    try {
      setDiscussions(prev =>
        prev.map(discussion =>
          discussion.id === id
            ? { ...discussion, likes: discussion.likes + 1 }
            : discussion
        )
      );
    } catch (err) {
      console.error('Error liking discussion:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-primary hover:underline"
        >
          Try again
        </button>
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
                    src={discussion.author.avatar_url}
                    alt={discussion.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-medium hover:text-primary transition-colors">
                      {discussion.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{discussion.author.name}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(discussion.created_at)}</span>
                      <span>•</span>
                      <span className="text-primary">{discussion.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <button 
                    onClick={() => handleLike(discussion.id)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{discussion.likes}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{discussion.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{discussion.comment_count}</span>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-muted-foreground line-clamp-2">
                {discussion.content}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-2">
                {discussion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}