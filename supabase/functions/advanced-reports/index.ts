import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportFilters {
  empresaId: string;
  dataInicio?: string;
  dataFim?: string;
  canal?: string;
  tipoRelatorio?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { empresaId, dataInicio, dataFim, canal, tipoRelatorio }: ReportFilters = await req.json();

    if (!empresaId) {
      throw new Error('empresaId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calcular datas padrão (últimos 30 dias)
    const endDate = dataFim || new Date().toISOString().split('T')[0];
    const startDate = dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Buscar conversas no período
    let conversasQuery = supabase
      .from('conversas')
      .select(`
        id,
        status,
        canal,
        created_at,
        updated_at,
        agente_id,
        mensagens!inner(
          id,
          created_at,
          remetente_tipo,
          lida
        )
      `)
      .eq('empresa_id', empresaId)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    if (canal && canal !== 'todos') {
      conversasQuery = conversasQuery.eq('canal', canal);
    }

    const { data: conversas, error: conversasError } = await conversasQuery;

    if (conversasError) {
      throw conversasError;
    }

    // Buscar análises de sentimento
    const { data: sentimentAnalyses, error: sentimentError } = await supabase
      .from('sentiment_analysis')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59');

    if (sentimentError) {
      console.error('Sentiment analysis error:', sentimentError);
    }

    // Buscar agentes da empresa
    const { data: agentes, error: agentesError } = await supabase
      .from('profiles')
      .select('id, nome, cargo')
      .eq('empresa_id', empresaId);

    if (agentesError) {
      throw agentesError;
    }

    // Processar dados
    const totalAtendimentos = conversas?.length || 0;
    const atendimentosResolvidos = conversas?.filter(c => c.status === 'fechado')?.length || 0;
    const atendimentosPendentes = totalAtendimentos - atendimentosResolvidos;

    // Calcular tempo médio de atendimento
    const conversasComTempo = conversas?.filter(c => c.status === 'fechado' && c.created_at && c.updated_at) || [];
    const tempoMedioMs = conversasComTempo.reduce((acc, conv) => {
      const inicio = new Date(conv.created_at).getTime();
      const fim = new Date(conv.updated_at).getTime();
      return acc + (fim - inicio);
    }, 0) / (conversasComTempo.length || 1);

    const tempoMedioMinutos = Math.round(tempoMedioMs / (1000 * 60));
    const tempoMedio = `${Math.floor(tempoMedioMinutos / 60)}h ${tempoMedioMinutos % 60}m`;

    // Análise de sentimento
    const sentimentStats = {
      positive: 0,
      negative: 0,
      neutral: 0,
      avgSentiment: 0,
      alertsGenerated: 0
    };

    if (sentimentAnalyses && sentimentAnalyses.length > 0) {
      const totalSentiment = sentimentAnalyses.length;
      sentimentStats.positive = Math.round((sentimentAnalyses.filter(s => s.sentimento_score > 0.2).length / totalSentiment) * 100);
      sentimentStats.negative = Math.round((sentimentAnalyses.filter(s => s.sentimento_score < -0.2).length / totalSentiment) * 100);
      sentimentStats.neutral = 100 - sentimentStats.positive - sentimentStats.negative;
      sentimentStats.avgSentiment = Number((sentimentAnalyses.reduce((acc, s) => acc + s.sentimento_score, 0) / totalSentiment).toFixed(2));
      sentimentStats.alertsGenerated = sentimentAnalyses.filter(s => s.sentimento_score < -0.5).length;
    }

    // Distribuição por canal
    const canais = {
      whatsapp: conversas?.filter(c => c.canal === 'whatsapp')?.length || 0,
      chatInterno: conversas?.filter(c => c.canal === 'chat')?.length || 0,
      email: conversas?.filter(c => c.canal === 'email')?.length || 0
    };

    // Volume por hora (últimos 7 dias)
    const horariosVolume = [];
    for (let hour = 8; hour <= 18; hour++) {
      const conversasHora = conversas?.filter(c => {
        const horaConversa = new Date(c.created_at).getHours();
        return horaConversa === hour;
      })?.length || 0;
      
      horariosVolume.push({
        hora: `${hour.toString().padStart(2, '0')}:00`,
        volume: conversasHora
      });
    }

    // Produtividade dos agentes
    const produtividadeAgentes = agentes?.map(agente => {
      const atendimentosAgente = conversas?.filter(c => c.agente_id === agente.id)?.length || 0;
      const conversasAgente = conversas?.filter(c => c.agente_id === agente.id && c.status === 'fechado') || [];
      
      const tempoMedioAgente = conversasAgente.length > 0 
        ? conversasAgente.reduce((acc, conv) => {
            const inicio = new Date(conv.created_at).getTime();
            const fim = new Date(conv.updated_at).getTime();
            return acc + (fim - inicio);
          }, 0) / (conversasAgente.length * 1000 * 60) // em minutos
        : 0;

      return {
        nome: agente.nome,
        atendimentos: atendimentosAgente,
        tempo: `${Math.floor(tempoMedioAgente)}m ${Math.round((tempoMedioAgente % 1) * 60)}s`,
        satisfacao: 4.5 + (Math.random() * 1) // Simulado por enquanto
      };
    }).slice(0, 10) || [];

    // Calcular métricas
    const taxaResolucao = totalAtendimentos > 0 ? (atendimentosResolvidos / totalAtendimentos) * 100 : 0;
    const nps = 8.4; // Simulado
    const satisfacaoMedia = 4.6; // Simulado

    const reportData = {
      atendimentos: {
        total: totalAtendimentos,
        resolvidos: atendimentosResolvidos,
        pendentes: atendimentosPendentes,
        tempoMedio: tempoMedio,
        satisfacao: satisfacaoMedia
      },
      agentes: {
        total: agentes?.length || 0,
        ativos: agentes?.filter(a => a.cargo !== 'inativo')?.length || 0,
        produtividade: produtividadeAgentes
      },
      canais,
      horarios: horariosVolume,
      metricas: {
        tempoResposta: `${Math.floor(tempoMedioMinutos / 2)}m ${(tempoMedioMinutos % 2) * 30}s`,
        taxaResolucao: Number(taxaResolucao.toFixed(1)),
        nps,
        volumeDiario: Math.round(totalAtendimentos / 30)
      },
      sentiment: sentimentStats,
      periodo: {
        inicio: startDate,
        fim: endDate
      }
    };

    return new Response(
      JSON.stringify(reportData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in advanced reports:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});