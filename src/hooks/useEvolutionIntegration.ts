
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EvolutionGlobalConfig {
  id?: string;
  server_url: string;
  api_key: string;
  ativo: boolean;
  webhook_base_url?: string;
}

interface EvolutionInstance {
  id: string;
  instance_name: string;
  status: string;
  numero?: string;
  qr_code?: string;
  ativo: boolean;
  empresa_nome?: string;
  descricao?: string;
  webhook_url?: string;
  webhook_events?: string[];
}

export function useEvolutionIntegration() {
  const [config, setConfig] = useState<EvolutionGlobalConfig>({
    server_url: '',
    api_key: '',
    ativo: false
  });
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const { toast } = useToast();

  const loadGlobalConfig = useCallback(async () => {
    try {
      console.log('🔄 Carregando configuração global da Evolution API...');
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar configuração global:', error);
        throw error;
      }

      if (data) {
        console.log('✅ Configuração global carregada:', { 
          id: data.id, 
          server_url: data.server_url,
          ativo: data.ativo 
        });
        
        const configData = {
          id: data.id,
          server_url: data.server_url,
          api_key: data.api_key,
          ativo: data.ativo,
          webhook_base_url: data.webhook_base_url
        };
        
        setConfig(configData);
        setConnected(true);
        return configData;
      } else {
        console.warn('⚠️ Nenhuma configuração global ativa encontrada');
        setConnected(false);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configuração global:', error);
      setConnected(false);
    }
    return null;
  }, []);

  const loadInstances = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select(`
          *,
          empresas(nome)
        `)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const instancesData = (data || []).map(item => ({
        id: item.id,
        instance_name: item.instance_name,
        status: item.status || 'disconnected',
        numero: item.numero,
        qr_code: item.qr_code,
        ativo: item.ativo,
        empresa_nome: item.empresas?.nome,
        descricao: item.descricao,
        webhook_url: item.webhook_url,
        webhook_events: item.webhook_events
      }));

      setInstances(instancesData);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
    }
  }, []);

  const saveGlobalConfig = async (configData: Omit<EvolutionGlobalConfig, 'id'>) => {
    try {
      setLoading(true);
      
      // Testar conexão com a API
      const testResponse = await fetch(`${configData.server_url}/manager/findInstance`, {
        method: 'GET',
        headers: {
          'apikey': configData.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error('Não foi possível conectar com a Evolution API');
      }

      // Salvar configuração no banco
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .upsert({
          server_url: configData.server_url,
          api_key: configData.api_key,
          webhook_base_url: configData.webhook_base_url,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setConfig({ ...configData, id: data.id });
      setConnected(true);
      
      toast({
        title: "Configuração salva",
        description: "Evolution API conectada com sucesso!",
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro na configuração",
        description: error.message || "Não foi possível conectar com a Evolution API",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (instanceName: string) => {
    try {
      console.log('Iniciando criação de instância:', instanceName);
      
      // Garantir que a configuração está carregada
      const globalConfig = await loadGlobalConfig();
      if (!globalConfig?.server_url || !globalConfig?.api_key) {
        throw new Error('Configuração global não encontrada. Configure a Evolution API primeiro.');
      }

      // Primeiro, obter dados do usuário logado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Usuário logado:', user?.email);
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter perfil com empresa_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id, cargo')
        .eq('id', user.id)
        .single();

      console.log('Perfil encontrado:', profile);
      
      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError);
        throw new Error('Erro ao buscar perfil do usuário');
      }

      if (!profile || !profile.empresa_id) {
        throw new Error('Perfil sem empresa associada');
      }

      // Criar instância via API seguindo o exemplo exato fornecido
      console.log('Criando instância na Evolution API...');
      const response = await fetch(`${config.server_url}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na Evolution API - Status:', response.status);
        console.error('Erro na Evolution API - Response:', errorText);
        throw new Error(`Erro ao criar instância na Evolution API: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Instância criada na API:', result);

      // Configurar webhook automaticamente
      try {
        const webhookUrl = config.webhook_base_url || 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution';
        
        const webhookResponse = await fetch(`${config.server_url}/webhook/set/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': config.api_key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: webhookUrl,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
          })
        });

        if (webhookResponse.ok) {
          console.log('Webhook configurado com sucesso para:', instanceName);
        } else {
          console.warn('Erro ao configurar webhook:', await webhookResponse.text());
        }
      } catch (webhookError) {
        console.warn('Erro ao configurar webhook:', webhookError);
      }

      // Salvar configuração da instância no banco
      const { error: insertError } = await supabase
        .from('evolution_api_config')
        .insert({
          empresa_id: profile.empresa_id,
          instance_name: instanceName,
          status: 'disconnected',
          ativo: true,
          webhook_url: globalConfig.webhook_base_url,
          webhook_events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
        });

      if (insertError) {
        console.error('Erro ao inserir no banco:', insertError);
        throw new Error(`Erro ao salvar instância no banco: ${insertError.message}`);
      }

      console.log('Instância salva no banco com sucesso');

      toast({
        title: "Instância criada",
        description: `Instância ${instanceName} criada e associada à empresa com sucesso!`,
      });

      await loadInstances();
      return true;
    } catch (error: any) {
      console.error('Erro detalhado ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message || "Não foi possível criar a instância",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteInstance = async (instanceName: string) => {
    try {
      // Garantir que a configuração está carregada
      const globalConfig = await loadGlobalConfig();
      if (!globalConfig?.server_url || !globalConfig?.api_key) {
        throw new Error('Configuração global não encontrada. Configure a Evolution API primeiro.');
      }

      // Deletar instância via API
      const response = await fetch(`${globalConfig.server_url}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': globalConfig.api_key
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar instância na Evolution API');
      }

      // Remover configuração do banco
      const { error } = await supabase
        .from('evolution_api_config')
        .delete()
        .eq('instance_name', instanceName);

      if (error) {
        throw error;
      }

      toast({
        title: "Instância deletada",
        description: `Instância ${instanceName} deletada com sucesso!`,
      });

      await loadInstances();
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar instância:', error);
      toast({
        title: "Erro ao deletar instância",
        description: error.message || "Não foi possível deletar a instância",
        variant: "destructive",
      });
      return false;
    }
  };

  const connectInstance = async (instanceName: string) => {
    try {
      // Garantir que a configuração está carregada
      const globalConfig = await loadGlobalConfig();
      if (!globalConfig?.server_url || !globalConfig?.api_key) {
        throw new Error('Configuração global não encontrada. Configure a Evolution API primeiro.');
      }

      // Conectar instância via API
      const response = await fetch(`${globalConfig.server_url}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': globalConfig.api_key
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao conectar instância na Evolution API');
      }

      const result = await response.json();
      console.log('QR Code Response completa:', result);

      // Extrair QR code da resposta - tentar diferentes campos possíveis
      let qrCodeData = result.base64 || result.qrcode || result.qr || result.qrCode;
      
      // Se o QR code não tem o prefixo data:image, adicionar
      if (qrCodeData && !qrCodeData.startsWith('data:image/')) {
        qrCodeData = `data:image/png;base64,${qrCodeData}`;
      }
      
      console.log('QR Code extraído:', qrCodeData ? 'QR Code encontrado' : 'QR Code não encontrado');
      
      // Atualizar status no banco
      const { error } = await supabase
        .from('evolution_api_config')
        .update({
          status: 'connecting',
          qr_code: qrCodeData
        })
        .eq('instance_name', instanceName);

      if (error) {
        throw error;
      }

      toast({
        title: "QR Code gerado",
        description: `Escaneie o QR Code para conectar a instância ${instanceName}`,
      });

      await loadInstances();
      return true;
    } catch (error: any) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: "Erro ao conectar instância",
        description: error.message || "Não foi possível conectar a instância",
        variant: "destructive",
      });
      return false;
    }
  };

  const logoutInstance = async (instanceName: string) => {
    try {
      // Garantir que a configuração está carregada
      const globalConfig = await loadGlobalConfig();
      if (!globalConfig?.server_url || !globalConfig?.api_key) {
        throw new Error('Configuração global não encontrada. Configure a Evolution API primeiro.');
      }

      // Desconectar instância via API
      const response = await fetch(`${globalConfig.server_url}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': globalConfig.api_key
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao desconectar instância na Evolution API');
      }

      // Atualizar status no banco
      const { error } = await supabase
        .from('evolution_api_config')
        .update({
          status: 'disconnected',
          qr_code: null
        })
        .eq('instance_name', instanceName);

      if (error) {
        throw error;
      }

      toast({
        title: "Instância desconectada",
        description: `Instância ${instanceName} foi desconectada com sucesso!`,
      });

      await loadInstances();
      return true;
    } catch (error: any) {
      console.error('Erro ao desconectar instância:', error);
      toast({
        title: "Erro ao desconectar instância",
        description: error.message || "Não foi possível desconectar a instância",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadGlobalConfig();
      await loadInstances();
      setLoading(false);
    };

    loadData();
  }, [loadGlobalConfig, loadInstances]);

  return {
    config,
    instances,
    loading,
    connected,
    saveGlobalConfig,
    createInstance,
    deleteInstance,
    connectInstance,
    logoutInstance,
    loadInstances
  };
}
