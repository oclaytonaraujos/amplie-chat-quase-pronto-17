import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface N8nWebhookConfig {
  id?: string;
  empresa_id: string;
  url_envio_mensagens: string;
  url_recebimento_mensagens: string;
  url_configuracao_instancia: string;
  url_boot: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useN8nWebhookConfig() {
  const [config, setConfig] = useState<N8nWebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obter empresa_id do usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Usuário não possui empresa associada');
      }

      // Buscar configuração da empresa
      const { data, error: configError } = await supabase
        .from('n8n_webhook_config')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .maybeSingle();

      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      setConfig(data);
    } catch (err: any) {
      console.error('Erro ao carregar configuração N8N:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (configData: Partial<N8nWebhookConfig>) => {
    try {
      // Obter empresa_id se não estiver presente
      if (!configData.empresa_id) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', userData.user.id)
          .single();

        if (!profile?.empresa_id) {
          throw new Error('Usuário não possui empresa associada');
        }

        configData.empresa_id = profile.empresa_id;
      }

      const { data, error } = await supabase
        .from('n8n_webhook_config')
        .upsert({
          empresa_id: configData.empresa_id!,
          url_envio_mensagens: configData.url_envio_mensagens || null,
          url_recebimento_mensagens: configData.url_recebimento_mensagens || null,
          url_configuracao_instancia: configData.url_configuracao_instancia || null,
          url_boot: configData.url_boot || null,
          ativo: configData.ativo ?? true
        }, {
          onConflict: 'empresa_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      setConfig(data);
      
      toast({
        title: "Sucesso",
        description: "Configuração N8N salva com sucesso",
      });

      return data;
    } catch (err: any) {
      console.error('Erro ao salvar configuração N8N:', err);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração N8N",
        variant: "destructive",
      });
      throw err;
    }
  };

  const testWebhook = async (url: string, type: string) => {
    if (!url) {
      throw new Error('URL não configurada');
    }

    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'amplie-chat-test',
        type: type
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "Sucesso",
        description: `Webhook ${type} testado com sucesso`,
      });

      return true;
    } catch (err: any) {
      console.error(`Erro ao testar webhook ${type}:`, err);
      toast({
        title: "Erro",
        description: `Erro ao testar webhook ${type}: ${err.message}`,
        variant: "destructive",
      });
      throw err;
    }
  };

  const sendWebhookEvent = async (type: 'envio' | 'recebimento' | 'configuracao' | 'boot', data: any) => {
    if (!config || !config.ativo) {
      console.warn('Configuração N8N não encontrada ou inativa');
      return false;
    }

    let url: string;
    switch (type) {
      case 'envio':
        url = config.url_envio_mensagens;
        break;
      case 'recebimento':
        url = config.url_recebimento_mensagens;
        break;
      case 'configuracao':
        url = config.url_configuracao_instancia;
        break;
      case 'boot':
        url = config.url_boot;
        break;
      default:
        throw new Error('Tipo de webhook inválido');
    }

    if (!url) {
      console.warn(`URL para webhook ${type} não configurada`);
      return false;
    }

    try {
      const payload = {
        type,
        timestamp: new Date().toISOString(),
        source: 'amplie-chat',
        data
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`Webhook ${type} enviado com sucesso`);
      return true;
    } catch (err: any) {
      console.error(`Erro ao enviar webhook ${type}:`, err);
      return false;
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    loadConfig,
    saveConfig,
    testWebhook,
    sendWebhookEvent
  };
}