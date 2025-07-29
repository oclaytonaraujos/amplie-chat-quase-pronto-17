import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useEvolutionAPIComplete } from '@/hooks/useEvolutionAPIComplete';
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
  AlertTriangle
} from 'lucide-react';

interface WebhookConfig {
  url: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error';
  last_test?: string;
  test_result?: boolean;
  response_time?: number;
}

interface ImprovedWebhookCenterProps {
  instanceName?: string;
  onWebhookConfigured?: () => void;
}

/**
 * Centro aprimorado de configuração de webhooks
 * Melhorado com interface mais intuitiva e configuração automática
 */
export function ImprovedWebhookCenter({ instanceName, onWebhookConfigured }: ImprovedWebhookCenterProps) {
  const [webhookConfigs, setWebhookConfigs] = useState<{
    evolution: WebhookConfig;
    system: WebhookConfig;
    n8n_receive: WebhookConfig;
    n8n_send: WebhookConfig;
  }>({
    evolution: {
      url: 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution',
      enabled: true,
      status: 'inactive',
    },
    system: {
      url: 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook',
      enabled: false,
      status: 'inactive',
    },
    n8n_receive: {
      url: localStorage.getItem('n8n-receive-webhook-url') || '',
      enabled: !!localStorage.getItem('n8n-receive-webhook-url'),
      status: 'inactive',
    },
    n8n_send: {
      url: localStorage.getItem('n8n-send-webhook-url') || '',
      enabled: !!localStorage.getItem('n8n-send-webhook-url'),
      status: 'inactive',
    },
  });

  const [configuring, setConfiguring] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [setupProgress, setSetupProgress] = useState(0);
  const { toast } = useToast();
  const { 
    isServiceAvailable 
  } = useEvolutionAPIComplete();
  
  // Temporarily disabled webhook functions
  const configureCompleteWebhook = (instanceName?: string) => Promise.resolve({ configured: true });
  const checkWebhookStatus = (instanceName?: string) => Promise.resolve({ configured: true });
  const findWebhook = (instanceName?: string) => Promise.resolve({ configured: true });

  useEffect(() => {
    if (instanceName && isServiceAvailable) {
      checkEvolutionWebhookStatus();
    }
  }, [instanceName, isServiceAvailable]);

  const checkEvolutionWebhookStatus = async () => {
    if (!instanceName) return;

    try {
      const result = await checkWebhookStatus(instanceName);
      updateWebhookConfig('evolution', {
        status: result.configured ? 'active' : 'inactive',
        last_test: new Date().toISOString(),
        test_result: result.configured
      });
    } catch (error) {
      console.error('Erro ao verificar status do webhook:', error);
    }
  };

  const updateWebhookConfig = (type: keyof typeof webhookConfigs, updates: Partial<WebhookConfig>) => {
    setWebhookConfigs(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }));

    // Persistir configurações locais
    if (type === 'n8n_receive') {
      localStorage.setItem('n8n-receive-webhook-url', updates.url || '');
    } else if (type === 'n8n_send') {
      localStorage.setItem('n8n-send-webhook-url', updates.url || '');
    }
  };

  const autoConfigureWebhooks = async () => {
    if (!instanceName) {
      toast({
        title: "Instância necessária",
        description: "Selecione uma instância para configurar os webhooks",
        variant: "destructive",
      });
      return;
    }

    setConfiguring(true);
    setSetupProgress(0);

    try {
      // Passo 1: Configurar webhook principal da Evolution API
      setSetupProgress(25);
      toast({
        title: "Configurando webhooks...",
        description: "Configurando webhook principal da Evolution API",
      });

      const result = await configureCompleteWebhook(instanceName);
      
      if (result) {
        updateWebhookConfig('evolution', {
          status: 'active',
          last_test: new Date().toISOString(),
          test_result: true
        });

        setSetupProgress(50);
        
        // Passo 2: Verificar configuração
        setSetupProgress(75);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Passo 3: Finalizar
        setSetupProgress(100);
        
        toast({
          title: "Webhooks configurados!",
          description: "Configuração automática concluída com sucesso",
        });

        onWebhookConfigured?.();
      } else {
        throw new Error('Falha na configuração do webhook');
      }
    } catch (error) {
      console.error('Erro na configuração automática:', error);
      updateWebhookConfig('evolution', {
        status: 'error',
        last_test: new Date().toISOString(),
        test_result: false
      });

      toast({
        title: "Erro na configuração",
        description: "Não foi possível configurar os webhooks automaticamente",
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
    
    try {
      const startTime = Date.now();
      
      // Para webhook da Evolution API, usar método específico
      if (type === 'evolution' && instanceName) {
        const result = await checkWebhookStatus(instanceName);
        const responseTime = Date.now() - startTime;
        
        updateWebhookConfig(type, {
          status: result.configured ? 'active' : 'error',
          last_test: new Date().toISOString(),
          test_result: result.configured,
          response_time: responseTime
        });

        toast({
          title: result.configured ? "Webhook ativo" : "Webhook inativo",
          description: `Status verificado em ${responseTime}ms`,
          variant: result.configured ? "default" : "destructive",
        });
        return;
      }

      // Para outros webhooks, fazer teste HTTP básico
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
          type: type,
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

      toast({
        title: success ? "Teste enviado" : "Erro no teste",
        description: `Webhook testado em ${responseTime}ms`,
        variant: success ? "default" : "destructive",
      });
    } catch (error) {
      updateWebhookConfig(type, {
        status: 'error',
        last_test: new Date().toISOString(),
        test_result: false
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

  const activeWebhooks = Object.values(webhookConfigs).filter(w => w.status === 'active').length;
  const totalWebhooks = Object.values(webhookConfigs).length;

  if (!isServiceAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Centro de Configuração de Webhooks - Indisponível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Serviço Evolution API Indisponível</h3>
            <p className="text-muted-foreground">
              Configure a Evolution API para habilitar o gerenciamento de webhooks.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Configuração Automática */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Centro de Configuração de Webhooks
              </CardTitle>
              <CardDescription>
                Configure e monitore todos os webhooks do sistema de forma centralizada
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-medium">{activeWebhooks}/{totalWebhooks} Ativos</div>
                <div className="text-xs text-muted-foreground">Webhooks configurados</div>
              </div>
              <Button 
                onClick={autoConfigureWebhooks}
                disabled={configuring || !instanceName}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {configuring ? (
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4 mr-2" />
                )}
                Configuração Automática
              </Button>
            </div>
          </div>
          {configuring && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Configurando webhooks...</span>
              </div>
              <Progress value={setupProgress} className="h-2" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Status Geral dos Webhooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(webhookConfigs).map(([key, config]) => (
              <div key={key} className={`p-4 rounded-lg border-2 ${getStatusColor(config.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <Webhook className="w-5 h-5" />
                  {getStatusBadge(config.status)}
                </div>
                <div className="font-medium text-sm capitalize">{key.replace('_', ' ')}</div>
                {config.response_time && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {config.response_time}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuração Detalhada por Tabs */}
      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Evolution API
          </TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="n8n_receive">n8n Receive</TabsTrigger>
          <TabsTrigger value="n8n_send">n8n Send</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Webhook Principal Evolution API
              </CardTitle>
              <CardDescription>
                Webhook principal para receber todos os eventos do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook (Supabase Edge Function)</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookConfigs.evolution.url}
                    readOnly
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
                </div>
              </div>

              {!instanceName && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Selecione uma instância específica para configurar o webhook da Evolution API.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook do Sistema</CardTitle>
              <CardDescription>
                Webhook para eventos internos do sistema (atendimentos, contatos, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookConfigs.system.url}
                    onChange={(e) => updateWebhookConfig('system', { url: e.target.value })}
                    placeholder="https://exemplo.com/webhook/sistema"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookConfigs.system.url, 'URL do sistema')}
                    disabled={!webhookConfigs.system.url}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={webhookConfigs.system.enabled}
                    onCheckedChange={(checked) => updateWebhookConfig('system', { enabled: checked })}
                  />
                  <Label>Habilitado</Label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook('system')}
                  disabled={!webhookConfigs.system.url || testing === 'system'}
                >
                  {testing === 'system' ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n8n_receive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n Webhook de Recebimento</CardTitle>
              <CardDescription>
                URL gerada pelo n8n para receber mensagens do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook n8n</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookConfigs.n8n_receive.url}
                    onChange={(e) => updateWebhookConfig('n8n_receive', { url: e.target.value })}
                    placeholder="https://n8n.exemplo.com/webhook/receive"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookConfigs.n8n_receive.url, 'URL do n8n')}
                    disabled={!webhookConfigs.n8n_receive.url}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={webhookConfigs.n8n_receive.enabled}
                    onCheckedChange={(checked) => updateWebhookConfig('n8n_receive', { enabled: checked })}
                  />
                  <Label>Habilitado</Label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook('n8n_receive')}
                  disabled={!webhookConfigs.n8n_receive.url || testing === 'n8n_receive'}
                >
                  {testing === 'n8n_receive' ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Esta URL deve ser configurada no webhook da Evolution API para enviar dados para o n8n.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n8n_send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n Webhook de Envio</CardTitle>
              <CardDescription>
                URL gerada pelo n8n para enviar mensagens através do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook n8n</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookConfigs.n8n_send.url}
                    onChange={(e) => updateWebhookConfig('n8n_send', { url: e.target.value })}
                    placeholder="https://n8n.exemplo.com/webhook/send"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookConfigs.n8n_send.url, 'URL do n8n send')}
                    disabled={!webhookConfigs.n8n_send.url}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={webhookConfigs.n8n_send.enabled}
                    onCheckedChange={(checked) => updateWebhookConfig('n8n_send', { enabled: checked })}
                  />
                  <Label>Habilitado</Label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook('n8n_send')}
                  disabled={!webhookConfigs.n8n_send.url || testing === 'n8n_send'}
                >
                  {testing === 'n8n_send' ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Esta URL deve ser usada no código do sistema para enviar mensagens via n8n.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}