import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface PollingConfig {
  id: string;
  callback: () => Promise<void> | void;
  interval: number;
  immediate?: boolean;
}

class GlobalPollingManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private configs: Map<string, PollingConfig> = new Map();

  register(config: PollingConfig) {
    this.unregister(config.id);
    
    this.configs.set(config.id, config);
    
    if (config.immediate) {
      config.callback();
    }
    
    const timer = setInterval(() => {
      config.callback();
    }, config.interval);
    
    this.timers.set(config.id, timer);
    
    logger.info(`Registered polling for ${config.id} with interval ${config.interval}ms`);
  }

  unregister(id: string) {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
      this.configs.delete(id);
      logger.info(`Unregistered polling for ${id}`);
    }
  }

  updateInterval(id: string, newInterval: number) {
    const config = this.configs.get(id);
    if (config) {
      this.register({ ...config, interval: newInterval });
    }
  }

  destroy() {
    for (const [id, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.configs.clear();
    logger.info('Destroyed all polling timers');
  }

  getActivePollers() {
    return Array.from(this.configs.keys());
  }
}

const globalPollingManager = new GlobalPollingManager();

export function useGlobalPolling(config: PollingConfig) {
  const configRef = useRef(config);
  configRef.current = config;

  const register = useCallback(() => {
    globalPollingManager.register(configRef.current);
  }, []);

  const unregister = useCallback(() => {
    globalPollingManager.unregister(configRef.current.id);
  }, []);

  useEffect(() => {
    register();
    return unregister;
  }, [register, unregister]);

  useEffect(() => {
    // Update the callback when it changes
    globalPollingManager.register(configRef.current);
  }, [config.callback, config.interval]);

  return {
    updateInterval: (newInterval: number) => {
      globalPollingManager.updateInterval(config.id, newInterval);
    },
    forceExecute: config.callback
  };
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalPollingManager.destroy();
  });
}

export { globalPollingManager };