import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ConnectionNotificationState {
  isConnected: boolean;
  lastErrorTime: number;
  errorCount: number;
  hasShownSuccessToast: boolean;
}

interface ConnectionNotificationContextType {
  notifyConnectionError: (message: string) => void;
  notifyConnectionSuccess: (message: string) => void;
  notifyConnectionRestored: () => void;
  resetState: () => void;
}

const ConnectionNotificationContext = createContext<ConnectionNotificationContextType | undefined>(undefined);

export function ConnectionNotificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConnectionNotificationState>({
    isConnected: true,
    lastErrorTime: 0,
    errorCount: 0,
    hasShownSuccessToast: false
  });

  const notifyConnectionError = useCallback((message: string) => {
    const now = Date.now();
    const timeSinceLastError = now - state.lastErrorTime;
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      lastErrorTime: now,
      errorCount: timeSinceLastError > 60000 ? 1 : prev.errorCount + 1, // Reset count if more than 1 minute
      hasShownSuccessToast: false
    }));

    // Only show toast if:
    // 1. First error in the session, OR
    // 2. Been more than 5 minutes since last error toast, OR
    // 3. After 5 consecutive errors (something is really wrong)
    const shouldShowToast = 
      state.errorCount === 0 || 
      timeSinceLastError > 300000 || 
      state.errorCount >= 5;

    if (shouldShowToast) {
      toast({
        title: "Problema de conexão",
        description: message,
        variant: "destructive",
      });

      // Reset error count after showing toast
      if (state.errorCount >= 5) {
        setState(prev => ({ ...prev, errorCount: 0 }));
      }
    }
  }, [state.lastErrorTime, state.errorCount]);

  const notifyConnectionSuccess = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      isConnected: true,
      errorCount: 0,
      hasShownSuccessToast: true
    }));

    toast({
      title: "Conexão estabelecida",
      description: message,
      variant: "default",
    });
  }, []);

  const notifyConnectionRestored = useCallback(() => {
    // Only show restoration toast if we were previously disconnected and haven't shown success yet
    if (!state.isConnected && !state.hasShownSuccessToast && state.errorCount > 0) {
      setState(prev => ({
        ...prev,
        isConnected: true,
        errorCount: 0,
        hasShownSuccessToast: true
      }));

      toast({
        title: "Conexão restaurada",
        description: "Comunicação em tempo real reestabelecida",
        variant: "default",
      });
    }
  }, [state.isConnected, state.hasShownSuccessToast, state.errorCount]);

  const resetState = useCallback(() => {
    setState({
      isConnected: true,
      lastErrorTime: 0,
      errorCount: 0,
      hasShownSuccessToast: false
    });
  }, []);

  return (
    <ConnectionNotificationContext.Provider value={{
      notifyConnectionError,
      notifyConnectionSuccess,
      notifyConnectionRestored,
      resetState
    }}>
      {children}
    </ConnectionNotificationContext.Provider>
  );
}

export function useConnectionNotification() {
  const context = useContext(ConnectionNotificationContext);
  if (context === undefined) {
    throw new Error('useConnectionNotification must be used within a ConnectionNotificationProvider');
  }
  return context;
}