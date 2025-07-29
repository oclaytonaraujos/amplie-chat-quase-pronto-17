import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PresenceUser {
  userId: string;
  status: 'online' | 'offline' | 'typing';
  conversaId?: string;
  timestamp: string;
  nome?: string;
}

interface PresenceState {
  [key: string]: PresenceUser[];
}

export function usePresenceSystem(empresaId?: string) {
  const { user } = useAuth();
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  const updatePresence = useCallback(async (status: 'online' | 'offline' | 'typing', conversaId?: string) => {
    if (!user || !empresaId) return;

    const presenceData = {
      userId: user.id,
      status,
      conversaId,
      timestamp: new Date().toISOString()
    };

    const channel = supabase.channel(`presence:${empresaId}`);
    await channel.track(presenceData);
  }, [user, empresaId]);

  const startTyping = useCallback(async (conversaId: string) => {
    await updatePresence('typing', conversaId);
  }, [updatePresence]);

  const stopTyping = useCallback(async (conversaId?: string) => {
    await updatePresence('online', conversaId);
  }, [updatePresence]);

  const goOnline = useCallback(async () => {
    await updatePresence('online');
    setIsOnline(true);
  }, [updatePresence]);

  const goOffline = useCallback(async () => {
    await updatePresence('offline');
    setIsOnline(false);
  }, [updatePresence]);

  const getUsersInConversation = useCallback((conversaId: string): PresenceUser[] => {
    return onlineUsers.filter(user => 
      user.conversaId === conversaId && 
      user.status === 'typing'
    );
  }, [onlineUsers]);

  const isUserTyping = useCallback((userId: string, conversaId: string): boolean => {
    return onlineUsers.some(user => 
      user.userId === userId && 
      user.conversaId === conversaId && 
      user.status === 'typing'
    );
  }, [onlineUsers]);

  const getOnlineUsersCount = useCallback((): number => {
    return onlineUsers.filter(user => user.status === 'online').length;
  }, [onlineUsers]);

  useEffect(() => {
    if (!user || !empresaId) return;

    let channel: any = null;

    const setupPresence = async () => {
      channel = supabase
        .channel(`presence:${empresaId}`)
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          setPresenceState(newState);
          
          // Flatten presence state to get all online users
          const allUsers: PresenceUser[] = [];
          Object.values(newState).forEach((users: any) => {
            users.forEach((user: PresenceUser) => {
              allUsers.push(user);
            });
          });
          setOnlineUsers(allUsers);
        })
        .on('presence', { event: 'join' }, ({ newPresences }: any) => {
          console.log('Usuário entrou:', newPresences);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
          console.log('Usuário saiu:', leftPresences);
        })
        .subscribe();

      // Registrar presença inicial
      await goOnline();
    };

    setupPresence();

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        goOffline();
      } else {
        goOnline();
      }
    };

    // Handle beforeunload to update presence
    const handleBeforeUnload = () => {
      goOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (channel) {
        goOffline();
        supabase.removeChannel(channel);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, empresaId, goOnline, goOffline]);

  return {
    presenceState,
    onlineUsers,
    isOnline,
    updatePresence,
    startTyping,
    stopTyping,
    goOnline,
    goOffline,
    getUsersInConversation,
    isUserTyping,
    getOnlineUsersCount
  };
}