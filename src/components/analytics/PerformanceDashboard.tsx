/**
 * Dashboard de Performance e Analytics
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface PerformanceData {
  summary: {
    total_requests: number;
    avg_duration: number;
    success_rate: number;
    error_count: number;
    slowest_endpoints: Array<{endpoint: string, duration: number}>;
  };
}

export const PerformanceDashboard: React.FC = () => {
  const { getPerformanceReport } = usePerformanceMonitor();
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'1h' | '24h' | '7d'>('24h');

  const loadData = async () => {
    setLoading(true);
    try {
      const report = await getPerformanceReport(period);
      setData(report);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (avgDuration: number, successRate: number) => {
    if (successRate >= 98 && avgDuration < 500) return { status: 'excellent', color: 'text-green-500' };
    if (successRate >= 95 && avgDuration < 1000) return { status: 'good', color: 'text-blue-500' };
    if (successRate >= 90 && avgDuration < 2000) return { status: 'fair', color: 'text-yellow-500' };
    return { status: 'poor', color: 'text-red-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando dados de performance...</span>
      </div>
    );
  }

  const performanceStatus = data?.summary ? 
    getPerformanceStatus(data.summary.avg_duration, data.summary.success_rate) : 
    { status: 'unknown', color: 'text-gray-500' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Performance</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(value) => setPeriod(value as any)}>
            <TabsList>
              <TabsTrigger value="1h">1h</TabsTrigger>
              <TabsTrigger value="24h">24h</TabsTrigger>
              <TabsTrigger value="7d">7d</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {data?.summary && (
        <>
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Requisições
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.total_requests.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Últimas {period}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(data.summary.avg_duration)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Duração média das requisições
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Sucesso
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.success_rate.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className={`h-2 w-2 rounded-full ${
                    data.summary.success_rate >= 95 ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  {data.summary.success_rate >= 95 ? 'Excelente' : 'Atenção'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Erros
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.error_count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Erros nas últimas {period}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${performanceStatus.color}`}>
                  <div className={`h-3 w-3 rounded-full ${
                    performanceStatus.status === 'excellent' ? 'bg-green-500' :
                    performanceStatus.status === 'good' ? 'bg-blue-500' :
                    performanceStatus.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize">
                    {performanceStatus.status === 'excellent' ? 'Excelente' :
                     performanceStatus.status === 'good' ? 'Bom' :
                     performanceStatus.status === 'fair' ? 'Regular' : 'Crítico'}
                  </span>
                </div>
                <Badge variant="outline">
                  Sistema Operacional
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {data.summary.success_rate >= 98 ? 
                  'Todos os sistemas funcionando perfeitamente.' :
                  data.summary.success_rate >= 95 ?
                  'Sistema funcionando bem com pequenos problemas.' :
                  'Sistema com problemas que requerem atenção.'
                }
              </p>
            </CardContent>
          </Card>

          {/* Endpoints Mais Lentos */}
          {data.summary.slowest_endpoints?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Endpoints Mais Lentos
                </CardTitle>
                <CardDescription>
                  Endpoints que precisam de otimização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.summary.slowest_endpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {endpoint.endpoint}
                        </code>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatDuration(endpoint.duration)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {endpoint.duration > 1000 ? 'Muito lento' : 'Lento'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground">
              Os dados de performance aparecerão aqui conforme o sistema for utilizado.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};