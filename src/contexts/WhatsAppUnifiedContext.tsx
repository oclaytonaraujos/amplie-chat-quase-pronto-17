import React, { createContext, useContext, ReactNode } from 'react';
import { useWhatsAppManager } from '@/hooks/useWhatsAppManager';

/**
 * Contexto unificado e simplificado para WhatsApp
 * Substitui os múltiplos contextos anteriores por um único ponto de acesso
 */
const WhatsAppUnifiedContext = createContext<ReturnType<typeof useWhatsAppManager> | undefined>(undefined);

interface WhatsAppUnifiedProviderProps {
  children: ReactNode;
}

export function WhatsAppUnifiedProvider({ children }: WhatsAppUnifiedProviderProps) {
  const whatsappManager = useWhatsAppManager();

  return (
    <WhatsAppUnifiedContext.Provider value={whatsappManager}>
      {children}
    </WhatsAppUnifiedContext.Provider>
  );
}

export function useWhatsAppUnified() {
  const context = useContext(WhatsAppUnifiedContext);
  if (context === undefined) {
    throw new Error('useWhatsAppUnified must be used within a WhatsAppUnifiedProvider');
  }
  return context;
}

// Aliases para compatibilidade (podem ser removidos após migração completa)
export { useWhatsAppUnified as useWhatsAppConnection };
export { useWhatsAppUnified as useWhatsAppEvolution };
export { WhatsAppUnifiedProvider as WhatsAppProvider };