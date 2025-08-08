import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/error-handler';

export interface EvolutionApiInstance {
  id: string;
  instance_name: string;
  status: string; // Permitir qualquer string do banco
  qr_code?: string;
  numero?: string;
  profile_name?: string;
  profile_picture_url?: string;
  empresa_id: string;
  webhook_url?: string;
  webhook_events: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
  last_connected_at?: string;
}

export interface EvolutionApiGlobalConfig {
  id: string;
  server_url: string;
  api_key: string;
  webhook_base_url?: string;
  ativo: boolean;
}

export interface MessagePayload {
  number: string;
  text?: string;
  media?: string;
  caption?: string;
  filename?: string;
  buttons?: Array<{ id: string; text: string }>;
  sections?: Array<{ title: string; options: Array<{ id: string; title: string; description?: string }> }>;
}

/**
 * Serviço unificado para gerenciar conexões WhatsApp via Evolution API
 */
export class WhatsAppEvolutionApiService {
  private globalConfig: EvolutionApiGlobalConfig | null = null;

  constructor() {
    this.loadGlobalConfig();
  }

  /**
   * Carrega a configuração global da Evolution API
   */
  async loadGlobalConfig(): Promise<EvolutionApiGlobalConfig | null> {
    try {
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      this.globalConfig = data[0] || null;
      return this.globalConfig;
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'loadGlobalConfig'
      });
      return null;
    }
  }

  /**
   * Verifica se o serviço está configurado e disponível
   */
  isConfigured(): boolean {
    return Boolean(this.globalConfig?.server_url && this.globalConfig?.api_key);
  }

  /**
   * Testa a conexão com a Evolution API
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.globalConfig) {
      await this.loadGlobalConfig();
    }

    if (!this.isConfigured()) {
      return { success: false, error: 'Configuração da Evolution API não encontrada' };
    }

    try {
      const response = await fetch(`${this.globalConfig!.server_url}/manager/findInstance`, {
        method: 'GET',
        headers: {
          'apikey': this.globalConfig!.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro de conexão';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Faz uma requisição para a Evolution API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Evolution API não configurada');
    }

    const url = `${this.globalConfig!.server_url}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.globalConfig!.api_key,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Evolution API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Busca todas as instâncias do usuário
   */
  async fetchUserInstances(empresaId: string): Promise<EvolutionApiInstance[]> {
    try {
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'fetchUserInstances'
      });
      return [];
    }
  }

  /**
   * Cria uma nova instância WhatsApp
   */
  async createInstance(data: {
    instanceName: string;
    empresaId: string;
    description?: string;
  }): Promise<EvolutionApiInstance> {
    try {
      // Webhook URL padrão para o sistema
      const webhookUrl = 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1/whatsapp-webhook-evolution';
      
      // Criar instância na Evolution API
      const evolutionResponse = await this.makeRequest('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName: data.instanceName,
          token: data.instanceName,
          qrcode: true,
          webhook: webhookUrl,
          webhookByEvents: true,
          events: [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE'
          ]
        })
      });

      // Salvar no banco de dados
      const { data: instanceData, error } = await supabase
        .from('evolution_api_config')
        .insert({
          instance_name: data.instanceName,
          empresa_id: data.empresaId,
          descricao: data.description || `Instância ${data.instanceName}`,
          webhook_url: webhookUrl,
          webhook_events: [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED', 
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'SEND_MESSAGE'
          ],
          status: 'disconnected',
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      return instanceData;
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'createInstance'
      });
      throw error;
    }
  }

  /**
   * Conecta uma instância (gera QR Code)
   */
  async connectInstance(instanceName: string): Promise<any> {
    try {
      const result = await this.makeRequest(`/instance/connect/${instanceName}`, {
        method: 'GET'
      });
      
      // Atualizar status local imediatamente para 'connecting'
      await this.updateInstanceStatus(instanceName, {
        status: 'connecting'
      });
      
      return result;
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'connectInstance'
      });
      throw error;
    }
  }

  /**
   * Desconecta uma instância
   */
  async disconnectInstance(instanceName: string): Promise<any> {
    try {
      return await this.makeRequest(`/instance/logout/${instanceName}`, {
        method: 'DELETE'
      });
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'disconnectInstance'
      });
      throw error;
    }
  }

  /**
   * Verifica o status de conexão de uma instância
   */
  async getConnectionState(instanceName: string): Promise<any> {
    try {
      return await this.makeRequest(`/instance/connectionState/${instanceName}`, {
        method: 'GET'
      });
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'getConnectionState'
      });
      throw error;
    }
  }

  /**
   * Remove uma instância completamente
   */
  async deleteInstance(instanceName: string): Promise<boolean> {
    try {
      // Tentar remover na Evolution API, mas prosseguir mesmo em caso de erro/404
      try {
        await this.makeRequest(`/instance/delete/${instanceName}`, {
          method: 'DELETE'
        });
      } catch (err) {
        // Ignorar erros da Evolution (ex.: 404 Not Found / instância inexistente)
        // A remoção local deve prosseguir para manter consistência do sistema
      }

      // Remover do banco de dados (sempre)
      const { error } = await supabase
        .from('evolution_api_config')
        .delete()
        .eq('instance_name', instanceName);

      if (error) throw error;

      return true;
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'deleteInstance'
      });
      throw error;
    }
  }

  /**
   * Envia uma mensagem de texto
   */
  async sendText(instanceName: string, payload: MessagePayload): Promise<any> {
    try {
      return await this.makeRequest(`/message/sendText/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number: payload.number,
          text: payload.text,
          delay: 1000
        })
      });
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'sendText'
      });
      throw error;
    }
  }

  /**
   * Envia uma mensagem com mídia
   */
  async sendMedia(instanceName: string, payload: MessagePayload): Promise<any> {
    try {
      return await this.makeRequest(`/message/sendMedia/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number: payload.number,
          media: payload.media,
          caption: payload.caption,
          filename: payload.filename
        })
      });
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'sendMedia'
      });
      throw error;
    }
  }

  /**
   * Envia uma mensagem com botões
   */
  async sendButtons(instanceName: string, payload: MessagePayload): Promise<any> {
    try {
      return await this.makeRequest(`/message/sendButtons/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number: payload.number,
          text: payload.text,
          buttons: payload.buttons?.map(btn => ({
            buttonId: btn.id,
            buttonText: { displayText: btn.text },
            type: 1
          }))
        })
      });
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'sendButtons'
      });
      throw error;
    }
  }

  /**
   * Envia uma mensagem com lista
   */
  async sendList(instanceName: string, payload: MessagePayload): Promise<any> {
    try {
      return await this.makeRequest(`/message/sendList/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number: payload.number,
          text: payload.text,
          buttonText: 'Ver opções',
          sections: payload.sections?.map(section => ({
            title: section.title,
            rows: section.options.map(option => ({
              rowId: option.id,
              title: option.title,
              description: option.description || ''
            }))
          }))
        })
      });
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'sendList'
      });
      throw error;
    }
  }

  /**
   * Atualiza o status de uma instância no banco de dados
   */
  async updateInstanceStatus(instanceName: string, updates: Partial<EvolutionApiInstance>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('evolution_api_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      if (error) throw error;

      return true;
    } catch (error) {
      handleError(error, {
        component: 'WhatsAppEvolutionApiService',
        action: 'updateInstanceStatus'
      });
      return false;
    }
  }
}

// Instância singleton do serviço
export const whatsAppService = new WhatsAppEvolutionApiService();