/**
 * Hook simples para sincronização real-time
 */
import { useState, useCallback } from 'react';

interface SyncState {
  isConnected: boolean;
  lastSync: number;
  pendingOperations: number;
}

export function useRealTimeSync(table: string, filter: string) {
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: true,
    lastSync: Date.now(),
    pendingOperations: 0
  });

  const addPendingOperation = useCallback((operation: string, data: any) => {
    setSyncState(prev => ({
      ...prev,
      pendingOperations: prev.pendingOperations + 1
    }));
    
    // Simular processamento da operação
    setTimeout(() => {
      setSyncState(prev => ({
        ...prev,
        pendingOperations: Math.max(0, prev.pendingOperations - 1),
        lastSync: Date.now()
      }));
    }, 1000);
  }, []);

  const forceSync = useCallback(() => {
    setSyncState(prev => ({
      ...prev,
      lastSync: Date.now()
    }));
  }, []);

  return {
    syncState,
    addPendingOperation,
    forceSync
  };
}