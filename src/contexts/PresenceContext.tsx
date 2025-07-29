import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAtendimentoBidirecional } from '@/hooks/useAtendimentoBidirecional';
import { supabase } from '@/integrations/supabase/client';

interface PresenceContextType {
  bidirecional: ReturnType<typeof useAtendimentoBidirecional> | null;
  isSystemOnline: boolean;
}

const PresenceContext = createContext<PresenceContextType>({
  bidirecional: null,
  isSystemOnline: false
});

interface PresenceProviderProps {
  children: ReactNode;
}

export function PresenceProvider({ children }: PresenceProviderProps) {
  const { user } = useAuth();
  const [empresaId, setEmpresaId] = React.useState<string | null>(null);
  const [isSystemOnline, setIsSystemOnline] = React.useState(false);

  // Get user's company ID
  useEffect(() => {
    if (!user) {
      setEmpresaId(null);
      return;
    }

    const fetchEmpresaId = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user.id)
          .single();

        if (profile?.empresa_id) {
          setEmpresaId(profile.empresa_id);
        }
      } catch (error) {
        console.error('Error fetching empresa_id:', error);
      }
    };

    fetchEmpresaId();
  }, [user]);

  // Initialize bidirectional communication only when empresa_id is available
  const bidirecional = useAtendimentoBidirecional(
    empresaId ? {
      empresaId,
      autoConnect: false, // Disabled auto-connect to prevent loop
      reconnectAttempts: 3
    } : { empresaId: '', autoConnect: false }
  );

  // Monitor system connectivity
  useEffect(() => {
    const checkConnectivity = () => {
      setIsSystemOnline(navigator.onLine && bidirecional.isConnected);
    };

    checkConnectivity();

    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
    };
  }, [bidirecional.isConnected]);

  // Handle user going online/offline
  useEffect(() => {
    if (!bidirecional || !user) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        bidirecional.updatePresence('offline');
      } else {
        bidirecional.updatePresence('online');
      }
    };

    const handleBeforeUnload = () => {
      bidirecional.updatePresence('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set initial online status
    if (bidirecional.isConnected) {
      bidirecional.updatePresence('online');
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [bidirecional, user]);

  const contextValue: PresenceContextType = {
    bidirecional: empresaId ? bidirecional : null,
    isSystemOnline
  };

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}