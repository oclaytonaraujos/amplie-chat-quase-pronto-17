import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('N8N Webhook recebido:', body)

    const { type, action, data, empresa_id, webhook_type } = body

    await supabase
      .from('integration_events')
      .insert({
        correlation_id: crypto.randomUUID(),
        event_type: 'n8n_webhook_received',
        payload: body,
        empresa_id: empresa_id,
        source: 'n8n',
        destination: 'app'
      })

    let result = null
    
    switch (webhook_type || type) {
      case 'messages':
        result = await processMessage(supabase, data, empresa_id)
        break
      case 'instances':
        result = await processInstance(supabase, data, empresa_id, action)
        break
      case 'chatbot':
        result = await processChatbot(supabase, data, empresa_id, action)
        break
      default:
        throw new Error(`Tipo de webhook não suportado: ${webhook_type || type}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        processed_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Erro no webhook N8N:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

async function processMessage(supabase: any, data: any, empresa_id: string) {
  console.log('Processando mensagem:', data)
  
  if (data.action === 'send') {
    if (data.message_id) {
      await supabase
        .from('mensagens')
        .update({ 
          status: data.success ? 'enviada' : 'falha_envio',
          metadata: data.metadata || {}
        })
        .eq('id', data.message_id)
    }
  } else if (data.action === 'receive') {
    const { error } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: data.conversa_id,
        remetente: data.from,
        conteudo: data.content,
        tipo: data.type || 'text',
        timestamp_whatsapp: data.timestamp,
        empresa_id: empresa_id,
        metadata: data.metadata || {}
      })
    
    if (error) throw error
  }
  
  return { processed: true, action: data.action }
}

async function processInstance(supabase: any, data: any, empresa_id: string, action: string) {
  console.log('Processando instância:', { data, action })
  
  switch (action) {
    case 'created':
      await supabase
        .from('evolution_api_config')
        .update({
          status: 'connected',
          qr_code: data.qr_code,
          connection_state: 'CONNECTED'
        })
        .eq('instance_name', data.instance_name)
        .eq('empresa_id', empresa_id)
      break
      
    case 'qr_updated':
      await supabase
        .from('evolution_api_config')
        .update({
          qr_code: data.qr_code,
          status: 'waiting_qr'
        })
        .eq('instance_name', data.instance_name)
        .eq('empresa_id', empresa_id)
      break
      
    case 'connection_update':
      await supabase
        .from('evolution_api_config')
        .update({
          connection_state: data.state,
          status: data.state === 'open' ? 'connected' : 'disconnected',
          numero: data.phone_number,
          profile_name: data.profile_name
        })
        .eq('instance_name', data.instance_name)
        .eq('empresa_id', empresa_id)
      break
      
    case 'deleted':
      await supabase
        .from('evolution_api_config')
        .delete()
        .eq('instance_name', data.instance_name)
        .eq('empresa_id', empresa_id)
      break
  }
  
  return { processed: true, action, instance: data.instance_name }
}

async function processChatbot(supabase: any, data: any, empresa_id: string, action: string) {
  console.log('Processando chatbot:', { data, action })
  
  switch (action) {
    case 'flow_executed':
      await supabase.rpc('increment_chatbot_interactions', {
        flow_id: data.flow_id
      })
      break
      
    case 'transfer_requested':
      await supabase
        .from('conversas')
        .update({
          status: 'transferencia_solicitada',
          setor: data.setor,
          tags: data.tags || []
        })
        .eq('id', data.conversa_id)
      break
      
    case 'session_updated':
      await supabase
        .from('chatbot_sessions')
        .upsert({
          conversa_id: data.conversa_id,
          flow_id: data.flow_id,
          current_node_id: data.current_node,
          session_data: data.session_data,
          status: data.status
        })
      break
  }
  
  return { processed: true, action, flow_id: data.flow_id }
}