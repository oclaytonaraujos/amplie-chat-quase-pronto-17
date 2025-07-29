/**
 * Enhanced User Experience Hook
 */
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UXPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  density: 'compact' | 'comfortable' | 'spacious';
}

interface UXState {
  isLoading: boolean;
  hasError: boolean;
  isOffline: boolean;
  lastActivity: Date;
  sessionDuration: number;
}

export function useEnhancedUX() {
  const { toast } = useToast();
  
  // UX Preferences
  const [preferences, setPreferences] = useState<UXPreferences>({
    reduceMotion: false,
    highContrast: false,
    fontSize: 'md',
    density: 'comfortable'
  });

  // UX State
  const [uxState, setUxState] = useState<UXState>({
    isLoading: false,
    hasError: false,
    isOffline: !navigator.onLine,
    lastActivity: new Date(),
    sessionDuration: 0
  });

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('ux-preferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.warn('Erro ao carregar preferências UX:', error);
      }
    }

    // Check system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    if (prefersReducedMotion) {
      setPreferences(prev => ({ ...prev, reduceMotion: true }));
    }
    
    if (prefersHighContrast) {
      setPreferences(prev => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Save preferences to localStorage
  const updatePreference = useCallback((
    key: keyof UXPreferences, 
    value: UXPreferences[keyof UXPreferences]
  ) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, [key]: value };
      localStorage.setItem('ux-preferences', JSON.stringify(newPreferences));
      return newPreferences;
    });

    // Apply preferences to document
    applyPreferencesToDocument({ ...preferences, [key]: value });
  }, [preferences]);

  // Apply preferences to document
  const applyPreferencesToDocument = useCallback((prefs: UXPreferences) => {
    const { documentElement } = document;
    
    // Reduce motion
    if (prefs.reduceMotion) {
      documentElement.classList.add('reduce-motion');
    } else {
      documentElement.classList.remove('reduce-motion');
    }

    // High contrast
    if (prefs.highContrast) {
      documentElement.classList.add('high-contrast');
    } else {
      documentElement.classList.remove('high-contrast');
    }

    // Font size
    documentElement.classList.remove('font-sm', 'font-md', 'font-lg');
    documentElement.classList.add(`font-${prefs.fontSize}`);

    // Density
    documentElement.classList.remove('density-compact', 'density-comfortable', 'density-spacious');
    documentElement.classList.add(`density-${prefs.density}`);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setUxState(prev => ({ ...prev, isOffline: false }));
      toast({
        title: "Conexão restaurada",
        description: "Você está online novamente.",
        variant: "default",
      });
    };

    const handleOffline = () => {
      setUxState(prev => ({ ...prev, isOffline: true }));
      toast({
        title: "Conexão perdida",
        description: "Você está trabalhando offline.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      setUxState(prev => ({ ...prev, lastActivity: new Date() }));
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Track session duration
  useEffect(() => {
    const interval = setInterval(() => {
      setUxState(prev => ({
        ...prev,
        sessionDuration: prev.sessionDuration + 1000
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Error handling with UX improvements
  const handleError = useCallback((error: Error, context?: string) => {
    setUxState(prev => ({ ...prev, hasError: true }));
    
    toast({
      title: "Ops! Algo deu errado",
      description: context || "Ocorreu um erro inesperado. Tente novamente.",
      variant: "destructive",
    });

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setUxState(prev => ({ ...prev, hasError: false }));
    }, 5000);
  }, [toast]);

  // Loading state management
  const setLoading = useCallback((loading: boolean) => {
    setUxState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  // Smart loading with minimum time
  const smartLoading = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    minTime: number = 300
  ): Promise<T> => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const result = await asyncFn();
      const elapsed = Date.now() - startTime;
      
      if (elapsed < minTime) {
        await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
      }
      
      return result;
    } catch (error) {
      handleError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, handleError]);

  // Performance feedback
  const measurePerformance = useCallback((operation: string, duration: number) => {
    if (duration > 1000) {
      toast({
        title: "Operação lenta detectada",
        description: `${operation} demorou ${(duration / 1000).toFixed(1)}s`,
        variant: "default",
      });
    }
  }, [toast]);

  // Accessibility helpers
  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Focus management
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return {
    // State
    preferences,
    uxState,
    
    // Preference management
    updatePreference,
    
    // Loading management
    setLoading,
    smartLoading,
    
    // Error handling
    handleError,
    
    // Performance
    measurePerformance,
    
    // Accessibility
    announceToScreenReader,
    focusElement,
    
    // Utilities
    isOnline: !uxState.isOffline,
    sessionTime: uxState.sessionDuration,
    timeSinceLastActivity: Date.now() - uxState.lastActivity.getTime()
  };
}