/**
 * Sistema de segurança avançado
 */

// Configurações de segurança
export const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutos
  sessionTimeout: 60 * 60 * 1000, // 1 hora
  passwordMinLength: 8,
  requireStrongPassword: true,
  enableCSRFProtection: true,
  enableXSSProtection: true,
  rateLimitRequests: 100, // por minuto
  enableAuditLog: true
};

// Tipos de ameaças de segurança
export type SecurityThreat = 
  | 'brute_force'
  | 'suspicious_activity'
  | 'csrf_attempt'
  | 'xss_attempt'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'data_breach_attempt';

// Interface para logs de segurança
interface SecurityLog {
  id: string;
  threat: SecurityThreat;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  blocked: boolean;
}

class SecurityManager {
  private loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  private rateLimits = new Map<string, { count: number; resetTime: Date }>();
  private securityLogs: SecurityLog[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousPatterns = [
    /script|javascript|vbscript/i,
    /on\w+\s*=/i,
    /<.*?>/,
    /union.*select/i,
    /drop.*table/i
  ];

  // Validar força da senha
  validatePasswordStrength(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Senha deve ter pelo menos 8 caracteres');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Adicione letras minúsculas');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Adicione letras maiúsculas');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Adicione números');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Adicione caracteres especiais');

    if (password.length >= 12) score += 1;

    return {
      isValid: score >= 4,
      score: Math.min(score, 5),
      feedback: feedback
    };
  }

  // Detectar tentativas de brute force
  checkBruteForceAttempt(identifier: string): boolean {
    const attempt = this.loginAttempts.get(identifier);
    const now = new Date();

    if (!attempt) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Reset contador se passou do tempo de lockout
    if (now.getTime() - attempt.lastAttempt.getTime() > SECURITY_CONFIG.lockoutDuration) {
      this.loginAttempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    attempt.count++;
    attempt.lastAttempt = now;

    if (attempt.count >= SECURITY_CONFIG.maxLoginAttempts) {
      this.logSecurityEvent({
        threat: 'brute_force',
        severity: 'high',
        ip: identifier,
        details: { attempts: attempt.count }
      });
      return true;
    }

    return false;
  }

  // Rate limiting
  checkRateLimit(identifier: string): boolean {
    const now = new Date();
    const limit = this.rateLimits.get(identifier);

    if (!limit || now > limit.resetTime) {
      this.rateLimits.set(identifier, {
        count: 1,
        resetTime: new Date(now.getTime() + 60000) // 1 minuto
      });
      return false;
    }

    limit.count++;

    if (limit.count > SECURITY_CONFIG.rateLimitRequests) {
      this.logSecurityEvent({
        threat: 'rate_limit_exceeded',
        severity: 'medium',
        ip: identifier,
        details: { requests: limit.count }
      });
      return true;
    }

    return false;
  }

  // Sanitizar input
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  // Detectar XSS
  detectXSS(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }

  // Validar CSRF token
  validateCSRFToken(token: string, sessionToken: string): boolean {
    // Implementação simplificada - em produção usar crypto seguro
    const expectedToken = this.generateCSRFToken(sessionToken);
    return token === expectedToken;
  }

  // Gerar token CSRF
  generateCSRFToken(sessionToken: string): string {
    // Em produção, usar crypto.randomBytes e HMAC
    return btoa(sessionToken + Date.now().toString()).slice(0, 32);
  }

  // Log de eventos de segurança
  logSecurityEvent(event: Partial<SecurityLog>): void {
    const securityLog: SecurityLog = {
      id: crypto.randomUUID(),
      threat: event.threat!,
      severity: event.severity || 'medium',
      userId: event.userId,
      ip: event.ip || 'unknown',
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      details: event.details || {},
      blocked: event.severity === 'high' || event.severity === 'critical'
    };

    this.securityLogs.push(securityLog);

    // Manter apenas os últimos 1000 logs
    if (this.securityLogs.length > 1000) {
      this.securityLogs = this.securityLogs.slice(-1000);
    }

    // Bloquear IP se ameaça crítica
    if (securityLog.severity === 'critical') {
      this.blockedIPs.add(securityLog.ip);
    }

    // Em produção, enviar para serviço de logging
    if (import.meta.env.PROD) {
      this.sendToSecurityService(securityLog);
    } else {
      console.warn('Security Event:', securityLog);
    }
  }

  // Enviar para serviço de segurança
  private async sendToSecurityService(log: SecurityLog): Promise<void> {
    try {
      // TODO: Implementar envio para serviço de monitoramento
      console.log('Security log sent:', log);
    } catch (error) {
      console.error('Failed to send security log:', error);
    }
  }

  // Verificar se IP está bloqueado
  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Obter relatório de segurança
  getSecurityReport(): {
    totalThreats: number;
    threatsByType: Record<SecurityThreat, number>;
    blockedIPs: number;
    recentActivity: SecurityLog[];
  } {
    const threatsByType = this.securityLogs.reduce((acc, log) => {
      acc[log.threat] = (acc[log.threat] || 0) + 1;
      return acc;
    }, {} as Record<SecurityThreat, number>);

    return {
      totalThreats: this.securityLogs.length,
      threatsByType,
      blockedIPs: this.blockedIPs.size,
      recentActivity: this.securityLogs.slice(-10)
    };
  }

  // Limpar dados antigos
  cleanup(): void {
    const now = new Date();
    
    // Limpar tentativas de login antigas
    for (const [key, attempt] of this.loginAttempts.entries()) {
      if (now.getTime() - attempt.lastAttempt.getTime() > SECURITY_CONFIG.lockoutDuration) {
        this.loginAttempts.delete(key);
      }
    }

    // Limpar rate limits antigos
    for (const [key, limit] of this.rateLimits.entries()) {
      if (now > limit.resetTime) {
        this.rateLimits.delete(key);
      }
    }

    // Limpar logs muito antigos (mais de 24h)
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.securityLogs = this.securityLogs.filter(log => log.timestamp > cutoff);
  }

  // Monitoramento de atividade suspeita
  monitorSuspiciousActivity(activity: {
    userId?: string;
    action: string;
    resource: string;
    details?: Record<string, any>;
  }): void {
    // Padrões suspeitos
    const suspiciousPatterns = [
      'rapid_requests',
      'privilege_escalation',
      'data_export',
      'unusual_access_pattern'
    ];

    // Detectar padrões suspeitos
    const isSuspicious = suspiciousPatterns.some(pattern => 
      activity.action.includes(pattern) || 
      activity.resource.includes('admin') && !activity.userId?.includes('admin')
    );

    if (isSuspicious) {
      this.logSecurityEvent({
        threat: 'suspicious_activity',
        severity: 'medium',
        userId: activity.userId,
        ip: 'client',
        details: activity
      });
    }
  }
}

// Singleton instance
export const securityManager = new SecurityManager();

// Inicializar limpeza automática
setInterval(() => {
  securityManager.cleanup();
}, 5 * 60 * 1000); // A cada 5 minutos

export default securityManager;