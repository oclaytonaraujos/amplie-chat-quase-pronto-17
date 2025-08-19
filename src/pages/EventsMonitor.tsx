import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEventList } from '@/hooks/useEventStatus';
import { EventsService } from '@/services/EventsService';
import { 
  Activity, 
  MessageSquare, 
  RefreshCw, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from '@/types/integration-events';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EventsMonitor() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const { 
    events, 
    loading, 
    error, 
    refresh, 
    loadMore, 
    hasMore 
  } = useEventList({
    eventType: undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 20
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim() || !testPhone.trim()) {
      toast({
        title: "Erro",
        description: "Preencha a mensagem e o telefone",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    
    try {
      const response = await EventsService.sendTextMessage(
        'default', // Instance name
        testPhone,
        testMessage,
        {
          idempotencyKey: `test-${Date.now()}`
        }
      );

      toast({
        title: "Mensagem de teste enviada",
        description: `Correlation ID: ${response.correlation_id}`,
      });

      setTestMessage('');
      setTestPhone('');
      
      // Refresh events to show the new one
      setTimeout(refresh, 1000);
      
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem de teste",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    return (
      event.correlation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(event.payload).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitor de Eventos</h1>
          <p className="text-muted-foreground mt-2">
            Monitore eventos de integração n8n em tempo real
          </p>
        </div>
        <Button onClick={refresh} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Test Message Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Teste de Mensagem
          </CardTitle>
          <CardDescription>
            Envie uma mensagem de teste via n8n
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Telefone (ex: 5511999999999)"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Mensagem de teste"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="flex-2"
            />
            <Button 
              onClick={sendTestMessage} 
              disabled={isSendingTest}
              className="whitespace-nowrap"
            >
              {isSendingTest ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Enviar Teste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por correlation ID, tipo ou payload..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="queued">Na fila</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos Recentes</CardTitle>
          <CardDescription>
            {filteredEvents.length} evento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 text-sm mb-4">
              Erro ao carregar eventos: {error}
            </div>
          )}
          
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <div 
                key={event.id} 
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${EVENT_STATUS_COLORS[event.status as keyof typeof EVENT_STATUS_COLORS]}`}
                      >
                        {getStatusIcon(event.status)}
                        {EVENT_STATUS_LABELS[event.status as keyof typeof EVENT_STATUS_LABELS]}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground">
                        {event.correlation_id}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {event.event_type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Criado:</span>
                        <span className="ml-2">
                          {new Date(event.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      {event.processed_at && (
                        <div>
                          <span className="text-muted-foreground">Processado:</span>
                          <span className="ml-2">
                            {new Date(event.processed_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                      {event.delivered_at && (
                        <div>
                          <span className="text-muted-foreground">Entregue:</span>
                          <span className="ml-2">
                            {new Date(event.delivered_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Tentativas:</span>
                        <span className="ml-2">
                          {event.retry_count}/{event.max_retries}
                        </span>
                      </div>
                    </div>

                    {event.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <strong>Erro:</strong> {event.error_message}
                      </div>
                    )}
                    
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        Ver payload
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredEvents.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum evento encontrado
              </div>
            )}
            
            {loading && (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Carregando eventos...</p>
              </div>
            )}
            
            {hasMore && !loading && (
              <div className="text-center pt-4">
                <Button onClick={loadMore} variant="outline">
                  Carregar mais eventos
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}