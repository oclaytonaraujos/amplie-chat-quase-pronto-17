import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InstanceStatus {
  instanceName: string;
  status: string;
  lastChecked: Date;
  responseTime?: number;
  isHealthy: boolean;
  error?: string;
}

interface InstanceStatusMonitorProps {
  instances: Array<{
    id: string;
    instance_name: string;
    status: string;
    empresa_nome?: string;
  }>;
  onStatusUpdate?: (instanceName: string, status: string) => void;
}

export function InstanceStatusMonitor({ 
  instances, 
  onStatusUpdate 
}: InstanceStatusMonitorProps) {
  const [monitoring, setMonitoring] = useState(false);
  const [statuses, setStatuses] = useState<InstanceStatus[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { getConnectionState, isServiceAvailable } = useEvolutionAPIComplete();

  const checkInstanceStatus = async (instanceName: string): Promise<InstanceStatus> => {
    const startTime = Date.now();
    
    try {
      const connectionState = await getConnectionState(instanceName);
      const responseTime = Date.now() - startTime;
      
      const status = connectionState?.instance?.state || 'unknown';
      const isHealthy = status === 'open' || status === 'connected';
      
      return {
        instanceName,
        status,
        lastChecked: new Date(),
        responseTime,
        isHealthy,
      };
    } catch (error) {
      return {
        instanceName,
        status: 'error',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        isHealthy: false,
        error: (error as Error).message,
      };
    }
  };

  const checkAllInstances = async () => {
    if (!isServiceAvailable || instances.length === 0) return;

    setMonitoring(true);
    try {
      const statusPromises = instances.map(instance => 
        checkInstanceStatus(instance.instance_name)
      );
      
      const results = await Promise.all(statusPromises);
      setStatuses(results);
      setLastUpdate(new Date());
      
      // Notificar sobre mudanças de status
      results.forEach(result => {
        const existingStatus = statuses.find(s => s.instanceName === result.instanceName);
        if (existingStatus && existingStatus.status !== result.status) {
          onStatusUpdate?.(result.instanceName, result.status);
        }
      });
    } catch (error) {
      console.error('Erro ao verificar status das instâncias:', error);
    } finally {
      setMonitoring(false);
    }
  };

  // Verificação automática a cada 3 segundos
  useEffect(() => {
    if (instances.length === 0) return;

    checkAllInstances();
    const interval = setInterval(checkAllInstances, 3000);
    
    return () => clearInterval(interval);
  }, [instances.length, isServiceAvailable]);

  const getStatusColor = (status: InstanceStatus) => {
    if (status.isHealthy) return 'text-green-600';
    if (status.status === 'connecting') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: InstanceStatus) => {
    if (status.isHealthy) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status.status === 'connecting') return <Clock className="w-4 h-4 text-yellow-500" />;
    return <AlertTriangle className="w-4 h-4 text-red-500" />;
  };

  const getStatusBadge = (status: InstanceStatus) => {
    if (status.isHealthy) {
      return <Badge className="bg-green-100 text-green-800">Online</Badge>;
    }
    if (status.status === 'connecting') {
      return <Badge className="bg-yellow-100 text-yellow-800">Conectando</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
  };

  const healthyCount = statuses.filter(s => s.isHealthy).length;
  const connectingCount = statuses.filter(s => s.status === 'connecting').length;
  const errorCount = statuses.filter(s => !s.isHealthy && s.status !== 'connecting').length;

  const averageResponseTime = statuses.length > 0 
    ? statuses.reduce((sum, s) => sum + (s.responseTime || 0), 0) / statuses.length 
    : 0;

  if (!isServiceAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Monitor de Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Serviço Evolution API indisponível</p>
            <p className="text-sm">Configure a Evolution API para habilitar o monitoramento</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Monitor de Status em Tempo Real
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={checkAllInstances}
            disabled={monitoring}
          >
            {monitoring ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo Geral */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
            <div className="text-sm text-muted-foreground">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{connectingCount}</div>
            <div className="text-sm text-muted-foreground">Conectando</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-muted-foreground">Offline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {averageResponseTime > 0 ? `${Math.round(averageResponseTime)}ms` : '-'}
            </div>
            <div className="text-sm text-muted-foreground">Tempo Médio</div>
          </div>
        </div>

        {/* Lista de Status */}
        {statuses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Status Individual</h4>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Última atualização: {format(lastUpdate, 'HH:mm:ss', { locale: ptBR })}
                </span>
              )}
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {statuses.map((status) => {
                const instance = instances.find(i => i.instance_name === status.instanceName);
                return (
                  <div key={status.instanceName} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <div>
                        <div className="font-medium text-sm">{status.instanceName}</div>
                        {instance?.empresa_nome && (
                          <div className="text-xs text-muted-foreground">{instance.empresa_nome}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {status.responseTime && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="w-3 h-3" />
                          {status.responseTime}ms
                        </div>
                      )}
                      {getStatusBadge(status)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado de carregamento */}
        {monitoring && statuses.length === 0 && (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Verificando status das instâncias...</p>
          </div>
        )}

        {/* Alertas */}
        {errorCount > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Instâncias com problemas detectadas</p>
                <p className="text-red-700">
                  {errorCount} instância(s) offline ou com erro. Verifique as configurações.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}