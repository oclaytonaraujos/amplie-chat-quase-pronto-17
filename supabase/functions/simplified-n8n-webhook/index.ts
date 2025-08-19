import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Simplified n8n webhook received:', JSON.stringify(body, null, 2));

    const {
      webhook_type, // 'messages', 'instances', 'chatbot'
      action, // 'send', 'create', 'delete', 'process', etc
      data,
      empresa_id
    } = body;

    if (!webhook_type || !action || !data) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: webhook_type, action, data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: any = { success: true };

    // Processar baseado no tipo de webhook
    switch (webhook_type) {
      case 'messages':
        result = await processMessageWebhook(supabase, action, data, empresa_id);
        break;
      
      case 'instances':
        result = await processInstanceWebhook(supabase, action, data, empresa_id);
        break;
      
      case 'chatbot':  
        result = await processChatbotWebhook(supabase, action, data, empresa_id);
        break;
      
      default:
        return new Response(
          JSON.stringify({ error: `Tipo de webhook não suportado: ${webhook_type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook simplificado n8n:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processMessageWebhook(supabase: any, action: string, data: any, empresaId?: string) {
  console.log(`Processando mensagem: ${action}`, data);

  switch (action) {
    case 'received':
      // Processar mensagem recebida
      return await handleReceivedMessage(supabase, data, empresaId);
    
    case 'send_response':
      // Resposta do n8n para envio de mensagem
      return await handleSendResponse(supabase, data, empresaId);
    
    default:
      return { success: false, error: `Ação não suportada para mensagens: ${action}` };
  }
}

async function processInstanceWebhook(supabase: any, action: string, data: any, empresaId?: string) {
  console.log(`Processando instância: ${action}`, data);

  switch (action) {
    case 'created':
      // Instância criada com sucesso
      return await handleInstanceCreated(supabase, data, empresaId);
    
    case 'deleted':
      // Instância deletada com sucesso
      return await handleInstanceDeleted(supabase, data, empresaId);
    
    case 'status_update':
      // Atualização de status da instância
      return await handleInstanceStatusUpdate(supabase, data, empresaId);
    
    default:
      return { success: false, error: `Ação não suportada para instâncias: ${action}` };
  }
}

async function processChatbotWebhook(supabase: any, action: string, data: any, empresaId?: string) {
  console.log(`Processando chatbot: ${action}`, data);

  switch (action) {
    case 'response':
      // Resposta do chatbot para enviar
      return await handleChatbotResponse(supabase, data, empresaId);
    
    case 'transfer':
      // Transferir para atendimento humano
      return await handleChatbotTransfer(supabase, data, empresaId);
    
    case 'completed':
      // Fluxo de chatbot finalizado
      return await handleChatbotCompleted(supabase, data, empresaId);
    
    default:
      return { success: false, error: `Ação não suportada para chatbot: ${action}` };
  }
}

async function handleReceivedMessage(supabase: any, data: any, empresaId?: string) {
  const { phone, message, messageId, timestamp, type, mediaUrl } = data;

  try {
    // Encontrar ou criar contato
    let { data: contato, error: contatoError } = await supabase
      .from('contatos')
      .select('*')
      .eq('telefone', phone)
      .single();

    if (contatoError && contatoError.code === 'PGRST116') {
      const { data: newContato, error: createError } = await supabase
        .from('contatos')
        .insert({
          nome: phone.replace(/\D/g, ''),
          telefone: phone,
          empresa_id: empresaId
        })
        .select()
        .single();

      if (createError) throw createError;
      contato = newContato;
    }

    // Encontrar ou criar conversa
    let { data: conversa, error: conversaError } = await supabase
      .from('conversas')
      .select('*')
      .eq('contato_id', contato.id)
      .eq('status', 'ativo')
      .single();

    if (conversaError && conversaError.code === 'PGRST116') {
      const { data: newConversa, error: createConversaError } = await supabase
        .from('conversas')
        .insert({
          contato_id: contato.id,
          empresa_id: contato.empresa_id,
          status: 'ativo',
          canal: 'whatsapp'
        })
        .select()
        .single();

      if (createConversaError) throw createConversaError;
      conversa = newConversa;
    }

    // Salvar mensagem
    const messageData = {
      texto: message,
      tipo: type || 'text'
    };

    if (type === 'media' && mediaUrl) {
      messageData.media_url = mediaUrl;
    }

    await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversa.id,
        remetente: 'cliente',
        conteudo: JSON.stringify(messageData),
        tipo: 'incoming',
        status: 'recebida',
        message_id: messageId
      });

    return { 
      success: true, 
      conversa_id: conversa.id, 
      contato_id: contato.id,
      message: 'Mensagem processada com sucesso'
    };

  } catch (error) {
    console.error('Erro ao processar mensagem recebida:', error);
    return { success: false, error: error.message };
  }
}

async function handleSendResponse(supabase: any, data: any, empresaId?: string) {
  const { messageId, status, error } = data;

  try {
    // Atualizar status da mensagem
    await supabase
      .from('mensagens')
      .update({
        status: status === 'success' ? 'enviada' : 'erro',
        error_message: error || null
      })
      .eq('message_id', messageId);

    return { success: true, message: 'Status da mensagem atualizado' };

  } catch (err) {
    console.error('Erro ao atualizar status da mensagem:', err);
    return { success: false, error: err.message };
  }
}

async function handleInstanceCreated(supabase: any, data: any, empresaId?: string) {
  const { instanceName, status, qrCode } = data;

  try {
    // Atualizar configuração da instância
    await supabase
      .from('evolution_api_config')
      .update({
        status: status || 'connected',
        qr_code: qrCode,
        last_connected_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName)
      .eq('empresa_id', empresaId);

    return { success: true, message: 'Instância criada com sucesso' };

  } catch (error) {
    console.error('Erro ao processar criação de instância:', error);
    return { success: false, error: error.message };
  }
}

async function handleInstanceDeleted(supabase: any, data: any, empresaId?: string) {
  const { instanceName } = data;

  try {
    // Marcar instância como deletada
    await supabase
      .from('evolution_api_config')
      .update({
        status: 'disconnected',
        qr_code: null
      })
      .eq('instance_name', instanceName)
      .eq('empresa_id', empresaId);

    return { success: true, message: 'Instância deletada com sucesso' };

  } catch (error) {
    console.error('Erro ao processar exclusão de instância:', error);
    return { success: false, error: error.message };
  }
}

async function handleInstanceStatusUpdate(supabase: any, data: any, empresaId?: string) {
  const { instanceName, status, qrCode, profileName, numero } = data;

  try {
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (qrCode) updateData.qr_code = qrCode;
    if (profileName) updateData.profile_name = profileName;
    if (numero) updateData.numero = numero;

    await supabase
      .from('evolution_api_config')
      .update(updateData)
      .eq('instance_name', instanceName)
      .eq('empresa_id', empresaId);

    return { success: true, message: 'Status da instância atualizado' };

  } catch (error) {
    console.error('Erro ao atualizar status da instância:', error);
    return { success: false, error: error.message };
  }
}

async function handleChatbotResponse(supabase: any, data: any, empresaId?: string) {
  const { phone, message, conversaId, flowId, nextStep } = data;

  try {
    // Salvar resposta do chatbot
    await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversaId,
        remetente: 'chatbot',
        conteudo: JSON.stringify({ texto: message, flow_id: flowId }),
        tipo: 'outgoing',
        status: 'enviada'
      });

    // Atualizar sessão do chatbot se necessário
    if (nextStep) {
      await supabase
        .from('chatbot_sessions')
        .update({
          current_node_id: nextStep,
          updated_at: new Date().toISOString()
        })
        .eq('conversa_id', conversaId);
    }

    return { success: true, message: 'Resposta do chatbot processada' };

  } catch (error) {
    console.error('Erro ao processar resposta do chatbot:', error);
    return { success: false, error: error.message };
  }
}

async function handleChatbotTransfer(supabase: any, data: any, empresaId?: string) {
  const { conversaId, setor, motivo } = data;

  try {
    // Finalizar sessão do chatbot
    await supabase
      .from('chatbot_sessions')
      .update({
        status: 'transferido',
        updated_at: new Date().toISOString()
      })
      .eq('conversa_id', conversaId);

    // Atualizar conversa para aguardar atendimento
    await supabase
      .from('conversas')
      .update({
        status: 'pendente',
        setor: setor,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversaId);

    return { success: true, message: 'Transferência para atendimento humano realizada' };

  } catch (error) {
    console.error('Erro ao processar transferência do chatbot:', error);
    return { success: false, error: error.message };
  }
}

async function handleChatbotCompleted(supabase: any, data: any, empresaId?: string) {
  const { conversaId, flowId } = data;

  try {
    // Finalizar sessão do chatbot
    await supabase
      .from('chatbot_sessions')
      .update({
        status: 'finalizado',
        updated_at: new Date().toISOString()
      })
      .eq('conversa_id', conversaId);

    // Finalizar conversa se não precisar de atendimento
    await supabase
      .from('conversas')
      .update({
        status: 'finalizado',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversaId);

    return { success: true, message: 'Fluxo de chatbot finalizado' };

  } catch (error) {
    console.error('Erro ao finalizar chatbot:', error);
    return { success: false, error: error.message };
  }
}