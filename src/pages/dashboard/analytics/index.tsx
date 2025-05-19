import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, Users, Clock, Eye, ArrowUp, ArrowDown, BookOpen, Headphones, FileText, Mic } from 'lucide-react';

interface ContentPerformance {
  content_id: string;
  title: string;
  type: string;
  views: number;
  unique_viewers: number;
  avg_engagement_time: string;
  total_earnings: number;
}

interface EngagementMetric {
  date_interval: string;
  views: number;
  unique_viewers: number;
  new_followers: number;
  earnings: number;
}

interface TopContent {
  content_id: string;
  title: string;
  type: string;
  views: number;
  earnings: number;
  engagement_rate: number;
}

interface AudienceInsights {
  total_followers: number;
  new_followers: number;
  total_viewers: number;
  returning_viewers: number;
  avg_view_duration: string;
  top_content_types: {
    articles: number;
    books: number;
    audiobooks: number;
    podcasts: number;
  };
}

export function AnalyticsPage() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [performance, setPerformance] = useState<ContentPerformance[]>([]);
  const [engagement, setEngagement] = useState<EngagementMetric[]>([]);
  const [topContent, setTopContent] = useState<TopContent[]>([]);
  const [audience, setAudience] = useState<AudienceInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!profile) return;

      try {
        // Get content performance
        const { data: performanceData, error: performanceError } = await supabase.rpc(
          'get_content_performance',
          { creator_id: profile.id, period }
        );

        if (performanceError) throw performanceError;
        setPerformance(performanceData || []);

        // Get engagement metrics
        const { data: engagementData, error: engagementError } = await supabase.rpc(
          'get_engagement_metrics',
          { creator_id: profile.id, period }
        );

        if (engagementError) throw engagementError;
        setEngagement(engagementData || []);

        // Get top content
        const { data: topContentData, error: topContentError } = await supabase.rpc(
          'get_top_content',
          { creator_id: profile.id, period }
        );

        if (topContentError) throw topContentError;
        setTopContent(topContentData || []);

        // Get audience insights
        const { data: audienceData, error: audienceError } = await supabase.rpc(
          'get_audience_insights',
          { creator_id: profile.id, period }
        );

        if (audienceError) throw audienceError;
        if (audienceData) {
          setAudience(audienceData[0]);
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [profile, period]);

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

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="w-4 h-4" />;
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

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1a1d24] rounded-lg p-6 h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a1d24] rounded-lg p-6 h-96" />
          <div className="bg-[#1a1d24] rounded-lg p-6 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
          className="px-3 py-1.5 rounded-lg bg-[#1a1d24] border border-[#2a2f38] text-sm"
        >
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Total Views</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {formatNumber(audience?.total_viewers || 0)}
                </p>
                <p className="ml-2 text-sm text-blue-500">
                  +{formatNumber(engagement[0]?.views || 0)} today
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Engagement Rate</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {((audience?.returning_viewers || 0) / (audience?.total_viewers || 1) * 100).toFixed(1)}%
                </p>
                <p className="ml-2 text-sm text-blue-500">
                  {formatNumber(audience?.returning_viewers || 0)} returning
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">Avg. Time</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {audience?.avg_view_duration?.split(':')[1] || 0}m
                </p>
                <p className="ml-2 text-sm text-blue-500">
                  per session
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1d24] rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-400">New Followers</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold">
                  {formatNumber(audience?.new_followers || 0)}
                </p>
                <p className="ml-2 text-sm text-blue-500">
                  this {period}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Content */}
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Top Content</h2>
          <div className="space-y-4">
            {topContent.map((content) => (
              <div key={content.content_id} className="flex items-center justify-between p-4 rounded-lg border border-[#2a2f38]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2a2f38] flex items-center justify-center">
                    {getContentIcon(content.type)}
                  </div>
                  <div>
                    <h3 className="font-medium line-clamp-1">{content.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Eye className="w-4 h-4" />
                      <span>{formatNumber(content.views)} views</span>
                      <span>•</span>
                      <span>{content.engagement_rate.toFixed(1)}% engagement</span>
                    </div>
                  </div>
                </div>
                {content.earnings > 0 && (
                  <div className="text-right">
                    <p className="font-medium">{formatMoney(content.earnings)}</p>
                    <p className="text-sm text-blue-500">earned</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Type Distribution */}
        <div className="bg-[#1a1d24] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Content Performance</h2>
          <div className="space-y-6">
            {Object.entries(audience?.top_content_types || {}).map(([type, count]) => {
              const total = Object.values(audience?.top_content_types || {}).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getContentIcon(type)}
                      <span className="capitalize">{type}</span>
                    </div>
                    <span>{formatNumber(count)} views</span>
                  </div>
                  <div className="h-2 bg-[#2a2f38] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    {percentage.toFixed(1)}% of total views
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Engagement Chart */}
      <div className="bg-[#1a1d24] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Engagement Over Time</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Followers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span>Earnings</span>
            </div>
          </div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-gray-400">
          Engagement chart will be implemented here
        </div>
      </div>
    </div>
  );
}