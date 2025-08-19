/**
 * Sistema de retry automático para webhooks
 */
import { toast } from '@/hooks/use-toast';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface WebhookPayload {
  url: string;
  data: any;
  headers?: Record<string, string>;
  method?: string;
}

const defaultConfig: RetryConfig = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2
};

export class WebhookRetrySystem {
  private static failedWebhooks = new Map<string, number>();

  static async sendWithRetry(
    payload: WebhookPayload,
    config: Partial<RetryConfig> = {}
  ): Promise<{ success: boolean; response?: any; error?: string }> {
    const { maxAttempts, baseDelay, maxDelay, backoffMultiplier } = {
      ...defaultConfig,
      ...config
    };

    const webhookId = this.generateWebhookId(payload);
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(payload.url, {
          method: payload.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...payload.headers
          },
          body: JSON.stringify(payload.data)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();
        
        // Sucesso - limpar contador de falhas
        this.failedWebhooks.delete(webhookId);
        
        return {
          success: true,
          response: responseData
        };

      } catch (error) {
        lastError = error as Error;
        
        // Se não é o último attempt, aguardar e tentar novamente
        if (attempt < maxAttempts) {
          const delay = Math.min(
            baseDelay * Math.pow(backoffMultiplier, attempt - 1),
            maxDelay
          );
          
          // Adicionar jitter para evitar thundering herd
          const jitter = Math.random() * 1000;
          await this.sleep(delay + jitter);
        }
      }
    }

    // Falhou em todas as tentativas
    this.failedWebhooks.set(webhookId, (this.failedWebhooks.get(webhookId) || 0) + 1);
    
    return {
      success: false,
      error: lastError!.message
    };
  }

  static async sendBatch(
    payloads: WebhookPayload[],
    config?: Partial<RetryConfig>
  ): Promise<Array<{ success: boolean; response?: any; error?: string }>> {
    const promises = payloads.map(payload => 
      this.sendWithRetry(payload, config)
    );
    
    return Promise.all(promises);
  }

  static getFailureCount(payload: WebhookPayload): number {
    const webhookId = this.generateWebhookId(payload);
    return this.failedWebhooks.get(webhookId) || 0;
  }

  static resetFailureCount(payload: WebhookPayload): void {
    const webhookId = this.generateWebhookId(payload);
    this.failedWebhooks.delete(webhookId);
  }

  static getFailedWebhooks(): Array<{ id: string; failures: number }> {
    return Array.from(this.failedWebhooks.entries()).map(([id, failures]) => ({
      id,
      failures
    }));
  }

  private static generateWebhookId(payload: WebhookPayload): string {
    return `${payload.url}-${JSON.stringify(payload.data).substring(0, 50)}`;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Circuit Breaker para webhooks que falham muito
  static createCircuitBreaker(
    payload: WebhookPayload,
    options: {
      failureThreshold: number;
      resetTimeout: number;
    } = { failureThreshold: 10, resetTimeout: 300000 }
  ) {
    return async (): Promise<{ success: boolean; response?: any; error?: string }> => {
      const failureCount = this.getFailureCount(payload);
      
      if (failureCount >= options.failureThreshold) {
        toast({
          title: 'Webhook temporariamente bloqueado',
          description: 'Muitas falhas consecutivas detectadas',
          variant: 'destructive'
        });
        
        return {
          success: false,
          error: 'Circuit breaker ativo - muitas falhas'
        };
      }

      return this.sendWithRetry(payload);
    };
  }
}

// Hook para usar com React
export function useWebhookRetry() {
  const sendWebhook = async (
    payload: WebhookPayload,
    config?: Partial<RetryConfig>
  ) => {
    const result = await WebhookRetrySystem.sendWithRetry(payload, config);
    
    if (!result.success) {
      toast({
        title: 'Erro no webhook',
        description: result.error,
        variant: 'destructive'
      });
    }
    
    return result;
  };

  return {
    sendWebhook,
    sendBatch: WebhookRetrySystem.sendBatch,
    getFailureCount: WebhookRetrySystem.getFailureCount,
    resetFailureCount: WebhookRetrySystem.resetFailureCount
  };
}