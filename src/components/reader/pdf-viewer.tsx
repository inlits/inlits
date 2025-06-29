import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

// Import the worker directly from the package
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js?url';

// Set the worker source to the imported worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  fileUrl: string;
  className?: string;
}

export function PDFViewer({ fileUrl, className = '' }: PDFViewerProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.2);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  // Load the PDF
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading PDF from URL:', fileUrl);
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
          cMapPacked: true
        });
        
        loadingTask.onProgress = (progressData) => {
          console.log(`Loading PDF: ${Math.round(progressData.loaded / progressData.total * 100)}%`);
        };
        
        const pdfDoc = await loadingTask.promise;
        console.log('PDF loaded successfully, pages:', pdfDoc.numPages);
        
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
        setRenderedPages(new Set());
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try downloading it instead.');
      } finally {
        setLoading(false);
      }
    };

    if (fileUrl) {
      loadPDF();
    }

    return () => {
      // Clean up
      if (pdf) {
        pdf.destroy();
      }
    };
  }, [fileUrl]);

  // Render visible pages
  const renderPage = async (pageNum: number) => {
    if (!pdf || !canvasRef.current || renderedPages.has(pageNum)) return;

    try {
      console.log(`Rendering page ${pageNum}`);
      
      // Get the page
      const page = await pdf.getPage(pageNum);
      
      // Create a container for this page
      const pageContainer = document.createElement('div');
      pageContainer.className = 'pdf-page mb-4 shadow-md rounded overflow-hidden';
      pageContainer.setAttribute('data-page-number', pageNum.toString());
      
      // Create a canvas for this page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Calculate viewport
      const viewport = page.getViewport({ scale });
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      console.log(`Page ${pageNum} rendered successfully`);
      
      // Add the canvas to the page container
      pageContainer.appendChild(canvas);
      
      // Add page number label
      const pageLabel = document.createElement('div');
      pageLabel.className = 'text-center text-sm text-muted-foreground mt-1 mb-3';
      pageLabel.textContent = `Page ${pageNum} of ${numPages}`;
      pageContainer.appendChild(pageLabel);
      
      // Add the page container to the main container
      canvasRef.current.appendChild(pageContainer);
      
      // Mark this page as rendered
      setRenderedPages(prev => new Set([...prev, pageNum]));
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
    }
  };

  // Render visible pages
  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    
    // Clear existing pages if scale changes or when navigating to a new page
    if (renderedPages.size > 0 && (renderedPages.size > 3 || !renderedPages.has(currentPage))) {
      if (canvasRef.current) {
        console.log('Clearing existing pages due to scale change or page navigation');
        canvasRef.current.innerHTML = '';
        setRenderedPages(new Set());
      }
    }
    
    // Render current page and adjacent pages
    const pagesToRender = [currentPage];
    if (currentPage > 1) pagesToRender.push(currentPage - 1);
    if (currentPage < numPages) pagesToRender.push(currentPage + 1);
    
    pagesToRender.forEach(pageNum => {
      renderPage(pageNum);
    });
  }, [pdf, currentPage, numPages, scale, renderedPages]);

  // Scroll to current page
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Wait for the page to be rendered
    setTimeout(() => {
      const pageElement = canvasRef.current?.querySelector(`[data-page-number="${currentPage}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [currentPage, renderedPages]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => {
      const newScale = Math.min(prev + 0.2, 3);
      // Clear rendered pages to force re-render at new scale
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
        setRenderedPages(new Set());
      }
      return newScale;
    });
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.2, 0.6);
      // Clear rendered pages to force re-render at new scale
      if (canvasRef.current) {
        canvasRef.current.innerHTML = '';
        setRenderedPages(new Set());
      }
      return newScale;
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages]);

  return (
    <div className={`pdf-viewer ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-destructive mb-4">{error}</p>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Download PDF
          </a>
        </div>
      ) : (
        <>
          {/* PDF Controls */}
          <div className="flex items-center justify-between mb-4 p-2 bg-background/50 backdrop-blur-sm rounded-lg">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm">
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                className="p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF Content */}
          <div 
            ref={canvasRef} 
            className="pdf-container overflow-auto max-h-[calc(100vh-200px)] border rounded-lg p-4"
          />

          {/* Alternative Download Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              If the PDF isn't displaying correctly, you can download it directly:
            </p>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Download PDF
            </a>
          </div>
        </>
      )}
    </div>
  );
}