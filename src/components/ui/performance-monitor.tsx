import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Zap, Clock, Cpu } from 'lucide-react';
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  responseTime: number;
  bundleSize: number;
  renderTime: number;
}
interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  type: string;
}
export const PerformanceMonitor: React.FC<{
  showDebugInfo?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}> = ({
  showDebugInfo = false,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    responseTime: 0,
    bundleSize: 0,
    renderTime: 0
  });
  const [isVisible, setIsVisible] = useState(showDebugInfo);

  // FPS Counter
  const measureFPS = useCallback(() => {
    let frames = 0;
    let startTime = performance.now();
    const countFrame = () => {
      frames++;
      const currentTime = performance.now();
      if (currentTime - startTime >= 1000) {
        const fps = Math.round(frames * 1000 / (currentTime - startTime));
        setMetrics(prev => ({
          ...prev,
          fps
        }));
        frames = 0;
        startTime = currentTime;
      }
      requestAnimationFrame(countFrame);
    };
    requestAnimationFrame(countFrame);
  }, []);

  // Memory Usage
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const percentage = Math.round(usedMB / totalMB * 100);
      setMetrics(prev => ({
        ...prev,
        memoryUsage: percentage
      }));
    }
  }, []);

  // Page Load Time
  const measureLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      if (navigation) {
        const loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
        setMetrics(prev => ({
          ...prev,
          loadTime
        }));
      }
    }
  }, []);

  // Bundle Size (approximate)
  const measureBundleSize = useCallback(() => {
    if (typeof window !== 'undefined') {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;
      scripts.forEach(script => {
        const src = (script as HTMLScriptElement).src;
        if (src && src.includes(window.location.origin)) {
          // Estimate based on typical JS bundle sizes
          totalSize += 500; // KB estimate per script
        }
      });
      setMetrics(prev => ({
        ...prev,
        bundleSize: totalSize
      }));
    }
  }, []);

  // Render Time Measurement
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();

    // Measure next frame render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        renderTime: Math.round(renderTime)
      }));
    });
  }, []);

  // API Response Time (disabled to improve performance)
  const measureResponseTime = useCallback(async () => {
    // Disabled to prevent constant API calls that slow down the system
    setMetrics(prev => ({
      ...prev,
      responseTime: 0
    }));
  }, []);
  useEffect(() => {
    measureFPS();
    measureLoadTime();
    measureBundleSize();

    // Update metrics periodically - reduced frequency
    const interval = setInterval(() => {
      measureMemory();
      measureRenderTime();
      // Remove constant API health checks that cause network spam
    }, 10000);
    return () => clearInterval(interval);
  }, [measureFPS, measureLoadTime, measureBundleSize, measureMemory, measureRenderTime, measureResponseTime]);
  useEffect(() => {
    onMetricsUpdate?.(metrics);
  }, [metrics, onMetricsUpdate]);

  // Performance status helpers
  const getPerformanceStatus = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      fps: {
        good: 55,
        fair: 30
      },
      memoryUsage: {
        good: 50,
        fair: 80
      },
      loadTime: {
        good: 2000,
        fair: 5000
      },
      responseTime: {
        good: 100,
        fair: 500
      },
      renderTime: {
        good: 16,
        fair: 33
      },
      bundleSize: {
        good: 500,
        fair: 1000
      }
    };
    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';
    if (metric === 'memoryUsage') {
      if (value <= threshold.good) return 'good';
      if (value <= threshold.fair) return 'fair';
      return 'poor';
    } else {
      if (value <= threshold.good) return 'good';
      if (value <= threshold.fair) return 'fair';
      return 'poor';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'good':
        return 'default';
      case 'fair':
        return 'secondary';
      case 'poor':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  if (!isVisible && !showDebugInfo) return null;
  return <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      
      
    </Card>;
};

// Hook para métricas de performance
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const logPerformance = useCallback((label: string, fn: () => void | Promise<void>) => {
    const startTime = performance.now();
    const result = fn();
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        console.debug(`Performance [${label}]:`, `${duration.toFixed(2)}ms`);
      });
    } else {
      const duration = performance.now() - startTime;
      console.debug(`Performance [${label}]:`, `${duration.toFixed(2)}ms`);
      return result;
    }
  }, []);
  return {
    metrics,
    setMetrics,
    logPerformance
  };
};