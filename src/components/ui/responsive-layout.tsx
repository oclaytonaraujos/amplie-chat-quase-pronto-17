import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};

type Breakpoint = keyof BreakpointConfig;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  breakpoints?: Partial<BreakpointConfig>;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  breakpoints = {},
}) => {
  const finalBreakpoints = { ...defaultBreakpoints, ...breakpoints };
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('mobile');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });

      if (width >= finalBreakpoints.wide) {
        setCurrentBreakpoint('wide');
      } else if (width >= finalBreakpoints.desktop) {
        setCurrentBreakpoint('desktop');
      } else if (width >= finalBreakpoints.tablet) {
        setCurrentBreakpoint('tablet');
      } else {
        setCurrentBreakpoint('mobile');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [finalBreakpoints]);

  const layoutClasses = cn(
    'responsive-layout',
    `breakpoint-${currentBreakpoint}`,
    {
      'mobile-layout': currentBreakpoint === 'mobile',
      'tablet-layout': currentBreakpoint === 'tablet',
      'desktop-layout': currentBreakpoint === 'desktop',
      'wide-layout': currentBreakpoint === 'wide',
    },
    className
  );

  return (
    <div 
      className={layoutClasses}
      data-breakpoint={currentBreakpoint}
      data-width={windowSize.width}
      data-height={windowSize.height}
    >
      {children}
    </div>
  );
};

// Hook para acessar informações responsivas
export const useResponsive = (breakpoints?: Partial<BreakpointConfig>) => {
  const finalBreakpoints = { ...defaultBreakpoints, ...breakpoints };
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('mobile');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });

      if (width >= finalBreakpoints.wide) {
        setCurrentBreakpoint('wide');
      } else if (width >= finalBreakpoints.desktop) {
        setCurrentBreakpoint('desktop');
      } else if (width >= finalBreakpoints.tablet) {
        setCurrentBreakpoint('tablet');
      } else {
        setCurrentBreakpoint('mobile');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [finalBreakpoints]);

  return {
    currentBreakpoint,
    windowSize,
    isMobile: currentBreakpoint === 'mobile',
    isTablet: currentBreakpoint === 'tablet',
    isDesktop: currentBreakpoint === 'desktop',
    isWide: currentBreakpoint === 'wide',
    isTabletOrLarger: ['tablet', 'desktop', 'wide'].includes(currentBreakpoint),
    isDesktopOrLarger: ['desktop', 'wide'].includes(currentBreakpoint),
  };
};

// Componente para mostrar/esconder baseado no breakpoint
interface BreakpointVisibilityProps {
  children: React.ReactNode;
  show?: Breakpoint[];
  hide?: Breakpoint[];
  className?: string;
}

export const BreakpointVisibility: React.FC<BreakpointVisibilityProps> = ({
  children,
  show,
  hide,
  className,
}) => {
  const { currentBreakpoint } = useResponsive();

  const shouldShow = () => {
    if (show && !show.includes(currentBreakpoint)) return false;
    if (hide && hide.includes(currentBreakpoint)) return false;
    return true;
  };

  if (!shouldShow()) return null;

  return <div className={className}>{children}</div>;
};

// Componente para layout grid responsivo
interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
    wide?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
  gap = 'gap-4',
  className,
}) => {
  const { currentBreakpoint } = useResponsive();
  
  const currentColumns = columns[currentBreakpoint] || columns.mobile || 1;
  
  const gridClasses = cn(
    'grid',
    gap,
    `grid-cols-${currentColumns}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

// Componente para espaçamento responsivo
interface ResponsiveSpacingProps {
  children: React.ReactNode;
  padding?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    wide?: string;
  };
  margin?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
    wide?: string;
  };
  className?: string;
}

export const ResponsiveSpacing: React.FC<ResponsiveSpacingProps> = ({
  children,
  padding,
  margin,
  className,
}) => {
  const { currentBreakpoint } = useResponsive();
  
  const currentPadding = padding?.[currentBreakpoint];
  const currentMargin = margin?.[currentBreakpoint];
  
  const spacingClasses = cn(
    currentPadding,
    currentMargin,
    className
  );

  return (
    <div className={spacingClasses}>
      {children}
    </div>
  );
};

// Higher-order component para componentes responsivos
export function withResponsive<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ResponsiveComponent(props: P) {
    const responsiveProps = useResponsive();
    
    return (
      <ResponsiveLayout>
        <Component {...props} {...responsiveProps} />
      </ResponsiveLayout>
    );
  };
}