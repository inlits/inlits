import React from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Users, Lock, Plus } from 'lucide-react';

interface BookClub {
  id: string;
  name: string;
  members: number;
  book_title: string;
  book_cover: string;
  role: string;
  joined_at: string;
}

export function ProfileCircles() {
  const { user } = useAuth();
  const [bookClubs, setBookClubs] = React.useState<BookClub[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadBookClubs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('book_club_members')
          .select(`
            id,
            role,
            joined_at,
            club:book_clubs (
              id,
              name,
              max_members,
              book:books (
                title,
                cover_url
              ),
              member_count:book_club_members (count)
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false });

        if (error) throw error;

        const formattedClubs = (data || []).map(member => ({
          id: member.club.id,
          name: member.club.name,
          members: member.club.member_count?.[0]?.count || 0,
          book_title: member.club.book?.title || 'Unknown Book',
          book_cover: member.club.book?.cover_url || `https://source.unsplash.com/random/400x400?book&sig=${member.club.id}`,
          role: member.role,
          joined_at: member.joined_at
        }));

        setBookClubs(formattedClubs);
      } catch (error) {
        console.error('Error loading book clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookClubs();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-card border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="font-semibold">Book Clubs</h2>
          <p className="text-sm text-muted-foreground">Your active book club memberships</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-lg border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Join Club
        </button>
      </div>

      <div className="space-y-4">
        {bookClubs.length > 0 ? bookClubs.map((club) => (
          <div
            key={club.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <img
                src={club.book_cover}
                alt={club.book_title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{club.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {club.role}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{club.members} members</span>
                <span>•</span>
                <span>Reading: {club.book_title}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              You haven't joined any book clubs yet
            </p>
          </div>
        )}
      </div>

      {bookClubs.length > 0 && (
        <button className="w-full mt-4 text-sm text-primary hover:underline">
          View all book clubs
        </button>
      )}
    </div>
  );
}