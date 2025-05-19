import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Image as ImageIcon, Plus, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TipTapEditor } from '@/components/editor/tiptap-editor';

interface Series {
  id: string;
  title: string;
  description: string;
}

interface LocationState {
  editMode?: boolean;
  item?: {
    id: string;
    title: string;
    content: string;
    cover_url?: string;
    series_id?: string | null;
    status: string;
    excerpt?: string;
    category?: string;
  };
}

// Categories for articles
const CATEGORIES = [
  'Business & Finance',
  'Self Development',
  'Science & Technology',
  'History & Politics',
  'Philosophy',
  'Psychology',
  'Fiction',
  'Biography',
  'Health & Wellness',
  'Arts & Culture',
  'Religion & Spirituality',
  'Education'
];

export function NewArticlePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [content, setContent] = useState('');
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('draft');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [creatingNewSeries, setCreatingNewSeries] = useState(false);
  const [title, setTitle] = useState('');

  const state = location.state as LocationState;
  const isEditMode = state?.editMode;
  const editItem = state?.item;

  // Load existing content if in edit mode
  useEffect(() => {
    if (isEditMode && editItem) {
      setTitle(editItem.title || '');
      setContent(editItem.content || '');
      setSelectedStatus(editItem.status || 'draft');
      setSelectedCategory(editItem.category || '');
      if (editItem.cover_url) {
        setPreviewUrl(editItem.cover_url);
      }
    }
  }, [isEditMode, editItem]);

  // Load series data
  useEffect(() => {
    const loadSeries = async () => {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .from('series')
          .select('*')
          .eq('author_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSeries(data || []);

        // If in edit mode and has series_id, set selected series
        if (isEditMode && editItem?.series_id) {
          const editSeries = data?.find(s => s.id === editItem.series_id);
          if (editSeries) {
            setSelectedSeries(editSeries);
          }
        }
      } catch (error) {
        console.error('Error loading series:', error);
        setError('Failed to load series. Please try again.');
      } finally {
        setLoadingSeries(false);
      }
    };

    loadSeries();
  }, [profile, isEditMode, editItem]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowStatusDropdown(false);
        setShowSeriesDropdown(false);
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check image size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Cover image must be less than 2MB');
      return;
    }

    setCoverImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleCreateSeries = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) {
      setError('You must be logged in to create series');
      return;
    }

    setCreatingNewSeries(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    try {
      const { data, error } = await supabase
        .from('series')
        .insert({
          title,
          description,
          author_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSeries((prev) => [data, ...prev]);
      setSelectedSeries(data);
      setShowSeriesDialog(false);
    } catch (error) {
      console.error('Error creating series:', error);
      setError(error instanceof Error ? error.message : 'Failed to create series');
    } finally {
      setCreatingNewSeries(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile) return;

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    if (!selectedCategory) {
      setError('Category is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let coverUrl = previewUrl;

      // Only upload new cover image if one is selected
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('article-covers')
          .upload(filePath, coverImage);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(uploadError.message || 'Failed to upload cover image');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('article-covers')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      const articleData = {
        title,
        content,
        cover_url: coverUrl,
        author_id: profile.id,
        status: selectedStatus,
        series_id: selectedSeries?.id,
        category: selectedCategory,
        updated_at: new Date().toISOString()
      };

      if (isEditMode && editItem) {
        // Update existing article
        const { error: updateError } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editItem.id)
          .eq('author_id', profile.id);

        if (updateError) throw updateError;
      } else {
        // Create new article
        const { error: insertError } = await supabase
          .from('articles')
          .insert(articleData);

        if (insertError) throw insertError;
      }

      setSuccess(true);
      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate(`/dashboard/${profile.username}/content`);
      }, 1500);
    } catch (error) {
      console.error('Error saving article:', error);
      setError(error instanceof Error ? error.message : 'Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#1B4AB1] hover:text-white rounded-lg transition-colors text-primary"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? 'Edit Article' : 'New Article'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update your article' : 'Create a new article or blog post'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cover Image */}
        <div className="space-y-4">
          <Label>Cover Image</Label>
          <div className="relative transition-colors border-2 border-dashed rounded-lg aspect-video border-muted hover:border-primary/50 group">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Cover preview"
                  className="object-cover w-full h-full rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center transition-opacity rounded-lg opacity-0 bg-black/50 group-hover:opacity-100">
                  <span className="text-sm text-white">Change Image</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2" />
                <div className="text-sm text-center">
                  <p>Click or drag to upload cover image</p>
                  <p className="mt-1 text-xs">Maximum size: 2MB</p>
                </div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title"
            required
            className="focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* Status, Series, and Category */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Status Dropdown */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full h-10 px-3 text-left flex items-center justify-between rounded-md border border-input bg-background text-sm transition-colors hover:bg-[#1B4AB1] hover:text-white"
              >
                <span>
                  {selectedStatus === 'draft' ? 'Draft' :
                   selectedStatus === 'published' ? 'Published' :
                   'Archived'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showStatusDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showStatusDropdown && (
                <div className="absolute z-50 w-full py-1 mt-1 duration-100 border rounded-md shadow-lg bg-background animate-in fade-in-0 zoom-in-95">
                  {['draft', 'published', 'archived'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-[#1B4AB1] hover:text-white rounded-md ${
                        selectedStatus === status ? 'bg-[#1B4AB1] text-white' : ''
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Series Dropdown */}
          <div className="space-y-2">
            <Label>Series</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setShowSeriesDropdown(!showSeriesDropdown)}
                className="w-full h-10 px-3 text-left flex items-center justify-between rounded-md border border-input bg-background text-sm transition-colors hover:bg-[#1B4AB1] hover:text-white"
              >
                <span>{selectedSeries?.title || 'No Series'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showSeriesDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showSeriesDropdown && (
                <div className="absolute z-50 w-full py-1 mt-1 duration-100 border rounded-md shadow-lg bg-background animate-in fade-in-0 zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeries(null);
                      setShowSeriesDropdown(false);
                    }}
                    className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-[#1B4AB1] hover:text-white rounded-md ${
                      !selectedSeries ? 'bg-[#1B4AB1] text-white' : ''
                    }`}
                  >
                    No Series
                  </button>

                  {series.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSeries(s);
                        setShowSeriesDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-[#1B4AB1] hover:text-white rounded-md ${
                        selectedSeries?.id === s.id ? 'bg-[#1B4AB1] text-white' : ''
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}

                  <div className="px-1 pt-1 mt-1 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSeriesDialog(true);
                        setShowSeriesDropdown(false);
                      }}
                      className="w-full px-2 py-1.5 text-sm text-primary rounded-md hover:bg-[#1B4AB1] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Create New Series
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full h-10 px-3 text-left flex items-center justify-between rounded-md border border-input bg-background text-sm transition-colors hover:bg-[#1B4AB1] hover:text-white"
              >
                <span>{selectedCategory || 'Select Category'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showCategoryDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div className="absolute z-50 w-full py-1 mt-1 duration-100 border rounded-md shadow-lg bg-background animate-in fade-in-0 zoom-in-95 max-h-60 overflow-y-auto">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category);
                        setShowCategoryDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-[#1B4AB1] hover:text-white rounded-md ${
                        selectedCategory === category ? 'bg-[#1B4AB1] text-white' : ''
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Write your article content here..."
          />
        </div>

        {/* Status Messages */}
        {error && (
          <div className="px-4 py-3 text-sm rounded-lg bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="px-4 py-3 text-sm text-green-500 rounded-lg bg-green-500/10">
            Article {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update Article' : 'Create Article'
            )}
          </button>
        </div>
      </form>

      {/* Create Series Dialog */}
      {showSeriesDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowSeriesDialog(false)}
        >
          <div
            className="bg-background rounded-xl shadow-xl w-full max-w-[400px] mx-4 animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Series</h2>
              <button
                onClick={() => setShowSeriesDialog(false)}
                className="p-1 hover:bg-[#1B4AB1] hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSeries} className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="series-title">Title</Label>
                <Input
                  id="series-title"
                  name="title"
                  placeholder="Enter series title"
                  required
                  className="focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="series-description">Description</Label>
                <textarea
                  id="series-description"
                  name="description"
                  placeholder="Enter series description"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSeriesDialog(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-input hover:bg-[#1B4AB1] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingNewSeries}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-[#1B4AB1] hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingNewSeries ? (
                    <>
                      <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Series'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}