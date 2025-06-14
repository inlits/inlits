import React, { useState, useEffect, useRef } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { CreatorHeader } from '@/components/creator/creator-header';
import { CreatorHome } from '@/components/creator/creator-home';
import { CreatorArticles } from '@/components/creator/creator-articles';
import { CreatorEbooks } from '@/components/creator/creator-ebooks';
import { CreatorAudiobooks } from '@/components/creator/creator-audiobooks';
import { CreatorPodcasts } from '@/components/creator/creator-podcasts';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface CreatorData {
  profile: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
    cover_url: string;
    bio: string;
    role: string;
    expertise: string[];
    social_links: Record<string, string>;
    verified: boolean;
    created_at: string;
  };
  stats: {
    total_content: number;
    total_articles: number;
    total_books: number;
    total_audiobooks: number;
    total_podcasts: number;
    total_views: number;
    avg_rating: number;
    total_followers: number;
  };
  recent_content: {
    articles: Array<{
      id: string;
      title: string;
      excerpt: string;
      cover_url: string;
      created_at: string;
      views: number;
      featured: boolean;
      rating?: number;
    }>;
    books: Array<{
      id: string;
      title: string;
      description: string;
      cover_url: string;
      price: number;
      created_at: string;
      views: number;
      featured: boolean;
      rating?: number;
    }>;
    audiobooks: Array<{
      id: string;
      title: string;
      description: string;
      cover_url: string;
      price: number;
      narrator: string;
      created_at: string;
      views: number;
      featured: boolean;
      rating?: number;
    }>;
    podcasts: Array<{
      id: string;
      title: string;
      description: string;
      cover_url: string;
      duration: string;
      created_at: string;
      views: number;
      featured: boolean;
      rating?: number;
    }>;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
  }>;
}

// Utility function to check if a string is a valid UUID
const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export function CreatorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorData, setCreatorData] = useState<CreatorData | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Refs for tab scrolling
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check if tabs need scroll buttons
  const checkScrollButtons = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // Handle tab scroll
  const handleScroll = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Update scroll buttons when content changes
  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  useEffect(() => {
    const loadCreatorData = async () => {
      if (!username) return;

      try {
        setLoading(true);
        setError(null);
        setDebugInfo(null);

        // Determine if the parameter is a UUID or username
        const isUserIdParam = isUUID(username);
        console.log('Parameter type:', isUserIdParam ? 'UUID' : 'username', 'Value:', username);

        // Query profile based on parameter type
        let profileQuery = supabase.from('profiles').select('*');
        
        if (isUserIdParam) {
          profileQuery = profileQuery.eq('id', username);
        } else {
          profileQuery = profileQuery.eq('username', username);
        }

        const { data: profileData, error: profileError } = await profileQuery.single();

        if (profileError) {
          console.error('Profile error:', profileError);
          setDebugInfo({ type: 'profile_error', error: profileError, isUserIdParam });
          throw new Error(`Profile not found: ${profileError.message}`);
        }

        if (!profileData) {
          console.error('No profile data found');
          setDebugInfo({ type: 'no_profile', isUserIdParam });
          throw new Error('Profile not found');
        }

        console.log('Found profile:', profileData);
        setDebugInfo(prev => ({ ...prev, profile: profileData, isUserIdParam }));

        if (profileData.role !== 'creator') {
          console.error('Profile is not a creator:', profileData.role);
          setDebugInfo(prev => ({ ...prev, role: profileData.role }));
          throw new Error('This profile is not a creator');
        }

        // Use the actual username for the RPC call, not the URL parameter
        const actualUsername = profileData.username;
        console.log('Fetching creator profile data for username:', actualUsername);
        
        const { data: creatorData, error: creatorError } = await supabase
          .rpc('get_creator_profile', { username: actualUsername });

        if (creatorError) {
          console.error('Creator data error:', creatorError);
          setDebugInfo(prev => ({ ...prev, creator_error: creatorError }));
          throw creatorError;
        }

        if (!creatorData?.[0]) {
          console.error('No creator data returned');
          setDebugInfo(prev => ({ ...prev, creator_data: creatorData }));
          throw new Error('Failed to load creator data');
        }

        console.log('Creator data loaded:', creatorData[0]);

        // Initialize empty arrays for content if they don't exist
        const data = creatorData[0] as CreatorData;
        data.recent_content = {
          articles: data.recent_content?.articles || [],
          books: data.recent_content?.books || [],
          audiobooks: data.recent_content?.audiobooks || [],
          podcasts: data.recent_content?.podcasts || []
        };

        // Debug log for featured content
        console.log('Featured content check:', {
          articles: data.recent_content.articles.filter(a => a.featured),
          books: data.recent_content.books.filter(b => b.featured),
          audiobooks: data.recent_content.audiobooks.filter(ab => ab.featured),
          podcasts: data.recent_content.podcasts.filter(p => p.featured)
        });

        setCreatorData(data);
      } catch (err) {
        console.error('Error in loadCreatorData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load creator data');
      } finally {
        setLoading(false);
      }
    };

    loadCreatorData();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading creator profile...</p>
        </div>
      </div>
    );
  }

  if (error || !creatorData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Creator not found</h1>
          <p className="text-muted-foreground">
            {error || "The creator you're looking for doesn't exist or has been removed."}
          </p>
          {/* Debug information in development */}
          {import.meta.env.DEV && debugInfo && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg text-left">
              <p className="font-mono text-xs break-all">
                Debug Info: {JSON.stringify(debugInfo, null, 2)}
              </p>
            </div>
          )}
          <button
            onClick={() => navigate(-1)}
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <CreatorHeader 
        profile={creatorData.profile} 
        stats={creatorData.stats} 
      />

      <main className="flex-1">
        {/* Tabs Navigation */}
        <div className="border-b relative">
          <div className="container max-w-7xl mx-auto px-4">
            {/* Show scroll buttons on mobile when needed */}
            {showLeftArrow && (
              <button
                onClick={() => handleScroll('left')}
                className="md:hidden absolute left-0 top-0 bottom-0 z-10 px-2 flex items-center justify-center bg-gradient-to-r from-background via-background to-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            <nav 
              ref={tabsRef}
              className="flex overflow-x-auto scrollbar-hide scroll-smooth"
              onScroll={checkScrollButtons}
            >
              {[
                { id: 'home', label: 'Home' },
                { id: 'articles', label: 'Articles' },
                { id: 'books', label: 'E-Books' },
                { id: 'audiobooks', label: 'Audiobooks' },
                { id: 'podcasts', label: 'Podcasts' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-4 py-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Show right scroll button on mobile when needed */}
            {showRightArrow && (
              <button
                onClick={() => handleScroll('right')}
                className="md:hidden absolute right-0 top-0 bottom-0 z-10 px-2 flex items-center justify-center bg-gradient-to-l from-background via-background to-transparent"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'home' && (
            <CreatorHome 
              profile={creatorData.profile}
              recentContent={creatorData.recent_content}
            />
          )}
          {activeTab === 'articles' && (
            <CreatorArticles profile={creatorData.profile} />
          )}
          {activeTab === 'books' && (
            <CreatorEbooks profile={creatorData.profile} />
          )}
          {activeTab === 'audiobooks' && (
            <CreatorAudiobooks profile={creatorData.profile} />
          )}
          {activeTab === 'podcasts' && (
            <CreatorPodcasts profile={creatorData.profile} />
          )}
        </div>
      </main>
    </div>
  );
}