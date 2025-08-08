import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface EvolutionApiGlobalConfig {
  id: string;
  api_key: string;
  server_url: string;
  webhook_base_url?: string;
  ativo: boolean;
}

interface EvolutionApiInstance {
  id: string;
  instance_name: string;
  empresa_id: string;
  status: 'open' | 'close' | 'connecting' | 'qr' | 'disconnected';
  qr_code?: string;
  numero?: string;
  profile_name?: string;
  webhook_url?: string;
  webhook_status: 'ativo' | 'inativo' | 'erro';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  last_connected_at?: string;
}

export function useEvolutionApi() {
  const [globalConfig, setGlobalConfig] = useState<EvolutionApiGlobalConfig | null>(null);
  const [instances, setInstances] = useState<EvolutionApiInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string[]>([]);
  const { toast } = useToast();

  // Carregar configuração global
  const loadGlobalConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setGlobalConfig(data);
      return data;
    } catch (error) {
      logger.error('Erro ao carregar configuração global Evolution API', {}, error as Error);
      return null;
    }
  }, []);

  // Carregar instâncias
  const loadInstances = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select(`
          *,
          empresas!inner(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedInstances = (data || []).map(instance => ({
        id: instance.id,
        instance_name: instance.instance_name,
        empresa_id: instance.empresa_id,
        status: instance.status as any || 'disconnected',
        qr_code: instance.qr_code,
        numero: instance.numero,
        profile_name: instance.profile_name,
        webhook_url: instance.webhook_url,
        webhook_status: instance.webhook_status as any || 'inativo',
        ativo: instance.ativo,
        created_at: instance.created_at,
        updated_at: instance.updated_at,
        last_connected_at: instance.last_connected_at,
        empresa_nome: instance.empresas?.nome
      }));

      setInstances(mappedInstances);
      return mappedInstances;
    } catch (error) {
      logger.error('Erro ao carregar instâncias Evolution API', {}, error as Error);
      return [];
    }
  }, []);

  // Fazer requisição para Evolution API
  const makeApiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!globalConfig) {
      throw new Error('Configuração global não encontrada');
    }

    const url = `${globalConfig.server_url}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': globalConfig.api_key,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [globalConfig]);

  // Obter status da instância
  const getInstanceStatus = useCallback(async (instanceName: string) => {
    try {
      const response = await makeApiRequest(`/instance/connectionState/${instanceName}`);
      return response;
    } catch (error) {
      logger.error('Erro ao obter status da instância', {}, error as Error);
      throw error;
    }
  }, [makeApiRequest]);

  // Conectar instância
  const connectInstance = useCallback(async (instanceName: string) => {
    try {
      setConnecting(prev => [...prev, instanceName]);

      const response = await makeApiRequest(`/instance/connect/${instanceName}`);

      // Atualizar status no banco
      await supabase
        .from('evolution_api_config')
        .update({ 
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      await loadInstances();

      toast({
        title: "Conectando instância",
        description: `Iniciando conexão da instância ${instanceName}`,
      });

      return response;
    } catch (error) {
      logger.error('Erro ao conectar instância', {}, error as Error);
      toast({
        title: "Erro ao conectar",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setConnecting(prev => prev.filter(name => name !== instanceName));
    }
  }, [makeApiRequest, loadInstances, toast]);

  // Deletar instância
  const deleteInstance = useCallback(async (instanceName: string) => {
    try {
      let evolutionError: Error | null = null;

      // Tentar deletar da Evolution API, mas seguir com a remoção local mesmo em caso de erro/404
      try {
        await makeApiRequest(`/instance/delete/${instanceName}`, {
          method: 'DELETE'
        });
      } catch (err) {
        evolutionError = err as Error;
        logger.warn?.(
          'Evolution API: instância não encontrada ou erro ao deletar. Prosseguindo com exclusão local',
          { metadata: { instanceName } },
          evolutionError
        );
      }

      // Deletar do banco SEMPRE
      const { error: dbError } = await supabase
        .from('evolution_api_config')
        .delete()
        .eq('instance_name', instanceName);

      if (dbError) throw dbError;

      await loadInstances();

      toast({
        title: "Instância excluída",
        description: evolutionError
          ? `Instância removida localmente. Não encontrada na Evolution (${instanceName}).`
          : `Instância ${instanceName} excluída com sucesso`,
      });
    } catch (error) {
      logger.error('Erro ao deletar instância localmente', { metadata: { instanceName } }, error as Error);
      toast({
        title: "Erro ao excluir instância",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  }, [makeApiRequest, loadInstances, toast]);

  // Enviar mensagem de texto
  const sendTextMessage = useCallback(async (number: string, message: string) => {
    try {
      if (!globalConfig) {
        throw new Error('Configuração global não encontrada');
      }

      // Buscar primeira instância ativa
      const activeInstance = instances.find(inst => inst.status === 'open' && inst.ativo);
      if (!activeInstance) {
        throw new Error('Nenhuma instância WhatsApp conectada');
      }

      const response = await makeApiRequest(`/message/sendText/${activeInstance.instance_name}`, {
        method: 'POST',
        body: JSON.stringify({
          number: number.replace(/\D/g, ''),
          text: message
        })
      });

      return true;
    } catch (error) {
      logger.error('Erro ao enviar mensagem de texto', {}, error as Error);
      toast({
        title: "Erro ao enviar mensagem",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  }, [globalConfig, instances, makeApiRequest, toast]);

  // Enviar mídia
  const sendMediaMessage = useCallback(async (number: string, mediaUrl: string, type: 'image' | 'audio' | 'document') => {
    try {
      if (!globalConfig) {
        throw new Error('Configuração global não encontrada');
      }

      // Buscar primeira instância ativa
      const activeInstance = instances.find(inst => inst.status === 'open' && inst.ativo);
      if (!activeInstance) {
        throw new Error('Nenhuma instância WhatsApp conectada');
      }

      const response = await makeApiRequest(`/message/sendMedia/${activeInstance.instance_name}`, {
        method: 'POST',
        body: JSON.stringify({
          number: number.replace(/\D/g, ''),
          mediatype: type,
          media: mediaUrl
        })
      });

      return true;
    } catch (error) {
      logger.error('Erro ao enviar mídia', {}, error as Error);
      toast({
        title: "Erro ao enviar mídia",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  }, [globalConfig, instances, makeApiRequest, toast]);

  // Atualizar status da instância
  const updateInstanceStatus = useCallback(async (instanceName?: string) => {
    try {
      if (instanceName) {
        // Atualizar instância específica
        const status = await getInstanceStatus(instanceName);
        
        // Atualizar no banco
        await supabase
          .from('evolution_api_config')
          .update({ 
            status: status.instance?.state || 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('instance_name', instanceName);

        await loadInstances();
        return status;
      } else {
        // Atualizar todas as instâncias
        for (const instance of instances) {
          try {
            const status = await getInstanceStatus(instance.instance_name);
            
            await supabase
              .from('evolution_api_config')
              .update({ 
                status: status.instance?.state || 'disconnected',
                updated_at: new Date().toISOString()
              })
              .eq('instance_name', instance.instance_name);
          } catch (error) {
            logger.error(`Erro ao atualizar instância ${instance.instance_name}`, {}, error as Error);
          }
        }
        
        await loadInstances();
      }
    } catch (error) {
      logger.error('Erro ao atualizar status da instância', {}, error as Error);
      throw error;
    }
  }, [getInstanceStatus, loadInstances, instances]);

  // Status geral das conexões
  const connectedInstances = instances.filter(inst => inst.status === 'open');
  const status = {
    connected: connectedInstances.length,
    total: instances.length,
    hasActiveConnection: instances.some(inst => inst.status === 'open' && inst.ativo),
    state: connectedInstances.length > 0 ? 'connected' : 'disconnected',
    lastCheck: new Date()
  };

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await loadGlobalConfig();
      await loadInstances();
      setLoading(false);
    };

    loadInitialData();
  }, [loadGlobalConfig, loadInstances]);

  return {
    globalConfig,
    instances,
    loading,
    connecting,
    status,
    isServiceAvailable: !!globalConfig,
    connectInstance,
    deleteInstance,
    getInstanceStatus,
    sendTextMessage,
    sendMediaMessage,
    updateInstanceStatus,
    refreshData: async () => {
      await loadGlobalConfig();
      await loadInstances();
    }
  };
}