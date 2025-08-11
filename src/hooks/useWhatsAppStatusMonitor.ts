import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface StatusMonitorOptions {
  interval?: number; // Intervalo em ms (padrão: 30 segundos)
  enabled?: boolean; // Se o monitoramento está ativo
}

/**
 * Hook para monitorar automaticamente o status das instâncias WhatsApp
 */
export function useWhatsAppStatusMonitor(options: StatusMonitorOptions = {}) {
  const { user, profile } = useAuth();
  const { interval = 3000, enabled = true } = options;

  const checkInstancesStatus = useCallback(async () => {
    if (!profile?.empresa_id || !enabled) return;

    try {
      // Buscar configuração global
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .maybeSingle();

      if (!globalConfig) {
        logger.warn('Configuração global Evolution API não encontrada', {
          component: 'useWhatsAppStatusMonitor'
        });
        return;
      }

      // Buscar instâncias da empresa
      const { data: instances } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true);

      if (!instances || instances.length === 0) {
        return;
      }

      // Verificar status de cada instância na Evolution API
      for (const instance of instances) {
        try {
          const response = await fetch(`${globalConfig.server_url}/instance/connectionState/${instance.instance_name}`, {
            method: 'GET',
            headers: {
              'apikey': globalConfig.api_key,
              'Content-Type': 'application/json'
            },
            // Timeout curto para não bloquear
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const statusData = await response.json();
            
            if (statusData.instance) {
              const currentState = statusData.instance.state;
              const newQrCode = statusData.instance.qrcode ?? null;

              // Atualizar quando status OU QR code mudarem
              const shouldUpdate =
                currentState !== instance.status || newQrCode !== instance.qr_code;

              if (shouldUpdate) {
                const updateData: any = {
                  status: currentState,
                  connection_state: currentState,
                  updated_at: new Date().toISOString()
                };

                // Se conectou, limpar QR code e salvar dados do perfil
                if (currentState === 'open') {
                  updateData.qr_code = null;
                  updateData.last_connected_at = new Date().toISOString();

                  if (statusData.instance.profileName) {
                    updateData.profile_name = statusData.instance.profileName;
                  }
                  if (statusData.instance.profilePictureUrl) {
                    updateData.profile_picture_url = statusData.instance.profilePictureUrl;
                  }
                  if (statusData.instance.ownerJid) {
                    updateData.numero = statusData.instance.ownerJid.split('@')[0];
                  }
                } else {
                  // Enquanto não conectado, persistir QR code quando disponível
                  if (newQrCode) {
                    updateData.qr_code = newQrCode;
                  }
                }

                // Se desconectou, garantir limpeza do QR code
                if (currentState === 'close') {
                  updateData.qr_code = null;
                }

                await supabase
                  .from('evolution_api_config')
                  .update(updateData)
                  .eq('id', instance.id);

                logger.info('Instância verificada automaticamente', {
                  component: 'useWhatsAppStatusMonitor',
                  metadata: {
                    instanceName: instance.instance_name,
                    oldStatus: instance.status,
                    newStatus: currentState,
                    qrUpdated: newQrCode !== instance.qr_code && currentState !== 'open'
                  }
                });
              }
            }
          }
        } catch (error) {
          // Log do erro mas não interromper o loop
          logger.error(`Erro ao verificar instância ${instance.instance_name}`, {
            component: 'useWhatsAppStatusMonitor'
          }, error as Error);
        }
      }
    } catch (error) {
      logger.error('Erro no monitoramento de status', {
        component: 'useWhatsAppStatusMonitor'
      }, error as Error);
    }
  }, [profile?.empresa_id, enabled]);

  // Configurar intervalo de verificação
  useEffect(() => {
    if (!user || !enabled) return;

    // Verificação inicial
    checkInstancesStatus();

    // Configurar intervalo
    const intervalId = setInterval(checkInstancesStatus, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [user, enabled, interval, checkInstancesStatus]);

  return {
    checkInstancesStatus
  };
}