import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalPolling } from '@/hooks/useGlobalPolling';
import { logger } from '@/utils/logger';

interface ConnectionStatus {
  instanceName: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'qr_required';
  lastCheck: Date;
  qrCode?: string;
  numero?: string;
}

interface WhatsAppConnectionContextType {
  connections: ConnectionStatus[];
  globalStatus: 'connected' | 'disconnected' | 'partial' | 'error';
  isLoading: boolean;
  refreshConnections: () => Promise<void>;
  updateConnectionStatus: (instanceName: string, status: string, qrCode?: string) => void;
  hasActiveConnection: boolean;
}

const WhatsAppConnectionContext = createContext<WhatsAppConnectionContextType | undefined>(undefined);

export function WhatsAppConnectionProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<ConnectionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const { user } = useAuth();

  const updateConnectionStatus = useCallback((instanceName: string, status: string, qrCode?: string) => {
    setConnections(prev => {
      const existing = prev.find(c => c.instanceName === instanceName);
      const statusMap: Record<string, ConnectionStatus['status']> = {
        'open': 'connected',
        'connecting': 'connecting',
        'close': 'disconnected',
        'qr_required': 'qr_required'
      };

      const mappedStatus = statusMap[status] || 'disconnected';

      if (existing) {
        return prev.map(c => 
          c.instanceName === instanceName 
            ? { ...c, status: mappedStatus, lastCheck: new Date(), qrCode }
            : c
        );
      } else {
        return [...prev, {
          instanceName,
          status: mappedStatus,
          lastCheck: new Date(),
          qrCode
        }];
      }
    });
  }, []);

  const refreshConnections = useCallback(async () => {
    if (!user) return;

    // Debounce: don't fetch if we fetched less than 10 seconds ago
    const now = new Date();
    if (lastFetch && (now.getTime() - lastFetch.getTime()) < 10000) {
      logger.info('Skipping refresh due to debounce', {
        component: 'WhatsAppConnectionContext'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (!profile?.empresa_id) {
        setConnections([]);
        return;
      }

      const { data: instances, error } = await supabase
        .from('evolution_api_config')
        .select('instance_name, status, qr_code, numero')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true);

      if (error) throw error;

      const connectionStatuses: ConnectionStatus[] = (instances || []).map(instance => ({
        instanceName: instance.instance_name,
        status: instance.status === 'open' ? 'connected' : 
                instance.status === 'connecting' ? 'connecting' : 
                instance.status === 'close' ? 'disconnected' :
                instance.qr_code ? 'qr_required' : 'disconnected',
        lastCheck: new Date(),
        qrCode: instance.qr_code,
        numero: instance.numero
      }));

      setConnections(connectionStatuses);
      setLastFetch(now);

      logger.info('Conexões WhatsApp atualizadas', {
        component: 'WhatsAppConnectionContext'
      });

    } catch (error) {
      logger.error('Erro ao atualizar conexões WhatsApp', {
        component: 'WhatsAppConnectionContext'
      }, error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastFetch]);

  const globalStatus = React.useMemo<WhatsAppConnectionContextType['globalStatus']>(() => {
    if (connections.length === 0) return 'disconnected';
    
    const connectedCount = connections.filter(c => c.status === 'connected').length;
    const errorCount = connections.filter(c => c.status === 'error').length;
    
    if (errorCount > 0) return 'error';
    if (connectedCount === connections.length) return 'connected';
    if (connectedCount > 0) return 'partial';
    
    return 'disconnected';
  }, [connections]);

  const hasActiveConnection = connections.some(c => c.status === 'connected');

  // Global polling management - only if user exists
  useGlobalPolling({
    id: `whatsapp-connections-${user?.id || 'no-user'}`,
    callback: user ? refreshConnections : () => {},
    interval: 120000, // 2 minutes
    immediate: !!user
  });

  // Realtime subscription with more targeted updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('evolution_api_config_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'evolution_api_config',
          filter: 'ativo=eq.true'
        },
        (payload) => {
          logger.info('Evolution API config updated via realtime', {
            component: 'WhatsAppConnectionContext'
          });
          
          const instance = payload.new as any;
          if (instance?.instance_name) {
            updateConnectionStatus(instance.instance_name, instance.status, instance.qr_code);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'evolution_api_config',
          filter: 'ativo=eq.true'
        },
        () => {
          logger.info('New Evolution API config created, refreshing', {
            component: 'WhatsAppConnectionContext'
          });
          
          // For new instances, refresh everything
          setTimeout(refreshConnections, 1000); // Small delay to ensure data is available
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, updateConnectionStatus]); // Remove refreshConnections from deps

  return (
    <WhatsAppConnectionContext.Provider value={{
      connections,
      globalStatus,
      isLoading,
      refreshConnections,
      updateConnectionStatus,
      hasActiveConnection
    }}>
      {children}
    </WhatsAppConnectionContext.Provider>
  );
}

export function useWhatsAppConnection() {
  const context = useContext(WhatsAppConnectionContext);
  if (context === undefined) {
    throw new Error('useWhatsAppConnection must be used within a WhatsAppConnectionProvider');
  }
  return context;
}