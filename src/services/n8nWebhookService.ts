/**
 * Serviço para integração com N8N Webhooks
 * Middleware que intercepta mensagens do WhatsApp e envia para N8N
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export interface N8nWebhookPayload {
  event_type: 'message_received' | 'message_sent' | 'instance_connected' | 'instance_disconnected';
  timestamp: string;
  empresa_id: string;
  instance_name?: string;
  message?: {
    id: string;
    from: string;
    to: string;
    content: string;
    type: string;
    timestamp: string;
  };
  contact?: {
    phone: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

class N8nWebhookService {
  private static instance: N8nWebhookService;
  
  static getInstance(): N8nWebhookService {
    if (!N8nWebhookService.instance) {
      N8nWebhookService.instance = new N8nWebhookService();
    }
    return N8nWebhookService.instance;
  }

  /**
   * Busca a configuração N8N ativa para uma empresa
   */
  private async getActiveConfig(empresaId: string) {
    try {
      const { data, error } = await supabase
        .from('n8n_webhook_config')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .maybeSingle();

      if (error) {
        logger.error('Erro ao buscar configuração N8N', { component: 'N8nWebhookService' }, error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Erro inesperado ao buscar configuração N8N', { component: 'N8nWebhookService' }, error as Error);
      return null;
    }
  }

  /**
   * Envia webhook para N8N com retry automático
   */
  private async sendWebhook(url: string, payload: N8nWebhookPayload, maxRetries = 3): Promise<boolean> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          logger.info('Webhook N8N enviado com sucesso', { component: 'N8nWebhookService' });
          return true;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        attempt++;
        logger.error(`Tentativa ${attempt} falhou ao enviar webhook N8N`, { component: 'N8nWebhookService' }, error as Error);
        
        if (attempt < maxRetries) {
          // Backoff exponencial: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return false;
  }

  /**
   * Processa mensagem recebida e envia para N8N
   */
  async processIncomingMessage(empresaId: string, messageData: any): Promise<boolean> {
    const config = await this.getActiveConfig(empresaId);
    if (!config?.url_recebimento_mensagens) {
      logger.warn('Configuração N8N não encontrada ou URL de recebimento não configurada', { component: 'N8nWebhookService' });
      return false;
    }

    const payload: N8nWebhookPayload = {
      event_type: 'message_received',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      message: {
        id: messageData.id || '',
        from: messageData.from || messageData.remetente_id || '',
        to: messageData.to || '',
        content: messageData.content || messageData.conteudo || '',
        type: messageData.type || messageData.tipo_mensagem || 'text',
        timestamp: messageData.timestamp || messageData.created_at || new Date().toISOString()
      },
      contact: {
        phone: messageData.contact?.phone || messageData.telefone || '',
        name: messageData.contact?.name || messageData.nome || ''
      },
      metadata: {
        conversa_id: messageData.conversa_id,
        original_data: messageData
      }
    };

    return await this.sendWebhook(config.url_recebimento_mensagens, payload);
  }

  /**
   * Processa mensagem enviada e envia para N8N
   */
  async processOutgoingMessage(empresaId: string, messageData: any): Promise<boolean> {
    const config = await this.getActiveConfig(empresaId);
    if (!config?.url_envio_mensagens) {
      logger.warn('Configuração N8N não encontrada ou URL de envio não configurada', { component: 'N8nWebhookService' });
      return false;
    }

    const payload: N8nWebhookPayload = {
      event_type: 'message_sent',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      message: {
        id: messageData.id || '',
        from: messageData.from || '',
        to: messageData.to || messageData.destinatario || '',
        content: messageData.content || messageData.conteudo || '',
        type: messageData.type || messageData.tipo_mensagem || 'text',
        timestamp: messageData.timestamp || messageData.created_at || new Date().toISOString()
      },
      metadata: {
        conversa_id: messageData.conversa_id,
        agente_id: messageData.agente_id,
        original_data: messageData
      }
    };

    return await this.sendWebhook(config.url_envio_mensagens, payload);
  }

  /**
   * Notifica N8N sobre mudança de status da instância
   */
  async processInstanceStatusChange(empresaId: string, instanceData: any): Promise<boolean> {
    const config = await this.getActiveConfig(empresaId);
    if (!config?.url_configuracao_instancia) {
      logger.warn('Configuração N8N não encontrada ou URL de configuração não configurada', { component: 'N8nWebhookService' });
      return false;
    }

    const payload: N8nWebhookPayload = {
      event_type: instanceData.connected ? 'instance_connected' : 'instance_disconnected',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      instance_name: instanceData.instance_name || instanceData.nome || '',
      metadata: {
        status: instanceData.status,
        qr_code: instanceData.qr_code,
        numero: instanceData.numero,
        original_data: instanceData
      }
    };

    return await this.sendWebhook(config.url_configuracao_instancia, payload);
  }

  /**
   * Notifica N8N sobre boot/inicialização do sistema
   */
  async processSystemBoot(empresaId: string): Promise<boolean> {
    const config = await this.getActiveConfig(empresaId);
    if (!config?.url_boot) {
      logger.warn('Configuração N8N não encontrada ou URL de boot não configurada', { component: 'N8nWebhookService' });
      return false;
    }

    const payload: N8nWebhookPayload = {
      event_type: 'instance_connected',
      timestamp: new Date().toISOString(),
      empresa_id: empresaId,
      metadata: {
        system: 'amplie_chat',
        boot_type: 'system_startup'
      }
    };

    return await this.sendWebhook(config.url_boot, payload);
  }
}

export const n8nWebhookService = N8nWebhookService.getInstance();