import React, { useState } from 'react';
import { Label } from '@/components/ui/label';

interface PrivacySetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'profile_visibility',
      label: 'Public Profile',
      description: 'Allow anyone to view your profile',
      enabled: true
    },
    {
      id: 'reading_activity',
      label: 'Reading Activity',
      description: 'Share your reading progress and activity',
      enabled: true
    },
    {
      id: 'show_circles',
      label: 'Circle Membership',
      description: 'Show which circles you\'re a member of',
      enabled: true
    },
    {
      id: 'show_location',
      label: 'Location',
      description: 'Display your location on your profile',
      enabled: false
    },
    {
      id: 'search_visibility',
      label: 'Search Visibility',
      description: 'Allow your profile to appear in search results',
      enabled: true
    },
    {
      id: 'learning_stats',
      label: 'Learning Statistics',
      description: 'Share your learning progress and achievements',
      enabled: true
    }
  ]);

  const handleToggle = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Privacy Settings</h2>
        <p className="text-sm text-muted-foreground">
          Control what others can see about you
        </p>
      </div>

      <div className="space-y-6">
        {settings.map(setting => (
          <div key={setting.id} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{setting.label}</Label>
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={setting.enabled}
                onChange={() => handleToggle(setting.id)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}

        <div className="pt-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Save privacy settings
          </button>
        </div>
      </div>
    </div>
  );
}