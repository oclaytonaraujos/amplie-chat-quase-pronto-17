import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  description?: string;
  status?: 'success' | 'warning' | 'error';
}

function MetricCard({ title, value, change, trend, icon, description, status }: MetricCardProps) {
  const trendConfig = {
    up: { color: 'text-emerald-600', icon: TrendingUp },
    down: { color: 'text-red-600', icon: TrendingDown },
    stable: { color: 'text-gray-600', icon: Activity }
  };

  const statusConfig = {
    success: 'bg-emerald-50 border-emerald-200',
    warning: 'bg-amber-50 border-amber-200',
    error: 'bg-red-50 border-red-200'
  };

  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <Card className={`${status ? statusConfig[status] : ''} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {change && TrendIcon && (
            <div className={`flex items-center gap-1 ${trendConfig[trend!].color}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsOverviewProps {
  data: {
    totalIntegrations: number;
    activeIntegrations: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    uptime: string;
  };
}

export default function MetricsOverview({ data }: MetricsOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Métricas Gerais</h3>
        <p className="text-muted-foreground text-sm">
          Visão geral do desempenho das integrações do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Integrações Ativas"
          value={`${data.activeIntegrations}/${data.totalIntegrations}`}
          icon={<CheckCircle className="w-5 h-5" />}
          description="Integrações funcionando"
          status={data.activeIntegrations === data.totalIntegrations ? 'success' : 'warning'}
        />

        <MetricCard
          title="Requisições Totais"
          value={data.totalRequests.toLocaleString()}
          change="+12.5%"
          trend="up"
          icon={<Activity className="w-5 h-5" />}
          description="Últimas 24 horas"
        />

        <MetricCard
          title="Taxa de Sucesso"
          value={`${data.successRate}%`}
          change="+2.1%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
          description="Requisições bem-sucedidas"
          status={data.successRate >= 95 ? 'success' : data.successRate >= 85 ? 'warning' : 'error'}
        />

        <MetricCard
          title="Tempo de Resposta"
          value={`${data.averageResponseTime}ms`}
          change="-15ms"
          trend="up"
          icon={<Clock className="w-5 h-5" />}
          description="Tempo médio de resposta"
        />

        <MetricCard
          title="Uptime do Sistema"
          value={data.uptime}
          icon={<CheckCircle className="w-5 h-5" />}
          description="Disponibilidade geral"
          status="success"
        />

        <MetricCard
          title="Status Geral"
          value="Operacional"
          icon={<CheckCircle className="w-5 h-5" />}
          description="Todos os sistemas funcionando"
          status="success"
        />
      </div>
    </div>
  );
}