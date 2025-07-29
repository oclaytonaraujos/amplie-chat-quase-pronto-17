/**
 * Sistema de monitoramento de segurança em tempo real
 */
import { logger } from './structured-logger';
import { toast } from '@/hooks/use-toast';

export interface SecurityEvent {
  type: 'login_attempt' | 'permission_violation' | 'data_access' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  details: Record<string, any>;
  timestamp: number;
}

export interface SecurityMetrics {
  totalEvents: number;
  criticalEvents: number;
  recentAttempts: number;
  blockedIPs: string[];
  suspiciousPatterns: number;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private blockedIPs: Set<string> = new Set();
  private rateLimitMap: Map<string, number[]> = new Map();
  private readonly maxEvents = 1000;
  private readonly rateWindow = 60000; // 1 minuto
  private readonly maxRequestsPerWindow = 100;

  // Registrar evento de segurança
  recordEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);
    
    // Manter apenas os últimos eventos
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log do evento
    logger.warn(`Security event: ${event.type}`, {
      component: 'SecurityMonitor',
      metadata: {
        severity: event.severity,
        userId: event.userId,
        ip: event.ip,
        resource: event.resource,
        details: event.details
      }
    });

    // Ações automáticas baseadas na severidade
    this.handleSecurityEvent(fullEvent);
  }

  // Rate limiting
  checkRateLimit(identifier: string, ip?: string): boolean {
    const now = Date.now();
    const key = ip || identifier;
    
    // Verificar se IP está bloqueado
    if (ip && this.blockedIPs.has(ip)) {
      this.recordEvent({
        type: 'suspicious_activity',
        severity: 'high',
        ip,
        details: { reason: 'blocked_ip_attempt' }
      });
      return false;
    }

    // Obter tentativas recentes
    const attempts = this.rateLimitMap.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < this.rateWindow);

    // Verificar limite
    if (recentAttempts.length >= this.maxRequestsPerWindow) {
      this.recordEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        ip,
        details: { 
          reason: 'rate_limit_exceeded',
          attempts: recentAttempts.length 
        }
      });

      // Bloquear IP se muito suspeito
      if (ip && recentAttempts.length > this.maxRequestsPerWindow * 2) {
        this.blockIP(ip, 'rate_limit_violation');
      }

      return false;
    }

    // Registrar tentativa
    recentAttempts.push(now);
    this.rateLimitMap.set(key, recentAttempts);

    return true;
  }

  // Bloquear IP
  blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    
    this.recordEvent({
      type: 'suspicious_activity',
      severity: 'critical',
      ip,
      details: { reason: `ip_blocked: ${reason}` }
    });

    // Auto-remover após 1 hora
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      logger.info(`IP ${ip} removed from blocklist`, {
        component: 'SecurityMonitor'
      });
    }, 3600000);
  }

  // Verificar padrões suspeitos
  detectSuspiciousPatterns(): void {
    const recentEvents = this.events.filter(
      event => Date.now() - event.timestamp < 300000 // 5 minutos
    );

    // Múltiplas tentativas de login falhadas
    const failedLogins = recentEvents.filter(
      event => event.type === 'login_attempt' && 
               event.details.success === false
    );

    if (failedLogins.length > 5) {
      const ips = failedLogins.map(event => event.ip).filter(Boolean);
      const uniqueIPs = [...new Set(ips)];

      if (uniqueIPs.length === 1 && uniqueIPs[0]) {
        this.blockIP(uniqueIPs[0], 'multiple_failed_logins');
      }
    }

    // Acesso a recursos sensíveis
    const sensitiveAccess = recentEvents.filter(
      event => event.type === 'data_access' && 
               event.severity === 'high'
    );

    if (sensitiveAccess.length > 3) {
      this.recordEvent({
        type: 'suspicious_activity',
        severity: 'critical',
        details: { 
          reason: 'multiple_sensitive_access',
          count: sensitiveAccess.length 
        }
      });
    }
  }

  // Obter métricas de segurança
  getMetrics(): SecurityMetrics {
    const now = Date.now();
    const recent = this.events.filter(event => now - event.timestamp < 3600000); // 1 hora

    return {
      totalEvents: this.events.length,
      criticalEvents: this.events.filter(e => e.severity === 'critical').length,
      recentAttempts: recent.length,
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousPatterns: recent.filter(e => e.type === 'suspicious_activity').length
    };
  }

  // Obter eventos recentes
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Manipular evento de segurança
  private handleSecurityEvent(event: SecurityEvent): void {
    // Alertas críticos
    if (event.severity === 'critical') {
      toast({
        title: "Alerta de Segurança Crítico",
        description: `Atividade suspeita detectada: ${event.type}`,
        variant: "destructive",
      });
    }

    // Ações específicas por tipo
    switch (event.type) {
      case 'login_attempt':
        if (!event.details.success && event.ip) {
          this.trackFailedLogin(event.ip);
        }
        break;

      case 'permission_violation':
        if (event.userId) {
          this.trackPermissionViolation(event.userId);
        }
        break;

      case 'suspicious_activity':
        this.handleSuspiciousActivity(event);
        break;
    }

    // Detectar padrões a cada evento
    if (Math.random() < 0.1) { // 10% das vezes
      this.detectSuspiciousPatterns();
    }
  }

  private trackFailedLogin(ip: string): void {
    const key = `failed_login_${ip}`;
    const attempts = this.rateLimitMap.get(key) || [];
    const now = Date.now();
    
    attempts.push(now);
    
    // Remover tentativas antigas
    const recentAttempts = attempts.filter(time => now - time < 900000); // 15 min
    this.rateLimitMap.set(key, recentAttempts);

    // Bloquear após 5 tentativas
    if (recentAttempts.length >= 5) {
      this.blockIP(ip, 'multiple_failed_logins');
    }
  }

  private trackPermissionViolation(userId: string): void {
    this.recordEvent({
      type: 'suspicious_activity',
      severity: 'high',
      userId,
      details: { reason: 'permission_violation_pattern' }
    });
  }

  private handleSuspiciousActivity(event: SecurityEvent): void {
    // Log específico para atividades suspeitas
    logger.error('Suspicious activity detected', {
      component: 'SecurityMonitor',
      metadata: {
        eventType: event.type,
        severity: event.severity,
        details: event.details
      }
    });

    // Notificar administradores se crítico
    if (event.severity === 'critical') {
      this.notifyAdministrators(event);
    }
  }

  private notifyAdministrators(event: SecurityEvent): void {
    // Em produção, enviaria notificações reais
    logger.warn('Administrator notification triggered', {
      component: 'SecurityMonitor',
      metadata: { event }
    });
  }
}

