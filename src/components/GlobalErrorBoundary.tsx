/**
 * Error Boundary global para capturar erros críticos da aplicação
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/utils/structured-logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `global_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log estruturado do erro crítico
    logger.error('Global error boundary caught critical error', {
      component: 'GlobalErrorBoundary',
      metadata: {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    }, error);

    this.setState({ errorInfo });

    // Reportar erro crítico para monitoramento
    if (import.meta.env.PROD) {
      this.reportCriticalError(error, errorInfo);
    }
  }

  private reportCriticalError = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      level: 'critical',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log para console em produção para debugging
    console.error('CRITICAL ERROR:', errorReport);
  };

  private handleRetry = () => {
    logger.info('User attempting global error recovery', {
      component: 'GlobalErrorBoundary',
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
    logger.info('User navigating to home after critical error', {
      component: 'GlobalErrorBoundary',
      metadata: { errorId: this.state.errorId }
    });
    
    window.location.href = '/';
  };

  private handleReload = () => {
    logger.info('User reloading page after critical error', {
      component: 'GlobalErrorBoundary',
      metadata: { errorId: this.state.errorId }
    });
    
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-destructive">
                Erro Crítico do Sistema
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Um erro inesperado interrompeu o funcionamento da aplicação.
              </p>
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground mt-1">
                  ID do erro: {this.state.errorId}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {isDevelopment && this.state.error && (
                <details className="p-3 bg-muted rounded-md">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Detalhes técnicos (desenvolvimento)
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
                  onClick={this.handleReload}
                  variant="outline"
                  size="sm"
                >
                  Recarregar
                </Button>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                Se o problema persistir, entre em contato com o suporte técnico.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}