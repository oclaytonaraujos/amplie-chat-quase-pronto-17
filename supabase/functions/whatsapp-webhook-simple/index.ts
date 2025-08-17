import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  event: string;
  instance: string;
  data: any;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const payload: WebhookPayload = await req.json();
    
    console.log(`[${new Date().toISOString()}] Webhook recebido:`, {
      event: payload.event,
      instance: payload.instance
    });

    // Processar apenas eventos essenciais para conexão
    switch (payload.event) {
      case 'QRCODE_UPDATED':
        await handleQRCodeUpdate(supabase, payload);
        break;
        
      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(supabase, payload);
        break;
        
      case 'MESSAGES_UPSERT':
        await handleMessage(supabase, payload);
        break;
        
      default:
        console.log(`Evento ${payload.event} ignorado`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: payload.event }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Retornar 200 para evitar reenvios
      }
    );
  }
});

async function handleQRCodeUpdate(supabase: any, payload: WebhookPayload) {
  const { instance, data } = payload;
  
  let qrCode = '';
  if (typeof data === 'string') {
    qrCode = data;
  } else if (data?.qrcode) {
    qrCode = data.qrcode;
  } else if (data?.base64) {
    qrCode = data.base64;
  }
  
  if (qrCode) {
    // Garantir formato data URL correto
    if (!qrCode.startsWith('data:image/')) {
      qrCode = `data:image/png;base64,${qrCode}`;
    }
    
    const { error } = await supabase
      .from('evolution_api_config')
      .update({
        qr_code: qrCode,
        status: 'connecting',
        connection_state: 'CONNECTING',
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instance);
    
    if (error) {
      console.error('Erro ao atualizar QR code:', error);
    } else {
      console.log(`QR code atualizado para instância ${instance}`);
    }
  }
}

async function handleConnectionUpdate(supabase: any, payload: WebhookPayload) {
  const { instance, data } = payload;
  const state = data?.state || data?.connection || 'DISCONNECTED';
  
  console.log(`Atualização de conexão para ${instance}:`, state);
  
  const updateData: any = {
    connection_state: state,
    updated_at: new Date().toISOString()
  };
  
  if (state === 'open' || state === 'CONNECTED') {
    updateData.status = 'open';
    updateData.qr_code = null;
    updateData.last_connected_at = new Date().toISOString();
    
    // Extrair dados do perfil
    const instanceData = data?.instance || data;
    if (instanceData?.profileName) {
      updateData.profile_name = instanceData.profileName;
    }
    if (instanceData?.profilePictureUrl) {
      updateData.profile_picture_url = instanceData.profilePictureUrl;
    }
    if (instanceData?.ownerJid) {
      updateData.numero = instanceData.ownerJid.split('@')[0];
    }
    
    console.log(`Instância ${instance} conectada com sucesso`);
    
  } else if (state === 'close' || state === 'DISCONNECTED') {
    updateData.status = 'close';
    updateData.qr_code = null;
    console.log(`Instância ${instance} desconectada`);
    
  } else if (state === 'connecting' || state === 'CONNECTING') {
    updateData.status = 'connecting';
    console.log(`Instância ${instance} conectando`);
  }
  
  const { error } = await supabase
    .from('evolution_api_config')
    .update(updateData)
    .eq('instance_name', instance);
  
  if (error) {
    console.error('Erro ao atualizar status de conexão:', error);
  }
}

async function handleMessage(supabase: any, payload: WebhookPayload) {
  const { instance, data } = payload;
  
  // Processar apenas mensagens recebidas (não enviadas pelo sistema)
  if (data?.key?.fromMe) {
    return; // Ignorar mensagens enviadas pelo próprio sistema
  }
  
  try {
    const messageData = {
      instance_name: instance,
      message_id: data?.key?.id,
      from_number: data?.key?.remoteJid?.split('@')[0],
      message_type: data?.messageType || 'text',
      content: data?.message?.conversation || 
               data?.message?.extendedTextMessage?.text ||
               '[Mídia]',
      timestamp: new Date(data?.messageTimestamp * 1000 || Date.now()).toISOString(),
      raw_data: data
    };
    
    // Salvar mensagem (processamento será feito por outro sistema)
    const { error: messageError } = await supabase
      .from('evolution_api_logs')
      .insert({
        instance_name: instance,
        event_type: 'message_received',
        event_data: messageData,
        success: true,
        created_at: new Date().toISOString()
      });
    
    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
    } else {
      console.log(`Mensagem recebida e registrada para instância ${instance}`);
    }
    
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
  }
}