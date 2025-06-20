import React, { Suspense, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Navbar } from "./components/layout/navbar";
import { Sidebar } from "./components/layout/sidebar";
import { ThemeProvider } from "./components/theme-provider";
import { EmailVerificationBanner } from "./components/email-verification-banner";
import { ProtectedRoute } from "./components/auth/protected-route";
import { useAuth } from "./lib/auth";
import { useAudio } from "./lib/audio-context";
import { CategoriesScroll } from "./components/content/categories-scroll";
import { Home } from "./pages/home";
import { ErrorBoundary } from './components/error-boundary';
import { ConnectionProvider } from './lib/connection-context';
import { AudioProvider } from './lib/audio-context';
import { Loader2 } from 'lucide-react';
import { AudioPlayer } from './components/audio/audio-player';
import { Footer } from './components/layout/footer';

// Lazy loaded components with proper dynamic imports
const SignInPage = React.lazy(() => import('./pages/auth/sign-in').then(module => ({ default: module.SignInPage })));
const SignUpPage = React.lazy(() => import('./pages/auth/sign-up').then(module => ({ default: module.SignUpPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/auth/forgot-password').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = React.lazy(() => import('./pages/auth/reset-password').then(module => ({ default: module.ResetPasswordPage })));
const VerifyEmailPage = React.lazy(() => import('./pages/auth/verify-email').then(module => ({ default: module.VerifyEmailPage })));
const QuickBitesPage = React.lazy(() => import('./pages/quick-bites').then(module => ({ default: module.QuickBitesPage })));
const FollowedPage = React.lazy(() => import('./pages/followed').then(module => ({ default: module.FollowedPage })));
const LibraryPage = React.lazy(() => import('./pages/library').then(module => ({ default: module.LibraryPage })));
const CommunityPage = React.lazy(() => import('./pages/community').then(module => ({ default: module.CommunityPage })));
const HistoryPage = React.lazy(() => import('./pages/history').then(module => ({ default: module.HistoryPage })));
const ProfilePage = React.lazy(() => import('./pages/profile/index').then(module => ({ default: module.ProfilePage })));
const UserProfilePage = React.lazy(() => import('./pages/profile/[username]').then(module => ({ default: module.UserProfilePage })));
const SearchProfilesPage = React.lazy(() => import('./pages/profile/search').then(module => ({ default: module.SearchProfilesPage })));
const CreatorProfilePage = React.lazy(() => import('./pages/creator/[username]').then(module => ({ default: module.CreatorProfilePage })));
const DashboardLayout = React.lazy(() => import('./pages/dashboard').then(module => ({ default: module.DashboardLayout })));
const DashboardOverviewPage = React.lazy(() => import('./pages/dashboard/overview').then(module => ({ default: module.DashboardOverviewPage })));
const ContentPage = React.lazy(() => import('./pages/dashboard/content').then(module => ({ default: module.ContentPage })));
const NewArticlePage = React.lazy(() => import('./pages/dashboard/content/new/article').then(module => ({ default: module.NewArticlePage })));
const NewBookPage = React.lazy(() => import('./pages/dashboard/content/new/book').then(module => ({ default: module.NewBookPage })));
const NewAudiobookPage = React.lazy(() => import('./pages/dashboard/content/new/audiobook').then(module => ({ default: module.NewAudiobookPage })));
const NewPodcastPage = React.lazy(() => import('./pages/dashboard/content/new/podcast').then(module => ({ default: module.NewPodcastPage })));
const EarningsPage = React.lazy(() => import('./pages/dashboard/earnings').then(module => ({ default: module.EarningsPage })));
const AppointmentsPage = React.lazy(() => import('./pages/dashboard/appointments').then(module => ({ default: module.AppointmentsPage })));
const AnalyticsPage = React.lazy(() => import('./pages/dashboard/analytics').then(module => ({ default: module.AnalyticsPage })));
const SettingsPage = React.lazy(() => import('./pages/dashboard/settings').then(module => ({ default: module.SettingsPage })));
const ReaderPage = React.lazy(() => import('./pages/reader/[id]').then(module => ({ default: module.ReaderPage })));
const PlayerPage = React.lazy(() => import('./pages/player/[id]').then(module => ({ default: module.PlayerPage })));
const SearchPage = React.lazy(() => import('./pages/search').then(module => ({ default: module.default })));
const ContactPage = React.lazy(() => import('./pages/contact').then(module => ({ default: module.default })));
const PrivacyPage = React.lazy(() => import('./pages/privacy').then(module => ({ default: module.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/terms').then(module => ({ default: module.TermsPage })));
const RefundPolicyPage = React.lazy(() => import('./pages/refund-policy').then(module => ({ default: module.RefundPolicyPage })));
const CopyrightPage = React.lazy(() => import('./pages/copyright').then(module => ({ default: module.default })));
const AboutPage = React.lazy(() => import('./pages/about').then(module => ({ default: module.AboutPage })));

function LoadingFallback() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { currentAudio, isPlayerVisible } = useAudio();
  const isMobile = window.innerWidth < 768;

  // Only show categories on home page
  const isHomePage = location.pathname === '/';
  
  // Auto-collapse sidebar on mobile or non-home pages
  useEffect(() => {
    if (isMobile || !isHomePage) {
      setSidebarCollapsed(true);
    }
  }, [isHomePage, isMobile]);

  const categories = [
    { id: "1", name: "All", slug: "all" },
    { id: "2", name: "Technology", slug: "technology" },
    { id: "3", name: "Business", slug: "business" },
    { id: "4", name: "Science", slug: "science" },
    { id: "5", name: "Health", slug: "health" },
    { id: "6", name: "Arts", slug: "arts" },
    { id: "7", name: "History", slug: "history" },
    { id: "8", name: "Philosophy", slug: "philosophy" },
    { id: "9", name: "Psychology", slug: "psychology" },
    { id: "10", name: "Mathematics", slug: "mathematics" },
    { id: "11", name: "Languages", slug: "languages" },
    { id: "12", name: "Literature", slug: "literature" },
  ];

  // Check if the current page is a static page that should show the footer
  // Removed '/' from this list to not show footer on home page
  const shouldShowFooter = [
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/refund-policy',
    '/copyright'
  ].includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <EmailVerificationBanner />
      <Sidebar 
        onCollapse={setSidebarCollapsed} 
        defaultCollapsed={!isHomePage || isMobile}
      />
      {isHomePage && (
        <CategoriesScroll
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          collapsed={sidebarCollapsed}
        />
      )}
      <main 
        className={`flex-1 transition-all duration-300 ${
          isHomePage ? 'pt-16' : 'pt-14'
        } ${isPlayerVisible ? 'pb-32' : ''} ${
          isMobile ? 'ml-16 w-[calc(100%-64px)]' : `ml-${sidebarCollapsed ? '16' : '64'} w-[calc(100%-${sidebarCollapsed ? '64px' : '256px'})]`
        }`}
      >
        <div className="container px-4 mx-auto">
          {React.isValidElement(children) && React.cloneElement(children as React.ReactElement, { selectedCategory })}
        </div>
      </main>

      {/* Show footer on static pages except home page */}
      {shouldShowFooter && <Footer />}

      {/* Fixed Audio Player */}
      {isPlayerVisible && currentAudio && (
        <AudioPlayer
          title={currentAudio.title}
          author={currentAudio.author}
          thumbnail={currentAudio.thumbnail}
          type="audiobook"
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ConnectionProvider>
          <ThemeProvider defaultTheme="system" storageKey="inlits-theme">
            <AudioProvider>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Auth Routes */}
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />

                  {/* Dashboard Routes */}
                  <Route
                    path="/dashboard/:username/*"
                    element={
                      <ProtectedRoute roles={["creator"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<DashboardOverviewPage />} />
                    <Route path="content" element={<ContentPage />} />
                    <Route path="content/new/article" element={<NewArticlePage />} />
                    <Route path="content/new/book" element={<NewBookPage />} />
                    <Route path="content/new/audiobook" element={<NewAudiobookPage />} />
                    <Route path="content/new/podcast" element={<NewPodcastPage />} />
                    <Route path="earnings" element={<EarningsPage />} />
                    <Route path="appointments" element={<AppointmentsPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Content Player Routes */}
                  <Route
                    path="/player/:id"
                    element={
                      <MainLayout>
                        <PlayerPage />
                      </MainLayout>
                    }
                  />

                  {/* Reader Routes */}
                  <Route
                    path="/reader/:id"
                    element={
                      <MainLayout>
                        <ReaderPage />
                      </MainLayout>
                    }
                  />

                  {/* Search Route */}
                  <Route
                    path="/search"
                    element={
                      <MainLayout>
                        <SearchPage />
                      </MainLayout>
                    }
                  />

                  {/* Static Pages */}
                  <Route
                    path="/about"
                    element={
                      <MainLayout>
                        <AboutPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <MainLayout>
                        <ContactPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/privacy"
                    element={
                      <MainLayout>
                        <PrivacyPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/terms"
                    element={
                      <MainLayout>
                        <TermsPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/refund-policy"
                    element={
                      <MainLayout>
                        <RefundPolicyPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/copyright"
                    element={
                      <MainLayout>
                        <CopyrightPage />
                      </MainLayout>
                    }
                  />

                  {/* Main App Routes */}
                  <Route
                    path="/"
                    element={
                      <MainLayout>
                        <Home />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/library"
                    element={
                      <MainLayout>
                        <ProtectedRoute>
                          <LibraryPage />
                        </ProtectedRoute>
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/quick-bites"
                    element={
                      <MainLayout>
                        <ProtectedRoute>
                          <QuickBitesPage />
                        </ProtectedRoute>
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/followed"
                    element={
                      <MainLayout>
                        <ProtectedRoute>
                          <FollowedPage />
                        </ProtectedRoute>
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/community"
                    element={
                      <MainLayout>
                        <ProtectedRoute>
                          <CommunityPage />
                        </ProtectedRoute>
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <MainLayout>
                        <ProtectedRoute>
                          <HistoryPage />
                        </ProtectedRoute>
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <MainLayout>
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/profile/search"
                    element={
                      <MainLayout>
                        <SearchProfilesPage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/@:username"
                    element={
                      <MainLayout>
                        <UserProfilePage />
                      </MainLayout>
                    }
                  />
                  <Route
                    path="/creator/:username"
                    element={
                      <MainLayout>
                        <CreatorProfilePage />
                      </MainLayout>
                    }
                  />

                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </AudioProvider>
          </ThemeProvider>
        </ConnectionProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;