/**
 * Tipos para integração com n8n
 * Define eventos do sistema e configurações de webhook
 */

export interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  example_payload: any;
  enabled: boolean;
  webhook_url?: string;
}

export interface SystemWebhookEvents {
  'atendimento.iniciado': {
    conversa_id: string;
    contato: {
      id: string;
      nome: string;
      telefone: string;
      email?: string;
    };
    agente?: {
      id: string;
      nome: string;
      email: string;
    };
    setor?: string;
    timestamp: string;
    metadata?: any;
  };
  'atendimento.finalizado': {
    conversa_id: string;
    contato: {
      id: string;
      nome: string;
      telefone: string;
    };
    agente: {
      id: string;
      nome: string;
      email: string;
    };
    duracao_minutos: number;
    status_final: string;
    timestamp: string;
    metadata?: any;
  };
  'atendimento.transferido': {
    conversa_id: string;
    contato: {
      id: string;
      nome: string;
      telefone: string;
    };
    de_agente?: {
      id: string;
      nome: string;
    };
    para_agente?: {
      id: string;
      nome: string;
    };
    setor_origem?: string;
    setor_destino?: string;
    motivo?: string;
    timestamp: string;
  };
  'contato.criado': {
    contato: {
      id: string;
      nome: string;
      telefone?: string;
      email?: string;
      empresa?: string;
      tags?: string[];
    };
    criado_por: {
      id: string;
      nome: string;
    };
    timestamp: string;
  };
  'mensagem.recebida': {
    conversa_id: string;
    contato: {
      id: string;
      nome: string;
      telefone: string;
    };
    mensagem: {
      id: string;
      conteudo: string;
      tipo: string;
      metadata?: any;
    };
    timestamp: string;
  };
}

export interface N8nConfiguration {
  id: string;
  empresa_id: string;
  instance_url: string;
  api_key?: string;
  webhook_receive_url?: string;
  webhook_send_url?: string;
  status: 'active' | 'inactive' | 'error';
  settings: {
    events: {
      [K in keyof SystemWebhookEvents]?: {
        enabled: boolean;
        webhook_url?: string;
        last_triggered?: string;
        success_count: number;
        error_count: number;
      };
    };
  };
  last_ping?: string;
  workflow_count?: number;
  total_executions?: number;
  success_rate?: number;
  created_at: string;
  updated_at: string;
}

export type WebhookEventKey = keyof SystemWebhookEvents;

export interface WebhookTestResult {
  success: boolean;
  status_code?: number;
  response_time_ms?: number;
  error_message?: string;
  timestamp: string;
}

export interface N8nStats {
  total_workflows: number;
  active_workflows: number;
  total_executions_today: number;
  success_rate_today: number;
  avg_execution_time_ms: number;
  last_execution?: string;
  webhook_events: {
    [K in WebhookEventKey]?: {
      total_triggers: number;
      success_rate: number;
      last_triggered?: string;
    };
  };
}