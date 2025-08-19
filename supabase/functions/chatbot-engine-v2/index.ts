import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'
import { NLPProcessor, NLPResult } from '../_shared/nlp.ts'
import { sanitizePhone } from '../_shared/validation.ts'

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

// Handlers para cada estágio
class StageHandlers {
  static async handleStart(nlpResult: NLPResult, userName: string, telefone: string) {
    const responseMessages: any[] = [];
    let nextStage = 'awaiting_option';

    if (nlpResult.intent === 'greeting') {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: {
          message: `Olá ${userName}! 👋 Como posso ajudá-lo hoje?\n\n1️⃣ Informações sobre produtos\n2️⃣ Suporte técnico\n3️⃣ Falar com atendente\n4️⃣ Horário de funcionamento`
        }
      });
    } else if (nlpResult.intent === 'product_inquiry') {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: {
          message: `Olá ${userName}! 👋 Qual é o seu nome completo?`
        }
      });
      nextStage = 'collecting_name_products';
    } else {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: {
          message: `Olá ${userName}! 👋 Como posso ajudá-lo?\n\n1️⃣ Produtos\n2️⃣ Suporte\n3️⃣ Atendente\n4️⃣ Horário`
        }
      });
    }

    return { nextStage, responseMessages, shouldTransferToHuman: false, context: {} };
  }

  static async handleAwaitingOption(userMessage: string, nlpResult: NLPResult, telefone: string, context: any) {
    const responseMessages: any[] = [];
    let nextStage = 'awaiting_option';
    let shouldTransferToHuman = false;

    if (userMessage === '1' || nlpResult.intent === 'product_inquiry') {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: { message: '📋 Qual é o seu nome completo?' }
      });
      nextStage = 'collecting_name_products';
    } else if (userMessage === '2' || nlpResult.intent === 'support_request') {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: { message: '🛠️ Qual é o seu nome completo?' }
      });
      nextStage = 'collecting_name_support';
    } else if (userMessage === '3') {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: { message: '👨‍💼 Conectando com atendente...' }
      });
      shouldTransferToHuman = true;
      context.transfer_reason = 'Solicitação direta';
    } else if (userMessage === '4') {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: { message: '🕐 Segunda a Sexta: 8h às 18h\nSábado: 8h às 12h\n\n1️⃣ Menu\n2️⃣ Atendente' }
      });
      nextStage = 'after_hours_info';
    } else {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: { message: '❌ Opção inválida. Digite 1, 2, 3 ou 4.' }
      });
    }

    return { nextStage, responseMessages, shouldTransferToHuman, context };
  }

  static async handleCollectingName(userMessage: string, telefone: string, type: 'products' | 'support', context: any) {
    const responseMessages: any[] = [];
    context.name = userMessage;
    let shouldTransferToHuman = true;

    if (type === 'products') {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: { message: `Prazer, ${userMessage}! Conectando com especialista...` }
      });
      context.transfer_reason = 'Interesse em produtos';
      context.department = 'Vendas';
    } else {
      responseMessages.push({
        type: 'text',
        phone: telefone,
        data: { message: `Olá ${userMessage}! Conectando com suporte...` }
      });
      context.transfer_reason = 'Suporte técnico';
      context.department = 'Suporte';
    }

    return { nextStage: 'completed', responseMessages, shouldTransferToHuman, context };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = req.headers.get('X-Correlation-ID') || crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const logger = createLogger(supabase, correlationId, 'chatbot-engine-v2');

  try {
    const payload: ChatbotEnginePayload = await req.json();
    const message = payload.message;
    const telefone = sanitizePhone(message.from);
    const userMessage = message.text.message.toLowerCase().trim();
    const userName = message.senderName || message.pushName || 'Cliente';

    await logger.info('Processing message', telefone, payload.currentState?.current_stage, {
      messageId: message.messageId,
      userMessage: message.text.message
    });

    // Get empresa_id
    const { data: empresaData } = await supabase
      .from('profiles')
      .select('empresa_id')
      .limit(1)
      .single();

    const empresaId = empresaData?.empresa_id;

    // Initialize NLP
    const nlpProcessor = new NLPProcessor(supabase, logger);
    let nlpResult: NLPResult = { confidence: 0, shouldOverrideFlow: false };

    if (empresaId) {
      nlpResult = await nlpProcessor.processMessage(message.text.message, telefone, empresaId);
    }

    // Get or create state
    let currentState = payload.currentState;
    if (!currentState) {
      const { data: newState } = await supabase
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

      currentState = newState;
    }

    let context = currentState.context || {};
    let nextStage = currentState.current_stage;
    let responseMessages: any[] = [];
    let shouldTransferToHuman = false;

    // Process based on stage
    switch (nextStage) {
      case 'start':
        ({ nextStage, responseMessages, shouldTransferToHuman, context } = 
          await StageHandlers.handleStart(nlpResult, userName, telefone));
        break;

      case 'awaiting_option':
        ({ nextStage, responseMessages, shouldTransferToHuman, context } = 
          await StageHandlers.handleAwaitingOption(userMessage, nlpResult, telefone, context));
        break;

      case 'collecting_name_products':
        ({ nextStage, responseMessages, shouldTransferToHuman, context } = 
          await StageHandlers.handleCollectingName(userMessage, telefone, 'products', context));
        break;

      case 'collecting_name_support':
        ({ nextStage, responseMessages, shouldTransferToHuman, context } = 
          await StageHandlers.handleCollectingName(userMessage, telefone, 'support', context));
        break;

      case 'after_hours_info':
        if (userMessage === '1') {
          nextStage = 'start';
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: { message: 'Como posso ajudá-lo?\n\n1️⃣ Produtos\n2️⃣ Suporte\n3️⃣ Atendente\n4️⃣ Horário' }
          });
        } else if (userMessage === '2') {
          shouldTransferToHuman = true;
          context.transfer_reason = 'Solicitação após horário';
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: { message: '👨‍💼 Conectando...' }
          });
        } else {
          responseMessages.push({
            type: 'text',
            phone: telefone,
            data: { message: '❌ Digite 1 ou 2.' }
          });
        }
        break;

      default:
        responseMessages.push({
          type: 'text',
          phone: telefone,
          data: { message: '❌ Erro no fluxo. Reiniciando...' }
        });
        nextStage = 'start';
        break;
    }

    // Update state
    if (nextStage !== currentState.current_stage || JSON.stringify(context) !== JSON.stringify(currentState.context)) {
      await supabase
        .from('chatbot_state')
        .update({
          current_stage: nextStage,
          context,
          updated_at: new Date().toISOString(),
          nlp_intent: nlpResult.intent,
          nlp_confidence: nlpResult.confidence
        })
        .eq('id', currentState.id);
    }

    const result = {
      success: true,
      shouldTransferToHuman,
      transferReason: context.transfer_reason || 'Fluxo do chatbot',
      department: context.department || 'Geral',
      responseMessages,
      nextStage,
      context,
      nlpInsights: {
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
        parameters: nlpResult.parameters
      }
    };

    await logger.info('Engine processed successfully', telefone, nextStage, {
      shouldTransferToHuman,
      responseCount: responseMessages.length
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await logger.error('Engine processing failed', undefined, undefined, { error: error.message });

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal processing error',
        correlationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});