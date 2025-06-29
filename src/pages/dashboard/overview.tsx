import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
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
  PenSquare
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
  type: 'article' | 'book' | 'audiobook' | 'podcast';
  status: string;
  created_at: string;
  excerpt?: string;
  description?: string;
  cover_url?: string;
  series_id?: string;
  featured?: boolean;
  content?: string;
  price?: number;
  narrator?: string;
  duration?: string;
  audio_url?: string;
  author_id?: string;
  category?: string;
  is_full_book?: boolean;
}

interface Series {
  id: string;
  title: string;
  description: string;
}

export function DashboardOverviewPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const loadingRef = useRef(false);
  const retryCountRef = useRef(0);

  const getTableName = (tab: string): string => {
    switch (tab) {
      case 'articles': return 'articles';
      case 'books': return 'books';
      case 'audiobooks': return 'audiobooks';
      case 'podcasts': return 'podcast_episodes';
      case 'all': return 'all';
      case 'series': return 'series';
      default: return 'articles';
    }
  };

  const loadContent = useCallback(async () => {
    if (!profile || loadingRef.current) return;

    try {
      setLoading(true);
      loadingRef.current = true;
      setError(null);

      const loadContentType = async (table: string) => {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('author_id', profile.id)
            .order('created_at', { ascending: sortOrder === 'oldest' });

          if (error) throw error;

          // Map the content type based on the table
          const typeMap = {
            'articles': 'article',
            'books': 'book',
            'audiobooks': 'audiobook',
            'podcast_episodes': 'podcast'
          } as const;

          return (data || []).map(item => ({
            ...item,
            type: typeMap[table as keyof typeof typeMap]
          }));
        } catch (err) {
          console.error(`Error loading ${table}:`, err);
          return []; // Return empty array instead of throwing to allow other content to load
        }
      };

      let contentData: ContentItem[] = [];

      if (activeTab === 'all') {
        // Load all content types in parallel
        const results = await Promise.all([
          loadContentType('articles'),
          loadContentType('books'),
          loadContentType('audiobooks'),
          loadContentType('podcast_episodes')
        ]);

        // Combine all results
        contentData = results.flat();
      } else if (activeTab === 'series') {
        const { data: seriesData, error: seriesError } = await supabase
          .from('series')
          .select('*')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false });

        if (seriesError) throw seriesError;
        setSeries(seriesData || []);
      } else {
        // Load specific content type
        const table = getTableName(activeTab);
        if (table !== 'all' && table !== 'series') {
          contentData = await loadContentType(table);
        }
      }

      // Apply filters
      contentData = contentData.filter(item => {
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false;
        }
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        return true;
      });

      // Sort content
      contentData.sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setContent(contentData);
      retryCountRef.current = 0;
    } catch (error) {
      console.error('Error loading content:', error);
      setError('Failed to load content. Please try again.');
      
      if (retryCountRef.current < 3) {
        retryCountRef.current++;
        setTimeout(() => {
          loadContent();
        }, 2000);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [profile?.id, activeTab, statusFilter, sortOrder, searchQuery]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

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

  if (loading && !content.length) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Views</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">
                  {formatNumber(1250)}
                </p>
                <div className="flex items-center text-sm text-green-500">
                  <ArrowUp className="w-4 h-4" />
                  <span>+12.5%</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Followers</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">
                  {formatNumber(324)}
                </p>
                <div className="flex items-center text-sm text-green-500">
                  <ArrowUp className="w-4 h-4" />
                  <span>+8.3%</span>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Earnings</h3>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-semibold">
                  {formatMoney(4250)}
                </p>
                <div className="flex items-center text-sm text-green-500">
                  <ArrowUp className="w-4 h-4" />
                  <span>+15.2%</span>
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
          {[
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
          ].map((action) => (
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

        {content.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {content.slice(0, 8).map((item) => (
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
                          <span className="text-sm">{Math.floor(Math.random() * 1000)}</span>
                        </div>
                        {item.featured && (
                          <span className="text-xs px-2 py-1 bg-primary/80 rounded-full">Featured</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content info */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      {getContentIcon(item.type)}
                      <span className="capitalize">{item.type}</span>
                    </span>
                    <span>•</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
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
            {content.length > 0 ? (
              <div className="space-y-6">
                {/* Content Type Distribution */}
                <div className="space-y-4">
                  {['article', 'book', 'audiobook', 'podcast'].map(type => {
                    const count = content.filter(item => item.type === type).length;
                    const percentage = content.length > 0 
                      ? Math.round((count / content.length) * 100) 
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
                    {content.filter(item => item.featured).length} of {content.length} items featured
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