import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase, withRetry, isRetryableError } from '@/lib/supabase';
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
  Eye
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

interface Activity {
  id: string;
  activity_type: string;
  activity_data: any;
  created_at: string;
}

export function DashboardOverviewPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => 
    document.documentElement.classList.contains('dark')
  );

  // Load dashboard data with proper error handling
  const loadDashboardData = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    setError(null);

    try {
      // Load stats with enhanced retry logic
      const { data: statsData, error: statsError } = await withRetry(
        () => supabase.rpc('get_creator_stats', { 
          creator_id: profile.id, 
          period: 'month' 
        }),
        3, // max retries
        1000, // base delay
        5000 // timeout
      );

      if (statsError) {
        console.error('Stats error:', statsError);
        if (!isRetryableError(statsError)) {
          throw statsError;
        }
      }

      if (statsData?.[0]) {
        setStats(statsData[0]);
      }

      // Load activities with separate error handling
      try {
        const { data: activities, error: activitiesError } = await withRetry(
          () => supabase
            .from('activity_log')
            .select('*')
            .eq('creator_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(5),
          3,
          1000,
          5000
        );

        if (activitiesError) {
          if (activitiesError.code === '42P01') {
            // Table doesn't exist yet - not an error
            console.info('Activity log table not yet available');
            setActivities([]);
          } else if (!isRetryableError(activitiesError)) {
            throw activitiesError;
          }
        } else {
          setActivities(activities || []);
        }
      } catch (activityError) {
        console.warn('Failed to load activities:', activityError);
        // Don't fail the whole dashboard for activity errors
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Effect to load data and handle theme changes
  useEffect(() => {
    loadDashboardData();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
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

  const getActivityMessage = (activity: Activity) => {
    switch (activity.activity_type) {
      case 'content_published':
        return `Published ${activity.activity_data.type} "${activity.activity_data.title}"`;
      case 'content_updated':
        return `Updated ${activity.activity_data.type} "${activity.activity_data.title}"`;
      case 'session_scheduled':
        return `New session scheduled with ${activity.activity_data.client_name}`;
      case 'earned_money':
        return `Earned ${formatMoney(activity.activity_data.amount)} from ${activity.activity_data.source}`;
      case 'gained_follower':
        return `New follower: ${activity.activity_data.follower_name}`;
      default:
        return 'Unknown activity';
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

  // Show loading state
  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`${
                isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'
              } rounded-lg p-6 h-32 border shadow-sm`} 
            />
          ))}
        </div>
        <div className={`${
          isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'
        } rounded-lg p-6 h-64 border shadow-sm`} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'} rounded-lg p-6 border shadow-sm`}>
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

        <div className={`${isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'} rounded-lg p-6 border shadow-sm`}>
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

        <div className={`${isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'} rounded-lg p-6 border shadow-sm`}>
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
              className={`${
                isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'
              } border rounded-lg p-4 hover:bg-accent/50 transition-colors shadow-sm`}
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

      {/* Growth Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className={`${isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'} border rounded-lg p-6 shadow-sm`}>
            <h2 className="text-xl font-semibold mb-6">Growth Overview</h2>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Growth chart will be implemented here
            </div>
          </div>
        </div>

        <div>
          <div className={`${isDarkMode ? 'bg-[#1a1d24]' : 'bg-white'} border rounded-lg p-6 shadow-sm`}>
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm">{getActivityMessage(activity)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">
                  No recent activity to show
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}