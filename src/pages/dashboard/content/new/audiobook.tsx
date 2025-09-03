import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Image as ImageIcon, Upload, Plus, Trash2, AlertCircle, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CATEGORIES } from '@/lib/constants/categories';

interface Chapter {
  id: string;
  title: string;
  audioFile: File | null;
  duration: string;
}

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
    description: string;
    cover_url?: string;
    series_id?: string | null;
    status: string;
    price: number;
    narrator: string;
    category?: string;
    isFullBook?: boolean;
    chapters?: Array<{
      id: string;
      title: string;
      audio_url: string;
      duration: string;
    }>;
  };
}

const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'aac'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file

export function NewAudiobookPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: '1', title: 'Chapter 1', audioFile: null, duration: '00:00' }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('draft');
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFullBook, setIsFullBook] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [creatingNewSeries, setCreatingNewSeries] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [narrator, setNarrator] = useState('');

  const state = location.state as LocationState;
  const isEditMode = state?.editMode;
  const editItem = state?.item;

  // Load existing content if in edit mode
  useEffect(() => {
    if (isEditMode && editItem) {
      setTitle(editItem.title || '');
      setDescription(editItem.description || '');
      setSelectedStatus(editItem.status || 'draft');
      setPrice(editItem.price?.toString() || '0');
      setNarrator(editItem.narrator || '');
      setSelectedCategory(editItem.category || '');
      setSelectedCategories(editItem.categories || [editItem.category].filter(Boolean) || []);
      setIsFullBook(editItem.isFullBook ?? true);
      
      if (editItem.cover_url) {
        setPreviewUrl(editItem.cover_url);
      }

      if (editItem.chapters) {
        setChapters(editItem.chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          audioFile: null,
          duration: chapter.duration
        })));
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
      }
    };

    loadSeries();
  }, [profile, isEditMode, editItem]);

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

  const handleAudioChange = async (id: string, file: File) => {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_AUDIO_FORMATS.includes(extension)) {
      setError(`Unsupported file format. Please upload ${SUPPORTED_AUDIO_FORMATS.join(', ')} files`);
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 500MB');
      return;
    }

    try {
      // Get audio duration
      const duration = await getAudioDuration(file);
      const formattedDuration = formatDuration(duration);

      setChapters(prev =>
        prev.map(chapter =>
          chapter.id === id 
            ? { ...chapter, audioFile: file, duration: formattedDuration }
            : chapter
        )
      );
      setError(null);
    } catch (error) {
      console.error('Error getting audio duration:', error);
      setError('Failed to process audio file. Please try again.');
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load audio file'));
      });
      
      audio.src = objectUrl;
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const addChapter = () => {
    setChapters(prev => [
      ...prev,
      {
        id: String(prev.length + 1),
        title: `Chapter ${prev.length + 1}`,
        audioFile: null,
        duration: '00:00'
      }
    ]);
  };

  const removeChapter = (id: string) => {
    if (chapters.length > 1) {
      setChapters(prev => prev.filter(chapter => chapter.id !== id));
    }
  };

  const updateChapter = (id: string, field: keyof Chapter, value: string) => {
    setChapters(prev =>
      prev.map(chapter =>
        chapter.id === id ? { ...chapter, [field]: value } : chapter
      )
    );
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

    // Validate required fields
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!narrator.trim()) {
      setError('Narrator is required');
      return;
    }

    if (!selectedCategory) {
      if (selectedCategories.length === 0) {
        setError('At least one category is required');
        return;
      }
    }

    // Validate that all chapters have audio files in create mode
    if (!isEditMode && chapters.some(chapter => !chapter.audioFile)) {
      setError('Please upload audio files for all chapters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let coverUrl = previewUrl;

      // Upload cover image if exists
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        console.log('Uploading cover image:', filePath);
        const { error: coverError } = await supabase.storage
          .from('audiobook-covers')
          .upload(filePath, coverImage);

        if (coverError) {
          console.error('Cover upload error:', coverError);
          throw new Error(`Failed to upload cover image: ${coverError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('audiobook-covers')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      const audiobookData = {
        title,
        description,
        cover_url: coverUrl,
        price: parseFloat(price) || 0,
        narrator,
        author_id: profile.id,
        status: selectedStatus,
        series_id: selectedSeries?.id,
        category: selectedCategories[0] || null, // Keep first category for backward compatibility
        categories: selectedCategories,
        is_full_book: isFullBook,
        updated_at: new Date().toISOString()
      };

      console.log('Creating audiobook with data:', audiobookData);

      if (isEditMode && editItem) {
        // Update existing audiobook
        const { error: updateError } = await supabase
          .from('audiobooks')
          .update(audiobookData)
          .eq('id', editItem.id)
          .eq('author_id', profile.id);

        if (updateError) {
          console.error('Audiobook update error:', updateError);
          throw updateError;
        }

        // Only update chapters that have new audio files
        for (const chapter of chapters) {
          if (chapter.audioFile) {
            const audioExt = chapter.audioFile.name.split('.').pop();
            const audioFileName = `${Math.random()}.${audioExt}`;
            const audioFilePath = `${profile.id}/${editItem.id}/${audioFileName}`;

            console.log('Uploading chapter audio:', audioFilePath);
            const { error: uploadError } = await supabase.storage
              .from('audiobooks')
              .upload(audioFilePath, chapter.audioFile);

            if (uploadError) {
              console.error('Chapter audio upload error:', uploadError);
              throw uploadError;
            }

            const { data: { publicUrl: audioUrl } } = supabase.storage
              .from('audiobooks')
              .getPublicUrl(audioFilePath);

            const { error: chapterError } = await supabase
              .from('audiobook_chapters')
              .update({
                title: chapter.title,
                audio_url: audioUrl,
                duration: chapter.duration
              })
              .eq('id', chapter.id)
              .eq('audiobook_id', editItem.id);

            if (chapterError) {
              console.error('Chapter update error:', chapterError);
              throw chapterError;
            }
          }
        }
      } else {
        // Create new audiobook
        console.log('Creating new audiobook...');
        const { error: insertError, data: audiobook } = await supabase
          .from('audiobooks')
          .insert(audiobookData)
          .select()
          .single();

        if (insertError) {
          console.error('Audiobook creation error:', insertError);
          throw insertError;
        }

        console.log('Audiobook created:', audiobook);

        // Upload audio files and create chapters
        for (const [index, chapter] of chapters.entries()) {
          if (!chapter.audioFile) continue;

          const audioExt = chapter.audioFile.name.split('.').pop();
          const audioFileName = `${Math.random()}.${audioExt}`;
          const audioFilePath = `${profile.id}/${audiobook.id}/${audioFileName}`;

          console.log('Uploading chapter audio:', audioFilePath);
          const { error: uploadError } = await supabase.storage
            .from('audiobooks')
            .upload(audioFilePath, chapter.audioFile);

          if (uploadError) {
            console.error('Chapter audio upload error:', uploadError);
            throw uploadError;
          }

          const { data: { publicUrl: audioUrl } } = supabase.storage
            .from('audiobooks')
            .getPublicUrl(audioFilePath);

          const { error: chapterError } = await supabase
            .from('audiobook_chapters')
            .insert({
              audiobook_id: audiobook.id,
              title: chapter.title,
              audio_url: audioUrl,
              duration: chapter.duration,
              order: index + 1
            });

          if (chapterError) {
            console.error('Chapter creation error:', chapterError);
            throw chapterError;
          }
        }
      }

      navigate(`/dashboard/${profile.username}/content`);
    } catch (error) {
      console.error('Error saving audiobook:', error);
      setError(error instanceof Error ? error.message : 'Failed to save audiobook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditMode ? 'Edit Audiobook' : 'New Audiobook'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update your audiobook' : 'Create a new audiobook'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cover Image */}
        <div className="space-y-4">
          <Label>Cover Image</Label>
          <div className="aspect-[2/3] w-48 relative rounded-lg border-2 border-dashed hover:border-primary/50 transition-colors">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Cover preview"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2" />
                <div className="text-sm text-center px-4">Click or drag to upload cover image</div>
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
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter audiobook title"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's your audiobook about?"
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </div>

        {/* Status, Series, and Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Dropdown */}
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full h-10 px-3 text-left flex items-center justify-between rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent"
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
                      className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-accent rounded-md ${
                        selectedStatus === status ? 'bg-primary/10 text-primary' : ''
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
                className="w-full h-10 px-3 text-left flex items-center justify-between rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent"
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
                    className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-accent rounded-md ${
                      !selectedSeries ? 'bg-primary/10 text-primary' : ''
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
                      className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-accent rounded-md ${
                        selectedSeries?.id === s.id ? 'bg-primary/10 text-primary' : ''
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
                      className="w-full px-2 py-1.5 text-sm text-primary rounded-md hover:bg-accent transition-colors flex items-center gap-1"
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
            <Label>Categories</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full h-10 px-3 text-left flex items-center justify-between rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent"
              >
                <span>
                  {selectedCategories.length === 0 
                    ? 'Select Categories' 
                    : selectedCategories.length === 1 
                      ? selectedCategories[0]
                      : `${selectedCategories.length} categories selected`
                  }
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showCategoryDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showCategoryDropdown && (
                <div className="absolute z-50 w-full py-2 mt-1 duration-100 border rounded-md shadow-lg bg-background animate-in fade-in-0 zoom-in-95 max-h-60 overflow-y-auto">
                  <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                    Select multiple categories (recommended: 2-3)
                  </div>
                  {CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-accent ${
                        selectedCategories.includes(category) ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories(prev => [...prev, category]);
                          } else {
                            setSelectedCategories(prev => prev.filter(c => c !== category));
                          }
                        }}
                        className="rounded border-input"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                  <div className="px-3 py-2 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategories([]);
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Type Selection */}
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={isFullBook}
                onChange={() => setIsFullBook(true)}
                className="w-4 h-4 border-input"
              />
              <span className="text-sm">Full Audiobook</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!isFullBook}
                onChange={() => setIsFullBook(false)}
                className="w-4 h-4 border-input"
              />
              <span className="text-sm">Book Summary</span>
            </label>
          </div>
        </div>

        {/* Narrator */}
        <div className="space-y-2">
          <Label htmlFor="narrator">Narrator</Label>
          <Input
            id="narrator"
            value={narrator}
            onChange={(e) => setNarrator(e.target.value)}
            placeholder="Enter narrator's name"
            required
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="pl-7"
              placeholder="0.00"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Leave empty or set to 0 for free content
          </p>
        </div>

        {/* Chapters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Chapters</Label>
            <button
              type="button"
              onClick={addChapter}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Chapter</span>
            </button>
          </div>

          <div className="space-y-6">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="space-y-4 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <Input
                    value={chapter.title}
                    onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                    placeholder="Chapter title"
                    className="max-w-sm"
                  />
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChapter(chapter.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a,.aac"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAudioChange(chapter.id, file);
                      }}
                      className="hidden"
                      id={`audio-${chapter.id}`}
                    />
                    <label
                      htmlFor={`audio-${chapter.id}`}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">
                        {chapter.audioFile ? chapter.audioFile.name : 'Upload audio file'}
                      </span>
                    </label>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Supported formats: MP3, WAV, M4A, AAC (max 500MB)
                    </p>
                  </div>
                  <Input
                    type="text"
                    value={chapter.duration}
                    readOnly
                    placeholder="Duration"
                    className="w-32 bg-muted"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

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
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </div>
            ) : (
              isEditMode ? 'Update Audiobook' : 'Create Audiobook'
            )}
          </button>
        </div>
      </form>

      {/* Create Series Dialog */}
      {showSeriesDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowSeriesDialog(false)}
        >
          <div 
            className="bg-background rounded-xl shadow-xl w-[400px] mx-4 relative animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create New Series</h2>
              <button 
                onClick={() => setShowSeriesDialog(false)}
                className="p-1 hover:bg-accent rounded-lg transition-colors"
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="series-description">Description</Label>
                <textarea
                  id="series-description"
                  name="description"
                  placeholder="Enter series description"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSeriesDialog(false)}
                  className="px-4 py-2 text-sm rounded-lg border hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingNewSeries}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
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