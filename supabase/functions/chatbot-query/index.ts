
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueryRequest {
  type: 'product' | 'service' | 'general';
  query: string;
  filters?: {
    category?: string;
    price_range?: [number, number];
    availability?: boolean;
  };
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { type, query, filters, limit = 10 }: QueryRequest = await req.json()
    console.log('Executando consulta:', { type, query, filters })

    let results = []

    switch (type) {
      case 'product':
        // Consulta de produtos
        let productQuery = supabase
          .from('produtos')
          .select('id, nome, descricao, preco, categoria, disponivel, imagem_url')
          .limit(limit)

        if (query) {
          productQuery = productQuery.or(`nome.ilike.%${query}%,descricao.ilike.%${query}%`)
        }

        if (filters?.category) {
          productQuery = productQuery.eq('categoria', filters.category)
        }

        if (filters?.availability !== undefined) {
          productQuery = productQuery.eq('disponivel', filters.availability)
        }

        if (filters?.price_range) {
          productQuery = productQuery
            .gte('preco', filters.price_range[0])
            .lte('preco', filters.price_range[1])
        }

        const { data: products, error: productError } = await productQuery

        if (productError) {
          console.error('Erro na consulta de produtos:', productError)
          // Fallback para dados mock se a tabela não existir
          results = [
            {
              id: '1',
              nome: 'Produto Demo 1',
              descricao: 'Descrição do produto demo',
              preco: 99.99,
              categoria: 'Eletrônicos',
              disponivel: true
            },
            {
              id: '2',
              nome: 'Produto Demo 2',
              descricao: 'Outro produto demo',
              preco: 149.99,
              categoria: 'Eletrônicos',
              disponivel: true
            }
          ].filter(p => !query || p.nome.toLowerCase().includes(query.toLowerCase()))
        } else {
          results = products || []
        }
        break

      case 'service':
        // Consulta de serviços
        let serviceQuery = supabase
          .from('servicos')
          .select('id, nome, descricao, preco, categoria, disponivel, duracao')
          .limit(limit)

        if (query) {
          serviceQuery = serviceQuery.or(`nome.ilike.%${query}%,descricao.ilike.%${query}%`)
        }

        const { data: services, error: serviceError } = await serviceQuery

        if (serviceError) {
          console.error('Erro na consulta de serviços:', serviceError)
          // Fallback para dados mock
          results = [
            {
              id: '1',
              nome: 'Consultoria Demo',
              descricao: 'Serviço de consultoria especializada',
              preco: 200.00,
              categoria: 'Consultoria',
              disponivel: true,
              duracao: '2 horas'
            }
          ].filter(s => !query || s.nome.toLowerCase().includes(query.toLowerCase()))
        } else {
          results = services || []
        }
        break

      case 'general':
        // Consulta geral (FAQs, documentos, etc.)
        let generalQuery = supabase
          .from('base_conhecimento')
          .select('id, titulo, conteudo, categoria, tags')
          .limit(limit)

        if (query) {
          generalQuery = generalQuery.or(`titulo.ilike.%${query}%,conteudo.ilike.%${query}%,tags.cs.{${query}}`)
        }

        const { data: knowledge, error: knowledgeError } = await generalQuery

        if (knowledgeError) {
          console.error('Erro na consulta geral:', knowledgeError)
          // Fallback para dados mock
          results = [
            {
              id: '1',
              titulo: 'Como funciona o atendimento?',
              conteudo: 'Nosso atendimento funciona 24/7 através do WhatsApp...',
              categoria: 'Atendimento',
              tags: ['atendimento', 'suporte', 'horario']
            }
          ].filter(k => !query || k.titulo.toLowerCase().includes(query.toLowerCase()))
        } else {
          results = knowledge || []
        }
        break

      default:
        throw new Error('Tipo de consulta não suportado')
    }

    // Enriquecer resultados com IA se disponível
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    let aiEnhancedResults = results;

    if (openaiApiKey && results.length > 0) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `Analise os resultados da consulta e adicione informações úteis para o chatbot. 
                Retorne um JSON com os mesmos dados mais um campo "chatbot_description" para cada item com uma descrição amigável e "relevance_score" de 0-1.`
              },
              {
                role: 'user',
                content: `Consulta: "${query}"\nResultados: ${JSON.stringify(results)}`
              }
            ],
            temperature: 0.3,
          }),
        });

        const aiData = await response.json();
        const enhancedResults = JSON.parse(aiData.choices[0].message.content);
        aiEnhancedResults = enhancedResults;
      } catch (error) {
        console.error('Erro no enriquecimento com IA:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      type: type,
      query: query,
      results: aiEnhancedResults,
      total: aiEnhancedResults.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na função de consulta:', error)
    
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
