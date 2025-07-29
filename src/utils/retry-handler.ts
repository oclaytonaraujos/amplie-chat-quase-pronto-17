/**
 * Sistema de retry automático para operações críticas
 */
import { logger } from './structured-logger';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  exponentialBackoff?: boolean;
  maxDelay?: number;
  retryOn?: (error: Error) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
  context?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  exponentialBackoff: true,
  maxDelay: 10000,
  retryOn: () => true,
  onRetry: () => {},
  context: 'unknown'
};

export class RetryableError extends Error {
  constructor(message: string, public shouldRetry: boolean = true) {
    super(message);
    this.name = 'RetryableError';
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Log sucesso após retry
      if (attempt > 0) {
        logger.info(`Operation succeeded after ${attempt} retries`, {
          component: 'RetryHandler',
          metadata: { 
            context: opts.context,
            totalAttempts: attempt + 1
          }
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Verificar se deve tentar novamente
      const shouldRetry = opts.retryOn(lastError) && 
                         attempt < opts.maxRetries &&
                         !(lastError instanceof RetryableError && !lastError.shouldRetry);
      
      if (!shouldRetry) {
        logger.error(`Operation failed after ${attempt + 1} attempts`, {
          component: 'RetryHandler',
          metadata: { 
            context: opts.context,
            totalAttempts: attempt + 1,
            finalError: lastError.message
          }
        }, lastError);
        throw lastError;
      }
      
      // Calcular delay
      const delay = opts.exponentialBackoff 
        ? Math.min(opts.baseDelay * Math.pow(2, attempt), opts.maxDelay)
        : opts.baseDelay;
      
      // Log tentativa de retry
      logger.warn(`Operation failed, retrying in ${delay}ms`, {
        component: 'RetryHandler',
        metadata: { 
          context: opts.context,
          attempt: attempt + 1,
          delay,
          error: lastError.message
        }
      });
      
      // Callback de retry
      opts.onRetry(lastError, attempt + 1);
      
      // Aguardar antes do próximo retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Retry específico para operações de rede
export async function withNetworkRetry<T>(
  operation: () => Promise<T>,
  context: string = 'network'
): Promise<T> {
  return withRetry(operation, {
    maxRetries: 3,
    baseDelay: 1000,
    exponentialBackoff: true,
    context,
    retryOn: (error) => {
      // Retry em erros de rede
      return error.name === 'NetworkError' ||
             error.message.includes('fetch') ||
             error.message.includes('network') ||
             error.message.includes('timeout') ||
             (error as any).code === 'NETWORK_ERROR';
    }
  });
}

// Retry específico para operações do Supabase
export async function withSupabaseRetry<T>(
  operation: () => Promise<T>,
  context: string = 'supabase'
): Promise<T> {
  return withRetry(operation, {
    maxRetries: 2,
    baseDelay: 500,
    exponentialBackoff: true,
    context,
    retryOn: (error) => {
      const errorMessage = error.message.toLowerCase();
      // Retry em erros temporários do Supabase
      return errorMessage.includes('connection') ||
             errorMessage.includes('timeout') ||
             errorMessage.includes('temporarily unavailable') ||
             errorMessage.includes('rate limit') ||
             (error as any).status >= 500;
    }
  });
}

// Retry específico para operações críticas de estado
export async function withStateRetry<T>(
  operation: () => Promise<T>,
  context: string = 'state'
): Promise<T> {
  return withRetry(operation, {
    maxRetries: 5,
    baseDelay: 200,
    exponentialBackoff: false,
    context,
    retryOn: (error) => {
      // Retry em conflitos de estado ou condições de corrida
      const errorMessage = error.message.toLowerCase();
      return errorMessage.includes('conflict') ||
             errorMessage.includes('race condition') ||
             errorMessage.includes('concurrent') ||
             errorMessage.includes('lock');
    }
  });
}

// Wrapper para operações críticas com circuit breaker simples
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minuto

  async execute<T>(operation: () => Promise<T>, context: string): Promise<T> {
    // Verificar se o circuit está aberto
    if (this.isCircuitOpen()) {
      const error = new RetryableError(`Circuit breaker open for ${context}`, false);
      logger.error('Circuit breaker prevented operation', {
        component: 'CircuitBreaker',
        metadata: { context, failures: this.failures }
      }, error);
      throw error;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isCircuitOpen(): boolean {
    if (this.failures >= this.threshold) {
      return (Date.now() - this.lastFailureTime) < this.timeout;
    }
    return false;
  }

  private onSuccess(): void {
    this.failures = 0;
    this.lastFailureTime = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}

const globalCircuitBreaker = new CircuitBreaker();

export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  return globalCircuitBreaker.execute(operation, context);
}