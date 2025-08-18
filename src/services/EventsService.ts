import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/structured-logger';
import type {
  EmitEventRequest,
  EmitEventResponse,
  IntegrationEvent,
  IntegrationEventLog,
  EventType,
  EventTypePayloadMap,
  WhatsAppSendTextEvent,
  WhatsAppSendMediaEvent,
  WhatsAppSendButtonsEvent,
  WhatsAppSendListEvent
} from '@/types/integration-events';

class EventsServiceClass {
  private static instance: EventsServiceClass;
  private subscribers: Map<string, Set<(event: IntegrationEvent) => void>> = new Map();
  private realtimeChannel: any = null;

  private constructor() {
    this.initializeRealTime();
  }

  static getInstance(): EventsServiceClass {
    if (!EventsServiceClass.instance) {
      EventsServiceClass.instance = new EventsServiceClass();
    }
    return EventsServiceClass.instance;
  }

  // Core event emission
  async emitEvent<T extends EventType>(
    eventType: T,
    payload: EventTypePayloadMap[T],
    idempotencyKey?: string
  ): Promise<EmitEventResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('events-emit', {
        body: {
          event_type: eventType,
          payload,
          idempotency_key: idempotencyKey
        } as EmitEventRequest
      });

      if (error) throw error;

      logger.info('Event emitted successfully', {
        metadata: {
          eventType,
          correlationId: data.correlation_id,
          status: data.status
        }
      });

      return data;
    } catch (error) {
      logger.error('Failed to emit event', {
        metadata: {
          eventType,
          payload: typeof payload === 'object' ? Object.keys(payload) : payload
        }
      }, error as Error);
      throw error;
    }
  }

  // WhatsApp specific methods
  async sendTextMessage(
    instanceName: string,
    telefone: string,
    mensagem: string,
    options?: {
      conversaId?: string;
      delay?: number;
      linkPreview?: boolean;
      idempotencyKey?: string;
    }
  ): Promise<EmitEventResponse> {
    const payload: WhatsAppSendTextEvent = {
      instanceName,
      telefone,
      mensagem,
      conversaId: options?.conversaId,
      delay: options?.delay || 0,
      linkPreview: options?.linkPreview ?? true
    };

    return this.emitEvent('whatsapp.send.text', payload, options?.idempotencyKey);
  }

  async sendMediaMessage(
    instanceName: string,
    telefone: string,
    mediaUrl: string,
    tipo: 'imagem' | 'audio' | 'video' | 'documento',
    options?: {
      conversaId?: string;
      caption?: string;
      fileName?: string;
      idempotencyKey?: string;
    }
  ): Promise<EmitEventResponse> {
    const payload: WhatsAppSendMediaEvent = {
      instanceName,
      telefone,
      mediaUrl,
      tipo,
      conversaId: options?.conversaId,
      caption: options?.caption,
      fileName: options?.fileName
    };

    return this.emitEvent('whatsapp.send.media', payload, options?.idempotencyKey);
  }

  async sendButtonsMessage(
    instanceName: string,
    telefone: string,
    mensagem: string,
    botoes: Array<{ text: string; id: string }>,
    options?: {
      conversaId?: string;
      idempotencyKey?: string;
    }
  ): Promise<EmitEventResponse> {
    const payload: WhatsAppSendButtonsEvent = {
      instanceName,
      telefone,
      mensagem,
      botoes,
      conversaId: options?.conversaId
    };

    return this.emitEvent('whatsapp.send.buttons', payload, options?.idempotencyKey);
  }

  async sendListMessage(
    instanceName: string,
    telefone: string,
    mensagem: string,
    lista: Array<{ title: string; description: string; id: string }>,
    options?: {
      conversaId?: string;
      idempotencyKey?: string;
    }
  ): Promise<EmitEventResponse> {
    const payload: WhatsAppSendListEvent = {
      instanceName,
      telefone,
      mensagem,
      lista,
      conversaId: options?.conversaId
    };

    return this.emitEvent('whatsapp.send.list', payload, options?.idempotencyKey);
  }

  // Event tracking and observability
  async getEventStatus(correlationId: string): Promise<IntegrationEvent | null> {
    try {
      const { data, error } = await supabase
        .from('integration_events' as any)
        .select('*')
        .eq('correlation_id', correlationId)
        .single();

      if (error) throw error;
      return data as unknown as IntegrationEvent;
    } catch (error) {
      logger.error('Failed to get event status', { 
        metadata: { correlationId } 
      }, error as Error);
      return null;
    }
  }

  async getEventLogs(eventId: string): Promise<IntegrationEventLog[]> {
    try {
      const { data, error } = await supabase
        .from('integration_event_logs' as any)
        .select('*')
        .eq('event_id', eventId)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as IntegrationEventLog[];
    } catch (error) {
      logger.error('Failed to get event logs', { 
        metadata: { eventId } 
      }, error as Error);
      return [];
    }
  }

  async getEvents(filters?: {
    eventType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<IntegrationEvent[]> {
    try {
      let query = supabase
        .from('integration_events' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.eventType) {
        query = query.eq('event_type', filters.eventType);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as IntegrationEvent[];
    } catch (error) {
      logger.error('Failed to get events', { 
        metadata: { filters } 
      }, error as Error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToEvent(correlationId: string, callback: (event: IntegrationEvent) => void): () => void {
    if (!this.subscribers.has(correlationId)) {
      this.subscribers.set(correlationId, new Set());
    }
    
    this.subscribers.get(correlationId)!.add(callback);
    
    return () => {
      const subs = this.subscribers.get(correlationId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(correlationId);
        }
      }
    };
  }

  private initializeRealTime() {
    if (this.realtimeChannel) return;

    this.realtimeChannel = supabase
      .channel('integration_events')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'integration_events' as any
        },
        (payload) => {
          const event = payload.new as IntegrationEvent;
          const subscribers = this.subscribers.get(event.correlation_id);
          
          if (subscribers) {
            subscribers.forEach(callback => callback(event));
          }
        }
      )
      .on(
        'broadcast',
        { event: 'event_updated' },
        (payload) => {
          const { correlation_id } = payload.payload;
          const subscribers = this.subscribers.get(correlation_id);
          
          if (subscribers) {
            // Refetch the event to get the latest data
            this.getEventStatus(correlation_id).then(event => {
              if (event) {
                subscribers.forEach(callback => callback(event));
              }
            });
          }
        }
      )
      .subscribe();
  }

  // Cleanup
  destroy() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.subscribers.clear();
  }
}

export const EventsService = EventsServiceClass.getInstance();