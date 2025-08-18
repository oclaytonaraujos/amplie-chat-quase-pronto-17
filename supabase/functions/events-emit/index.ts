import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')!
const n8nSigningSecret = Deno.env.get('N8N_SIGNING_SECRET')!

interface EmitEventRequest {
  event_type: string
  payload: any
  idempotency_key?: string
}

async function createHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(payload)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const hashArray = Array.from(new Uint8Array(signature))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return `sha256=${hashHex}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Authenticate user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get user profile and empresa_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.empresa_id) {
      throw new Error('User not associated with a company')
    }

    const { event_type, payload, idempotency_key }: EmitEventRequest = await req.json()

    if (!event_type || !payload) {
      throw new Error('Missing required fields: event_type, payload')
    }

    // Generate correlation_id
    const correlationId = crypto.randomUUID()
    const finalIdempotencyKey = idempotency_key || `${correlationId}-${Date.now()}`

    // Check for duplicate idempotency key
    if (idempotency_key) {
      const { data: existing } = await supabase
        .from('integration_events')
        .select('id, correlation_id')
        .eq('idempotency_key', idempotency_key)
        .eq('empresa_id', profile.empresa_id)
        .single()

      if (existing) {
        return new Response(
          JSON.stringify({ 
            correlation_id: existing.correlation_id,
            status: 'duplicate',
            message: 'Event already processed' 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Create event record
    const { data: eventRecord, error: insertError } = await supabase
      .from('integration_events')
      .insert({
        correlation_id: correlationId,
        empresa_id: profile.empresa_id,
        event_type,
        payload,
        status: 'queued',
        idempotency_key: finalIdempotencyKey,
        source: 'system',
        destination: 'n8n'
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create event: ${insertError.message}`)
    }

    // Log event creation
    await supabase
      .from('integration_event_logs')
      .insert({
        event_id: eventRecord.id,
        level: 'info',
        message: `Event queued for processing`,
        metadata: { event_type, user_id: user.id }
      })

    // Prepare payload for n8n
    const n8nPayload = {
      correlation_id: correlationId,
      event_type,
      payload,
      empresa_id: profile.empresa_id,
      user_id: user.id,
      timestamp: new Date().toISOString()
    }

    const payloadString = JSON.stringify(n8nPayload)
    const signature = await createHmacSignature(payloadString, n8nSigningSecret)

    // Send to n8n
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Correlation-ID': correlationId
        },
        body: payloadString
      })

      if (!n8nResponse.ok) {
        throw new Error(`n8n webhook failed: ${n8nResponse.status}`)
      }

      // Update status to processing
      await supabase
        .from('integration_events')
        .update({ status: 'processing' })
        .eq('id', eventRecord.id)

      await supabase
        .from('integration_event_logs')
        .insert({
          event_id: eventRecord.id,
          level: 'info',
          message: 'Event sent to n8n successfully',
          metadata: { n8n_status: n8nResponse.status }
        })

    } catch (n8nError) {
      // Update status to failed
      await supabase
        .from('integration_events')
        .update({ 
          status: 'failed',
          error_message: `n8n webhook error: ${n8nError.message}`
        })
        .eq('id', eventRecord.id)

      await supabase
        .from('integration_event_logs')
        .insert({
          event_id: eventRecord.id,
          level: 'error',
          message: 'Failed to send event to n8n',
          metadata: { error: n8nError.message }
        })

      throw n8nError
    }

    return new Response(
      JSON.stringify({ 
        correlation_id: correlationId,
        status: 'processing',
        message: 'Event queued and sent to n8n' 
      }),
      { 
        status: 202, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in events-emit:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})