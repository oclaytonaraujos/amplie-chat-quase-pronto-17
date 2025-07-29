import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { Webhook, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WebhookStatus {
  instanceName: string;
  configured: boolean;
  url?: string;
  events?: string[];
  error?: string;
}

export function WebhookMonitoring() {
  const [webhookStatuses, setWebhookStatuses] = useState<WebhookStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);
  const { checkWebhookStatus, reconfigureWebhook, fetchInstances } = useEvolutionAPIComplete();
  const { toast } = useToast();

  const loadWebhookStatuses = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as instâncias
      const instances = await fetchInstances();
      
      if (!instances || !Array.isArray(instances)) {
        console.log('Nenhuma instância encontrada');
        setWebhookStatuses([]);
        return;
      }

      // Verificar status do webhook para cada instância
      const statuses = await Promise.all(
        instances.map(async (instance: any) => {
          const status = await checkWebhookStatus(instance.instanceName);
          return {
            instanceName: instance.instanceName,
            ...status
          };
        })
      );

      setWebhookStatuses(statuses);
    } catch (error) {
      console.error('Erro ao carregar status dos webhooks:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o status dos webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconfigureWebhook = async (instanceName: string) => {
    try {
      setChecking(instanceName);
      
      const result = await reconfigureWebhook(instanceName);
      
      if (result) {
        // Recarregar status após reconfiguração
        await loadWebhookStatuses();
        
        toast({
          title: "Webhook reconfigurado",
          description: `Webhook da instância ${instanceName} foi reconfigurado com sucesso`,
        });
      }
    } catch (error) {
      console.error('Erro ao reconfigurar webhook:', error);
      toast({
        title: "Erro",
        description: "Erro ao reconfigurar webhook",
        variant: "destructive",
      });
    } finally {
      setChecking(null);
    }
  };

  const getStatusBadge = (status: WebhookStatus) => {
    if (status.error) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
    }
    
    if (!status.configured) {
      return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Não configurado</Badge>;
    }
    
    const expectedUrl = 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution';
    const isCorrectUrl = status.url === expectedUrl;
    const hasAllEvents = status.events && status.events.length >= 20; // Espera pelo menos 20 eventos
    
    if (isCorrectUrl && hasAllEvents) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Configurado</Badge>;
    }
    
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Configuração parcial</Badge>;
  };

  const getTotalEvents = () => {
    return [
      "APPLICATION_STARTUP",
      "QRCODE_UPDATED", 
      "MESSAGES_SET",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "MESSAGES_DELETE",
      "SEND_MESSAGE",
      "CONTACTS_SET",
      "CONTACTS_UPSERT", 
      "CONTACTS_UPDATE",
      "PRESENCE_UPDATE",
      "CHATS_SET",
      "CHATS_UPSERT",
      "CHATS_UPDATE", 
      "CHATS_DELETE",
      "GROUPS_UPSERT",
      "GROUP_UPDATE",
      "GROUP_PARTICIPANTS_UPDATE",
      "CONNECTION_UPDATE",
      "CALL",
      "NEW_JWT_TOKEN",
      "TYPEBOT_START", 
      "TYPEBOT_CHANGE_STATUS"
    ];
  };

  useEffect(() => {
    loadWebhookStatuses();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Monitoramento de Webhooks
          </CardTitle>
          <CardDescription>
            Verificando status dos webhooks das instâncias...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Monitoramento de Webhooks
        </CardTitle>
        <CardDescription>
          Status dos webhooks das instâncias Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Total de eventos configurados: {getTotalEvents().length}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadWebhookStatuses}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {webhookStatuses.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma instância Evolution API encontrada
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {webhookStatuses.map((status) => (
              <div key={status.instanceName} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{status.instanceName}</h4>
                    {getStatusBadge(status)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReconfigureWebhook(status.instanceName)}
                    disabled={checking === status.instanceName}
                  >
                    {checking === status.instanceName ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Webhook className="h-4 w-4 mr-2" />
                        Reconfigurar
                      </>
                    )}
                  </Button>
                </div>

                {status.error && (
                  <Alert variant="destructive" className="mb-2">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{status.error}</AlertDescription>
                  </Alert>
                )}

                {status.configured && (
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium">URL:</span> 
                      <span className="ml-2 text-muted-foreground break-all">{status.url}</span>
                    </div>
                    <div>
                      <span className="font-medium">Eventos configurados:</span> 
                      <span className="ml-2 text-muted-foreground">
                        {status.events?.length || 0} de {getTotalEvents().length}
                      </span>
                    </div>
                    {status.events && status.events.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          Ver eventos configurados
                        </summary>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {status.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}

                {!status.configured && !status.error && (
                  <div className="text-sm text-muted-foreground">
                    Webhook não configurado para esta instância
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}