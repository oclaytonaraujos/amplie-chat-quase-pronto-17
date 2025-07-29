import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export function useEvolutionApiSync() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Sincronizar status de uma instância específica
  const syncInstanceStatus = useCallback(async (instanceName: string) => {
    if (!instanceName) return;

    setLoading(true);
    try {
      // Buscar configuração global
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (!globalConfig) {
        throw new Error('Configuração global da Evolution API não encontrada');
      }

      // Verificar status na Evolution API
      const response = await fetch(`${globalConfig.server_url}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const statusData = await response.json();
      
      // Preparar dados para atualização
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (statusData.instance) {
        const state = statusData.instance.state;
        updateData.status = state;
        updateData.connection_state = state;

        if (state === 'open') {
          updateData.last_connected_at = new Date().toISOString();
          updateData.qr_code = null;
          
          // Extrair dados do perfil se disponíveis
          if (statusData.instance.profileName) {
            updateData.profile_name = statusData.instance.profileName;
          }
          if (statusData.instance.profilePictureUrl) {
            updateData.profile_picture_url = statusData.instance.profilePictureUrl;
          }
          if (statusData.instance.ownerJid) {
            updateData.numero = statusData.instance.ownerJid.split('@')[0];
          }
        } else if (state === 'close') {
          updateData.qr_code = null;
        }
      }

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('evolution_api_config')
        .update(updateData)
        .eq('instance_name', instanceName);

      if (error) throw error;

      logger.info('Status da instância sincronizado', {
        component: 'useEvolutionApiSync',
        metadata: { instanceName, status: updateData.status }
      });

      toast({
        title: "Status sincronizado",
        description: `Status da instância ${instanceName} atualizado`,
      });

    } catch (error) {
      logger.error('Erro ao sincronizar status da instância', {
        component: 'useEvolutionApiSync'
      }, error as Error);

      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar o status da instância",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Conectar uma instância
  const connectInstance = useCallback(async (instanceName: string) => {
    setLoading(true);
    try {
      // Buscar configuração global
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (!globalConfig) {
        throw new Error('Configuração global da Evolution API não encontrada');
      }

      // Conectar instância
      const response = await fetch(`${globalConfig.server_url}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      // Atualizar status para 'connecting'
      await supabase
        .from('evolution_api_config')
        .update({
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      toast({
        title: "Conectando",
        description: `Iniciando conexão da instância ${instanceName}`,
      });

    } catch (error) {
      logger.error('Erro ao conectar instância', {
        component: 'useEvolutionApiSync'
      }, error as Error);

      toast({
        title: "Erro ao conectar",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Reiniciar uma instância
  const restartInstance = useCallback(async (instanceName: string) => {
    setLoading(true);
    try {
      // Buscar configuração global
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (!globalConfig) {
        throw new Error('Configuração global da Evolution API não encontrada');
      }

      // Reiniciar instância
      const response = await fetch(`${globalConfig.server_url}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      // Atualizar status
      await supabase
        .from('evolution_api_config')
        .update({
          status: 'connecting',
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      toast({
        title: "Reiniciando",
        description: `Instância ${instanceName} está sendo reiniciada`,
      });

    } catch (error) {
      logger.error('Erro ao reiniciar instância', {
        component: 'useEvolutionApiSync'
      }, error as Error);

      toast({
        title: "Erro ao reiniciar",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    syncInstanceStatus,
    connectInstance,
    restartInstance
  };
}