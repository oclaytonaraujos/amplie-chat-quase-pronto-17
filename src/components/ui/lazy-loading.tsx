/**
 * Lazy loading de componentes e páginas
 */
import React, { Suspense, lazy, ComponentType } from 'react';
import { Loading } from '@/components/ui/loading-states';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

// Componente para lazy loading com fallback
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
}

export function LazyWrapper({ 
  children, 
  fallback = <Loading variant="spinner" size="lg" text="Carregando componente..." />,
  error = <div className="p-4 text-center text-destructive">Erro ao carregar componente</div>
}: LazyComponentProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// HOC para lazy loading com configurações avançadas
interface LazyOptions {
  delay?: number;
  retries?: number;
  fallback?: React.ComponentType;
  errorBoundary?: boolean;
}

export function withLazy<T extends {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: LazyOptions = {}
) {
  const {
    delay = 0,
    retries = 3,
    fallback: FallbackComponent,
    errorBoundary = true
  } = options;

  const LazyComponent = lazy(() => {
    let retryCount = 0;
    
    const loadWithRetry = async (): Promise<{ default: ComponentType<T> }> => {
      try {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        return await importFn();
      } catch (error) {
        if (retryCount < retries) {
          retryCount++;
          console.warn(`Retry ${retryCount}/${retries} for lazy component`);
          return loadWithRetry();
        }
        throw error;
      }
    };

    return loadWithRetry();
  });

  const WrappedComponent = (props: T) => {
    const fallback = FallbackComponent ? 
      <FallbackComponent /> : 
      <Loading variant="spinner" size="lg" text="Carregando..." />;

    const content = (
      <Suspense fallback={fallback}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );

    return errorBoundary ? (
      <ErrorBoundary>
        {content}
      </ErrorBoundary>
    ) : content;
  };

  WrappedComponent.displayName = `withLazy(Component)`;
  
  return WrappedComponent;
}

// Hook para preload de componentes
export function usePreloadComponent() {
  const preloadedComponents = React.useRef<Set<string>>(new Set());

  const preload = React.useCallback((
    importFn: () => Promise<any>,
    key: string
  ) => {
    if (preloadedComponents.current.has(key)) return;
    
    preloadedComponents.current.add(key);
    importFn().catch(error => {
      console.error(`Failed to preload component ${key}:`, error);
      preloadedComponents.current.delete(key);
    });
  }, []);

  return { preload };
}

// Componente para lazy loading de imagens
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  threshold?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjwvc3ZnPg==',
  threshold = 0.1,
  onLoad,
  onError,
  className,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let observer: IntersectionObserver;
    
    if (imageRef && !isLoaded && !hasError) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
              onLoad?.();
            };
            img.onerror = () => {
              setHasError(true);
              onError?.();
            };
            img.src = src;
            observer.disconnect();
          }
        },
        { threshold }
      );
      
      observer.observe(imageRef);
    }

    return () => observer?.disconnect();
  }, [imageRef, src, isLoaded, hasError, threshold, onLoad, onError]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      className={cn(
        "transition-opacity duration-300",
        !isLoaded && "opacity-50",
        className
      )}
      {...props}
    />
  );
}

// Hook para lazy loading de dados
interface UseLazyDataOptions<T> {
  enabled?: boolean;
  threshold?: number;
  fetchOnMount?: boolean;
}

export function useLazyData<T>(
  fetchFn: () => Promise<T>,
  options: UseLazyDataOptions<T> = {}
) {
  const {
    enabled = true,
    threshold = 0.1,
    fetchOnMount = false
  } = options;

  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ref, setRef] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    if (fetchOnMount) {
      loadData();
      return;
    }

    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadData();
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, enabled, fetchOnMount]);

  const loadData = React.useCallback(async () => {
    if (isLoading || data) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, isLoading, data]);

  return {
    ref: setRef,
    data,
    isLoading,
    error,
    reload: loadData
  };
}

// Lazy loading para seções da página
interface LazySectionProps {
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  once?: boolean;
  placeholder?: React.ReactNode;
}

export function LazySection({
  children,
  className,
  threshold = 0.1,
  once = true,
  placeholder = <div className="h-32 loading-shimmer rounded" />
}: LazySectionProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [ref, setRef] = React.useState<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold, once]);

  return (
    <div ref={setRef} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}