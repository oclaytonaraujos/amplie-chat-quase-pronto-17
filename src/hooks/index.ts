// Unified WhatsApp hook - nova arquitetura simplificada
export { useWhatsApp } from './useWhatsApp';

// Compatibility hooks - mantém código existente funcionando
export {
  useWhatsAppConnection,
  useEvolutionApiConfig,
  useWhatsAppEvolution,
  useWhatsAppManager,
  useWhatsAppIntegration,
  useWhatsAppEvolutionContext,
  useWhatsAppUnified
} from './useWhatsAppCompatibility';

// Other hooks
export { useAuth } from './useAuth';
export { useToast } from './use-toast';
