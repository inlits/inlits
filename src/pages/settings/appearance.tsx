import React from 'react';
import { useTheme } from '@/components/theme-provider';
import { Label } from '@/components/ui/label';
import { Monitor, Moon, Sun } from 'lucide-react';

export function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = React.useState('medium');
  const [readingView, setReadingView] = React.useState('comfortable');

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    // Apply font size to document root
    document.documentElement.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }[size] || '16px';
  };

  const handleReadingViewChange = (view: string) => {
    setReadingView(view);
    // Apply reading view to document root
    document.documentElement.dataset.readingView = view;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appearance Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize how Inlits looks for you
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-4 mt-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === 'light'
                  ? 'border-primary bg-primary/10'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-sm font-medium">Light</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-sm font-medium">Dark</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                theme === 'system'
                  ? 'border-primary bg-primary/10'
                  : 'border-input hover:border-primary/50'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Font Size</Label>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleFontSizeChange('small')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                fontSize === 'small'
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50'
              }`}
            >
              <span className="text-sm">Small</span>
            </button>
            <button
              onClick={() => handleFontSizeChange('medium')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                fontSize === 'medium'
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50'
              }`}
            >
              <span className="text-sm">Medium</span>
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                fontSize === 'large'
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50'
              }`}
            >
              <span className="text-sm">Large</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Reading View</Label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleReadingViewChange('comfortable')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                readingView === 'comfortable'
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50'
              }`}
            >
              <span className="text-sm">Comfortable</span>
            </button>
            <button
              onClick={() => handleReadingViewChange('compact')}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                readingView === 'compact'
                  ? 'border-primary bg-primary/10'
                  : 'hover:border-primary/50'
              }`}
            >
              <span className="text-sm">Compact</span>
            </button>
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