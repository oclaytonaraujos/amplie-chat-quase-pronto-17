import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendMessageRequest {
  number: string; // Atualizado conforme documentação oficial
  text?: string;
  messageType?: 'text' | 'media' | 'buttons' | 'list' | 'template' | 'status' | 'sticker' | 'location' | 'contact' | 'reaction' | 'poll';
  options?: {
    // Para mídia
    mediatype?: 'image' | 'document' | 'audio' | 'video';
    media?: string;
    caption?: string;
    fileName?: string;
    // Para botões
    buttons?: Array<{ id: string; text: string }>;
    footer?: string;
    // Para lista
    listMessage?: {
      title: string;
      description: string;
      buttonText: string;
      sections: Array<{
        title: string;
        rows: Array<{ id: string; title: string; description?: string }>;
      }>;
      footerText?: string;
    };
    // Opções gerais
    delay?: number;
    linkPreview?: boolean;
  };
  empresaId?: string;
  instanceName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const requestBody = await req.json()
    const { 
      telefone, 
      mensagem, 
      tipo = 'texto', 
      opcoes = {}, 
      conversaId,
      empresaId,
      instanceName 
    } = requestBody
    
    // Log do request para debug
    console.log('Dados recebidos:', requestBody)

    console.log('Enviando mensagem Evolution API:', { telefone, mensagem, tipo, empresaId, instanceName })

    // Buscar configuração Evolution API Global
    const { data: globalConfig, error: globalError } = await supabase
      .from('evolution_api_global_config')
      .select('*')
      .eq('ativo', true)
      .single()
    
    if (globalError || !globalConfig) {
      console.error('Erro ao buscar configuração global:', globalError)
      throw new Error('Configuração Evolution API Global não encontrada ou inativa')
    }

    // Buscar instância específica da empresa
    let instanceConfig;
    
    if (instanceName) {
      // Buscar por nome específico da instância
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('nome', instanceName)
        .eq('ativo', true)
        .eq('status', 'connected')
        .single()
      
      if (error) {
        console.error('Erro ao buscar instância por nome:', error)
        throw new Error(`Instância WhatsApp não encontrada ou não conectada: ${instanceName}`)
      }
      instanceConfig = data
    } else if (empresaId) {
      // Buscar primeira instância ativa da empresa
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .eq('status', 'connected')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (error) {
        console.error('Erro ao buscar instância da empresa:', error)
        throw new Error(`Nenhuma instância WhatsApp conectada encontrada para empresa: ${empresaId}`)
      }
      instanceConfig = data
    } else {
      throw new Error('instanceName ou empresaId é obrigatório')
    }

    // Validar se a instância encontrada pertence à empresa (se empresaId fornecido)
    if (empresaId && instanceConfig.empresa_id !== empresaId) {
      throw new Error('Instância não pertence à empresa especificada')
    }

    const evolutionConfig = {
      instance_name: instanceConfig.nome,
      server_url: globalConfig.server_url,
      api_key: globalConfig.api_key
    }

    console.log('Configuração Evolution API encontrada:', evolutionConfig.instance_name)

    // Preparar headers para Evolution API
    const evolutionHeaders = {
      'Content-Type': 'application/json',
      'apikey': evolutionConfig.api_key,
    }

    // Preparar payload baseado no tipo de mensagem
    let endpoint = '';
    let payload: any = {};

    const baseUrl = evolutionConfig.server_url.replace(/\/$/, '')
    const telefoneFormatado = telefone.replace(/\D/g, '')

    switch (tipo) {
      case 'texto':
        endpoint = `${baseUrl}/message/sendText/${evolutionConfig.instance_name}`
        payload = {
          number: telefoneFormatado,
          text: mensagem,
          delay: 0,
          linkPreview: true
        }
        break

      case 'imagem':
        if (!opcoes.imageUrl) throw new Error('imageUrl é obrigatório para mensagens de imagem')
        endpoint = `${baseUrl}/message/sendMedia/${evolutionConfig.instance_name}`
        payload = {
          number: telefoneFormatado,
          mediatype: 'image',
          media: opcoes.imageUrl,
          caption: opcoes.caption || mensagem
        }
        break

      case 'documento':
        if (!opcoes.documentUrl) throw new Error('documentUrl é obrigatório para mensagens de documento')
        endpoint = `${baseUrl}/message/sendMedia/${evolutionConfig.instance_name}`
        payload = {
          number: telefoneFormatado,
          mediatype: 'document',
          media: opcoes.documentUrl,
          fileName: opcoes.fileName || 'documento.pdf'
        }
        break

      case 'audio':
        if (!opcoes.audioUrl) throw new Error('audioUrl é obrigatório para mensagens de áudio')
        endpoint = `${baseUrl}/message/sendMedia/${evolutionConfig.instance_name}`
        payload = {
          number: telefoneFormatado,
          mediatype: 'audio',
          media: opcoes.audioUrl
        }
        break

      case 'video':
        if (!opcoes.videoUrl) throw new Error('videoUrl é obrigatório para mensagens de vídeo')
        endpoint = `${baseUrl}/message/sendMedia/${evolutionConfig.instance_name}`
        payload = {
          number: telefoneFormatado,
          mediatype: 'video',
          media: opcoes.videoUrl,
          caption: opcoes.caption || mensagem
        }
        break

      case 'botoes':
        if (!opcoes.botoes || opcoes.botoes.length === 0) {
          throw new Error('botoes é obrigatório para mensagens com botões')
        }
        endpoint = `${baseUrl}/message/sendButtons/${evolutionConfig.instance_name}`
        payload = {
          number: telefoneFormatado,
          buttonMessage: {
            text: mensagem,
            buttons: opcoes.botoes,
            footer: opcoes.footer
          }
        }
        break

      case 'lista':
        if (!opcoes.lista) throw new Error('lista é obrigatório para mensagens de lista')
        endpoint = `${baseUrl}/message/sendList/${evolutionConfig.instance_name}`
        payload = {
          number: telefoneFormatado,
          listMessage: {
            title: opcoes.lista.title,
            description: opcoes.lista.description,
            buttonText: opcoes.lista.buttonText,
            sections: opcoes.lista.sections,
            footerText: opcoes.lista.footerText
          }
        }
        break

      default:
        throw new Error(`Tipo de mensagem não suportado: ${tipo}`)
    }

    console.log('Enviando para Evolution API:', { endpoint, payload })

    // Enviar mensagem via Evolution API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: evolutionHeaders,
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()
    console.log('Resposta Evolution API:', responseData)

    if (!response.ok) {
      throw new Error(`Erro na Evolution API: ${response.status} - ${JSON.stringify(responseData)}`)
    }

    // Verificar se a mensagem foi enviada com sucesso
    const sucesso = !!(responseData.key || responseData.success)

    return new Response(
      JSON.stringify({
        success: sucesso,
        message: sucesso ? 'Mensagem enviada com sucesso via Evolution API' : 'Falha ao enviar mensagem',
        data: responseData,
        evolutionResponse: responseData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: sucesso ? 200 : 400,
      }
    )

  } catch (error) {
    console.error('Erro ao enviar mensagem Evolution API:', error)
    
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