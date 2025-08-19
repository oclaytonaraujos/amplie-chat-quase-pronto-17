import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, TrendingUp, AlertTriangle, Settings } from 'lucide-react';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InstanceStatsCards } from './InstanceStatsCards';
import { InstanceStatusList } from './InstanceStatusList';

interface InstanceStats {
  total: number;
  connected: number;
  disconnected: number;
  webhook_active: number;
  webhook_inactive: number;
}

interface InstanceStatus {
  instanceName: string;
  status: string;
  lastChecked: Date;
  responseTime?: number;
  isHealthy: boolean;
  error?: string;
}

interface Instance {
  id: string;
  instance_name: string;
  status: string;
  empresa_nome?: string;
  webhook_status?: 'ativo' | 'inativo' | 'erro';
}

interface UnifiedInstanceDashboardProps {
  instances: Instance[];
  onStatusUpdate?: (instanceName: string, status: string) => void;
  onRefresh?: () => void;
}

export function UnifiedInstanceDashboard({
  instances,
  onStatusUpdate,
  onRefresh
}: UnifiedInstanceDashboardProps) {
  const [monitoring, setMonitoring] = useState(false);
  const [statuses, setStatuses] = useState<InstanceStatus[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const { getConnectionState, isServiceAvailable } = useEvolutionAPIComplete();

  const stats: InstanceStats = {
    total: instances.length,
    connected: instances.filter(i => i.status === 'open' || i.status === 'connected').length,
    disconnected: instances.filter(i => i.status === 'disconnected').length,
    webhook_active: instances.filter(i => i.webhook_status === 'ativo').length,
    webhook_inactive: instances.filter(i => i.webhook_status !== 'ativo').length
  };

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
        isHealthy
      };
    } catch (error) {
      return {
        instanceName,
        status: 'error',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        isHealthy: false,
        error: (error as Error).message
      };
    }
  };

  const checkAllInstances = async () => {
    if (!isServiceAvailable || instances.length === 0) return;
    
    setMonitoring(true);
    try {
      const statusPromises = instances.map(instance => checkInstanceStatus(instance.instance_name));
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
      // Error handling sem console.log
    } finally {
      setMonitoring(false);
    }
  };

  const handleRefresh = () => {
    checkAllInstances();
    onRefresh?.();
  };

  // Verificação automática a cada 30 segundos
  useEffect(() => {
    if (instances.length === 0) return;
    checkAllInstances();
    const interval = setInterval(checkAllInstances, 30000);
    return () => clearInterval(interval);
  }, [instances.length, isServiceAvailable]);

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
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Dashboard de Instâncias - Serviço Indisponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Configuração da Evolution API Necessária
            </h3>
            <p className="text-muted-foreground mb-4">
              Configure a Evolution API no painel de administração para habilitar o monitoramento.
            </p>
            <Button variant="outline" onClick={onRefresh}>
              <Settings className="w-4 h-4 mr-2" />
              Configurar Evolution API
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Dashboard de Instâncias e Monitoramento
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={monitoring}>
              {monitoring ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <InstanceStatsCards
            healthyCount={healthyCount}
            connectingCount={connectingCount}
            errorCount={errorCount}
            averageResponseTime={averageResponseTime}
          />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Monitor de Status em Tempo Real
              </h4>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Última atualização: {format(lastUpdate, 'HH:mm:ss', { locale: ptBR })}
                </span>
              )}
            </div>

            <InstanceStatusList statuses={statuses} instances={instances} />

            {monitoring && statuses.length === 0 && (
              <div className="text-center py-6">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Verificando status das instâncias...</p>
              </div>
            )}
          </div>

          {/* Alertas */}
          {(stats.disconnected > 0 || stats.webhook_inactive > 0 || errorCount > 0) && (
            <div className="space-y-3">
              {(stats.disconnected > 0 || stats.webhook_inactive > 0) && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning-foreground mb-1">Atenção necessária:</p>
                      <ul className="text-warning-foreground text-sm space-y-1">
                        {stats.disconnected > 0 && <li>• {stats.disconnected} instância(s) desconectada(s)</li>}
                        {stats.webhook_inactive > 0 && <li>• {stats.webhook_inactive} webhook(s) inativo(s)</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {errorCount > 0 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive mb-1">Instâncias com problemas detectadas</p>
                      <p className="text-destructive text-sm">
                        {errorCount} instância(s) offline ou com erro. Verifique as configurações.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}