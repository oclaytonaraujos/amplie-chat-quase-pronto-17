/**
 * Componente para monitoramento das integrações N8N
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface N8nLog {
  id: string;
  instance_name: string;
  event_type: string;
  success: boolean;
  error_message: string | null;
  event_data: any;
  created_at: string;
}

interface N8nStats {
  total_executions: number;
  success_rate: number;
  last_24h_executions: number;
  failed_executions: number;
}

export function N8nMonitoring() {
  const [logs, setLogs] = useState<N8nLog[]>([]);
  const [stats, setStats] = useState<N8nStats>({
    total_executions: 0,
    success_rate: 0,
    last_24h_executions: 0,
    failed_executions: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      // Buscar empresa_id do usuário
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (!profile?.empresa_id) return;

      // Buscar logs N8N das últimas 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentLogs, error: logsError } = await supabase
        .from('evolution_api_logs')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('event_type', 'n8n_webhook_send')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      setLogs(recentLogs || []);

      // Calcular estatísticas
      const totalLogs = recentLogs?.length || 0;
      const successfulLogs = recentLogs?.filter(log => log.success).length || 0;
      const failedLogs = totalLogs - successfulLogs;
      const successRate = totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0;

      setStats({
        total_executions: totalLogs,
        success_rate: Math.round(successRate),
        last_24h_executions: totalLogs,
        failed_executions: failedLogs
      });

    } catch (error) {
      console.error('Erro ao carregar estatísticas N8N:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Sucesso
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Falha
      </Badge>
    );
  };

  const formatEventType = (eventType: string) => {
    const types: Record<string, string> = {
      'n8n_webhook_send': 'Envio Webhook N8N',
      'message_received': 'Mensagem Recebida',
      'message_sent': 'Mensagem Enviada',
      'instance_connected': 'Instância Conectada',
      'instance_disconnected': 'Instância Desconectada'
    };
    return types[eventType] || eventType;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Carregando monitoramento N8N...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Execuções (24h)</CardDescription>
            <CardTitle className="text-2xl">{stats.total_executions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="w-4 h-4 mr-1 text-blue-600" />
              <span className="text-sm text-muted-foreground">Últimas 24 horas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Sucesso</CardDescription>
            <CardTitle className="text-2xl">{stats.success_rate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
              <span className="text-sm text-muted-foreground">Execuções bem-sucedidas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Falhas</CardDescription>
            <CardTitle className="text-2xl">{stats.failed_executions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-1 text-red-600" />
              <span className="text-sm text-muted-foreground">Execuções falharam</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-2xl">
              {stats.success_rate >= 90 ? '🟢' : stats.success_rate >= 70 ? '🟡' : '🔴'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">
                {stats.success_rate >= 90 ? 'Excelente' : stats.success_rate >= 70 ? 'Regular' : 'Crítico'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Logs e Configurações */}
      <Tabs defaultValue="logs" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="logs">Logs de Execução</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
          </TabsList>
          
          <Button onClick={loadStats} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Execução N8N</CardTitle>
              <CardDescription>
                Últimas execuções dos webhooks N8N (24 horas)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma execução N8N encontrada nas últimas 24 horas
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(log.success)}
                          <span className="font-medium">{formatEventType(log.event_type)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>Instância: {log.instance_name}</span>
                          <span className="mx-2">•</span>
                          <span>{format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        {log.error_message && (
                          <div className="text-sm text-red-600 mt-1">
                            Erro: {log.error_message}
                          </div>
                        )}
                      </div>
                      {log.event_data?.duration_ms && (
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            {log.event_data.duration_ms}ms
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Status da Configuração N8N</CardTitle>
              <CardDescription>
                Verificar status das URLs de webhook configuradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Como funciona a integração:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li><strong>Mensagens Recebidas:</strong> Enviadas automaticamente para N8N quando chegam no WhatsApp</li>
                    <li><strong>Mensagens Enviadas:</strong> Notificadas para N8N após o envio pelo agente</li>
                    <li><strong>Configuração de Instância:</strong> Mudanças de status (conectado/desconectado) são reportadas</li>
                    <li><strong>Boot:</strong> Notificação de inicialização do sistema</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Dica de Configuração N8N</h4>
                  <p className="text-sm text-blue-800">
                    Configure triggers "Webhook" em seus fluxos N8N para receber esses eventos automaticamente.
                    Cada URL configurada receberá payloads específicos do tipo de evento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}