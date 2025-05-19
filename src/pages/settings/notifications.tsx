import React, { useState } from 'react';
import { Label } from '@/components/ui/label';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
}

export function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'content_updates',
      label: 'Content Updates',
      description: 'Get notified when creators you follow post new content',
      email: true,
      push: true
    },
    {
      id: 'circle_activity',
      label: 'Circle Activity',
      description: 'Notifications about activity in your circles',
      email: true,
      push: true
    },
    {
      id: 'mentions',
      label: 'Mentions & Replies',
      description: 'When someone mentions you or replies to your comments',
      email: true,
      push: true
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      description: 'Personalized content recommendations',
      email: false,
      push: true
    },
    {
      id: 'achievements',
      label: 'Achievements',
      description: 'When you earn new badges or reach milestones',
      email: true,
      push: true
    }
  ]);

  const handleToggle = (id: string, type: 'email' | 'push') => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id
          ? { ...setting, [type]: !setting[type] }
          : setting
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notification Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Choose how and when you want to be notified
        </p>
      </div>

      <div className="space-y-8">
        {settings.map(setting => (
          <div key={setting.id} className="space-y-4">
            <div>
              <Label>{setting.label}</Label>
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={setting.email}
                  onChange={() => handleToggle(setting.id, 'email')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Email notifications</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={setting.push}
                  onChange={() => handleToggle(setting.id, 'push')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Push notifications</span>
              </label>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}