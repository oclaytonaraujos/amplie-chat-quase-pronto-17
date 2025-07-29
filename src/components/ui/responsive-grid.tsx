/**
 * Sistema de grid responsivo avançado
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  autoFit?: boolean;
  minItemWidth?: string;
  maxItemWidth?: string;
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = { default: 4 },
  autoFit = false,
  minItemWidth = "280px",
  maxItemWidth = "1fr"
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const classes = ['grid'];

    if (autoFit) {
      // Use CSS Grid auto-fit for responsive design
      return cn(
        classes,
        'grid-cols-[repeat(auto-fit,minmax(var(--min-item-width),var(--max-item-width)))]'
      );
    }

    // Manual responsive breakpoints
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);

    return cn(classes);
  };

  const getGapClasses = () => {
    const classes = [];
    
    if (gap.default) classes.push(`gap-${gap.default}`);
    if (gap.sm) classes.push(`sm:gap-${gap.sm}`);
    if (gap.md) classes.push(`md:gap-${gap.md}`);
    if (gap.lg) classes.push(`lg:gap-${gap.lg}`);
    if (gap.xl) classes.push(`xl:gap-${gap.xl}`);
    if (gap['2xl']) classes.push(`2xl:gap-${gap['2xl']}`);

    return cn(classes);
  };

  const style = autoFit ? {
    '--min-item-width': minItemWidth,
    '--max-item-width': maxItemWidth
  } as React.CSSProperties : undefined;

  return (
    <div
      className={cn(
        getGridClasses(),
        getGapClasses(),
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

// Componente para cards responsivos
interface ResponsiveCardGridProps {
  children: React.ReactNode;
  className?: string;
  minCardWidth?: string;
  maxCardWidth?: string;
  gap?: string;
}

export function ResponsiveCardGrid({
  children,
  className,
  minCardWidth = "320px",
  maxCardWidth = "400px",
  gap = "1.5rem"
}: ResponsiveCardGridProps) {
  return (
    <div
      className={cn(
        "grid auto-fit-grid",
        className
      )}
      style={{
        '--min-card-width': minCardWidth,
        '--max-card-width': maxCardWidth,
        '--grid-gap': gap,
        gridTemplateColumns: `repeat(auto-fit, minmax(var(--min-card-width), var(--max-card-width)))`,
        gap: 'var(--grid-gap)'
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Componente para masonry layout
interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
}

export function MasonryGrid({
  children,
  className,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = "1rem"
}: MasonryGridProps) {
  const getColumnClasses = () => {
    const classes = [];
    
    if (columns.default) classes.push(`columns-${columns.default}`);
    if (columns.sm) classes.push(`sm:columns-${columns.sm}`);
    if (columns.md) classes.push(`md:columns-${columns.md}`);
    if (columns.lg) classes.push(`lg:columns-${columns.lg}`);
    if (columns.xl) classes.push(`xl:columns-${columns.xl}`);

    return cn(classes);
  };

  return (
    <div
      className={cn(
        getColumnClasses(),
        "space-y-4",
        className
      )}
      style={{ gap } as React.CSSProperties}
    >
      {React.Children.map(children, (child, index) => (
        <div key={index} className="break-inside-avoid">
          {child}
        </div>
      ))}
    </div>
  );
}

// Hook para detecção de breakpoints
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<string>('default');

  React.useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= 1536) setBreakpoint('2xl');
      else if (width >= 1280) setBreakpoint('xl');
      else if (width >= 1024) setBreakpoint('lg');
      else if (width >= 768) setBreakpoint('md');
      else if (width >= 640) setBreakpoint('sm');
      else setBreakpoint('default');
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  return breakpoint;
}

// Hook para grid responsivo
export function useResponsiveGrid(config: ResponsiveGridProps['cols']) {
  const breakpoint = useBreakpoint();
  
  const columns = React.useMemo(() => {
    if (!config) return 1;
    
    switch (breakpoint) {
      case '2xl': return config['2xl'] || config.xl || config.lg || config.md || config.sm || config.default || 1;
      case 'xl': return config.xl || config.lg || config.md || config.sm || config.default || 1;
      case 'lg': return config.lg || config.md || config.sm || config.default || 1;
      case 'md': return config.md || config.sm || config.default || 1;
      case 'sm': return config.sm || config.default || 1;
      default: return config.default || 1;
    }
  }, [breakpoint, config]);

  return { columns, breakpoint };
}