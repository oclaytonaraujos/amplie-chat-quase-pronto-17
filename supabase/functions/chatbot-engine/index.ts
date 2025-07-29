
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'
import { NLPProcessor, NLPResult } from '../_shared/nlp.ts'
import { sanitizePhone } from '../_shared/validation.ts'

// Extracted stage handlers for better maintainability
async function handleStageStart(nlpResult: NLPResult, userName: string, telefone: string, nextStage: string, responseMessages: any[]) {
  if (nlpResult.intent === 'greeting') {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: `Olá ${userName}! 👋 Que bom te ver por aqui!\n\nSou o assistente virtual e estou aqui para ajudá-lo. Como posso te ajudar hoje?\n\n1️⃣ Informações sobre produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento\n\nDigite o número da opção desejada:`
      }
    });
  } else if (nlpResult.intent === 'product_inquiry') {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: `Olá ${userName}! 👋 Vejo que você tem interesse em nossos produtos!\n\nPara te ajudar melhor, qual é o seu nome completo?`
      }
    });
    nextStage = 'collecting_name_products';
  } else if (nlpResult.intent === 'support_request') {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: `Olá ${userName}! 👋 Entendi que você precisa de suporte.\n\nPara melhor atendê-lo, qual é o seu nome completo?`
      }
    });
    nextStage = 'collecting_name_support';
  } else {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: `Olá ${userName}! 👋\n\nSou o assistente virtual da nossa empresa. Como posso ajudá-lo hoje?\n\n1️⃣ Informações sobre produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento\n\nDigite o número da opção desejada:`
      }
    });
  }
  nextStage = nextStage === 'start' ? 'awaiting_option' : nextStage;
  return { nextStage, responseMessages };
}

async function handleAwaitingOption(userMessage: string, nlpResult: NLPResult, telefone: string, nextStage: string, responseMessages: any[], context: any) {
  let shouldTransferToHuman = false;
  
  if (userMessage === '1' || nlpResult.intent === 'product_inquiry') {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: '📋 Ótimo! Temos diversos produtos disponíveis.\n\nPoderia me informar seu nome completo para um atendimento mais personalizado?'
      }
    });
    nextStage = 'collecting_name_products';
  } else if (userMessage === '2' || nlpResult.intent === 'support_request') {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: '🛠️ Entendi que você precisa de suporte técnico.\n\nPara melhor ajudá-lo, preciso de algumas informações. Qual é o seu nome completo?'
      }
    });
    nextStage = 'collecting_name_support';
  } else if (userMessage === '3') {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: '👨‍💼 Perfeito! Vou conectá-lo com um de nossos atendentes.\n\nPor favor, aguarde um momento...'
      }
    });
    shouldTransferToHuman = true;
    context.transfer_reason = 'Solicitação direta do cliente';
  } else if (userMessage === '4') {
    responseMessages.push({
      type: 'text',
      phone: telefone,
      data: {
        message: '🕐 Nosso horário de funcionamento:\n\n📅 Segunda a Sexta: 8h às 18h\n📅 Sábado: 8h às 12h\n📅 Domingo: Fechado\n\nPosso ajudá-lo com mais alguma coisa?\n\n1️⃣ Voltar ao menu principal\n2️⃣ Falar com atendente'
      }
    });
    nextStage = 'after_hours_info';
  } else {
    // Check if NLP can interpret the message
    if (nlpResult.confidence > 0.5) {
      if (nlpResult.intent === 'product_inquiry') {
        nextStage = 'collecting_name_products';
        responseMessages.push({
          type: 'text',
          phone: telefone,
          data: {
            message: '📋 Entendi que você tem interesse em nossos produtos! Qual é o seu nome completo?'
          }
        });
      } else if (nlpResult.intent === 'support_request') {
        nextStage = 'collecting_name_support';
        responseMessages.push({
          type: 'text',
          phone: telefone,
          data: {
            message: '🛠️ Vou ajudá-lo com o suporte. Primeiro, qual é o seu nome completo?'
          }
        });
      } else {
        responseMessages.push({
          type: 'text',
          phone: telefone,
          data: {
            message: '🤔 Entendi. Vou conectá-lo com um atendente para melhor ajudá-lo.'
          }
        });
        shouldTransferToHuman = true;
        context.transfer_reason = 'NLP não conseguiu interpretar claramente a solicitação';
      }
    } else {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: {
          message: '❌ Opção inválida. Por favor, digite apenas o número da opção desejada:\n\n1️⃣ Informações sobre produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento'
        }
      });
    }
  }
  
  return { nextStage, responseMessages, shouldTransferToHuman, context };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatbotState {
  id: string;
  contact_phone: string;
  current_stage: string;
  context: Record<string, any>;
  updated_at: string;
  nlp_intent?: string;
  nlp_confidence?: number;
  correlation_id?: string;
}

