
import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseRealTimeUpdatesProps {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string;
  channel?: string; // Custom channel name
  enableBroadcast?: boolean; // Enable broadcast events
  onBroadcast?: (payload: any) => void;
}

export function useRealTimeUpdates({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter,
  channel,
  enableBroadcast = false,
  onBroadcast
}: UseRealTimeUpdatesProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return null;

    const channelName = channel || `realtime_${table}`;
    const realtimeChannel = supabase.channel(channelName);

    // PostgreSQL changes subscription
    if (table) {
      realtimeChannel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: table,
            filter: filter
          },
          (payload) => {
            console.log(`Nova inserção em ${table}:`, payload);
            setLastUpdate({ type: 'INSERT', table, payload, timestamp: new Date() });
            onInsert?.(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: table,
            filter: filter
          },
          (payload) => {
            console.log(`Atualização em ${table}:`, payload);
            setLastUpdate({ type: 'UPDATE', table, payload, timestamp: new Date() });
            onUpdate?.(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: table,
            filter: filter
          },
          (payload) => {
            console.log(`Exclusão em ${table}:`, payload);
            setLastUpdate({ type: 'DELETE', table, payload, timestamp: new Date() });
            onDelete?.(payload);
          }
        );
    }

    // Broadcast events subscription
    if (enableBroadcast) {
      realtimeChannel.on('broadcast', { event: '*' }, (payload) => {
        console.log(`Broadcast recebido no canal ${channelName}:`, payload);
        setLastUpdate({ type: 'BROADCAST', channel: channelName, payload, timestamp: new Date() });
        onBroadcast?.(payload);
      });
    }

    // Subscribe and track connection status
    realtimeChannel.subscribe((status: string) => {
      console.log(`Canal ${channelName} status:`, status);
      setIsConnected(status === 'SUBSCRIBED');
    });

    return realtimeChannel;
  }, [user, table, onInsert, onUpdate, onDelete, filter, channel, enableBroadcast, onBroadcast]);

  useEffect(() => {
    const realtimeChannel = setupRealtimeSubscription();
    
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        setIsConnected(false);
      }
    };
  }, [setupRealtimeSubscription]);

  return {
    isConnected,
    lastUpdate
  };
}
