/**
 * Hooks de compatibilidade para manter o código existente funcionando
 * durante a transição para a arquitetura simplificada
 */
import { useWhatsApp } from '@/hooks/useWhatsApp';

// Compatibilidade com useWhatsAppConnection
export function useWhatsAppConnection() {
  const { instances, isLoading, refreshInstances } = useWhatsApp();
  
  return {
    connections: instances.map(instance => ({
      instanceName: instance.instanceName,
      status: instance.status,
      lastCheck: new Date(),
      qrCode: instance.qrCode,
      numero: instance.numero
    })),
    globalStatus: instances.length === 0 ? 'disconnected' as const : 
                  instances.every(i => i.status === 'connected') ? 'connected' as const :
                  instances.some(i => i.status === 'connected') ? 'partial' as const : 'disconnected' as const,
    isLoading,
    refreshConnections: refreshInstances,
    updateConnectionStatus: () => {},
    hasActiveConnection: instances.some(i => i.status === 'connected')
  };
}

// Compatibilidade com useEvolutionApiConfig  
export function useEvolutionApiConfig() {
  const { globalConfig, isLoading, isConfigured, updateGlobalConfig } = useWhatsApp();
  
  return {
    config: globalConfig,
    isLoading,
    isConfigured,
    updateConfig: async (newConfig: any) => {
      return await updateGlobalConfig(newConfig);
    },
    loadConfig: async () => {}
  };
}

// Compatibilidade com useWhatsAppEvolution
export function useWhatsAppEvolution() {
  const whatsapp = useWhatsApp();
  
  return {
    ...whatsapp,
    // Legacy methods
    sendTextMessage: whatsapp.sendMessage,
    getInstanceStatus: (instanceName: string) => whatsapp.getInstance(instanceName)?.status || 'disconnected'
  };
}

// Compatibilidade com useWhatsAppManager
export function useWhatsAppManager() {
  return useWhatsApp();
}

// Compatibilidade com useWhatsAppIntegration
export function useWhatsAppIntegration() {
  const { instances, isLoading, refreshInstances } = useWhatsApp();
  
  return {
    connections: instances.map(instance => ({
      id: instance.id,
      nome: instance.instanceName,
      numero: instance.numero || 'N/A',
      status: instance.status === 'connected' ? 'conectado' : 'desconectado',
      ativo: true,
      qr_code: instance.qrCode,
      ultimo_ping: instance.lastConnectedAt
    })),
    config: null, // Legacy field
    loading: isLoading,
    sincronizarConexoes: refreshInstances
  };
}

// Context compatibility exports  
export function useWhatsAppEvolutionContext() {
  return useWhatsAppEvolution();
}

export function useWhatsAppUnified() {
  return useWhatsApp();
}