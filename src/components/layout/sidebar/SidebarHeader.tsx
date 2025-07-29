
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarHeaderProps {
  isMobile: boolean;
  isCollapsed: boolean;
  onClose?: () => void;
  onToggleCollapse: () => void;
}

export function SidebarHeader({ 
  isMobile, 
  isCollapsed, 
  onClose, 
  onToggleCollapse 
}: SidebarHeaderProps) {
  return (
    <div className="p-4 sm:p-6 border-b border-gray-700/30 flex-shrink-0 relative px-[10px]">
      <div className="flex items-center justify-between">
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="absolute right-3 sm:right-4 top-3 sm:top-4 p-1.5 rounded-lg hover:bg-amplie-sidebar-hover text-gray-400 hover:text-white transition-colors z-10 touch-manipulation active:scale-95"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {!isCollapsed && (
          <div className="flex items-center space-x-2 pr-8 sm:pr-0">
            <img 
              src="/lovable-uploads/8ed7aa80-8a43-4375-a757-0f7dd486297f.png" 
              alt="Amplie Chat" 
              className="h-6 object-contain filter brightness-0 invert"
            />
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-full flex justify-center">
            <img 
              src="/lovable-uploads/eddc7fb8-220e-433f-89b2-915fbe2e2daf.png" 
              alt="Amplie Icon" 
              className="h-8 sm:h-10 w-8 sm:w-10 object-contain filter brightness-0 invert"
            />
          </div>
        )}
      </div>
      
      {/* Toggle button - only show on desktop */}
      {!isMobile && (
        <button
          onClick={onToggleCollapse}
          className={cn(
            "p-1.5 rounded-lg hover:bg-amplie-sidebar-hover text-gray-400 hover:text-white transition-all duration-200 touch-manipulation active:scale-95",
            isCollapsed 
              ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-amplie-sidebar border border-gray-700/30 shadow-lg z-10"
              : "absolute right-4 sm:right-6 top-1/2 -translate-y-1/2"
          )}
          style={{ touchAction: 'manipulation' }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