// Instância global
export const securityMonitor = new SecurityMonitor();

// Hook para usar o monitor de segurança
export function useSecurityMonitor() {
  return {
    recordEvent: (event: Omit<SecurityEvent, 'timestamp'>) => 
      securityMonitor.recordEvent(event),
    
    checkRateLimit: (identifier: string, ip?: string) => 
      securityMonitor.checkRateLimit(identifier, ip),
    
    getMetrics: () => securityMonitor.getMetrics(),
    
    getRecentEvents: (limit?: number) => 
      securityMonitor.getRecentEvents(limit),
    
    blockIP: (ip: string, reason: string) => 
      securityMonitor.blockIP(ip, reason)
  };
}

// Middleware de segurança para requests
export function withSecurityMiddleware<T extends (...args: any[]) => any>(
  operation: T,
  context: {
    userId?: string;
    resource?: string;
    requiredPermission?: string;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();

    try {
      // Verificar rate limiting se tiver userId
      if (context.userId) {
        const allowed = securityMonitor.checkRateLimit(context.userId);
        if (!allowed) {
          throw new Error('Rate limit exceeded');
        }
      }

      // Executar operação
      const result = await operation(...args);

      // Registrar acesso bem-sucedido a recursos sensíveis
      if (context.resource) {
        securityMonitor.recordEvent({
          type: 'data_access',
          severity: context.requiredPermission === 'admin' ? 'high' : 'low',
          userId: context.userId,
          resource: context.resource,
          details: { 
            operation: operation.name,
            duration: Date.now() - startTime 
          }
        });
      }

      return result;
    } catch (error) {
      // Registrar tentativa não autorizada
      securityMonitor.recordEvent({
        type: 'permission_violation',
        severity: 'medium',
        userId: context.userId,
        resource: context.resource,
        details: { 
          operation: operation.name,
          error: (error as Error).message 
        }
      });

      throw error;
    }
  }) as T;
}