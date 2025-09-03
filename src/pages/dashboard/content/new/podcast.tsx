import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CATEGORIES } from '@/lib/constants/categories';

const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'aac'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export function NewPodcastPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
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

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setAudioFile(file);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !audioFile) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const duration = formData.get('duration') as string;
      const categories = formData.getAll('categories') as string[];
      const tags = (formData.get('tags') as string).split(',').map(tag => tag.trim());

      // Validate categories
      if (categories.length === 0) {
        setError('At least one category is required');
        return;
      }

      // Upload cover image if exists
      let coverUrl = '';
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { error: coverError } = await supabase.storage
          .from('audiobook-covers') // Reusing audiobook covers bucket
          .upload(filePath, coverImage);

        if (coverError) throw coverError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('audiobook-covers')
          .getPublicUrl(filePath);

        coverUrl = publicUrl;
      }

      // Upload audio file
      const audioExt = audioFile.name.split('.').pop();
      const audioFileName = `${Math.random()}.${audioExt}`;
      const audioFilePath = `${profile.id}/${audioFileName}`;

      const { error: audioUploadError } = await supabase.storage
        .from('audiobooks') // Reusing audiobooks bucket
        .upload(audioFilePath, audioFile);

      if (audioUploadError) throw audioUploadError;

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('audiobooks')
        .getPublicUrl(audioFilePath);

      // Create podcast episode record
      const { error: insertError } = await supabase
        .from('podcast_episodes')
        .insert({
          title,
          description,
          category: categories[0] || null, // Keep first category for backward compatibility
          categories,
          cover_url: coverUrl,
          audio_url: audioUrl,
          duration,
          author_id: profile.id,
          status: 'draft',
          tags,
          file_type: audioExt,
          file_size: audioFile.size
        });

      if (insertError) throw insertError;

      navigate(`/dashboard/${profile.username}/content`);
    } catch (error) {
      console.error('Error creating podcast episode:', error);
      setError(error instanceof Error ? error.message : 'Failed to create podcast episode');
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
          <h1 className="text-2xl font-semibold">New Podcast Episode</h1>
          <p className="text-muted-foreground">Create a new podcast episode</p>
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
          <div className="aspect-square w-48 relative rounded-lg border-2 border-dashed hover:border-primary/50 transition-colors">
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

        {/* Audio File */}
        <div className="space-y-4">
          <Label>Audio File</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".mp3,.wav,.m4a,.aac"
                onChange={handleAudioChange}
                className="hidden"
                id="audio-file"
                required
              />
              <label
                htmlFor="audio-file"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm">
                  {audioFile ? audioFile.name : 'Upload audio file'}
                </span>
              </label>
              <p className="mt-2 text-xs text-muted-foreground">
                Supported formats: MP3, WAV, M4A, AAC (max 500MB)
              </p>
            </div>
            <Input
              type="text"
              name="duration"
              placeholder="Duration (e.g., 12:34)"
              className="w-32"
              required
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter episode title"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            placeholder="What's this episode about?"
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            placeholder="Enter tags separated by commas"
          />
        </div>

        {/* Category */}
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
                  Select only relevant categories
                </div>
                {CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground rounded-md ${
                      selectedCategories.includes(category) ? 'bg-primary text-primary-foreground' : ''
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
                  />
                  <span className="text-xs">{category}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select multiple categories that best describe your podcast
            </p>
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
            disabled={loading || !audioFile}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Episode'}
          </button>
        </div>
      </form>
    </div>
  );
}