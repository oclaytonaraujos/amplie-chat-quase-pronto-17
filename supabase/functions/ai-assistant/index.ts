import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  type: 'chat' | 'analysis' | 'summary';
  content: string;
  context?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, context }: RequestBody = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Configurar contexto baseado no tipo
    let systemPrompt = '';
    let temperature = 0.7;

    switch (type) {
      case 'chat':
        systemPrompt = 'Você é um assistente especializado em atendimento ao cliente. Seja prestativo, profissional e empático.';
        break;
      case 'analysis':
        systemPrompt = 'Você é um analista de dados especializado em métricas de atendimento. Forneça insights práticos e acionáveis.';
        temperature = 0.3;
        break;
      case 'summary':
        systemPrompt = 'Você é especialista em resumir conversas de atendimento. Seja conciso, objetivo e destaque os pontos principais.';
        temperature = 0.2;
        break;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: content }
        ],
        temperature,
        max_tokens: type === 'summary' ? 300 : 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log da utilização (opcional)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('chatbot_logs').insert({
      function_name: 'ai-assistant',
      level: 'info',
      message: `AI ${type} request processed`,
      metadata: {
        type,
        content_length: content.length,
        response_length: aiResponse.length,
        context: context || null
      },
      correlation_id: crypto.randomUUID()
    });

    return new Response(JSON.stringify({ 
      success: true,
      response: aiResponse,
      type,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no AI Assistant:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});