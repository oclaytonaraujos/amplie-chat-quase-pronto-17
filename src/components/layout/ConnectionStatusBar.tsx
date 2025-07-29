import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWhatsAppConnection } from '@/contexts/WhatsAppConnectionContext';
import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw,
  Smartphone,
  Server,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConnectionStatusBar() {
  const { 
    connections, 
    globalStatus, 
    isLoading, 
    refreshConnections,
    hasActiveConnection 
  } = useWhatsAppConnection();
  
  const { status: evolutionStatus, updateInstanceStatus } = useEvolutionApi();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleQuickRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshConnections(),
        updateInstanceStatus?.()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusConfig = () => {
    if (!hasActiveConnection) {
      return {
        icon: WifiOff,
        variant: 'destructive' as const,
        label: 'Desconectado',
        description: 'Nenhuma conexão WhatsApp ativa',
        color: 'text-red-600'
      };
    }

    switch (globalStatus) {
      case 'connected':
        return {
          icon: Wifi,
          variant: 'default' as const,
          label: 'Conectado',
          description: `${connections.filter(c => c.status === 'connected').length} de ${connections.length} ativas`,
          color: 'text-green-600'
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          variant: 'secondary' as const,
          label: 'Parcial',
          description: `${connections.filter(c => c.status === 'connected').length} de ${connections.length} ativas`,
          color: 'text-yellow-600'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          variant: 'destructive' as const,
          label: 'Erro',
          description: 'Problema nas conexões',
          color: 'text-red-600'
        };
      default:
        return {
          icon: WifiOff,
          variant: 'secondary' as const,
          label: 'Offline',
          description: 'Todas as conexões inativas',
          color: 'text-gray-600'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 px-2 gap-1 hover:bg-accent/50"
        >
          <StatusIcon className={cn("w-4 h-4", statusConfig.color)} />
          <span className="text-sm font-medium">
            {statusConfig.label}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Status das Conexões</h4>
            <Button
              onClick={handleQuickRefresh}
              disabled={isRefreshing || isLoading}
              size="sm"
              variant="outline"
              className="h-7 px-2"
            >
              <RefreshCw className={cn(
                "w-3 h-3", 
                (isRefreshing || isLoading) && "animate-spin"
              )} />
            </Button>
          </div>

          {/* Status Geral */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
            <StatusIcon className={cn("w-5 h-5", statusConfig.color)} />
            <div className="flex-1">
              <p className="font-medium text-sm">{statusConfig.label}</p>
              <p className="text-xs text-muted-foreground">
                {statusConfig.description}
              </p>
            </div>
            <Badge variant={statusConfig.variant} className="text-xs">
              {connections.length}
            </Badge>
          </div>

          {/* Evolution API Status */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Server className="w-3 h-3" />
              Evolution API
            </h5>
            <div className="flex items-center justify-between text-sm">
              <span>Status:</span>
              <Badge variant={evolutionStatus?.connected ? 'default' : 'destructive'}>
                {evolutionStatus?.connected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            {evolutionStatus?.lastCheck && (
              <p className="text-xs text-muted-foreground">
                Verificado {formatDistanceToNow(evolutionStatus.lastCheck, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            )}
          </div>

          {/* Lista de Instâncias */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              Instâncias WhatsApp
            </h5>
            
            {connections.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  Nenhuma instância configurada
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {connections.map((connection) => (
                  <div 
                    key={connection.instanceName}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        connection.status === 'connected' ? 'bg-green-500' :
                        connection.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                        connection.status === 'error' ? 'bg-red-500' :
                        'bg-gray-400'
                      )} />
                      <span className="truncate max-w-[120px]">
                        {connection.instanceName}
                      </span>
                    </div>
                    <Badge 
                      variant={
                        connection.status === 'connected' ? 'default' :
                        connection.status === 'connecting' ? 'secondary' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {connection.status === 'connected' ? 'OK' :
                       connection.status === 'connecting' ? 'Conectando' :
                       connection.status === 'qr_required' ? 'QR' :
                       'Erro'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Última Atualização */}
          {connections.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Última verificação: {formatDistanceToNow(
                  Math.max(...connections.map(c => c.lastCheck.getTime())), 
                  { addSuffix: true, locale: ptBR }
                )}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}