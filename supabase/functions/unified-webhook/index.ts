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
    console.log('Unified Webhook recebido:', body)

    const { type, empresa_id, timestamp, data } = body

    // Log do evento recebido
    await supabase
      .from('integration_events')
      .insert({
        correlation_id: crypto.randomUUID(),
        event_type: `unified_webhook_${type}`,
        payload: body,
        empresa_id: empresa_id,
        source: 'unified_webhook',
        destination: 'app'
      })

    let result = null
    
    // Processar baseado no tipo de evento
    switch (type) {
      case 'message':
        result = await processMessageEvent(supabase, data, empresa_id)
        break
      case 'instance':
        result = await processInstanceEvent(supabase, data, empresa_id)
        break
      case 'chatbot':
        result = await processChatbotEvent(supabase, data, empresa_id)
        break
      case 'connection':
        result = await processConnectionEvent(supabase, data, empresa_id)
        break
      case 'test':
        result = await processTestEvent(supabase, data, empresa_id)
        break
      default:
        console.log(`Tipo de evento não reconhecido: ${type}`)
        result = { processed: false, reason: `Unsupported event type: ${type}` }
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
    console.error('Erro no unified webhook:', error)
    
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

async function processMessageEvent(supabase: any, data: any, empresa_id: string) {
  console.log('Processando evento de mensagem:', data)
  
  const { action, message_id, conversa_id, from, content, type: messageType, timestamp: messageTimestamp, metadata, success } = data
  
  try {
    if (action === 'send') {
      // Atualizar status da mensagem enviada
      if (message_id) {
        await supabase
          .from('mensagens')
          .update({ 
            status: success ? 'enviada' : 'falha_envio',
            metadata: metadata || {}
          })
          .eq('id', message_id)
      }
    } else if (action === 'receive') {
      // Inserir nova mensagem recebida
      const { error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id,
          remetente: from,
          conteudo: content,
          tipo: messageType || 'text',
          timestamp_whatsapp: messageTimestamp,
          empresa_id: empresa_id,
          metadata: metadata || {}
        })
      
      if (error) throw error
    }
    
    return { processed: true, action, message_id }
  } catch (error) {
    console.error('Erro ao processar mensagem:', error)
    throw error
  }
}

async function processInstanceEvent(supabase: any, data: any, empresa_id: string) {
  console.log('Processando evento de instância:', data)
  
  const { action, instance_name, instance_id, qr_code, connection_state, phone_number } = data
  
  try {
    switch (action) {
      case 'created':
        await supabase
          .from('evolution_api_config')
          .update({
            status: 'connected',
            qr_code: qr_code,
            connection_state: connection_state || 'CONNECTED'
          })
          .eq('instance_name', instance_name)
          .eq('empresa_id', empresa_id)
        break
        
      case 'qr_updated':
        await supabase
          .from('evolution_api_config')
          .update({
            qr_code: qr_code,
            status: 'waiting_qr'
          })
          .eq('instance_name', instance_name)
          .eq('empresa_id', empresa_id)
        break
        
      case 'connection_update':
        await supabase
          .from('evolution_api_config')
          .update({
            connection_state: connection_state,
            status: connection_state === 'CONNECTED' ? 'connected' : 'disconnected',
            phone_number: phone_number
          })
          .eq('instance_name', instance_name)
          .eq('empresa_id', empresa_id)
        break
        
      case 'deleted':
        await supabase
          .from('evolution_api_config')
          .update({
            status: 'deleted',
            connection_state: 'DISCONNECTED'
          })
          .eq('instance_name', instance_name)
          .eq('empresa_id', empresa_id)
        break
    }
    
    return { processed: true, action, instance_name }
  } catch (error) {
    console.error('Erro ao processar instância:', error)
    throw error
  }
}

async function processChatbotEvent(supabase: any, data: any, empresa_id: string) {
  console.log('Processando evento de chatbot:', data)
  
  const { action, conversa_id, flow_id, step_id, user_input, bot_response, metadata } = data
  
  try {
    // Log da interação do chatbot
    await supabase
      .from('chatbot_logs')
      .insert({
        conversa_id,
        flow_id,
        step_id,
        user_input,
        bot_response,
        metadata: metadata || {},
        empresa_id: empresa_id
      })
    
    // Atualizar estado da conversa se necessário
    if (action === 'flow_completed' || action === 'flow_interrupted') {
      await supabase
        .from('conversas')
        .update({
          status: action === 'flow_completed' ? 'finalizado' : 'ativo',
          metadata: { ...metadata, chatbot_action: action }
        })
        .eq('id', conversa_id)
    }
    
    return { processed: true, action, conversa_id }
  } catch (error) {
    console.error('Erro ao processar chatbot:', error)
    throw error
  }
}

async function processConnectionEvent(supabase: any, data: any, empresa_id: string) {
  console.log('Processando evento de conexão:', data)
  
  const { instance_name, status, phone_number, connection_state, timestamp } = data
  
  try {
    // Atualizar status da conexão
    await supabase
      .from('evolution_api_config')
      .update({
        status: status,
        connection_state: connection_state,
        phone_number: phone_number,
        last_seen: timestamp || new Date().toISOString()
      })
      .eq('instance_name', instance_name)
      .eq('empresa_id', empresa_id)
    
    // Log do evento de conexão
    await supabase
      .from('evolution_api_logs')
      .insert({
        instance_name,
        action: 'connection_update',
        status: status,
        details: data,
        empresa_id: empresa_id
      })
    
    return { processed: true, instance_name, status }
  } catch (error) {
    console.error('Erro ao processar conexão:', error)
    throw error
  }
}

async function processTestEvent(supabase: any, data: any, empresa_id: string) {
  console.log('Processando evento de teste:', data)
  
  // Simplesmente retorna sucesso para teste
  return { 
    processed: true, 
    test: true, 
    message: 'Webhook funcionando corretamente!',
    timestamp: new Date().toISOString()
  }
}