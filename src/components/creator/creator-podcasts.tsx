import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Filter, ArrowUpDown, Mic, Play, Pause, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  audio_url: string;
  duration: string;
  category: string;
  status: string;
  created_at: string;
  views: number;
  rating: number;
}

interface CreatorPodcastsProps {
  profile: Profile;
}

export function CreatorPodcasts({ profile }: CreatorPodcastsProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const isOwnProfile = user?.id === profile.id;

  useEffect(() => {
    const loadEpisodes = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get the episodes
        const { data: episodesData, error: episodesError } = await supabase
          .from('podcast_episodes')
          .select('*')
          .eq('author_id', profile.id)
          .eq('status', 'published')
          .order(sortBy === 'recent' ? 'created_at' : 'views', { ascending: false });

        if (episodesError) throw episodesError;

        // Then get views and ratings for each episode
        const episodesWithStats = await Promise.all(
          (episodesData || []).map(async (episode) => {
            // Get views
            const { count: viewCount } = await supabase
              .from('content_views')
              .select('*', { count: 'exact', head: true })
              .eq('content_id', episode.id)
              .eq('content_type', 'podcast');

            // Get average rating
            const { data: ratings } = await supabase
              .from('ratings')
              .select('rating')
              .eq('content_id', episode.id)
              .eq('content_type', 'podcast');

            const avgRating = ratings?.length 
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
              : 0;

            return {
              ...episode,
              views: viewCount || 0,
              rating: avgRating
            };
          })
        );

        setEpisodes(episodesWithStats);
      } catch (err) {
        console.error('Error loading podcast episodes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load podcast episodes');
      } finally {
        setLoading(false);
      }
    };

    loadEpisodes();
  }, [profile.id, sortBy]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-48 h-48 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
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
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="mt-4 text-lg font-medium">Failed to load podcast episodes</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (episodes.length === 0) {
    if (isOwnProfile) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No podcast episodes published yet</h3>
          <p className="text-muted-foreground mt-2">
            Episodes you publish will appear here
          </p>
          <Link
            to={`/dashboard/${profile.username}/content/new/podcast`}
            className="inline-flex items-center justify-center px-4 py-2 mt-4 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            Create your first episode
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No podcast episodes published yet</h3>
        <p className="text-muted-foreground mt-2">
          {profile.name || profile.username} hasn't published any episodes yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Podcasts</h1>
          <p className="text-muted-foreground">
            Published episodes by {profile.name || profile.username}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="relative">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:border-primary/50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setSortBy(sortBy === 'recent' ? 'popular' : 'recent')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:border-primary/50 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="text-sm">{sortBy === 'recent' ? 'Most Recent' : 'Most Popular'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Episodes Grid */}
      <div className="grid grid-cols-1 gap-6">
        {episodes.map((episode) => (
          <div
            key={episode.id}
            className="bg-card border rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Cover Art */}
                <div className="shrink-0">
                  <div className="w-48 h-48 rounded-lg overflow-hidden">
                    <img
                      src={episode.cover_url || `https://source.unsplash.com/random/400x400?podcast&sig=${episode.id}`}
                      alt={episode.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span>{episode.category || 'Podcast'}</span>
                      <span>•</span>
                      <span>{episode.duration}</span>
                    </div>

                    <h2 className="text-xl font-semibold">{episode.title}</h2>
                    <p className="text-muted-foreground mt-2 line-clamp-2">
                      {episode.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span>{episode.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{episode.duration}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {episode.views.toLocaleString()} listeners
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(episode.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/player/podcast-${episode.id}`}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Listen Now
                    </Link>
                    <button
                      onClick={() => setPlaying(playing === episode.id ? null : episode.id)}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                    >
                      {playing === episode.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}