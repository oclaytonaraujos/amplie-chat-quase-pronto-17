/**
 * Structured Logger Utility
 * Provides consistent logging across the application with proper formatting
 * and conditional environment-based logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class StructuredLogger {
  private isDevelopment = import.meta.env.DEV;
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'warn';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context?.component) {
      return `${prefix} [${context.component}] ${message}`;
    }
    
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.logLevel];
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    const logData = {
      message: formattedMessage,
      level,
      timestamp: new Date().toISOString(),
      ...context,
      ...(error && { error: error.message, stack: error.stack })
    };

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, logData);
        break;
      case 'info':
        console.info(formattedMessage, logData);
        break;
      case 'warn':
        console.warn(formattedMessage, logData);
        break;
      case 'error':
        console.error(formattedMessage, logData);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  // Helper methods for common scenarios
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
}

// Export singleton instance
export const logger = new StructuredLogger();

// Export default for backward compatibility
export default logger;