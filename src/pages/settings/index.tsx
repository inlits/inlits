import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Settings, User, Bell, Shield, Palette, Globe, CreditCard } from 'lucide-react';

const settingsSections = [
  {
    id: 'account',
    label: 'Account',
    icon: User,
    description: 'Manage your account settings and preferences'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Control how you receive notifications'
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: Shield,
    description: 'Manage your privacy settings'
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    description: 'Customize how Inlits looks'
  },
  {
    id: 'language',
    label: 'Language & Region',
    icon: Globe,
    description: 'Set your language and regional preferences'
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    description: 'Manage your subscription and billing details'
  }
];

export function SettingsPage() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="container max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3">
          <nav className="space-y-1">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = currentPath === `/settings/${section.id}` ||
                (currentPath === '/settings' && section.id === 'account');
              
              return (
                <Link
                  key={section.id}
                  to={`/settings/${section.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-primary/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{section.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-12 md:col-span-9">
          <div className="bg-card border rounded-lg p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}