/**
 * Hook consolidado para otimização de carregamento
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  phase: 'initializing' | 'loading' | 'ready' | 'error';
  error?: string;
}

export function useOptimizedLoading() {
  const [state, setState] = useState<LoadingState>({
    isLoading: true,
    progress: 0,
    phase: 'initializing'
  });
  
  const isMobile = useIsMobile();
  const progressRef = useRef(0);

  const updateProgress = useCallback((increment: number) => {
    progressRef.current = Math.min(100, progressRef.current + increment);
    setState(prev => ({
      ...prev,
      progress: progressRef.current,
      phase: progressRef.current >= 100 ? 'ready' : 'loading'
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      phase: 'error',
      error,
      isLoading: false
    }));
  }, []);

  const reset = useCallback(() => {
    progressRef.current = 0;
    setState({
      isLoading: true,
      progress: 0,
      phase: 'initializing'
    });
  }, []);

  const complete = useCallback(() => {
    setState({
      isLoading: false,
      progress: 100,
      phase: 'ready'
    });
  }, []);

  // Preload crítico otimizado
  useEffect(() => {
    const preloadCritical = async () => {
      try {
        setState(prev => ({ ...prev, phase: 'loading' }));

        // Preload componentes críticos baseado no device
        const criticalImports = isMobile ? [
          () => import('@/components/ui/button'),
          () => import('@/components/ui/card'),
          () => import('@/components/ui/skeleton')
        ] : [
          () => import('@/components/ui/button'),
          () => import('@/components/ui/card'),
          () => import('@/components/ui/skeleton'),
          () => import('@/components/ui/dialog'),
          () => import('@/components/ui/toast'),
          () => import('@/components/ui/input')
        ];

        // Carregar em lotes para não sobrecarregar
        const batchSize = isMobile ? 2 : 3;
        for (let i = 0; i < criticalImports.length; i += batchSize) {
          const batch = criticalImports.slice(i, i + batchSize);
          await Promise.all(batch.map(importFn => importFn()));
          updateProgress(100 / Math.ceil(criticalImports.length / batchSize));
        }

        complete();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro no carregamento');
      }
    };

    preloadCritical();
  }, [isMobile, updateProgress, complete, setError]);

  return {
    ...state,
    updateProgress,
    setError,
    reset,
    complete
  };
}

// Hook para lazy loading de imagens otimizado
export function useImageLoader(src?: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>();

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    imgRef.current = img;

    img.onload = () => {
      setLoaded(true);
      setError(false);
    };

    img.onerror = () => {
      setError(true);
      setLoaded(false);
    };

    // Lazy loading com timeout
    const timer = setTimeout(() => {
      img.src = src;
    }, 50);

    return () => {
      clearTimeout(timer);
      if (imgRef.current) {
        imgRef.current.onload = null;
        imgRef.current.onerror = null;
      }
    };
  }, [src]);

  return { loaded, error };
}

// Hook para intersection observer otimizado
export function useInView(threshold = 0.1) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold, rootMargin: '50px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}