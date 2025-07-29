/**
 * Indicador de status de conectividade
 */
import React from 'react';
import { useConnectivity } from '@/hooks/useConnectivity';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export function ConnectivityIndicator() {
  const { isOnline, isSystemOnline } = useConnectivity();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge 
        variant="destructive" 
        className="flex items-center gap-2 animate-pulse"
      >
        {!navigator.onLine ? (
          <>
            <WifiOff className="h-4 w-4" />
            Sem conexão com a internet
          </>
        ) : !isSystemOnline ? (
          <>
            <AlertCircle className="h-4 w-4" />
            Sistema indisponível
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            Conectividade limitada
          </>
        )}
      </Badge>
    </div>
  );
}

// Status de conectividade na barra inferior (menos intrusivo)
export function ConnectivityStatus() {
  const { isOnline, isSystemOnline, lastCheck } = useConnectivity();

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wifi className="h-3 w-3 text-green-500" />
        <span>Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-destructive">
      <WifiOff className="h-3 w-3" />
      <span>
        {!navigator.onLine 
          ? 'Offline' 
          : !isSystemOnline 
          ? 'Sistema indisponível' 
          : 'Conectividade limitada'
        }
      </span>
      <span className="text-xs text-muted-foreground">
        Última verificação: {lastCheck.toLocaleTimeString()}
      </span>
    </div>
  );
}