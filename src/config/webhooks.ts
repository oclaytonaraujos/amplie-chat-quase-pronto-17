/**
 * Configurações centralizadas de webhooks
 * Mantém URLs consistentes em toda a aplicação
 */

// URL base do projeto Supabase
const SUPABASE_PROJECT_URL = 'https://obtpghqvrygzcukdaiej.supabase.co';

export const WEBHOOK_URLS = {
  // Evolution API Webhook - usar sempre a edge function
  EVOLUTION_API: `${SUPABASE_PROJECT_URL}/functions/v1/whatsapp-webhook-evolution`,
  
  // Webhook genérico do WhatsApp (compatibilidade)
  WHATSAPP_GENERIC: `${SUPABASE_PROJECT_URL}/functions/v1/whatsapp-webhook`,
  
  // N8N webhooks (se necessário)
  N8N_RECEIVE: (instanceName: string) => `${SUPABASE_PROJECT_URL}/functions/v1/n8n-webhook-receive/${instanceName}`,
  N8N_SEND: (instanceName: string) => `${SUPABASE_PROJECT_URL}/functions/v1/n8n-webhook-send/${instanceName}`,
} as const;

export const WEBHOOK_EVENTS = [
  'APPLICATION_STARTUP',
  'MESSAGES_UPSERT', 
  'MESSAGE_STATUS_UPDATE',
  'CONNECTION_UPDATE', 
  'QRCODE_UPDATED'
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];