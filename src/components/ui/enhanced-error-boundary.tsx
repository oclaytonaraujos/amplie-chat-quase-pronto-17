/**
 * Error boundary aprimorado com contexto específico e recuperação
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/production-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context = 'Unknown', onError } = this.props;
    
    // Log estruturado do erro
    logger.error('Error boundary caught error', {
      component: `ErrorBoundary-${context}`,
      metadata: {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        errorBoundaryContext: context
      }
    }, error);

    this.setState({ errorInfo });

    // Callback personalizado se fornecido
    onError?.(error, errorInfo);

    // Reportar erro para serviço de monitoramento em produção
    if (import.meta.env.PROD) {
      this.reportError(error, errorInfo);
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrar com serviço de monitoramento (Sentry, LogRocket, etc.)
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Simular envio para serviço de monitoramento
    console.error('Error report:', errorReport);
  };

  private handleRetry = () => {
    logger.info('User attempting error recovery', {
      component: `ErrorBoundary-${this.props.context}`,
      metadata: { errorId: this.state.errorId }
    });
    
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined
    });
  };

  private handleGoHome = () => {
    logger.info('User navigating to home after error', {
      component: `ErrorBoundary-${this.props.context}`,
      metadata: { errorId: this.state.errorId }
    });
    
    window.location.href = '/';
  };

  private handleReportBug = () => {
    logger.info('User reporting bug', {
      component: `ErrorBoundary-${this.props.context}`,
      metadata: { errorId: this.state.errorId }
    });

    // Abrir modal ou redirecionar para formulário de bug report
    const subject = encodeURIComponent(`Bug Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Context: ${this.props.context}
Error: ${this.state.error?.message}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
    `);
    
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDevelopment = import.meta.env.DEV;
      const showDetails = this.props.showDetails || isDevelopment;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">
                Ops! Algo deu errado
              </CardTitle>
              <CardDescription>
                {this.props.context 
                  ? `Erro no componente: ${this.props.context}`
                  : 'Ocorreu um erro inesperado na aplicação'
                }
              </CardDescription>
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground mt-2">
                  ID do erro: {this.state.errorId}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {showDetails && this.state.error && (
                <details className="p-3 bg-muted rounded-md">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Detalhes técnicos
                  </summary>
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <strong>Erro:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-all">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-all">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para início
                </Button>
                
                <Button 
                  onClick={this.handleReportBug}
                  variant="outline"
                  size="sm"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Reportar bug
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                Se o problema persistir, entre em contato com o suporte.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC para facilitar o uso
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  context?: string,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <EnhancedErrorBoundary context={context} fallback={fallback}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook para capturar erros em componentes funcionais
export const useErrorHandler = () => {
  return React.useCallback((error: Error, context?: string) => {
    logger.error('Manual error capture', {
      component: context || 'useErrorHandler'
    }, error);
    
    // Re-throw para ser capturado pelo Error Boundary
    throw error;
  }, []);
};

// Componente wrapper para uso simples
export const ErrorBoundaryWrapper: React.FC<{
  children: ReactNode;
  context?: string;
  fallback?: ReactNode;
  showDetails?: boolean;
}> = ({ children, context, fallback, showDetails }) => {
  return (
    <EnhancedErrorBoundary 
      context={context} 
      fallback={fallback}
      showDetails={showDetails}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};