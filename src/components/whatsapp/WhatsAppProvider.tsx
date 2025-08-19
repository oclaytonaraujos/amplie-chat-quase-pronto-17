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

export { WhatsAppProvider as N8nProvider };