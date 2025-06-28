import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Settings,
  Bookmark,
  Search,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Sun,
  Moon,
  Type,
  AlignLeft,
  Highlighter,
  StickyNote,
  Share,
  Download,
  X,
  Menu,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/theme-provider';
import { PDFViewer } from './pdf-viewer';

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: 'light' | 'sepia' | 'dark';
  fontFamily: string;
  textAlign: 'left' | 'justify';
}

interface Highlight {
  id: string;
  text: string;
  color: string;
  note?: string;
  createdAt: string;
}

interface Bookmark {
  id: string;
  position: number;
  text: string;
  createdAt: string;
}

interface Chapter {
  id: string;
  title: string;
  content: string;
  order?: number;
}

interface BookProps {
  id: string;
  title: string;
  content?: string;
  chapters?: Chapter[];
  author_id: string;
  price: number;
  status: string;
  file_url?: string;
  file_type?: string;
}

export function EReader({ book }: { book: BookProps }) {
  const navigate = useNavigate();
  const { theme: systemTheme } = useTheme();
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 18,
    lineHeight: 1.6,
    theme: systemTheme === 'dark' ? 'dark' : 'light',
    fontFamily: 'Georgia',
    textAlign: 'left',
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const chaptersRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check if the book has a file
  const isPdf = book.file_url && book.file_type === 'application/pdf';
  const isHtml =
    book.file_url &&
    (book.file_type === 'text/html' ||
      book.file_url.endsWith('.html') ||
      book.file_url.endsWith('.htm'));

  // Get chapters from book or create a single chapter from content
  const chapters =
    book.chapters && book.chapters.length > 0
      ? book.chapters
      : book.content
      ? [
          {
            id: 'main',
            title: 'Full Content',
            content: book.content,
          },
        ]
      : [];

  // Calculate total pages based on content length
  useEffect(() => {
    if (chapters.length > 0 && !isPdf && !isHtml) {
      // Rough estimate: 2000 characters per page
      const currentChapterContent = chapters[currentChapter]?.content || '';
      const estimatedPages = Math.max(
        1,
        Math.ceil(currentChapterContent.length / 2000)
      );
      setTotalPages(estimatedPages);
    }
  }, [chapters, currentChapter, isPdf, isHtml]);

  // Load HTML content if needed
  useEffect(() => {
    if (isHtml && book.file_url) {
      const loadHtml = async () => {
        try {
          const response = await fetch(book.file_url!);
          if (!response.ok) {
            throw new Error(`Failed to load HTML content: ${response.status}`);
          }
          const html = await response.text();
          setHtmlContent(html);
        } catch (error) {
          console.error('Error loading HTML content:', error);
        }
      };

      loadHtml();
    }
  }, [isHtml, book.file_url]);

  // Apply theme and settings to iframe content
  useEffect(() => {
    if (
      isHtml &&
      iframeRef.current &&
      iframeRef.current.contentDocument &&
      iframeLoaded
    ) {
      try {
        const iframeDoc = iframeRef.current.contentDocument;

        // Remove existing style if present
        const existingStyle = iframeDoc.getElementById('reader-styles');
        if (existingStyle) {
          existingStyle.remove();
        }

        const style = iframeDoc.createElement('style');
        style.id = 'reader-styles';

        // Create CSS based on current settings
        style.textContent = `
          body {
            font-family: ${settings.fontFamily}, serif !important;
            font-size: ${settings.fontSize}px !important;
            line-height: ${settings.lineHeight} !important;
            text-align: ${settings.textAlign} !important;
            color: ${
              settings.theme === 'dark'
                ? '#e1e1e1'
                : settings.theme === 'sepia'
                ? '#5f4b32'
                : '#333'
            } !important;
            background-color: ${
              settings.theme === 'dark'
                ? '#171C26'
                : settings.theme === 'sepia'
                ? '#f4ecd8'
                : '#fff'
            } !important;
            padding: 2rem !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          a {
            color: ${
              settings.theme === 'dark'
                ? '#90caf9'
                : settings.theme === 'sepia'
                ? '#5f4b32'
                : '#1f4ead'
            } !important;
          }
          img {
            max-width: 100% !important;
            height: auto !important;
          }
          * {
            max-width: 100% !important;
          }
        `;

        // Add the style to the iframe document
        iframeDoc.head.appendChild(style);
      } catch (error) {
        console.error('Error applying styles to iframe:', error);
      }
    }
  }, [settings, isHtml, iframeLoaded]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText(selection.toString());
        setHighlightMenuPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 40,
        });
        setShowHighlightMenu(true);
      } else {
        setShowHighlightMenu(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.fontSize = `${settings.fontSize}px`;
      contentRef.current.style.lineHeight = settings.lineHeight.toString();
      contentRef.current.style.fontFamily = settings.fontFamily;
      contentRef.current.style.textAlign = settings.textAlign;
    }
  }, [settings]);

  // Sync reader theme with system theme
  useEffect(() => {
    if (systemTheme === 'dark' && settings.theme === 'light') {
      setSettings((prev) => ({ ...prev, theme: 'dark' }));
    } else if (systemTheme === 'light' && settings.theme === 'dark') {
      setSettings((prev) => ({ ...prev, theme: 'light' }));
    }
  }, [systemTheme, settings.theme]);

  const addHighlight = (color: string) => {
    if (selectedText) {
      const newHighlight: Highlight = {
        id: Date.now().toString(),
        text: selectedText,
        color,
        createdAt: new Date().toISOString(),
      };
      setHighlights((prev) => [...prev, newHighlight]);
      setShowHighlightMenu(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  const addBookmark = () => {
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      position: currentPage,
      text: `Page ${currentPage} in ${
        chapters[currentChapter]?.title || 'Chapter ' + (currentChapter + 1)
      }`,
      createdAt: new Date().toISOString(),
    };
    setBookmarks((prev) => [...prev, newBookmark]);
  };

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
  };

  const removeHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((highlight) => highlight.id !== id));
  };

  const updateHighlightNote = (id: string, note: string) => {
    setHighlights((prev) =>
      prev.map((highlight) =>
        highlight.id === id ? { ...highlight, note } : highlight
      )
    );
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of content
      contentRef.current?.scrollTo(0, 0);
    }
  };

  const handleChapterChange = (index: number) => {
    if (index >= 0 && index < chapters.length) {
      setCurrentChapter(index);
      setCurrentPage(1);
      setShowChapters(false);
      // Scroll to top of content
      contentRef.current?.scrollTo(0, 0);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: book.title,
          text: `Check out this book: ${book.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDownload = () => {
    // If there's a file URL, open it in a new tab
    if (book.file_url) {
      window.open(book.file_url, '_blank');
    } else {
      alert('No downloadable file available for this book.');
    }
  };

  const getThemeClass = () => {
    switch (settings.theme) {
      case 'dark':
        return 'bg-gray-900 text-gray-100';
      case 'sepia':
        return 'bg-[#f4ecd8] text-gray-900';
      default:
        return 'bg-white text-gray-900';
    }
  };

  // Create HTML content with base styles
  const createHtmlContent = () => {
    if (!htmlContent) return null;

    // Add base styles to the HTML content
    const baseStyles = `
      <style id="reader-styles">
        body {
          font-family: ${settings.fontFamily}, serif;
          font-size: ${settings.fontSize}px;
          line-height: ${settings.lineHeight};
          text-align: ${settings.textAlign};
          color: ${
            settings.theme === 'dark'
              ? '#e1e1e1'
              : settings.theme === 'sepia'
              ? '#5f4b32'
              : '#333'
          };
          background-color: ${
            settings.theme === 'dark'
              ? '#171C26'
              : settings.theme === 'sepia'
              ? '#f4ecd8'
              : '#fff'
          };
          padding: 2rem;
          margin: 0;
          max-width: 100%;
        }
        a { color: ${
          settings.theme === 'dark'
            ? '#90caf9'
            : settings.theme === 'sepia'
            ? '#5f4b32'
            : '#1f4ead'
        }; }
        img { max-width: 100%; height: auto; }
        * { max-width: 100%; }
      </style>
    `;

    // Insert base styles into the HTML content
    let processedHtml = htmlContent;
    if (processedHtml.includes('<head>')) {
      processedHtml = processedHtml.replace('<head>', `<head>${baseStyles}`);
    } else if (processedHtml.includes('<html>')) {
      processedHtml = processedHtml.replace(
        '<html>',
        `<html><head>${baseStyles}</head>`
      );
    } else {
      processedHtml = `<html><head>${baseStyles}</head><body>${processedHtml}</body></html>`;
    }

    return processedHtml;
  };

  return (
    <div
      className={`min-h-screen ${getThemeClass()} transition-colors duration-300`}
    >
      {/* Top Bar */}
      <div
        className={`fixed top-0 left-0 right-0 h-14 border-b ${
          settings.theme === 'dark'
            ? 'bg-gray-900/95 backdrop-blur border-gray-800'
            : settings.theme === 'sepia'
            ? 'bg-[#f4ecd8]/95 backdrop-blur border-amber-200'
            : 'bg-white/95 backdrop-blur border-gray-200'
        } z-50 flex items-center justify-between px-4`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden md:block text-sm font-medium truncate max-w-[200px]">
            {chapters[currentChapter]?.title || `Chapter ${currentChapter + 1}`}
          </div>
          <button
            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 hover:bg-accent rounded-lg transition-colors ${
              showSettings ? 'bg-accent' : ''
            }`}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={addBookmark}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            aria-label="Add bookmark"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowChapters(!showChapters)}
            className={`p-2 hover:bg-accent rounded-lg transition-colors ${
              showChapters ? 'bg-accent' : ''
            }`}
            aria-label="Chapters"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          className={`fixed inset-0 z-50 ${
            settings.theme === 'dark'
              ? 'bg-gray-900'
              : settings.theme === 'sepia'
              ? 'bg-[#f4ecd8]'
              : 'bg-white'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">{book.title}</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Chapters</h3>
                  <div className="space-y-2">
                    {chapters.map((chapter, index) => (
                      <button
                        key={chapter.id}
                        onClick={() => {
                          handleChapterChange(index);
                          setShowMobileMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          currentChapter === index
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                      >
                        {chapter.title || `Chapter ${index + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Bookmarks</h3>
                  {bookmarks.length > 0 ? (
                    <div className="space-y-2">
                      {bookmarks.map((bookmark) => (
                        <div
                          key={bookmark.id}
                          className="flex items-center justify-between p-2 rounded-lg border"
                        >
                          <span className="text-sm">{bookmark.text}</span>
                          <button
                            onClick={() => removeBookmark(bookmark.id)}
                            className="p-1 hover:bg-accent rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No bookmarks yet
                    </p>
                  )}
                </div>

                {/* File Download Link */}
                {book.file_url && (
                  <div>
                    <h3 className="font-medium mb-2">Download</h3>
                    <a
                      href={book.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">Download Original File</span>
                      <ExternalLink className="w-4 h-4 ml-auto" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  navigate(-1);
                }}
                className="w-full px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div
          className={`fixed top-14 right-0 w-80 h-[calc(100vh-3.5rem)] border-l ${
            settings.theme === 'dark'
              ? 'bg-gray-900/95 backdrop-blur border-gray-800'
              : settings.theme === 'sepia'
              ? 'bg-[#f4ecd8]/95 backdrop-blur border-amber-200'
              : 'bg-white/95 backdrop-blur border-gray-200'
          } p-4 space-y-6 z-40 overflow-y-auto`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Reading Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Font Size</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    fontSize: Math.max(12, prev.fontSize - 2),
                  }))
                }
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm">{settings.fontSize}px</span>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    fontSize: Math.min(24, prev.fontSize + 2),
                  }))
                }
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Line Height</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    lineHeight: Math.max(1.2, prev.lineHeight - 0.2),
                  }))
                }
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm">{settings.lineHeight.toFixed(1)}</span>
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    lineHeight: Math.min(2.4, prev.lineHeight + 0.2),
                  }))
                }
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  setSettings((prev) => ({ ...prev, theme: 'light' }))
                }
                className={`p-2 rounded-lg flex items-center justify-center ${
                  settings.theme === 'light'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setSettings((prev) => ({ ...prev, theme: 'sepia' }))
                }
                className={`p-2 rounded-lg flex items-center justify-center ${
                  settings.theme === 'sepia'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setSettings((prev) => ({ ...prev, theme: 'dark' }))
                }
                className={`p-2 rounded-lg flex items-center justify-center ${
                  settings.theme === 'dark'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Font</label>
            <select
              value={settings.fontFamily}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, fontFamily: e.target.value }))
              }
              className={`w-full h-10 rounded-md border px-3 text-sm ${
                settings.theme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : settings.theme === 'sepia'
                  ? 'bg-[#f4ecd8] border-amber-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <option value="Georgia">Georgia</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="system-ui">System Font</option>
            </select>
          </div>

          {/* Text Alignment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Text Alignment</label>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSettings((prev) => ({ ...prev, textAlign: 'left' }))
                }
                className={`flex-1 p-2 rounded-lg flex items-center justify-center ${
                  settings.textAlign === 'left'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <AlignLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setSettings((prev) => ({ ...prev, textAlign: 'justify' }))
                }
                className={`flex-1 p-2 rounded-lg flex items-center justify-center ${
                  settings.textAlign === 'justify'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <Type className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* File Download Link */}
          {book.file_url && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Original Document</h3>
              <a
                href={book.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download File</span>
                <ExternalLink className="w-4 h-4 ml-auto" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Chapters Panel */}
      {showChapters && (
        <div
          className={`fixed top-14 left-0 w-80 h-[calc(100vh-3.5rem)] border-r ${
            settings.theme === 'dark'
              ? 'bg-gray-900/95 backdrop-blur border-gray-800'
              : settings.theme === 'sepia'
              ? 'bg-[#f4ecd8]/95 backdrop-blur border-amber-200'
              : 'bg-white/95 backdrop-blur border-gray-200'
          } p-4 space-y-4 z-40 overflow-y-auto`}
          ref={chaptersRef}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Chapters</h3>
            <button
              onClick={() => setShowChapters(false)}
              className="p-1 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                onClick={() => handleChapterChange(index)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentChapter === index
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                {chapter.title || `Chapter ${index + 1}`}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Bookmarks</h3>
            {bookmarks.length > 0 ? (
              <div className="space-y-2">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <span className="text-sm">{bookmark.text}</span>
                    <button
                      onClick={() => removeBookmark(bookmark.id)}
                      className="p-1 hover:bg-accent rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bookmarks yet</p>
            )}
          </div>

          {/* File Download Link */}
          {book.file_url && (
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">Original Document</h3>
              <a
                href={book.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download File</span>
                <ExternalLink className="w-4 h-4 ml-auto" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={`pt-20 pb-20 px-4 md:px-8 max-w-3xl mx-auto min-h-screen ${
          settings.theme === 'dark' ? 'prose-invert' : ''
        } prose prose-lg`}
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          fontFamily: settings.fontFamily,
          textAlign: settings.textAlign,
        }}
      >
        <h1 className="text-3xl font-bold mb-6">
          {chapters[currentChapter]?.title || `Chapter ${currentChapter + 1}`}
        </h1>

        {/* Render PDF viewer if it's a PDF file */}
        {isPdf ? (
          <PDFViewer fileUrl={book.file_url || ''} />
        ) : isHtml ? (
          // Render HTML content in an iframe
          <div className="w-full h-[calc(100vh-200px)]">
            {book.file_url && (
              <iframe
                ref={iframeRef}
                src={book.file_url}
                className="w-full h-full border-0"
                title={book.title}
                sandbox="allow-same-origin allow-popups"
                onLoad={handleIframeLoad}
              />
            )}
            {htmlContent && !book.file_url && (
              <iframe
                ref={iframeRef}
                srcDoc={createHtmlContent()}
                className="w-full h-full border-0"
                title={book.title}
                sandbox="allow-same-origin"
                onLoad={handleIframeLoad}
              />
            )}
          </div>
        ) : (
          /* Render chapter content with proper HTML */
          <div
            dangerouslySetInnerHTML={{
              __html: chapters[currentChapter]?.content || '',
            }}
          />
        )}

        {/* If no content is available but there's a file URL, show a download prompt */}
        {(!chapters[currentChapter]?.content ||
          chapters[currentChapter]?.content.trim() === '') &&
          book.file_url &&
          !isPdf &&
          !isHtml && (
            <div className="my-8 p-6 border rounded-lg text-center">
              <h3 className="text-xl font-semibold mb-4">Document Available</h3>
              <p className="mb-4">
                This book is available as a downloadable file. You can view it
                in your browser or download it for offline reading.
              </p>
              <div className="flex justify-center gap-4">
                <a
                  href={book.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open File</span>
                </a>
                <a
                  href={book.file_url}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          )}
      </div>

      {/* Highlight Menu */}
      {showHighlightMenu && (
        <div
          className={`fixed z-50 p-1 flex items-center gap-1 rounded-lg shadow-lg ${
            settings.theme === 'dark'
              ? 'bg-gray-800 border-gray-700'
              : settings.theme === 'sepia'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          } border`}
          style={{
            left: `${highlightMenuPosition.x}px`,
            top: `${highlightMenuPosition.y}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            onClick={() => addHighlight('#ffd700')}
            className="p-1.5 hover:bg-accent rounded"
            title="Yellow"
          >
            <Highlighter className="w-4 h-4 text-yellow-500" />
          </button>
          <button
            onClick={() => addHighlight('#90EE90')}
            className="p-1.5 hover:bg-accent rounded"
            title="Green"
          >
            <Highlighter className="w-4 h-4 text-green-500" />
          </button>
          <button
            onClick={() => addHighlight('#FFB6C1')}
            className="p-1.5 hover:bg-accent rounded"
            title="Pink"
          >
            <Highlighter className="w-4 h-4 text-pink-500" />
          </button>
          <button className="p-1.5 hover:bg-accent rounded" title="Add Note">
            <StickyNote className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 h-14 border-t ${
          settings.theme === 'dark'
            ? 'bg-gray-900/95 backdrop-blur border-gray-800'
            : settings.theme === 'sepia'
            ? 'bg-[#f4ecd8]/95 backdrop-blur border-amber-200'
            : 'bg-white/95 backdrop-blur border-gray-200'
        } z-50 flex items-center justify-between px-4`}
      >
        <div className="text-sm">
          {isPdf ? (
            <span>PDF Document</span>
          ) : isHtml ? (
            <span>HTML Document</span>
          ) : (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isPdf && !isHtml && (
            <>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="range"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value))}
                className="w-32"
              />
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-2 hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Share className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            disabled={!book.file_url}
            title={
              book.file_url ? 'Download File' : 'No downloadable file available'
            }
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}