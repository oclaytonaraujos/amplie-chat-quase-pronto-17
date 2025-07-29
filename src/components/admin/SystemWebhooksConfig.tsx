import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Webhook, 
  TestTube, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock,
  Code2,
  Info
} from 'lucide-react';
import { SystemWebhookEvents, WebhookEventKey, WebhookTestResult } from '@/types/n8n-webhooks';
import { useN8nConfigurations } from '@/hooks/useN8nConfigurations';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WebhookEventConfig {
  key: WebhookEventKey;
  name: string;
  description: string;
  enabled: boolean;
  webhook_url: string;
  last_triggered?: string;
  success_count: number;
  error_count: number;
}

export function SystemWebhooksConfig() {
  const { configurations, loading, saveConfiguration, updateWebhookEvent } = useN8nConfigurations();
  const [events, setEvents] = useState<WebhookEventConfig[]>([]);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [key: string]: WebhookTestResult }>({});
  const { toast } = useToast();

  // Inicializar eventos baseados nas configurações do banco
  useEffect(() => {
    const activeConfig = configurations.find(config => config.status === 'active');
    if (activeConfig?.settings) {
      const settings = activeConfig.settings as any;
      if (settings?.events) {
        const eventConfigs: WebhookEventConfig[] = [
          {
            key: 'atendimento.iniciado',
            name: 'Atendimento Iniciado',
            description: 'Disparado quando uma nova conversa é iniciada',
            enabled: settings.events['atendimento.iniciado']?.enabled || false,
            webhook_url: settings.events['atendimento.iniciado']?.webhook_url || '',
            success_count: settings.events['atendimento.iniciado']?.success_count || 0,
            error_count: settings.events['atendimento.iniciado']?.error_count || 0,
          },
          {
            key: 'atendimento.finalizado',
            name: 'Atendimento Finalizado',
            description: 'Disparado quando um atendimento é encerrado',
            enabled: settings.events['atendimento.finalizado']?.enabled || false,
            webhook_url: settings.events['atendimento.finalizado']?.webhook_url || '',
            success_count: settings.events['atendimento.finalizado']?.success_count || 0,
            error_count: settings.events['atendimento.finalizado']?.error_count || 0,
          },
          {
            key: 'atendimento.transferido',
            name: 'Atendimento Transferido',
            description: 'Disparado quando uma conversa é transferida',
            enabled: settings.events['atendimento.transferido']?.enabled || false,
            webhook_url: settings.events['atendimento.transferido']?.webhook_url || '',
            success_count: settings.events['atendimento.transferido']?.success_count || 0,
            error_count: settings.events['atendimento.transferido']?.error_count || 0,
          },
          {
            key: 'contato.criado',
            name: 'Contato Criado',
            description: 'Disparado quando um novo contato é adicionado',
            enabled: settings.events['contato.criado']?.enabled || false,
            webhook_url: settings.events['contato.criado']?.webhook_url || '',
            success_count: settings.events['contato.criado']?.success_count || 0,
            error_count: settings.events['contato.criado']?.error_count || 0,
          },
          {
            key: 'mensagem.recebida',
            name: 'Mensagem Recebida',
            description: 'Disparado quando uma mensagem é recebida (use com cuidado)',
            enabled: settings.events['mensagem.recebida']?.enabled || false,
            webhook_url: settings.events['mensagem.recebida']?.webhook_url || '',
            success_count: settings.events['mensagem.recebida']?.success_count || 0,
            error_count: settings.events['mensagem.recebida']?.error_count || 0,
          },
        ];
        setEvents(eventConfigs);
        return;
      }
    }
    
    // Fallback para configuração padrão
    setEvents([
      {
        key: 'atendimento.iniciado',
        name: 'Atendimento Iniciado',
        description: 'Disparado quando uma nova conversa é iniciada',
        enabled: false,
        webhook_url: '',
        success_count: 0,
        error_count: 0,
      },
      {
        key: 'atendimento.finalizado',
        name: 'Atendimento Finalizado',
        description: 'Disparado quando um atendimento é encerrado',
        enabled: false,
        webhook_url: '',
        success_count: 0,
        error_count: 0,
      },
      {
        key: 'atendimento.transferido',
        name: 'Atendimento Transferido',
        description: 'Disparado quando uma conversa é transferida',
        enabled: false,
        webhook_url: '',
        success_count: 0,
        error_count: 0,
      },
      {
        key: 'contato.criado',
        name: 'Contato Criado',
        description: 'Disparado quando um novo contato é adicionado',
        enabled: false,
        webhook_url: '',
        success_count: 0,
        error_count: 0,
      },
      {
        key: 'mensagem.recebida',
        name: 'Mensagem Recebida',
        description: 'Disparado quando uma mensagem é recebida (use com cuidado)',
        enabled: false,
        webhook_url: '',
        success_count: 0,
        error_count: 0,
      },
    ]);
  }, [configurations]);

  const updateEvent = async (key: WebhookEventKey, updates: Partial<WebhookEventConfig>) => {
    // Atualizar estado local
    setEvents(prev => prev.map(event => 
      event.key === key ? { ...event, ...updates } : event
    ));

    // Persistir no banco
    const activeConfig = configurations.find(config => config.status === 'active');
    if (activeConfig) {
      await updateWebhookEvent(activeConfig.id, key, {
        enabled: updates.enabled,
        webhook_url: updates.webhook_url,
      });
    } else if (updates.enabled || updates.webhook_url) {
      // Criar nova configuração se não existir
      await saveConfiguration({
        instance_url: 'https://app.n8n.cloud',
        status: 'active',
        settings: {
          events: {
            [key]: {
              enabled: updates.enabled || false,
              webhook_url: updates.webhook_url || '',
              success_count: 0,
              error_count: 0,
            }
          }
        }
      });
    }
  };

  const testWebhook = async (eventKey: WebhookEventKey, webhookUrl: string) => {
    if (!webhookUrl) {
      toast({
        title: "URL necessária",
        description: "Configure uma URL de webhook antes de testar",
        variant: "destructive",
      });
      return;
    }

    setTestingWebhook(eventKey);
    
    try {
      const examplePayload = getExamplePayload(eventKey);
      const startTime = Date.now();
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          event: eventKey,
          test: true,
          data: examplePayload,
          timestamp: new Date().toISOString(),
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result: WebhookTestResult = {
        success: true,
        response_time_ms: responseTime,
        status_code: response.status,
        timestamp: new Date().toISOString(),
      };

      setTestResults(prev => ({ ...prev, [eventKey]: result }));
      
      toast({
        title: "Teste enviado",
        description: `Webhook testado em ${responseTime}ms. Verifique o n8n para confirmar o recebimento.`,
      });
    } catch (error) {
      const result: WebhookTestResult = {
        success: false,
        error_message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      };

      setTestResults(prev => ({ ...prev, [eventKey]: result }));
      
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar o webhook. Verifique a URL e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(null);
    }
  };

  const copyPayloadExample = (eventKey: WebhookEventKey) => {
    const payload = JSON.stringify(getExamplePayload(eventKey), null, 2);
    navigator.clipboard.writeText(payload);
    toast({
      title: "Copiado!",
      description: "Exemplo de payload copiado para a área de transferência",
    });
  };

  const getExamplePayload = (eventKey: WebhookEventKey) => {
    const examples: SystemWebhookEvents = {
      'atendimento.iniciado': {
        conversa_id: "123e4567-e89b-12d3-a456-426614174000",
        contato: {
          id: "987fcdeb-51a2-43d1-b234-567890123456",
          nome: "João Silva",
          telefone: "+5511999999999",
          email: "joao@email.com"
        },
        setor: "Vendas",
        timestamp: "2024-01-15T10:30:00Z"
      },
      'atendimento.finalizado': {
        conversa_id: "123e4567-e89b-12d3-a456-426614174000",
        contato: {
          id: "987fcdeb-51a2-43d1-b234-567890123456",
          nome: "João Silva",
          telefone: "+5511999999999"
        },
        agente: {
          id: "456e7890-e89b-12d3-a456-426614174000",
          nome: "Maria Atendente",
          email: "maria@empresa.com"
        },
        duracao_minutos: 15,
        status_final: "resolvido",
        timestamp: "2024-01-15T10:45:00Z"
      },
      'atendimento.transferido': {
        conversa_id: "123e4567-e89b-12d3-a456-426614174000",
        contato: {
          id: "987fcdeb-51a2-43d1-b234-567890123456",
          nome: "João Silva",
          telefone: "+5511999999999"
        },
        de_agente: {
          id: "456e7890-e89b-12d3-a456-426614174000",
          nome: "Maria Atendente"
        },
        para_agente: {
          id: "789e0123-e89b-12d3-a456-426614174000",
          nome: "Pedro Especialista"
        },
        setor_origem: "Suporte",
        setor_destino: "Técnico",
        motivo: "Questão técnica complexa",
        timestamp: "2024-01-15T10:35:00Z"
      },
      'contato.criado': {
        contato: {
          id: "987fcdeb-51a2-43d1-b234-567890123456",
          nome: "João Silva",
          telefone: "+5511999999999",
          email: "joao@email.com",
          empresa: "Silva & Associados",
          tags: ["lead", "potencial-cliente"]
        },
        criado_por: {
          id: "456e7890-e89b-12d3-a456-426614174000",
          nome: "Maria Atendente"
        },
        timestamp: "2024-01-15T10:25:00Z"
      },
      'mensagem.recebida': {
        conversa_id: "123e4567-e89b-12d3-a456-426614174000",
        contato: {
          id: "987fcdeb-51a2-43d1-b234-567890123456",
          nome: "João Silva",
          telefone: "+5511999999999"
        },
        mensagem: {
          id: "msg123456789",
          conteudo: "Olá, preciso de ajuda com meu pedido",
          tipo: "texto"
        },
        timestamp: "2024-01-15T10:30:15Z"
      }
    };

    return examples[eventKey];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Webhooks de Eventos do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Configure URLs de webhook do n8n para eventos específicos do sistema
          </p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure os webhooks no n8n primeiro, depois cole as URLs aqui. 
          Use o botão "Testar" para verificar se a conexão está funcionando.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.key} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Webhook className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{event.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {event.description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {testResults[event.key] && (
                    <Badge variant={testResults[event.key].success ? "default" : "destructive"}>
                      {testResults[event.key].success ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {testResults[event.key].success ? 'OK' : 'Erro'}
                    </Badge>
                  )}
                  
                  <Switch
                    checked={event.enabled}
                    onCheckedChange={(checked) => updateEvent(event.key, { enabled: checked })}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`webhook-${event.key}`}>URL do Webhook n8n</Label>
                <div className="flex gap-2">
                  <Input
                    id={`webhook-${event.key}`}
                    value={event.webhook_url}
                    onChange={(e) => updateEvent(event.key, { webhook_url: e.target.value })}
                    placeholder="https://seu-n8n.app.n8n.cloud/webhook/evento-sistema"
                    disabled={!event.enabled}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook(event.key, event.webhook_url)}
                    disabled={!event.enabled || !event.webhook_url || testingWebhook === event.key}
                  >
                    {testingWebhook === event.key ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>✅ {event.success_count} sucessos</span>
                  <span>❌ {event.error_count} erros</span>
                  {event.last_triggered && (
                    <span>🕒 Último: {new Date(event.last_triggered).toLocaleString()}</span>
                  )}
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Code2 className="h-4 w-4 mr-1" />
                      Ver Payload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Exemplo de Payload - {event.name}</DialogTitle>
                      <DialogDescription>
                        Este é o formato dos dados que será enviado para o webhook do n8n
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>JSON do Payload:</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyPayloadExample(event.key)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <Textarea
                        value={JSON.stringify(getExamplePayload(event.key), null, 2)}
                        readOnly
                        className="font-mono text-xs h-64"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}