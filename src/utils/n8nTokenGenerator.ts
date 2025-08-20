/**
 * Gerador de tokens de autenticação para N8N
 */

export function generateN8nToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `n8n_${result}`;
}

export function getSystemUrls(): {
  webhookReceive: string;
  instanceStatus: string;
  logs: string;
} {
  const baseUrl = 'https://obtpghqvrygzcukdaiej.supabase.co/functions/v1';
  
  return {
    webhookReceive: `${baseUrl}/n8n-webhook-receive`,
    instanceStatus: `${baseUrl}/n8n-instance-status`,
    logs: `${baseUrl}/n8n-logs`
  };
}