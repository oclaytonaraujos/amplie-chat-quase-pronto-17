
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Timer,
  Users,
  TrendingUp,
  Building2,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { useSupabaseProfile } from '@/hooks/useSupabaseProfile';
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
  Cell
} from 'recharts';

const atendimentosData = [
  { nome: 'Seg', atendimentos: 45 },
  { nome: 'Ter', atendimentos: 38 },
  { nome: 'Qua', atendimentos: 52 },
  { nome: 'Qui', atendimentos: 41 },
  { nome: 'Sex', atendimentos: 67 },
  { nome: 'Sáb', atendimentos: 23 },
  { nome: 'Dom', atendimentos: 18 }
];

const setoresData = [
  { nome: 'Vendas', valor: 45, cor: '#4F46E5' },
  { nome: 'Suporte', valor: 32, cor: '#10B981' },
  { nome: 'Financeiro', valor: 18, cor: '#F59E0B' },
  { nome: 'RH', valor: 5, cor: '#EF4444' }
];

const topAgentes = [
  { nome: 'Ana Silva', atendimentos: 23, setor: 'Vendas' },
  { nome: 'Carlos Santos', atendimentos: 19, setor: 'Suporte' },
  { nome: 'Maria Oliveira', atendimentos: 17, setor: 'Vendas' },
  { nome: 'João Costa', atendimentos: 15, setor: 'Financeiro' }
];

// Custom tooltip for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200/50">
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className="text-indigo-600 font-semibold">
          <span className="inline-block w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
          {payload[0].value} atendimentos
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const total = setoresData.reduce((sum, item) => sum + item.valor, 0);
    const percentage = ((payload[0].value / total) * 100).toFixed(1);
    
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200/50">
        <p className="font-semibold text-gray-800">{payload[0].name}</p>
        <p className="text-gray-600">
          <span 
            className="inline-block w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: payload[0].payload.cor }}
          ></span>
          {payload[0].value} atendimentos ({percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

// Custom label for pie chart with responsive sizing
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, viewBox }: any) => {
  if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Responsive font size based on chart size
  const fontSize = viewBox?.width < 300 ? '10px' : viewBox?.width < 400 ? '12px' : '14px';

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="font-semibold drop-shadow-md"
      style={{ fontSize }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard() {
  const { profile, loading } = useSupabaseProfile();

  console.log('Dashboard - Profile:', profile);
  console.log('Dashboard - Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Perfil não encontrado</h2>
          <p className="text-gray-600 mb-4">
            Não foi possível carregar seu perfil. Entre em contato com o administrador.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo, {profile.nome}!
        </h1>
        <p className="opacity-90">
          Aqui está um resumo das suas métricas de atendimento
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Atendimentos em Aberto"
          value={42}
          icon={<MessageSquare className="w-6 h-6 text-white" />}
          iconColor="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        
        <MetricCard
          title="Finalizados Hoje"
          value={18}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          iconColor="bg-gradient-to-r from-green-500 to-green-600"
        />
        
        <MetricCard
          title="Tempo Médio de Espera"
          value="2m 34s"
          icon={<Clock className="w-6 h-6 text-white" />}
          iconColor="bg-gradient-to-r from-orange-500 to-orange-600"
        />
        
        <MetricCard
          title="Tempo Médio de Atendimento"
          value="8m 12s"
          icon={<Timer className="w-6 h-6 text-white" />}
          iconColor="bg-gradient-to-r from-purple-500 to-purple-600"
        />
      </div>

      {/* Gráficos e Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Atendimentos por Dia */}
        <ChartCard
          title="Atendimentos por Dia"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          iconColor="bg-gradient-to-r from-indigo-500 to-indigo-600"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={atendimentosData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.4}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E5E7EB" 
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis 
                dataKey="nome" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar 
                dataKey="atendimentos" 
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Gráfico de Atendimentos por Setor */}
        <ChartCard
          title="Atendimentos por Setor"
          icon={<Building2 className="w-5 h-5 text-white" />}
          iconColor="bg-gradient-to-r from-teal-500 to-teal-600"
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {setoresData.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={entry.cor} stopOpacity={0.8}/>
                        <stop offset="100%" stopColor={entry.cor} stopOpacity={1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={setoresData}
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="40%"
                    fill="#8884d8"
                    dataKey="valor"
                    stroke="white"
                    strokeWidth={2}
                  >
                    {setoresData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index})`}
                        className="hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-shrink-0 pt-4">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-4">
                {setoresData.map((entry, index) => (
                  <div key={index} className="flex items-center space-x-2 min-w-0">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.cor }}
                    ></div>
                    <span className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                      {entry.nome}
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:inline">
                      ({entry.valor})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Status do Kanban e Top Agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini Kanban */}
        <div className="bg-white rounded-xl shadow-amplie p-6 hover:shadow-amplie-hover transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Status dos Tickets</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <p className="text-2xl font-bold text-blue-600">12</p>
              <p className="text-sm text-gray-600">Novos</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
              <p className="text-2xl font-bold text-yellow-600">18</p>
              <p className="text-sm text-gray-600">Em Atendimento</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
              <p className="text-2xl font-bold text-orange-600">8</p>
              <p className="text-sm text-gray-600">Aguardando Cliente</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
              <p className="text-2xl font-bold text-green-600">4</p>
              <p className="text-sm text-gray-600">Finalizados</p>
            </div>
          </div>
        </div>

        {/* Top Agentes */}
        <div className="bg-white rounded-xl shadow-amplie p-6 hover:shadow-amplie-hover transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Agentes Hoje</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-4">
            {topAgentes.map((agente, index) => (
              <div key={agente.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{agente.nome}</p>
                    <p className="text-sm text-gray-500">{agente.setor}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{agente.atendimentos}</p>
                  <p className="text-sm text-gray-500">atendimentos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
