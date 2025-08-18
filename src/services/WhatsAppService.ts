import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { EvolutionApiConfig, EvolutionApiResponse } from '@/types/evolution-api';

export interface WhatsAppInstance {
  id: string;
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_required' | 'error';
  qrCode?: string;
  numero?: string;
  profileName?: string;
  profilePictureUrl?: string;
  lastConnectedAt?: string;
  empresaId: string;
}

export interface WhatsAppMessage {
  instanceName: string;
  number: string;
  text: string;
  delay?: number;
  linkPreview?: boolean;
}

class WhatsAppServiceClass {
  private static instance: WhatsAppServiceClass;
  private globalConfig: any = null;
  private instances: Map<string, WhatsAppInstance> = new Map();
  private subscribers: Set<(instances: WhatsAppInstance[]) => void> = new Set();
  private realTimeChannel: any = null;

  private constructor() {
    this.initializeRealTime();
  }

  static getInstance(): WhatsAppServiceClass {
    if (!WhatsAppServiceClass.instance) {
      WhatsAppServiceClass.instance = new WhatsAppServiceClass();
    }
    return WhatsAppServiceClass.instance;
  }

  // Subscription management
  subscribe(callback: (instances: WhatsAppInstance[]) => void) {
    this.subscribers.add(callback);
    // Notify immediately with current data
    callback(Array.from(this.instances.values()));
    
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const instances = Array.from(this.instances.values());
    this.subscribers.forEach(callback => callback(instances));
  }

  // Global configuration management
  async loadGlobalConfig() {
    try {
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      this.globalConfig = data;
      return data;
    } catch (error) {
      logger.error('Erro ao carregar configuração global', {
        component: 'WhatsAppService'
      }, error as Error);
      return null;
    }
  }

