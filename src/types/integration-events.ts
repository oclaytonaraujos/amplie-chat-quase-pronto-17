// Types for integration events system

export interface IntegrationEvent {
  id: string;
  correlation_id: string;
  empresa_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'queued' | 'processing' | 'delivered' | 'failed';
  error_message?: string;
  retry_count: number;
  max_retries: number;
  source: string;
  destination: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  delivered_at?: string;
}

export interface IntegrationEventLog {
  id: string;
  event_id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, any>;
  logged_at: string;
}

export interface EmitEventRequest {
  event_type: string;
  payload: Record<string, any>;
  idempotency_key?: string;
}

export interface EmitEventResponse {
  correlation_id: string;
  status: 'queued' | 'error';
  created_at: string;
  error?: string;
}

// WhatsApp event types
export type EventType = 
  | 'whatsapp.send.text'
  | 'whatsapp.send.media'
  | 'whatsapp.send.buttons'
  | 'whatsapp.send.list'
  | 'whatsapp.received.message'
  | 'whatsapp.status.update';

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

export interface EventTypePayloadMap {
  'whatsapp.send.text': WhatsAppSendTextEvent;
  'whatsapp.send.media': WhatsAppSendMediaEvent;
  'whatsapp.send.buttons': WhatsAppSendButtonsEvent;
  'whatsapp.send.list': WhatsAppSendListEvent;
  'whatsapp.received.message': any;
  'whatsapp.status.update': any;
}

// Event status helpers
export const EVENT_STATUS_LABELS = {
  queued: 'Na fila',
  processing: 'Processando',
  delivered: 'Entregue',
  failed: 'Falhou'
} as const;

export const EVENT_STATUS_COLORS = {
  queued: 'text-yellow-600',
  processing: 'text-blue-600',
  delivered: 'text-green-600',
  failed: 'text-red-600'
} as const;