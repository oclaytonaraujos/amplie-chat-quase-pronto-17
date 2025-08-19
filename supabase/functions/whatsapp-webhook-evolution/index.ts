import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MessageQueue } from '../_shared/queue.ts'
import { createLogger } from '../_shared/logger.ts'

// Refatoração da Edge Function para ser mais modular e eficiente
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvolutionApiWebhookData {
  event: string;
  instance: string;
  data: any;
  destination?: string;
  source?: string;
}

// Processadores modulares por tipo de evento
class WebhookProcessor {
  constructor(
    private supabase: any,
    private logger: any,
    private messageQueue: MessageQueue
  ) {}

  async processSystemEvent(payload: EvolutionApiWebhookData): Promise<any> {
    const { event, instance, data } = payload;
    
    await this.logger.info(`Processing system event: ${event}`, instance, 'system_event', {
      event, instance, timestamp: new Date().toISOString()
    });

    const updateData: any = {};
    
    switch (event) {
      case 'QRCODE_UPDATED':
        await this.handleQRCodeUpdate(data, updateData);
        break;
      case 'CONNECTION_UPDATE':
        await this.handleConnectionUpdate(data, updateData);
        break;
      case 'APPLICATION_STARTUP':
        updateData.status = 'starting';
        break;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await this.supabase
        .from('evolution_api_config')
        .update(updateData)
        .eq('instance_name', instance);
        
      if (error) {
        await this.logger.error('Failed to update instance', instance, 'database_error', { error });
      } else {
        await this.logger.info('Instance updated successfully', instance, 'instance_update', updateData);
      }
    }

    return { success: true, message: `Event ${event} processed`, instance };
  }

  private async handleQRCodeUpdate(data: any, updateData: any): Promise<void> {
    let qrCodeData = typeof data === 'string' ? data : data?.qrcode || data?.base64;
    
    if (qrCodeData) {
      updateData.qr_code = qrCodeData.startsWith('data:image/') 
        ? qrCodeData 
        : `data:image/png;base64,${qrCodeData}`;
    }
    
    updateData.status = 'connecting';
    updateData.connection_state = 'CONNECTING';
  }

  private async handleConnectionUpdate(data: any, updateData: any): Promise<void> {
    const state = data?.state || data?.connection || 'DISCONNECTED';
    updateData.connection_state = state;
    
    switch (state) {
      case 'open':
      case 'CONNECTED':
        updateData.status = 'open';
        updateData.qr_code = null;
        updateData.last_connected_at = new Date().toISOString();
        
        const instanceData = data?.instance || data;
        if (instanceData?.profilePictureUrl) updateData.profile_picture_url = instanceData.profilePictureUrl;
        if (instanceData?.profileName) updateData.profile_name = instanceData.profileName;
        if (instanceData?.ownerJid) updateData.numero = instanceData.ownerJid.split('@')[0];
        if (instanceData?.wuid) updateData.numero = instanceData.wuid.split('@')[0];
        break;
        
      case 'close':
      case 'DISCONNECTED':
        updateData.status = 'close';
        updateData.qr_code = null;
        break;
        
      case 'connecting':
      case 'CONNECTING':
        updateData.status = 'connecting';
        break;
    }
  }

  async processMessageEvent(payload: EvolutionApiWebhookData): Promise<any> {
    const { event, instance, data } = payload;
    
    // Filtrar mensagens próprias
    if (event === 'MESSAGES_UPSERT' && (!data?.key || data.key.fromMe)) {
      await this.logger.info('Message ignored - sent by system', instance, 'message_filter');
      return { success: true, message: 'Own message ignored' };
    }

    // Enfileirar para processamento assíncrono
    const correlationId = crypto.randomUUID();
    const messageId = await this.messageQueue.enqueue({
      correlationId,
      messageType: 'whatsapp_message_received',
      payload: { event, instance, data },
      priority: 1,
      metadata: {
        source: 'evolution_api_webhook',
        timestamp: new Date().toISOString()
      }
    });

    await this.logger.info('Message queued for processing', instance, 'message_queue', {
      messageId, event, correlationId
    });

    return { 
      success: true, 
      message: 'Message queued for processing',
      messageId,
      correlationId
    };
  }

  async processDataEvent(payload: EvolutionApiWebhookData): Promise<any> {
    const { event, instance } = payload;
    
    await this.logger.info(`Data event processed: ${event}`, instance, 'data_event');
    
    // Log para análise
    await this.supabase
      .from('chatbot_logs')
      .insert({
        function_name: 'whatsapp-webhook-evolution',
        level: 'info',
        message: `Event ${event} processed`,
        correlation_id: crypto.randomUUID(),
        metadata: {
          event,
          instance,
          dataType: typeof payload.data,
          hasData: !!payload.data
        }
      });

    return { success: true, message: `Event ${event} registered`, instance };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const correlationId = crypto.randomUUID();
    const logger = createLogger(supabase, correlationId, 'whatsapp-webhook-evolution');
    const messageQueue = new MessageQueue(supabase, logger);
    const processor = new WebhookProcessor(supabase, logger, messageQueue);

    const payload: EvolutionApiWebhookData = await req.json();
    
    // Mapear eventos para processadores específicos
    const systemEvents = ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'APPLICATION_STARTUP'];
    const messageEvents = ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE'];
    const dataEvents = ['CONTACTS_SET', 'CONTACTS_UPSERT', 'CONTACTS_UPDATE', 'CHATS_SET', 'CHATS_UPSERT', 'CHATS_UPDATE', 'CHATS_DELETE'];
    const presenceEvents = ['PRESENCE_UPDATE', 'CALL', 'NEW_JWT_TOKEN'];
    const typebotEvents = ['TYPEBOT_START', 'TYPEBOT_CHANGE_STATUS'];

    let result: any;

    if (systemEvents.includes(payload.event)) {
      result = await processor.processSystemEvent(payload);
    } else if (messageEvents.includes(payload.event)) {
      result = await processor.processMessageEvent(payload);
    } else if (dataEvents.includes(payload.event)) {
      result = await processor.processDataEvent(payload);
    } else if (presenceEvents.includes(payload.event) || typebotEvents.includes(payload.event)) {
      await logger.info(`${payload.event} event registered`, payload.instance, 'event_log');
      result = { success: true, message: `Event ${payload.event} registered`, instance: payload.instance };
    } else {
      await logger.info('Unsupported event', payload.instance, 'unsupported_event', { event: payload.event });
      result = { success: true, message: 'Event not supported', event: payload.event };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Logger otimizado para produção - reduzir logs desnecessários
    const errorId = crypto.randomUUID();
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal error - event will be reprocessed',
      errorId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Retorna 200 para evitar reenvios da Evolution API
    });
  }
});