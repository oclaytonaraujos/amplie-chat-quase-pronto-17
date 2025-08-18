import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
}

interface CallbackRequest {
  correlation_id: string
  status: 'processing' | 'delivered' | 'failed'
  error_message?: string
  result?: Record<string, any>
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      correlation_id, 
      status, 
      error_message, 
      result,
      metadata 
    }: CallbackRequest = await req.json()

    // Validate required fields
    if (!correlation_id || !status) {
      throw new Error('correlation_id and status are required')
    }

    const logger = createLogger(supabaseClient, correlation_id, 'events-callback')

    logger.info('Event callback received', undefined, undefined, {
      status,
      hasError: !!error_message,
      hasResult: !!result
    })

    // TODO: Verify HMAC signature when N8N_SIGNING_SECRET is configured
    // const signature = req.headers.get('X-Signature')
    // const signingSecret = Deno.env.get('N8N_SIGNING_SECRET')
    // if (signingSecret && signature) {
    //   const isValid = await verifyHmacSignature(
    //     await req.text(), 
    //     signature, 
    //     signingSecret
    //   )
    //   if (!isValid) {
    //     throw new Error('Invalid signature')
    //   }
    // }

    // Find the event
    const { data: eventData, error: findError } = await supabaseClient
      .from('integration_events')
      .select('*')
      .eq('correlation_id', correlation_id)
      .single()

    if (findError || !eventData) {
      throw new Error(`Event not found: ${correlation_id}`)
    }

    // Update event status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (error_message) {
      updateData.error_message = error_message
    }

    if (status === 'failed') {
      updateData.retry_count = (eventData.retry_count || 0) + 1
    }

    const { error: updateError } = await supabaseClient
      .from('integration_events')
      .update(updateData)
      .eq('id', eventData.id)

    if (updateError) {
      throw updateError
    }

    // Add log entry
    await supabaseClient
      .from('integration_event_logs')
      .insert({
        event_id: eventData.id,
        level: status === 'failed' ? 'error' : 'info',
        message: error_message || `Event status updated to ${status}`,
        metadata: {
          status,
          result,
          ...metadata
        }
      })

    // Broadcast real-time update
    await supabaseClient
      .channel('integration_events')
      .send({
        type: 'broadcast',
        event: 'event_updated',
        payload: {
          correlation_id,
          status,
          error_message,
          result
        }
      })

    logger.info('Event callback processed successfully', undefined, undefined, {
      eventId: eventData.id,
      newStatus: status
    })

    return new Response(
      JSON.stringify({ success: true, correlation_id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in events-callback:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})