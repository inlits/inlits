import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
];

export function LanguageSettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Language & Region</h2>
        <p className="text-sm text-muted-foreground">
          Set your preferred language and regional settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-4">
          <div>
            <Label>Display Language</Label>
            <p className="text-sm text-muted-foreground">
              Select the language you want to use for the interface
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="search"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
                    selectedLanguage === lang.code
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{lang.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {lang.nativeName}
                    </span>
                  </div>
                  {selectedLanguage === lang.code && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="space-y-4">
          <div>
            <Label>Regional Format</Label>
            <p className="text-sm text-muted-foreground">
              Choose how dates, times, and numbers are displayed
            </p>
          </div>

          <div className="grid gap-4">
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="en-US">United States (MM/DD/YYYY)</option>
              <option value="en-GB">United Kingdom (DD/MM/YYYY)</option>
              <option value="de-DE">Germany (DD.MM.YYYY)</option>
              <option value="ja-JP">Japan (YYYY年MM月DD日)</option>
            </select>
          </div>
        </div>

        {/* Time Zone */}
        <div className="space-y-4">
          <div>
            <Label>Time Zone</Label>
            <p className="text-sm text-muted-foreground">
              Set your preferred time zone for accurate scheduling
            </p>
          </div>

          <div className="grid gap-4">
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
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