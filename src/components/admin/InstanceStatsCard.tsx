import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  Wifi,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface InstanceStats {
  total: number;
  connected: number;
  disconnected: number;
  webhook_active: number;
  webhook_inactive: number;
}

interface InstanceStatsCardProps {
  stats: InstanceStats;
  loading?: boolean;
}

export function InstanceStatsCard({ stats, loading = false }: InstanceStatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Estatísticas das Instâncias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const connectionRate = stats.total > 0 ? Math.round((stats.connected / stats.total) * 100) : 0;
  const webhookRate = stats.total > 0 ? Math.round((stats.webhook_active / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Estatísticas das Instâncias
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total de Instâncias */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </div>

          {/* Conectadas */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Conectadas</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.connected}</div>
            <Badge 
              variant="outline" 
              className="text-xs mt-1 bg-green-50 text-green-700 border-green-200"
            >
              {connectionRate}%
            </Badge>
          </div>

          {/* Desconectadas */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Desconectadas</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.disconnected}</div>
            <Badge 
              variant="outline" 
              className="text-xs mt-1 bg-red-50 text-red-700 border-red-200"
            >
              {100 - connectionRate}%
            </Badge>
          </div>

          {/* Webhooks Ativos */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Webhooks</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.webhook_active}</div>
            <Badge 
              variant="outline" 
              className="text-xs mt-1 bg-purple-50 text-purple-700 border-purple-200"
            >
              {webhookRate}%
            </Badge>
          </div>
        </div>

        {/* Alertas */}
        {(stats.disconnected > 0 || stats.webhook_inactive > 0) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Atenção necessária:</p>
                <ul className="text-yellow-700 mt-1 space-y-1">
                  {stats.disconnected > 0 && (
                    <li>• {stats.disconnected} instância(s) desconectada(s)</li>
                  )}
                  {stats.webhook_inactive > 0 && (
                    <li>• {stats.webhook_inactive} webhook(s) inativo(s)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}