interface ChatbotEnginePayload {
  message: {
    messageId: string;
    from: string;
    to: string;
    text: {
      message: string;
    };
    timestamp: number;
    senderName: string;
    pushName: string;
  };
  currentState?: ChatbotState;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get correlation ID from header or generate new one
  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const logger = createLogger(supabase, correlationId, 'chatbot-engine');

  try {
    const payload: ChatbotEnginePayload = await req.json();
    const message = payload.message;
    const telefone = sanitizePhone(message.from);
    const userMessage = message.text.message.toLowerCase().trim();
    const userName = message.senderName || message.pushName || 'Cliente';

    await logger.info('Engine processing message', telefone, payload.currentState?.current_stage, {
      messageId: message.messageId,
      userMessage: message.text.message,
      userName
    });

    // Get empresa_id for NLP processing
    const { data: empresaData, error: empresaError } = await supabase
      .from('profiles')
      .select('empresa_id')
      .limit(1)
      .single();

    if (empresaError) {
      await logger.warn('Could not determine empresa_id for NLP', telefone, undefined, { error: empresaError.message });
    }

    const empresaId = empresaData?.empresa_id;

    // Initialize NLP processor
    const nlpProcessor = new NLPProcessor(supabase, logger);
    let nlpResult: NLPResult = { confidence: 0, shouldOverrideFlow: false };

    if (empresaId) {
      nlpResult = await nlpProcessor.processMessage(message.text.message, telefone, empresaId);
      await logger.debug('NLP analysis completed', telefone, payload.currentState?.current_stage, { nlpResult });
    }

    // Get or create chatbot state
    let currentState = payload.currentState;
    if (!currentState) {
      const { data: newState, error: createError } = await supabase
        .from('chatbot_state')
        .insert({
          contact_phone: telefone,
          current_stage: 'start',
          context: { name: userName, phone: telefone },
          correlation_id: correlationId,
          nlp_intent: nlpResult.intent,
          nlp_confidence: nlpResult.confidence
        })
        .select()
        .single();

      if (createError) {
        await logger.error('Failed to create chatbot state', telefone, undefined, { error: createError.message });
        throw createError;
      }
      currentState = newState;
      await logger.info('Created new chatbot state', telefone, 'start');
    }

    const context = currentState.context || {};
    let nextStage = currentState.current_stage;
    let responseMessages: any[] = [];
    let shouldTransferToHuman = false;

    // Check if NLP should override the flow
    if (nlpResult.shouldOverrideFlow && nlpResult.targetStage) {
      await logger.info('NLP overriding flow', telefone, currentState.current_stage, {
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
        targetStage: nlpResult.targetStage
      });
      nextStage = nlpResult.targetStage;
    }

    // Enhanced context with NLP insights
    if (nlpResult.intent) {
      context.nlp_insights = {
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
        parameters: nlpResult.parameters,
        timestamp: new Date().toISOString()
      };
    }

    // Main routing logic based on current_stage
    switch (nextStage) {
      case 'start':
        ({ nextStage, responseMessages } = await handleStageStart(nlpResult, userName, telefone, nextStage, responseMessages));
        break;

      case 'awaiting_option':
        if (userMessage === '1' || nlpResult.intent === 'product_inquiry') {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: '📋 Ótimo! Temos diversos produtos disponíveis.\n\nPoderia me informar seu nome completo para um atendimento mais personalizado?'
            }
          });
          nextStage = 'collecting_name_products';
        } else if (userMessage === '2' || nlpResult.intent === 'support_request') {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: '🛠️ Entendi que você precisa de suporte técnico.\n\nPara melhor ajudá-lo, preciso de algumas informações. Qual é o seu nome completo?'
            }
          });
          nextStage = 'collecting_name_support';
        } else if (userMessage === '3') {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: '👨‍💼 Perfeito! Vou conectá-lo com um de nossos atendentes.\n\nPor favor, aguarde um momento...'
            }
          });
          shouldTransferToHuman = true;
          context.transfer_reason = 'Solicitação direta do cliente';
        } else if (userMessage === '4') {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: '🕐 Nosso horário de funcionamento:\n\n📅 Segunda a Sexta: 8h às 18h\n📅 Sábado: 8h às 12h\n📅 Domingo: Fechado\n\nPosso ajudá-lo com mais alguma coisa?\n\n1️⃣ Voltar ao menu principal\n2️⃣ Falar com atendente'
            }
          });
          nextStage = 'after_hours_info';
        } else {
          // Check if NLP can interpret the message
          if (nlpResult.confidence > 0.5) {
            if (nlpResult.intent === 'product_inquiry') {
              nextStage = 'collecting_name_products';
              responseMessages.push({
                type: 'text',
                phone: telefone,
                data: {
                  message: '📋 Entendi que você tem interesse em nossos produtos! Qual é o seu nome completo?'
                }
              });
            } else if (nlpResult.intent === 'support_request') {
              nextStage = 'collecting_name_support';
              responseMessages.push({
                type: 'text',
                phone: telefone,
                data: {
                  message: '🛠️ Vou ajudá-lo com o suporte. Primeiro, qual é o seu nome completo?'
                }
              });
            } else {
              responseMessages.push({
                type: 'text',
                phone: telefone,
                data: {
                  message: '🤔 Entendi. Vou conectá-lo com um atendente para melhor ajudá-lo.'
                }
              });
              shouldTransferToHuman = true;
              context.transfer_reason = 'NLP não conseguiu interpretar claramente a solicitação';
            }
          } else {
            responseMessages.push({
              type: 'text',
              phone: telefone,
              data: {
                message: '❌ Opção inválida. Por favor, digite apenas o número da opção desejada:\n\n1️⃣ Informações sobre produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento'
              }
            });
          }
        }
        break;

      case 'collecting_name_products':
        context.name = message.text.message;
        context.product_interest = nlpResult.parameters?.product_mentioned || 'Geral';
        
        responseMessages.push({
          type: 'text',
          phone: telefone,
          data: {
            message: `Prazer em conhecê-lo, ${message.text.message}! 😊\n\n${context.product_interest !== 'Geral' ? `Vejo que você tem interesse especial em: ${context.product_interest}\n\n` : ''}Agora me conte, qual tipo de produto você gostaria de conhecer melhor?\n\n🔍 Digite sua dúvida ou interesse específico:`
          }
        });
        nextStage = 'collecting_product_interest';
        break;

      case 'collecting_name_support':
        context.name = message.text.message;
        const urgencyLevel = nlpResult.parameters?.urgency_level || 'medium';
        
        if (urgencyLevel === 'high') {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: `Olá ${message.text.message}! 👋\n\nPercebo que sua situação requer atenção urgente. Vou conectá-lo imediatamente com nossa equipe de suporte especializada.\n\nAguarde um momento...`
            }
          });
          shouldTransferToHuman = true;
          context.transfer_reason = 'Suporte técnico de alta urgência';
          context.department = 'Suporte Urgente';
        } else {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: `Olá ${message.text.message}! 👋\n\nPara oferecer o melhor suporte, preciso entender melhor sua situação.\n\n📝 Descreva brevemente o problema que está enfrentando:`
            }
          });
          nextStage = 'collecting_support_issue';
        }
        break;

      case 'collecting_product_interest':
        context.product_interest = message.text.message;
        
        responseMessages.push({
          type: 'text',
          phone: telefone,
          data: {
            message: `Entendi seu interesse em "${message.text.message}". 📋\n\nVou conectá-lo com nosso especialista em produtos para que ele possa fornecer informações detalhadas e personalizadas sobre exatamente o que você precisa.\n\nAguarde um momento, por favor...`
          }
        });
        shouldTransferToHuman = true;
        context.transfer_reason = 'Interesse em produtos';
        context.department = 'Vendas';
        break;

      case 'collecting_support_issue':
        context.support_issue = message.text.message;
        
        responseMessages.push({
          type: 'text',
          phone: telefone,
          data: {
            message: `Obrigado pelas informações, ${context.name}. 🛠️\n\nVou transferir você para nossa equipe de suporte técnico especializada que tem experiência com esse tipo de situação.\n\nEles terão acesso ao seu problema: "${message.text.message}"\n\nAguarde um momento...`
          }
        });
        shouldTransferToHuman = true;
        context.transfer_reason = 'Suporte técnico';
        context.department = 'Suporte';
        break;

      case 'after_hours_info':
        if (userMessage === '1') {
          nextStage = 'start';
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: `Como posso ajudá-lo hoje?\n\n1️⃣ Informações sobre produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento\n\nDigite o número da opção desejada:`
            }
          });
        } else if (userMessage === '2') {
          shouldTransferToHuman = true;
          context.transfer_reason = 'Solicitação após informações de horário';
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: '👨‍💼 Vou conectá-lo com um atendente. Aguarde um momento...'
            }
          });
        } else {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: '❌ Opção inválida. Digite:\n\n1️⃣ Voltar ao menu principal\n2️⃣ Falar com atendente'
            }
          });
        }
        break;

      default:
        await logger.warn('Unknown stage reached', telefone, nextStage, { context });
        if (nlpResult.confidence > 0.6 && nlpResult.intent) {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: `Entendi que você precisa de ajuda com: ${nlpResult.intent}. Vou conectá-lo com um atendente especializado para melhor atendê-lo.`
            }
          });
        } else {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: {
              message: '🤔 Parece que algo deu errado ou não consegui entender completamente. Vou conectá-lo com um atendente para melhor ajudá-lo.'
            }
          });
        }
        shouldTransferToHuman = true;
        context.transfer_reason = 'Erro no fluxo do chatbot ou intenção não clara';
        break;
    }

    // Send response messages
    for (const responseMessage of responseMessages) {
      await logger.debug('Sending response message', telefone, nextStage, { responseMessage });
      
      const sendResponse = await fetch(`${supabaseUrl}/functions/v1/chatbot-sender`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'X-Correlation-ID': correlationId
        },
        body: JSON.stringify(responseMessage)
      });

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        await logger.error('Failed to send message', telefone, nextStage, { error: errorText, responseMessage });
      } else {
        await logger.debug('Message sent successfully', telefone, nextStage);
      }
    }

    if (shouldTransferToHuman) {
      await logger.info('Transferring to human support', telefone, nextStage, { 
        transferReason: context.transfer_reason,
        department: context.department 
      });
      
      // Create transfer payload with enhanced context
      const transferPayload = {
        event: 'chatbot-transfer',
        instanceId: 'chatbot',
        data: {
          messageId: message.messageId,
          from: message.from,
          to: message.to,
          text: {
            message: `[TRANSFERÊNCIA INTELIGENTE DO CHATBOT]\n\n👤 Cliente: ${context.name || userName}\n📱 Telefone: ${telefone}\n🎯 Motivo: ${context.transfer_reason}\n🏢 Departamento: ${context.department || 'Geral'}\n\n💡 Contexto da conversa:\n${JSON.stringify(context, null, 2)}\n\n🤖 Análise de IA:\nIntenção: ${nlpResult.intent || 'Não identificada'}\nConfiança: ${nlpResult.confidence || 0}\nParâmetros: ${JSON.stringify(nlpResult.parameters || {}, null, 2)}`
          },
          timestamp: Date.now(),
          fromMe: false,
          senderName: userName,
          pushName: userName,
          chatbotContext: context,
          nlpInsights: nlpResult
        }
      };

      const humanResponse = await fetch(`${supabaseUrl}/functions/v1/whatsapp-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'X-Correlation-ID': correlationId
        },
        body: JSON.stringify(transferPayload)
      });

      // Remove chatbot state after transfer
      await supabase
        .from('chatbot_state')
        .delete()
        .eq('contact_phone', telefone);

      await logger.info('Client transferred to human support', telefone, nextStage);
    } else {
      // Update chatbot state
      await supabase
        .from('chatbot_state')
        .update({
          current_stage: nextStage,
          context: context,
          nlp_intent: nlpResult.intent,
          nlp_confidence: nlpResult.confidence,
          correlation_id: correlationId
        })
        .eq('contact_phone', telefone);

      await logger.debug('Chatbot state updated', telefone, nextStage, { context });
    }

    const result = {
      success: true,
      message: 'Processing completed',
      stage: nextStage,
      context: context,
      transferred: shouldTransferToHuman,
      responses_sent: responseMessages.length,
      nlp_analysis: nlpResult,
      correlationId
    };

    await logger.info('Engine processing completed', telefone, nextStage, { 
      transferred: shouldTransferToHuman,
      responsesSent: responseMessages.length,
      nlpIntent: nlpResult.intent,
      nlpConfidence: nlpResult.confidence
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await logger.error('Engine processing error', undefined, undefined, { 
      error: error.message,
      stack: error.stack 
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      correlationId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
