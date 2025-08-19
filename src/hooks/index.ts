// Hooks simplificados para n8n
export { useAtendimentoReal } from './useAtendimentoReal';

// Compatibility hooks - mantém código existente funcionando
export {
  useWhatsAppConnection,
  useWhatsAppEvolution,
  useWhatsAppManager,
  useWhatsAppIntegration,
  useWhatsAppEvolutionContext,
  useWhatsAppUnified
} from './useWhatsAppCompatibility';

// Other hooks
export { useAuth } from './useAuth';
export { useToast } from './use-toast';
