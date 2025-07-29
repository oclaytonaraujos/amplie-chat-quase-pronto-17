import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, Square, Settings, Plus, Clock, 
  Zap, GitBranch, MessageSquare, Users, 
  Calendar, Timer, Target, BarChart3,
  CheckCircle, AlertTriangle, XCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  conditions: any;
  actions: any;
  enabled: boolean;
  priority: number;
  cooldown_minutes: number;
  max_activations_per_day: number;
  created_at: string;
  updated_at: string;
}

interface ExecutionLog {
  id: string;
  automation_id: string;
  trigger_data: any;
  execution_time_ms: number;
  status: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

const TRIGGER_TYPES = [
  { value: 'message_received', label: 'Mensagem Recebida', icon: MessageSquare },
  { value: 'user_joined', label: 'Usuário Ingressou', icon: Users },
  { value: 'time_based', label: 'Baseado em Tempo', icon: Clock },
  { value: 'keyword_detected', label: 'Palavra-chave Detectada', icon: Target },
  { value: 'conversation_idle', label: 'Conversa Inativa', icon: Timer },
  { value: 'custom_event', label: 'Evento Personalizado', icon: Zap }
];

const ACTION_TYPES = [
  { value: 'send_message', label: 'Enviar Mensagem', icon: MessageSquare },
  { value: 'assign_agent', label: 'Atribuir Agente', icon: Users },
  { value: 'add_tag', label: 'Adicionar Tag', icon: Target },
  { value: 'transfer_conversation', label: 'Transferir Conversa', icon: GitBranch },
  { value: 'schedule_reminder', label: 'Agendar Lembrete', icon: Calendar },
  { value: 'create_ticket', label: 'Criar Ticket', icon: Plus }
];

export function AdvancedAutomationBuilder() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAutomation, setSelectedAutomation] = useState<AutomationRule | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const loadAutomations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Simulate automation data for now
      const mockAutomations: AutomationRule[] = [
        {
          id: '1',
          name: 'Auto Resposta de Boas Vindas',
          description: 'Envia mensagem automática quando usuário se conecta',
          trigger_type: 'user_joined',
          conditions: {},
          actions: {},
          enabled: true,
          priority: 5,
          cooldown_minutes: 0,
          max_activations_per_day: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setAutomations(mockAutomations);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const loadExecutionLogs = useCallback(async () => {
    if (!user) return;
    
    try {
      // Simulate execution logs for now
      const mockLogs: ExecutionLog[] = [
        {
          id: '1',
          automation_id: '1',
          trigger_data: { test: true },
          execution_time_ms: 150,
          status: 'completed',
          created_at: new Date().toISOString()
        }
      ];
      setExecutionLogs(mockLogs);
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }, [user]);

  useEffect(() => {
    loadAutomations();
    loadExecutionLogs();
  }, [loadAutomations, loadExecutionLogs]);

  const toggleAutomation = async (automation: AutomationRule) => {
    try {
      const { error } = await supabase
        .from('automation_triggers')
        .update({ enabled: !automation.enabled })
        .eq('id', automation.id);

      if (error) throw error;

      toast({
        title: automation.enabled ? "Automação desativada" : "Automação ativada",
        description: `A automação "${automation.name}" foi ${automation.enabled ? 'desativada' : 'ativada'}.`,
      });
      
      loadAutomations();
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: "Erro ao alterar automação",
        description: "Não foi possível alterar o status da automação.",
        variant: "destructive",
      });
    }
  };

  const executeAutomation = async (automation: AutomationRule) => {
    try {
      // Create execution log
      // Simulate execution for now
      console.log('Executing automation:', automation.name);

      toast({
        title: "Automação executada",
        description: `A automação "${automation.name}" foi executada manualmente.`,
      });
      
      loadExecutionLogs();
    } catch (error) {
      console.error('Error executing automation:', error);
      toast({
        title: "Erro na execução",
        description: "Não foi possível executar a automação.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTriggerTypeIcon = (type: string) => {
    const triggerType = TRIGGER_TYPES.find(t => t.value === type);
    const IconComponent = triggerType?.icon || Zap;
    return <IconComponent className="h-4 w-4" />;
  };

  const formatExecutionTime = (timeMs: number) => {
    if (timeMs < 1000) return `${timeMs}ms`;
    return `${(timeMs / 1000).toFixed(2)}s`;
  };

  const getExecutionStats = () => {
    const total = executionLogs.length;
    const completed = executionLogs.filter(log => log.status === 'completed').length;
    const failed = executionLogs.filter(log => log.status === 'failed').length;
    const avgTime = executionLogs.length > 0 
      ? executionLogs.reduce((acc, log) => acc + (log.execution_time_ms || 0), 0) / total
      : 0;

    return { total, completed, failed, avgTime };
  };

  const stats = getExecutionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Automações Avançadas</h2>
          <p className="text-muted-foreground">
            Configure e monitore regras de automação inteligentes
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Automação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Automações</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automations.length}</div>
            <p className="text-xs text-muted-foreground">
              {automations.filter(a => a.enabled).length} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} sucesso, {stats.failed} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas execuções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatExecutionTime(stats.avgTime)}</div>
            <p className="text-xs text-muted-foreground">
              Por execução
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automações</TabsTrigger>
          <TabsTrigger value="logs">Logs de Execução</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          <div className="grid gap-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getTriggerTypeIcon(automation.trigger_type)}
                      <div>
                        <CardTitle className="text-lg">{automation.name}</CardTitle>
                        <CardDescription>{automation.description}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={automation.enabled ? "default" : "secondary"}>
                        {automation.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Badge variant="outline">
                        Prioridade {automation.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Cooldown: {automation.cooldown_minutes}min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>Max: {automation.max_activations_per_day}/dia</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeAutomation(automation)}
                        disabled={!automation.enabled}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Executar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={automation.enabled ? "outline" : "default"}
                        onClick={() => toggleAutomation(automation)}
                      >
                        {automation.enabled ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" />
                            Ativar
                          </>
                        )}
                      </Button>
                      
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>
                Acompanhe todas as execuções das automações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executionLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium">
                          {automations.find(a => a.id === log.automation_id)?.name || 'Automação Desconhecida'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      {log.execution_time_ms && (
                        <div className="flex items-center space-x-1">
                          <Timer className="h-3 w-3" />
                          <span>{formatExecutionTime(log.execution_time_ms)}</span>
                        </div>
                      )}
                      
                      <Badge variant={
                        log.status === 'completed' ? 'default' :
                        log.status === 'failed' ? 'destructive' : 'secondary'
                      }>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {executionLogs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma execução registrada ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Automação</CardTitle>
              <CardDescription>
                Métricas detalhadas sobre o desempenho das automações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Analytics em desenvolvimento</p>
                <p className="text-sm">Gráficos e métricas detalhadas estarão disponíveis em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}