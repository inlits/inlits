import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Image as ImageIcon, Upload, Plus, Trash2, AlertCircle, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SUPPORTED_BOOK_FORMATS = ['pdf', 'epub', 'mobi', 'html', 'htm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Categories for books
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
    category?: string;
    isFullBook?: boolean;
    file_url?: string;
    file_type?: string;
    file_size?: number;
  };
}

export function NewBookPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSeriesDropdown, setShowSeriesDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('draft');
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isFullBook, setIsFullBook] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [showSeriesDialog, setShowSeriesDialog] = useState(false);
  const [creatingNewSeries, setCreatingNewSeries] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [fileFormat, setFileFormat] = useState<string>('');

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
      setSelectedCategory(editItem.category || '');
      setIsFullBook(editItem.isFullBook ?? true);
      
      if (editItem.cover_url) {
        setPreviewUrl(editItem.cover_url);
      }
      
      if (editItem.file_type) {
        const extension = editItem.file_type.split('/').pop() || '';
        setFileFormat(extension);
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

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    setCoverImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  };

  const handleBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !SUPPORTED_BOOK_FORMATS.includes(extension)) {
      setError(`Unsupported file format. Please upload ${SUPPORTED_BOOK_FORMATS.join(', ')} files`);
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 100MB');
      return;
    }

    setBookFile(file);
    setFileFormat(extension);
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
    if (!profile) {
      setError('You must be logged in to create a book');
      return;
    }

    // Validate required fields
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!selectedCategory) {
      setError('Category is required');
      return;
    }

    // In create mode, require a book file
    if (!isEditMode && !bookFile && !editItem?.file_url) {
      setError('Please select an e-book file');
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

        const { error: coverError } = await supabase.storage
          .from('book-covers')
          .upload(filePath, coverImage);

        if (coverError) {
          console.error('Cover upload error:', coverError);
          throw new Error(`Failed to upload cover image: ${coverError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      let bookUrl = editItem?.file_url || '';
      let bookFileType = editItem?.file_type || '';
      let bookFileSize = editItem?.file_size || 0;

      // Only upload new book file if one is selected
      if (bookFile) {
        const bookExt = bookFile.name.split('.').pop();
        const bookFileName = `${Math.random()}.${bookExt}`;
        const bookFilePath = `${profile.id}/${bookFileName}`;

        const { error: bookUploadError } = await supabase.storage
          .from('books')
          .upload(bookFilePath, bookFile);

        if (bookUploadError) {
          console.error('Book upload error:', bookUploadError);
          throw new Error(`Failed to upload book file: ${bookUploadError.message}`);
        }

        const { data: { publicUrl: bookFileUrl } } = supabase.storage
          .from('books')
          .getPublicUrl(bookFilePath);

        bookUrl = bookFileUrl;
        
        // Set the correct MIME type based on file extension
        if (bookExt === 'html' || bookExt === 'htm') {
          bookFileType = 'text/html';
        } else if (bookExt === 'epub') {
          bookFileType = 'application/epub+zip';
        } else if (bookExt === 'mobi') {
          bookFileType = 'application/x-mobipocket-ebook';
        } else if (bookExt === 'pdf') {
          bookFileType = 'application/pdf';
        } else {
          bookFileType = 'application/octet-stream';
        }
        
        bookFileSize = bookFile.size;
      }

      const bookData = {
        title,
        description,
        cover_url: coverUrl,
        author_id: profile.id,
        status: selectedStatus,
        series_id: selectedSeries?.id || null,
        category: selectedCategory,
        is_full_book: isFullBook,
        price: parseFloat(price) || 0,
        file_url: bookUrl,
        file_type: bookFileType,
        file_size: bookFileSize,
        updated_at: new Date().toISOString()
      };

      if (isEditMode && editItem) {
        // Update existing book
        const { error: updateError } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editItem.id)
          .eq('author_id', profile.id);

        if (updateError) {
          console.error('Book update error:', updateError);
          throw updateError;
        }
      } else {
        // Create new book
        const { error: insertError } = await supabase
          .from('books')
          .insert(bookData);

        if (insertError) {
          console.error('Book creation error:', insertError);
          throw insertError;
        }
      }

      navigate(`/dashboard/${profile.username}/content`);
    } catch (error) {
      console.error('Error saving book:', error);
      setError(error instanceof Error ? error.message : 'Failed to save book');
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
            {isEditMode ? 'Edit Book' : 'New Book'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update your book' : 'Create a new book'}
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

        {/* Book File */}
        <div className="space-y-4">
          <Label>E-Book File</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".pdf,.epub,.mobi,.html,.htm"
                onChange={handleBookFileChange}
                className="hidden"
                id="book-file"
                required={!isEditMode && !editItem?.file_url}
              />
              <label
                htmlFor="book-file"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {bookFile ? bookFile.name : editItem?.file_url ? 'Replace book file' : 'Upload e-book file'}
                </span>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                Supported formats: PDF, EPUB, MOBI, HTML (max 100MB)
              </p>
              {fileFormat && (
                <p className="mt-1 text-xs text-primary">
                  Selected format: {fileFormat.toUpperCase()}
                  {fileFormat === 'html' || fileFormat === 'htm' ? 
                    ' - HTML files support all reader customization options' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter book title"
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
            placeholder="What's your book about?"
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
            <Label>Category</Label>
            <div className="relative" data-dropdown>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full h-10 px-3 text-left flex items-center justify-between rounded-md border border-input bg-background text-sm transition-colors hover:bg-accent"
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
                      className={`w-full px-3 py-1.5 text-sm text-left transition-colors hover:bg-accent rounded-md ${
                        selectedCategory === category ? 'bg-primary/10 text-primary' : ''
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
              <span className="text-sm">Full Book</span>
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
              isEditMode ? 'Update Book' : 'Create Book'
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