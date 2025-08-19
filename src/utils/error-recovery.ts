/**
 * Sistema de recuperação automática de erros
 */
import React from 'react';
import { toast } from '@/hooks/use-toast';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true
};

export class ErrorRecovery {
  static async withRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const { maxAttempts, baseDelay, maxDelay, exponentialBackoff } = {
      ...defaultRetryConfig,
      ...config
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          throw lastError;
        }

        // Calcular delay
        let delay = exponentialBackoff 
          ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
          : baseDelay;
          
        // Add jitter para evitar thundering herd
        delay = delay + Math.random() * 1000;

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  static async recoverableOperation<T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    try {
      return await this.withRetry(operation, config);
    } catch (error) {
      if (fallback) {
        return await fallback();
      }
      throw error;
    }
  }

  static createCircuitBreaker<T>(
    operation: () => Promise<T>,
    options: {
      failureThreshold: number;
      resetTimeout: number;
      monitoringPeriod: number;
    } = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 60000
    }
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    return async (): Promise<T> => {
      const now = Date.now();

      // Reset failures after monitoring period
      if (now - lastFailureTime > options.monitoringPeriod) {
        failures = 0;
      }

      // Check if circuit should be half-open
      if (state === 'OPEN' && now - lastFailureTime > options.resetTimeout) {
        state = 'HALF_OPEN';
      }

      // Fail fast if circuit is open
      if (state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN');
      }

      try {
        const result = await operation();
        
        // Reset on success
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;

        // Open circuit if threshold exceeded
        if (failures >= options.failureThreshold) {
          state = 'OPEN';
          toast({
            title: 'Serviço temporariamente indisponível',
            description: 'Tentaremos reconectar automaticamente',
            variant: 'destructive'
          });
        }

        throw error;
      }
    };
  }

  // Error Boundary Component
  static ErrorBoundary = class extends React.Component<
    { children: React.ReactNode; fallback?: React.ComponentType },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      toast({
        title: 'Erro no componente',
        description: 'Ocorreu um erro inesperado. Tente recarregar a página.',
        variant: 'destructive'
      });
    }

    render() {
      if (this.state.hasError) {
        const FallbackComponent = this.props.fallback || ErrorRecovery.FallbackComponent;
        return React.createElement(FallbackComponent);
      }

      return this.props.children;
    }
  };

  // Fallback component
  static FallbackComponent = () => (
    React.createElement('div', { className: "flex flex-col items-center justify-center p-8 text-center" },
      React.createElement('div', { className: "text-destructive mb-4" },
        React.createElement('svg', { className: "w-12 h-12 mx-auto", fill: "currentColor", viewBox: "0 0 20 20" },
          React.createElement('path', { 
            fillRule: "evenodd", 
            d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z", 
            clipRule: "evenodd" 
          })
        )
      ),
      React.createElement('h3', { className: "text-lg font-semibold mb-2" }, 'Algo deu errado'),
      React.createElement('p', { className: "text-muted-foreground mb-4" }, 
        'Ocorreu um erro inesperado. Tente recarregar a página.'
      ),
      React.createElement('button', {
        onClick: () => window.location.reload(),
        className: "px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      }, 'Recarregar Página')
    )
  );
}

// Wrapper para componentes React
export function withErrorRecovery<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function ErrorRecoveredComponent(props: P) {
    return React.createElement(ErrorRecovery.ErrorBoundary, 
      { fallback: ErrorRecovery.FallbackComponent },
      React.createElement(Component, props)
    );
  };
}