/**
 * Utilitários de segurança para validação e sanitização
 */

/**
 * Sanitiza uma string para prevenir XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Valida se uma URL é segura
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Permitir apenas HTTP e HTTPS
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Valida se um email tem formato válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se uma senha atende critérios mínimos de segurança
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Remove caracteres perigosos de CSS
 */
export function sanitizeCSS(css: string): string {
  return css
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/expression\s*\(/gi, '') // Remove CSS expressions
    .replace(/import\s+/gi, '') // Remove @import
    .replace(/@[^;]+;/g, ''); // Remove outras @ rules perigosas
}

/**
 * Valida se um valor é uma cor CSS válida
 */
export function isValidCSSColor(color: string): boolean {
  if (!color) return false;
  
  // Regex para cores válidas: hex, rgb, rgba, hsl, hsla, nomes de cores
  const colorRegex = /^(#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i;
  return colorRegex.test(color);
}

/**
 * Detecta tentativas de injeção de código
 */
export function detectCodeInjection(input: string): boolean {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /alert\s*\(/gi,
    /confirm\s*\(/gi,
    /prompt\s*\(/gi
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Rate limiting simples baseado em localStorage
 */
export class RateLimiter {
  private key: string;
  private maxAttempts: number;
  private windowMs: number;

  constructor(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.key = `rate_limit_${key}`;
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  canAttempt(): boolean {
    const now = Date.now();
    const data = this.getData();
    
    // Limpar tentativas antigas
    const validAttempts = data.attempts.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    this.setData({ attempts: validAttempts });
    
    return validAttempts.length < this.maxAttempts;
  }

  recordAttempt(): void {
    const data = this.getData();
    data.attempts.push(Date.now());
    this.setData(data);
  }

  getRemainingTime(): number {
    const data = this.getData();
    if (data.attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...data.attempts);
    const resetTime = oldestAttempt + this.windowMs;
    return Math.max(0, resetTime - Date.now());
  }

  private getData(): { attempts: number[] } {
    try {
      const stored = localStorage.getItem(this.key);
      return stored ? JSON.parse(stored) : { attempts: [] };
    } catch {
      return { attempts: [] };
    }
  }

  private setData(data: { attempts: number[] }): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // Falha silenciosa se localStorage não estiver disponível
    }
  }
}

/**
 * Valida se o ambiente é de desenvolvimento
 */
export function isDevelopmentEnvironment(): boolean {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('.lovable.app') ||
    window.location.hostname.includes('127.0.0.1') ||
    process.env.NODE_ENV === 'development'
  );
}

/**
 * Logs de segurança estruturados
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any> = {},
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    details,
    level,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console[level](`[SECURITY] ${event}:`, logData);
  
  // Em produção, enviar para serviço de monitoramento
  if (!isDevelopmentEnvironment()) {
    // TODO: Integrar com serviço de monitoramento de segurança
  }
}