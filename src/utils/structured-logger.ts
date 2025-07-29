/**
 * Sistema de logs estruturado para o módulo de atendimento
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogContext {
  userId?: string;
  empresaId?: string;
  conversaId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
  stackTrace?: string;
}

class StructuredLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isProduction = import.meta.env.PROD;

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      stackTrace: error?.stack
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Manter apenas os últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console em desenvolvimento
    if (!this.isProduction) {
      this.logToConsole(entry);
    }

    // Enviar logs críticos para monitoramento
    if (entry.level === 'critical' || entry.level === 'error') {
      this.sendToMonitoring(entry);
    }
  }

  private logToConsole(entry: LogEntry) {
    const { timestamp, level, message, context, error } = entry;
    const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context, null, 2) : '';
    
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'debug':
        console.debug(logMessage, contextStr, error);
        break;
      case 'info':
        console.info(logMessage, contextStr);
        break;
      case 'warn':
        console.warn(logMessage, contextStr, error);
        break;
      case 'error':
      case 'critical':
        console.error(logMessage, contextStr, error);
        break;
    }
  }

  private async sendToMonitoring(entry: LogEntry) {
    try {
      // Implementar envio para sistema de monitoramento externo
      // Por exemplo: Sentry, LogRocket, Datadog, etc.
      if (this.isProduction) {
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry)
        // });
      }
    } catch (error) {
      console.error('Failed to send log to monitoring:', error);
    }
  }

  debug(message: string, context?: LogContext) {
    const entry = this.createLogEntry('debug', message, context);
    this.addLog(entry);
  }

  info(message: string, context?: LogContext) {
    const entry = this.createLogEntry('info', message, context);
    this.addLog(entry);
  }

  warn(message: string, context?: LogContext, error?: Error) {
    const entry = this.createLogEntry('warn', message, context, error);
    this.addLog(entry);
  }

  error(message: string, context?: LogContext, error?: Error) {
    const entry = this.createLogEntry('error', message, context, error);
    this.addLog(entry);
  }

  critical(message: string, context?: LogContext, error?: Error) {
    const entry = this.createLogEntry('critical', message, context, error);
    this.addLog(entry);
  }

  // Métodos específicos para o módulo de atendimento
  conversaAction(action: string, conversaId: string, context?: LogContext) {
    this.info(`Conversa ${action}`, {
      ...context,
      conversaId,
      component: 'Atendimento',
      action
    });
  }

  messageAction(action: string, messageId: string, conversaId: string, context?: LogContext) {
    this.info(`Mensagem ${action}`, {
      ...context,
      conversaId,
      component: 'Mensagem',
      action,
      metadata: { messageId, ...context?.metadata }
    });
  }

  performanceMetric(metric: string, duration: number, context?: LogContext) {
    this.debug(`Performance: ${metric}`, {
      ...context,
      component: 'Performance',
      action: 'measurement',
      metadata: { metric, duration, ...context?.metadata }
    });
  }

  userAction(action: string, userId: string, context?: LogContext) {
    this.info(`User ${action}`, {
      ...context,
      userId,
      component: 'User',
      action
    });
  }

  whatsappEvent(event: string, instanceName: string, context?: LogContext) {
    this.info(`WhatsApp ${event}`, {
      ...context,
      component: 'WhatsApp',
      action: event,
      metadata: { instanceName, ...context?.metadata }
    });
  }

  // Métodos de consulta
  getLogs(filters?: {
    level?: LogLevel;
    component?: string;
    userId?: string;
    empresaId?: string;
    startTime?: Date;
    endTime?: Date;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      
      if (filters.component) {
        filteredLogs = filteredLogs.filter(log => log.context.component === filters.component);
      }
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.context.userId === filters.userId);
      }
      
      if (filters.empresaId) {
        filteredLogs = filteredLogs.filter(log => log.context.empresaId === filters.empresaId);
      }
      
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= filters.startTime!
        );
      }
      
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= filters.endTime!
        );
      }
    }

    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getLogsSummary(timeRange: '1h' | '24h' | '7d' = '24h') {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeRange];

    const startTime = new Date(now.getTime() - timeRangeMs);
    const recentLogs = this.getLogs({ startTime });

    const summary = {
      total: recentLogs.length,
      byLevel: {} as Record<LogLevel, number>,
      byComponent: {} as Record<string, number>,
      errors: recentLogs.filter(log => log.level === 'error' || log.level === 'critical'),
      timeRange
    };

    recentLogs.forEach(log => {
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1;
      
      if (log.context.component) {
        summary.byComponent[log.context.component] = 
          (summary.byComponent[log.context.component] || 0) + 1;
      }
    });

    return summary;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(format: 'json' | 'csv' = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }
    
    // CSV export
    const headers = ['timestamp', 'level', 'message', 'component', 'action', 'userId', 'conversaId'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.message,
      log.context.component || '',
      log.context.action || '',
      log.context.userId || '',
      log.context.conversaId || ''
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Instância singleton
export const logger = new StructuredLogger();

// Hook para usar o logger com contexto automático
export function useLogger(baseContext?: LogContext) {
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext, error?: Error) => 
      logger.warn(message, { ...baseContext, ...context }, error),
    error: (message: string, context?: LogContext, error?: Error) => 
      logger.error(message, { ...baseContext, ...context }, error),
    critical: (message: string, context?: LogContext, error?: Error) => 
      logger.critical(message, { ...baseContext, ...context }, error),
    conversaAction: (action: string, conversaId: string, context?: LogContext) =>
      logger.conversaAction(action, conversaId, { ...baseContext, ...context }),
    messageAction: (action: string, messageId: string, conversaId: string, context?: LogContext) =>
      logger.messageAction(action, messageId, conversaId, { ...baseContext, ...context }),
    userAction: (action: string, userId: string, context?: LogContext) =>
      logger.userAction(action, userId, { ...baseContext, ...context }),
    whatsappEvent: (event: string, instanceName: string, context?: LogContext) =>
      logger.whatsappEvent(event, instanceName, { ...baseContext, ...context })
  };
}