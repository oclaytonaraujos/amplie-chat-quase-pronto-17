
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEvolutionApi } from './useEvolutionApi';

type ConnectionStatus = 'open' | 'close' | 'connecting' | 'qr' | 'disconnected' | 'unknown';

interface UseWhatsAppConnectionCheckReturn {
  status: ConnectionStatus;
  isChecking: boolean;
  checkConnection: () => void;
  lastChecked: Date | null;
  qrCode?: string;
  numero?: string;
  profileName?: string;
}

export const useWhatsAppConnectionCheck = (instanceName?: string): UseWhatsAppConnectionCheckReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [numero, setNumero] = useState<string | undefined>();
  const [profileName, setProfileName] = useState<string | undefined>();
  
  const { getInstanceStatus, isServiceAvailable } = useEvolutionApi();

  const checkConnection = useCallback(async () => {
    if (isChecking || !instanceName || !isServiceAvailable) return;
    
    setIsChecking(true);
    
    try {
      // Primeiro, buscar dados do banco local
      const { data: localData } = await supabase
        .from('evolution_api_config')
        .select('status, qr_code, numero, profile_name')
        .eq('instance_name', instanceName)
        .single();

      if (localData) {
        setStatus(localData.status as ConnectionStatus || 'unknown');
        setQrCode(localData.qr_code || undefined);
        setNumero(localData.numero || undefined);
        setProfileName(localData.profile_name || undefined);
      }

      // Depois, verificar status real na Evolution API
      const evolutionStatus = await getInstanceStatus(instanceName);
      
      if (evolutionStatus?.instance) {
        const realStatus = evolutionStatus.instance.state as ConnectionStatus;
        const realQrCode = evolutionStatus.instance.qrcode;
        const realNumero =
          evolutionStatus.instance.ownerJid?.split?.('@')[0] ||
          evolutionStatus.instance.owner?.jid?.split?.('@')[0] ||
          undefined;
        const realProfileName = evolutionStatus.instance.profileName;

        // Atualizar no banco se houver mudanças
        if (localData?.status !== realStatus || 
            localData?.qr_code !== realQrCode ||
            localData?.numero !== realNumero ||
            localData?.profile_name !== realProfileName) {
          
          await supabase
            .from('evolution_api_config')
            .update({
              status: realStatus,
              connection_state: realStatus,
              qr_code: realQrCode,
              numero: realNumero,
              profile_name: realProfileName,
              updated_at: new Date().toISOString(),
              ...(realStatus === 'open' && { last_connected_at: new Date().toISOString() })
            })
            .eq('instance_name', instanceName);

          // Sincronizar também na tabela whatsapp_connections (se existir vínculo)
          await supabase
            .from('whatsapp_connections')
            .update({
              evolution_status: realStatus,
              status: realStatus === 'open' ? 'connected' : realStatus === 'close' ? 'disconnected' : realStatus,
              evolution_qr_code: realQrCode ?? null,
              numero: realNumero ?? null,
              updated_at: new Date().toISOString()
            })
            .eq('evolution_instance_name', instanceName);
        }

        setStatus(realStatus);
        setQrCode(realQrCode);
        setNumero(realNumero);
        setProfileName(realProfileName);
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      setStatus('disconnected');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, instanceName, getInstanceStatus, isServiceAvailable]);

  // Auto-check on mount and periodically
  useEffect(() => {
    if (!instanceName || !isServiceAvailable) return;
    
    checkConnection();
    
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnection, instanceName, isServiceAvailable]);

  // Real-time subscription para mudanças na instância específica
  useEffect(() => {
    if (!instanceName) return;

    const channel = supabase
      .channel(`instance_${instanceName}_changes`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evolution_api_config',
          filter: `instance_name=eq.${instanceName}`
        },
        (payload) => {
          const newData = payload.new as any;
          setStatus(newData.status as ConnectionStatus);
          setQrCode(newData.qr_code);
          setNumero(newData.numero);
          setProfileName(newData.profile_name);
          setLastChecked(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instanceName]);

  return {
    status,
    isChecking,
    checkConnection,
    lastChecked,
    qrCode,
    numero,
    profileName
  };
};
