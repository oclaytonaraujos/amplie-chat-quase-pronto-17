import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-n8n-token',
};

serve(async (req) => {
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
    
    console.log('N8N logs received:', JSON.stringify(body, null, 2));

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

    const {
      level = 'info',
      message,
      instanceName,
      workflowId,
      executionId,
      nodeType,
      metadata = {},
      timestamp,
      empresaId
    } = body;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Campo obrigatório: message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar log no sistema
    const { error: logError } = await supabase
      .from('evolution_api_logs')
      .insert({
        instance_name: instanceName || 'n8n-system',
        event_type: 'n8n_log',
        event_data: {
          level,
          message,
          workflowId,
          executionId,
          nodeType,
          metadata,
          timestamp: timestamp || new Date().toISOString()
        },
        success: level !== 'error',
        error_message: level === 'error' ? message : null,
        empresa_id: empresaId
      });

    if (logError) {
      console.error('Erro ao salvar log N8N:', logError);
    }

    // Para logs críticos, criar notificação
    if (level === 'error' && empresaId) {
      await supabase.rpc('create_notification', {
        title: 'Erro na Integração N8N',
        message: `Erro no workflow N8N: ${message}`,
        notification_type: 'error',
        empresa_id: empresaId,
        data: {
          source: 'n8n',
          workflowId,
          executionId,
          instanceName
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Log processado com sucesso'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook de logs:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});