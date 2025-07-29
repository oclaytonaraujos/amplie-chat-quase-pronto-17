import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { 
  Activity, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react';
import { N8nStats } from '@/types/n8n-webhooks';
import { useN8nStats } from '@/hooks/useN8nConfigurations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface N8nDashboardProps {
  empresa_id?: string;
}

export function N8nDashboard({ empresa_id }: N8nDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const { stats, loading: statsLoading, refetch: refetchStats } = useN8nStats();
  const [executionData, setExecutionData] = useState([
    { time: '00:00', executions: 0, success: 0, errors: 0 },
    { time: '04:00', executions: 0, success: 0, errors: 0 },
    { time: '08:00', executions: 0, success: 0, errors: 0 },
    { time: '12:00', executions: 0, success: 0, errors: 0 },
    { time: '16:00', executions: 0, success: 0, errors: 0 },
    { time: '20:00', executions: 0, success: 0, errors: 0 },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = async () => {
    setIsRefreshing(true);
    await refetchStats();
    setIsRefreshing(false);
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const eventDistributionData = Object.entries(stats?.webhook_events || {}).map(([event, data]) => ({
    name: event.replace('.', ' ').toUpperCase(),
    value: data?.total_triggers || 0,
    success_rate: data?.success_rate || 0,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dashboard n8n</h3>
          <p className="text-sm text-muted-foreground">
            Métricas e estatísticas da integração com n8n
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">7 dias</SelectItem>
              <SelectItem value="month">30 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Workflows Ativos"
          value={stats?.active_workflows || 0}
          subtitle={`${stats?.total_workflows || 0} total`}
          icon={<Zap className="h-5 w-5" />}
          iconColor="bg-blue-100 text-blue-600"
          trend={{
            value: 12.5,
            isPositive: true,
          }}
        />
        
        <MetricCard
          title="Execuções Hoje"
          value={stats?.total_executions_today || 0}
          subtitle="automações processadas"
          icon={<Activity className="h-5 w-5" />}
          iconColor="bg-green-100 text-green-600"
          trend={{
            value: 8.3,
            isPositive: true,
          }}
        />
        
        <MetricCard
          title="Taxa de Sucesso"
          value={`${(stats?.success_rate_today || 0).toFixed(1)}%`}
          subtitle="nas últimas 24h"
          icon={<CheckCircle className="h-5 w-5" />}
          iconColor={`${(stats?.success_rate_today || 0) >= 95 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}
        />
        
        <MetricCard
          title="Tempo Médio"
          value={`${Math.round(stats?.avg_execution_time_ms || 0)}ms`}
          subtitle="por execução"
          icon={<Clock className="h-5 w-5" />}
          iconColor="bg-purple-100 text-purple-600"
          trend={{
            value: 5.2,
            isPositive: false,
          }}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Execuções por Período"
          icon={<BarChart3 className="h-5 w-5" />}
          iconColor="bg-blue-100 text-blue-600"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={executionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="executions" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Total"
              />
              <Line 
                type="monotone" 
                dataKey="success" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Sucessos"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Distribuição de Eventos"
          icon={<PieChart className="h-5 w-5" />}
          iconColor="bg-green-100 text-green-600"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={eventDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Status dos eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status dos Webhooks de Eventos
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real dos eventos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats?.webhook_events || {}).map(([eventKey, eventData]) => (
              <div
                key={eventKey}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    {eventKey.replace('.', ' ').toUpperCase()}
                  </h4>
                  <Badge 
                    variant={eventData && eventData.success_rate >= 95 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {eventData?.success_rate.toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total de triggers:</span>
                    <span className="font-mono">{eventData?.total_triggers || 0}</span>
                  </div>
                  {eventData?.last_triggered && (
                    <div className="flex justify-between">
                      <span>Último trigger:</span>
                      <span className="font-mono">
                        {new Date(eventData.last_triggered).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}