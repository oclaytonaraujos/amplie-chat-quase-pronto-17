import { supabase } from '@/integrations/supabase/client';

export type WebhookType = 'send_messages' | 'receive_messages' | 'instances' | 'chatbot';

export interface N8nWebhookConfig {
  id?: string;
  send_messages_webhook_url?: string;
  receive_messages_webhook_url?: string;
  instances_webhook_url?: string;
  chatbot_webhook_url?: string;
  empresa_id: string;
  created_at?: string;
  updated_at?: string;
}

export class SimplifiedN8nService {
  static async sendToN8n(webhookType: WebhookType, data: any, empresaId: string) {
    try {
      const config = await this.getWebhookConfig(empresaId);
      const webhookUrl = this.getWebhookUrl(config, webhookType);
      
      if (!webhookUrl) {
        throw new Error(`Webhook ${webhookType} não configurado`);
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Type': webhookType,
          'X-Company-Id': empresaId
        },
        body: JSON.stringify({
          type: webhookType,
          data,
          empresa_id: empresaId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook retornou: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao enviar para N8N [${webhookType}]:`, error);
      throw error;
    }
  }

  static async setWebhookUrl(empresaId: string, webhookType: WebhookType, url: string) {
    const { data, error } = await supabase
      .from('n8n_webhook_configs')
      .upsert({
        empresa_id: empresaId,
        [`${webhookType}_webhook_url`]: url,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'empresa_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getWebhookConfig(empresaId: string): Promise<N8nWebhookConfig | null> {
    const { data, error } = await supabase
      .from('n8n_webhook_configs')
      .select('*')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async testWebhook(empresaId: string, webhookType: WebhookType): Promise<boolean> {
    try {
      const testData = {
        test: true,
        webhook_type: webhookType,
        timestamp: new Date().toISOString()
      };

      await this.sendToN8n(webhookType, testData, empresaId);
      return true;
    } catch (error) {
      console.error(`Teste do webhook ${webhookType} falhou:`, error);
      return false;
    }
  }

  // Métodos específicos para cada tipo de webhook
  static async sendMessage(data: any, empresaId: string) {
    return this.sendToN8n('send_messages', data, empresaId);
  }

  static async receiveMessage(data: any, empresaId: string) {
    return this.sendToN8n('receive_messages', data, empresaId);
  }

  static async sendInstanceOperation(data: any, empresaId: string) {
    return this.sendToN8n('instances', data, empresaId);
  }

  static async sendChatbotOperation(data: any, empresaId: string) {
    return this.sendToN8n('chatbot', data, empresaId);
  }

  private static getWebhookUrl(config: N8nWebhookConfig | null, type: WebhookType): string | null {
    if (!config) return null;
    
    switch (type) {
      case 'send_messages':
        return config.send_messages_webhook_url || null;
      case 'receive_messages':
        return config.receive_messages_webhook_url || null;
      case 'instances':
        return config.instances_webhook_url || null;
      case 'chatbot':
        return config.chatbot_webhook_url || null;
      default:
        return null;
    }
  }
}