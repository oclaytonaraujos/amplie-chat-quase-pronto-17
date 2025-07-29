import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthMetrics {
  errorRate: number;
  activeUsers: number;
  cpuUsage: number;
  dbConnections: number;
  uptime: number;
  lastCheck: string;
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

    // Simular verificação de saúde do sistema
    const healthMetrics: HealthMetrics = {
      errorRate: Math.random() * 10, // 0-10% error rate
      activeUsers: Math.floor(Math.random() * 100) + 10, // 10-110 users
      cpuUsage: Math.random() * 100, // 0-100% CPU
      dbConnections: Math.floor(Math.random() * 50) + 5, // 5-55 connections
      uptime: Date.now() - 1000 * 60 * 60 * 24, // 24h uptime simulation
      lastCheck: new Date().toISOString()
    };

    // Verificar conexão com banco de dados
    try {
      const { data: dbTest } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (!dbTest) {
        healthMetrics.errorRate += 20; // Aumentar error rate se DB falhou
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      healthMetrics.errorRate = 50; // Alto error rate se DB não acessível
    }

    // Log da verificação de saúde
    await supabase.from('chatbot_logs').insert({
      function_name: 'system-health-check',
      level: 'info',
      message: 'System health check executed',
      metadata: {
        metrics: healthMetrics,
        type: 'health_check'
      },
      correlation_id: crypto.randomUUID()
    });

    return new Response(JSON.stringify({
      success: true,
      ...healthMetrics,
      status: healthMetrics.errorRate < 5 ? 'healthy' : 
               healthMetrics.errorRate < 15 ? 'warning' : 'critical',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      status: 'error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});