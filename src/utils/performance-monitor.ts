/**
 * Monitor de Performance para Core Web Vitals
 */

// Tipos para métricas
interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  tbt?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observer?: PerformanceObserver;

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observer para Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.handlePerformanceEntry(entry);
        }
      });

      try {
        // Observar métricas críticas
        this.observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Observer para navigation timing
        this.observer.observe({ entryTypes: ['navigation'] });
        
        // Observer para paint timing
        this.observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        console.warn('Performance Observer não suportado:', error);
      }
    }

    // Medir Time to First Byte
    this.measureTTFB();
    
    // Medir Total Blocking Time
    this.measureTBT();
  }

  private handlePerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        this.metrics.lcp = entry.startTime;
        break;
      case 'first-input':
        this.metrics.fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          this.metrics.cls = (this.metrics.cls || 0) + (entry as any).value;
        }
        break;
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
        break;
    }
  }

  private measureTTFB() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }
  }

  private measureTBT() {
    // Simular medição de TBT usando long tasks
    if ('PerformanceObserver' in window) {
      const tbtObserver = new PerformanceObserver((list) => {
        let tbt = 0;
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            tbt += entry.duration - 50;
          }
        }
        this.metrics.tbt = (this.metrics.tbt || 0) + tbt;
      });

      try {
        tbtObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task observer não suportado:', error);
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reportMetrics() {
    const report = this.getMetrics();
    
    // Log métricas apenas se estiverem fora dos thresholds
    const thresholds = {
      fcp: 1800, // ms
      lcp: 2500, // ms
      fid: 100,  // ms
      cls: 0.1,  // score
      ttfb: 800, // ms
      tbt: 200   // ms
    };

    const warnings: string[] = [];
    
    Object.entries(report).forEach(([metric, value]) => {
      if (value !== undefined && thresholds[metric as keyof typeof thresholds] !== undefined) {
        const threshold = thresholds[metric as keyof typeof thresholds];
        if (value > threshold) {
          warnings.push(`${metric.toUpperCase()}: ${Math.round(value)}${metric === 'cls' ? '' : 'ms'} (threshold: ${threshold})`);
        }
      }
    });

    if (warnings.length > 0) {
      console.warn('Performance Issues:', warnings);
    }

    return report;
  }

  disconnect() {
    this.observer?.disconnect();
  }
}

// Instância global
let performanceMonitor: PerformanceMonitor | null = null;

export const initPerformanceMonitor = () => {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
    
    // Reportar métricas após carregamento
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMonitor?.reportMetrics();
      }, 5000); // Aguardar 5s para capturar todas as métricas
    });
  }
  return performanceMonitor;
};

export const getPerformanceMetrics = () => {
  return performanceMonitor?.getMetrics() || {};
};

export const cleanupPerformanceMonitor = () => {
  performanceMonitor?.disconnect();
  performanceMonitor = null;
};