import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmitEventRequest {
  event_type: string
  payload: Record<string, any>
  idempotency_key?: string
}

interface EmitEventResponse {
  correlation_id: string
  status: 'queued'
  created_at: string
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

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Get user's empresa_id
    const { data: userData, error: userError } = await supabaseClient
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('User data not found')
    }

    const correlationId = crypto.randomUUID()
    const logger = createLogger(supabaseClient, correlationId, 'events-emit')

    const { event_type, payload, idempotency_key }: EmitEventRequest = await req.json()

    logger.info('Event emission requested', undefined, undefined, {
      eventType: event_type,
      hasPayload: !!payload,
      idempotencyKey: idempotency_key
    })

    // Validate required fields
    if (!event_type || !payload) {
      throw new Error('event_type and payload are required')
    }

    // Check for duplicate idempotency key if provided
    if (idempotency_key) {
      const { data: existing } = await supabaseClient
        .from('integration_events')
        .select('correlation_id, status')
        .eq('idempotency_key', idempotency_key)
        .eq('empresa_id', userData.empresa_id)
        .single()

      if (existing) {
        logger.info('Duplicate idempotency key, returning existing event', undefined, undefined, {
          existingCorrelationId: existing.correlation_id,
          status: existing.status
        })

        return new Response(
          JSON.stringify({
            correlation_id: existing.correlation_id,
            status: existing.status,
            created_at: new Date().toISOString()
          } as EmitEventResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }
    }

    // Create integration event
    const { data: eventData, error: insertError } = await supabaseClient
      .from('integration_events')
      .insert({
        correlation_id: correlationId,
        empresa_id: userData.empresa_id,
        event_type,
        payload,
        status: 'queued',
        source: 'app',
        destination: 'n8n',
        idempotency_key
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Log event creation
    await supabaseClient
      .from('integration_event_logs')
      .insert({
        event_id: eventData.id,
        level: 'info',
        message: 'Event queued for processing',
        metadata: {
          event_type,
          source: 'app',
          destination: 'n8n'
        }
      })

    logger.info('Event queued successfully', undefined, undefined, {
      eventId: eventData.id,
      eventType: event_type
    })

    // TODO: Send to n8n webhook when N8N_WEBHOOK_URL is configured
    // const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
    // if (n8nWebhookUrl) {
    //   await sendToN8n(correlationId, event_type, payload, n8nWebhookUrl)
    // }

    const response: EmitEventResponse = {
      correlation_id: correlationId,
      status: 'queued',
      created_at: eventData.created_at
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202, // Accepted
      }
    )

  } catch (error) {
    console.error('Error in events-emit:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        correlation_id: null,
        status: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})