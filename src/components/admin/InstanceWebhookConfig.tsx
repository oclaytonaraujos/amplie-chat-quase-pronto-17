import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
import { supabase } from '@/integrations/supabase/client';
import { 
  Webhook, 
  TestTube, 
  Copy, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Settings,
  Globe,
  MessageSquare,
  Info,
  Wrench,
  Zap,
  Activity,
  Save,
  History,
  Eye,
  Shield
} from 'lucide-react';

interface WebhookConfig {
  url: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  last_test?: string;
  test_result?: boolean;
  response_time?: number;
  events?: string[];
}

interface InstanceWebhookConfigProps {
  instanceName: string;
  instanceId: string;
  onClose?: () => void;
  onConfigurationChange?: () => void;
}

interface WebhookTest {
  id: string;
  timestamp: string;
  type: string;
  status: 'success' | 'error';
  response_time: number;
  response_data?: any;
}

export function InstanceWebhookConfig({ 
  instanceName, 
  instanceId, 
  onClose, 
  onConfigurationChange 
}: InstanceWebhookConfigProps) {
  const [webhookConfigs, setWebhookConfigs] = useState<{
    evolution: WebhookConfig;
    custom: WebhookConfig;
    n8n: WebhookConfig;
  }>({
    evolution: {
      url: `https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution`,
      enabled: true,
      status: 'inactive',
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
    },
    custom: {
      url: '',
      enabled: false,
      status: 'inactive',
      events: []
    },
    n8n: {
      url: '',
      enabled: false,
      status: 'inactive',
      events: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [webhookTests, setWebhookTests] = useState<WebhookTest[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { toast } = useToast();
  const { 
    configureCompleteWebhook, 
    checkWebhookStatus, 
    findWebhook,
    setWebhook,
    isServiceAvailable 
  } = useEvolutionAPIComplete();

  const availableEvents = [
    'APPLICATION_STARTUP',
    'QRCODE_UPDATED',
    'MESSAGES_SET',
    'MESSAGES_UPSERT', 
    'MESSAGES_UPDATE',
    'MESSAGES_DELETE',
    'SEND_MESSAGE',
    'CONTACTS_SET',
    'CONTACTS_UPSERT',
    'CONTACTS_UPDATE',
    'PRESENCE_UPDATE',
    'CHATS_SET',
    'CHATS_UPSERT',
    'CHATS_UPDATE',
    'CHATS_DELETE',
    'GROUPS_UPSERT',
    'GROUP_UPDATE',
    'GROUP_PARTICIPANTS_UPDATE',
    'CONNECTION_UPDATE',
    'CALL',
    'NEW_JWT_TOKEN'
  ];

  useEffect(() => {
    loadInstanceWebhookConfig();
    loadWebhookTests();
  }, [instanceName]);

  const loadInstanceWebhookConfig = async () => {
    setLoading(true);
    try {
      // Carregar configuração da instância do banco
      const { data: configData, error } = await supabase
        .from('evolution_api_config')
        .select('webhook_url, webhook_events')
        .eq('instance_name', instanceName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Verificar status atual do webhook na Evolution API
      if (isServiceAvailable) {
        const webhookStatus = await checkWebhookStatus(instanceName);
        
        setWebhookConfigs(prev => ({
          ...prev,
          evolution: {
            ...prev.evolution,
            status: webhookStatus.configured ? 'active' : 'inactive',
            url: webhookStatus.url || prev.evolution.url,
            events: configData?.webhook_events || prev.evolution.events
          }
        }));
      }

      // Carregar webhooks personalizados salvos
      const customWebhookUrl = localStorage.getItem(`custom-webhook-${instanceName}`);
      const n8nWebhookUrl = localStorage.getItem(`n8n-webhook-${instanceName}`);

      if (customWebhookUrl) {
        setWebhookConfigs(prev => ({
          ...prev,
          custom: { ...prev.custom, url: customWebhookUrl, enabled: true }
        }));
      }

      if (n8nWebhookUrl) {
        setWebhookConfigs(prev => ({
          ...prev,
          n8n: { ...prev.n8n, url: n8nWebhookUrl, enabled: true }
        }));
      }

    } catch (error) {
      console.error('Erro ao carregar configuração de webhook:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração de webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookTests = async () => {
    // Carregar histórico de testes do localStorage (em produção seria do banco)
    const testsKey = `webhook-tests-${instanceName}`;
    const savedTests = localStorage.getItem(testsKey);
    if (savedTests) {
      setWebhookTests(JSON.parse(savedTests));
    }
  };

  const saveWebhookTest = (test: Omit<WebhookTest, 'id'>) => {
    const newTest = { ...test, id: Date.now().toString() };
    const testsKey = `webhook-tests-${instanceName}`;
    const currentTests = [...webhookTests, newTest].slice(-10); // Manter apenas os últimos 10
    setWebhookTests(currentTests);
    localStorage.setItem(testsKey, JSON.stringify(currentTests));
  };

  const updateWebhookConfig = (type: keyof typeof webhookConfigs, updates: Partial<WebhookConfig>) => {
    setWebhookConfigs(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }));

    // Persistir configurações locais
    if (type === 'custom') {
      localStorage.setItem(`custom-webhook-${instanceName}`, updates.url || '');
    } else if (type === 'n8n') {
      localStorage.setItem(`n8n-webhook-${instanceName}`, updates.url || '');
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Salvar configuração no banco de dados
      const { error } = await supabase
        .from('evolution_api_config')
        .update({
          webhook_url: webhookConfigs.evolution.url,
          webhook_events: webhookConfigs.evolution.events,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "Configurações de webhook foram salvas com sucesso",
      });

      onConfigurationChange?.();
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const configureEvolutionWebhook = async () => {
    setConfiguring(true);
    setSetupProgress(0);

    try {
      setSetupProgress(25);
      toast({
        title: "Configurando webhook...",
        description: "Configurando webhook da Evolution API",
      });

      // Configurar webhook com eventos específicos
      const result = await setWebhook(instanceName, {
        url: webhookConfigs.evolution.url,
        events: webhookConfigs.evolution.events || [],
        webhook_by_events: true
      });

      setSetupProgress(75);

      if (result) {
        updateWebhookConfig('evolution', {
          status: 'active',
          last_test: new Date().toISOString(),
          test_result: true
        });

        setSetupProgress(100);
        
        toast({
          title: "Webhook configurado!",
          description: "Webhook da Evolution API configurado com sucesso",
        });

        await saveConfiguration();
      } else {
        throw new Error('Falha na configuração do webhook');
      }
    } catch (error) {
      console.error('Erro na configuração:', error);
      updateWebhookConfig('evolution', {
        status: 'error',
        last_test: new Date().toISOString(),
        test_result: false
      });

      toast({
        title: "Erro na configuração",
        description: "Não foi possível configurar o webhook",
        variant: "destructive",
      });
    } finally {
      setConfiguring(false);
      setTimeout(() => setSetupProgress(0), 2000);
    }
  };

  const testWebhook = async (type: keyof typeof webhookConfigs) => {
    const config = webhookConfigs[type];
    if (!config.url) {
      toast({
        title: "URL necessária",
        description: "Configure uma URL antes de testar",
        variant: "destructive",
      });
      return;
    }

    setTesting(type);
    const startTime = Date.now();
    
    try {
      // Para webhook da Evolution API, usar método específico
      if (type === 'evolution') {
        const result = await checkWebhookStatus(instanceName);
        const responseTime = Date.now() - startTime;
        
        updateWebhookConfig(type, {
          status: result.configured ? 'active' : 'error',
          last_test: new Date().toISOString(),
          test_result: result.configured,
          response_time: responseTime
        });

        saveWebhookTest({
          timestamp: new Date().toISOString(),
          type: 'evolution',
          status: result.configured ? 'success' : 'error',
          response_time: responseTime,
          response_data: result
        });

        toast({
          title: result.configured ? "Webhook ativo" : "Webhook inativo",
          description: `Status verificado em ${responseTime}ms`,
          variant: result.configured ? "default" : "destructive",
        });
        return;
      }

      // Para outros webhooks, fazer teste HTTP
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          instance: instanceName,
          timestamp: new Date().toISOString(),
          type: type,
          data: {
            message: "Teste de webhook",
            from: "sistema"
          }
        }),
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok || response.type === 'opaque';

      updateWebhookConfig(type, {
        status: success ? 'active' : 'error',
        last_test: new Date().toISOString(),
        test_result: success,
        response_time: responseTime
      });

      saveWebhookTest({
        timestamp: new Date().toISOString(),
        type: type,
        status: success ? 'success' : 'error',
        response_time: responseTime
      });

      toast({
        title: success ? "Teste enviado" : "Erro no teste",
        description: `Webhook testado em ${responseTime}ms`,
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      updateWebhookConfig(type, {
        status: 'error',
        last_test: new Date().toISOString(),
        test_result: false
      });

      saveWebhookTest({
        timestamp: new Date().toISOString(),
        type: type,
        status: 'error',
        response_time: responseTime
      });

      toast({
        title: "Erro no teste",
        description: "Não foi possível testar o webhook",
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
      description: `${name} copiado para a área de transferência`,
    });
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'error') => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Inativo</Badge>;
    }
  };

  const getStatusColor = (status: 'active' | 'inactive' | 'error') => {
    switch (status) {
      case 'active': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const activeWebhooks = Object.values(webhookConfigs).filter(w => w.enabled && w.status === 'active').length;
  const totalWebhooks = Object.values(webhookConfigs).filter(w => w.enabled).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando configuração...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuração de Webhooks - {instanceName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure webhooks específicos para esta instância
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-medium">{activeWebhooks}/{totalWebhooks} Ativos</div>
                <div className="text-xs text-muted-foreground">Webhooks configurados</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
              <Button
                onClick={saveConfiguration}
                disabled={saving}
              >
                {saving ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
          {configuring && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Configurando webhook...</span>
              </div>
              <Progress value={setupProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Histórico de Testes */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {webhookTests.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum teste realizado ainda
              </p>
            ) : (
              <div className="space-y-2">
                {webhookTests.map((test) => (
                  <div key={test.id} className={`p-3 rounded border ${test.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {test.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium capitalize">{test.type}</span>
                        <Badge variant="outline">{test.response_time}ms</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(test.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuração Detalhada */}
      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Evolution API
          </TabsTrigger>
          <TabsTrigger value="custom">Webhook Personalizado</TabsTrigger>
          <TabsTrigger value="n8n">n8n Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Webhook Evolution API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookConfigs.evolution.url}
                    onChange={(e) => updateWebhookConfig('evolution', { url: e.target.value })}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookConfigs.evolution.url, 'URL do webhook')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Eventos do Webhook</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <div key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event}
                        checked={webhookConfigs.evolution.events?.includes(event) || false}
                        onChange={(e) => {
                          const currentEvents = webhookConfigs.evolution.events || [];
                          const newEvents = e.target.checked
                            ? [...currentEvents, event]
                            : currentEvents.filter(ev => ev !== event);
                          updateWebhookConfig('evolution', { events: newEvents });
                        }}
                        className="rounded border-border"
                      />
                      <label htmlFor={event} className="text-sm">{event}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(webhookConfigs.evolution.status)}
                    {webhookConfigs.evolution.last_test && (
                      <span className="text-xs text-muted-foreground">
                        Testado: {new Date(webhookConfigs.evolution.last_test).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook('evolution')}
                    disabled={testing === 'evolution'}
                  >
                    {testing === 'evolution' ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={configureEvolutionWebhook}
                    disabled={configuring}
                    size="sm"
                  >
                    {configuring ? (
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wrench className="w-4 h-4 mr-2" />
                    )}
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Personalizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={webhookConfigs.custom.enabled}
                  onCheckedChange={(enabled) => updateWebhookConfig('custom', { enabled })}
                />
                <Label>Habilitar webhook personalizado</Label>
              </div>

              {webhookConfigs.custom.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>URL do Webhook</Label>
                    <Input
                      value={webhookConfigs.custom.url}
                      onChange={(e) => updateWebhookConfig('custom', { url: e.target.value })}
                      placeholder="https://seu-servidor.com/webhook"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(webhookConfigs.custom.status)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('custom')}
                      disabled={testing === 'custom' || !webhookConfigs.custom.url}
                    >
                      {testing === 'custom' ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n8n" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integração n8n</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={webhookConfigs.n8n.enabled}
                  onCheckedChange={(enabled) => updateWebhookConfig('n8n', { enabled })}
                />
                <Label>Habilitar integração com n8n</Label>
              </div>

              {webhookConfigs.n8n.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>URL do Webhook n8n</Label>
                    <Input
                      value={webhookConfigs.n8n.url}
                      onChange={(e) => updateWebhookConfig('n8n', { url: e.target.value })}
                      placeholder="https://seu-n8n.com/webhook/whatsapp"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(webhookConfigs.n8n.status)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook('n8n')}
                      disabled={testing === 'n8n' || !webhookConfigs.n8n.url}
                    >
                      {testing === 'n8n' ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}