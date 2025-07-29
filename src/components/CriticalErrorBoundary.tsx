/**
 * Error Boundary crítico para componentes específicos com retry automático
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/structured-logger';

interface Props {
  children: ReactNode;
  componentName: string;
  maxRetries?: number;
  autoRetry?: boolean;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
  isRetrying: boolean;
}

export class CriticalErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0,
      isRetrying: false 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName, onError, maxRetries = 3, autoRetry = true } = this.props;
    
    // Log estruturado do erro crítico
    logger.error(`Critical error in ${componentName}`, {
      component: `CriticalErrorBoundary-${componentName}`,
      metadata: {
        retryCount: this.state.retryCount,
        maxRetries,
        componentStack: errorInfo.componentStack,
        autoRetry
      }
    }, error);

    // Callback personalizado
    onError?.(error, errorInfo);

    // Auto retry se habilitado e dentro do limite
    if (autoRetry && this.state.retryCount < maxRetries) {
      this.scheduleRetry();
    }
  }

  private scheduleRetry = () => {
    this.setState({ isRetrying: true });
    
    // Delay progressivo: 1s, 2s, 4s...
    const delay = Math.pow(2, this.state.retryCount) * 1000;
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  };

  private handleRetry = () => {
    const { componentName, maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      logger.warn(`Max retries reached for ${componentName}`, {
        component: `CriticalErrorBoundary-${componentName}`,
        metadata: { retryCount: this.state.retryCount, maxRetries }
      });
      return;
    }

    logger.info(`Retrying ${componentName}`, {
      component: `CriticalErrorBoundary-${componentName}`,
      metadata: { retryAttempt: this.state.retryCount + 1 }
    });

    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1,
      isRetrying: false
    }));
  };

  private handleManualRetry = () => {
    this.handleRetry();
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { componentName, maxRetries = 3, fallback } = this.props;
      const canRetry = this.state.retryCount < maxRetries;

      // Fallback customizado
      if (fallback) {
        return fallback;
      }

      // UI padrão para erros críticos
      return (
        <div className="p-4">
          <Card className="border-destructive/20">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <CardTitle className="text-sm text-destructive">
                Erro em {componentName}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  {this.state.isRetrying ? 
                    'Tentando recuperar...' : 
                    'Componente temporariamente indisponível'
                  }
                </p>
                
                {this.state.retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Tentativas: {this.state.retryCount}/{maxRetries}
                  </p>
                )}
                
                {canRetry && !this.state.isRetrying && (
                  <Button
                    onClick={this.handleManualRetry}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Tentar novamente
                  </Button>
                )}
                
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-2 text-left">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Erro (dev)
                    </summary>
                    <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook para facilitar o uso
export const useCriticalErrorBoundary = () => {
  return React.useCallback((error: Error, componentName: string) => {
    logger.error(`Manual error trigger in ${componentName}`, {
      component: componentName
    }, error);
    
    // Re-throw para ser capturado pelo CriticalErrorBoundary
    throw error;
  }, []);
};