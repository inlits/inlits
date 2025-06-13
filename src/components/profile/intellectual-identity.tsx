import React, { useEffect, useState } from 'react';
import { Book, Headphones, FileText, BookOpen } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface IntellectualIdentityProps {
  profile?: any;
}

export function IntellectualIdentity({ profile }: IntellectualIdentityProps) {
  const { user, profile: authProfile } = useAuth();
  const userProfile = profile || authProfile;
  const [stats, setStats] = useState({
    booksCompleted: 0,
    audiobooksListened: 0,
    articlesRead: 0
  });
  const [currentRead, setCurrentRead] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get content views to calculate stats
        const { data: viewsData, error: viewsError } = await supabase
          .from('content_views')
          .select('content_type, content_id')
          .eq('viewer_id', user.id);
          
        if (viewsError) throw viewsError;
        
        // Count views by content type
        const counts = {
          booksCompleted: viewsData?.filter(v => v.content_type === 'book').length || 0,
          audiobooksListened: viewsData?.filter(v => v.content_type === 'audiobook').length || 0,
          articlesRead: viewsData?.filter(v => v.content_type === 'article').length || 0
        };
        
        setStats(counts);
        
        // Get most recent content view for current read
        if (viewsData && viewsData.length > 0) {
          const { data: recentView } = await supabase
            .from('content_views')
            .select('content_type, content_id, viewed_at')
            .eq('viewer_id', user.id)
            .order('viewed_at', { ascending: false })
            .limit(1)
            .single();
            
          if (recentView) {
            // Get content details based on type
            if (recentView.content_type === 'book') {
              const { data: book } = await supabase
                .from('books')
                .select('title, author_id')
                .eq('id', recentView.content_id)
                .single();
                
              if (book) {
                const { data: author } = await supabase
                  .from('profiles')
                  .select('name, username')
                  .eq('id', book.author_id)
                  .single();
                  
                setCurrentRead({
                  title: book.title,
                  author: author?.name || author?.username || 'Unknown Author',
                  progress: Math.floor(Math.random() * 100), // Mock progress for demo
                  type: 'book'
                });
              }
            } else if (recentView.content_type === 'audiobook') {
              const { data: audiobook } = await supabase
                .from('audiobooks')
                .select('title, author_id')
                .eq('id', recentView.content_id)
                .single();
                
              if (audiobook) {
                const { data: author } = await supabase
                  .from('profiles')
                  .select('name, username')
                  .eq('id', audiobook.author_id)
                  .single();
                  
                setCurrentRead({
                  title: audiobook.title,
                  author: author?.name || author?.username || 'Unknown Author',
                  progress: Math.floor(Math.random() * 100), // Mock progress for demo
                  type: 'audiobook'
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserStats();
  }, [user]);

  // If no real data is available, use mock data
  const mockData = {
    readingPreferences: userProfile?.reading_preferences || ['Science Fiction', 'Psychology', 'Business'],
    stats: {
      booksCompleted: stats.booksCompleted || 42,
      audiobooksListened: stats.audiobooksListened || 15,
      articlesRead: stats.articlesRead || 128,
    },
    currentRead: currentRead || {
      title: 'Atomic Habits',
      author: 'James Clear',
      progress: 50,
      type: 'book' as const,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Intellectual Identity</h2>
        <button className="text-sm text-primary hover:underline">
          Edit Preferences
        </button>
      </div>

      {/* Reading Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Book className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockData.stats.booksCompleted}</p>
              <p className="text-sm text-muted-foreground">Books Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockData.stats.audiobooksListened}</p>
              <p className="text-sm text-muted-foreground">Audiobooks Listened</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockData.stats.articlesRead}</p>
              <p className="text-sm text-muted-foreground">Articles Read</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Read */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Currently Reading</h3>
          <span className="text-sm text-muted-foreground">
            {mockData.currentRead.progress}% complete
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-20 bg-muted rounded-md overflow-hidden">
            <img
              src={`https://source.unsplash.com/random/200x300?book&sig=${Date.now()}`}
              alt={mockData.currentRead.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h4 className="font-medium">{mockData.currentRead.title}</h4>
            <p className="text-sm text-muted-foreground">by {mockData.currentRead.author}</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${mockData.currentRead.progress}%` }}
          />
        </div>
      </div>

      {/* Reading Preferences */}
      <div className="space-y-4">
        <h3 className="font-medium">Reading Preferences</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Favorite Genres</p>
            <div className="flex flex-wrap gap-2">
              {mockData.readingPreferences.map((genre, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Favorite Authors</p>
            <div className="flex flex-wrap gap-2">
              {['James Clear', 'Malcolm Gladwell', 'Andy Weir'].map((author, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-muted text-sm"
                >
                  {author}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Preferred Content</p>
            <div className="flex flex-wrap gap-2">
              {['Books', 'Audiobooks', 'Articles'].map((type, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-muted text-sm"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}