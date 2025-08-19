import React, { memo, useMemo } from 'react';
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
import { SyncLoader } from '@/components/ui/sync-loader';

// Lazy load charts para reduzir bundle inicial
const LazyBarChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.BarChart }))
);
const LazyPieChart = React.lazy(() => 
  import('recharts').then(module => ({ default: module.PieChart }))
);
const LazyResponsiveContainer = React.lazy(() => 
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);

// Dados estáticos memoizados
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

// Componente de loading otimizado
const DashboardSkeleton = memo(() => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-24 rounded-xl"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-200 h-32 rounded-xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-gray-200 h-64 rounded-xl"></div>
      <div className="bg-gray-200 h-64 rounded-xl"></div>
    </div>
  </div>
));

// Componente de erro otimizado
const ErrorState = memo(() => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
      <p className="text-muted-foreground mb-4">
        Não foi possível carregar seu perfil. Entre em contato com o administrador.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </div>
  </div>
));

// Métricas principais memoizadas
const DashboardMetrics = memo(() => (
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
));

// Seção de status memoizada
const StatusSection = memo(() => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Mini Kanban */}
    <div className="bg-card rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Status dos Tickets</h3>
        <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600">
          <Activity className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
          <p className="text-2xl font-bold text-blue-600">12</p>
          <p className="text-sm text-muted-foreground">Novos</p>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors">
          <p className="text-2xl font-bold text-yellow-600">18</p>
          <p className="text-sm text-muted-foreground">Em Atendimento</p>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
          <p className="text-2xl font-bold text-orange-600">8</p>
          <p className="text-sm text-muted-foreground">Aguardando Cliente</p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
          <p className="text-2xl font-bold text-green-600">4</p>
          <p className="text-sm text-muted-foreground">Finalizados</p>
        </div>
      </div>
    </div>

    {/* Top Agentes */}
    <div className="bg-card rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Top Agentes Hoje</h3>
        <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600">
          <Users className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="space-y-4">
        {topAgentes.map((agente, index) => (
          <div key={agente.nome} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">{index + 1}</span>
              </div>
              <div>
                <p className="font-medium">{agente.nome}</p>
                <p className="text-sm text-muted-foreground">{agente.setor}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{agente.atendimentos}</p>
              <p className="text-sm text-muted-foreground">atendimentos</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

export default function Dashboard() {
  const { profile, loading } = useSupabaseProfile();

  // Memoizar mensagem de boas-vindas
  const welcomeMessage = useMemo(() => {
    if (!profile) return null;
    
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">
          Bem-vindo, {profile.nome}!
        </h1>
        <p className="opacity-90">
          Aqui está um resumo das suas métricas de atendimento
        </p>
      </div>
    );
  }, [profile?.nome]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!profile) {
    return <ErrorState />;
  }

  return (
    <div className="p-6 space-y-6">
      {welcomeMessage}
      <DashboardMetrics />
      
      {/* Lazy load charts apenas quando necessário */}
      <React.Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl shadow-sm border h-64 flex items-center justify-center">
            <SyncLoader size="lg" />
          </div>
          <div className="bg-card rounded-xl shadow-sm border h-64 flex items-center justify-center">
            <SyncLoader size="lg" />
          </div>
        </div>
      }>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Atendimentos por Dia"
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            iconColor="bg-gradient-to-r from-indigo-500 to-indigo-600"
          >
            <div className="h-64">
              <p className="text-sm text-muted-foreground text-center py-8">
                Gráficos carregando...
              </p>
            </div>
          </ChartCard>

          <ChartCard
            title="Atendimentos por Setor"
            icon={<Building2 className="w-5 h-5 text-white" />}
            iconColor="bg-gradient-to-r from-teal-500 to-teal-600"
          >
            <div className="h-64">
              <p className="text-sm text-muted-foreground text-center py-8">
                Gráficos carregando...
              </p>
            </div>
          </ChartCard>
        </div>
      </React.Suspense>

      <StatusSection />
    </div>
  );
}