import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  BookOpen,
  Headphones,
  Mic,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Eye,
  Edit,
  BookMarked,
  Star
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

export function ContentPage() {
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

  const handleEdit = async (item: ContentItem) => {
    try {
      let table;
      let query;
      
      switch (item.type) {
        case 'article':
          table = 'articles';
          query = supabase
            .from(table)
            .select(`
              *,
              series:series_id (
                id,
                title,
                description
              )
            `);
          break;
        case 'book':
          table = 'books';
          query = supabase
            .from(table)
            .select(`
              *,
              series:series_id (
                id,
                title,
                description
              )
            `);
          break;
        case 'audiobook':
          table = 'audiobooks';
          query = supabase
            .from(table)
            .select(`
              *,
              chapters:audiobook_chapters (
                id,
                title,
                audio_url,
                duration,
                "order"
              )
            `);
          break;
        case 'podcast':
          table = 'podcast_episodes';
          query = supabase
            .from(table)
            .select('*');
          break;
        default:
          throw new Error('Invalid content type');
      }

      const { data, error } = await query
        .eq('id', item.id)
        .eq('author_id', profile?.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Content not found');

      // Ensure we have all required fields
      const editData = {
        ...item,
        ...data,
        type: item.type,
        content: data.content || '',
        excerpt: data.excerpt || data.description || '',
        description: data.description || '',
        cover_url: data.cover_url || '',
        series_id: data.series_id || null,
        featured: data.featured || false,
        price: data.price || 0,
        narrator: data.narrator || '',
        duration: data.duration || '',
        audio_url: data.audio_url || '',
        chapters: data.chapters || []
      };

      const basePath = `/dashboard/${profile?.username}/content/new`;
      navigate(`${basePath}/${item.type}`, { 
        state: { 
          editMode: true, 
          item: editData
        } 
      });
    } catch (error) {
      console.error('Error fetching content for edit:', error);
      alert('Failed to load content for editing. Please try again.');
    }
  };

  const handleDelete = async (item: ContentItem) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      let table;
      switch (item.type) {
        case 'article':
          table = 'articles';
          break;
        case 'book':
          table = 'books';
          break;
        case 'audiobook':
          table = 'audiobooks';
          break;
        case 'podcast':
          table = 'podcast_episodes';
          break;
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id)
        .eq('author_id', profile?.id);

      if (error) throw error;

      setContent(prev => prev.filter(c => c.id !== item.id));
      alert('Content deleted successfully');
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    }
  };

  const handlePreview = (item: ContentItem) => {
    switch (item.type) {
      case 'article':
        window.open(`/reader/article-${item.id}`, '_blank');
        break;
      case 'book':
        window.open(`/reader/book-${item.id}`, '_blank');
        break;
      case 'audiobook':
        window.open(`/player/audiobook-${item.id}`, '_blank');
        break;
      case 'podcast':
        window.open(`/player/podcast-${item.id}`, '_blank');
        break;
    }
  };

  const handleToggleFeature = async (item: ContentItem) => {
    if (!profile) return;

    try {
      let table;
      switch (item.type) {
        case 'article':
          table = 'articles';
          break;
        case 'book':
          table = 'books';
          break;
        case 'audiobook':
          table = 'audiobooks';
          break;
        case 'podcast':
          table = 'podcast_episodes';
          break;
        default:
          throw new Error('Invalid content type');
      }

      // Optimistically update UI
      setContent(prev => prev.map(c => 
        c.id === item.id ? { ...c, featured: !c.featured } : c
      ));

      const { error } = await supabase
        .from(table)
        .update({ 
          featured: !item.featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .eq('author_id', profile.id);

      if (error) {
        // Revert optimistic update on error
        setContent(prev => prev.map(c => 
          c.id === item.id ? { ...c, featured: item.featured } : c
        ));
        throw error;
      }
    } catch (error) {
      console.error('Error toggling feature status:', error);
      alert('Failed to update feature status. Please try again.');
    }
  };

  const getContentIcon = (type: ContentItem['type']) => {
    switch (type) {
      case "article":
        return <FileText className="w-6 h-6 text-primary" />;
      case "book":
        return <BookOpen className="w-6 h-6 text-primary" />;
      case "audiobook":
        return <Headphones className="w-6 h-6 text-primary" />;
      case "podcast":
        return <Mic className="w-6 h-6 text-primary" />;
      default:
        return <FileText className="w-6 h-6 text-primary" />;
    }
  };

  const renderThumbnail = (item: ContentItem) => {
    if (item.cover_url) {
      return (
        <img
          src={item.cover_url}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://source.unsplash.com/random/800x600?${item.type}&sig=${item.id}`;
          }}
        />
      );
    }

    return (
      <div className="flex items-center justify-center w-full h-full bg-primary/10">
        {getContentIcon(item.type)}
      </div>
    );
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
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        {[
          { id: "all", label: "All", icon: FileText },
          { id: "articles", label: "Articles", icon: FileText },
          { id: "books", label: "Books", icon: BookOpen },
          { id: "audiobooks", label: "Audiobooks", icon: Headphones },
          { id: "podcasts", label: "Podcasts", icon: Mic },
          { id: "series", label: "Series", icon: BookMarked }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 py-2 text-sm border rounded-md bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="h-10 px-3 py-2 text-sm border rounded-md bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {error && (
        <div className="px-4 py-3 text-sm text-destructive rounded-lg bg-destructive/10">
          {error}
          <button
            onClick={() => loadContent()}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Content List */}
      {activeTab === 'series' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {series.map((s) => (
            <div key={s.id} className="aspect-[4/3] bg-card border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-medium">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                    {s.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {content.filter(c => c.series_id === s.id).length} items
                  </span>
                  <button className="text-sm text-primary hover:underline">
                    View Series
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : content.length > 0 ? (
        <div className="space-y-4">
          {content.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-start gap-4 p-4 transition-colors border rounded-lg bg-card hover:border-primary/50"
            >
              {/* Thumbnail */}
              <div className="w-40 h-24 overflow-hidden rounded-lg bg-muted">
                {renderThumbnail(item)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium transition-colors hover:text-primary">
                        {item.title}
                      </h3>
                      <span className="text-xs capitalize text-muted-foreground">
                        ({item.type})
                      </span>
                      {item.featured && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          Featured
                        </span>
                      )}
                      {item.is_full_book === false && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-orange-500/10 text-orange-500">
                          Summary
                        </span>
                      )}
                    </div>
                    {(item.excerpt || item.description) && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {item.excerpt || item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          item.status === "published"
                            ? "bg-green-100 text-green-700"
                            : item.status === "draft"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>

                      {item.category && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        </>
                      )}
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleFeature(item)}
                      className={`p-2 text-sm transition-colors border rounded-lg ${
                        item.featured 
                          ? 'bg-primary/10 text-primary border-primary'
                          : 'hover:bg-primary hover:text-white hover:border-primary'
                      }`}
                      title={item.featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      <Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEdit(item);
                      }}
                      className="p-2 text-sm transition-colors border rounded-lg hover:bg-primary hover:text-white hover:border-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePreview(item);
                      }}
                      className="p-2 text-sm transition-colors border rounded-lg hover:bg-primary hover:text-white hover:border-primary"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="p-2 text-sm transition-colors border rounded-lg hover:bg-destructive hover:text-white hover:border-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <h3 className="mb-2 text-lg font-medium">No content found</h3>
          <p className="mb-6 text-muted-foreground">
            Get started by creating your first piece of content
          </p>
          <button
            onClick={() => navigate(`/dashboard/${profile?.username}/content/new/${activeTab === 'all' ? 'article' : activeTab.slice(0, -1)}`)}
            className="inline-flex items-center gap-2 px-4 py-2 transition-colors rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            <span>Create {activeTab === 'all' ? 'Content' : activeTab.slice(0, -1)}</span>
          </button>
        </div>
      )}
    </div>
  );
}