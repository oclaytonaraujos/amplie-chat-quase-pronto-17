import { memo, Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from '@/hooks/useOptimizedLoading';

interface LazyWrapperProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  threshold?: number;
  children?: React.ReactNode;
  props?: any;
}

export const LazyWrapper = memo(({ 
  loader, 
  fallback, 
  threshold = 0.1,
  children,
  props = {}
}: LazyWrapperProps) => {
  const { ref, inView } = useInView(threshold);
  
  // Lazy load do componente
  const LazyComponent = lazy(loader);

  const defaultFallback = (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="w-full">
      {inView ? (
        <Suspense fallback={fallback || defaultFallback}>
          <LazyComponent {...props}>
            {children}
          </LazyComponent>
        </Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
});

LazyWrapper.displayName = 'LazyWrapper';

// HOC para facilitar o uso
export function withLazyLoading<T extends object>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  return memo((props: T) => (
    <LazyWrapper loader={loader} fallback={fallback} props={props} />
  ));
}