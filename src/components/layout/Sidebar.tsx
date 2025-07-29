
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SidebarMenu } from './sidebar/SidebarMenu';
import { SidebarFooter } from './sidebar/SidebarFooter';
import { useSidebarGestures } from './sidebar/useSidebarGestures';

interface SidebarProps {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ 
  isMobile = false, 
  isOpen = false, 
  onClose, 
  onCollapsedChange 
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useSidebarGestures({ isMobile, isOpen, onClose });
  
  const isCollapsed = isMobile ? false : collapsed;

  // Notify parent component about collapse state changes
  useEffect(() => {
    if (onCollapsedChange && !isMobile) {
      onCollapsedChange(collapsed);
    }
  }, [collapsed, onCollapsedChange, isMobile]);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      isMobile ? "w-64 p-3 sm:p-4" : "w-64 p-3 sm:p-4"
    )}>
      <div 
        ref={sidebarRef}
        className={cn(
          "bg-amplie-sidebar flex-1 transition-all duration-300 ease-out relative flex flex-col rounded-2xl shadow-lg h-full transform-gpu",
          isMobile ? "w-full" : isCollapsed ? "w-16" : "w-full"
        )}
        style={{
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden',
          willChange: 'transform'
        }}
      >
        <SidebarHeader
          isMobile={isMobile}
          isCollapsed={isCollapsed}
          onClose={onClose}
          onToggleCollapse={handleToggleCollapse}
        />

        <SidebarMenu
          isCollapsed={isCollapsed}
          onLinkClick={handleLinkClick}
        />

        <SidebarFooter isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