  async updateGlobalConfig(config: {
    server_url: string;
    api_key: string;
    webhook_base_url?: string;
  }) {
    try {
      // Test connection first
      const testResponse = await fetch(`${config.server_url}/manager/findInstances`, {
        method: 'GET',
        headers: {
          'apikey': config.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!testResponse.ok) {
        throw new Error('Não foi possível conectar com a Evolution API');
      }

      // Deactivate existing configs
      await supabase
        .from('evolution_api_global_config')
        .update({ ativo: false })
        .eq('ativo', true);

      // Insert new config
      const { data, error } = await supabase
        .from('evolution_api_global_config')
        .insert({
          server_url: config.server_url,
          api_key: config.api_key,
          webhook_base_url: config.webhook_base_url,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      this.globalConfig = data;
      return data;
    } catch (error) {
      logger.error('Erro ao atualizar configuração global', {
        component: 'WhatsAppService'
      }, error as Error);
      throw error;
    }
  }

  // Instance management
  async loadInstances(empresaId?: string) {
    try {
      let query = supabase
        .from('evolution_api_config')
        .select('*')
        .eq('ativo', true);

      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const instances: WhatsAppInstance[] = (data || []).map(item => ({
        id: item.id,
        instanceName: item.instance_name,
        status: this.mapStatus(item.status, item.connection_state, item.qr_code),
        qrCode: item.qr_code,
        numero: item.numero,
        profileName: item.profile_name,
        profilePictureUrl: item.profile_picture_url,
        lastConnectedAt: item.last_connected_at,
        empresaId: item.empresa_id
      }));

      // Update local cache
      this.instances.clear();
      instances.forEach(instance => {
        this.instances.set(instance.instanceName, instance);
      });

      this.notifySubscribers();
      return instances;
    } catch (error) {
      logger.error('Erro ao carregar instâncias', {
        component: 'WhatsAppService'
      }, error as Error);
      throw error;
    }
  }

  private mapStatus(status?: string, connectionState?: string, qrCode?: string): WhatsAppInstance['status'] {
    if (status === 'open' || connectionState === 'CONNECTED') return 'connected';
    if (status === 'connecting' || connectionState === 'CONNECTING') return 'connecting';
    if (qrCode) return 'qr_required';
    if (status === 'close' || connectionState === 'DISCONNECTED') return 'disconnected';
    return 'error';
  }

  async createInstance(config: {
    instanceName: string;
    empresaId: string;
    webhook?: string;
  }) {
    try {
      if (!this.globalConfig) {
        await this.loadGlobalConfig();
      }

      if (!this.globalConfig) {
        throw new Error('Configuração global não encontrada');
      }

      // Create instance via Evolution API
      const response = await fetch(`${this.globalConfig.server_url}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': this.globalConfig.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: config.instanceName,
          qrcode: true,
          webhook: config.webhook || this.globalConfig.webhook_base_url
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar instância');
      }

      const instanceData = await response.json();

      // Save to database
      const { data, error } = await supabase
        .from('evolution_api_config')
        .insert({
          instance_name: config.instanceName,
          empresa_id: config.empresaId,
          webhook_url: config.webhook,
          status: 'connecting',
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      // Reload instances
      await this.loadInstances(config.empresaId);

      return instanceData;
    } catch (error) {
      logger.error('Erro ao criar instância', {
        component: 'WhatsAppService'
      }, error as Error);
      throw error;
    }
  }

  async deleteInstance(instanceName: string) {
    try {
      if (!this.globalConfig) {
        await this.loadGlobalConfig();
      }

      if (!this.globalConfig) {
        throw new Error('Configuração global não encontrada');
      }

      // Delete from Evolution API
      const response = await fetch(`${this.globalConfig.server_url}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': this.globalConfig.api_key
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao deletar instância');
      }

      // Delete from database
      const { error } = await supabase
        .from('evolution_api_config')
        .delete()
        .eq('instance_name', instanceName);

      if (error) throw error;

      // Update local cache
      this.instances.delete(instanceName);
      this.notifySubscribers();

      return true;
    } catch (error) {
      logger.error('Erro ao deletar instância', {
        component: 'WhatsAppService'
      }, error as Error);
      throw error;
    }
  }

  async connectInstance(instanceName: string) {
    try {
      if (!this.globalConfig) {
        await this.loadGlobalConfig();
      }

      if (!this.globalConfig) {
        throw new Error('Configuração global não encontrada');
      }

      const response = await fetch(`${this.globalConfig.server_url}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': this.globalConfig.api_key
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao conectar instância');
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao conectar instância', {
        component: 'WhatsAppService'
      }, error as Error);
      throw error;
    }
  }

  // Message sending
  async sendMessage(message: WhatsAppMessage): Promise<EvolutionApiResponse> {
    try {
      if (!this.globalConfig) {
        await this.loadGlobalConfig();
      }

      if (!this.globalConfig) {
        throw new Error('Configuração global não encontrada');
      }

      const response = await fetch(
        `${this.globalConfig.server_url}/message/sendText/${message.instanceName}`,
        {
          method: 'POST',
          headers: {
            'apikey': this.globalConfig.api_key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: message.number,
            text: message.text,
            delay: message.delay || 0,
            linkPreview: message.linkPreview ?? true
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao enviar mensagem');
      }

      const result = await response.json();

      logger.info('Mensagem enviada com sucesso', {
        component: 'WhatsAppService'
      });

      return result;
    } catch (error) {
      logger.error('Erro ao enviar mensagem', {
        component: 'WhatsAppService'
      }, error as Error);
      throw error;
    }
  }

  // Real-time updates
  private initializeRealTime() {
    if (this.realTimeChannel) return;

    this.realTimeChannel = supabase
      .channel('whatsapp_instances')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evolution_api_config'
        },
        (payload) => {
          logger.info('Real-time update recebido', {
            component: 'WhatsAppService'
          });
          
          // Reload instances for the affected company
          if (payload.new && typeof payload.new === 'object' && 'empresa_id' in payload.new) {
            this.loadInstances((payload.new as any).empresa_id);
          }
        }
      )
      .subscribe();
  }

  // Utility methods
  getInstance(instanceName: string): WhatsAppInstance | undefined {
    return this.instances.get(instanceName);
  }

  getAllInstances(): WhatsAppInstance[] {
    return Array.from(this.instances.values());
  }

  getInstancesByEmpresa(empresaId: string): WhatsAppInstance[] {
    return Array.from(this.instances.values()).filter(
      instance => instance.empresaId === empresaId
    );
  }

  hasConnectedInstances(empresaId?: string): boolean {
    const instances = empresaId ? 
      this.getInstancesByEmpresa(empresaId) : 
      this.getAllInstances();
    
    return instances.some(instance => instance.status === 'connected');
  }

  // Cleanup
  destroy() {
    if (this.realTimeChannel) {
      supabase.removeChannel(this.realTimeChannel);
      this.realTimeChannel = null;
    }
    this.subscribers.clear();
    this.instances.clear();
  }
}

export const WhatsAppService = WhatsAppServiceClass.getInstance();