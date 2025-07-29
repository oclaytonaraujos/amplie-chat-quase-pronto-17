
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvolutionWebhookData {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
}

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: EvolutionWebhookData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: EvolutionWebhookPayload = await req.json()
    console.log('Webhook recebido:', JSON.stringify(payload, null, 2))

    if (payload.event !== 'messages.upsert' || payload.data.key.fromMe) {
      console.log('Evento ignorado:', payload.event, 'fromMe:', payload.data.key.fromMe)
      return new Response(JSON.stringify({ success: true, message: 'Evento ignorado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const message = payload.data
    const telefone = message.key.remoteJid.replace(/\D/g, '')
    const nomeContato = message.pushName || 'Cliente'
    const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || ''

    console.log('Processando mensagem de:', telefone, 'nome:', nomeContato)

    // Buscar ou criar contato
    let { data: contato, error: contatoError } = await supabase
      .from('contatos')
      .select('*')
      .eq('telefone', telefone)
      .single()

    if (contatoError && contatoError.code === 'PGRST116') {
      console.log('Criando novo contato para:', telefone)
      
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('ativo', true)
        .limit(1)
        .single()

      if (!empresa) {
        throw new Error('Nenhuma empresa ativa encontrada')
      }

      const { data: novoContato, error: criarContatoError } = await supabase
        .from('contatos')
        .insert({
          nome: nomeContato,
          telefone: telefone,
          empresa_id: empresa.id
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

    console.log('Contato encontrado/criado:', contato?.id)

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
      console.log('Criando nova conversa para contato:', contato!.id)
      
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

    console.log('Conversa encontrada/criada:', conversa?.id)

    // Inserir mensagem do cliente
    const { data: mensagem, error: mensagemError } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversa!.id,
        conteudo: messageText,
        remetente_tipo: 'cliente',
        remetente_nome: nomeContato,
        tipo_mensagem: 'texto',
        metadata: {
          messageId: message.key.id,
          timestamp: message.messageTimestamp,
          remoteJid: message.key.remoteJid,
          pushName: message.pushName
        }
      })
      .select()
      .single()

    if (mensagemError) {
      throw mensagemError
    }

    console.log('Mensagem inserida:', mensagem.id)

    // 🔄 WEBHOOK EM TEMPO REAL - Processar eventos da Evolution API
    // Esta é a parte de "Webhooks para Interações em Tempo Real"
    console.log('📨 Webhook Evolution API - Recebendo evento em tempo real')
    
    // Verificar se deve iniciar o chatbot ou processar resposta
    if (novaConversa) {
      // Nova conversa - iniciar fluxo do chatbot
      console.log('🚀 Iniciando fluxo do chatbot para nova conversa via webhook')
      
      try {
        const chatbotResponse = await fetch(`${supabaseUrl}/functions/v1/chatbot-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            conversaId: conversa!.id,
            iniciarFluxo: true,
            source: 'evolution_webhook' // Indicar que veio do webhook
          })
        })

        const chatbotResult = await chatbotResponse.json()
        console.log('✅ Resultado do chatbot via webhook:', chatbotResult)
      } catch (chatbotError) {
        console.error('❌ Erro ao iniciar chatbot via webhook:', chatbotError)
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
        console.log('💬 Processando resposta do chatbot via webhook')
        
        try {
          const chatbotResponse = await fetch(`${supabaseUrl}/functions/v1/chatbot-engine`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              conversaId: conversa!.id,
              mensagemCliente: messageText,
              source: 'evolution_webhook' // Indicar que veio do webhook
            })
          })

          const chatbotResult = await chatbotResponse.json()
          console.log('✅ Resultado do chatbot via webhook:', chatbotResult)
        } catch (chatbotError) {
          console.error('❌ Erro ao processar chatbot via webhook:', chatbotError)
        }
      } else {
        console.log('💡 Mensagem recebida via webhook - sem sessão ativa de chatbot')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem processada com sucesso',
        conversaId: conversa!.id,
        mensagemId: mensagem.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
