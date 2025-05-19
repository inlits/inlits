import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Filter, ArrowUpDown, Headphones, Play, Pause, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/types';

interface Audiobook {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  price: number;
  narrator: string;
  status: string;
  created_at: string;
  views: number;
  rating: number;
  isPremium: boolean;
  chapters?: Array<{
    id: number;
    title: string;
    duration: string;
    audio_url: string;
  }>;
}

interface CreatorAudiobooksProps {
  profile: Profile;
}

export function CreatorAudiobooks({ profile }: CreatorAudiobooksProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [expandedAudiobook, setExpandedAudiobook] = useState<string | null>(null);
  const [audioElements] = useState(new Map<string, HTMLAudioElement>());

  const isOwnProfile = user?.id === profile.id;

  useEffect(() => {
    const loadAudiobooks = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: audiobooksData, error: audiobooksError } = await supabase
          .from('audiobooks')
          .select(`
            *,
            chapters:audiobook_chapters (
              id,
              title,
              audio_url,
              duration,
              "order"
            )
          `)
          .eq('author_id', profile.id)
          .eq('status', 'published')
          .order(sortBy === 'recent' ? 'created_at' : 'views', { ascending: false });

        if (audiobooksError) throw audiobooksError;

        const audiobooksWithStats = await Promise.all(
          (audiobooksData || []).map(async (audiobook) => {
            const { count: viewCount } = await supabase
              .from('content_views')
              .select('*', { count: 'exact', head: true })
              .eq('content_id', audiobook.id)
              .eq('content_type', 'audiobook');

            const { data: ratings } = await supabase
              .from('ratings')
              .select('rating')
              .eq('content_id', audiobook.id)
              .eq('content_type', 'audiobook');

            const avgRating = ratings?.length 
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
              : 0;

            const sortedChapters = audiobook.chapters
              ?.sort((a: any, b: any) => a.order - b.order) || [];

            return {
              ...audiobook,
              views: viewCount || 0,
              rating: avgRating,
              isPremium: audiobook.price > 0,
              chapters: sortedChapters
            };
          })
        );

        setAudiobooks(audiobooksWithStats);
      } catch (err) {
        console.error('Error loading audiobooks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load audiobooks');
      } finally {
        setLoading(false);
      }
    };

    loadAudiobooks();
  }, [profile.id, sortBy]);

  const handlePlay = async (chapterId: string, audioUrl: string, index: number, isPremium: boolean) => {
    // Don't allow playing locked chapters
    if (isPremium && index > 0 && !user) {
      return;
    }

    try {
      // Stop any currently playing audio
      if (playing) {
        const currentAudio = audioElements.get(playing);
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
      }

      // If clicking the same chapter, just toggle play/pause
      if (playing === chapterId) {
        setPlaying(null);
        return;
      }

      // Get or create audio element for this chapter
      let audio = audioElements.get(chapterId);
      if (!audio) {
        audio = new Audio(audioUrl);
        audioElements.set(chapterId, audio);
      }

      // Play the audio
      await audio.play();
      setPlaying(chapterId);

      // Add ended event listener
      audio.onended = () => {
        setPlaying(null);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      setPlaying(null);
    }
  };

  // Cleanup audio elements on unmount
  useEffect(() => {
    return () => {
      audioElements.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioElements.clear();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-32 h-48 bg-muted rounded-lg" />
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
        <h3 className="mt-4 text-lg font-medium">Failed to load audiobooks</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (audiobooks.length === 0) {
    if (isOwnProfile) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No audiobooks published yet</h3>
          <p className="text-muted-foreground mt-2">
            Audiobooks you publish will appear here
          </p>
          <Link
            to={`/dashboard/${profile.username}/content/new/audiobook`}
            className="inline-flex items-center justify-center px-4 py-2 mt-4 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
          >
            Create your first audiobook
          </Link>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No audiobooks published yet</h3>
        <p className="text-muted-foreground mt-2">
          {profile.name || profile.username} hasn't published any audiobooks yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Audiobooks</h1>
          <p className="text-muted-foreground">
            Published audiobooks by {profile.name || profile.username}
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

      {/* Audiobooks Grid */}
      <div className="grid grid-cols-1 gap-6">
        {audiobooks.map((audiobook) => (
          <div
            key={audiobook.id}
            className="bg-card border rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Cover Art */}
                <div className="shrink-0">
                  <div className="w-32 h-48 rounded-lg overflow-hidden">
                    <img
                      src={audiobook.cover_url || `https://source.unsplash.com/random/400x600?audiobook&sig=${audiobook.id}`}
                      alt={audiobook.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <span>{audiobook.category || 'Audiobook'}</span>
                      {audiobook.isPremium && (
                        <>
                          <span>•</span>
                          <span className="text-primary">Premium</span>
                        </>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold">{audiobook.title}</h2>
                    <p className="text-muted-foreground mt-2 line-clamp-2">
                      {audiobook.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Headphones className="w-4 h-4 text-muted-foreground" />
                      <span>Narrated by {audiobook.narrator}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span>{audiobook.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {audiobook.views.toLocaleString()} listeners
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      to={user ? `/player/audiobook-${audiobook.id}` : '/signin'}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      {user ? 'Listen Now' : 'Sign in to Listen'}
                    </Link>
                    {audiobook.price > 0 && (
                      <span className="text-sm font-medium">${audiobook.price}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chapters List */}
            {audiobook.chapters && audiobook.chapters.length > 0 && (
              <div className="border-t">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Preview</h3>
                    {audiobook.chapters.length > 1 && (
                      <button
                        onClick={() => setExpandedAudiobook(
                          expandedAudiobook === audiobook.id ? null : audiobook.id
                        )}
                        className="text-sm text-primary hover:underline"
                      >
                        {expandedAudiobook === audiobook.id ? 'Show Less' : 'Show All'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {audiobook.chapters
                      .slice(0, expandedAudiobook === audiobook.id ? undefined : 1)
                      .map((chapter, index) => {
                        const isLocked = index > 0 && !user;
                        
                        return (
                          <div
                            key={chapter.id}
                            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                              isLocked 
                                ? 'bg-muted/5'
                                : 'hover:bg-[#1B4AB1] hover:text-white group'
                            }`}
                          >
                            {isLocked ? (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              </div>
                            ) : (
                              <button
                                onClick={() => handlePlay(chapter.id.toString(), chapter.audio_url, index, audiobook.isPremium)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  playing === chapter.id.toString()
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-primary/10 text-primary group-hover:bg-white group-hover:text-[#1B4AB1]'
                                }`}
                              >
                                {playing === chapter.id.toString() ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 ml-0.5" />
                                )}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {index + 1}. {chapter.title}
                              </h4>
                              <p className={`text-sm transition-colors ${
                                isLocked 
                                  ? 'text-muted-foreground' 
                                  : 'text-muted-foreground group-hover:text-white/90'
                              }`}>
                                {chapter.duration}
                              </p>
                            </div>
                            {isLocked && (
                              <Link
                                to="/signin"
                                className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-colors"
                              >
                                Sign in to listen
                              </Link>
                            )}
                          </div>
                        );
                      })}

                    {/* Show message for locked chapters */}
                    {audiobook.chapters.length > 1 && 
                     !user && 
                     expandedAudiobook !== audiobook.id && (
                      <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground">
                          {audiobook.chapters.length - 1} more {audiobook.chapters.length - 1 === 1 ? 'chapter' : 'chapters'} available after sign in
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}