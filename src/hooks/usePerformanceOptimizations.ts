/**
 * Hook para otimizações de performance
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// Hook para lazy loading de imagens
export function useLazyImage(src: string, threshold = 0.1) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (inView && src) {
      const img = new Image();
      img.onload = () => setLoaded(true);
      img.src = src;
    }
  }, [inView, src]);

  return { imgRef, loaded, inView };
}

// Hook para intersection observer
export function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '0px'
) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView };
}

// Hook para debounce otimizado
export function useOptimizedDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para throttle
export function useThrottle<T>(value: T, limit: number) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, limit]);

  return throttledValue;
}

// Hook para memoização de funções caras
export function useExpensiveCalculation<T, R>(
  fn: (value: T) => R,
  deps: T,
  enabled = true
) {
  const cache = useRef<Map<string, R>>(new Map());
  
  return useCallback(() => {
    if (!enabled) return undefined;
    
    const key = JSON.stringify(deps);
    
    if (cache.current.has(key)) {
      return cache.current.get(key);
    }
    
    const result = fn(deps);
    cache.current.set(key, result);
    
    // Limpar cache se ficar muito grande
    if (cache.current.size > 100) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    return result;
  }, [fn, deps, enabled]);
}

// Hook para otimização de scroll
export function useScrollOptimization() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const updateScrollY = useCallback(() => {
    const scrollY = window.scrollY;
    
    if (scrollY > lastScrollY.current) {
      setScrollDirection('down');
    } else if (scrollY < lastScrollY.current) {
      setScrollDirection('up');
    }
    
    setScrollY(scrollY);
    lastScrollY.current = scrollY;
    ticking.current = false;
  }, []);

  const requestTick = useCallback(() => {
    if (!ticking.current) {
      requestAnimationFrame(updateScrollY);
      ticking.current = true;
    }
  }, [updateScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', requestTick, { passive: true });
    return () => window.removeEventListener('scroll', requestTick);
  }, [requestTick]);

  return { scrollY, scrollDirection };
}

// Hook para resize observer otimizado
export function useResizeObserver() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

// Hook para performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const measure = () => {
      if (performance.getEntriesByType) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        setMetrics({
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
        });
      }
    };

    // Medir após o load
    if (document.readyState === 'complete') {
      measure();
    } else {
      window.addEventListener('load', measure);
    }

    return () => window.removeEventListener('load', measure);
  }, []);

  return metrics;
}

// Hook para prefetch de recursos
export function usePrefetch() {
  const prefetch = useCallback((href: string, as?: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    if (as) link.as = as;
    
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const preload = useCallback((href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return { prefetch, preload };
}