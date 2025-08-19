import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, TestTube, ExternalLink } from 'lucide-react';
import { SyncLoaderSection, SyncLoaderInline } from '@/components/ui/sync-loader';

interface N8nWebhookConfig {
  id?: string;
  empresa_id: string;
  url_envio_mensagens: string;
  url_recebimento_mensagens: string;
  url_configuracao_instancia: string;
  url_boot: string;
  ativo: boolean;
}

export function N8nWebhookConfig() {
  const [config, setConfig] = useState<N8nWebhookConfig>({
    empresa_id: '',
    url_envio_mensagens: '',
    url_recebimento_mensagens: '',
    url_configuracao_instancia: '',
    url_boot: '',
    ativo: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Tentar carregar configuração offline primeiro se disponível
    const offlineConfig = localStorage.getItem('n8n_webhook_config_offline');
    if (offlineConfig) {
      try {
        const parsedConfig = JSON.parse(offlineConfig);
        setConfig(parsedConfig);
        toast({
          title: "Configuração Offline Carregada",
          description: "Usando configuração salva localmente",
        });
      } catch (e) {
        console.warn('Erro ao carregar configuração offline:', e);
      }
    }
    
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      
      // Verificar se Supabase está disponível
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn('Supabase indisponível, usando configuração padrão:', userError);
        // Em modo offline, usar configuração padrão
        setConfig(prev => ({ 
          ...prev, 
          empresa_id: 'offline-mode',
          // Manter valores existentes se já estavam preenchidos
        }));
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Usuário não possui empresa associada');
      }

      // Buscar configuração existente
      const { data: existingConfig, error } = await supabase
        .from('n8n_webhook_config')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existingConfig) {
        setConfig(existingConfig);
      } else {
        setConfig(prev => ({ ...prev, empresa_id: profile.empresa_id }));
      }
    } catch (error: any) {
      console.error('Erro ao carregar configuração:', error);
      
      // Em caso de erro, ainda permitir que o usuário configure URLs
      setConfig(prev => ({ 
        ...prev, 
        empresa_id: prev.empresa_id || 'offline-mode'
      }));
      
      toast({
        title: "Modo Offline",
        description: "Conexão indisponível. Você pode configurar as URLs, mas elas serão salvas apenas localmente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);

      // Verificar se está em modo offline
      if (config.empresa_id === 'offline-mode') {
        // Salvar no localStorage em modo offline
        const configData = {
          empresa_id: config.empresa_id,
          url_envio_mensagens: config.url_envio_mensagens || null,
          url_recebimento_mensagens: config.url_recebimento_mensagens || null,
          url_configuracao_instancia: config.url_configuracao_instancia || null,
          url_boot: config.url_boot || null,
          ativo: config.ativo
        };

        localStorage.setItem('n8n_webhook_config_offline', JSON.stringify(configData));
        
        toast({
          title: "Salvo Localmente",
          description: "Configuração salva no modo offline. Será sincronizada quando a conexão for reestabelecida.",
        });
        return;
      }

      const configData = {
        empresa_id: config.empresa_id,
        url_envio_mensagens: config.url_envio_mensagens || null,
        url_recebimento_mensagens: config.url_recebimento_mensagens || null,
        url_configuracao_instancia: config.url_configuracao_instancia || null,
        url_boot: config.url_boot || null,
        ativo: config.ativo
      };

      const { error } = await supabase
        .from('n8n_webhook_config')
        .upsert(configData, {
          onConflict: 'empresa_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração N8N salva com sucesso",
      });

      // Recarregar configuração
      await loadConfig();
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      
      // Em caso de erro, tentar salvar offline
      try {
        const configData = {
          empresa_id: config.empresa_id,
          url_envio_mensagens: config.url_envio_mensagens || null,
          url_recebimento_mensagens: config.url_recebimento_mensagens || null,
          url_configuracao_instancia: config.url_configuracao_instancia || null,
          url_boot: config.url_boot || null,
          ativo: config.ativo
        };

        localStorage.setItem('n8n_webhook_config_offline', JSON.stringify(configData));
        
        toast({
          title: "Salvo Localmente",
          description: "Não foi possível salvar online. Configuração salva localmente.",
          variant: "destructive",
        });
      } catch (offlineError) {
        toast({
          title: "Erro",
          description: "Erro ao salvar configuração N8N",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async (url: string, type: string) => {
    if (!url) {
      toast({
        title: "Aviso",
        description: "URL não configurada para teste",
        variant: "destructive",
      });
      return;
    }

    try {
      setTesting(type);

      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'amplie-chat-test'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Webhook ${type} testado com sucesso`,
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Erro ao testar webhook:', error);
      toast({
        title: "Erro",
        description: `Erro ao testar webhook ${type}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração N8N</CardTitle>
          <CardDescription>Carregando configurações...</CardDescription>
        </CardHeader>
        <CardContent>
          <SyncLoaderSection text="Carregando configurações N8N..." />
        </CardContent>
      </Card>
    );
  }

  const isOfflineMode = config.empresa_id === 'offline-mode';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Configuração de Webhooks N8N
            {isOfflineMode && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Modo Offline
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Configure as URLs dos webhooks N8N para integração com o sistema
            {isOfflineMode && (
              <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                ⚠️ Sistema em modo offline. As configurações serão salvas localmente e sincronizadas quando a conexão for reestabelecida.
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="ativo" className="text-base font-medium">
                Status da Integração
              </Label>
              <p className="text-sm text-gray-600">
                Ativa ou desativa todas as integrações N8N
              </p>
            </div>
            <Switch
              id="ativo"
              checked={config.ativo}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, ativo: checked }))}
            />
          </div>

          {/* URLs */}
          <div className="grid gap-6">
            {/* URL Envio de Mensagens */}
            <div className="space-y-2">
              <Label htmlFor="url_envio_mensagens">URL para Envio de Mensagens</Label>
              <div className="flex gap-2">
                <Input
                  id="url_envio_mensagens"
                  value={config.url_envio_mensagens}
                  onChange={(e) => setConfig(prev => ({ ...prev, url_envio_mensagens: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/envio-mensagens"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook(config.url_envio_mensagens, 'envio')}
                  disabled={testing === 'envio'}
                >
                  {testing === 'envio' ? (
                    <SyncLoaderInline />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Webhook N8N que receberá as mensagens para envio
              </p>
            </div>

            {/* URL Recebimento de Mensagens */}
            <div className="space-y-2">
              <Label htmlFor="url_recebimento_mensagens">URL para Recebimento de Mensagens</Label>
              <div className="flex gap-2">
                <Input
                  id="url_recebimento_mensagens"
                  value={config.url_recebimento_mensagens}
                  onChange={(e) => setConfig(prev => ({ ...prev, url_recebimento_mensagens: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/recebimento-mensagens"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook(config.url_recebimento_mensagens, 'recebimento')}
                  disabled={testing === 'recebimento'}
                >
                  {testing === 'recebimento' ? (
                    <SyncLoaderInline />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Webhook N8N para processar mensagens recebidas
              </p>
            </div>

            {/* URL Configuração de Instância */}
            <div className="space-y-2">
              <Label htmlFor="url_configuracao_instancia">URL para Configuração de Instância</Label>
              <div className="flex gap-2">
                <Input
                  id="url_configuracao_instancia"
                  value={config.url_configuracao_instancia}
                  onChange={(e) => setConfig(prev => ({ ...prev, url_configuracao_instancia: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/configuracao-instancia"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook(config.url_configuracao_instancia, 'configuracao')}
                  disabled={testing === 'configuracao'}
                >
                  {testing === 'configuracao' ? (
                    <SyncLoaderInline />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Webhook N8N para configuração de instâncias WhatsApp
              </p>
            </div>

            {/* URL Boot */}
            <div className="space-y-2">
              <Label htmlFor="url_boot">URL para Boot</Label>
              <div className="flex gap-2">
                <Input
                  id="url_boot"
                  value={config.url_boot}
                  onChange={(e) => setConfig(prev => ({ ...prev, url_boot: e.target.value }))}
                  placeholder="https://seu-n8n.com/webhook/boot"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testWebhook(config.url_boot, 'boot')}
                  disabled={testing === 'boot'}
                >
                  {testing === 'boot' ? (
                    <SyncLoaderInline />
                  ) : (
                    <TestTube className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Webhook N8N para inicialização do sistema
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => window.open('/n8n-config.json', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Configuração JSON
            </Button>
            
            <Button 
              onClick={saveConfig}
              disabled={saving}
            >
              {saving ? (
                <SyncLoaderInline />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre o JSON de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Manual Técnico JSON</CardTitle>
          <CardDescription>
            Informações sobre o arquivo de configuração JSON disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">📋 Arquivo: /n8n-config.json</p>
              <p className="text-blue-700">
                Contém todas as especificações técnicas para integração com N8N, incluindo 
                validações, transformações de dados e tratamento de erros.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 border rounded-lg">
                <p className="font-medium">🔧 Configurações de Webhook</p>
                <p className="text-gray-600">Métodos, campos esperados e validações</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium">🔄 Transformações de Dados</p>
                <p className="text-gray-600">Sanitização e normalização automática</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium">⚠️ Tratamento de Erros</p>
                <p className="text-gray-600">Políticas de retry e logging</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="font-medium">🛡️ Configurações de Segurança</p>
                <p className="text-gray-600">Autenticação e validação SSL</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}