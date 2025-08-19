import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle, Zap } from 'lucide-react';

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

interface InstanceStatusListProps {
  statuses: InstanceStatus[];
  instances: Instance[];
}

export function InstanceStatusList({ statuses, instances }: InstanceStatusListProps) {
  const getStatusIcon = (status: InstanceStatus) => {
    if (status.isHealthy) return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (status.status === 'connecting') return <Clock className="w-4 h-4 text-warning" />;
    return <AlertTriangle className="w-4 h-4 text-destructive" />;
  };

  const getStatusBadge = (status: InstanceStatus) => {
    if (status.isHealthy) {
      return <Badge variant="default">Online</Badge>;
    }
    if (status.status === 'connecting') {
      return <Badge variant="secondary">Conectando</Badge>;
    }
    return <Badge variant="destructive">Offline</Badge>;
  };

  if (statuses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>Nenhuma instância monitorada</p>
      </div>
    );
  }

  return (
    <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
      {statuses.map(status => {
        const instance = instances.find(i => i.instance_name === status.instanceName);
        return (
          <div key={status.instanceName} className="flex items-center justify-between p-2 border rounded-lg bg-card">
            <div className="flex items-center gap-3">
              {getStatusIcon(status)}
              <div>
                <div className="font-medium text-sm">{status.instanceName}</div>
                {instance?.empresa_nome && (
                  <div className="text-xs text-muted-foreground">{instance.empresa_nome}</div>
                )}
                {status.error && (
                  <div className="text-xs text-destructive">{status.error}</div>
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
  );
}