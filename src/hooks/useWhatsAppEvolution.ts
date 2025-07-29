import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { whatsAppService, EvolutionApiInstance, EvolutionApiGlobalConfig } from '@/services/whatsapp-evolution-api';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface UseWhatsAppEvolutionReturn {
  // Estados
  instances: EvolutionApiInstance[];
  globalConfig: EvolutionApiGlobalConfig | null;
  loading: boolean;
  error: string | null;
  
  // Estados derivados
  isConfigured: boolean;
  connectedInstances: EvolutionApiInstance[];
  hasConnectedInstance: boolean;
  globalStatus: 'connected' | 'disconnected' | 'partial' | 'error';
  
  // Ações
  refreshInstances: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
  createInstance: (data: { instanceName: string; description?: string }) => Promise<EvolutionApiInstance | null>;
  connectInstance: (instanceName: string) => Promise<boolean>;
  disconnectInstance: (instanceName: string) => Promise<boolean>;
  deleteInstance: (instanceName: string) => Promise<boolean>;
  getConnectionState: (instanceName: string) => Promise<any>;
  
  // Mensagens
  sendText: (instanceName: string, number: string, text: string) => Promise<boolean>;
  sendMedia: (instanceName: string, number: string, media: string, caption?: string) => Promise<boolean>;
  sendButtons: (instanceName: string, number: string, text: string, buttons: Array<{ id: string; text: string }>) => Promise<boolean>;
  sendList: (instanceName: string, number: string, text: string, sections: Array<{ title: string; options: Array<{ id: string; title: string; description?: string }> }>) => Promise<boolean>;
}

/**
 * Hook unificado para gerenciar conexões WhatsApp via Evolution API
 */
