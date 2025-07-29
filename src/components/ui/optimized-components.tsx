/**
 * Componentes otimizados para performance com lazy loading e memoização
 */
import React, { memo, lazy, Suspense, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';
import { useIntelligentPreload } from '@/utils/intelligent-preload';

// Card otimizado com lazy loading de conteúdo
interface OptimizedCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  lazy?: boolean;
  skeleton?: React.ReactNode;
}

export const OptimizedCard = memo(forwardRef<HTMLDivElement, OptimizedCardProps>(
  ({ title, children, className, lazy = false, skeleton, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(!lazy);

    React.useEffect(() => {
      if (!lazy) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref && typeof ref === 'object' && ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [lazy, ref]);

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          className
        )}
        {...props}
      >
        <div className="p-6">
          <h3 className="font-semibold leading-none tracking-tight mb-4">
            {title}
          </h3>
          {isVisible ? children : (skeleton || <CardSkeleton />)}
        </div>
      </div>
    );
  }
));

OptimizedCard.displayName = "OptimizedCard";

// Skeleton padrão para cards
const CardSkeleton = memo(() => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
));

// Lista otimizada com virtualização automática
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  className?: string;
  itemHeight?: number;
  virtualizeThreshold?: number;
  emptyState?: React.ReactNode;
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemHeight = 60,
  virtualizeThreshold = 50,
  emptyState
}: OptimizedListProps<T>) {
  const shouldVirtualize = items.length > virtualizeThreshold;

  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {emptyState || <p className="text-muted-foreground">Nenhum item encontrado</p>}
      </div>
    );
  }

  if (shouldVirtualize) {
    // Importar VirtualScroll dinamicamente
    const VirtualScroll = lazy(() => 
      import('./virtual-scroll').then(module => ({ default: module.VirtualScroll }))
    );

    return (
      <Suspense fallback={<ListSkeleton count={10} />}>
        <VirtualScroll
          items={items}
          itemHeight={itemHeight}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          className={className}
        />
      </Suspense>
    );
  }

  // Lista simples para poucos itens
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

// Skeleton para listas
const ListSkeleton = memo(({ count = 5 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
));

// Componente de imagem otimizada com lazy loading
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  lazy?: boolean;
}

export const OptimizedImage = memo(forwardRef<HTMLImageElement, OptimizedImageProps>(
  ({ src, alt, fallback, className, lazy = true, ...props }, ref) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const [inView, setInView] = React.useState(!lazy);

    React.useEffect(() => {
      if (!lazy) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref && typeof ref === 'object' && ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [lazy, ref]);

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setHasError(true);

    if (!inView) {
      return (
        <div
          ref={ref}
          className={cn("bg-muted animate-pulse", className)}
          style={{ aspectRatio: '16/9' }}
        />
      );
    }

    if (hasError && fallback) {
      return (
        <img
          ref={ref}
          src={fallback}
          alt={alt}
          className={className}
          {...props}
        />
      );
    }

    return (
      <div className="relative">
        {!isLoaded && (
          <Skeleton className={cn("absolute inset-0", className)} />
        )}
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </div>
    );
  }
));

OptimizedImage.displayName = "OptimizedImage";

// Hook para componentes otimizados
export function useOptimizedComponent() {
  const { preload, isLoaded } = useIntelligentPreload();

  const preloadComponent = React.useCallback(
    (componentName: string, loader: () => Promise<any>) => {
      preload(componentName, loader, {
        priority: 'medium',
        trigger: 'hover',
        dependencies: []
      });
    },
    [preload]
  );

  return {
    preloadComponent,
    isLoaded
  };
}

// Wrapper para lazy components com fallback inteligente
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export const LazyWrapper = memo(({ 
  children, 
  fallback, 
  errorFallback 
}: LazyWrapperProps) => {
  return (
    <Suspense fallback={fallback || <ComponentSkeleton />}>
      {children}
    </Suspense>
  );
});

LazyWrapper.displayName = "LazyWrapper";

// Skeleton genérico para componentes
const ComponentSkeleton = memo(() => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-1/3" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  </div>
));