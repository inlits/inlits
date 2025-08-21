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
  highlight 
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

  const exploreItems = [
    { id: "articles", label: "Articles", icon: Newspaper, path: '/explore/articles' },
    { id: "ebooks", label: "E-Books", icon: BookOpen, path: '/explore/ebooks' },
    { id: "audiobooks", label: "Audiobooks", icon: Headphones, path: '/explore/audiobooks' },
    { id: "podcasts", label: "Podcasts", icon: Mic, path: '/explore/podcasts' },
    { id: "summaries", label: "Book Summaries", icon: BookMarked, path: '/explore/summaries' },
    { id: "trending", label: "Trending", icon: Sparkles, path: '/explore/trending' }
  ];

  return (
    <>
      <aside 
        className={`${
          collapsed ? 'w-16' : 'w-64'
        } fixed left-0 top-[3.5rem] h-[calc(100vh-3.5rem)] border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col transition-all duration-300 z-40`}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="p-3 space-y-6">
            {/* Main Navigation */}
            <div className="space-y-0.5">
              <SidebarItem
                icon={Home}
                label="Home"
                to="/"
                active={isActive('/')}
                collapsed={collapsed}
              />
              <SidebarItem
                icon={Target}
                label="Learning Goals"
                to={user ? '/library?tab=goals' : '/signin'}
                active={isActive('/library') && searchParams.get('tab') === 'goals'}
                collapsed={collapsed}
              />
              <SidebarItem
                icon={Library}
                label="My Library"
                to={user ? '/library' : '/signin'}
                active={isActive('/library')}
                collapsed={collapsed}
              />
              <SidebarItem
                icon={User}
                label="Profile"
                to={user ? '/profile' : '/signin'}
                active={isActive('/profile')}
                collapsed={collapsed}
              />
              {user && (
                profile?.role === 'creator' ? (
                  <SidebarItem
                    icon={CreditCard}
                    label="Creator Dashboard"
                    to={`/dashboard/${profile.username}`}
                    active={location.pathname.startsWith('/dashboard')}
                    collapsed={collapsed}
                  />
                ) : (
                  <SidebarItem
                    icon={Rocket}
                    label="Become a Creator"
                    to="/become-creator"
                    collapsed={collapsed}
                    highlight
                  />
                )
              )}
              <SidebarItem
                icon={History}
                label="History"
                to={user ? '/history' : '/signin'}
                active={isActive('/history')}
                collapsed={collapsed}
              />
            </div>

            {/* Community Section */}
            <div className="space-y-0.5">
              {!collapsed && (
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Community
                </p>
              )}
              <SidebarItem
                icon={BookMarked}
                label="Book Clubs"
                to={user ? '/community/book-clubs' : '/signin'}
                active={isActive('/community/book-clubs')}
                collapsed={collapsed}
              />
              <SidebarItem
                icon={MessageSquare}
                label="Discussions"
                to={user ? '/community/discussions' : '/signin'}
                active={isActive('/community/discussions')}
                collapsed={collapsed}
              />
              <SidebarItem
                icon={Users2}
                label="Study Groups"
                to={user ? '/community/study-groups' : '/signin'}
                active={isActive('/community/study-groups')}
                collapsed={collapsed}
              />
              <SidebarItem
                icon={Trophy}
                label="Learning Challenges"
                to={user ? '/community/challenges' : '/signin'}
                active={isActive('/community/challenges')}
                collapsed={collapsed}
              />
            </div>

            {/* Explore Section */}
            <div className="space-y-0.5">
              {!collapsed && (
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Explore
                </p>
              )}
              {exploreItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  to={item.path}
                  active={isActive(item.path)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </nav>
        </div>

        {/* Footer Links - Only shown when not collapsed */}
        {!collapsed && (
          <div className="p-4 text-xs space-x-2">
            <SidebarItem label="About" to="/about" isFooterLink />
            <span className="text-muted-foreground/50">•</span>
            <SidebarItem label="Contact" to="/contact" isFooterLink />
            <span className="text-muted-foreground/50">•</span>
            <SidebarItem label="Terms" to="/terms" isFooterLink />
            <span className="text-muted-foreground/50">•</span>
            <SidebarItem label="Privacy" to="/privacy" isFooterLink />
          </div>
        )}
      </aside>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => handleCollapse(!collapsed)}
        className="fixed z-50 h-12 flex items-center justify-center bg-background hover:bg-primary/5 border rounded-r-full transition-all duration-300"
        style={{ 
          left: collapsed ? '64px' : '256px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '24px'
        }}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </>
  );
}