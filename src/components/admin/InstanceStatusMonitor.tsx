import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SyncLoaderInline } from '@/components/ui/sync-loader';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
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

  const checkInstanceStatus = async (instanceName: string): Promise<InstanceStatus> => {
    const startTime = Date.now();
    
    try {
      // Since Evolution API is removed, status checks are now via n8n
      return {
        instanceName,
        status: 'via_n8n',
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        isHealthy: false, // Will need n8n integration
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
    if (instances.length === 0) return;

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

  useEffect(() => {
    if (instances.length === 0) return;

    checkAllInstances();
    const interval = setInterval(checkAllInstances, 10000); // Check every 10 seconds now
    
    return () => clearInterval(interval);
  }, [instances.length]);

  const getStatusBadge = (status: InstanceStatus) => {
    return <Badge className="bg-blue-100 text-blue-800">Via n8n</Badge>;
  };

  if (instances.length === 0) {
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
            <p>Nenhuma instância encontrada</p>
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
            Monitor via n8n
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={checkAllInstances}
            disabled={monitoring}
          >
            {monitoring ? (
              <SyncLoaderInline />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Atualizar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Monitoramento agora via n8n</p>
          <p className="text-sm">Configure fluxos n8n para status em tempo real</p>
        </div>

        {/* Lista básica de instâncias */}
        {instances.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Instâncias Registradas</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {instances.map((instance) => (
                <div key={instance.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="font-medium text-sm">{instance.instance_name}</div>
                      {instance.empresa_nome && (
                        <div className="text-xs text-muted-foreground">{instance.empresa_nome}</div>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">n8n</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}