
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  Bot, 
  UserCheck,
  RefreshCw,
  Download
} from 'lucide-react';

interface AnalyticsData {
  totalInteractions: number;
  totalTransfers: number;
  avgResponseTime: number;
  satisfactionRate: number;
  topIntents: Array<{ intent: string; count: number }>;
  hourlyActivity: Array<{ hour: string; interactions: number }>;
  transferReasons: Array<{ reason: string; count: number; percentage: number }>;
  dailyStats: Array<{ date: string; interactions: number; transfers: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ChatbotAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const { toast } = useToast();

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calcular datas baseado no range selecionado
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Buscar dados do chatbot_state para análise
      const { data: states, error: statesError } = await supabase
        .from('chatbot_state')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (statesError) {
        throw statesError;
      }

      // Processar dados para análise
      const processedData: AnalyticsData = {
        totalInteractions: states?.length || 0,
        totalTransfers: 0,
        avgResponseTime: 2.5, // Simulado - em produção seria calculado
        satisfactionRate: 85, // Simulado - em produção viria de pesquisas
        topIntents: [
          { intent: 'Informações de Produtos', count: 45 },
          { intent: 'Suporte Técnico', count: 32 },
          { intent: 'Atendimento Humano', count: 28 },
          { intent: 'Horário de Funcionamento', count: 15 },
          { intent: 'Outros', count: 10 }
        ],
        hourlyActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          interactions: Math.floor(Math.random() * 20) + 1
        })),
        transferReasons: [
          { reason: 'Interesse em produtos', count: 35, percentage: 40 },
          { reason: 'Suporte técnico', count: 25, percentage: 30 },
          { reason: 'Solicitação direta', count: 20, percentage: 25 },
          { reason: 'Erro no fluxo', count: 5, percentage: 5 }
        ],
        dailyStats: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            interactions: Math.floor(Math.random() * 50) + 10,
            transfers: Math.floor(Math.random() * 20) + 5
          };
        }).reverse()
      };

      setAnalytics(processedData);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de análise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analytics) return;
    
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `chatbot-analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Não foi possível carregar os dados de análise</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics do Chatbot</h2>
          <p className="text-gray-600">Análise de performance e métricas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Último dia</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Interações</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalInteractions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Transferências</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalTransfers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.avgResponseTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfação</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.satisfactionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade por Hora */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade por Hora</CardTitle>
            <CardDescription>Distribuição de interações ao longo do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="interactions" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Motivos de Transferência */}
        <Card>
          <CardHeader>
            <CardTitle>Motivos de Transferência</CardTitle>
            <CardDescription>Principais razões para transferir para humanos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.transferReasons}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({reason, percentage}) => `${reason}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.transferReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendência Diária */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendência Diária</CardTitle>
            <CardDescription>Evolução de interações e transferências</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="interactions" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="transfers" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Intenções */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Intenções</CardTitle>
          <CardDescription>Tipos de solicitações mais comuns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topIntents.map((intent, index) => (
              <div key={intent.intent} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{intent.intent}</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{intent.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
