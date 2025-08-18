import { useState, useEffect, useCallback } from 'react';
import { WhatsAppService, type WhatsAppInstance, type WhatsAppMessage } from '@/services/WhatsAppService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface UseWhatsAppState {
  instances: WhatsAppInstance[];
  globalConfig: any;
  isLoading: boolean;
  isConfigured: boolean;
  hasConnectedInstances: boolean;
}

interface UseWhatsAppActions {
  // Configuration
  updateGlobalConfig: (config: {
    server_url: string;
    api_key: string;
    webhook_base_url?: string;
  }) => Promise<boolean>;
  
  // Instance management
  createInstance: (instanceName: string, webhook?: string) => Promise<any>;
  deleteInstance: (instanceName: string) => Promise<boolean>;
  connectInstance: (instanceName: string) => Promise<any>;
  refreshInstances: () => Promise<void>;
  
  // Message sending
  sendMessage: (message: WhatsAppMessage) => Promise<any>;
  
  // Utilities
  getInstance: (instanceName: string) => WhatsAppInstance | undefined;
  getInstancesByStatus: (status: WhatsAppInstance['status']) => WhatsAppInstance[];
}

export function useWhatsApp(): UseWhatsAppState & UseWhatsAppActions {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<UseWhatsAppState>({
    instances: [],
    globalConfig: null,
    isLoading: true,
    isConfigured: false,
    hasConnectedInstances: false
  });

  // Get user's company ID
  const getEmpresaId = useCallback(async () => {
    if (!user) return null;
    
    const { data } = await import('@/integrations/supabase/client').then(m => 
      m.supabase.from('profiles').select('empresa_id').eq('id', user.id).single()
    );
    
    return data?.empresa_id || null;
  }, [user]);

  // Update state when instances change
  const updateState = useCallback((instances: WhatsAppInstance[]) => {
    setState(prev => ({
      ...prev,
      instances,
      hasConnectedInstances: instances.some(i => i.status === 'connected'),
      isLoading: false
    }));
  }, []);

  // Initialize and subscribe to instance updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = WhatsAppService.subscribe(updateState);

    // Load initial data
    const loadInitialData = async () => {
      try {
        const empresaId = await getEmpresaId();
        
        // Load global config
        const config = await WhatsAppService.loadGlobalConfig();
        
        setState(prev => ({
          ...prev,
          globalConfig: config,
          isConfigured: Boolean(config?.server_url && config?.api_key)
        }));

        // Load instances for user's company
        if (empresaId) {
          await WhatsAppService.loadInstances(empresaId);
        }
      } catch (error) {
        logger.error('Erro ao carregar dados iniciais WhatsApp', {
          component: 'useWhatsApp'
        }, error as Error);
        
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadInitialData();

    return unsubscribe;
  }, [user, getEmpresaId, updateState]);

  // Actions
  const updateGlobalConfig = useCallback(async (config: {
    server_url: string;
    api_key: string;
    webhook_base_url?: string;
  }): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await WhatsAppService.updateGlobalConfig(config);
      
      setState(prev => ({
        ...prev,
        globalConfig: result,
        isConfigured: true,
        isLoading: false
      }));

      toast({
        title: "Configuração salva",
        description: "Evolution API configurada com sucesso!",
      });

      return true;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Erro na configuração",
        description: error instanceof Error ? error.message : "Erro ao configurar Evolution API",
        variant: "destructive",
      });

      return false;
    }
  }, [toast]);

  const createInstance = useCallback(async (instanceName: string, webhook?: string) => {
    try {
      const empresaId = await getEmpresaId();
      if (!empresaId) throw new Error('Empresa não encontrada');

      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await WhatsAppService.createInstance({
        instanceName,
        empresaId,
        webhook
      });

      toast({
        title: "Instância criada",
        description: `Instância ${instanceName} criada com sucesso!`,
      });

      return result;
    } catch (error) {
      toast({
        title: "Erro ao criar instância",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [getEmpresaId, toast]);

  const deleteInstance = useCallback(async (instanceName: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await WhatsAppService.deleteInstance(instanceName);

      toast({
        title: "Instância removida",
        description: `Instância ${instanceName} removida com sucesso!`,
      });

      return result;
    } catch (error) {
      toast({
        title: "Erro ao remover instância",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  const connectInstance = useCallback(async (instanceName: string) => {
    try {
      const result = await WhatsAppService.connectInstance(instanceName);

      toast({
        title: "Conectando instância",
        description: `Iniciando conexão da instância ${instanceName}...`,
      });

      return result;
    } catch (error) {
      toast({
        title: "Erro ao conectar instância",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  const refreshInstances = useCallback(async () => {
    try {
      const empresaId = await getEmpresaId();
      if (empresaId) {
        await WhatsAppService.loadInstances(empresaId);
      }
    } catch (error) {
      logger.error('Erro ao atualizar instâncias', {
        component: 'useWhatsApp'
      }, error as Error);
    }
  }, [getEmpresaId]);

  const sendMessage = useCallback(async (message: WhatsAppMessage) => {
    try {
      const result = await WhatsAppService.sendMessage(message);

      toast({
        title: "Mensagem enviada",
        description: `Mensagem enviada para ${message.number}`,
      });

      return result;
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  // Utilities
  const getInstance = useCallback((instanceName: string) => {
    return state.instances.find(i => i.instanceName === instanceName);
  }, [state.instances]);

  const getInstancesByStatus = useCallback((status: WhatsAppInstance['status']) => {
    return state.instances.filter(i => i.status === status);
  }, [state.instances]);

  return {
    // State
    ...state,
    
    // Actions
    updateGlobalConfig,
    createInstance,
    deleteInstance,
    connectInstance,
    refreshInstances,
    sendMessage,
    
    // Utilities
    getInstance,
    getInstancesByStatus
  };
}