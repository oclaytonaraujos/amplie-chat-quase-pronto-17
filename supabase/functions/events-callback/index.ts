import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const n8nSigningSecret = Deno.env.get('N8N_SIGNING_SECRET')!

interface CallbackRequest {
  correlation_id: string
  status: 'delivered' | 'failed'
  result?: any
  error_message?: string
  metadata?: any
}

async function verifyHmacSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(payload)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    // Extract hash from signature (format: sha256=hash)
    const expectedHash = signature.replace('sha256=', '')
    const expectedBytes = new Uint8Array(
      expectedHash.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []
    )
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      expectedBytes,
      messageData
    )
    
    return isValid
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify signature
    const signature = req.headers.get('X-Signature')
    if (!signature) {
      throw new Error('Missing X-Signature header')
    }

    const payloadText = await req.text()
    const isValidSignature = await verifyHmacSignature(payloadText, signature, n8nSigningSecret)
    
    if (!isValidSignature) {
      throw new Error('Invalid signature')
    }

    const { correlation_id, status, result, error_message, metadata }: CallbackRequest = JSON.parse(payloadText)

    if (!correlation_id || !status) {
      throw new Error('Missing required fields: correlation_id, status')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find the event
    const { data: event, error: findError } = await supabase
      .from('integration_events')
      .select('*')
      .eq('correlation_id', correlation_id)
      .single()

    if (findError || !event) {
      throw new Error(`Event not found: ${correlation_id}`)
    }

    // Update event status
    const updateData: any = {
      status,
      processed_at: new Date().toISOString()
    }

    if (status === 'failed' && error_message) {
      updateData.error_message = error_message
    }

    if (result) {
      updateData.payload = {
        ...event.payload,
        result
      }
    }

    const { error: updateError } = await supabase
      .from('integration_events')
      .update(updateData)
      .eq('id', event.id)

    if (updateError) {
      throw new Error(`Failed to update event: ${updateError.message}`)
    }

    // Log the callback
    await supabase
      .from('integration_event_logs')
      .insert({
        event_id: event.id,
        level: status === 'delivered' ? 'info' : 'error',
        message: status === 'delivered' 
          ? 'Event processed successfully by n8n'
          : `Event processing failed: ${error_message || 'Unknown error'}`,
        metadata: {
          callback_data: { status, result, error_message, metadata },
          processed_by: 'n8n'
        }
      })

    // Broadcast real-time update
    await supabase
      .channel(`events:${event.empresa_id}`)
      .send({
        type: 'broadcast',
        event: 'event_updated',
        payload: {
          correlation_id,
          status,
          event_type: event.event_type,
          processed_at: updateData.processed_at,
          result,
          error_message
        }
      })

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'Callback processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in events-callback:', error)
    
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