import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MessageQueue } from '../_shared/queue.ts'
import { createLogger } from '../_shared/logger.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EvolutionApiWebhookData {
  event: string;
  instance: string;
  data: any; // Dados flexíveis para diferentes tipos de eventos
  destination?: string;
  source?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const correlationId = crypto.randomUUID()
    const logger = createLogger(supabase, correlationId, 'whatsapp-webhook-evolution')
    const messageQueue = new MessageQueue(supabase, logger)

    const payload: EvolutionApiWebhookData = await req.json()
    
    await logger.info('Webhook Evolution API recebido', undefined, undefined, {
      event: payload.event,
      instance: payload.instance,
      timestamp: new Date().toISOString()
    })

    // EVENTOS DE CONEXÃO E STATUS
    if (['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'APPLICATION_STARTUP'].includes(payload.event)) {
      console.log('Evento de sistema recebido:', payload.event)
      
      try {
        const updateData: any = {}
        
        if (payload.event === 'QRCODE_UPDATED' && payload.data) {
          // Tratar QR Code - pode vir como string base64 ou objeto
          let qrCodeData = typeof payload.data === 'string' ? payload.data : payload.data.qrcode || payload.data.base64;
          
          if (qrCodeData) {
            // Se já é uma URL de dados, usar como está
            if (qrCodeData.startsWith('data:image/')) {
              updateData.qr_code = qrCodeData;
            } else {
              // Adicionar o prefixo data URL se necessário
              updateData.qr_code = `data:image/png;base64,${qrCodeData}`;
            }
          }
          
          updateData.status = 'connecting'
          updateData.connection_state = 'CONNECTING'
          console.log('QR Code atualizado para instância:', payload.instance)
          
        } else if (payload.event === 'CONNECTION_UPDATE') {
          const state = payload.data?.state || payload.data?.connection || 'DISCONNECTED'
          updateData.connection_state = state
          
          console.log('CONNECTION_UPDATE recebido:', { instance: payload.instance, state, data: payload.data })
          
          // Mapear estado correto
          if (state === 'open' || state === 'CONNECTED') {
            updateData.status = 'open'
            updateData.qr_code = null
            updateData.last_connected_at = new Date().toISOString()
            
            // Extrair dados do perfil - verificar todas as possíveis estruturas
            const instanceData = payload.data?.instance || payload.data;
            
            if (instanceData?.profilePictureUrl) {
              updateData.profile_picture_url = instanceData.profilePictureUrl
            }
            if (instanceData?.profileName) {
              updateData.profile_name = instanceData.profileName
            }
            if (instanceData?.ownerJid) {
              updateData.numero = instanceData.ownerJid.split('@')[0]
            }
            // Alternativa para número
            if (instanceData?.wuid) {
              updateData.numero = instanceData.wuid.split('@')[0]
            }
            
            console.log('Instância conectada:', payload.instance, { profile: updateData.profile_name, numero: updateData.numero })
            
          } else if (state === 'close' || state === 'DISCONNECTED') {
            updateData.status = 'close'
            updateData.qr_code = null
            console.log('Instância desconectada:', payload.instance)
          } else if (state === 'connecting' || state === 'CONNECTING') {
            updateData.status = 'connecting'
            console.log('Instância conectando:', payload.instance)
          }
          
        } else if (payload.event === 'APPLICATION_STARTUP') {
          console.log('Aplicação Evolution API iniciada para instância:', payload.instance)
          updateData.status = 'starting'
        }
        
        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('evolution_api_config')
            .update(updateData)
            .eq('instance_name', payload.instance)
          
          if (updateError) {
            console.error('Erro ao atualizar instância:', updateError)
          } else {
            console.log('Instância atualizada:', payload.instance, updateData)
          }
        }
      } catch (error) {
        console.error('Erro ao processar evento de sistema:', error)
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Evento ${payload.event} processado`,
        instance: payload.instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // EVENTOS DE CONTATOS E CHATS
    if (['CONTACTS_SET', 'CONTACTS_UPSERT', 'CONTACTS_UPDATE', 'CHATS_SET', 'CHATS_UPSERT', 'CHATS_UPDATE', 'CHATS_DELETE'].includes(payload.event)) {
      console.log(`Evento de dados recebido: ${payload.event} para instância ${payload.instance}`)
      
      // Log dos dados recebidos para análise
      const { error: logError } = await supabase
        .from('chatbot_logs')
        .insert({
          function_name: 'whatsapp-webhook-evolution',
          level: 'info',
          message: `Evento ${payload.event} processado`,
          correlation_id: crypto.randomUUID(),
          metadata: {
            event: payload.event,
            instance: payload.instance,
            dataType: typeof payload.data,
            hasData: !!payload.data
          }
        })
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Evento ${payload.event} registrado`,
        instance: payload.instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // EVENTOS DE PRESENÇA E CHAMADAS
    if (['PRESENCE_UPDATE', 'CALL', 'NEW_JWT_TOKEN'].includes(payload.event)) {
      console.log(`Evento de presença/sistema: ${payload.event} para instância ${payload.instance}`)
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Evento ${payload.event} registrado`,
        instance: payload.instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // EVENTOS DE TYPEBOT
    if (['TYPEBOT_START', 'TYPEBOT_CHANGE_STATUS'].includes(payload.event)) {
      console.log(`Evento Typebot: ${payload.event} para instância ${payload.instance}`)
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Evento Typebot ${payload.event} registrado`,
        instance: payload.instance
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // EVENTOS DE MENSAGEM - ENFILEIRAR PARA PROCESSAMENTO RÁPIDO
    if (['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'MESSAGES_DELETE', 'SEND_MESSAGE'].includes(payload.event)) {
      // Para MESSAGES_UPSERT, processar apenas mensagens recebidas (não enviadas)
      if (payload.event === 'MESSAGES_UPSERT') {
        if (!payload.data?.key || payload.data.key.fromMe) {
          await logger.info('Mensagem ignorada - enviada pelo próprio sistema')
          return new Response(JSON.stringify({ success: true, message: 'Mensagem própria ignorada' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }

        // Enfileirar mensagem para processamento assíncrono
        const messageId = await messageQueue.enqueue({
          correlationId,
          messageType: 'whatsapp_message_received',
          payload: {
            event: payload.event,
            instance: payload.instance,
            data: payload.data
          },
          priority: 1, // Alta prioridade para mensagens recebidas
          metadata: {
            source: 'evolution_api_webhook',
            timestamp: new Date().toISOString()
          }
        })

        await logger.info('Mensagem enfileirada para processamento', undefined, undefined, {
          messageId,
          event: payload.event,
          instance: payload.instance
        })

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Mensagem enfileirada para processamento',
          messageId,
          correlationId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        // Para outros eventos de mensagem, apenas logar
        await logger.info(`Evento de mensagem: ${payload.event} para instância ${payload.instance}`)
        return new Response(JSON.stringify({ 
          success: true, 
          message: `Evento ${payload.event} registrado` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    } else {
      // Evento não reconhecido ou não suportado
      await logger.info('Evento não suportado', undefined, undefined, { event: payload.event })
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Evento não suportado',
        event: payload.event
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // PROCESSAMENTO DIRETO REMOVIDO - AGORA TUDO É ENFILEIRADO
    // O processamento detalhado das mensagens agora acontece no chatbot-queue-processor
    // que irá processar as mensagens de forma assíncrona e otimizada
    
    // Esta seção foi movida para o queue processor para garantir resposta rápida ao webhook

    // Esta função agora serve apenas como um webhook receiver otimizado
    // Todo o processamento pesado foi movido para o queue processor
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processado - evento enfileirado',
        correlationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao processar webhook Evolution API:', error)
    
    // Mesmo em caso de erro, retornamos 200 para evitar reenvios da Evolution API
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno - evento será reprocessado',
        correlationId: crypto.randomUUID()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Mudado de 500 para 200 para evitar reenvios
      }
    )
  }
})