import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ChevronRight } from 'lucide-react';
import type { Profile } from '@/lib/types';

interface CreatorHomeProps {
  profile: Profile;
  recentContent: {
    articles: Array<{
      id: string;
      title: string;
      excerpt: string;
      cover_url: string;
      created_at: string;
      views: number;
      rating?: number;
      series_id?: string;
    }>;
    books: Array<{
      id: string;
      title: string;
      description: string;
      cover_url: string;
      price: number;
      created_at: string;
      views: number;
      rating?: number;
      series_id?: string;
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
      rating?: number;
      series_id?: string;
    }>;
    podcasts: Array<{
      id: string;
      title: string;
      description: string;
      cover_url: string;
      duration: string;
      created_at: string;
      views: number;
      rating?: number;
      series_id?: string;
    }>;
  };
}

export function CreatorHome({ profile, recentContent }: CreatorHomeProps) {
  const navigate = useNavigate();

  // Get recent content (max 8 items)
  const recentItems = [
    ...recentContent.articles.map(item => ({ 
      ...item, 
      type: 'article' as const,
      description: item.excerpt 
    })),
    ...recentContent.books.map(item => ({ 
      ...item, 
      type: 'book' as const 
    })),
    ...recentContent.audiobooks.map(item => ({ 
      ...item, 
      type: 'audiobook' as const 
    })),
    ...recentContent.podcasts.map(item => ({ 
      ...item, 
      type: 'podcast' as const 
    }))
  ]
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  .slice(0, 8);

  // Check if creator has any series by looking for content with series_id
  const hasSeries = recentItems.some(item => item.series_id);

  // Get unique series IDs from content
  const seriesIds = new Set(recentItems.filter(item => item.series_id).map(item => item.series_id));

  const handleContentClick = (type: string, id: string) => {
    switch (type) {
      case 'article':
        navigate(`/reader/article-${id}`);
        break;
      case 'book':
        navigate(`/reader/book-${id}`);
        break;
      case 'audiobook':
      case 'podcast':
        navigate(`/player/${type}-${id}`);
        break;
    }
  };

  return (
    <div className="space-y-8">
      {/* Recently Posted */}
      <section>
        <h2 className="text-xl font-semibold mb-6">Recently Posted</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {recentItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => handleContentClick(item.type, item.id)}
              className="group space-y-4 cursor-pointer"
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                <img
                  src={item.cover_url || `https://source.unsplash.com/random/800x1200?${item.type}&sig=${item.id}`}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span className="capitalize">{item.type}</span>
                  {item.series_id && (
                    <>
                      <span>•</span>
                      <span className="text-primary">Part of a Series</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-base font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span>{item.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {item.views.toLocaleString()} views
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Series Section */}
      {hasSeries && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Series ({seriesIds.size})</h2>
            <Link 
              to={`/dashboard/${profile.username}/content?tab=series`} 
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all series
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {Array.from(seriesIds).map((seriesId, index) => {
              // Get all content from this series
              const seriesContent = recentItems.filter(item => item.series_id === seriesId);
              const firstItem = seriesContent[0];
              
              return (
                <div key={seriesId} className="group space-y-4">
                  <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-muted">
                    <img
                      src={firstItem?.cover_url || `https://source.unsplash.com/random/800x1200?books&sig=${seriesId}`}
                      alt="Series Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <div className="text-white">
                        <h3 className="font-medium text-sm">Series {index + 1}</h3>
                        <p className="text-xs text-white/80">{seriesContent.length} items</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}