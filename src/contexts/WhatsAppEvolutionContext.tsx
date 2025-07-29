import React, { createContext, useContext, ReactNode } from 'react';
import { useWhatsAppEvolution } from '@/hooks/useWhatsAppEvolution';

/**
 * Contexto unificado para WhatsApp Evolution API
 * Substitui WhatsAppConnectionContext e EvolutionApiContext
 */
const WhatsAppEvolutionContext = createContext<ReturnType<typeof useWhatsAppEvolution> | undefined>(undefined);

interface WhatsAppEvolutionProviderProps {
  children: ReactNode;
}

export function WhatsAppEvolutionProvider({ children }: WhatsAppEvolutionProviderProps) {
  const whatsAppEvolution = useWhatsAppEvolution();

  return (
    <WhatsAppEvolutionContext.Provider value={whatsAppEvolution}>
      {children}
    </WhatsAppEvolutionContext.Provider>
  );
}

export function useWhatsAppEvolutionContext() {
  const context = useContext(WhatsAppEvolutionContext);
  if (context === undefined) {
    throw new Error('useWhatsAppEvolutionContext must be used within a WhatsAppEvolutionProvider');
  }
  return context;
}

// Re-export do hook principal para compatibilidade
export { useWhatsAppEvolution };