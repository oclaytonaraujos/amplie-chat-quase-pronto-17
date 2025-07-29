import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Activity, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { usePresence } from '@/contexts/PresenceContext';

interface QueueStats {
  status: string;
  count: number;
  avg_retries: number;
  oldest_message: string;
  newest_message: string;
  avg_age_seconds: number;
}

interface QueueStatus {
  total_pending: number;
  total_processing: number;
  total_failed: number;
  oldest_pending_age: string | number;
  failed_with_retries: number;
}

export default function QueueMonitoring() {
  const [stats, setStats] = useState<QueueStats[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggeringProcessor, setTriggeringProcessor] = useState(false);
  const { isSystemOnline } = usePresence();

  const fetchQueueStats = async () => {
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('queue_monitoring')
        .select('*');

      if (statsError) throw statsError;

      const { data: statusData, error: statusError } = await supabase
        .rpc('get_queue_status');

      if (statusError) throw statusError;

      setStats(statsData || []);
      
      // Handle the status data properly with type safety
      if (statusData && statusData.length > 0) {
        const status = statusData[0];
        setQueueStatus({
          total_pending: status.total_pending || 0,
          total_processing: status.total_processing || 0,
          total_failed: status.total_failed || 0,
          oldest_pending_age: typeof status.oldest_pending_age === 'string' || typeof status.oldest_pending_age === 'number' 
            ? status.oldest_pending_age 
            : 0,
          failed_with_retries: status.failed_with_retries || 0
        });
      } else {
        setQueueStatus(null);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas da fila:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerQueueProcessor = async () => {
    setTriggeringProcessor(true);
    try {
      const { error } = await supabase.functions.invoke('chatbot-queue-processor', {
        body: { trigger: 'manual' }
      });

      if (error) throw error;

      // Aguardar um pouco antes de atualizar as estatísticas
      setTimeout(() => {
        fetchQueueStats();
      }, 2000);
    } catch (error) {
      console.error('Erro ao executar processador de fila:', error);
    } finally {
      setTriggeringProcessor(false);
    }
  };

  useEffect(() => {
    fetchQueueStats();
    
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchQueueStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Configurar updates em tempo real
  const { isConnected } = useRealTimeUpdates({
    table: 'message_queue',
    onInsert: () => fetchQueueStats(),
    onUpdate: () => fetchQueueStats(),
    onDelete: () => fetchQueueStats(),
    enableBroadcast: true,
    channel: 'queue_monitoring',
    onBroadcast: (payload) => {
      console.log('Queue broadcast received:', payload);
      fetchQueueStats();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'retrying': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Activity className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'retrying': return <RefreshCw className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatAge = (ageValue: string | number) => {
    let seconds: number;
    
    if (typeof ageValue === 'string') {
      // Parse interval string or convert to number
      const match = ageValue.match(/(\d+)/);
      seconds = match ? parseInt(match[1]) : 0;
    } else {
      seconds = ageValue;
    }
    
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento da Fila de Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Activity className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Carregando estatísticas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Monitoramento da Fila de Mensagens
              <div className="flex items-center gap-2">
                <Circle className={`h-2 w-2 fill-current ${isSystemOnline ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm text-muted-foreground">
                  {isSystemOnline ? 'Sistema Online' : 'Sistema Offline'}
                </span>
                {isConnected && (
                  <>
                    <Circle className="h-2 w-2 fill-current text-blue-500" />
                    <span className="text-sm text-muted-foreground">Tempo Real Ativo</span>
                  </>
                )}
              </div>
            </CardTitle>
          </div>
          <Button 
            onClick={triggerQueueProcessor}
            disabled={triggeringProcessor}
            size="sm"
            variant="outline"
          >
            {triggeringProcessor ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Executar Processador
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{queueStatus?.total_pending || 0}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{queueStatus?.total_processing || 0}</div>
              <div className="text-sm text-gray-600">Processando</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{queueStatus?.total_failed || 0}</div>
              <div className="text-sm text-gray-600">Falharam</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{queueStatus?.failed_with_retries || 0}</div>
              <div className="text-sm text-gray-600">Com Retry</div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <div className="text-lg font-bold">
                {queueStatus?.oldest_pending_age 
                  ? formatAge(queueStatus.oldest_pending_age)
                  : '0s'
                }
              </div>
              <div className="text-sm text-gray-600">Mais Antiga</div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estatísticas Detalhadas</h3>
              <div className="grid gap-4">
                {stats.map((stat) => (
                  <div key={stat.status} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(stat.status)}
                      <div>
                        <Badge className={getStatusColor(stat.status)}>
                          {stat.status.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">
                          {stat.count} mensagens
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>Média de retries: {stat.avg_retries?.toFixed(1) || '0'}</div>
                      <div>Idade média: {formatAge(stat.avg_age_seconds || 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <p>Nenhuma mensagem na fila no momento</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
