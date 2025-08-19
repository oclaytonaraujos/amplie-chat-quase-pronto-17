import { useState, useEffect } from 'react';
import { UnifiedWebhookService, WebhookConfig } from '@/services/UnifiedWebhookService';
import { useSupabaseProfile } from '@/hooks/useSupabaseProfile';

export function useUnifiedWebhooks() {
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const { profile } = useSupabaseProfile();

  // Carregar configuração
  const loadConfig = async () => {
    if (!profile?.empresa_id) return;
    
    try {
      setLoading(true);
      const data = await UnifiedWebhookService.getWebhookConfig(profile.empresa_id);
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar configuração
  const updateConfig = async (newConfig: Partial<WebhookConfig>) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    
    try {
      setLoading(true);
      const data = await UnifiedWebhookService.setWebhookConfig(profile.empresa_id, newConfig);
      setConfig(data);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Testar webhook
  const testWebhook = async () => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    
    try {
      setLoading(true);
      const result = await UnifiedWebhookService.testWebhook(profile.empresa_id);
      return result;
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Carregar logs
  const loadLogs = async () => {
    if (!profile?.empresa_id) return;
    
    try {
      const data = await UnifiedWebhookService.getDeliveryLogs(profile.empresa_id);
      setLogs(data);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    }
  };

  // Enviar eventos
  const sendMessageEvent = async (messageData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return UnifiedWebhookService.sendMessageEvent(profile.empresa_id, messageData);
  };

  const sendInstanceEvent = async (instanceData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return UnifiedWebhookService.sendInstanceEvent(profile.empresa_id, instanceData);
  };

  const sendChatbotEvent = async (chatbotData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return UnifiedWebhookService.sendChatbotEvent(profile.empresa_id, chatbotData);
  };

  const sendConnectionEvent = async (connectionData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return UnifiedWebhookService.sendConnectionEvent(profile.empresa_id, connectionData);
  };

  useEffect(() => {
    loadConfig();
  }, [profile?.empresa_id]);

  return {
    config,
    loading,
    logs,
    loadConfig,
    updateConfig,
    testWebhook,
    loadLogs,
    sendMessageEvent,
    sendInstanceEvent,
    sendChatbotEvent,
    sendConnectionEvent
  };
}