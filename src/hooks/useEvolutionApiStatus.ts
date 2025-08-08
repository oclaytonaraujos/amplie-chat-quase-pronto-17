/**
 * Hook para verificar o status real das instâncias Evolution API
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InstanceStatus {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  numero?: string;
  profilePicture?: string;
  lastCheck: Date;
}

export function useEvolutionApiStatus() {
  const [instancesStatus, setInstancesStatus] = useState<InstanceStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const checkInstanceStatus = useCallback(async (instanceName: string) => {
    try {
      // Buscar configuração global
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (!globalConfig) {
        return {
          instanceName,
          status: 'error' as const,
          lastCheck: new Date()
        };
      }

      // Verificar status na Evolution API
      const response = await fetch(`${globalConfig.server_url}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': globalConfig.api_key,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`Erro ao verificar status da instância ${instanceName}:`, response.status);
        return {
          instanceName,
          status: 'error' as const,
          lastCheck: new Date()
        };
      }

      const instances = await response.json();
      const instance = instances.find((inst: any) => inst.instance?.instanceName === instanceName);

      if (!instance) {
        return {
          instanceName,
          status: 'disconnected' as const,
          lastCheck: new Date()
        };
      }

      // Verificar se está conectado
      const isConnected = instance.instance?.state === 'open';
      const whatsappNumber = instance.instance?.owner?.jid?.split('@')[0];
      const profilePicture = instance.instance?.profilePictureUrl;

      return {
        instanceName,
        status: isConnected ? 'connected' as const : 'disconnected' as const,
        numero: whatsappNumber,
        profilePicture,
        lastCheck: new Date()
      };
    } catch (error) {
      console.error(`Erro ao verificar status da instância ${instanceName}:`, error);
      return {
        instanceName,
        status: 'error' as const,
        lastCheck: new Date()
      };
    }
  }, []);

  const updateInstanceStatusInDB = useCallback(async (instanceName: string, status: InstanceStatus) => {
    try {
      const mappedState = status.status === 'connected' ? 'open' : status.status === 'disconnected' ? 'close' : status.status;

      const updateData: any = {
        status: mappedState,
        connection_state: mappedState,
        numero: status.numero,
        profile_picture_url: status.profilePicture,
        updated_at: new Date().toISOString(),
        ...(mappedState === 'open' ? { last_connected_at: new Date().toISOString(), qr_code: null } : {})
      };

      const { error } = await supabase
        .from('evolution_api_config')
        .update(updateData)
        .eq('instance_name', instanceName);

      if (error) {
        console.error('Erro ao atualizar status no banco:', error);
      }

      // Espelhar também na tabela whatsapp_connections, quando existir relacionamento por evolution_instance_name
      await supabase
        .from('whatsapp_connections')
        .update({
          evolution_status: mappedState,
          status: mappedState === 'open' ? 'connected' : mappedState === 'close' ? 'disconnected' : mappedState,
          updated_at: new Date().toISOString()
        })
        .eq('evolution_instance_name', instanceName);
    } catch (error) {
      console.error('Erro ao atualizar status no banco:', error);
    }
  }, []);

  const checkAllInstancesStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar todas as instâncias ativas do banco
      const { data: instances, error } = await supabase
        .from('evolution_api_config')
        .select('instance_name')
        .eq('ativo', true);

      if (error) {
        console.error('Erro ao buscar instâncias:', error);
        return;
      }

      const statusChecks = instances?.map(instance => 
        checkInstanceStatus(instance.instance_name)
      ) || [];

      const results = await Promise.all(statusChecks);
      
      // Atualizar status no banco de dados
      await Promise.all(
        results.map(status => updateInstanceStatusInDB(status.instanceName, status))
      );

      setInstancesStatus(results);
    } catch (error) {
      console.error('Erro ao verificar status das instâncias:', error);
    } finally {
      setLoading(false);
    }
  }, [checkInstanceStatus, updateInstanceStatusInDB]);

  const refreshInstanceStatus = useCallback(async (instanceName: string) => {
    const status = await checkInstanceStatus(instanceName);
    await updateInstanceStatusInDB(instanceName, status);
    
    setInstancesStatus(prev => 
      prev.map(inst => 
        inst.instanceName === instanceName ? status : inst
      )
    );

    return status;
  }, [checkInstanceStatus, updateInstanceStatusInDB]);

  // Verificar status a cada 30 segundos
  useEffect(() => {
    checkAllInstancesStatus();
    
    const interval = setInterval(() => {
      checkAllInstancesStatus();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [checkAllInstancesStatus]);

  return {
    instancesStatus,
    loading,
    checkAllInstancesStatus,
    refreshInstanceStatus,
    checkInstanceStatus
  };
}