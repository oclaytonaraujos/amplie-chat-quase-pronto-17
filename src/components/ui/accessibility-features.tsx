/**
 * Accessibility Enhancement Components
 */
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Skip to Content Link
export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium"
    >
      Pular para conteúdo principal
    </a>
  );
};

// Focus Trap Component
interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    // Focus first element
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

// Keyboard Navigation Helper
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  className?: string;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onEscape,
  onEnter,
  className
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        onEnter?.();
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
};

// Screen Reader Only Text
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children
}) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
};

// High Contrast Toggle
export const HighContrastToggle: React.FC = () => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('high-contrast');
    if (stored === 'true') {
      setHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggleHighContrast = () => {
    const newState = !highContrast;
    setHighContrast(newState);
    
    if (newState) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('high-contrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('high-contrast', 'false');
    }
  };

  return (
    <button
      onClick={toggleHighContrast}
      className="p-2 rounded-md border border-border hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label={`${highContrast ? 'Desativar' : 'Ativar'} alto contraste`}
    >
      <span className="text-sm font-medium">
        {highContrast ? 'Contraste Normal' : 'Alto Contraste'}
      </span>
    </button>
  );
};

// Reduce Motion Toggle
export const ReduceMotionToggle: React.FC = () => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('reduce-motion');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (stored === 'true' || prefersReduced) {
      setReduceMotion(true);
      document.documentElement.classList.add('reduce-motion');
    }
  }, []);

  const toggleReduceMotion = () => {
    const newState = !reduceMotion;
    setReduceMotion(newState);
    
    if (newState) {
      document.documentElement.classList.add('reduce-motion');
      localStorage.setItem('reduce-motion', 'true');
    } else {
      document.documentElement.classList.remove('reduce-motion');
      localStorage.setItem('reduce-motion', 'false');
    }
  };

  return (
    <button
      onClick={toggleReduceMotion}
      className="p-2 rounded-md border border-border hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label={`${reduceMotion ? 'Ativar' : 'Reduzir'} animações`}
    >
      <span className="text-sm font-medium">
        {reduceMotion ? 'Animações Normais' : 'Reduzir Animações'}
      </span>
    </button>
  );
};

// Live Region for Dynamic Content
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
};

// Progress Announcer
interface ProgressAnnouncerProps {
  value: number;
  max: number;
  label?: string;
}

export const ProgressAnnouncer: React.FC<ProgressAnnouncerProps> = ({
  value,
  max,
  label = 'Progresso'
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <LiveRegion politeness="polite">
      {label}: {percentage}% concluído
    </LiveRegion>
  );
};

// Error Boundary with Accessibility
interface AccessibleErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AccessibleErrorBoundary: React.FC<AccessibleErrorBoundaryProps> = ({
  children,
  fallback
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div 
        role="alert" 
        aria-live="assertive"
        className="p-4 border border-destructive bg-destructive/10 rounded-md"
      >
        {fallback || (
          <div>
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Erro na aplicação
            </h2>
            <p className="text-muted-foreground">
              Algo deu errado. Por favor, recarregue a página ou entre em contato com o suporte.
            </p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};