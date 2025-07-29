import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Signal, SignalHigh, SignalLow, SignalMedium } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWhatsAppConnection } from '@/contexts/WhatsAppConnectionContext';

interface ConnectionStatusIndicatorProps {
  evolutionApiStatus?: 'connected' | 'disconnected' | 'connecting' | 'error';
  whatsappConnectionStatus?: 'connected' | 'disconnected' | 'qr_required' | 'connecting' | 'error';
  showDetails?: boolean;
  className?: string;
}

export function ConnectionStatusIndicator({
  evolutionApiStatus,
  whatsappConnectionStatus,
  showDetails = false,
  className
}: ConnectionStatusIndicatorProps) {
  const { globalStatus, connections } = useWhatsAppConnection();
  
  // Use props ou dados do contexto
  const actualEvolutionStatus = evolutionApiStatus || 'disconnected';
  const actualWhatsAppStatus = whatsappConnectionStatus || 
    (globalStatus === 'connected' ? 'connected' : 
     globalStatus === 'partial' ? 'connecting' : 'disconnected');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'slow'>('online');

  // Monitorar status da rede
  useEffect(() => {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        setNetworkStatus('offline');
        return;
      }

      // Verificar velocidade da conexão se disponível
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setNetworkStatus('slow');
        } else {
          setNetworkStatus('online');
        }
      } else {
        setNetworkStatus('online');
      }
    };

    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  const getOverallStatus = () => {
    if (networkStatus === 'offline') return 'offline';
    if (actualEvolutionStatus === 'connected' && actualWhatsAppStatus === 'connected') {
      return 'connected';
    }
    if (actualEvolutionStatus === 'connecting' || actualWhatsAppStatus === 'connecting') {
      return 'connecting';
    }
    if (actualEvolutionStatus === 'error' || actualWhatsAppStatus === 'error') {
      return 'error';
    }
    return 'disconnected';
  };

  const getStatusConfig = () => {
    const status = getOverallStatus();
    
    switch (status) {
      case 'connected':
        return {
          icon: Signal,
          color: 'text-green-600',
          bgColor: 'bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30',
          label: 'Conectado',
          variant: 'default' as const
        };
      case 'connecting':
        return {
          icon: SignalMedium,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30',
          label: 'Conectando...',
          variant: 'secondary' as const
        };
      case 'error':
        return {
          icon: SignalLow,
          color: 'text-red-600',
          bgColor: 'bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30',
          label: 'Erro na conexão',
          variant: 'destructive' as const
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/30',
          label: 'Offline',
          variant: 'secondary' as const
        };
      default:
        return {
          icon: SignalLow,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-900/20 dark:hover:bg-gray-900/30',
          label: 'Desconectado',
          variant: 'outline' as const
        };
    }
  };

  const { icon: Icon, color, bgColor, label, variant } = getStatusConfig();

  const getNetworkIcon = () => {
    switch (networkStatus) {
      case 'online':
        return <Wifi className="w-3 h-3 text-green-500" />;
      case 'slow':
        return <SignalLow className="w-3 h-3 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="w-3 h-3 text-red-500" />;
    }
  };

  if (!showDetails) {
    return (
      <Badge
        variant={variant}
        className={cn(
          "flex items-center gap-1 transition-colors",
          bgColor,
          color,
          className
        )}
      >
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">{label}</span>
      </Badge>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2 p-3 rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Status da Conexão</span>
        <Badge
          variant={variant}
          className={cn("flex items-center gap-1", bgColor, color)}
        >
          <Icon className="w-3 h-3" />
          <span className="text-xs">{label}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {/* Status da rede */}
        <div className="flex items-center gap-2">
          {getNetworkIcon()}
          <span>Rede: {networkStatus === 'online' ? 'Online' : networkStatus === 'slow' ? 'Lenta' : 'Offline'}</span>
        </div>

        {/* Status Evolution API */}
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            actualEvolutionStatus === 'connected' ? 'bg-green-500' :
            actualEvolutionStatus === 'connecting' ? 'bg-yellow-500' :
            actualEvolutionStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
          )} />
          <span>API: {
            actualEvolutionStatus === 'connected' ? 'Conectada' :
            actualEvolutionStatus === 'connecting' ? 'Conectando' :
            actualEvolutionStatus === 'error' ? 'Erro' : 'Desconectada'
          }</span>
        </div>

        {/* Status WhatsApp */}
        <div className="flex items-center gap-2 col-span-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            actualWhatsAppStatus === 'connected' ? 'bg-green-500' :
            actualWhatsAppStatus === 'connecting' ? 'bg-yellow-500' :
            actualWhatsAppStatus === 'qr_required' ? 'bg-blue-500' :
            'bg-gray-400'
          )} />
          <span>WhatsApp: {
            actualWhatsAppStatus === 'connected' ? 'Conectado' :
            actualWhatsAppStatus === 'connecting' ? 'Conectando' :
            actualWhatsAppStatus === 'qr_required' ? 'QR Code necessário' :
            'Desconectado'
          }</span>
        </div>
      </div>
    </div>
  );
}