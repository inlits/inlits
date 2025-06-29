import React, { useState } from 'react';
import { Navigate, Link, Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/components/theme-provider';
import { 
  LayoutDashboard, 
  FileText,
  Users, 
  Calendar, 
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  Plus,
  Sun,
  Moon,
  Bell,
  X,
  BookOpen,
  Headphones,
  Mic,
  BookText,
  PenSquare
} from 'lucide-react';

const sidebarItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    path: ''
  },
  {
    id: 'content',
    label: 'Content',
    icon: FileText,
    path: '/content'
  },
  {
    id: 'earnings',
    label: 'Earnings',
    icon: DollarSign,
    path: '/earnings'
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar,
    path: '/appointments'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    path: '/analytics'
  },
  {
    id: 'community',
    label: 'Community',
    icon: Users,
    path: '/community'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
];

const createOptions = [
  {
    id: 'article',
    label: 'Article',
    description: 'Write an article, blog post, or tutorial',
    icon: PenSquare,
    path: '/content/new/article'
  },
  {
    id: 'book',
    label: 'Book',
    description: 'Create a full-length book or ebook',
    icon: BookText,
    path: '/content/new/book'
  },
  {
    id: 'audiobook',
    label: 'Audiobook',
    description: 'Record or upload an audiobook',
    icon: Headphones,
    path: '/content/new/audiobook'
  },
  {
    id: 'podcast',
    label: 'Podcast',
    description: 'Start a new podcast episode',
    icon: Mic,
    path: '/content/new/podcast'
  }
];

export function DashboardLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const { username } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect non-creators to home
  if (!user || !profile || profile.role !== 'creator') {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Verify the user is accessing their own dashboard
  if (username !== profile.username) {
    return <Navigate to={`/dashboard/${profile.username}`} replace />;
  }

  // Get current section for create dialog filtering
  const currentSection = location.pathname.split('/').pop();

  return (
    <div className="min-h-screen bg-[hsl(var(--content-background))]">
      {/* Header */}
      <header className="h-14 border-b bg-[hsl(var(--sidebar-background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--sidebar-background))]/60 fixed top-0 left-0 right-0 z-50">
        <div className="container h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/90">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Inlits</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm font-medium">Creator Dashboard</div>
          </div>

          <div className="flex items-center gap-4">
            {/* Create Button */}
            <button 
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-accent/10 rounded-lg transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Notifications */}
            <button className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                  {profile?.username[0].toUpperCase()}
                </div>
              )}
              <div className="text-sm">
                <div className="font-medium">{profile?.name || profile?.username}</div>
                <div className="text-xs text-muted-foreground">Creator</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-14 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-[hsl(var(--sidebar-background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--sidebar-background))]/60">
          <nav className="p-4 space-y-2">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === `/dashboard/${username}${item.path}`;
              
              return (
                <Link
                  key={item.id}
                  to={`/dashboard/${username}${item.path}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64">
          <div className="container py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Create Content Dialog */}
      {showCreateDialog && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowCreateDialog(false)}
        >
          <div 
            className="bg-background rounded-xl shadow-xl w-[400px] mx-4 relative animate-in fade-in-0 zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create Content</h2>
              <button 
                onClick={() => setShowCreateDialog(false)}
                className="p-1 hover:bg-accent/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              {/* Show all options on content page, otherwise filter by current section */}
              {(location.pathname.includes('/content') ? createOptions : 
                createOptions.filter(option => 
                  currentSection?.includes(option.id)
                )
              ).map(option => (
                <Link
                  key={option.id}
                  to={`/dashboard/${username}${option.path}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors"
                  onClick={() => setShowCreateDialog(false)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <option.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}