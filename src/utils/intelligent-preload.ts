/**
 * Sistema de preload inteligente baseado em padrões de uso
 */
import { logger } from './structured-logger';

interface PreloadConfig {
  priority: 'low' | 'medium' | 'high';
  trigger: 'idle' | 'hover' | 'visible' | 'immediate';
  dependencies: string[];
}

interface PreloadTask {
  id: string;
  component: string;
  config: PreloadConfig;
  loader: () => Promise<any>;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  timestamp?: number;
}

class IntelligentPreloader {
  private tasks = new Map<string, PreloadTask>();
  private loadedComponents = new Set<string>();
  private userPatterns = new Map<string, number>();
  private isIdle = true;

  constructor() {
    this.setupIdleDetection();
    this.setupIntersectionObserver();
  }

  // Registrar padrão de uso do usuário
  recordUserPattern(route: string, component: string) {
    const key = `${route}:${component}`;
    const current = this.userPatterns.get(key) || 0;
    this.userPatterns.set(key, current + 1);
  }

  // Registrar tarefa de preload
  registerPreloadTask(
    component: string,
    loader: () => Promise<any>,
    config: PreloadConfig
  ) {
    const task: PreloadTask = {
      id: `${component}_${Date.now()}`,
      component,
      config,
      loader,
      status: 'pending'
    };

    this.tasks.set(component, task);

    // Executar imediatamente se prioridade alta
    if (config.priority === 'high' || config.trigger === 'immediate') {
      this.executePreload(task);
    }
  }

  // Executar preload baseado em prioridade
  private async executePreload(task: PreloadTask) {
    if (task.status !== 'pending') return;

    task.status = 'loading';
    task.timestamp = Date.now();

    try {
      logger.info(`Preloading component: ${task.component}`, {
        component: 'IntelligentPreloader',
        metadata: { 
          priority: task.config.priority,
          trigger: task.config.trigger
        }
      });

      await task.loader();
      task.status = 'loaded';
      this.loadedComponents.add(task.component);

      logger.info(`Successfully preloaded: ${task.component}`, {
        component: 'IntelligentPreloader',
        metadata: { 
          loadTime: Date.now() - task.timestamp!
        }
      });

    } catch (error) {
      task.status = 'error';
      logger.warn(`Failed to preload: ${task.component}`, {
        component: 'IntelligentPreloader'
      }, error as Error);
    }
  }

  // Setup detecção de idle
  private setupIdleDetection() {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      this.isIdle = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.isIdle = true;
        this.processIdleTasks();
      }, 2000);
    };

    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(
      event => document.addEventListener(event, resetIdleTimer, true)
    );

    resetIdleTimer();
  }

  // Setup intersection observer para preload baseado em visibilidade
  private setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const component = entry.target.getAttribute('data-preload');
            if (component && this.tasks.has(component)) {
              const task = this.tasks.get(component)!;
              if (task.config.trigger === 'visible') {
                this.executePreload(task);
              }
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    // Observar elementos com data-preload
    document.querySelectorAll('[data-preload]').forEach(el => {
      observer.observe(el);
    });
  }

  // Processar tarefas durante idle
  private processIdleTasks() {
    if (!this.isIdle) return;

    const pendingTasks = Array.from(this.tasks.values())
      .filter(task => 
        task.status === 'pending' && 
        task.config.trigger === 'idle'
      )
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.config.priority] - priorityOrder[a.config.priority];
      });

    // Executar até 3 tarefas por vez durante idle
    pendingTasks.slice(0, 3).forEach(task => {
      this.executePreload(task);
    });
  }

  // Preload baseado em hover
  setupHoverPreload(element: HTMLElement, component: string) {
    let hoverTimer: NodeJS.Timeout;

    element.addEventListener('mouseenter', () => {
      hoverTimer = setTimeout(() => {
        const task = this.tasks.get(component);
        if (task && task.config.trigger === 'hover') {
          this.executePreload(task);
        }
      }, 100); // 100ms delay para evitar preloads desnecessários
    });

    element.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimer);
    });
  }

  // Verificar se componente já foi carregado
  isLoaded(component: string): boolean {
    return this.loadedComponents.has(component);
  }

  // Obter estatísticas de preload
  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      loaded: tasks.filter(t => t.status === 'loaded').length,
      loading: tasks.filter(t => t.status === 'loading').length,
      errors: tasks.filter(t => t.status === 'error').length,
      userPatterns: Object.fromEntries(this.userPatterns)
    };
  }
}

// Instância global
export const intelligentPreloader = new IntelligentPreloader();

// Hook para usar o preloader
export function useIntelligentPreload() {
  return {
    preload: (
      component: string,
      loader: () => Promise<any>,
      config: PreloadConfig
    ) => intelligentPreloader.registerPreloadTask(component, loader, config),
    
    isLoaded: (component: string) => intelligentPreloader.isLoaded(component),
    
    recordUsage: (route: string, component: string) => 
      intelligentPreloader.recordUserPattern(route, component),
      
    setupHover: (element: HTMLElement, component: string) =>
      intelligentPreloader.setupHoverPreload(element, component),
      
    getStats: () => intelligentPreloader.getStats()
  };
}

// Presets de configuração comum
export const preloadConfigs = {
  criticalRoute: {
    priority: 'high' as const,
    trigger: 'immediate' as const,
    dependencies: []
  },
  
  frequentComponent: {
    priority: 'medium' as const,
    trigger: 'idle' as const,
    dependencies: []
  },
  
  onDemandComponent: {
    priority: 'low' as const,
    trigger: 'hover' as const,
    dependencies: []
  },
  
  visibleComponent: {
    priority: 'medium' as const,
    trigger: 'visible' as const,
    dependencies: []
  }
};