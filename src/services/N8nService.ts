import { supabase } from '@/integrations/supabase/client';
import { SystemWebhookEvents, WebhookEventKey } from '@/types/n8n-webhooks';

class N8nServiceClass {
  private static instance: N8nServiceClass;

  private constructor() {}

  static getInstance(): N8nServiceClass {
    if (!N8nServiceClass.instance) {
      N8nServiceClass.instance = new N8nServiceClass();
    }
    return N8nServiceClass.instance;
  }

  async sendEventToN8n<T extends WebhookEventKey>(
    eventType: T,
    payload: SystemWebhookEvents[T],
    empresaId: string
  ): Promise<boolean> {
    try {
      // Buscar configurações n8n ativas para a empresa
      const { data: configs, error } = await supabase
        .from('n8n_configurations')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao buscar configurações n8n:', error);
        return false;
      }

      if (!configs || configs.length === 0) {
        console.log('Nenhuma configuração n8n ativa encontrada para a empresa:', empresaId);
        return true; // Não é erro se não houver config
      }

      let success = true;

      // Enviar para todas as configurações ativas
      for (const config of configs) {
        const settings = config.settings as any;
        const eventConfig = settings?.events?.[eventType];
        
        // Verificar se o evento está habilitado
        if (!eventConfig?.enabled) {
          console.log(`Evento ${eventType} não habilitado para configuração ${config.id}`);
          continue;
        }

        const webhookUrl = eventConfig.webhook_url || config.webhook_send_url;
        
        if (!webhookUrl) {
          console.warn(`URL de webhook não configurada para evento ${eventType} na configuração ${config.id}`);
          continue;
        }

        try {
          // Enviar para n8n via edge function
          const { error: sendError } = await supabase.functions.invoke('n8n-webhook-send', {
            body: {
              event_type: eventType,
              payload,
              webhook_url: webhookUrl,
              empresa_id: empresaId
            }
          });

          if (sendError) {
            console.error(`Erro ao enviar evento ${eventType} para n8n:`, sendError);
            success = false;
          }

          // Atualizar contadores de evento
          await this.updateEventCounters(config.id, eventType, !sendError);

        } catch (error) {
          console.error(`Erro ao processar evento ${eventType} para configuração ${config.id}:`, error);
          success = false;
        }
      }

      return success;
    } catch (error) {
      console.error('Erro geral ao enviar evento para n8n:', error);
      return false;
    }
  }

  private async updateEventCounters(
    configId: string, 
    eventType: WebhookEventKey, 
    success: boolean
  ): Promise<void> {
    try {
      const { data: config, error: fetchError } = await supabase
        .from('n8n_configurations')
        .select('settings')
        .eq('id', configId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar configuração para atualizar contadores:', fetchError);
        return;
      }

      const currentSettings = config.settings as any || { events: {} };
      const eventSettings = currentSettings.events?.[eventType] || { success_count: 0, error_count: 0 };

      const updatedSettings = {
        ...currentSettings,
        events: {
          ...currentSettings.events,
          [eventType]: {
            ...eventSettings,
            success_count: success ? (eventSettings.success_count || 0) + 1 : (eventSettings.success_count || 0),
            error_count: !success ? (eventSettings.error_count || 0) + 1 : (eventSettings.error_count || 0),
            last_triggered: new Date().toISOString()
          }
        }
      };

      await supabase
        .from('n8n_configurations')
        .update({ settings: updatedSettings })
        .eq('id', configId);

    } catch (error) {
      console.error('Erro ao atualizar contadores de evento:', error);
    }
  }

  // Métodos de conveniência para eventos específicos
  async sendMessageReceived(
    conversaId: string,
    contato: { id: string; nome: string; telefone: string },
    mensagem: { id: string; conteudo: string; tipo: string; metadata?: any },
    empresaId: string
  ): Promise<boolean> {
    return this.sendEventToN8n('mensagem.recebida', {
      conversa_id: conversaId,
      contato,
      mensagem,
      timestamp: new Date().toISOString()
    }, empresaId);
  }

  async sendServiceStarted(
    conversaId: string,
    contato: { id: string; nome: string; telefone: string; email?: string },
    agente: { id: string; nome: string; email: string },
    setor: string,
    empresaId: string
  ): Promise<boolean> {
    return this.sendEventToN8n('atendimento.iniciado', {
      conversa_id: conversaId,
      contato,
      agente,
      setor,
      timestamp: new Date().toISOString()
    }, empresaId);
  }

  async sendServiceFinished(
    conversaId: string,
    contato: { id: string; nome: string; telefone: string },
    agente: { id: string; nome: string; email: string },
    duracaoMinutos: number,
    statusFinal: string,
    empresaId: string
  ): Promise<boolean> {
    return this.sendEventToN8n('atendimento.finalizado', {
      conversa_id: conversaId,
      contato,
      agente,
      duracao_minutos: duracaoMinutos,
      status_final: statusFinal,
      timestamp: new Date().toISOString()
    }, empresaId);
  }

  async sendServiceTransferred(
    conversaId: string,
    contato: { id: string; nome: string; telefone: string },
    deAgente: { id: string; nome: string },
    paraAgente: { id: string; nome: string },
    setorOrigem: string,
    setorDestino: string,
    motivo: string,
    empresaId: string
  ): Promise<boolean> {
    return this.sendEventToN8n('atendimento.transferido', {
      conversa_id: conversaId,
      contato,
      de_agente: deAgente,
      para_agente: paraAgente,
      setor_origem: setorOrigem,
      setor_destino: setorDestino,
      motivo,
      timestamp: new Date().toISOString()
    }, empresaId);
  }

  async sendContactCreated(
    contato: { id: string; nome: string; telefone?: string; email?: string; empresa?: string; tags?: string[] },
    criadoPor: { id: string; nome: string },
    empresaId: string
  ): Promise<boolean> {
    return this.sendEventToN8n('contato.criado', {
      contato,
      criado_por: criadoPor,
      timestamp: new Date().toISOString()
    }, empresaId);
  }
}

export const N8nService = N8nServiceClass.getInstance();