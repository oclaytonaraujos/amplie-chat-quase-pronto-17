import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, MessageSquare, Clock, Target, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// DateRangePicker será implementado futuramente
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealData } from '@/hooks/useRealData';

interface MetricData {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface ChartData {
  name: string;
  value: number;
  extra?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AdvancedAnalytics() {
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [conversationData, setConversationData] = useState<ChartData[]>([]);
  const [responseTimeData, setResponseTimeData] = useState<ChartData[]>([]);
  const [agentData, setAgentData] = useState<ChartData[]>([]);
  const [statusData, setStatusData] = useState<ChartData[]>([]);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, period]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simular dados de analytics por enquanto
      await loadMetrics();
      await loadChartData();
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const { loadAnalytics: loadRealAnalytics } = useRealData();

  const loadMetrics = async () => {
    try {
      const analyticsData = await loadRealAnalytics();
      
      if (analyticsData) {
        const resolutionRate = analyticsData.total_conversations > 0 
          ? (analyticsData.resolved_conversations / analyticsData.total_conversations * 100) 
          : 0;

        const metrics: MetricData[] = [
          { 
            name: 'Total de Conversas', 
            value: analyticsData.total_conversations, 
            change: 12.5, // Calcular baseado em período anterior
            trend: 'up' 
          },
          { 
            name: 'Tempo Médio de Resposta', 
            value: analyticsData.avg_response_time_minutes, 
            change: -8.2, 
            trend: 'down' 
          },
          { 
            name: 'Taxa de Resolução', 
            value: resolutionRate, 
            change: 5.1, 
            trend: 'up' 
          },
          { 
            name: 'Satisfação do Cliente', 
            value: analyticsData.satisfaction_score, 
            change: 3.2, 
            trend: 'up' 
          },
        ];
        setMetrics(metrics);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      // Fallback para dados padrão se houver erro
      const defaultMetrics: MetricData[] = [
        { name: 'Total de Conversas', value: 0, change: 0, trend: 'stable' },
        { name: 'Tempo Médio de Resposta', value: 0, change: 0, trend: 'stable' },
        { name: 'Taxa de Resolução', value: 0, change: 0, trend: 'stable' },
        { name: 'Satisfação do Cliente', value: 0, change: 0, trend: 'stable' },
      ];
      setMetrics(defaultMetrics);
    }
  };

  const loadChartData = async () => {
    // Dados de conversas por dia
    const mockConversationData: ChartData[] = [
      { name: 'Seg', value: 45, extra: 32 },
      { name: 'Ter', value: 52, extra: 28 },
      { name: 'Qua', value: 38, extra: 35 },
      { name: 'Qui', value: 61, extra: 42 },
      { name: 'Sex', value: 55, extra: 38 },
      { name: 'Sáb', value: 28, extra: 15 },
      { name: 'Dom', value: 22, extra: 12 },
    ];
    setConversationData(mockConversationData);

    // Dados de tempo de resposta
    const mockResponseData: ChartData[] = [
      { name: '00:00', value: 1.2 },
      { name: '04:00', value: 0.8 },
      { name: '08:00', value: 2.5 },
      { name: '12:00', value: 3.1 },
      { name: '16:00', value: 2.8 },
      { name: '20:00', value: 2.2 },
    ];
    setResponseTimeData(mockResponseData);

    // Dados de agentes
    const mockAgentData: ChartData[] = [
      { name: 'Ana Silva', value: 45 },
      { name: 'João Santos', value: 38 },
      { name: 'Maria Costa', value: 32 },
      { name: 'Pedro Lima', value: 28 },
    ];
    setAgentData(mockAgentData);

    // Dados de status
    const mockStatusData: ChartData[] = [
      { name: 'Resolvidas', value: 68 },
      { name: 'Em Andamento', value: 22 },
      { name: 'Pendentes', value: 10 },
    ];
    setStatusData(mockStatusData);
  };

  const exportData = () => {
    // Implementar exportação de dados
    console.log('Exportando dados...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Analytics</h2>
          
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {metric.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : metric.trend === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Target className="h-4 w-4 text-gray-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.name.includes('Tempo') ? `${metric.value}min` : 
                 metric.name.includes('Taxa') || metric.name.includes('Satisfação') ? `${metric.value}%` :
                 metric.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
                {' '}em relação ao período anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversas por Dia */}
        <Card>
          <CardHeader>
            <CardTitle>Conversas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Novas Conversas" />
                <Bar dataKey="extra" fill="#82ca9d" name="Resolvidas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tempo de Resposta */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo de Resposta (min)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance por Agente */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status das Conversas */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Conversas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Badge className="bg-green-100 text-green-800">Positivo</Badge>
              <div>
                <p className="font-medium">Taxa de resolução em alta</p>
                <p className="text-sm text-muted-foreground">A taxa de resolução aumentou 5.1% este mês, indicando melhoria na qualidade do atendimento.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
              <div>
                <p className="font-medium">Pico de demanda às 12h</p>
                <p className="text-sm text-muted-foreground">Considere realocar agentes para o horário de almoço para reduzir tempo de espera.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Badge className="bg-blue-100 text-blue-800">Sugestão</Badge>
              <div>
                <p className="font-medium">Treinamento para Ana Silva</p>
                <p className="text-sm text-muted-foreground">Ana está lidando com 45 conversas. Considere oferecer treinamento em gestão de tempo.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}