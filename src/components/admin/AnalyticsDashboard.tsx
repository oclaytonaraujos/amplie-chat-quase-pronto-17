import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon, Download, Bell, TrendingUp, Users, MessageCircle, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AdminSummary } from './AdminSummary';

interface AnalyticsData {
  totalAtendimentos: number;
  atendimentosPorEmpresa: Array<{ nome: string; total: number }>;
  tempoMedioAtendimento: number;
  usuariosAtivos: number;
  conversasPorDia: Array<{ data: string; conversas: number }>;
  empresasMaisAtivas: Array<{ nome: string; conversas: number; usuarios: number }>;
}

interface DashboardAlert {
  id: string;
  tipo: 'warning' | 'error' | 'info';
  titulo: string;
  descricao: string;
  empresa?: string;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    loadEmpresas();
    checkAlerts();
  }, [selectedEmpresa, dateRange]);

  const loadEmpresas = async () => {
    try {
      const { data: empresasData, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEmpresas(empresasData || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const fromDate = dateRange?.from || startOfMonth(new Date());
      const toDate = dateRange?.to || endOfMonth(new Date());

      // Consultas paralelas para otimizar performance
      const queries = [
        // Total de conversas
        selectedEmpresa === 'all' ? 
          supabase
            .from('conversas')
            .select('id, empresa_id, created_at, empresas(nome)')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString()) :
          supabase
            .from('conversas')
            .select('id, empresa_id, created_at, empresas(nome)')
            .gte('created_at', fromDate.toISOString())
            .lte('created_at', toDate.toISOString())
            .eq('empresa_id', selectedEmpresa),

        // Usuários ativos
        selectedEmpresa === 'all' ?
          supabase
            .from('profiles')
            .select('id, empresa_id, status')
            .eq('status', 'online') :
          supabase
            .from('profiles')
            .select('id, empresa_id, status')
            .eq('status', 'online')
            .eq('empresa_id', selectedEmpresa),

        // Mensagens para calcular TMA
        supabase
          .from('mensagens')
          .select('id, created_at, conversa_id, conversas(empresa_id)')
          .gte('created_at', fromDate.toISOString())
          .lte('created_at', toDate.toISOString())
      ];

      const [conversasResult, usuariosResult, mensagensResult] = await Promise.all(queries);

      if (conversasResult.error) throw conversasResult.error;
      if (usuariosResult.error) throw usuariosResult.error;
      if (mensagensResult.error) throw mensagensResult.error;

      const conversas = conversasResult.data || [];
      const usuarios = usuariosResult.data || [];
      const mensagens = mensagensResult.data || [];

      // Processar dados
      const atendimentosPorEmpresa = processarAtendimentosPorEmpresa(conversas);
      const conversasPorDia = processarConversasPorDia(conversas);
      const empresasMaisAtivas = processarEmpresasMaisAtivas(conversas, usuarios);
      const tempoMedioAtendimento = calcularTMA(mensagens);

      setData({
        totalAtendimentos: conversas.length,
        atendimentosPorEmpresa,
        tempoMedioAtendimento,
        usuariosAtivos: usuarios.length,
        conversasPorDia,
        empresasMaisAtivas
      });
    } catch (error) {
      console.error('Erro ao carregar dados analytics:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processarAtendimentosPorEmpresa = (conversas: any[]) => {
    const empresaCount: Record<string, number> = {};
    
    conversas.forEach(conversa => {
      const empresaNome = conversa.empresas?.nome || 'Sem empresa';
      empresaCount[empresaNome] = (empresaCount[empresaNome] || 0) + 1;
    });

    return Object.entries(empresaCount).map(([nome, total]) => ({ nome, total }));
  };

  const processarConversasPorDia = (conversas: any[]) => {
    const diasCount: Record<string, number> = {};
    
    conversas.forEach(conversa => {
      const dia = format(new Date(conversa.created_at), 'dd/MM', { locale: ptBR });
      diasCount[dia] = (diasCount[dia] || 0) + 1;
    });

    return Object.entries(diasCount).map(([data, conversas]) => ({ data, conversas }));
  };

  const processarEmpresasMaisAtivas = (conversas: any[], usuarios: any[]) => {
    const empresaStats: Record<string, { conversas: number; usuarios: number }> = {};
    
    conversas.forEach(conversa => {
      const empresaNome = conversa.empresas?.nome || 'Sem empresa';
      if (!empresaStats[empresaNome]) {
        empresaStats[empresaNome] = { conversas: 0, usuarios: 0 };
      }
      empresaStats[empresaNome].conversas++;
    });

    usuarios.forEach(usuario => {
      // Aqui seria necessário relacionar com empresa via join
      // Por simplicidade, não implementaremos agora
    });

    return Object.entries(empresaStats)
      .map(([nome, stats]) => ({ nome, ...stats }))
      .sort((a, b) => b.conversas - a.conversas)
      .slice(0, 5);
  };

  const calcularTMA = (mensagens: any[]) => {
    if (mensagens.length === 0) return 0;
    
    // Agrupar mensagens por conversa
    const conversaGroups: Record<string, any[]> = {};
    mensagens.forEach(mensagem => {
      if (!conversaGroups[mensagem.conversa_id]) {
        conversaGroups[mensagem.conversa_id] = [];
      }
      conversaGroups[mensagem.conversa_id].push(mensagem);
    });

    let totalTempo = 0;
    let conversasComTempo = 0;

    Object.values(conversaGroups).forEach(mensagensConversa => {
      if (mensagensConversa.length >= 2) {
        const primeira = new Date(mensagensConversa[0].created_at).getTime();
        const ultima = new Date(mensagensConversa[mensagensConversa.length - 1].created_at).getTime();
        const duracao = (ultima - primeira) / (1000 * 60); // em minutos
        
        if (duracao > 0 && duracao < 1440) { // máximo 24 horas
          totalTempo += duracao;
          conversasComTempo++;
        }
      }
    });

    return conversasComTempo > 0 ? Math.round(totalTempo / conversasComTempo) : 0;
  };

  const checkAlerts = async () => {
    // Verificar alertas automáticos
    const newAlerts: DashboardAlert[] = [];

    try {
      // Verificar uso de planos
      const { data: empresas } = await supabase
        .from('empresas')
        .select(`
          id, nome, limite_usuarios, limite_contatos,
          profiles(count),
          contatos(count)
        `);

      empresas?.forEach(empresa => {
        const usuariosCount = empresa.profiles?.length || 0;
        const contatosCount = empresa.contatos?.length || 0;

        if (usuariosCount >= empresa.limite_usuarios * 0.9) {
          newAlerts.push({
            id: `usuarios-${empresa.id}`,
            tipo: 'warning',
            titulo: 'Limite de usuários próximo',
            descricao: `${empresa.nome} está usando ${usuariosCount}/${empresa.limite_usuarios} usuários`,
            empresa: empresa.nome
          });
        }

        if (contatosCount >= empresa.limite_contatos * 0.9) {
          newAlerts.push({
            id: `contatos-${empresa.id}`,
            tipo: 'warning',
            titulo: 'Limite de contatos próximo',
            descricao: `${empresa.nome} está usando ${contatosCount}/${empresa.limite_contatos} contatos`,
            empresa: empresa.nome
          });
        }
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Erro ao verificar alertas:', error);
    }
  };

  const exportarRelatorio = (formato: 'pdf' | 'csv') => {
    if (!data) return;

    if (formato === 'csv') {
      const csvContent = [
        ['Empresa', 'Atendimentos'],
        ...data.atendimentosPorEmpresa.map(item => [item.nome, item.total.toString()])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      toast({
        title: "Exportação PDF",
        description: "Funcionalidade de exportação PDF será implementada em breve",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {empresas.map(empresa => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                "Selecionar período"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => exportarRelatorio('csv')}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => exportarRelatorio('pdf')}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas e Notificações
          </h3>
          <div className="grid gap-2">
            {alerts.map(alert => (
              <Card key={alert.id} className="border-l-4 border-l-warning">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{alert.titulo}</h4>
                      <p className="text-sm text-muted-foreground">{alert.descricao}</p>
                    </div>
                    <Badge variant={alert.tipo === 'warning' ? 'secondary' : 'destructive'}>
                      {alert.tipo === 'warning' ? 'Atenção' : 'Crítico'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Atendimentos</p>
                <p className="text-3xl font-bold">{data?.totalAtendimentos || 0}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">TMA (min)</p>
                <p className="text-3xl font-bold">{data?.tempoMedioAtendimento || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-3xl font-bold">{data?.usuariosAtivos || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Crescimento</p>
                <p className="text-3xl font-bold">+12.5%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atendimentos por Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.atendimentosPorEmpresa || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversas por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.conversasPorDia || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="conversas" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Empresas Mais Ativas */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Mais Ativas</CardTitle>
          <CardDescription>Top 5 empresas por volume de atendimentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.empresasMaisAtivas.map((empresa, index) => (
              <div key={empresa.nome} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{empresa.nome}</h4>
                    <p className="text-sm text-muted-foreground">{empresa.conversas} conversas</p>
                  </div>
                </div>
                <Badge variant="outline">{empresa.usuarios} usuários</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}