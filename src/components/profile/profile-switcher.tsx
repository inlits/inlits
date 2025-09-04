import React, { useState } from 'react';
import { ChevronDown, User, Briefcase, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

export function ProfileSwitcher() {
  const { profile, activeProfileType, switchProfile, enableCreatorMode } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSwitchProfile = async (type: 'consumer' | 'creator') => {
    if (type === activeProfileType) {
      setShowDropdown(false);
      return;
    }

    try {
      setLoading(true);
      await switchProfile(type);
      setShowDropdown(false);
      
      // Navigate to appropriate page
      if (type === 'creator') {
        navigate(`/dashboard/${profile?.username}`);
      } else {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error switching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableCreator = async () => {
    try {
      setLoading(true);
      await enableCreatorMode();
      setShowDropdown(false);
      navigate(`/dashboard/${profile?.username}`);
    } catch (error) {
      console.error('Error enabling creator mode:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-2 py-1 text-xs rounded-md hover:bg-primary/10 transition-colors w-full"
      >
        <div className="flex items-center gap-1">
          {activeProfileType === 'creator' ? (
            <Briefcase className="w-3 h-3" />
          ) : (
            <User className="w-3 h-3" />
          )}
          <span className="capitalize">{activeProfileType}</span>
        </div>
        <ChevronDown className="w-3 h-3 ml-auto" />
      </button>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50">
          <div className="p-1">
            <button
              onClick={() => handleSwitchProfile('consumer')}
              disabled={loading}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                activeProfileType === 'consumer'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-primary hover:text-primary-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Consumer Profile</span>
            </button>

            {profile?.can_create_content ? (
              <button
                onClick={() => handleSwitchProfile('creator')}
                disabled={loading}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  activeProfileType === 'creator'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-primary hover:text-primary-foreground'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Creator Profile</span>
              </button>
            ) : (
              <button
                onClick={handleEnableCreator}
                disabled={loading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-primary hover:text-primary-foreground transition-colors text-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Become Creator</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}