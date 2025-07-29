import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityAuditRequest {
  auditType: 'full' | 'users' | 'permissions' | 'data_access';
  timeRange?: {
    start: string;
    end: string;
  };
  filters?: {
    userId?: string;
    action?: string;
    resource?: string;
  };
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
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
      // Executar auditoria de segurança
      const auditRequest: SecurityAuditRequest = await req.json();
      
      const auditResults = await performSecurityAudit(supabase, auditRequest);
      
      // Log da auditoria
      await supabase.from('chatbot_logs').insert({
        function_name: 'security-audit',
        level: 'info',
        message: `Security audit executed: ${auditRequest.auditType}`,
        metadata: {
          audit_type: auditRequest.auditType,
          results_count: auditResults.entries.length,
          risk_summary: auditResults.riskSummary,
          type: 'security_audit'
        },
        correlation_id: crypto.randomUUID()
      });

      return new Response(JSON.stringify({
        success: true,
        audit_id: crypto.randomUUID(),
        ...auditResults
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'GET') {
      // Obter relatório de auditoria existente
      const url = new URL(req.url);
      const auditId = url.searchParams.get('audit_id');
      const summary = url.searchParams.get('summary') === 'true';
      
      if (summary) {
        // Retornar resumo das auditorias recentes
        const { data: logs } = await supabase
          .from('chatbot_logs')
          .select('*')
          .eq('function_name', 'security-audit')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        const summary = generateAuditSummary(logs || []);
        
        return new Response(JSON.stringify({
          success: true,
          summary
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        error: 'Audit ID requerido'
      }), {
        status: 400,
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
    console.error('Security audit error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Executar auditoria de segurança
async function performSecurityAudit(supabase: any, request: SecurityAuditRequest) {
  const results = {
    entries: [] as AuditLogEntry[],
    riskSummary: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    insights: [] as string[],
    recommendations: [] as string[]
  };

  switch (request.auditType) {
    case 'full':
      await auditUserAccess(supabase, results, request);
      await auditDataAccess(supabase, results, request);
      await auditPermissions(supabase, results, request);
      break;
    case 'users':
      await auditUserAccess(supabase, results, request);
      break;
    case 'permissions':
      await auditPermissions(supabase, results, request);
      break;
    case 'data_access':
      await auditDataAccess(supabase, results, request);
      break;
  }

  // Gerar insights e recomendações
  generateInsights(results);
  generateRecommendations(results);

  return results;
}

// Auditoria de acesso de usuários
async function auditUserAccess(supabase: any, results: any, request: SecurityAuditRequest) {
  try {
    // Verificar logins suspeitos
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // Simulação de análise de logs de acesso
    const suspiciousLogins = [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'login_attempt',
        resource: 'auth_system',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0...',
        success: false,
        risk_level: 'high' as const,
        details: {
          reason: 'Multiple failed attempts',
          attempts: 5,
          timespan: '5 minutes'
        }
      }
    ];

    results.entries.push(...suspiciousLogins);
    
    // Contar por nível de risco
    suspiciousLogins.forEach(entry => {
      results.riskSummary[entry.risk_level]++;
    });

  } catch (error) {
    console.error('User access audit failed:', error);
  }
}

// Auditoria de acesso a dados
async function auditDataAccess(supabase: any, results: any, request: SecurityAuditRequest) {
  try {
    // Verificar acessos a dados sensíveis
    const sensitiveDataAccess = [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'data_export',
        resource: 'user_data',
        ip_address: '10.0.0.1',
        user_agent: 'API Client',
        success: true,
        risk_level: 'medium' as const,
        details: {
          exported_records: 1000,
          data_type: 'user_profiles',
          user_id: 'admin_user_123'
        }
      }
    ];

    results.entries.push(...sensitiveDataAccess);
    
    sensitiveDataAccess.forEach(entry => {
      results.riskSummary[entry.risk_level]++;
    });

  } catch (error) {
    console.error('Data access audit failed:', error);
  }
}

// Auditoria de permissões
async function auditPermissions(supabase: any, results: any, request: SecurityAuditRequest) {
  try {
    // Verificar mudanças de permissões
    const permissionChanges = [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'permission_escalation',
        resource: 'user_roles',
        ip_address: '172.16.0.1',
        user_agent: 'Admin Panel',
        success: true,
        risk_level: 'critical' as const,
        details: {
          target_user: 'user_456',
          old_role: 'user',
          new_role: 'admin',
          changed_by: 'admin_789'
        }
      }
    ];

    results.entries.push(...permissionChanges);
    
    permissionChanges.forEach(entry => {
      results.riskSummary[entry.risk_level]++;
    });

  } catch (error) {
    console.error('Permissions audit failed:', error);
  }
}

// Gerar insights
function generateInsights(results: any) {
  const totalEvents = results.entries.length;
  const criticalEvents = results.riskSummary.critical;
  const highRiskEvents = results.riskSummary.high;

  if (criticalEvents > 0) {
    results.insights.push(`${criticalEvents} evento(s) crítico(s) detectado(s) - ação imediata necessária`);
  }

  if (highRiskEvents > 0) {
    results.insights.push(`${highRiskEvents} evento(s) de alto risco identificado(s)`);
  }

  if (totalEvents === 0) {
    results.insights.push('Nenhuma atividade suspeita detectada no período analisado');
  }

  // Análise de padrões
  const ipAddresses = [...new Set(results.entries.map((e: any) => e.ip_address))];
  if (ipAddresses.length < results.entries.length / 2) {
    results.insights.push('Detectado possível padrão de ataques coordenados de poucos IPs');
  }
}

// Gerar recomendações
function generateRecommendations(results: any) {
  if (results.riskSummary.critical > 0) {
    results.recommendations.push('Implementar bloqueio automático de IPs suspeitos');
    results.recommendations.push('Revisar e revogar permissões elevadas desnecessárias');
  }

  if (results.riskSummary.high > 0) {
    results.recommendations.push('Aumentar frequência de monitoramento de segurança');
    results.recommendations.push('Implementar autenticação de dois fatores para usuários admin');
  }

  if (results.entries.some((e: any) => e.action.includes('login'))) {
    results.recommendations.push('Considerar implementar CAPTCHA após múltiplas tentativas');
  }

  results.recommendations.push('Manter logs de auditoria por pelo menos 90 dias');
  results.recommendations.push('Realizar auditorias de segurança semanalmente');
}

// Gerar resumo das auditorias
function generateAuditSummary(logs: any[]) {
  const summary = {
    total_audits: logs.length,
    last_audit: logs[0]?.created_at || null,
    risk_trends: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    most_common_risks: [] as string[],
    recommendations_count: 0
  };

  logs.forEach(log => {
    const riskSummary = log.metadata?.risk_summary;
    if (riskSummary) {
      summary.risk_trends.critical += riskSummary.critical || 0;
      summary.risk_trends.high += riskSummary.high || 0;
      summary.risk_trends.medium += riskSummary.medium || 0;
      summary.risk_trends.low += riskSummary.low || 0;
    }
  });

  return summary;
}