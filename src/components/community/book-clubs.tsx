import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BookOpen, Users, Clock, Plus, ChevronDown, ChevronUp } from 'lucide-react';

interface BookClub {
  id: string;
  name: string;
  description: string;
  book_id: string;
  creator_id: string;
  max_members: number;
  meeting_day: string;
  meeting_time: string;
  timezone: string;
  current_chapter: string;
  completion_percentage: number;
  next_meeting_date: string;
  status: string;
  created_at: string;
  book: {
    title: string;
    cover_url: string;
    author: {
      name: string;
    };
  };
  creator: {
    name: string;
    avatar_url: string;
  };
  member_count: number;
}

export function BookClubs() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClub, setExpandedClub] = useState<string | null>(null);

  useEffect(() => {
    const loadBookClubs = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: bookClubs, error: clubsError } = await supabase
          .from('book_clubs')
          .select(`
            *,
            book:books (
              title,
              cover_url,
              author:profiles!books_author_id_fkey (
                name
              )
            ),
            creator:profiles!book_clubs_creator_id_fkey (
              name,
              avatar_url
            ),
            member_count:book_club_members (
              count
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (clubsError) throw clubsError;
        setClubs(bookClubs || []);
      } catch (err) {
        console.error('Error loading book clubs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load book clubs');
      } finally {
        setLoading(false);
      }
    };

    loadBookClubs();
  }, []);

  const handleJoinClub = async (clubId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('book_club_members')
        .insert({
          club_id: clubId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Update local state
      setClubs(prev =>
        prev.map(club =>
          club.id === clubId
            ? { ...club, member_count: club.member_count + 1 }
            : club
        )
      );
    } catch (error) {
      console.error('Error joining club:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex gap-4">
                <div className="w-32 h-48 bg-muted rounded-lg" />
                <div className="flex-1 space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                </div>
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
          className="mt-4 text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No book clubs yet</h3>
        <p className="text-muted-foreground mt-2">
          Be the first to start a book club!
        </p>
        <button
          onClick={() => {/* TODO: Implement create club modal */}}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Book Club
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Book Clubs</h2>
          <p className="text-sm text-muted-foreground">
            Join a club to read and discuss books with others
          </p>
        </div>
        <button
          onClick={() => {/* TODO: Implement create club modal */}}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Club</span>
        </button>
      </div>

      {/* Book Clubs List */}
      <div className="space-y-4">
        {clubs.map((club) => (
          <div
            key={club.id}
            className="bg-card border rounded-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Book Cover */}
                <div className="shrink-0">
                  <div className="w-32 h-48 rounded-lg overflow-hidden">
                    <img
                      src={club.book.cover_url || `https://source.unsplash.com/random/400x600?book&sig=${club.id}`}
                      alt={club.book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Club Info */}
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{club.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reading: {club.book.title} by {club.book.author.name}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {club.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {club.member_count}/{club.max_members} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Meets {club.meeting_day}s at {club.meeting_time} {club.timezone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{club.completion_percentage}% complete</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleJoinClub(club.id)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Join Club
                    </button>
                    <button
                      onClick={() => setExpandedClub(expandedClub === club.id ? null : club.id)}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      {expandedClub === club.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show More
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="shrink-0 text-right">
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{club.creator.name}</span>
                    <img
                      src={club.creator.avatar_url || `https://source.unsplash.com/random/100x100?face&sig=${club.creator_id}`}
                      alt={club.creator.name}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedClub === club.id && (
              <div className="border-t p-6 bg-muted/30">
                <div className="space-y-6">
                  {/* Current Progress */}
                  <div>
                    <h4 className="font-medium mb-2">Current Progress</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${club.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Currently on: {club.current_chapter}
                      </span>
                    </div>
                  </div>

                  {/* Next Meeting */}
                  <div>
                    <h4 className="font-medium mb-2">Next Meeting</h4>
                    <p className="text-sm">
                      {new Date(club.next_meeting_date).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="font-medium mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span>New discussion started on Chapter {i}</span>
                          <span className="text-muted-foreground">2 hours ago</span>
                        </div>
                      ))}
                    </div>
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