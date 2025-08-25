import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  Home,
  User,
  Library,
  History,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Headphones,
  FileText,
  TrendingUp,
  Rocket,
  Search,
  Newspaper,
  Mic,
  BookMarked,
  Sparkles,
  Target,
  Users2,
  MessageSquare,
  Trophy,
  Menu,
  X
} from 'lucide-react';

interface SidebarItemProps {
  icon?: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  requiresAuth?: boolean;
  isFooterLink?: boolean;
  highlight?: boolean;
  isMobile?: boolean;
}

function SidebarItem({ 
  icon: Icon, 
  label, 
  to, 
  active, 
  collapsed, 
  onClick, 
  requiresAuth, 
  isFooterLink,
  highlight,
  isMobile = false
}: SidebarItemProps) {
  const { user } = useAuth();
  const showAuthMessage = requiresAuth && !user;

  if (isFooterLink) {
    return (
      <Link
        to={to}
        className="text-xs text-muted-foreground/80 hover:text-muted-foreground transition-colors"
      >
        {label}
      </Link>
    );
  }

  // Mobile bottom nav item
  if (isMobile) {
    return (
      <Link
        to={showAuthMessage ? '/signin' : to}
        className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
          active
            ? 'text-primary'
            : highlight
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        onClick={onClick}
      >
        {Icon && <Icon className="w-5 h-5" />}
        <span className="text-xs font-medium leading-none">{label}</span>
      </Link>
    );
  }
  return (
    <Link
      to={showAuthMessage ? '/signin' : to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative group ${
        active
          ? 'bg-primary/10 text-primary'
          : highlight
          ? 'text-primary hover:bg-primary/5'
          : 'hover:bg-primary/5 text-foreground'
      }`}
      onClick={onClick}
    >
      {Icon && <div className={collapsed ? 'mx-auto' : ''}><Icon className="w-5 h-5" /></div>}
      {!collapsed && <span className="text-sm font-medium leading-none">{label}</span>}
      {collapsed && Icon && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 shadow-md border">
          {label}
        </div>
      )}
    </Link>
  );
}

interface SidebarProps {
  onCollapse: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
}

export function Sidebar({ onCollapse, defaultCollapsed = false }: SidebarProps) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = window.innerWidth < 768;

  // Update collapsed state when defaultCollapsed changes
  useEffect(() => {
    setCollapsed(defaultCollapsed || isMobile);
    onCollapse(defaultCollapsed || isMobile);
  }, [defaultCollapsed, onCollapse, isMobile]);

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    onCollapse(value);
  };

  const isActive = (path: string) => location.pathname === path;

  // Main navigation items for mobile bottom nav
  const mainNavItems = [
    { id: "home", label: "Home", icon: Home, path: '/' },
    { id: "library", label: "Library", icon: Library, path: user ? '/library' : '/signin' },
    { id: "community", label: "Community", icon: Users2, path: user ? '/community' : '/signin' },
    { id: "more", label: "More", icon: Menu, path: '#', onClick: () => setShowMobileMenu(true) }
  ];

  // All navigation items for mobile menu
  const allNavItems = [
    { id: "profile", label: "Profile", icon: User, path: user ? '/profile' : '/signin' },
    { id: "goals", label: "Learning Goals", icon: Target, path: user ? '/library?tab=goals' : '/signin' },
    { id: "history", label: "History", icon: History, path: user ? '/history' : '/signin' },
    ...(user && profile?.role === 'creator' ? [
      { id: "dashboard", label: "Creator Dashboard", icon: CreditCard, path: `/dashboard/${profile.username}` }
    ] : user ? [] : [
      { id: "become-creator", label: "Become a Creator", icon: Rocket, path: "/become-creator", highlight: true }
    ]),
    // Community items
    { id: "book-clubs", label: "Book Clubs", icon: BookMarked, path: user ? '/community?tab=book-clubs' : '/signin' },
    { id: "discussions", label: "Discussions", icon: MessageSquare, path: user ? '/community?tab=discussions' : '/signin' },
    { id: "study-groups", label: "Study Groups", icon: Users2, path: user ? '/community?tab=study-groups' : '/signin' },
    { id: "challenges", label: "Learning Challenges", icon: Trophy, path: user ? '/community?tab=challenges' : '/signin' },
    // Explore items
    { id: "articles", label: "Articles", icon: Newspaper, path: '/explore/articles' },
    { id: "ebooks", label: "E-Books", icon: BookOpen, path: '/explore/ebooks' },
    { id: "audiobooks", label: "Audiobooks", icon: Headphones, path: '/explore/audiobooks' },
    { id: "podcasts", label: "Podcasts", icon: Mic, path: '/explore/podcasts' },
    { id: "summaries", label: "Book Summaries", icon: BookMarked, path: '/explore/summaries' },
    { id: "trending", label: "Trending", icon: Sparkles, path: '/explore/trending' }
  ];

  // If mobile, render bottom navigation
  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t z-50">
          <div className="flex items-center justify-around px-2 py-2">
            {mainNavItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                to={item.path}
                active={isActive(item.path)}
                isMobile={true}
                onClick={item.onClick}
              />
            ))}
          </div>
        </nav>

        {/* Mobile Menu Modal */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full bg-background rounded-t-xl max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Menu</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
                <div className="p-4 space-y-6">
                  {/* Profile Section */}
                  {user && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</h4>
                      <div className="space-y-1">
                        <SidebarItem
                          icon={User}
                          label="My Profile"
                          to="/profile"
                          active={isActive('/profile')}
                          onClick={() => setShowMobileMenu(false)}
                        />
                        <SidebarItem
                          icon={Target}
                          label="Learning Goals"
                          to="/library?tab=goals"
                          active={isActive('/library') && searchParams.get('tab') === 'goals'}
                          onClick={() => setShowMobileMenu(false)}
                        />
                        <SidebarItem
                          icon={History}
                          label="History"
                          to="/history"
                          active={isActive('/history')}
                          onClick={() => setShowMobileMenu(false)}
                        />
                        {profile?.role === 'creator' ? (
                          <SidebarItem
                            icon={CreditCard}
                            label="Creator Dashboard"
                            to={`/dashboard/${profile.username}`}
                            active={location.pathname.startsWith('/dashboard')}
                            onClick={() => setShowMobileMenu(false)}
                          />
                        ) : (
                          <SidebarItem
                            icon={Rocket}
                            label="Become a Creator"
                            to="/become-creator"
                            highlight
                            onClick={() => setShowMobileMenu(false)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Community Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Community</h4>
                    <div className="space-y-1">
                      <SidebarItem
                        icon={BookMarked}
                        label="Book Clubs"
                        to={user ? '/community?tab=book-clubs' : '/signin'}
                        active={isActive('/community') && searchParams.get('tab') === 'book-clubs'}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={MessageSquare}
                        label="Discussions"
                        to={user ? '/community?tab=discussions' : '/signin'}
                        active={isActive('/community') && (searchParams.get('tab') === 'discussions' || !searchParams.get('tab'))}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={Users2}
                        label="Study Groups"
                        to={user ? '/community?tab=study-groups' : '/signin'}
                        active={isActive('/community') && searchParams.get('tab') === 'study-groups'}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={Trophy}
                        label="Learning Challenges"
                        to={user ? '/community?tab=challenges' : '/signin'}
                        active={isActive('/community') && searchParams.get('tab') === 'challenges'}
                        onClick={() => setShowMobileMenu(false)}
                      />
                    </div>
                  </div>

                  {/* Explore Section */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Explore</h4>
                    <div className="space-y-1">
                      <SidebarItem
                        icon={Newspaper}
                        label="Articles"
                        to="/explore/articles"
                        active={isActive('/explore/articles')}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={BookOpen}
                        label="E-Books"
                        to="/explore/ebooks"
                        active={isActive('/explore/ebooks')}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={Headphones}
                        label="Audiobooks"
                        to="/explore/audiobooks"
                        active={isActive('/explore/audiobooks')}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={Mic}
                        label="Podcasts"
                        to="/explore/podcasts"
                        active={isActive('/explore/podcasts')}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={BookMarked}
                        label="Book Summaries"
                        to="/explore/summaries"
                        active={isActive('/explore/summaries')}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <SidebarItem
                        icon={Sparkles}
                        label="Trending"
                        to="/explore/trending"
                        active={isActive('/explore/trending')}
                        onClick={() => setShowMobileMenu(false)}
                      />
                    </div>
                  </div>

                  {/* Footer Links */}
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Support</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to="/about"
                        onClick={() => setShowMobileMenu(false)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        About
                      </Link>
                      <Link
                        to="/contact"
                        onClick={() => setShowMobileMenu(false)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Contact
                      </Link>
                      <Link
                        to="/terms"
                        onClick={() => setShowMobileMenu(false)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Terms