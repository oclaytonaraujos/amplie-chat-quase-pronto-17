import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Esta função processa as mensagens que foram enfileiradas pelo webhook
// Contém toda a lógica de processamento que foi removida do webhook para otimização
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const logger = createLogger(supabase, correlationId, 'whatsapp-message-processor');

  try {
    const { event, instance, data } = await req.json();

    await logger.info('Processando mensagem WhatsApp', undefined, undefined, {
      event,
      instance,
      correlationId
    });

    const telefone = data.key.remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    const nomeContato = data.pushName || 'Cliente'

    // Extrair conteúdo da mensagem
    let conteudoMensagem = '';
    let tipoMensagem = 'texto';
    let metadata: any = {
      messageId: data.key.id,
      timestamp: data.messageTimestamp,
      remoteJid: data.key.remoteJid,
      instance: instance
    };

    if (data.message?.conversation) {
      conteudoMensagem = data.message.conversation;
    } else if (data.message?.extendedTextMessage) {
      conteudoMensagem = data.message.extendedTextMessage.text;
    } else if (data.message?.imageMessage) {
      tipoMensagem = 'imagem';
      conteudoMensagem = data.message.imageMessage.caption || '';
      metadata.mediaUrl = data.message.imageMessage.url;
      metadata.mimeType = data.message.imageMessage.mimetype;
    } else if (data.message?.documentMessage) {
      tipoMensagem = 'documento';
      conteudoMensagem = data.message.documentMessage.title || data.message.documentMessage.fileName;
      metadata.mediaUrl = data.message.documentMessage.url;
      metadata.mimeType = data.message.documentMessage.mimetype;
      metadata.fileName = data.message.documentMessage.fileName;
    } else if (data.message?.audioMessage) {
      tipoMensagem = 'audio';
      conteudoMensagem = '[Áudio]';
      metadata.mediaUrl = data.message.audioMessage.url;
      metadata.mimeType = data.message.audioMessage.mimetype;
    } else if (data.message?.videoMessage) {
      tipoMensagem = 'video';
      conteudoMensagem = data.message.videoMessage.caption || '[Vídeo]';
      metadata.mediaUrl = data.message.videoMessage.url;
      metadata.mimeType = data.message.videoMessage.mimetype;
    } else if (data.message?.buttonsResponseMessage) {
      tipoMensagem = 'botao_resposta';
      conteudoMensagem = data.message.buttonsResponseMessage.selectedDisplayText;
      metadata.selectedButtonId = data.message.buttonsResponseMessage.selectedButtonId;
    } else if (data.message?.listResponseMessage) {
      tipoMensagem = 'lista_resposta';
      conteudoMensagem = data.message.listResponseMessage.singleSelectReply.selectedRowId;
      metadata.selectedRowId = data.message.listResponseMessage.singleSelectReply.selectedRowId;
    }

    if (!conteudoMensagem) {
      await logger.error('Tipo de mensagem não suportado', undefined, undefined, { messageType: data.message });
      return new Response(JSON.stringify({ success: false, error: 'Tipo de mensagem não suportado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Buscar ou criar contato
    let { data: contato, error: contatoError } = await supabase
      .from('contatos')
      .select('*')
      .eq('telefone', telefone)
      .single()

    if (contatoError && contatoError.code === 'PGRST116') {
      await logger.info('Criando novo contato', undefined, undefined, { telefone, nome: nomeContato });
      
      // Buscar empresa ativa por instância Evolution API
      const { data: evolutionConfig } = await supabase
        .from('evolution_api_config')
        .select('empresa_id')
        .eq('instance_name', instance)
        .eq('ativo', true)
        .single()

      if (!evolutionConfig) {
        // Fallback para primeira empresa ativa
        const { data: empresa } = await supabase
          .from('empresas')
          .select('id')
          .eq('ativo', true)
          .limit(1)
          .single()

        if (!empresa) {
          throw new Error('Nenhuma empresa ativa encontrada')
        }

        evolutionConfig.empresa_id = empresa.id
      }

      const { data: novoContato, error: criarContatoError } = await supabase
        .from('contatos')
        .insert({
          nome: nomeContato,
          telefone: telefone,
          empresa_id: evolutionConfig.empresa_id
        })
        .select()
        .single()

      if (criarContatoError) {
        throw criarContatoError
      }

      contato = novoContato
    } else if (contatoError) {
      throw contatoError
    }

    await logger.info('Contato processado', undefined, undefined, { contatoId: contato?.id });

    // Buscar conversa ativa para este contato
    let { data: conversa, error: conversaError } = await supabase
      .from('conversas')
      .select('*')
      .eq('contato_id', contato!.id)
      .in('status', ['ativo', 'em-atendimento'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    let novaConversa = false
    if (conversaError && conversaError.code === 'PGRST116') {
      await logger.info('Criando nova conversa', undefined, undefined, { contatoId: contato!.id });
      
      const { data: novaConversaData, error: criarConversaError } = await supabase
        .from('conversas')
        .insert({
          contato_id: contato!.id,
          empresa_id: contato!.empresa_id,
          status: 'ativo',
          canal: 'whatsapp',
          prioridade: 'normal'
        })
        .select()
        .single()

      if (criarConversaError) {
        throw criarConversaError
      }

      conversa = novaConversaData
      novaConversa = true
    } else if (conversaError) {
      throw conversaError
    }

    // Inserir mensagem do cliente
    const { data: mensagem, error: mensagemError } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversa!.id,
        conteudo: conteudoMensagem,
        remetente_tipo: 'cliente',
        remetente_nome: nomeContato,
        tipo_mensagem: tipoMensagem,
        metadata: metadata
      })
      .select()
      .single()

    if (mensagemError) {
      throw mensagemError
    }

    await logger.info('Mensagem inserida', undefined, undefined, { mensagemId: mensagem.id });

    // Broadcast realtime update for new message
    const conversationChannel = supabase.channel(`conversa:${conversa!.id}`);
    await conversationChannel.send({
      type: 'broadcast',
      event: 'conversation_update',
      payload: {
        type: 'nova_mensagem',
        conversaId: conversa!.id,
        data: mensagem,
        timestamp: new Date().toISOString()
      }
    });

    // Verificar se deve iniciar o chatbot ou processar resposta
    if (novaConversa) {
      // Nova conversa - iniciar fluxo do chatbot
      await logger.info('Iniciando fluxo do chatbot para nova conversa');
      
      try {
        const chatbotResponse = await fetch(`${supabaseUrl}/functions/v1/chatbot-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'X-Correlation-ID': correlationId
          },
          body: JSON.stringify({
            conversaId: conversa!.id,
            iniciarFluxo: true
          })
        })

        const chatbotResult = await chatbotResponse.json()
        await logger.info('Chatbot iniciado', undefined, undefined, { result: chatbotResult });
      } catch (chatbotError) {
        await logger.error('Erro ao iniciar chatbot', undefined, undefined, { error: chatbotError.message });
      }
    } else {
      // Conversa existente - verificar se há sessão ativa do chatbot
      const { data: sessaoAtiva } = await supabase
        .from('chatbot_sessions')
        .select('*')
        .eq('conversa_id', conversa!.id)
        .eq('status', 'ativo')
        .single()

      if (sessaoAtiva) {
        await logger.info('Processando resposta do chatbot');
        
        try {
          const chatbotResponse = await fetch(`${supabaseUrl}/functions/v1/chatbot-engine`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'X-Correlation-ID': correlationId
            },
            body: JSON.stringify({
              conversaId: conversa!.id,
              mensagemCliente: conteudoMensagem,
              tipoMensagem: tipoMensagem
            })
          })

          const chatbotResult = await chatbotResponse.json()
          await logger.info('Chatbot processado', undefined, undefined, { result: chatbotResult });
        } catch (chatbotError) {
          await logger.error('Erro ao processar chatbot', undefined, undefined, { error: chatbotError.message });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem WhatsApp processada com sucesso',
        conversaId: conversa!.id,
        mensagemId: mensagem.id,
        correlationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    await logger.error('Erro ao processar mensagem WhatsApp', undefined, undefined, {
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        correlationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})