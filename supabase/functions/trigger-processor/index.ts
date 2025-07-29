import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createLogger } from '../_shared/logger.ts'
import { TriggerEvaluationContext, AutomationTrigger, TriggerActivation } from './types.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para avaliar condições de gatilho
function evaluateTriggerConditions(trigger: AutomationTrigger, context: TriggerEvaluationContext): boolean {
  const { conditions } = trigger;
  const { message, conversation, user, context: ctx } = context;

  try {
    // Verificar tipo de gatilho
    switch (trigger.trigger_type) {
      case 'first_message':
        return conversation.isNew;

      case 'keyword_detected':
        if (conditions.keywords && conditions.keywords.length > 0) {
          const messageContent = message.content.toLowerCase();
          return conditions.keywords.some(keyword => 
            messageContent.includes(keyword.toLowerCase())
          );
        }
        return false;

      case 'business_hours':
        if (conditions.outsideHours) {
          const now = new Date();
          const currentTime = now.toTimeString().substring(0, 5); // HH:MM
          const { start, end } = conditions.outsideHours;
          
          // Se start > end, significa que passa da meia-noite
          if (start > end) {
            return currentTime >= start || currentTime <= end;
          } else {
            return currentTime < start || currentTime > end;
          }
        }
        return false;

      case 'user_return':
        if (conditions.lastInteraction) {
          const { operator, value, unit } = conditions.lastInteraction;
          const lastInteraction = new Date(conversation.lastInteraction || 0);
          const now = new Date();
          const diffMs = now.getTime() - lastInteraction.getTime();
          
          let thresholdMs = value;
          switch (unit) {
            case 'minutes': thresholdMs *= 60 * 1000; break;
            case 'hours': thresholdMs *= 60 * 60 * 1000; break;
            case 'days': thresholdMs *= 24 * 60 * 60 * 1000; break;
          }

          switch (operator) {
            case 'gt': return diffMs > thresholdMs;
            case 'lt': return diffMs < thresholdMs;
            case 'eq': return Math.abs(diffMs - thresholdMs) < 60000; // 1 minute tolerance
          }
        }
        return false;

      case 'message_received':
        // Verificar condições de conteúdo da mensagem
        if (conditions.messageContent) {
          const content = message.content.toLowerCase();
          
          if (conditions.messageContent.contains) {
            return conditions.messageContent.contains.some(term => 
              content.includes(term.toLowerCase())
            );
          }
          
          if (conditions.messageContent.startsWith) {
            return conditions.messageContent.startsWith.some(prefix => 
              content.startsWith(prefix.toLowerCase())
            );
          }
          
          if (conditions.messageContent.equals) {
            return conditions.messageContent.equals.some(text => 
              content === text.toLowerCase()
            );
          }
          
          if (conditions.messageContent.regex) {
            const regex = new RegExp(conditions.messageContent.regex, 'i');
            return regex.test(content);
          }
        }
        
        // Verificar tags de usuário
        if (conditions.userTags && conditions.userTags.length > 0) {
          return conditions.userTags.some(tag => user.tags.includes(tag));
        }
        
        // Verificar canal de origem
        if (conditions.sourceChannel) {
          return ctx.channel === conditions.sourceChannel;
        }
        
        return true; // Se não há condições específicas, aceita qualquer mensagem

      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao avaliar condições do gatilho:', error);
    return false;
  }
}

// Função para executar ações do gatilho
async function executeTriggerActions(
  trigger: AutomationTrigger, 
  context: TriggerEvaluationContext,
  supabase: any,
  logger: any
): Promise<Record<string, any>> {
  const { actions } = trigger;
  const executedActions: Record<string, any> = {};

  try {
    // Transferir para atendente
    if (actions.transferToAgent || actions.transferToQueue) {
      executedActions.transfer = {
        type: actions.transferToAgent ? 'agent' : 'queue',
        queue: actions.transferToQueue,
        timestamp: new Date().toISOString()
      };

      // Atualizar estado do chatbot para parar processamento
      await supabase
        .from('chatbot_state')
        .delete()
        .eq('contact_phone', context.contact_phone);

      await logger.info('Conversa transferida para humano', context.contact_phone, trigger.name, {
        trigger_id: trigger.id,
        transfer_type: executedActions.transfer.type
      });
    }

    // Iniciar fluxo específico
    if (actions.startFlow) {
      // Verificar se o fluxo existe
      const { data: flow } = await supabase
        .from('chatbot_flows')
        .select('id, nome')
        .eq('id', actions.startFlow)
        .single();

      if (flow) {
        executedActions.startFlow = {
          flowId: actions.startFlow,
          flowName: flow.nome,
          timestamp: new Date().toISOString()
        };

        // Criar ou atualizar estado do chatbot
        await supabase
          .from('chatbot_state')
          .upsert({
            contact_phone: context.contact_phone,
            current_stage: 'start',
            context: {
              flow_id: actions.startFlow,
              triggered_by: trigger.id,
              trigger_reason: trigger.name
            }
          });

        await logger.info('Fluxo iniciado por gatilho', context.contact_phone, 'start', {
          trigger_id: trigger.id,
          flow_id: actions.startFlow
        });
      }
    }

    // Enviar mensagem
    if (actions.sendMessage) {
      executedActions.sendMessage = {
        message: actions.sendMessage,
        timestamp: new Date().toISOString()
      };

      // Aqui seria feita a integração com o sistema de envio de mensagens
      // Por enquanto, apenas registramos a ação
      await logger.info('Mensagem enviada por gatilho', context.contact_phone, trigger.name, {
        trigger_id: trigger.id,
        message: actions.sendMessage
      });
    }

    // Adicionar tags ao usuário
    if (actions.addUserTag && actions.addUserTag.length > 0) {
      executedActions.addUserTag = actions.addUserTag;

      // Atualizar tags no contato
      const { data: contato } = await supabase
        .from('contatos')
        .select('tags')
        .eq('telefone', context.contact_phone)
        .single();

      if (contato) {
        const currentTags = contato.tags || [];
        const newTags = [...new Set([...currentTags, ...actions.addUserTag])];
        
        await supabase
          .from('contatos')
          .update({ tags: newTags })
          .eq('telefone', context.contact_phone);
      }
    }

    // Remover tags do usuário
    if (actions.removeUserTag && actions.removeUserTag.length > 0) {
      executedActions.removeUserTag = actions.removeUserTag;

      const { data: contato } = await supabase
        .from('contatos')
        .select('tags')
        .eq('telefone', context.contact_phone)
        .single();

      if (contato) {
        const currentTags = contato.tags || [];
        const newTags = currentTags.filter(tag => !actions.removeUserTag!.includes(tag));
        
        await supabase
          .from('contatos')
          .update({ tags: newTags })
          .eq('telefone', context.contact_phone);
      }
    }

    // Criar ticket
    if (actions.createTicket) {
      executedActions.createTicket = {
        created: true,
        timestamp: new Date().toISOString()
      };

      // Buscar ou criar conversa
      let { data: conversa } = await supabase
        .from('conversas')
        .select('id')
        .eq('contato_id', (
          await supabase
            .from('contatos')
            .select('id')
            .eq('telefone', context.contact_phone)
            .single()
        ).data?.id)
        .single();

      if (!conversa) {
        // Criar nova conversa se não existir
        const { data: contato } = await supabase
          .from('contatos')
          .select('id, empresa_id')
          .eq('telefone', context.contact_phone)
          .single();

        if (contato) {
          const { data: novaConversa } = await supabase
            .from('conversas')
            .insert({
              contato_id: contato.id,
              empresa_id: contato.empresa_id,
              status: 'ativo',
              canal: 'whatsapp',
              prioridade: 'normal'
            })
            .select('id')
            .single();
          
          conversa = novaConversa;
        }
      }
    }

    // Webhook call
    if (actions.callWebhook) {
      try {
        const response = await fetch(actions.callWebhook.url, {
          method: actions.callWebhook.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...actions.callWebhook.headers
          },
          body: actions.callWebhook.body ? JSON.stringify(actions.callWebhook.body) : undefined
        });

        executedActions.callWebhook = {
          url: actions.callWebhook.url,
          method: actions.callWebhook.method,
          status: response.status,
          success: response.ok,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        executedActions.callWebhook = {
          url: actions.callWebhook.url,
          error: error.message,
          success: false,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Log do evento
    if (actions.logEvent) {
      executedActions.logEvent = {
        eventName: actions.logEvent.eventName,
        properties: actions.logEvent.properties,
        timestamp: new Date().toISOString()
      };

      await logger.info('Evento customizado registrado', context.contact_phone, trigger.name, {
        trigger_id: trigger.id,
        event_name: actions.logEvent.eventName,
        properties: actions.logEvent.properties
      });
    }

    return executedActions;
  } catch (error) {
    await logger.error('Erro ao executar ações do gatilho', context.contact_phone, trigger.name, {
      trigger_id: trigger.id,
      error: error.message
    });
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const logger = createLogger(supabase, correlationId, 'trigger-processor');

  try {
    const { context }: { context: TriggerEvaluationContext } = await req.json();

    await logger.info('Processando gatilhos para mensagem', context.contact_phone, undefined, {
      message_id: context.message.messageId,
      message_type: context.message.type
    });

    // Buscar gatilhos ativos ordenados por prioridade
    const { data: triggers, error: triggersError } = await supabase
      .from('automation_triggers')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true });

    if (triggersError) {
      throw new Error(`Erro ao buscar gatilhos: ${triggersError.message}`);
    }

    const activatedTriggers: Array<{
      trigger: AutomationTrigger;
      actions: Record<string, any>;
    }> = [];

    // Avaliar cada gatilho
    for (const trigger of triggers || []) {
      try {
        const shouldActivate = evaluateTriggerConditions(trigger, context);
        
        if (shouldActivate) {
          // Verificar cooldown
          if (trigger.cooldown_minutes && trigger.cooldown_minutes > 0) {
            const { data: recentActivation } = await supabase
              .from('trigger_activations')
              .select('created_at')
              .eq('trigger_id', trigger.id)
              .eq('contact_phone', context.contact_phone)
              .gte('created_at', new Date(Date.now() - trigger.cooldown_minutes * 60 * 1000).toISOString())
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            if (recentActivation) {
              await logger.debug('Gatilho em cooldown', context.contact_phone, trigger.name, {
                trigger_id: trigger.id,
                cooldown_minutes: trigger.cooldown_minutes
              });
              continue;
            }
          }

          // Verificar limite diário
          if (trigger.max_activations_per_day) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { count } = await supabase
              .from('trigger_activations')
              .select('*', { count: 'exact' })
              .eq('trigger_id', trigger.id)
              .eq('contact_phone', context.contact_phone)
              .gte('created_at', today.toISOString());

            if (count && count >= trigger.max_activations_per_day) {
              await logger.debug('Limite diário de ativações atingido', context.contact_phone, trigger.name, {
                trigger_id: trigger.id,
                max_activations: trigger.max_activations_per_day,
                current_count: count
              });
              continue;
            }
          }

          // Executar ações do gatilho
          const executedActions = await executeTriggerActions(trigger, context, supabase, logger);
          
          activatedTriggers.push({
            trigger,
            actions: executedActions
          });

          // Registrar ativação
          await supabase
            .from('trigger_activations')
            .insert({
              trigger_id: trigger.id,
              contact_phone: context.contact_phone,
              activation_reason: `Triggered by ${trigger.trigger_type}`,
              conditions_met: trigger.conditions,
              actions_executed: executedActions,
              success: true
            });

          await logger.info('Gatilho ativado com sucesso', context.contact_phone, trigger.name, {
            trigger_id: trigger.id,
            priority: trigger.priority,
            actions_executed: Object.keys(executedActions)
          });

          // Se o gatilho transferiu para humano, parar processamento
          if (executedActions.transfer) {
            await logger.info('Processamento interrompido - transferido para humano', context.contact_phone, trigger.name);
            break;
          }
        }
      } catch (error) {
        await logger.error('Erro ao processar gatilho', context.contact_phone, trigger.name, {
          trigger_id: trigger.id,
          error: error.message
        });

        // Registrar falha
        await supabase
          .from('trigger_activations')
          .insert({
            trigger_id: trigger.id,
            contact_phone: context.contact_phone,
            activation_reason: `Failed: ${error.message}`,
            conditions_met: trigger.conditions,
            actions_executed: {},
            success: false,
            error_message: error.message
          });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      correlationId,
      activated_triggers: activatedTriggers.length,
      triggers: activatedTriggers.map(t => ({
        id: t.trigger.id,
        name: t.trigger.name,
        actions: Object.keys(t.actions)
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await logger.error('Erro no processamento de gatilhos', undefined, undefined, {
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