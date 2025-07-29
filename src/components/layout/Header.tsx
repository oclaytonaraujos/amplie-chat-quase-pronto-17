
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationDropdown } from './NotificationDropdown';
import { SettingsDropdown } from './SettingsDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { ConnectionStatusBar } from './ConnectionStatusBar';

interface HeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
  sidebarWidth?: number;
  isScrolled?: boolean;
}

export function Header({ 
  title, 
  description,
  icon,
  showMenuButton = false, 
  onMenuClick, 
  sidebarWidth = 0,
  isScrolled = false
}: HeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <header 
      className={`
        fixed top-0 right-0 z-40 transition-all duration-300 ease-out
        ${showMenuButton ? 'left-0 mx-2 sm:mx-4' : 'ml-2 sm:ml-4 mr-2 sm:mr-4'}
        mt-2 sm:mt-4
        ${isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border border-gray-200/50 dark:border-gray-700/50' 
          : 'bg-transparent border-transparent'
        }
        rounded-xl px-3 sm:px-4 md:px-6 py-3 sm:py-4
        safe-area-inset-top
      `}
      style={{
        left: showMenuButton ? (window.innerWidth < 640 ? '8px' : '16px') : `${sidebarWidth + (window.innerWidth < 640 ? 8 : 16)}px`,
        WebkitBackdropFilter: 'blur(12px)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left side - Menu button + Title with Icon */}
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          {showMenuButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className="shrink-0 touch-manipulation active:scale-95 transition-transform duration-150 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 h-9 w-9 sm:h-10 sm:w-10"
              style={{ touchAction: 'manipulation' }}
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          )}
          
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {icon && (
              <div className="shrink-0 p-2 sm:p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="w-4 h-4 sm:w-6 sm:h-6">
                  {icon}
                </div>
              </div>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h1>
              {description ? (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                  {description}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate hidden sm:block">
                  Bem-vindo ao painel de controle do Amplie Chat
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Actions with mobile optimization */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 shrink-0">
          {/* Real-time Notifications */}
          <div className="touch-manipulation">
            <ConnectionStatusBar />
          </div>

          {/* Legacy Notifications */}
          <div className="touch-manipulation hidden">
            <NotificationDropdown />
          </div>

          {/* Settings */}
          <div className="touch-manipulation hidden sm:block">
            <SettingsDropdown />
          </div>

          {/* User Menu */}
          <div className="touch-manipulation">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
