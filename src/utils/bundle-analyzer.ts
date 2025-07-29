/**
 * Analisador de bundle para otimização de performance
 */
import { logger } from './structured-logger';

interface BundleStats {
  totalSize: number;
  components: {
    name: string;
    size: number;
    loadTime: number;
    usage: number;
  }[];
  recommendations: string[];
}

interface PerformanceEntry {
  name: string;
  size?: number;
  transferSize?: number;
  duration: number;
  startTime: number;
}

class BundleAnalyzer {
  private componentUsage = new Map<string, number>();
  private loadTimes = new Map<string, number[]>();
  private sizeCache = new Map<string, number>();

  // Registrar uso de componente
  recordComponentUsage(componentName: string) {
    const current = this.componentUsage.get(componentName) || 0;
    this.componentUsage.set(componentName, current + 1);
  }

  // Registrar tempo de carregamento
  recordLoadTime(componentName: string, loadTime: number) {
    const times = this.loadTimes.get(componentName) || [];
    times.push(loadTime);
    this.loadTimes.set(componentName, times);

    // Manter apenas os últimos 10 registros
    if (times.length > 10) {
      times.splice(0, times.length - 10);
    }
  }

  // Analisar performance do bundle atual
  async analyzeBundlePerformance(): Promise<BundleStats> {
    const recommendations: string[] = [];
    const components: BundleStats['components'] = [];

    // Analisar recursos carregados
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceEntry[];
      
      resources.forEach(resource => {
        if (resource.name.includes('.js') || resource.name.includes('.jsx') || 
            resource.name.includes('.ts') || resource.name.includes('.tsx')) {
          
          const componentName = this.extractComponentName(resource.name);
          const loadTime = resource.duration;
          const size = resource.transferSize || 0;
          const usage = this.componentUsage.get(componentName) || 0;

          components.push({
            name: componentName,
            size,
            loadTime,
            usage
          });

          // Recomendações baseadas em métricas
          if (loadTime > 1000) {
            recommendations.push(
              `Componente "${componentName}" tem tempo de carregamento alto (${Math.round(loadTime)}ms)`
            );
          }

          if (size > 100000 && usage < 5) {
            recommendations.push(
              `Componente "${componentName}" é grande (${Math.round(size/1024)}KB) mas pouco usado`
            );
          }
        }
      });
    }

    // Analisar padrões de uso
    this.analyzeUsagePatterns(recommendations);

    const totalSize = components.reduce((sum, comp) => sum + comp.size, 0);

    const stats: BundleStats = {
      totalSize,
      components: components.sort((a, b) => b.size - a.size),
      recommendations
    };

    logger.info('Bundle analysis completed', {
      component: 'BundleAnalyzer',
      metadata: {
        totalComponents: components.length,
        totalSize: totalSize,
        recommendationsCount: recommendations.length
      }
    });

    return stats;
  }

  // Analisar padrões de uso
  private analyzeUsagePatterns(recommendations: string[]) {
    // Identificar componentes não utilizados
    const unusedComponents = Array.from(this.componentUsage.entries())
      .filter(([_, usage]) => usage === 0)
      .map(([name]) => name);

    if (unusedComponents.length > 0) {
      recommendations.push(
        `${unusedComponents.length} componentes não estão sendo utilizados: ${unusedComponents.slice(0, 3).join(', ')}`
      );
    }

    // Identificar componentes com carregamento lento
    Array.from(this.loadTimes.entries()).forEach(([name, times]) => {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      if (avgTime > 500 && times.length > 3) {
        recommendations.push(
          `Componente "${name}" tem carregamento consistentemente lento (${Math.round(avgTime)}ms)`
        );
      }
    });
  }

  // Extrair nome do componente da URL
  private extractComponentName(url: string): string {
    const match = url.match(/\/([^\/]+)\.(js|jsx|ts|tsx)$/);
    return match ? match[1] : url.split('/').pop() || 'unknown';
  }

  // Gerar relatório de otimização
  generateOptimizationReport(stats: BundleStats): string {
    let report = '# Relatório de Otimização de Bundle\n\n';
    
    report += `## Estatísticas Gerais\n`;
    report += `- **Tamanho Total**: ${Math.round(stats.totalSize / 1024)}KB\n`;
    report += `- **Componentes**: ${stats.components.length}\n\n`;

    report += `## Top 5 Maiores Componentes\n`;
    stats.components.slice(0, 5).forEach((comp, index) => {
      report += `${index + 1}. **${comp.name}**: ${Math.round(comp.size / 1024)}KB (usado ${comp.usage}x)\n`;
    });

    report += `\n## Recomendações\n`;
    stats.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });

    return report;
  }

  // Monitorar mudanças de performance em tempo real
  startPerformanceMonitoring() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceEntry;
          const componentName = this.extractComponentName(resource.name);
          this.recordLoadTime(componentName, resource.duration);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    
    return () => observer.disconnect();
  }

  // Limpar dados antigos
  clearOldData() {
    // Manter apenas dados dos últimos 30 minutos
    const cutoff = Date.now() - (30 * 60 * 1000);
    
    this.loadTimes.forEach((times, component) => {
      const recentTimes = times.filter(time => time > cutoff);
      if (recentTimes.length === 0) {
        this.loadTimes.delete(component);
      } else {
        this.loadTimes.set(component, recentTimes);
      }
    });
  }

  // Obter métricas em tempo real
  getRealTimeMetrics() {
    return {
      componentUsage: Object.fromEntries(this.componentUsage),
      averageLoadTimes: Object.fromEntries(
        Array.from(this.loadTimes.entries()).map(([name, times]) => [
          name,
          times.reduce((sum, time) => sum + time, 0) / times.length
        ])
      ),
      totalComponents: this.componentUsage.size
    };
  }
}

// Instância global
export const bundleAnalyzer = new BundleAnalyzer();

// Hook para usar o analisador
export function useBundleAnalyzer() {
  return {
    recordUsage: (componentName: string) => 
      bundleAnalyzer.recordComponentUsage(componentName),
    
    analyze: () => bundleAnalyzer.analyzeBundlePerformance(),
    
    getMetrics: () => bundleAnalyzer.getRealTimeMetrics(),
    
    generateReport: (stats: BundleStats) => 
      bundleAnalyzer.generateOptimizationReport(stats)
  };
}

// Inicializar monitoramento automático
if (typeof window !== 'undefined') {
  bundleAnalyzer.startPerformanceMonitoring();
  
  // Limpar dados antigos a cada 10 minutos
  setInterval(() => {
    bundleAnalyzer.clearOldData();
  }, 10 * 60 * 1000);
}