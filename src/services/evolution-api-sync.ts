import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface EvolutionApiInstance {
  id: string;
  name: string;
  connectionStatus: 'open' | 'close' | 'connecting' | 'qr';
  ownerJid?: string;
  profileName?: string;
  profilePicUrl?: string;
  number?: string;
}

export class EvolutionApiSyncService {
  private globalConfig: any = null;

  async loadGlobalConfig() {
    if (this.globalConfig) return this.globalConfig;

    const { data, error } = await supabase
      .from('evolution_api_global_config')
      .select('*')
      .eq('ativo', true)
      .single();

    if (error) {
      logger.error('Erro ao carregar configuração global', {}, error);
      throw error;
    }

    this.globalConfig = data;
    return data;
  }

  async syncAllInstances() {
    try {
      const config = await this.loadGlobalConfig();
      
      // Buscar instâncias da Evolution API
      const response = await fetch(`${config.server_url}/instance/fetchInstances`, {
        headers: {
          'apikey': config.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.status}`);
      }

      const instances: EvolutionApiInstance[] = await response.json();
      
      logger.info('Instâncias obtidas da Evolution API', {
        component: 'EvolutionApiSyncService'
      });

      // Sincronizar cada instância com o banco
      for (const instance of instances) {
        await this.syncInstanceToDB(instance);
      }

      return instances;
    } catch (error) {
      logger.error('Erro ao sincronizar instâncias', {}, error as Error);
      throw error;
    }
  }

  async syncInstanceToDB(instance: EvolutionApiInstance) {
    try {
      // Extrair número do WhatsApp do ownerJid
      const phoneNumber = instance.ownerJid?.split('@')[0] || null;
      
      // Mapear status da Evolution API para nosso formato
      const status = this.mapConnectionStatus(instance.connectionStatus);
      
      const updateData = {
        status,
        connection_state: instance.connectionStatus?.toUpperCase() || 'DISCONNECTED',
        numero: phoneNumber,
        profile_name: instance.profileName || null,
        profile_picture_url: instance.profilePicUrl || null,
        updated_at: new Date().toISOString(),
        ...(status === 'open' && { 
          last_connected_at: new Date().toISOString(),
          qr_code: null 
        })
      };

      // Verificar se a instância existe no banco
      const { data: existingInstance } = await supabase
        .from('evolution_api_config')
        .select('id, instance_name')
        .eq('instance_name', instance.name)
        .single();

      if (existingInstance) {
        // Atualizar instância existente
        const { error } = await supabase
          .from('evolution_api_config')
          .update(updateData)
          .eq('instance_name', instance.name);

        if (error) {
          logger.error(`Erro ao atualizar instância ${instance.name}`, {}, error);
        } else {
          logger.info(`Instância ${instance.name} atualizada`, {
            component: 'EvolutionApiSyncService'
          });
        }
      } else {
        // Buscar empresa padrão para criar nova instância
        const { data: defaultEmpresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('email', 'ampliemarketing.mkt@gmail.com')
          .single();

        if (defaultEmpresa) {
          const insertData = {
            ...updateData,
            instance_name: instance.name,
            empresa_id: defaultEmpresa.id,
            ativo: true,
            webhook_url: this.globalConfig?.webhook_base_url || null,
            webhook_events: [
              'APPLICATION_STARTUP',
              'QRCODE_UPDATED', 
              'CONNECTION_UPDATE',
              'MESSAGES_UPSERT',
              'SEND_MESSAGE'
            ]
          };

          const { error } = await supabase
            .from('evolution_api_config')
            .insert(insertData);

          if (error) {
            logger.error(`Erro ao criar instância ${instance.name}`, {}, error);
          } else {
            logger.info(`Nova instância ${instance.name} criada no banco`);
          }
        }
      }
    } catch (error) {
      logger.error(`Erro ao sincronizar instância ${instance.name}`, {}, error as Error);
    }
  }

  private mapConnectionStatus(evolutionStatus: string): string {
    switch (evolutionStatus?.toLowerCase()) {
      case 'open':
        return 'open';
      case 'close':
        return 'close';
      case 'connecting':
        return 'connecting';
      case 'qr':
        return 'qr';
      default:
        return 'disconnected';
    }
  }

  async getInstanceQRCode(instanceName: string) {
    try {
      const config = await this.loadGlobalConfig();
      
      const response = await fetch(`${config.server_url}/instance/connect/${instanceName}`, {
        headers: {
          'apikey': config.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter QR Code: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Erro ao obter QR Code', {}, error as Error);
      throw error;
    }
  }

  async restartInstance(instanceName: string) {
    try {
      const config = await this.loadGlobalConfig();
      
      // Primeiro fazer logout
      await fetch(`${config.server_url}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: {
          'apikey': config.api_key,
          'Content-Type': 'application/json'
        }
      });

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reconectar
      const response = await fetch(`${config.server_url}/instance/connect/${instanceName}`, {
        headers: {
          'apikey': config.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao reconectar: ${response.status}`);
      }

      const result = await response.json();
      
      // Atualizar status no banco
      await supabase
        .from('evolution_api_config')
        .update({
          status: 'connecting',
          connection_state: 'CONNECTING',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      return result;
    } catch (error) {
      logger.error('Erro ao reiniciar instância', {}, error as Error);
      throw error;
    }
  }
}

export const evolutionApiSync = new EvolutionApiSyncService();