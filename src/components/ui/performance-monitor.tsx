/**
 * Monitor de performance em tempo real
 * Rastreia métricas vitais da aplicação
 */
import React, { useEffect, useState } from 'react';
import { Card } from './card';
import { Badge } from './badge';
import { logger } from '@/utils/production-logger';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  domNodes: number;
  loadTime: number;
  networkRequests: number;
}

export const PerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    domNodes: 0,
    loadTime: 0,
    networkRequests: 0
  });

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      // FPS monitoring
      let frames = 0;
      const startTime = performance.now();
      
      function countFrames() {
        frames++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(countFrames);
        } else {
          setMetrics(prev => ({ ...prev, fps: frames }));
        }
      }
      requestAnimationFrame(countFrames);

      // Memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024)
        }));
      }

      // DOM nodes count
      setMetrics(prev => ({
        ...prev,
        domNodes: document.querySelectorAll('*').length
      }));

      // Performance timing
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        setMetrics(prev => ({
          ...prev,
          loadTime: Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart)
        }));
      }

      // Network requests count
      const resourceEntries = performance.getEntriesByType('resource');
      setMetrics(prev => ({
        ...prev,
        networkRequests: resourceEntries.length
      }));

    }, 2000);

    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    // Log performance warnings
    if (metrics.fps > 0 && metrics.fps < 30) {
      logger.warn('Low FPS detected', { 
        component: 'PerformanceMonitor',
        metadata: { fps: metrics.fps }
      });
    }

    if (metrics.memoryUsage > 100) {
      logger.warn('High memory usage detected', { 
        component: 'PerformanceMonitor',
        metadata: { memoryUsage: metrics.memoryUsage }
      });
    }
  }, [metrics]);

  if (!enabled) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-3 bg-background/80 backdrop-blur-sm border z-50">
      <div className="space-y-2 text-xs">
        <div className="font-semibold">Performance Monitor</div>
        
        <div className="flex items-center gap-2">
          <span>FPS:</span>
          <Badge variant={metrics.fps >= 50 ? 'default' : metrics.fps >= 30 ? 'secondary' : 'destructive'}>
            {metrics.fps}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span>Memory:</span>
          <Badge variant={metrics.memoryUsage < 50 ? 'default' : metrics.memoryUsage < 100 ? 'secondary' : 'destructive'}>
            {metrics.memoryUsage}MB
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span>DOM:</span>
          <Badge variant={metrics.domNodes < 1000 ? 'default' : 'secondary'}>
            {metrics.domNodes}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <span>Load:</span>
          <Badge variant={metrics.loadTime < 2000 ? 'default' : metrics.loadTime < 5000 ? 'secondary' : 'destructive'}>
            {metrics.loadTime}ms
          </Badge>
        </div>
      </div>
    </Card>
  );
};