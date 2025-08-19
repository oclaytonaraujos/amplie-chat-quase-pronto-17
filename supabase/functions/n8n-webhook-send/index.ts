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
    console.log('Sending event to n8n:', JSON.stringify(body, null, 2));

    const {
      event_type,
      payload,
      webhook_url,
      empresa_id
    } = body;

    if (!event_type || !payload || !webhook_url) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: event_type, payload, webhook_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração n8n ativa
    const { data: config, error: configError } = await supabase
      .from('n8n_configurations')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('status', 'active')
      .single();

    if (configError) {
      console.error('Configuração n8n não encontrada:', configError);
      return new Response(
        JSON.stringify({ error: 'Configuração n8n não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar dados para n8n
    const n8nPayload = {
      event_type,
      timestamp: new Date().toISOString(),
      empresa_id,
      payload,
      source: 'ampliechat'
    };

    // Enviar para n8n
    const startTime = Date.now();
    let success = false;
    let errorMessage = '';

    try {
      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.api_key && { 'Authorization': `Bearer ${config.api_key}` })
        },
        body: JSON.stringify(n8nPayload)
      });

      success = response.ok;
      if (!success) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        const responseText = await response.text();
        console.error('Erro na resposta do n8n:', responseText);
      }

    } catch (error) {
      success = false;
      errorMessage = error.message;
      console.error('Erro ao enviar para n8n:', error);
    }

    const duration = Date.now() - startTime;

    // Log da execução
    await supabase
      .from('n8n_execution_logs')
      .insert({
        config_id: config.id,
        status: success ? 'success' : 'error',
        event_type,
        input_data: n8nPayload,
        error_message: errorMessage || null,
        duration_ms: duration
      });

    // Atualizar estatísticas da configuração
    await supabase
      .from('n8n_configurations')
      .update({
        total_executions: config.total_executions + 1,
        success_rate: ((config.success_rate * config.total_executions) + (success ? 100 : 0)) / (config.total_executions + 1),
        last_ping: new Date().toISOString()
      })
      .eq('id', config.id);

    if (success) {
      return new Response(
        JSON.stringify({ 
          success: true,
          duration_ms: duration,
          event_type 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: errorMessage,
          duration_ms: duration 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Erro no webhook send n8n:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});