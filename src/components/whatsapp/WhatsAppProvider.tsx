import React from 'react';

/**
 * Wrapper para compatibilidade com código existente
 * O novo useWhatsApp() hook funciona sem provider
 */
interface WhatsAppProviderProps {
  children: React.ReactNode;
}

export function WhatsAppProvider({ children }: WhatsAppProviderProps) {
  return <>{children}</>;
}

// Exports para compatibilidade
export { WhatsAppProvider as WhatsAppEvolutionProvider };
export { WhatsAppProvider as WhatsAppUnifiedProvider };
export { WhatsAppProvider as WhatsAppConnectionProvider };
export { WhatsAppProvider as EvolutionApiProvider };