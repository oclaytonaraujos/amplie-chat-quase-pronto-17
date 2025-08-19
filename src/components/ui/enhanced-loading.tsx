/**
 * Enhanced Loading Components with Intelligent States
 */
import React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import { SyncLoader } from './sync-loader';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'dots' | 'pulse';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-primary rounded-full animate-pulse',
              size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'bg-primary/20 rounded-full animate-pulse',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <SyncLoader 
      size={size}
      className={className}
    />
  );
};

interface LoadingStateProps {
  type: 'conversations' | 'messages' | 'contacts' | 'generic';
  message?: string;
  showProgress?: boolean;
  progress?: number;
  retry?: () => void;
  isOffline?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type,
  message,
  showProgress = false,
  progress = 0,
  retry,
  isOffline = false
}) => {
  const getTypeMessage = () => {
    switch (type) {
      case 'conversations':
        return 'Carregando conversas...';
      case 'messages':
        return 'Carregando mensagens...';
      case 'contacts':
        return 'Carregando contatos...';
      default:
        return 'Carregando...';
    }
  };

  if (isOffline) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Sem conexão
        </h3>
        <p className="text-muted-foreground mb-4">
          Verifique sua conexão com a internet
        </p>
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <SyncLoader size="lg" className="mb-4" />
      <p className="text-muted-foreground text-center">
        {message || getTypeMessage()}
      </p>
      
      {showProgress && (
        <div className="w-full max-w-xs mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progresso</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface SmartLoadingProps {
  isLoading: boolean;
  hasError?: boolean;
  isEmpty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  type?: LoadingStateProps['type'];
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({
  isLoading,
  hasError,
  isEmpty,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  type = 'generic'
}) => {
  if (hasError && errorComponent) {
    return <>{errorComponent}</>;
  }

  if (isLoading) {
    return <>{loadingComponent || <LoadingState type={type} />}</>;
  }

  if (isEmpty && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return <>{children}</>;
};

// Connection Status Indicator
export const ConnectionStatus: React.FC<{ isOnline: boolean }> = ({
  isOnline
}) => {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all',
      isOnline 
        ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
        : 'bg-red-500/10 text-red-600 dark:text-red-400'
    )}>
      {isOnline ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};