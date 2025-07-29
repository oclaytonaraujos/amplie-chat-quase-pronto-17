/**
 * Responsive Optimization Components
 */
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  desktopClassName
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      className,
      isMobile ? mobileClassName : desktopClassName
    )}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className
}) => {
  const gridClasses = `
    grid
    grid-cols-${columns.mobile}
    md:grid-cols-${columns.tablet}
    lg:grid-cols-${columns.desktop}
    gap-${gap}
  `;

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  );
};

// Adaptive Text Component
interface AdaptiveTextProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AdaptiveText: React.FC<AdaptiveTextProps> = ({
  children,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'text-sm md:text-base',
    md: 'text-base md:text-lg',
    lg: 'text-lg md:text-xl',
    xl: 'text-xl md:text-2xl'
  };

  return (
    <span className={cn(sizeClasses[size], className)}>
      {children}
    </span>
  );
};

// Touch-Optimized Button
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false
}) => {
  const isMobile = useIsMobile();

  const baseClasses = 'rounded-lg font-medium transition-all active:scale-95';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground'
  };

  const sizeClasses = {
    sm: isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-4 text-base min-h-[44px]' : 'px-4 py-2 text-base',
    lg: isMobile ? 'px-8 py-5 text-lg min-h-[48px]' : 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

// Mobile-First Card Component
interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'sm'
}) => {
  const isMobile = useIsMobile();

  const paddingClasses = {
    sm: isMobile ? 'p-3' : 'p-4',
    md: isMobile ? 'p-4' : 'p-6',
    lg: isMobile ? 'p-6' : 'p-8'
  };

  const shadowClasses = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div className={cn(
      'bg-card text-card-foreground border border-border rounded-lg',
      paddingClasses[padding],
      shadowClasses[shadow],
      className
    )}>
      {children}
    </div>
  );
};

// Viewport Detector Hook
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Breakpoint Hook
export const useBreakpoint = () => {
  const { width } = useViewport();

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isLarge: width >= 1280,
    width
  };
};