import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/upload/image-upload';
import { AlertCircle } from 'lucide-react';

export function AccountSettingsPage() {
  const { user, profile, setProfile, activeProfileType } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get active profile data
  const getActiveProfileData = () => {
    if (!profile) return {};
    
    if (activeProfileType === 'consumer') {
      return profile.consumer_profile || {};
    } else {
      return profile.creator_profile || {};
    }
  };

  const activeProfileData = getActiveProfileData();
  
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
        bio: activeProfileData.bio || profile.bio || '',
        expertise: activeProfileData.expertise || profile.expertise || [],
        reading_preferences: activeProfileData.reading_preferences || profile.reading_preferences || []
      });
    }
  }, [profile, activeProfileType]);

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;

    try {
      // Update the appropriate profile data
      const profileField = activeProfileType === 'consumer' ? 'consumer_profile' : 'creator_profile';
      const currentProfileData = getActiveProfileData();
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [profileField]: {
            ...currentProfileData,
            avatar_url: url
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      if (profile) {
        const updatedProfile = { ...profile };
        if (activeProfileType === 'consumer') {
          updatedProfile.consumer_profile = { ...currentProfileData, avatar_url: url };
        } else {
          updatedProfile.creator_profile = { ...currentProfileData, avatar_url: url };
        }
        setProfile(updatedProfile);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError(err instanceof Error ? err.message : 'Failed to update avatar');
    }
  };

  const handleCoverUpload = async (url: string) => {
    if (!user) return;

    try {
      const profileField = activeProfileType === 'consumer' ? 'consumer_profile' : 'creator_profile';
      const currentProfileData = getActiveProfileData();
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [profileField]: {
            ...currentProfileData,
            cover_url: url
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      if (profile) {
        const updatedProfile = { ...profile };
        if (activeProfileType === 'consumer') {
          updatedProfile.consumer_profile = { ...currentProfileData, cover_url: url };
        } else {
          updatedProfile.creator_profile = { ...currentProfileData, cover_url: url };
        }
        setProfile(updatedProfile);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating cover:', err);
      setError(err instanceof Error ? err.message : 'Failed to update cover image');
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
      const profileField = activeProfileType === 'consumer' ? 'consumer_profile' : 'creator_profile';
      const currentProfileData = getActiveProfileData();
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          [profileField]: {
            ...currentProfileData,
            bio: formData.bio,
            expertise: formData.expertise,
            reading_preferences: formData.reading_preferences
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local profile state
      if (profile) {
        const updatedProfile = { 
          ...profile, 
          name: formData.name
        };
        if (activeProfileType === 'consumer') {
          updatedProfile.consumer_profile = { 
            ...currentProfileData, 
            bio: formData.bio,
            expertise: formData.expertise,
            reading_preferences: formData.reading_preferences
          };
        } else {
          updatedProfile.creator_profile = { 
            ...currentProfileData, 
            bio: formData.bio,
            expertise: formData.expertise
          };
        }
        setProfile(updatedProfile);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {activeProfileType === 'consumer' ? 'Consumer' : 'Creator'} Profile Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Update your {activeProfileType} profile information
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-primary/10 text-primary">
          <p className="text-sm">Settings updated successfully</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Images */}
        <div className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-4">
            <Label>Cover Image</Label>
            <ImageUpload
              bucket="profile-covers"
              onUploadComplete={handleCoverUpload}
              aspectRatio="video"
              defaultImage={activeProfileData.cover_url || profile?.cover_url}
              className="w-full max-w-3xl"
              maxSize={5 * 1024 * 1024} // 5MB
            />
            <p className="text-xs text-muted-foreground">
              Recommended size: 1600x400. Maximum file size: 5MB
            </p>
          </div>

          {/* Profile Picture */}
          <div className="space-y-4">
            <Label>Profile Picture</Label>
            <ImageUpload
              bucket="profile-avatars"
              onUploadComplete={handleAvatarUpload}
              aspectRatio="square"
              defaultImage={activeProfileData.avatar_url || profile?.avatar_url}
              className="w-32 h-32"
              maxSize={2 * 1024 * 1024} // 2MB
            />
            <p className="text-xs text-muted-foreground">
              Recommended size: 400x400. Maximum file size: 2MB
            </p>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Profile Information</h3>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border bg-background min-h-[100px]"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Expertise */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Areas of Expertise</h3>
          
          <div className="space-y-2">
            <Label htmlFor="expertise">Topics you're knowledgeable about</Label>
            <Input
              id="expertise"
              name="expertise"
              value={formData.expertise.join(', ')}
              onChange={handleInputChange}
              placeholder="e.g., Machine Learning, History, Philosophy"
            />
            <p className="text-xs text-muted-foreground">
              Separate topics with commas
            </p>
          </div>
        </div>

        {/* Reading Preferences - Only show for consumer profile */}
        {activeProfileType === 'consumer' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Reading Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="reading_preferences">Preferred topics and genres</Label>
              <Input
                id="reading_preferences"
                name="reading_preferences"
                value={formData.reading_preferences.join(', ')}
                onChange={handleInputChange}
                placeholder="e.g., Science Fiction, Business, Psychology"
              />
              <p className="text-xs text-muted-foreground">
                Separate preferences with commas
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving changes...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}