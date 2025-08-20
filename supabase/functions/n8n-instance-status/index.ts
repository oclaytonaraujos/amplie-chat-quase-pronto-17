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
    
    console.log('N8N instance status received:', JSON.stringify(body, null, 2));

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
      instanceName,
      status,
      connected,
      qrCode,
      numero,
      profileName,
      batteryLevel,
      platform,
      empresaId
    } = body;

    if (!instanceName || !status) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios: instanceName, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status da instância na configuração
    const { error: updateError } = await supabase
      .from('evolution_api_config')
      .update({
        status: connected ? 'connected' : 'disconnected',
        qr_code: qrCode,
        numero: numero,
        profile_name: profileName,
        battery_level: batteryLevel,
        platform: platform,
        last_connected_at: connected ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('instance_name', instanceName);

    if (updateError) {
      console.error('Erro ao atualizar status da instância:', updateError);
    }

    // Log do evento
    await supabase
      .from('evolution_api_logs')
      .insert({
        instance_name: instanceName,
        event_type: 'instance_status_change',
        event_data: body,
        success: true,
        empresa_id: empresaId
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Status da instância atualizado',
        instanceName,
        status: connected ? 'connected' : 'disconnected'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no webhook de status:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});