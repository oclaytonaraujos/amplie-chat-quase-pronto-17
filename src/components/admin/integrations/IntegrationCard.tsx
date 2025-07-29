import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Power, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

interface IntegrationCardProps {
  name: string;
  description: string;
  type: 'evolution' | 'n8n' | 'whatsapp' | 'webhook' | 'chatbot';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  lastActivity?: string;
  metrics?: {
    requests?: number;
    successRate?: number;
    uptime?: string;
  };
  onConfigure: () => void;
  onToggle: () => void;
  icon?: React.ReactNode;
}

const statusConfig = {
  connected: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    label: 'Conectado'
  },
  disconnected: {
    color: 'bg-gray-50 text-gray-700 border-gray-200',
    icon: Power,
    label: 'Desconectado'
  },
  error: {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertTriangle,
    label: 'Erro'
  },
  configuring: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    label: 'Configurando'
  }
};

const typeConfig = {
  evolution: { color: 'bg-blue-100 text-blue-800', label: 'Evolution API' },
  n8n: { color: 'bg-purple-100 text-purple-800', label: 'N8N' },
  whatsapp: { color: 'bg-green-100 text-green-800', label: 'WhatsApp' },
  webhook: { color: 'bg-orange-100 text-orange-800', label: 'Webhook' },
  chatbot: { color: 'bg-indigo-100 text-indigo-800', label: 'Chatbot' }
};

export default function IntegrationCard({
  name,
  description,
  type,
  status,
  lastActivity,
  metrics,
  onConfigure,
  onToggle,
  icon
}: IntegrationCardProps) {
  const statusInfo = statusConfig[status];
  const typeInfo = typeConfig[type];
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-semibold">{name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                {description}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={typeInfo.color}>
              {typeInfo.label}
            </Badge>
            <Badge variant="outline" className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métricas */}
        {metrics && (
          <div className="grid grid-cols-3 gap-4">
            {metrics.requests && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.requests.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Requisições</div>
              </div>
            )}
            {metrics.successRate && (
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{metrics.successRate}%</div>
                <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
              </div>
            )}
            {metrics.uptime && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.uptime}</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            )}
          </div>
        )}

        {/* Última Atividade */}
        {lastActivity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>Última atividade: {lastActivity}</span>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onConfigure}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button 
            variant={status === 'connected' ? 'destructive' : 'default'} 
            className="flex-1"
            onClick={onToggle}
          >
            <Power className="w-4 h-4 mr-2" />
            {status === 'connected' ? 'Desconectar' : 'Conectar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}