import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-n8n-token',
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
    const token = req.headers.get('x-n8n-token');
    
    console.log('n8n webhook received:', JSON.stringify(body, null, 2));

    // Validar token se fornecido
    if (token) {
      const { data: config } = await supabase
        .from('n8n_webhook_config')
        .select('auth_token, empresa_id')
        .eq('auth_token', token)
        .single();

      if (!config) {
        return new Response(
          JSON.stringify({ error: 'Token inválido' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Extrair dados do webhook n8n
    const {
      instanceName,
      telefone,
      mensagem,
      tipo = 'text',
      mediaUrl,
      botoes,
      lista,
      conversaId
    } = body;

    if (!instanceName || !telefone || !mensagem) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: instanceName, telefone, mensagem' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encontrar ou criar contato
    let { data: contato, error: contatoError } = await supabase
      .from('contatos')
      .select('*')
      .eq('telefone', telefone)
      .single();

    if (contatoError && contatoError.code === 'PGRST116') {
      // Criar contato se não existir
      const { data: newContato, error: createError } = await supabase
        .from('contatos')
        .insert({
          nome: telefone.replace(/\D/g, ''),
          telefone: telefone,
          empresa_id: '00000000-0000-0000-0000-000000000000' // ID padrão - deve ser ajustado
        })
        .select()
        .single();

      if (createError) {
        console.error('Erro ao criar contato:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar contato' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
      // Criar nova conversa
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

      if (createConversaError) {
        console.error('Erro ao criar conversa:', createConversaError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar conversa' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      conversa = newConversa;
    }

    // Preparar dados da mensagem
    let messageData: any = {
      texto: mensagem,
      tipo: tipo
    };

    if (tipo === 'media' && mediaUrl) {
      messageData.media_url = mediaUrl;
    } else if (tipo === 'buttons' && botoes) {
      messageData.botoes = botoes;
    } else if (tipo === 'list' && lista) {
      messageData.lista = lista;
    }

    // Salvar mensagem
    const { error: messageError } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversa.id,
        remetente: 'sistema',
        conteudo: JSON.stringify(messageData),
        tipo: 'outgoing',
        status: 'enviada'
      });

    if (messageError) {
      console.error('Erro ao salvar mensagem:', messageError);
    }

    // Emitir evento para Evolution API
    const { error: eventError } = await supabase.functions.invoke('events-emit', {
      body: {
        event_type: tipo === 'text' ? 'whatsapp.send.text' : 
                   tipo === 'media' ? 'whatsapp.send.media' :
                   tipo === 'buttons' ? 'whatsapp.send.buttons' :
                   'whatsapp.send.list',
        payload: {
          instanceName,
          telefone,
          mensagem,
          conversaId: conversa.id,
          ...(tipo === 'media' && { mediaUrl, tipo: 'imagem' }),
          ...(tipo === 'buttons' && { botoes }),
          ...(tipo === 'list' && { lista })
        }
      }
    });

    if (eventError) {
      console.error('Erro ao emitir evento:', eventError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        conversa_id: conversa.id,
        contato_id: contato.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook n8n:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});