import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWhatsAppConnection } from '@/contexts/WhatsAppConnectionContext';
import { useEvolutionApi } from '@/hooks/useEvolutionApi';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Smartphone,
  Server
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ConnectionMonitor() {
  const { 
    connections, 
    globalStatus, 
    isLoading, 
    refreshConnections,
    hasActiveConnection 
  } = useWhatsAppConnection();
  
  const { 
    status: evolutionStatus, 
    updateInstanceStatus,
    loading: evolutionLoading 
  } = useEvolutionApi();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshConnections(),
        updateInstanceStatus?.()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'qr_required':
        return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'connected': 'default',
      'connecting': 'secondary', 
      'qr_required': 'outline',
      'error': 'destructive',
      'disconnected': 'secondary'
    } as const;

    const labels = {
      'connected': 'Conectado',
      'connecting': 'Conectando',
      'qr_required': 'QR Necessário',
      'error': 'Erro',
      'disconnected': 'Desconectado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getGlobalStatusConfig = () => {
    switch (globalStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          label: 'Todas as conexões ativas'
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          label: 'Algumas conexões inativas'
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          label: 'Erro nas conexões'
        };
      default:
        return {
          icon: WifiOff,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          label: 'Todas as conexões inativas'
        };
    }
  };

  const globalConfig = getGlobalStatusConfig();
  const GlobalIcon = globalConfig.icon;

  return (
    <div className="space-y-6">
      {/* Status Global */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Monitor de Conexões WhatsApp
            </CardTitle>
            <Button 
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              size="sm"
              variant="outline"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", (refreshing || isLoading) && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg",
            globalConfig.bgColor
          )}>
            <GlobalIcon className={cn("w-6 h-6", globalConfig.color)} />
            <div className="flex-1">
              <p className={cn("font-medium", globalConfig.color)}>
                {globalConfig.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {connections.length} instância(s) • {hasActiveConnection ? 'Pronto para envio' : 'Sem conexões ativas'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Última verificação</p>
              <p className="text-xs text-muted-foreground">
                {connections.length > 0 ? 
                  formatDistanceToNow(
                    Math.max(...connections.map(c => c.lastCheck.getTime())), 
                    { addSuffix: true, locale: ptBR }
                  ) : 
                  'Nunca'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes das Conexões */}
      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Instâncias WhatsApp ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Evolution API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-3">
          {connections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Smartphone className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma instância configurada
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Configure uma instância WhatsApp para começar a enviar mensagens
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {connections.map((connection) => (
                <Card key={connection.instanceName}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(connection.status)}
                        <div>
                          <p className="font-medium">{connection.instanceName}</p>
                          {connection.numero && (
                            <p className="text-sm text-muted-foreground">
                              {connection.numero}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {formatDistanceToNow(connection.lastCheck, { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                        </div>
                        {getStatusBadge(connection.status)}
                      </div>
                    </div>

                    {connection.status === 'qr_required' && connection.qrCode && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                          QR Code disponível para conexão
                        </p>
                        <div className="flex justify-center">
                          <img 
                            src={connection.qrCode} 
                            alt="QR Code" 
                            className="w-32 h-32 border rounded"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evolution" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4" />
                Status da Evolution API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {evolutionStatus?.connected ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {evolutionStatus?.connected ? 'Conectado' : 'Desconectado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Estado: {evolutionStatus?.state || 'unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Última verificação
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {evolutionStatus?.lastCheck ? 
                        formatDistanceToNow(evolutionStatus.lastCheck, { 
                          addSuffix: true, 
                          locale: ptBR 
                        }) : 
                        'Nunca'
                      }
                    </p>
                  </div>
                </div>

                {evolutionLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando status...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}