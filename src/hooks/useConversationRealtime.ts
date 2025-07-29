import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ConversationUpdate {
  type: 'nova_mensagem' | 'status_atualizado' | 'agente_atribuido' | 'transferencia';
  conversaId: string;
  data: any;
  timestamp: string;
}

interface TypingUser {
  userId: string;
  nome?: string;
  timestamp: string;
}

export function useConversationRealtime(conversaId: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [lastUpdate, setLastUpdate] = useState<ConversationUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const sendTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!user || !conversaId) return;

    const channel = supabase.channel(`conversa:${conversaId}`);
    
    if (isTyping) {
      await channel.send({
        type: 'broadcast',
        event: 'typing_start',
        payload: {
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      await channel.send({
        type: 'broadcast',
        event: 'typing_stop',
        payload: {
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [user, conversaId]);

  const broadcastConversationUpdate = useCallback(async (
    type: ConversationUpdate['type'], 
    data: any
  ) => {
    if (!conversaId) return;

    const update: ConversationUpdate = {
      type,
      conversaId,
      data,
      timestamp: new Date().toISOString()
    };

    const channel = supabase.channel(`conversa:${conversaId}`);
    await channel.send({
      type: 'broadcast',
      event: 'conversation_update',
      payload: update
    });
  }, [conversaId]);

  const notifyNewMessage = useCallback(async (mensagem: any) => {
    await broadcastConversationUpdate('nova_mensagem', mensagem);
  }, [broadcastConversationUpdate]);

  const notifyStatusChange = useCallback(async (novoStatus: string) => {
    await broadcastConversationUpdate('status_atualizado', { status: novoStatus });
  }, [broadcastConversationUpdate]);

  const notifyAgentAssigned = useCallback(async (agenteId: string) => {
    await broadcastConversationUpdate('agente_atribuido', { agenteId });
  }, [broadcastConversationUpdate]);

  const notifyTransfer = useCallback(async (transferData: any) => {
    await broadcastConversationUpdate('transferencia', transferData);
  }, [broadcastConversationUpdate]);

  // Cleanup typing indicators older than 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setTypingUsers(prev => prev.filter(user => {
        const userTime = new Date(user.timestamp).getTime();
        return now - userTime < 10000; // Remove if older than 10 seconds
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    if (!conversaId || !user) return;

    let channel: any = null;

    const setupConversationChannel = async () => {
      channel = supabase
        .channel(`conversa:${conversaId}`)
        .on('broadcast', { event: 'typing_start' }, (payload: any) => {
          const { userId, timestamp } = payload.payload;
          
          if (userId === user.id) return; // Ignore own typing
          
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.userId !== userId);
            return [...filtered, { userId, timestamp }];
          });
        })
        .on('broadcast', { event: 'typing_stop' }, (payload: any) => {
          const { userId } = payload.payload;
          
          setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        })
        .on('broadcast', { event: 'conversation_update' }, (payload: any) => {
          setLastUpdate(payload.payload);
        })
        .subscribe((status: string) => {
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupConversationChannel();

    return () => {
      if (channel) {
        // Send stop typing before leaving
        sendTypingIndicator(false);
        supabase.removeChannel(channel);
      }
      setIsConnected(false);
    };
  }, [conversaId, user, sendTypingIndicator]);

  return {
    typingUsers,
    lastUpdate,
    isConnected,
    sendTypingIndicator,
    notifyNewMessage,
    notifyStatusChange,
    notifyAgentAssigned,
    notifyTransfer
  };
}