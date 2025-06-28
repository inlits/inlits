import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { 
  PenSquare,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  AlertCircle,
  Clock,
  Star,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Plus,
  Eye,
  Loader2,
  ChevronRight,
  Headphones,
  Mic,
  FileText
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

interface CreatorStats {
  total_views: number;
  total_followers: number;
  total_earnings: number;
  views_growth: number;
  followers_growth: number;
  earnings_growth: number;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
  views: number;
  created_at: string;
  cover_url?: string;
  featured?: boolean;
  series_id?: string;
}

export function DashboardOverviewPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data with proper error handling
  const loadDashboardData = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    setError(null);

    try {
      // Load creator stats
      const { data: statsData, error: statsError } = await supabase.rpc('get_creator_stats', { 
        creator_id: profile.id, 
        period: 'month' 
      });

      if (statsError) {
        console.error('Stats error:', statsError);
        throw statsError;
      }

      if (statsData?.[0]) {
        setStats(statsData[0]);
      }

      // Load recent content
      const [articlesData, booksData, audiobooksData, podcastsData] = await Promise.all([
        // Get recent articles
        supabase
          .from('articles')
          .select('id, title, cover_url, created_at, view_count, featured, series_id')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
          
        // Get recent books
        supabase
          .from('books')
          .select('id, title, cover_url, created_at, view_count, featured, series_id')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
          
        // Get recent audiobooks
        supabase
          .from('audiobooks')
          .select('id, title, cover_url, created_at, view_count, featured, series_id')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
          
        // Get recent podcasts
        supabase
          .from('podcast_episodes')
          .select('id, title, cover_url, created_at, view_count, featured, series_id')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      // Check for errors
      if (articlesData.error) throw articlesData.error;
      if (booksData.error) throw booksData.error;
      if (audiobooksData.error) throw audiobooksData.error;
      if (podcastsData.error) throw podcastsData.error;

      // Combine and format content
      const allContent: ContentItem[] = [
        ...(articlesData.data || []).map(item => ({ ...item, type: 'article', views: item.view_count || 0 })),
        ...(booksData.data || []).map(item => ({ ...item, type: 'book', views: item.view_count || 0 })),
        ...(audiobooksData.data || []).map(item => ({ ...item, type: 'audiobook', views: item.view_count || 0 })),
        ...(podcastsData.data || []).map(item => ({ ...item, type: 'podcast', views: item.view_count || 0 }))
      ];

      // Sort by creation date
      allContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setRecentContent(allContent.slice(0, 8));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Effect to load data
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatGrowth = (value: number) => {
    if (!value) return '+0%';
    return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <PenSquare className="w-4 h-4" />;
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      case 'audiobook':
        return <Headphones className="w-4 h-4" />;
      case 'podcast':
        return <Mic className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'create-content',
      title: 'Create Content',
      description: 'Write a new article or post',
      icon: PenSquare,
      href: `/dashboard/${profile?.username}/content/new/article`
    },
    {
      id: 'new-series',
      title: 'New Series',
      description: 'Start a content series',
      icon: BookOpen,
      href: `/dashboard/${profile?.username}/content`
    },
    {
      id: 'schedule-session',
      title: 'Schedule Session',
      description: 'Set up availability',
      icon: Calendar,
      href: `/dashboard/${profile?.username}/appointments`
    },
    {
      id: 'analytics-report',
      title: 'Analytics Report',
      description: 'View detailed insights',
      icon: BarChart3,
      href: `/dashboard/${profile?.username}/analytics`
    },
    {
      id: 'update-settings',
      title: 'Update Settings',
      description: 'Manage your profile',
      icon: Settings,
      href: `/dashboard/${profile?.username}/settings`
    }
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  // Show error state if needed
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to load dashboard</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => loadDashboardData()}
          className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">
                  {formatNumber(stats?.total_views || 0)}
                </p>
                <div className={`flex items-center text-sm ${
                  (stats?.views_growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(stats?.views_growth || 0) >= 0 ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span>{formatGrowth(stats?.views_growth || 0)}</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Followers</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">
                  {formatNumber(stats?.total_followers || 0)}
                </p>
                <div className={`flex items-center text-sm ${
                  (stats?.followers_growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(stats?.followers_growth || 0) >= 0 ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span>{formatGrowth(stats?.followers_growth || 0)}</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">
                  {formatMoney(stats?.total_earnings || 0)}
                </p>
                <div className={`flex items-center text-sm ${
                  (stats?.earnings_growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {(stats?.earnings_growth || 0) >= 0 ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span>{formatGrowth(stats?.earnings_growth || 0)}</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              to={action.href}
              className="bg-card border rounded-lg p-4 hover:bg-accent/50 transition-colors shadow-sm"
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <action.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-medium mb-1">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Content</h2>
          <Link 
            to={`/dashboard/${profile?.username}/content`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all content
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentContent.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentContent.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="group bg-card border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Thumbnail */}
                <div className="aspect-video relative">
                  <img
                    src={item.cover_url || `https://source.unsplash.com/random/800x600?${item.type}&sig=${item.id}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="p-4 w-full">
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">{formatNumber(item.views)}</span>
                        </div>
                        {item.featured && (
                          <span className="text-xs px-2 py-1 bg-primary/80 rounded-full">Featured</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      {getContentIcon(item.type)}
                      <span className="capitalize">{item.type}</span>
                    </span>
                    <span>•</span>
                    <span>{formatDate(item.created_at)}</span>
                  </div>
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-6">Start creating content to see it here</p>
            <Link
              to={`/dashboard/${profile?.username}/content/new/article`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first content
            </Link>
          </div>
        )}
      </div>

      {/* Growth Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Growth Overview</h2>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-primary/50" />
                <p>Growth chart visualization coming soon</p>
                <p className="text-sm mt-2">Track your content performance over time</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Content Breakdown</h2>
            {recentContent.length > 0 ? (
              <div className="space-y-6">
                {/* Content Type Distribution */}
                <div className="space-y-4">
                  {['article', 'book', 'audiobook', 'podcast'].map(type => {
                    const count = recentContent.filter(item => item.type === type).length;
                    const percentage = recentContent.length > 0 
                      ? Math.round((count / recentContent.length) * 100) 
                      : 0;
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getContentIcon(type)}
                            <span className="capitalize">{type}s</span>
                          </div>
                          <span>{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Featured Content */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Featured Content</h3>
                  <div className="text-sm">
                    {recentContent.filter(item => item.featured).length} of {recentContent.length} items featured
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No content data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}