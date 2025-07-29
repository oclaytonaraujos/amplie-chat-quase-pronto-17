
import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ConnectivityIndicator } from './ConnectivityIndicator';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function Layout({ children, title, description, icon }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();

  // Detect scroll for mobile optimizations
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar && !sidebar.contains(e.target as Node)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, [isMobile, sidebarOpen]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMobile, sidebarOpen]);

  const getSidebarWidth = () => {
    if (isMobile) return 0;
    if (sidebarCollapsed) return 80;
    return 256;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden transition-colors duration-300">
      {/* Mobile sidebar overlay with touch gestures */}
      {isMobile && (
        <div 
          className={`fixed inset-0 bg-black transition-opacity duration-300 ease-out z-40 ${
            sidebarOpen ? 'opacity-50 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
          style={{ touchAction: 'manipulation' }}
        />
      )}
      
      {/* Sidebar with swipe gestures */}
      <div 
        className={`${
          isMobile 
            ? `fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'fixed inset-y-0 left-0 z-30'
        }`}
        data-sidebar
      >
        <Sidebar 
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>
      
      {/* Main content with optimized touch and scroll */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-out ${
          !isMobile ? `ml-[${getSidebarWidth()}px]` : ''
        }`}
        style={{
          marginLeft: !isMobile ? `${getSidebarWidth()}px` : '0',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        {/* Header with mobile optimizations */}
        <Header 
          title={title}
          description={description}
          icon={icon}
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton={isMobile}
          sidebarWidth={getSidebarWidth()}
          isScrolled={isScrolled}
        />
        
        {/* Main content with pull-to-refresh support */}
        <main 
          className={`flex-1 transition-all duration-200 ease-out ${
            isMobile 
              ? 'p-3 pt-20 pb-safe' 
              : 'p-4 md:p-6 pt-24 md:pt-28'
          } overflow-y-auto`}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y'
          }}
        >
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Indicador de conectividade */}
      <ConnectivityIndicator />
    </div>
  );
}
