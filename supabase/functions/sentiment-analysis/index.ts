import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SentimentRequest {
  message: string;
  messageId?: string;
  conversaId?: string;
  empresaId: string;
}

interface SentimentResult {
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  emotion: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
  keywords: string[];
  suggestion?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, messageId, conversaId, empresaId }: SentimentRequest = await req.json();

    if (!message || !empresaId) {
      throw new Error('Message and empresaId are required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Análise de sentimento usando OpenAI
    const prompt = `
    Analise o sentimento da seguinte mensagem em português brasileiro e retorne um JSON com:
    - score: número de -1 (muito negativo) a 1 (muito positivo)
    - confidence: confiança da análise de 0 a 1
    - emotion: uma das opções: "very_negative", "negative", "neutral", "positive", "very_positive"
    - keywords: array com palavras-chave que indicam o sentimento
    - suggestion: sugestão de ação para o atendente (se necessário)

    Mensagem: "${message.replace(/"/g, '\\"')}"

    Retorne apenas o JSON válido:
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em análise de sentimento para atendimento ao cliente. Sempre responda com JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const openaiResult = await response.json();
    const analysisText = openaiResult.choices[0].message.content;

    let sentimentResult: SentimentResult;
    try {
      sentimentResult = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', analysisText);
      // Fallback para análise básica
      sentimentResult = {
        score: 0,
        confidence: 0.5,
        emotion: 'neutral',
        keywords: [],
        suggestion: 'Análise automática indisponível'
      };
    }

    // Salvar no banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('sentiment_analysis')
      .insert({
        mensagem_id: messageId,
        conversa_id: conversaId,
        empresa_id: empresaId,
        sentimento_score: sentimentResult.score,
        sentimento_confianca: sentimentResult.confidence,
        emocao: sentimentResult.emotion,
        palavras_chave: sentimentResult.keywords,
        sugestao_ia: sentimentResult.suggestion
      });

    if (error) {
      console.error('Database error:', error);
    }

    return new Response(
      JSON.stringify(sentimentResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});