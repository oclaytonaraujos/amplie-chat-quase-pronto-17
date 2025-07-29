import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useWhatsAppConnection } from '@/contexts/WhatsAppConnectionContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Zap,
  AlertTriangle,
  CheckCircle2,
  Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionMetric {
  label: string;
  value: number;
  change?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: 'green' | 'yellow' | 'red' | 'blue';
}

interface PerformanceMetric {
  timestamp: Date;
  connectedCount: number;
  responseTime: number;
  uptime: number;
}

export function ConnectionMetrics() {
  const { connections, globalStatus, hasActiveConnection } = useWhatsAppConnection();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [averageResponseTime, setAverageResponseTime] = useState(0);

  // Simular coleta de métricas de performance
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const connectedCount = connections.filter(c => c.status === 'connected').length;
      
      // Simular tempo de resposta baseado no status
      const baseResponseTime = globalStatus === 'connected' ? 150 : 
                              globalStatus === 'partial' ? 300 : 800;
      const responseTime = baseResponseTime + Math.random() * 100;
      
      // Calcular uptime baseado nas conexões
      const uptime = connections.length > 0 ? 
        (connectedCount / connections.length) * 100 : 0;

      const newMetric: PerformanceMetric = {
        timestamp: now,
        connectedCount,
        responseTime,
        uptime
      };

      setMetrics(prev => {
        const updated = [...prev, newMetric].slice(-50); // Manter últimas 50 métricas
        return updated;
      });

      // Calcular média do tempo de resposta
      setAverageResponseTime(prev => {
        const alpha = 0.1; // Fator de suavização
        return prev === 0 ? responseTime : prev * (1 - alpha) + responseTime * alpha;
      });
    }, 5000); // Coletar a cada 5 segundos

    return () => clearInterval(interval);
  }, [connections, globalStatus]);

  const getConnectionMetrics = (): ConnectionMetric[] => {
    const connectedCount = connections.filter(c => c.status === 'connected').length;
    const connectingCount = connections.filter(c => c.status === 'connecting').length;
    const errorCount = connections.filter(c => c.status === 'error').length;
    
    const uptime = connections.length > 0 ? (connectedCount / connections.length) * 100 : 0;
    
    // Calcular tendências baseadas nas últimas métricas
    const recentMetrics = metrics.slice(-10);
    const avgRecentUptime = recentMetrics.length > 0 ? 
      recentMetrics.reduce((sum, m) => sum + m.uptime, 0) / recentMetrics.length : 0;
    
    const uptimeTrend = uptime > avgRecentUptime + 5 ? 'up' : 
                      uptime < avgRecentUptime - 5 ? 'down' : 'stable';

    return [
      {
        label: 'Conexões Ativas',
        value: connectedCount,
        change: connectingCount,
        unit: `de ${connections.length}`,
        trend: connectedCount > 0 ? 'up' : 'down',
        color: connectedCount > 0 ? 'green' : 'red'
      },
      {
        label: 'Uptime',
        value: uptime,
        unit: '%',
        trend: uptimeTrend,
        color: uptime > 80 ? 'green' : uptime > 50 ? 'yellow' : 'red'
      },
      {
        label: 'Tempo de Resposta',
        value: Math.round(averageResponseTime),
        unit: 'ms',
        trend: averageResponseTime < 200 ? 'up' : averageResponseTime < 500 ? 'stable' : 'down',
        color: averageResponseTime < 200 ? 'green' : averageResponseTime < 500 ? 'yellow' : 'red'
      },
      {
        label: 'Erros',
        value: errorCount,
        unit: 'conexões',
        trend: errorCount === 0 ? 'up' : 'down',
        color: errorCount === 0 ? 'green' : 'red'
      }
    ];
  };

  const getMetricIcon = (metric: ConnectionMetric) => {
    if (metric.trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (metric.trend === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getMetricColor = (color?: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600 dark:text-green-400';
      case 'yellow':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'red':
        return 'text-red-600 dark:text-red-400';
      case 'blue':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getHealthScore = () => {
    const connectedCount = connections.filter(c => c.status === 'connected').length;
    const totalConnections = connections.length;
    
    if (totalConnections === 0) return { score: 0, label: 'Sem dados', color: 'gray' };
    
    const connectionScore = (connectedCount / totalConnections) * 40;
    const responseScore = averageResponseTime < 200 ? 30 : 
                         averageResponseTime < 500 ? 20 : 10;
    const errorScore = connections.filter(c => c.status === 'error').length === 0 ? 30 : 15;
    
    const totalScore = connectionScore + responseScore + errorScore;
    
    if (totalScore >= 80) return { score: totalScore, label: 'Excelente', color: 'green' };
    if (totalScore >= 60) return { score: totalScore, label: 'Bom', color: 'yellow' };
    if (totalScore >= 40) return { score: totalScore, label: 'Regular', color: 'orange' };
    return { score: totalScore, label: 'Crítico', color: 'red' };
  };

  const connectionMetrics = getConnectionMetrics();
  const healthScore = getHealthScore();

  return (
    <div className="space-y-6">
      {/* Score de Saúde */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Score de Saúde das Conexões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">
                  {Math.round(healthScore.score)}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
                <Badge 
                  variant={healthScore.color === 'green' ? 'default' : 'secondary'}
                  className={cn(
                    healthScore.color === 'green' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    healthScore.color === 'yellow' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                    healthScore.color === 'red' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  )}
                >
                  {healthScore.label}
                </Badge>
              </div>
              <Progress 
                value={healthScore.score} 
                className="h-2"
              />
            </div>
            <div className="text-right">
              {hasActiveConnection ? (
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {connectionMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {metric.label}
                </span>
                {getMetricIcon(metric)}
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold", getMetricColor(metric.color))}>
                  {typeof metric.value === 'number' && metric.unit === '%' ? 
                    metric.value.toFixed(1) : 
                    metric.value
                  }
                </span>
                {metric.unit && (
                  <span className="text-sm text-muted-foreground">
                    {metric.unit}
                  </span>
                )}
              </div>
              
              {metric.change !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {metric.change > 0 && `+${metric.change} conectando`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status das Instâncias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Status das Instâncias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connections.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma instância configurada
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {connections.map((connection) => (
                <div 
                  key={connection.instanceName}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      connection.status === 'connected' ? 'bg-green-500' :
                      connection.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                      connection.status === 'error' ? 'bg-red-500' :
                      'bg-gray-400'
                    )} />
                    <div>
                      <p className="font-medium text-sm">
                        {connection.instanceName}
                      </p>
                      {connection.numero && (
                        <p className="text-xs text-muted-foreground">
                          {connection.numero}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {Math.round((Date.now() - connection.lastCheck.getTime()) / 1000)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}