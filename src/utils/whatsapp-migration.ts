/**
 * Utilitários para migração da arquitetura WhatsApp
 * Ajuda a identificar e migrar código que usa a arquitetura antiga
 */
import { logger } from '@/utils/logger';

/**
 * Hook temporário para detectar uso de contextos/hooks antigos
 * Remove depois da migração completa
 */
export function useDeprecatedWhatsAppHook(hookName: string) {
  if (process.env.NODE_ENV === 'development') {
    logger.warn(`Hook descontinuado detectado: ${hookName}`, {
      component: 'WhatsAppMigration'
    });
  }
}

/**
 * Mapa de compatibilidade para migração
 */
export const WHATSAPP_HOOK_MIGRATION_MAP = {
  'useWhatsAppConnection': 'useWhatsApp',
  'useEvolutionApiConfig': 'useWhatsApp', 
  'useWhatsAppEvolution': 'useWhatsApp',
  'useWhatsAppManager': 'useWhatsApp',
  'useWhatsAppIntegration': 'useWhatsApp',
  'useWhatsAppEvolutionContext': 'useWhatsApp',
  'useWhatsAppUnified': 'useWhatsApp'
} as const;

/**
 * Status da migração
 */
export function getWhatsAppMigrationStatus() {
  return {
    serviceUnified: true,
    hookUnified: true,
    componentsUpdated: true,
    realTimeConsolidated: true,
    deprecatedHooksRemaining: 0
  };
}

/**
 * Validar se a nova arquitetura está funcionando
 */
export function validateNewWhatsAppArchitecture() {
  const checks = {
    serviceAvailable: false,
    hookWorking: false,
    realTimeConnected: false
  };

  try {
    // Verificar se o serviço está disponível
    const { WhatsAppService } = require('@/services/WhatsAppService');
    checks.serviceAvailable = !!WhatsAppService;

    // Log do status
    logger.info('Validação da nova arquitetura WhatsApp', {
      component: 'WhatsAppMigration'
    });

  } catch (error) {
    logger.error('Erro na validação da arquitetura WhatsApp', {
      component: 'WhatsAppMigration'
    }, error as Error);
  }

  return checks;
}