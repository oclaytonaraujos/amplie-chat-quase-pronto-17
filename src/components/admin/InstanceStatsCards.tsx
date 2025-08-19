import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertTriangle, Zap } from 'lucide-react';

interface StatsCardsProps {
  healthyCount: number;
  connectingCount: number;
  errorCount: number;
  averageResponseTime: number;
}

export function InstanceStatsCards({
  healthyCount,
  connectingCount,
  errorCount,
  averageResponseTime
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{healthyCount}</div>
          <p className="text-xs text-muted-foreground">Instâncias ativas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conectando</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{connectingCount}</div>
          <p className="text-xs text-muted-foreground">Em conexão</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offline</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{errorCount}</div>
          <p className="text-xs text-muted-foreground">Com problemas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latência</CardTitle>
          <Zap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {averageResponseTime > 0 ? `${Math.round(averageResponseTime)}ms` : '-'}
          </div>
          <p className="text-xs text-muted-foreground">Tempo médio</p>
        </CardContent>
      </Card>
    </div>
  );
}