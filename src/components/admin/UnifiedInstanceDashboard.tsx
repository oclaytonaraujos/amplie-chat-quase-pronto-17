import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, AlertTriangle, CheckCircle2, RefreshCw, Zap, MessageSquare, CheckCircle, XCircle, Wifi, TrendingUp, Globe, Settings } from 'lucide-react';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const {
    getConnectionState,
    isServiceAvailable
  } = useEvolutionAPIComplete();

  // Calcular estatísticas
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
      console.error('Erro ao verificar status das instâncias:', error);
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
  const connectionRate = stats.total > 0 ? Math.round(stats.connected / stats.total * 100) : 0;
  const webhookRate = stats.total > 0 ? Math.round(stats.webhook_active / stats.total * 100) : 0;
  const healthyCount = statuses.filter(s => s.isHealthy).length;
  const connectingCount = statuses.filter(s => s.status === 'connecting').length;
  const errorCount = statuses.filter(s => !s.isHealthy && s.status !== 'connecting').length;
  const averageResponseTime = statuses.length > 0 ? statuses.reduce((sum, s) => sum + (s.responseTime || 0), 0) / statuses.length : 0;
  if (!isServiceAvailable) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Dashboard de Instâncias - Serviço Indisponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Configuração da Evolution API Necessária
            </h3>
            <p className="text-muted-foreground mb-4">
              Configure a Evolution API no painel de administração para habilitar o monitoramento e gerenciamento das instâncias.
            </p>
            <Button variant="outline" onClick={onRefresh} className="border-red-200 text-red-600 hover:bg-red-50">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Evolution API
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Dashboard Unificado */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Dashboard de Instâncias e Monitoramento
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleRefresh} disabled={monitoring}>
              {monitoring ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estatísticas Gerais */}
          

          {/* Monitor de Status em Tempo Real */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Monitor de Status em Tempo Real
              </h4>
              {lastUpdate && <span className="text-xs text-muted-foreground">
                  Última atualização: {format(lastUpdate, 'HH:mm:ss', {
                locale: ptBR
              })}
                </span>}
            </div>
            
            {/* Resumo de Performance */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xl font-bold text-green-600">{healthyCount}</div>
                <div className="text-xs text-muted-foreground">Online</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xl font-bold text-yellow-600">{connectingCount}</div>
                <div className="text-xs text-muted-foreground">Conectando</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xl font-bold text-red-600">{errorCount}</div>
                <div className="text-xs text-muted-foreground">Offline</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xl font-bold text-blue-600">
                  {averageResponseTime > 0 ? `${Math.round(averageResponseTime)}ms` : '-'}
                </div>
                <div className="text-xs text-muted-foreground">Tempo Médio</div>
              </div>
            </div>

            {/* Lista de Status Individual */}
            {statuses.length > 0 && <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                {statuses.map(status => {
              const instance = instances.find(i => i.instance_name === status.instanceName);
              return <div key={status.instanceName} className="flex items-center justify-between p-2 border rounded-lg bg-card">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <div className="font-medium text-sm">{status.instanceName}</div>
                          {instance?.empresa_nome && <div className="text-xs text-muted-foreground">{instance.empresa_nome}</div>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {status.responseTime && <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3" />
                            {status.responseTime}ms
                          </div>}
                        {getStatusBadge(status)}
                      </div>
                    </div>;
            })}
              </div>}

            {/* Estado de carregamento */}
            {monitoring && statuses.length === 0 && <div className="text-center py-6">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Verificando status das instâncias...</p>
              </div>}
          </div>

          {/* Alertas */}
          {(stats.disconnected > 0 || stats.webhook_inactive > 0 || errorCount > 0) && <div className="space-y-3">
              {(stats.disconnected > 0 || stats.webhook_inactive > 0) && <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-800 mb-1">Atenção necessária:</p>
                      <ul className="text-yellow-700 text-sm space-y-1">
                        {stats.disconnected > 0 && <li>• {stats.disconnected} instância(s) desconectada(s)</li>}
                        {stats.webhook_inactive > 0 && <li>• {stats.webhook_inactive} webhook(s) inativo(s)</li>}
                      </ul>
                    </div>
                  </div>
                </div>}
              
              {errorCount > 0 && <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 mb-1">Instâncias com problemas detectadas</p>
                      <p className="text-red-700 text-sm">
                        {errorCount} instância(s) offline ou com erro. Verifique as configurações.
                      </p>
                    </div>
                  </div>
                </div>}
            </div>}
        </CardContent>
      </Card>
    </div>;
}