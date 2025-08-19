import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
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
  Info,
  Wrench,
  Activity,
  Save
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

export function InstanceWebhookConfig({ 
  instanceName, 
  instanceId, 
  onClose, 
  onConfigurationChange 
}: InstanceWebhookConfigProps) {
  const [webhookConfigs, setWebhookConfigs] = useState<{
    n8n: WebhookConfig;
    custom: WebhookConfig;
  }>({
    n8n: {
      url: '',
      enabled: true,
      status: 'inactive',
      events: []
    },
    custom: {
      url: '',
      enabled: false,
      status: 'inactive',
      events: []
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadInstanceWebhookConfig();
  }, [instanceName]);

  const loadInstanceWebhookConfig = async () => {
    setLoading(true);
    try {
      // Carregar configuração da instância do banco
      const { data: configData, error } = await supabase
        .from('evolution_api_config')
        .select('webhook_url')
        .eq('instance_name', instanceName)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Carregar webhooks salvos
      const n8nWebhookUrl = localStorage.getItem(`n8n-webhook-${instanceName}`);
      const customWebhookUrl = localStorage.getItem(`custom-webhook-${instanceName}`);

      if (n8nWebhookUrl) {
        setWebhookConfigs(prev => ({
          ...prev,
          n8n: { ...prev.n8n, url: n8nWebhookUrl, enabled: true }
        }));
      }

      if (customWebhookUrl) {
        setWebhookConfigs(prev => ({
          ...prev,
          custom: { ...prev.custom, url: customWebhookUrl, enabled: true }
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

  const updateWebhookConfig = (type: keyof typeof webhookConfigs, updates: Partial<WebhookConfig>) => {
    setWebhookConfigs(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates }
    }));

    // Persistir configurações locais
    if (type === 'n8n') {
      localStorage.setItem(`n8n-webhook-${instanceName}`, updates.url || '');
    } else if (type === 'custom') {
      localStorage.setItem(`custom-webhook-${instanceName}`, updates.url || '');
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('evolution_api_config')
        .update({
          webhook_url: webhookConfigs.n8n.url || webhookConfigs.custom.url,
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
                Configuração de Webhooks n8n - {instanceName}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure webhooks n8n para esta instância
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={saveConfiguration}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Configuração de Webhooks */}
      <Tabs defaultValue="n8n" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="n8n" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            n8n Webhook
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Webhook Personalizado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="n8n" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Webhook className="w-5 h-5" />
                  n8n Webhook
                </div>
                {getStatusBadge(webhookConfigs.n8n.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="n8n-url">URL do Webhook n8n</Label>
                <div className="flex gap-2">
                  <Input
                    id="n8n-url"
                    placeholder="https://sua-instancia-n8n.com/webhook/..."
                    value={webhookConfigs.n8n.url}
                    onChange={(e) => updateWebhookConfig('n8n', { url: e.target.value })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookConfigs.n8n.url, 'URL do n8n')}
                    disabled={!webhookConfigs.n8n.url}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testWebhook('n8n')}
                  disabled={!webhookConfigs.n8n.url || testing === 'n8n'}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testing === 'n8n' ? 'Testando...' : 'Testar Webhook'}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure um workflow n8n com um trigger Webhook para receber eventos desta instância.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Webhook Personalizado
                </div>
                {getStatusBadge(webhookConfigs.custom.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-url">URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-url"
                    placeholder="https://sua-aplicacao.com/webhook"
                    value={webhookConfigs.custom.url}
                    onChange={(e) => updateWebhookConfig('custom', { url: e.target.value })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookConfigs.custom.url, 'URL personalizada')}
                    disabled={!webhookConfigs.custom.url}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => testWebhook('custom')}
                  disabled={!webhookConfigs.custom.url || testing === 'custom'}
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  {testing === 'custom' ? 'Testando...' : 'Testar Webhook'}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure seu endpoint para receber requisições POST com os dados dos eventos.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}