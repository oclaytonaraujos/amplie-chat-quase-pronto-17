/**
 * Environment Configuration Utility
 * Provides environment information without relying on VITE_ variables
 */

import { logger } from './logger';

interface EnvConfig {
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Creates environment configuration
 */
const createEnvConfig = (): EnvConfig => {
  const config: EnvConfig = {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  };

  // Log configuration
  logger.info('Environment configuration loaded', {
    component: 'EnvConfig',
    metadata: {
      environment: config.isDevelopment ? 'development' : 'production'
    }
  });

  return config;
};

// Export singleton instance
export const envConfig = createEnvConfig();

// Export individual getters for convenience
export const isDevelopment = () => envConfig.isDevelopment;
export const isProduction = () => envConfig.isProduction;