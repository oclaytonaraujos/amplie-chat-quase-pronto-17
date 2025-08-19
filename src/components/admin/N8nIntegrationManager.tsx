import React, { useState } from 'react';
import { useN8nConfigurations } from '@/hooks/useN8nConfigurations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Settings, Activity, Trash2, TestTube } from 'lucide-react';
import { SystemWebhookEvents, WebhookEventKey } from '@/types/n8n-webhooks';

export function N8nIntegrationManager() {
  const { configurations, loading, saveConfiguration, updateWebhookEvent, deleteConfiguration } = useN8nConfigurations();
  const { toast } = useToast();
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [formData, setFormData] = useState({
    instance_url: 'https://app.n8n.cloud',
    api_key: '',
    webhook_receive_url: '',
    webhook_send_url: '',
    webhook_create_connection: '',
    webhook_delete_instance: '',
    webhook_chatbot: ''
  });

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveConfiguration(formData);
    if (result) {
      setShowNewConfig(false);
      setFormData({
        instance_url: 'https://app.n8n.cloud',
        api_key: '',
        webhook_receive_url: '',
        webhook_send_url: '',
        webhook_create_connection: '',
        webhook_delete_instance: '',
        webhook_chatbot: ''
      });
    }
  };

  const testWebhookEvent = async (configId: string, eventKey: WebhookEventKey) => {
    try {
      const config = configurations.find(c => c.id === configId);
      if (!config?.webhook_send_url) {
        toast({
          title: "Erro",
          description: "URL de webhook de envio não configurada",
          variant: "destructive",
        });
        return;
      }

      const testPayload = {
        event_type: eventKey,
        payload: getTestPayload(eventKey),
        webhook_url: config.webhook_send_url,
        empresa_id: config.empresa_id
      };

      const response = await fetch('/functions/v1/n8n-webhook-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast({
          title: "Teste realizado",
          description: "Evento de teste enviado para n8n com sucesso",
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao enviar evento de teste",
        variant: "destructive",
      });
    }
  };

  const getTestPayload = (eventKey: WebhookEventKey) => {
    switch (eventKey) {
      case 'mensagem.recebida':
        return {
          conversa_id: 'test-123',
          contato: { id: 'test', nome: 'Teste', telefone: '11999999999' },
          mensagem: { id: 'msg-123', conteudo: 'Mensagem de teste', tipo: 'text' },
          timestamp: new Date().toISOString()
        };
      case 'atendimento.iniciado':
        return {
          conversa_id: 'test-123',
          contato: { id: 'test', nome: 'Teste', telefone: '11999999999' },
          agente: { id: 'agent-123', nome: 'Agente Teste', email: 'agente@teste.com' },
          timestamp: new Date().toISOString()
        };
      default:
        return { test: true, timestamp: new Date().toISOString() };
    }
  };

  const webhookEvents: WebhookEventKey[] = [
    'mensagem.recebida',
    'atendimento.iniciado',
    'atendimento.finalizado',
    'atendimento.transferido',
    'contato.criado'
  ];

  if (loading) {
    return <div className="p-6">Carregando configurações n8n...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Integração n8n</h2>
          <p className="text-muted-foreground">Configure webhooks bidirecionais com n8n</p>
        </div>
        <Button onClick={() => setShowNewConfig(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Status Overview dos Webhooks */}
      {configurations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-green-700">🔄 Envio</div>
            <div className="text-xs text-muted-foreground">
              {configurations.filter(c => c.webhook_send_url).length}/{configurations.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-blue-700">📥 Recebimento</div>
            <div className="text-xs text-muted-foreground">
              {configurations.filter(c => c.webhook_receive_url).length}/{configurations.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-purple-700">➕ Conexão</div>
            <div className="text-xs text-muted-foreground">
              {configurations.filter(c => c.webhook_create_connection).length}/{configurations.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-red-700">🗑️ Delete</div>
            <div className="text-xs text-muted-foreground">
              {configurations.filter(c => c.webhook_delete_instance).length}/{configurations.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-orange-700">🤖 Chatbot</div>
            <div className="text-xs text-muted-foreground">
              {configurations.filter(c => c.webhook_chatbot).length}/{configurations.length}
            </div>
          </div>
        </div>
      )}

      {showNewConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Configuração n8n</CardTitle>
            <CardDescription>Configure uma nova instância n8n</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instance_url">URL da Instância n8n</Label>
                  <Input
                    id="instance_url"
                    value={formData.instance_url}
                    onChange={(e) => setFormData({ ...formData, instance_url: e.target.value })}
                    placeholder="https://app.n8n.cloud"
                  />
                </div>
                <div>
                  <Label htmlFor="api_key">API Key (opcional)</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="Chave de API para autenticação"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="webhook_receive_url">URL Recebimento</Label>
                    <Input
                      id="webhook_receive_url"
                      value={formData.webhook_receive_url}
                      onChange={(e) => setFormData({ ...formData, webhook_receive_url: e.target.value })}
                      placeholder="URL para receber dados do n8n"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook_send_url">URL Envio</Label>
                    <Input
                      id="webhook_send_url"
                      value={formData.webhook_send_url}
                      onChange={(e) => setFormData({ ...formData, webhook_send_url: e.target.value })}
                      placeholder="URL para enviar eventos para n8n"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="webhook_create_connection">URL Criação de Conexão</Label>
                    <Input
                      id="webhook_create_connection"
                      value={formData.webhook_create_connection}
                      onChange={(e) => setFormData({ ...formData, webhook_create_connection: e.target.value })}
                      placeholder="URL para criar nova conexão WhatsApp"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook_delete_instance">URL Delete de Instância</Label>
                    <Input
                      id="webhook_delete_instance"
                      value={formData.webhook_delete_instance}
                      onChange={(e) => setFormData({ ...formData, webhook_delete_instance: e.target.value })}
                      placeholder="URL para deletar instância WhatsApp"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="webhook_chatbot">URL Chatbot</Label>
                  <Input
                    id="webhook_chatbot"
                    value={formData.webhook_chatbot}
                    onChange={(e) => setFormData({ ...formData, webhook_chatbot: e.target.value })}
                    placeholder="URL para processar eventos do chatbot"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Salvar Configuração</Button>
                <Button type="button" variant="outline" onClick={() => setShowNewConfig(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {config.instance_url}
                    <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                      {config.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Última atividade: {config.last_ping ? new Date(config.last_ping).toLocaleString() : 'Nunca'}
                  </CardDescription>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteConfiguration(config.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="events">
                <TabsList>
                  <TabsTrigger value="events">Eventos</TabsTrigger>
                  <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                  <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="events" className="space-y-4">
                  <div className="grid gap-4">
                    {webhookEvents.map((eventKey) => {
                      const eventConfig = config.settings?.events?.[eventKey];
                      return (
                        <div key={eventKey} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{eventKey}</h4>
                            <p className="text-sm text-muted-foreground">
                              {eventConfig?.success_count || 0} sucessos, {eventConfig?.error_count || 0} erros
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={eventConfig?.enabled || false}
                              onCheckedChange={(enabled) => 
                                updateWebhookEvent(config.id, eventKey, { enabled })
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testWebhookEvent(config.id, eventKey)}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="webhooks" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-green-700 mb-2">🔄 Webhooks Bidirecionais</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Envio de Eventos</span>
                          <Badge variant={config.webhook_send_url ? 'default' : 'secondary'}>
                            {config.webhook_send_url ? 'Configurado' : 'Não configurado'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Recebimento de Dados</span>
                          <Badge variant={config.webhook_receive_url ? 'default' : 'secondary'}>
                            {config.webhook_receive_url ? 'Configurado' : 'Não configurado'}
                          </Badge>
                        </div>
                        {config.webhook_send_url && (
                          <p className="text-xs text-muted-foreground break-all">
                            📤 {config.webhook_send_url}
                          </p>
                        )}
                        {config.webhook_receive_url && (
                          <p className="text-xs text-muted-foreground break-all">
                            📥 {config.webhook_receive_url}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-blue-700 mb-2">📱 Gestão de Instâncias</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Criação de Conexão</span>
                          <Badge variant={config.webhook_create_connection ? 'default' : 'secondary'}>
                            {config.webhook_create_connection ? 'Configurado' : 'Não configurado'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Delete de Instância</span>
                          <Badge variant={config.webhook_delete_instance ? 'default' : 'secondary'}>
                            {config.webhook_delete_instance ? 'Configurado' : 'Não configurado'}
                          </Badge>
                        </div>
                        {config.webhook_create_connection && (
                          <p className="text-xs text-muted-foreground break-all">
                            ➕ {config.webhook_create_connection}
                          </p>
                        )}
                        {config.webhook_delete_instance && (
                          <p className="text-xs text-muted-foreground break-all">
                            🗑️ {config.webhook_delete_instance}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium text-purple-700 mb-2">🤖 Chatbot</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Processamento Chatbot</span>
                          <Badge variant={config.webhook_chatbot ? 'default' : 'secondary'}>
                            {config.webhook_chatbot ? 'Configurado' : 'Não configurado'}
                          </Badge>
                        </div>
                        {config.webhook_chatbot && (
                          <p className="text-xs text-muted-foreground break-all">
                            🤖 {config.webhook_chatbot}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stats">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{config.workflow_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Workflows</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{config.total_executions || 0}</div>
                      <div className="text-sm text-muted-foreground">Execuções</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{(config.success_rate || 100).toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <Activity className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-sm text-muted-foreground">Status</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {configurations.length === 0 && !showNewConfig && (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma configuração n8n</h3>
            <p className="text-muted-foreground mb-4">
              Configure uma instância n8n para começar a usar automações
            </p>
            <Button onClick={() => setShowNewConfig(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Configuração
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}