export function useWhatsAppEvolution(): UseWhatsAppEvolutionReturn {
  const [instances, setInstances] = useState<EvolutionApiInstance[]>([]);
  const [globalConfig, setGlobalConfig] = useState<EvolutionApiGlobalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user, profile } = useAuth();
  const { toast } = useToast();

  // Carregar configuração global
  const loadGlobalConfig = useCallback(async () => {
    try {
      const config = await whatsAppService.loadGlobalConfig();
      setGlobalConfig(config);
      return config;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar configuração';
      setError(errorMessage);
      logger.error('Erro ao carregar configuração global', {
        component: 'useWhatsAppEvolution'
      }, err as Error);
      return null;
    }
  }, []);

  // Carregar instâncias do usuário
  const refreshInstances = useCallback(async () => {
    if (!profile?.empresa_id) return;

    setLoading(true);
    setError(null);

    try {
      const userInstances = await whatsAppService.fetchUserInstances(profile.empresa_id);
      setInstances(userInstances);
      
      logger.info('Instâncias WhatsApp carregadas', {
        component: 'useWhatsAppEvolution',
        metadata: { count: userInstances.length }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar instâncias';
      setError(errorMessage);
      logger.error('Erro ao carregar instâncias', {
        component: 'useWhatsAppEvolution'
      }, err as Error);
    } finally {
      setLoading(false);
    }
  }, [profile?.empresa_id]);

  // Testar conexão com Evolution API
  const testConnection = useCallback(async () => {
    return await whatsAppService.testConnection();
  }, []);

  // Criar nova instância
  const createInstance = useCallback(async (data: { instanceName: string; description?: string }) => {
    if (!profile?.empresa_id) {
      toast({
        title: "Erro",
        description: "Empresa não encontrada",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);
      const newInstance = await whatsAppService.createInstance({
        instanceName: data.instanceName,
        empresaId: profile.empresa_id,
        description: data.description
      });

      await refreshInstances();
      
      toast({
        title: "Sucesso",
        description: `Instância ${data.instanceName} criada com sucesso`
      });

      return newInstance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar instância';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.empresa_id, refreshInstances, toast]);

  // Conectar instância
  const connectInstance = useCallback(async (instanceName: string) => {
    try {
      await whatsAppService.connectInstance(instanceName);
      
      // Atualizar status local
      await whatsAppService.updateInstanceStatus(instanceName, {
        status: 'connecting'
      });
      
      await refreshInstances();
      
      toast({
        title: "Conectando",
        description: `Iniciando conexão da instância ${instanceName}`
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao conectar instância';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [refreshInstances, toast]);

  // Desconectar instância
  const disconnectInstance = useCallback(async (instanceName: string) => {
    try {
      await whatsAppService.disconnectInstance(instanceName);
      
      // Atualizar status local
      await whatsAppService.updateInstanceStatus(instanceName, {
        status: 'disconnected',
        qr_code: null
      });
      
      await refreshInstances();
      
      toast({
        title: "Desconectado",
        description: `Instância ${instanceName} desconectada`
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desconectar instância';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [refreshInstances, toast]);

  // Deletar instância
  const deleteInstance = useCallback(async (instanceName: string) => {
    try {
      await whatsAppService.deleteInstance(instanceName);
      await refreshInstances();
      
      toast({
        title: "Removido",
        description: `Instância ${instanceName} removida com sucesso`
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover instância';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [refreshInstances, toast]);

  // Verificar estado da conexão
  const getConnectionState = useCallback(async (instanceName: string) => {
    try {
      return await whatsAppService.getConnectionState(instanceName);
    } catch (err) {
      logger.error('Erro ao verificar estado da conexão', {
        component: 'useWhatsAppEvolution'
      }, err as Error);
      return null;
    }
  }, []);

  // Enviar mensagem de texto
  const sendText = useCallback(async (instanceName: string, number: string, text: string) => {
    try {
      await whatsAppService.sendText(instanceName, { number, text });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mensagem';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Enviar mídia
  const sendMedia = useCallback(async (instanceName: string, number: string, media: string, caption?: string) => {
    try {
      await whatsAppService.sendMedia(instanceName, { number, media, caption });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar mídia';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Enviar botões
  const sendButtons = useCallback(async (instanceName: string, number: string, text: string, buttons: Array<{ id: string; text: string }>) => {
    try {
      await whatsAppService.sendButtons(instanceName, { number, text, buttons });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar botões';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Enviar lista
  const sendList = useCallback(async (instanceName: string, number: string, text: string, sections: Array<{ title: string; options: Array<{ id: string; title: string; description?: string }> }>) => {
    try {
      await whatsAppService.sendList(instanceName, { number, text, sections });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar lista';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Estados derivados
  const isConfigured = Boolean(globalConfig?.server_url && globalConfig?.api_key);
  const connectedInstances = instances.filter(instance => instance.status === 'open');
  const hasConnectedInstance = connectedInstances.length > 0;
  
  const globalStatus = (() => {
    if (instances.length === 0) return 'disconnected';
    
    const connectedCount = connectedInstances.length;
    const errorCount = instances.filter(i => i.status === 'close' || i.status === 'disconnected').length;
    
    if (errorCount === instances.length) return 'disconnected';
    if (connectedCount === instances.length) return 'connected';
    if (connectedCount > 0) return 'partial';
    
    return 'disconnected';
  })() as 'connected' | 'disconnected' | 'partial' | 'error';

  // Efeitos
  useEffect(() => {
    if (user) {
      loadGlobalConfig();
    }
  }, [user, loadGlobalConfig]);

  useEffect(() => {
    if (profile?.empresa_id && globalConfig) {
      refreshInstances();
    }
  }, [profile?.empresa_id, globalConfig, refreshInstances]);

  // Subscription em tempo real para mudanças nas instâncias
  useEffect(() => {
    if (!profile?.empresa_id) return;

    const channel = supabase
      .channel('evolution_api_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evolution_api_config',
          filter: `empresa_id=eq.${profile.empresa_id}`
        },
        (payload) => {
          logger.info('Instância atualizada via realtime', {
            component: 'useWhatsAppEvolution',
            metadata: { event: payload.eventType, instanceName: (payload.new as any)?.instance_name }
          });
          
          // Atualizar instâncias após pequeno delay
          setTimeout(refreshInstances, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.empresa_id, refreshInstances]);

  return {
    // Estados
    instances,
    globalConfig,
    loading,
    error,
    
    // Estados derivados
    isConfigured,
    connectedInstances,
    hasConnectedInstance,
    globalStatus,
    
    // Ações
    refreshInstances,
    testConnection,
    createInstance,
    connectInstance,
    disconnectInstance,
    deleteInstance,
    getConnectionState,
    
    // Mensagens
    sendText,
    sendMedia,
    sendButtons,
    sendList
  };
}