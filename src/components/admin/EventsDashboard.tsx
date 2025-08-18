import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEventList } from '@/hooks/useEventStatus';
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from '@/types/integration-events';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function EventsDashboard() {
  const {
    events,
    loading,
    error,
    refresh,
    loadMore,
    hasMore
  } = useEventList({ limit: 50 });

  const stats = events.reduce((acc, event) => {
    acc[event.status] = (acc[event.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Na Fila</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.queued || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processando</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Eventos de Integração</CardTitle>
          <Button 
            onClick={refresh} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="queued">Na Fila</TabsTrigger>
              <TabsTrigger value="processing">Processando</TabsTrigger>
              <TabsTrigger value="delivered">Entregues</TabsTrigger>
              <TabsTrigger value="failed">Falhas</TabsTrigger>
            </TabsList>

            {(['all', 'queued', 'processing', 'delivered', 'failed'] as const).map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                <div className="space-y-2">
                  {events
                    .filter(event => status === 'all' || event.status === status)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(event.status)}
                            <Badge 
                              variant="secondary"
                              className={EVENT_STATUS_COLORS[event.status as keyof typeof EVENT_STATUS_COLORS]}
                            >
                              {EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS]}
                            </Badge>
                          </div>

                          <div className="flex-1">
                            <div className="font-medium">{event.event_type}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {event.correlation_id.slice(0, 8)}...
                            </div>
                            {event.error_message && (
                              <div className="text-sm text-destructive mt-1">
                                {event.error_message}
                              </div>
                            )}
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                            {event.retry_count > 0 && (
                              <div className="text-xs text-orange-600">
                                Tentativas: {event.retry_count}/{event.max_retries}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {hasMore && (
                  <div className="text-center">
                    <Button 
                      onClick={loadMore} 
                      variant="outline"
                      disabled={loading}
                    >
                      {loading ? 'Carregando...' : 'Carregar mais'}
                    </Button>
                  </div>
                )}

                {events.filter(e => status === 'all' || e.status === status).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {status === 'all' ? 'Nenhum evento encontrado' : `Nenhum evento ${EVENT_STATUS_LABELS[status as keyof typeof EVENT_STATUS_LABELS].toLowerCase()}`}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}