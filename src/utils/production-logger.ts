/**
 * Sistema de logging condicional otimizado para produção
 * Remove console.logs automaticamente em production builds
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ProductionLogger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context?.component) {
      return `${prefix} [${context.component}] ${message}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, context);
    console.debug(formattedMessage, context);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, context);
    console.info(formattedMessage, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message, context);
    console.warn(formattedMessage, { ...context, error: error?.message });
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog('error')) return;
    
    const formattedMessage = this.formatMessage('error', message, context);
    console.error(formattedMessage, { 
      ...context, 
      error: error?.message, 
      stack: error?.stack 
    });
  }

  // Métodos específicos para diferentes contextos
  authEvent(event: string, context?: Omit<LogContext, 'component'>): void {
    this.info(event, { ...context, component: 'Auth' });
  }

  apiCall(endpoint: string, method: string, context?: Omit<LogContext, 'component'>): void {
    this.debug(`API ${method} ${endpoint}`, { ...context, component: 'API' });
  }

  apiError(endpoint: string, error: Error, context?: Omit<LogContext, 'component'>): void {
    this.error(`API Error ${endpoint}`, { ...context, component: 'API' }, error);
  }

  userAction(action: string, context?: Omit<LogContext, 'component' | 'action'>): void {
    this.info('User action performed', { ...context, component: 'UserAction', action });
  }

  // Método para capturar erros não tratados
  captureError(error: Error, context?: LogContext): void {
    this.error('Unhandled error captured', context, error);
    
    // Em produção, enviar para serviço de monitoramento
    if (!this.isDevelopment) {
      // TODO: Integrar com serviço de monitoramento (Sentry, etc.)
    }
  }
}

// Singleton instance
export const logger = new ProductionLogger();

// Função para capturar erros globais
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      logger.captureError(event.error, { 
        component: 'GlobalErrorHandler',
        metadata: { 
          filename: event.filename, 
          line: event.lineno, 
          column: event.colno 
        }
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.captureError(new Error(event.reason), { 
        component: 'UnhandledPromiseRejection' 
      });
    });
  }
};

export default logger;