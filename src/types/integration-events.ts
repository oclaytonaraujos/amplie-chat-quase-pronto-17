/**
 * Types for the integration events system with n8n
 */

export type IntegrationEventStatus = 'queued' | 'processing' | 'delivered' | 'failed';
export type IntegrationEventLevel = 'info' | 'warn' | 'error' | 'debug';

export interface IntegrationEvent {
  id: string;
  correlation_id: string;
  empresa_id: string;
  event_type: string;
  payload: any;
  status: IntegrationEventStatus;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  source: string;
  destination: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  expires_at: string;
}

export interface IntegrationEventLog {
  id: string;
  event_id: string;
  logged_at: string;
  level: IntegrationEventLevel;
  message: string;
  metadata: any;
}

export interface EmitEventRequest {
  event_type: string;
  payload: any;
  idempotency_key?: string;
}

export interface EmitEventResponse {
  correlation_id: string;
  status: 'processing' | 'duplicate' | 'error';
  message: string;
}

export interface EventCallbackRequest {
  correlation_id: string;
  status: 'delivered' | 'failed';
  result?: any;
  error_message?: string;
  metadata?: any;
}

// Specific event payloads for WhatsApp operations
export interface WhatsAppSendTextEvent {
  instanceName: string;
  telefone: string;
  mensagem: string;
  conversaId?: string;
  delay?: number;
  linkPreview?: boolean;
}

export interface WhatsAppSendMediaEvent {
  instanceName: string;
  telefone: string;
  mediaUrl: string;
  tipo: 'imagem' | 'audio' | 'video' | 'documento';
  conversaId?: string;
  caption?: string;
  fileName?: string;
}

export interface WhatsAppSendButtonsEvent {
  instanceName: string;
  telefone: string;
  mensagem: string;
  botoes: Array<{ text: string; id: string }>;
  conversaId?: string;
}

export interface WhatsAppSendListEvent {
  instanceName: string;
  telefone: string;
  mensagem: string;
  lista: Array<{ title: string; description: string; id: string }>;
  conversaId?: string;
}

// Event type mapping for type safety
export interface EventTypePayloadMap {
  'whatsapp.send.text': WhatsAppSendTextEvent;
  'whatsapp.send.media': WhatsAppSendMediaEvent;
  'whatsapp.send.buttons': WhatsAppSendButtonsEvent;
  'whatsapp.send.list': WhatsAppSendListEvent;
  'atendimento.iniciado': any;
  'atendimento.finalizado': any;
  'atendimento.transferido': any;
  'contato.criado': any;
  'mensagem.recebida': any;
}

export type EventType = keyof EventTypePayloadMap;