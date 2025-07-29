
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'
import { MessageQueue } from '../_shared/queue.ts'

// Function to move failed messages to dead letter queue
async function moveToDeadLetterQueue(supabase: any, queuedMessage: any, errorMessage: string, logger: any) {
  try {
    await supabase
      .from('failed_messages')
      .insert({
        original_message_id: queuedMessage.id,
        correlation_id: queuedMessage.correlation_id,
        message_type: queuedMessage.message_type,
        payload: queuedMessage.payload,
        error_message: errorMessage,
        failure_count: queuedMessage.retry_count + 1,
        metadata: queuedMessage.metadata || {}
      });
    
    await logger.info('Message moved to dead letter queue', undefined, undefined, {
      messageId: queuedMessage.id,
      errorMessage
    });
  } catch (dlqError) {
    await logger.error('Failed to move message to dead letter queue', undefined, undefined, {
      messageId: queuedMessage.id,
      dlqError: dlqError.message
    });
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const logger = createLogger(supabase, correlationId, 'chatbot-queue-processor');

  try {
    let triggerSource = 'unknown';
    
    // Tentar obter informações sobre o trigger
    try {
      const body = await req.json();
      triggerSource = body?.trigger || 'unknown';
    } catch {
      triggerSource = 'no-body';
    }

    await logger.info('Queue processor started', undefined, undefined, {
      triggerSource,
      correlationId
    });

    const messageQueue = new MessageQueue(supabase, logger);
    const processedMessages = [];
    const maxMessages = triggerSource === 'scheduler' ? 5 : 10; // Processar menos mensagens quando chamado pelo scheduler
    
    for (let i = 0; i < maxMessages; i++) {
      const queuedMessage = await messageQueue.dequeue();
      if (!queuedMessage) {
        break; // No more messages to process
      }

      const messageCorrelationId = queuedMessage.correlation_id;
      const messageLogger = createLogger(supabase, messageCorrelationId, 'chatbot-queue-processor');

      try {
        await messageLogger.info('Processing queued message', undefined, undefined, {
          messageId: queuedMessage.id,
          messageType: queuedMessage.message_type,
          retryCount: queuedMessage.retry_count,
          triggerSource
        });

        // Route to appropriate processor based on message type
        let processorUrl;
        if (queuedMessage.message_type === 'whatsapp_message_received') {
          processorUrl = `${supabaseUrl}/functions/v1/whatsapp-message-processor`;
        } else {
          processorUrl = `${supabaseUrl}/functions/v1/chatbot-engine`;
        }

        const engineResponse = await fetch(processorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'X-Correlation-ID': messageCorrelationId
          },
          body: JSON.stringify(queuedMessage.payload)
        });

        if (engineResponse.ok) {
          const engineResult = await engineResponse.json();
          await messageQueue.markCompleted(queuedMessage.id);
          
          await messageLogger.info('Message processed successfully', undefined, undefined, {
            messageId: queuedMessage.id,
            result: engineResult
          });

          processedMessages.push({
            id: queuedMessage.id,
            status: 'completed',
            result: engineResult
          });
        } else {
          const errorText = await engineResponse.text();
          const shouldRetry = queuedMessage.retry_count < queuedMessage.max_retries;
          
          await messageQueue.markFailed(queuedMessage.id, errorText, shouldRetry);
          
          // If max retries exceeded, move to dead letter queue
          if (!shouldRetry) {
            await moveToDeadLetterQueue(supabase, queuedMessage, errorText, messageLogger);
          }
          
          await messageLogger.error('Message processing failed', undefined, undefined, {
            messageId: queuedMessage.id,
            error: errorText,
            shouldRetry,
            retryCount: queuedMessage.retry_count
          });

          processedMessages.push({
            id: queuedMessage.id,
            status: shouldRetry ? 'retrying' : 'failed',
            error: errorText
          });
        }
      } catch (error) {
        const shouldRetry = queuedMessage.retry_count < queuedMessage.max_retries;
        await messageQueue.markFailed(queuedMessage.id, error.message, shouldRetry);
        
        // If max retries exceeded, move to dead letter queue
        if (!shouldRetry) {
          await moveToDeadLetterQueue(supabase, queuedMessage, error.message, messageLogger);
        }
        
        await messageLogger.error('Unexpected error processing message', undefined, undefined, {
          messageId: queuedMessage.id,
          error: error.message,
          shouldRetry,
          retryCount: queuedMessage.retry_count
        });

        processedMessages.push({
          id: queuedMessage.id,
          status: shouldRetry ? 'retrying' : 'failed',
          error: error.message
        });
      }
    }

    await logger.info('Queue processing completed', undefined, undefined, {
      processedCount: processedMessages.length,
      results: processedMessages,
      triggerSource,
      maxMessages
    });

    return new Response(JSON.stringify({
      success: true,
      processedCount: processedMessages.length,
      results: processedMessages,
      correlationId,
      triggerSource
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await logger.error('Queue processor error', undefined, undefined, {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Queue processor error',
      correlationId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
