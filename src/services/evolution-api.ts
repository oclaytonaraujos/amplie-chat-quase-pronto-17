
import { supabase } from '@/integrations/supabase/client';

export class EvolutionApiGlobalService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async fetchInstances() {
    try {
      const data = await this.makeRequest('/instance/fetchInstances');
      return data;
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      throw error;
    }
  }

  async createInstance(instanceName: string, webhookUrl?: string) {
    try {
      const data = await this.makeRequest('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName,
          token: this.apiKey,
          qrcode: true,
          webhook: webhookUrl,
          webhookByEvents: true,
          events: [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED', 
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'SEND_MESSAGE'
          ]
        })
      });
      return data;
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  async deleteInstance(instanceName: string) {
    try {
      const data = await this.makeRequest(`/instance/delete/${instanceName}`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      throw error;
    }
  }

  async connectInstance(instanceName: string) {
    try {
      const data = await this.makeRequest(`/instance/connect/${instanceName}`);
      return data;
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      throw error;
    }
  }

  async disconnectInstance(instanceName: string) {
    try {
      const data = await this.makeRequest(`/instance/logout/${instanceName}`, {
        method: 'DELETE'
      });
      return data;
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      throw error;
    }
  }

  async getInstanceStatus(instanceName: string) {
    try {
      const data = await this.makeRequest(`/instance/connectionState/${instanceName}`);
      return data;
    } catch (error) {
      console.error('Erro ao obter status da instância:', error);
      throw error;
    }
  }

  async sendMessage(instanceName: string, payload: any) {
    try {
      const data = await this.makeRequest(`/message/sendText/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  async sendMedia(instanceName: string, payload: any) {
    try {
      const data = await this.makeRequest(`/message/sendMedia/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data;
    } catch (error) {
      console.error('Erro ao enviar mídia:', error);
      throw error;
    }
  }

  async sendButtons(instanceName: string, payload: any) {
    try {
      const data = await this.makeRequest(`/message/sendButtons/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data;
    } catch (error) {
      console.error('Erro ao enviar botões:', error);
      throw error;
    }
  }

  async sendList(instanceName: string, payload: any) {
    try {
      const data = await this.makeRequest(`/message/sendList/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data;
    } catch (error) {
      console.error('Erro ao enviar lista:', error);
      throw error;
    }
  }
}

export default EvolutionApiGlobalService;
