import { supabase } from '@/integrations/supabase/client';

interface WebhookPayload {
  event_type: string;
  timestamp: string;
  empresa_id: string;
  data: any;
  source: 'ampliechat';
}

class SimplifiedN8nServiceClass {
  private static instance: SimplifiedN8nServiceClass;

  private constructor() {}

  static getInstance(): SimplifiedN8nServiceClass {
    if (!SimplifiedN8nServiceClass.instance) {
      SimplifiedN8nServiceClass.instance = new SimplifiedN8nServiceClass();
    }
    return SimplifiedN8nServiceClass.instance;
  }

  private async getWebhookConfig(empresaId: string) {
    const { data, error } = await supabase
      .from('n8n_configurations')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Erro ao buscar configuração n8n:', error);
      return null;
    }

    return data;
  }

  private async sendToWebhook(webhookUrl: string, payload: WebhookPayload): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      return false;
    }
  }

  // MENSAGENS - Webhook único para envio e recebimento
  async sendMessage(empresaId: string, data: {
    phone: string;
    message: string;
    type?: 'text' | 'image' | 'document' | 'audio';
    mediaUrl?: string;
    filename?: string;
    caption?: string;
  }): Promise<boolean> {
    const config = await this.getWebhookConfig(empresaId);
    if (!config?.webhook_send_url) {
      console.warn('Webhook de mensagens não configurado');
      return false;
    }

    const payload: WebhookPayload = {
      event_type: 'message.send',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      data,
      source: 'ampliechat'
    };

    return this.sendToWebhook(config.webhook_send_url, payload);
  }

  async processReceivedMessage(empresaId: string, data: {
    phone: string;
    message: string;
    messageId: string;
    timestamp: string;
    type?: string;
    mediaUrl?: string;
  }): Promise<boolean> {
    const config = await this.getWebhookConfig(empresaId);
    if (!config?.webhook_receive_url) {
      console.warn('Webhook de mensagens não configurado');
      return false;
    }

    const payload: WebhookPayload = {
      event_type: 'message.received',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      data,
      source: 'ampliechat'
    };

    return this.sendToWebhook(config.webhook_receive_url, payload);
  }

  // INSTÂNCIAS - Webhook único para criação e exclusão
  async createInstance(empresaId: string, data: {
    instanceName: string;
    webhook?: string;
    settings?: any;
  }): Promise<boolean> {
    const config = await this.getWebhookConfig(empresaId);
    if (!config?.webhook_create_connection) {
      console.warn('Webhook de instâncias não configurado');
      return false;
    }

    const payload: WebhookPayload = {
      event_type: 'instance.create',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      data,
      source: 'ampliechat'
    };

    return this.sendToWebhook(config.webhook_create_connection, payload);
  }

  async deleteInstance(empresaId: string, data: {
    instanceName: string;
  }): Promise<boolean> {
    const config = await this.getWebhookConfig(empresaId);
    if (!config?.webhook_delete_instance) {
      console.warn('Webhook de instâncias não configurado');
      return false;
    }

    const payload: WebhookPayload = {
      event_type: 'instance.delete',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      data,
      source: 'ampliechat'
    };

    return this.sendToWebhook(config.webhook_delete_instance, payload);
  }

  // CHATBOT - Webhook único para fluxos de chatbot
  async processChatbotInteraction(empresaId: string, data: {
    phone: string;
    message: string;
    flowId?: string;
    currentStage?: string;
    userInput?: string;
    sessionData?: any;
  }): Promise<boolean> {
    const config = await this.getWebhookConfig(empresaId);
    if (!config?.webhook_chatbot) {
      console.warn('Webhook de chatbot não configurado');
      return false;
    }

    const payload: WebhookPayload = {
      event_type: 'chatbot.interaction',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      data,
      source: 'ampliechat'
    };

    return this.sendToWebhook(config.webhook_chatbot, payload);
  }

  async startChatbotFlow(empresaId: string, data: {
    phone: string;
    flowId: string;
    triggerType: 'manual' | 'automatic' | 'keyword';
    triggerValue?: string;
  }): Promise<boolean> {
    const config = await this.getWebhookConfig(empresaId);
    if (!config?.webhook_chatbot) {
      console.warn('Webhook de chatbot não configurado');
      return false;
    }

    const payload: WebhookPayload = {
      event_type: 'chatbot.start',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      data,
      source: 'ampliechat'
    };

    return this.sendToWebhook(config.webhook_chatbot, payload);
  }

  // SISTEMA - Eventos gerais do sistema
  async sendSystemEvent(empresaId: string, eventType: string, data: any): Promise<boolean> {
    // Para eventos do sistema, usar o webhook de mensagens como fallback
    const config = await this.getWebhookConfig(empresaId);
    if (!config?.webhook_send_url) {
      console.warn('Nenhum webhook configurado para eventos do sistema');
      return false;
    }

    const payload: WebhookPayload = {
      event_type: `system.${eventType}`,
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      data,
      source: 'ampliechat'
    };

    return this.sendToWebhook(config.webhook_send_url, payload);
  }
}

export const SimplifiedN8nService = SimplifiedN8nServiceClass.getInstance();