import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/upload/image-upload';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export function AccountSettingsPage() {
  const { user, profile, setProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    expertise: [] as string[],
    reading_preferences: [] as string[]
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        expertise: profile.expertise || [],
        reading_preferences: profile.reading_preferences || []
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          avatar_url: url
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (url: string) => {
    if (!user) return;

    setUploadingCover(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cover_url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          cover_url: url
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          bio: formData.bio,
          expertise: formData.expertise,
          reading_preferences: formData.reading_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      if (profile) {
        setProfile({
          ...profile,
          ...formData
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'expertise' || name === 'reading_preferences') {
      setFormData(prev => ({
        ...prev,
        [name]: value.split(',').map(item => item.trim()).filter(Boolean)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold">Account Settings</h2>
        <p className="text-sm text-muted-foreground">
          Update your account information
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 md:p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 md:p-4 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="w-4 h-4" />
          <p className="text-sm">Profile updated successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Images */}
        <div className="space-y-6 md:space-y-8">
          {/* Cover Image */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Cover Image</Label>
              {uploadingCover && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
            <div className="w-full max-w-3xl">
              <ImageUpload
                bucket="profile-covers"
                onUploadComplete={handleCoverUpload}
                aspectRatio="video"
                defaultImage={profile?.cover_url}
                className="w-full h-32 md:h-48"
                maxSize={5 * 1024 * 1024} // 5MB
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended size: 1600x400. Maximum file size: 5MB
            </p>
          </div>

          {/* Profile Picture */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Profile Picture</Label>
              {uploadingAvatar && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
            <div className="flex justify-center md:justify-start">
              <ImageUpload
                bucket="profile-avatars"
                onUploadComplete={handleAvatarUpload}
                aspectRatio="square"
                defaultImage={profile?.avatar_url}
                className="w-24 h-24 md:w-32 md:h-32"
                maxSize={2 * 1024 * 1024} // 2MB
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended size: 400x400. Maximum file size: 2MB
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <h3 className="text-base md:text-lg font-medium">Profile Information</h3>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile?.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border bg-background min-h-[80px] md:min-h-[100px] text-sm md:text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Reading Preferences */}
        <div className="space-y-4">
          <h3 className="text-base md:text-lg font-medium">Reading Preferences</h3>
          
          <div className="space-y-2">
            <Label htmlFor="reading_preferences">Preferred topics and genres</Label>
            <Input
              id="reading_preferences"
              name="reading_preferences"
              value={formData.reading_preferences.join(', ')}
              onChange={handleInputChange}
              placeholder="e.g., Science Fiction, Business, Psychology, History"
            />
            <p className="text-xs text-muted-foreground">
              Separate preferences with commas. This helps us recommend better content for you.
            </p>
          </div>
        </div>

        {/* Areas of Expertise */}
        <div className="space-y-4">
          <h3 className="text-base md:text-lg font-medium">Areas of Expertise</h3>
          
          <div className="space-y-2">
            <Label htmlFor="expertise">Topics you're knowledgeable about</Label>
            <Input
              id="expertise"
              name="expertise"
              value={formData.expertise.join(', ')}
              onChange={handleInputChange}
              placeholder="e.g., Machine Learning, History, Philosophy, Marketing"
            />
            <p className="text-xs text-muted-foreground">
              Separate topics with commas. This helps others find you for discussions and collaborations.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t">
          <Link
            to="/profile"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            disabled={loading || uploadingAvatar || uploadingCover}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving changes...
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}