import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, TestTube, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface N8nWebhookConfig {
  messages_webhook: string;
  instances_webhook: string;
  chatbot_webhook: string;
  enabled: boolean;
}

export function SimplifiedN8nConfig() {
  const [config, setConfig] = useState<N8nWebhookConfig>({
    messages_webhook: '',
    instances_webhook: '',
    chatbot_webhook: '',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) return;

      const { data } = await supabase
        .from('n8n_configurations')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('status', 'active')
        .single();

      if (data) {
        setConfig({
          messages_webhook: data.webhook_send_url || '',
          instances_webhook: data.webhook_create_connection || '',
          chatbot_webhook: data.webhook_chatbot || '',
          enabled: data.status === 'active'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) throw new Error('Empresa não encontrada');

      const configData = {
        empresa_id: profile.empresa_id,
        instance_url: 'https://app.n8n.cloud',
        webhook_send_url: config.messages_webhook,
        webhook_receive_url: config.messages_webhook,
        webhook_create_connection: config.instances_webhook,
        webhook_delete_instance: config.instances_webhook,
        webhook_chatbot: config.chatbot_webhook,
        status: config.enabled ? 'active' : 'inactive' as const,
        settings: {
          simplified_mode: true,
          webhooks: {
            messages: { url: config.messages_webhook, enabled: !!config.messages_webhook },
            instances: { url: config.instances_webhook, enabled: !!config.instances_webhook },
            chatbot: { url: config.chatbot_webhook, enabled: !!config.chatbot_webhook }
          }
        }
      };

      const { error } = await supabase
        .from('n8n_configurations')
        .upsert(configData);

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "Webhooks n8n configurados com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async (type: 'messages' | 'instances' | 'chatbot') => {
    const webhookUrl = config[`${type}_webhook` as keyof N8nWebhookConfig] as string;
    if (!webhookUrl) return;

    setTesting(type);
    try {
      const testPayload = {
        messages: {
          event_type: 'message.received',
          test: true,
          phone: '5511999999999',
          message: 'Teste de integração n8n',
          timestamp: new Date().toISOString()
        },
        instances: {
          event_type: 'instance.created',
          test: true,
          instance_name: 'test-instance',
          timestamp: new Date().toISOString()
        },
        chatbot: {
          event_type: 'chatbot.interaction',
          test: true,
          phone: '5511999999999',
          flow_id: 'test-flow',
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload[type])
      });

      if (response.ok) {
        toast({
          title: "Webhook testado",
          description: `${type} webhook respondeu com sucesso`,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: `Falha ao testar webhook: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${name} copiado para área de transferência`,
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Integração n8n Simplificada
            <Badge variant={config.enabled ? "default" : "secondary"}>
              {config.enabled ? "Ativo" : "Inativo"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure 3 webhooks únicos: mensagens, instâncias e chatbot. 
            O n8n atuará como middleware processando todas as operações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
            />
            <Label>Habilitar integração n8n</Label>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks Configuration */}
      <div className="grid gap-6">
        {/* Messages Webhook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              Webhook de Mensagens
            </CardTitle>
            <CardDescription>
              Processa envio e recebimento de mensagens WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Webhook n8n</Label>
              <div className="flex gap-2">
                <Input
                  value={config.messages_webhook}
                  onChange={(e) => setConfig(prev => ({ ...prev, messages_webhook: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/messages"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(config.messages_webhook, 'URL de mensagens')}
                  disabled={!config.messages_webhook}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook('messages')}
                  disabled={!config.messages_webhook || testing === 'messages'}
                >
                  {testing === 'messages' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Responsável por:</strong> Receber mensagens do WhatsApp, processar através do n8n, 
                e enviar mensagens via Evolution API.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Instances Webhook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              Webhook de Instâncias
            </CardTitle>
            <CardDescription>
              Processa criação e exclusão de instâncias WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Webhook n8n</Label>
              <div className="flex gap-2">
                <Input
                  value={config.instances_webhook}
                  onChange={(e) => setConfig(prev => ({ ...prev, instances_webhook: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/instances"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(config.instances_webhook, 'URL de instâncias')}
                  disabled={!config.instances_webhook}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook('instances')}
                  disabled={!config.instances_webhook || testing === 'instances'}
                >
                  {testing === 'instances' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Responsável por:</strong> Criar e deletar instâncias WhatsApp na Evolution API 
                através do n8n, retornando status para o sistema.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Chatbot Webhook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              Webhook de Chatbot
            </CardTitle>
            <CardDescription>
              Processa interações e fluxos do chatbot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>URL do Webhook n8n</Label>
              <div className="flex gap-2">
                <Input
                  value={config.chatbot_webhook}
                  onChange={(e) => setConfig(prev => ({ ...prev, chatbot_webhook: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/chatbot"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(config.chatbot_webhook, 'URL de chatbot')}
                  disabled={!config.chatbot_webhook}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook('chatbot')}
                  disabled={!config.chatbot_webhook || testing === 'chatbot'}
                >
                  {testing === 'chatbot' ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Responsável por:</strong> Processar fluxos de chatbot, tomar decisões baseadas 
                em regras de negócio e enviar respostas automatizadas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Salvar Configuração
            </>
          )}
        </Button>
      </div>

      {/* Architecture Info */}
      <Card>
        <CardHeader>
          <CardTitle>Arquitetura Simplificada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800">1. Sistema</h4>
                  <p className="text-blue-600">Envia dados para n8n</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <h4 className="font-semibold text-green-800">2. n8n (Middleware)</h4>
                  <p className="text-green-600">Processa e roteia</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <h4 className="font-semibold text-purple-800">3. Evolution API</h4>
                  <p className="text-purple-600">Executa ações</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Fluxo:</strong> O sistema não processa mais as operações localmente. 
                Tudo é enviado para o n8n que atua como middleware, processando e executando 
                as ações necessárias na Evolution API, retornando os resultados para atualizar 
                o banco de dados e frontend.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}