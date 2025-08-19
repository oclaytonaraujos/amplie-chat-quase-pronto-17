import { supabase } from '@/integrations/supabase/client';

export interface WebhookConfig {
  id?: string;
  empresa_id: string;
  webhook_url: string;
  enabled: boolean;
  events: string[];
  headers?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export class UnifiedWebhookService {
  // Configurar webhook principal
  static async setWebhookConfig(empresaId: string, config: Partial<WebhookConfig>) {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .upsert({
          empresa_id: empresaId,
          nome: 'Webhook Unificado',
          url: config.webhook_url || '',
          eventos: config.events || [],
          ativo: config.enabled || false,
          headers: config.headers || {},
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Mapear para o formato esperado
      return {
        id: data.id,
        empresa_id: data.empresa_id,
        webhook_url: data.url,
        enabled: data.ativo,
        events: data.eventos || [],
        headers: typeof data.headers === 'object' ? data.headers as Record<string, string> : {},
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      throw error;
    }
  }

  // Buscar configuração
  static async getWebhookConfig(empresaId: string): Promise<WebhookConfig | null> {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('nome', 'Webhook Unificado')
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // Mapear para o formato esperado
      return {
        id: data.id,
        empresa_id: data.empresa_id,
        webhook_url: data.url,
        enabled: data.ativo,
        events: data.eventos || [],
        headers: typeof data.headers === 'object' ? data.headers as Record<string, string> : {},
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      return null;
    }
  }

  // Testar webhook
  static async testWebhook(empresaId: string): Promise<boolean> {
    try {
      const config = await this.getWebhookConfig(empresaId);
      if (!config?.webhook_url) {
        throw new Error('Webhook não configurado');
      }

      const testPayload = {
        type: 'test',
        empresa_id: empresaId,
        timestamp: new Date().toISOString(),
        data: { message: 'Teste de conexão webhook' }
      };

      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(testPayload)
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      return false;
    }
  }

  // Enviar evento para webhook
  static async sendWebhookEvent(
    empresaId: string, 
    eventType: string, 
    eventData: any
  ): Promise<boolean> {
    try {
      const config = await this.getWebhookConfig(empresaId);
      if (!config?.webhook_url || !config.enabled) {
        return false;
      }

      // Verificar se o evento está habilitado
      if (config.events && !config.events.includes(eventType)) {
        return false;
      }

      const payload = {
        type: eventType,
        empresa_id: empresaId,
        timestamp: new Date().toISOString(),
        data: eventData
      };

      const response = await fetch(config.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(payload)
      });

      // Log do resultado
      await this.logWebhookDelivery(empresaId, eventType, payload, response.ok);
      
      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      await this.logWebhookDelivery(empresaId, eventType, eventData, false, error.message);
      return false;
    }
  }

  // Log de entrega de webhook
  private static async logWebhookDelivery(
    empresaId: string,
    eventType: string,
    payload: any,
    success: boolean,
    errorMessage?: string
  ) {
    try {
      await supabase
        .from('evolution_api_logs')
        .insert({
          instance_name: 'webhook_unified',
          event_type: eventType,
          success: success,
          error_message: errorMessage || null,
          event_data: {
            payload,
            delivered_at: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Erro ao registrar log de webhook:', error);
    }
  }

  // Métodos para eventos específicos
  static async sendMessageEvent(empresaId: string, messageData: any) {
    return this.sendWebhookEvent(empresaId, 'message', messageData);
  }

  static async sendInstanceEvent(empresaId: string, instanceData: any) {
    return this.sendWebhookEvent(empresaId, 'instance', instanceData);
  }

  static async sendChatbotEvent(empresaId: string, chatbotData: any) {
    return this.sendWebhookEvent(empresaId, 'chatbot', chatbotData);
  }

  static async sendConnectionEvent(empresaId: string, connectionData: any) {
    return this.sendWebhookEvent(empresaId, 'connection', connectionData);
  }

  // Listar logs de entrega
  static async getDeliveryLogs(empresaId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('evolution_api_logs')
        .select('*')
        .eq('instance_name', 'webhook_unified')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Mapear para o formato esperado
      return (data || []).map(log => ({
        event_type: log.event_type,
        success: log.success,
        delivered_at: log.created_at,
        error_message: log.error_message || null,
        payload: typeof log.event_data === 'object' ? log.event_data : {}
      }));
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
    }
  }
}