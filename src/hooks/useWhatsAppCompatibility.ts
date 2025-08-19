/**
 * Hooks de compatibilidade simplificados para n8n
 * Mantém a compatibilidade com código existente
 */
import { useAtendimentoReal } from './useAtendimentoReal';

// Compatibilidade com useWhatsAppConnection
export function useWhatsAppConnection() {
  return {
    connections: [],
    globalStatus: 'connected' as const,
    isLoading: false,
    refreshConnections: () => {},
    updateConnectionStatus: () => {},
    hasActiveConnection: true
  };
}

// Compatibilidade com useEvolutionApiConfig  
export function useEvolutionApiConfig() {
  return {
    config: null,
    isLoading: false,
    isConfigured: true,
    updateConfig: async () => true,
    loadConfig: async () => {}
  };
}

// Compatibilidade com useWhatsAppEvolution
export function useWhatsAppEvolution() {
  return {
    instances: [],
    isLoading: false,
    sendTextMessage: async () => ({ success: true }),
    getInstanceStatus: () => 'connected' as const
  };
}

// Compatibilidade com useWhatsAppManager
export function useWhatsAppManager() {
  return {
    instances: [],
    isLoading: false,
    createInstance: async () => ({ success: true }),
    deleteInstance: async () => true,
    refreshInstances: async () => {}
  };
}

// Compatibilidade com useWhatsAppIntegration
export function useWhatsAppIntegration() {
  return {
    connections: [],
    config: null,
    loading: false,
    sincronizarConexoes: async () => {}
  };
}

// Context compatibility exports  
export function useWhatsAppEvolutionContext() {
  return useWhatsAppEvolution();
}

export function useWhatsAppUnified() {
  return useWhatsAppEvolution();
}