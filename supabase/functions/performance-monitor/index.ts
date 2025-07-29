import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerformanceMetrics {
  endpoint: string;
  duration: number;
  status: number;
  userAgent?: string;
  timestamp: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      // Registrar métrica de performance
      const metrics: PerformanceMetrics = await req.json();

      await supabase.from('chatbot_logs').insert({
        function_name: 'performance-monitor',
        level: 'info',
        message: `Performance metric: ${metrics.endpoint}`,
        metadata: {
          ...metrics,
          type: 'performance_metric'
        },
        correlation_id: crypto.randomUUID()
      });

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Métrica registrada com sucesso'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Obter relatório de performance
      const url = new URL(req.url);
      const period = url.searchParams.get('period') || '24h';
      
      let timeFilter;
      switch (period) {
        case '1h':
          timeFilter = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          break;
        case '24h':
          timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      }

      const { data: logs } = await supabase
        .from('chatbot_logs')
        .select('*')
        .eq('function_name', 'performance-monitor')
        .gte('created_at', timeFilter)
        .order('created_at', { ascending: false });

      // Processar métricas
      const metrics = logs?.filter(log => 
        log.metadata?.type === 'performance_metric'
      ).map(log => log.metadata) || [];

      const summary = {
        total_requests: metrics.length,
        avg_duration: metrics.reduce((acc, m) => acc + (m.duration || 0), 0) / metrics.length || 0,
        success_rate: metrics.filter(m => m.status < 400).length / metrics.length * 100 || 0,
        endpoints: [...new Set(metrics.map(m => m.endpoint))],
        slowest_endpoints: metrics
          .sort((a, b) => (b.duration || 0) - (a.duration || 0))
          .slice(0, 5)
          .map(m => ({ endpoint: m.endpoint, duration: m.duration })),
        error_count: metrics.filter(m => m.status >= 400).length,
        period
      };

      return new Response(JSON.stringify({ 
        success: true,
        summary,
        raw_metrics: metrics.slice(0, 100) // Limitar dados brutos
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Método não suportado' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no Performance Monitor:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});