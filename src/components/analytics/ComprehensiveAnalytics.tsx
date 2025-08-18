import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, MessageSquare, 
  Clock, CheckCircle, AlertCircle, Download, 
  Calendar, Filter, RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRealData } from '@/hooks/useRealData';

interface AnalyticsData {
  total_conversations: number;
  resolved_conversations: number;
  avg_response_time_minutes: number;
  total_messages: number;
  active_agents: number;
  satisfaction_score: number;
}

interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_category: string;
  created_at: string;
}

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#a4de6c'];

export function ComprehensiveAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const { loadAnalytics: loadRealAnalytics } = useRealData();

  const loadAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Carregar dados reais de analytics
      const analyticsData = await loadRealAnalytics();
      
      if (analyticsData) {
        setAnalytics(analyticsData);
      }

      // Simular métricas de performance por enquanto - será implementado futuramente
      const mockMetrics: PerformanceMetric[] = [
        {
          id: '1',
          metric_name: 'response_time',
          metric_value: 250,
          metric_category: 'response_time',
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          metric_name: 'system_performance',
          metric_value: 85,
          metric_category: 'system_performance',
          created_at: new Date().toISOString()
        }
      ];
      setPerformanceMetrics(mockMetrics);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user, dateRange]);

  const exportData = async () => {
    if (!analytics) return;
    
    const data = {
      analytics,
      performanceMetrics,
      dateRange,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange.start}-${dateRange.end}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Dados exportados",
      description: "Os dados analíticos foram exportados com sucesso.",
    });
  };

  const getMetricsByCategory = (category: string) => {
    return performanceMetrics
      .filter(m => m.metric_category === category)
      .slice(0, 10)
      .map(m => ({
        name: new Date(m.created_at).toLocaleDateString(),
        value: m.metric_value
      }));
  };

  const conversionRate = analytics ? 
    (analytics.resolved_conversations / Math.max(analytics.total_conversations, 1) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Analytics Avançado</h2>
          <p className="text-muted-foreground">
            Análise detalhada de performance e métricas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-1 border rounded"
            />
            <span>até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-1 border rounded"
            />
          </div>
          
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_conversations}</div>
              <Badge variant="secondary" className="mt-1">
                {analytics.resolved_conversations} resolvidas
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                {conversionRate > 80 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                {conversionRate > 80 ? 'Excelente' : 'Precisa melhorar'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avg_response_time_minutes.toFixed(1)}min</div>
              <Badge 
                variant={analytics.avg_response_time_minutes < 5 ? "default" : "destructive"}
                className="mt-1"
              >
                {analytics.avg_response_time_minutes < 5 ? 'Rápido' : 'Lento'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.active_agents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.total_messages} mensagens
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversas por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Resolvidas', value: analytics?.resolved_conversations || 0 },
                        { name: 'Pendentes', value: (analytics?.total_conversations || 0) - (analytics?.resolved_conversations || 0) }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getMetricsByCategory('response_time')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Performance</CardTitle>
              <CardDescription>
                Acompanhe as métricas de sistema ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={getMetricsByCategory('system_performance')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Tendências</CardTitle>
              <CardDescription>
                Identificação de padrões e tendências nos dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getMetricsByCategory('user_activity')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">Sistema Operacional</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span className="text-sm">Monitoramento Ativo</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-sm">Performance Estável</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}