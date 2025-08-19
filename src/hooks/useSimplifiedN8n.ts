import { useState, useEffect } from 'react';
import { SimplifiedN8nService, WebhookType, N8nWebhookConfig } from '@/services/SimplifiedN8nService';
import { useSupabaseProfile } from '@/hooks/useSupabaseProfile';

export function useSimplifiedN8n() {
  const [config, setConfig] = useState<N8nWebhookConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useSupabaseProfile();

  const loadConfig = async () => {
    if (!profile?.empresa_id) return;
    
    try {
      setLoading(true);
      const data = await SimplifiedN8nService.getWebhookConfig(profile.empresa_id);
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configuração N8N:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWebhook = async (webhookType: WebhookType, url: string) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    
    try {
      setLoading(true);
      const data = await SimplifiedN8nService.setWebhookUrl(profile.empresa_id, webhookType, url);
      setConfig(data);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (webhookType: WebhookType) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    
    try {
      setLoading(true);
      return await SimplifiedN8nService.testWebhook(profile.empresa_id, webhookType);
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return SimplifiedN8nService.sendMessage(messageData, profile.empresa_id);
  };

  const receiveMessage = async (messageData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return SimplifiedN8nService.receiveMessage(messageData, profile.empresa_id);
  };

  const sendInstanceOperation = async (instanceData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return SimplifiedN8nService.sendInstanceOperation(instanceData, profile.empresa_id);
  };

  const sendChatbotOperation = async (chatbotData: any) => {
    if (!profile?.empresa_id) throw new Error('Usuário não autenticado');
    return SimplifiedN8nService.sendChatbotOperation(chatbotData, profile.empresa_id);
  };

  useEffect(() => {
    loadConfig();
  }, [profile?.empresa_id]);

  return {
    config,
    loading,
    updateWebhook,
    testWebhook,
    sendMessage,
    receiveMessage,
    sendInstanceOperation,
    sendChatbotOperation,
    reload: loadConfig
  };
}