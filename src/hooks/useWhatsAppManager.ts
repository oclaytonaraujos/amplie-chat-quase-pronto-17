import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface GlobalConfig {
  id: string;
  server_url: string;
  api_key: string;
  webhook_base_url?: string;
  ativo: boolean;
}

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  empresa_id: string;
  status: 'open' | 'close' | 'connecting' | 'qr' | 'disconnected';
  qr_code?: string;
  numero?: string;
  profile_name?: string;
  profile_picture_url?: string;
  webhook_status: 'ativo' | 'inativo' | 'erro';
  ativo: boolean;
  created_at: string;
  updated_at: string;
  last_connected_at?: string;
}

interface ConnectionStats {
  total: number;
  connected: number;
  connecting: number;
  disconnected: number;
  hasActiveConnection: boolean;
}

/**
 * Hook unificado para gerenciar WhatsApp via Evolution API
 * Consolida funcionalidades de conexão, status e monitoramento
 */
export function useWhatsAppManager() {
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<Set<string>>(new Set());
  const [polling, setPolling] = useState(false);
  
  const { toast } = useToast();

  // Carregar configuração global
  const loadGlobalConfig = useCallback(async (): Promise<GlobalConfig | null> => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setGlobalConfig(data);
      return data;
    } catch (error) {
      logger.error('Erro ao carregar configuração global', {}, error as Error);
      return null;
    }
  }, []);

  // Carregar instâncias da empresa do usuário
  const loadInstances = useCallback(async (): Promise<WhatsAppInstance[]> => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select(`
          *,
          empresas!inner(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedInstances: WhatsAppInstance[] = (data || []).map(instance => {
        // Mapear status para os tipos corretos
        let status: WhatsAppInstance['status'] = 'disconnected';
        if (instance.status === 'open') status = 'open';
        else if (instance.status === 'close') status = 'close';
        else if (instance.status === 'connecting') status = 'connecting';
        else if (instance.status === 'qr') status = 'qr';
        
        // Mapear webhook_status para os tipos corretos
        let webhookStatus: WhatsAppInstance['webhook_status'] = 'inativo';
        if (instance.webhook_status === 'ativo') webhookStatus = 'ativo';
        else if (instance.webhook_status === 'erro') webhookStatus = 'erro';

        return {
          id: instance.id,
          instance_name: instance.instance_name,
          empresa_id: instance.empresa_id,
          status,
          qr_code: instance.qr_code,
          numero: instance.numero,
          profile_name: instance.profile_name,
          profile_picture_url: instance.profile_picture_url,
          webhook_status: webhookStatus,
          ativo: instance.ativo ?? true,
          created_at: instance.created_at,
          updated_at: instance.updated_at,
          last_connected_at: instance.last_connected_at,
        };
      });

      setInstances(mappedInstances);
      return mappedInstances;
    } catch (error) {
      logger.error('Erro ao carregar instâncias', {}, error as Error);
      return [];
    }
  }, []);

  // Fazer requisição para Evolution API
  const makeApiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    if (!globalConfig) {
      throw new Error('Configuração global Evolution API não encontrada');
    }

    const url = `${globalConfig.server_url}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Evolution API Error: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: Evolution API não respondeu em 15 segundos');
      }
      throw error;
    }
  }, [globalConfig]);

  // Verificar status de uma instância específica
  const checkInstanceStatus = useCallback(async (instanceName: string): Promise<void> => {
    try {
      const response = await makeApiRequest(`/instance/connectionState/${instanceName}`);
      
      if (response?.instance) {
        const currentState = response.instance.state;
        const qrCode = response.instance.qrcode;
        const profileName = response.instance.profileName;
        const ownerJid = response.instance.ownerJid;
        const profilePictureUrl = response.instance.profilePictureUrl;

        const updateData: any = {
          status: currentState,
          connection_state: currentState,
          updated_at: new Date().toISOString(),
        };

        // Conectado - limpar QR e salvar dados do perfil
        if (currentState === 'open') {
          updateData.qr_code = null;
          updateData.last_connected_at = new Date().toISOString();
          
          if (profileName) updateData.profile_name = profileName;
          if (profilePictureUrl) updateData.profile_picture_url = profilePictureUrl;
          if (ownerJid) updateData.numero = ownerJid.split('@')[0];
        } 
        // Desconectado - limpar dados
        else if (currentState === 'close') {
          updateData.qr_code = null;
        }
        // Conectando - preservar QR code se houver
        else if (qrCode) {
          updateData.qr_code = qrCode.startsWith('data:image/') ? qrCode : `data:image/png;base64,${qrCode}`;
        }

        // Atualizar no banco
        await supabase
          .from('evolution_api_config')
          .update(updateData)
          .eq('instance_name', instanceName);

        // Atualizar estado local
        setInstances(prev => prev.map(instance => 
          instance.instance_name === instanceName 
            ? { 
                ...instance, 
                status: currentState,
                qr_code: updateData.qr_code,
                numero: updateData.numero || instance.numero,
                profile_name: updateData.profile_name || instance.profile_name,
                profile_picture_url: updateData.profile_picture_url || instance.profile_picture_url,
                last_connected_at: updateData.last_connected_at || instance.last_connected_at,
                updated_at: updateData.updated_at
              }
            : instance
        ));

        logger.info('Status da instância atualizado', {
          component: 'useWhatsAppManager',
          metadata: { instanceName, status: currentState }
        });
      }
    } catch (error) {
      logger.error(`Erro ao verificar status da instância ${instanceName}`, {}, error as Error);
      
      // Marcar como erro no estado local
      setInstances(prev => prev.map(instance => 
        instance.instance_name === instanceName 
          ? { ...instance, status: 'disconnected' as const }
          : instance
      ));
    }
  }, [makeApiRequest]);

  // Conectar instância
  const connectInstance = useCallback(async (instanceName: string): Promise<boolean> => {
    setConnecting(prev => new Set(prev).add(instanceName));
    
    try {
      await makeApiRequest(`/instance/connect/${instanceName}`, {
        method: 'POST'
      });

      // Atualizar status para conectando
      await supabase
        .from('evolution_api_config')
        .update({ 
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      // Verificar status após conectar
      setTimeout(() => checkInstanceStatus(instanceName), 2000);

      toast({
        title: "Conectando",
        description: `Iniciando conexão da instância ${instanceName}`,
      });

      return true;
    } catch (error) {
      logger.error('Erro ao conectar instância', {}, error as Error);
      toast({
        title: "Erro ao conectar",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    } finally {
      setConnecting(prev => {
        const newSet = new Set(prev);
        newSet.delete(instanceName);
        return newSet;
      });
    }
  }, [makeApiRequest, checkInstanceStatus, toast]);

  // Desconectar instância
  const disconnectInstance = useCallback(async (instanceName: string): Promise<boolean> => {
    try {
      await makeApiRequest(`/instance/logout/${instanceName}`, {
        method: 'DELETE'
      });

      await supabase
        .from('evolution_api_config')
        .update({ 
          status: 'close',
          qr_code: null,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      await loadInstances();

      toast({
        title: "Desconectado",
        description: `Instância ${instanceName} desconectada`,
      });

      return true;
    } catch (error) {
      logger.error('Erro ao desconectar instância', {}, error as Error);
      toast({
        title: "Erro ao desconectar",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  }, [makeApiRequest, loadInstances, toast]);

  // Deletar instância
  const deleteInstance = useCallback(async (instanceName: string): Promise<boolean> => {
    try {
      // Tentar deletar da Evolution API (pode falhar se não existir)
      try {
        await makeApiRequest(`/instance/delete/${instanceName}`, {
          method: 'DELETE'
        });
      } catch (evolutionError) {
        // Continuar mesmo se não conseguir deletar da Evolution API
        logger.warn('Instância não encontrada na Evolution API, removendo apenas do banco', {
          metadata: { instanceName }
        });
      }

      // Sempre deletar do banco
      const { error } = await supabase
        .from('evolution_api_config')
        .delete()
        .eq('instance_name', instanceName);

      if (error) throw error;

      await loadInstances();

      toast({
        title: "Instância deletada",
        description: `Instância ${instanceName} removida com sucesso`,
      });

      return true;
    } catch (error) {
      logger.error('Erro ao deletar instância', {}, error as Error);
      toast({
        title: "Erro ao deletar",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  }, [makeApiRequest, loadInstances, toast]);

  // Enviar mensagem de texto
  const sendTextMessage = useCallback(async (
    instanceName: string, 
    number: string, 
    message: string
  ): Promise<boolean> => {
    try {
      await makeApiRequest(`/message/sendText/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number: number.replace(/\D/g, ''),
          text: message
        })
      });

      return true;
    } catch (error) {
      logger.error('Erro ao enviar mensagem', {}, error as Error);
      toast({
        title: "Erro ao enviar mensagem",
        description: (error as Error).message,
        variant: "destructive",
      });
      return false;
    }
  }, [makeApiRequest, toast]);

  // Polling para atualizar status das instâncias
  const startPolling = useCallback(() => {
    if (polling || instances.length === 0) return;

    setPolling(true);
    const pollInterval = setInterval(async () => {
      for (const instance of instances) {
        if (instance.ativo) {
          await checkInstanceStatus(instance.instance_name);
          // Pequeno delay entre verificações para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }, 30000); // Verificar a cada 30 segundos

    // Cleanup function será retornada pelo useEffect
    return () => {
      clearInterval(pollInterval);
      setPolling(false);
    };
  }, [instances, checkInstanceStatus, polling]);

  // Calcular estatísticas
  const stats: ConnectionStats = {
    total: instances.length,
    connected: instances.filter(i => i.status === 'open').length,
    connecting: instances.filter(i => i.status === 'connecting').length,
    disconnected: instances.filter(i => i.status === 'close' || i.status === 'disconnected').length,
    hasActiveConnection: instances.some(i => i.status === 'open' && i.ativo)
  };

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await loadGlobalConfig();
      await loadInstances();
      setLoading(false);
    };

    initializeData();
  }, [loadGlobalConfig, loadInstances]);

  // Iniciar polling quando houver instâncias
  useEffect(() => {
    if (!loading && instances.length > 0) {
      return startPolling();
    }
  }, [loading, instances.length, startPolling]);

  // Subscription em tempo real para mudanças
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp_instances_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evolution_api_config'
        },
        (payload) => {
          const updatedInstance = payload.new as any;
          setInstances(prev => prev.map(instance => 
            instance.id === updatedInstance.id 
              ? { ...instance, ...updatedInstance }
              : instance
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    // Estado
    globalConfig,
    instances,
    loading,
    connecting,
    stats,
    
    // Verificações
    isConfigured: !!globalConfig,
    isServiceAvailable: !!globalConfig?.server_url && !!globalConfig?.api_key,
    
    // Ações principais
    connectInstance,
    disconnectInstance,
    deleteInstance,
    checkInstanceStatus,
    sendTextMessage,
    
    // Ações de configuração
    loadGlobalConfig,
    loadInstances,
    refreshAll: async () => {
      await loadGlobalConfig();
      await loadInstances();
    },
    
    // Utilidades
    getInstanceByName: (name: string) => instances.find(i => i.instance_name === name),
    getActiveInstances: () => instances.filter(i => i.ativo && i.status === 'open'),
    makeApiRequest
  };
}