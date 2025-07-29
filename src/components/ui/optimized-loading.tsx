/**
 * Componentes de loading otimizados e padronizados
 * Substitui múltiplas implementações por uma versão consistente
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OptimizedLoadingProps {
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const OptimizedLoading: React.FC<OptimizedLoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="loading-shimmer h-4 w-3/4 rounded" />
        <div className="loading-shimmer h-4 w-1/2 rounded" />
        <div className="loading-shimmer h-4 w-2/3 rounded" />
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-primary rounded-full animate-bounce',
                size === 'sm' && 'w-1 h-1',
                size === 'md' && 'w-2 h-2',
                size === 'lg' && 'w-3 h-3'
              )}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'bg-primary rounded-full animate-pulse',
          sizeClasses[size]
        )} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

// Componente de skeleton otimizado para diferentes layouts
interface SkeletonLayoutProps {
  type: 'card' | 'list' | 'table' | 'chat' | 'dashboard';
  count?: number;
  className?: string;
}

export const SkeletonLayout: React.FC<SkeletonLayoutProps> = ({
  type,
  count = 3,
  className
}) => {
  switch (type) {
    case 'card':
      return (
        <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="loading-shimmer h-4 w-2/3 rounded" />
              <div className="loading-shimmer h-3 w-full rounded" />
              <div className="loading-shimmer h-3 w-4/5 rounded" />
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div className={cn('space-y-3', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="loading-shimmer w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="loading-shimmer h-4 w-3/4 rounded" />
                <div className="loading-shimmer h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'table':
      return (
        <div className={cn('space-y-3', className)}>
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="loading-shimmer h-6 flex-1 rounded" />
            ))}
          </div>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="loading-shimmer h-4 flex-1 rounded" />
              ))}
            </div>
          ))}
        </div>
      );

    case 'chat':
      return (
        <div className={cn('space-y-4', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className={cn(
              'flex max-w-xs rounded-lg p-3',
              i % 2 === 0 ? 'self-start' : 'self-end ml-auto'
            )}>
              <div className="loading-shimmer h-16 w-full rounded" />
            </div>
          ))}
        </div>
      );

    case 'dashboard':
      return (
        <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="loading-shimmer h-4 w-24 rounded" />
                <div className="loading-shimmer h-4 w-4 rounded" />
              </div>
              <div className="loading-shimmer h-8 w-16 rounded" />
              <div className="flex items-center gap-2">
                <div className="loading-shimmer h-3 w-3 rounded-full" />
                <div className="loading-shimmer h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return <OptimizedLoading variant="skeleton" className={className} />;
  }
};

// Loading overlay otimizado
interface LoadingOverlayProps {
  isVisible: boolean;
  children: React.ReactNode;
  variant?: 'blur' | 'overlay' | 'skeleton';
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  children,
  variant = 'overlay',
  message = 'Carregando...'
}) => {
  if (!isVisible) {
    return <>{children}</>;
  }

  if (variant === 'skeleton') {
    return <SkeletonLayout type="card" count={6} />;
  }

  return (
    <div className="relative">
      {variant === 'blur' && (
        <div className="filter blur-sm pointer-events-none opacity-50">
          {children}
        </div>
      )}
      
      <div className={cn(
        'absolute inset-0 flex items-center justify-center z-50',
        variant === 'overlay' && 'bg-background/80 backdrop-blur-sm'
      )}>
        <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-lg shadow-lg border">
          <OptimizedLoading size="lg" />
          <p className="text-sm text-muted-foreground text-center">{message}</p>
        </div>
      </div>
      
      {variant === 'overlay' && (
        <div className="pointer-events-none opacity-50">
          {children}
        </div>
      )}
    </div>
  );
};

// Hook para gerenciar estados de loading
export const useOptimizedLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError
  };
};