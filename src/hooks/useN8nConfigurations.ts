import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { N8nConfiguration, WebhookEventKey, N8nStats } from '@/types/n8n-webhooks';
import type { Database } from '@/integrations/supabase/types';

type N8nConfigRow = Database['public']['Tables']['n8n_configurations']['Row'];
type N8nConfigInsert = Database['public']['Tables']['n8n_configurations']['Insert'];

export function useN8nConfigurations() {
  const [configurations, setConfigurations] = useState<N8nConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConfigurations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('n8n_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConfigurations(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar configurações n8n:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (config: Partial<N8nConfigInsert>) => {
    if (!user) return null;

    try {
      // Buscar empresa_id do usuário logado
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Empresa não encontrada para o usuário');
      }

      const configToSave: N8nConfigInsert = {
        ...config,
        empresa_id: profile.empresa_id,
        instance_url: config.instance_url || 'https://app.n8n.cloud',
      };

      const { data, error: saveError } = await supabase
        .from('n8n_configurations')
        .upsert(configToSave)
        .select()
        .single();

      if (saveError) throw saveError;

      toast({
        title: "Configuração salva",
        description: "As configurações n8n foram salvas com sucesso.",
      });

      await fetchConfigurations();
      return data;
    } catch (err: any) {
      console.error('Erro ao salvar configuração n8n:', err);
      toast({
        title: "Erro ao salvar",
        description: err.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateWebhookEvent = async (
    configId: string,
    eventKey: WebhookEventKey,
    updates: {
      enabled?: boolean;
      webhook_url?: string;
    }
  ) => {
    try {
      const config = configurations.find(c => c.id === configId);
      if (!config) throw new Error('Configuração não encontrada');

      const currentSettings = config.settings as any || {};
      const updatedSettings = {
        ...currentSettings,
        events: {
          ...currentSettings.events,
          [eventKey]: {
            ...currentSettings.events?.[eventKey],
            ...updates,
          }
        }
      };

      const { error: updateError } = await supabase
        .from('n8n_configurations')
        .update({
          settings: updatedSettings,
        })
        .eq('id', configId);

      if (updateError) throw updateError;

      toast({
        title: "Webhook atualizado",
        description: `Configuração do evento ${eventKey} atualizada com sucesso.`,
      });

      await fetchConfigurations();
    } catch (err: any) {
      console.error('Erro ao atualizar webhook:', err);
      toast({
        title: "Erro ao atualizar",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const deleteConfiguration = async (configId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('n8n_configurations')
        .delete()
        .eq('id', configId);

      if (deleteError) throw deleteError;

      toast({
        title: "Configuração removida",
        description: "A configuração n8n foi removida com sucesso.",
      });

      await fetchConfigurations();
    } catch (err: any) {
      console.error('Erro ao deletar configuração:', err);
      toast({
        title: "Erro ao deletar",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConfigurations();
  }, [user]);

  return {
    configurations,
    loading,
    error,
    refetch: fetchConfigurations,
    saveConfiguration,
    updateWebhookEvent,
    deleteConfiguration,
  };
}

export function useN8nStats() {
  const [stats, setStats] = useState<N8nStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar configurações ativas
      const { data: configs } = await supabase
        .from('n8n_configurations')
        .select('*')
        .eq('status', 'active');

      // Buscar logs de execução das últimas 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: logs } = await supabase
        .from('n8n_execution_logs')
        .select('*')
        .gte('created_at', yesterday.toISOString());

      // Calcular estatísticas
      const activeConfigs = configs || [];
      const execLogs = logs || [];

      const totalExecutionsToday = execLogs.length;
      const successfulExecutions = execLogs.filter(log => log.status === 'success').length;
      const successRate = totalExecutionsToday > 0 ? (successfulExecutions / totalExecutionsToday) * 100 : 0;

      const avgExecutionTime = execLogs.length > 0
        ? execLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / execLogs.length
        : 0;

      const lastExecution = execLogs.length > 0
        ? execLogs.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0].created_at
        : null;

      // Agregar dados de eventos de webhook
      const webhookEvents: N8nStats['webhook_events'] = {};
      activeConfigs.forEach(config => {
        const settings = config.settings as any;
        if (settings?.events) {
          Object.entries(settings.events).forEach(([eventKey, eventData]: [string, any]) => {
            if (eventData && typeof eventData === 'object') {
              webhookEvents[eventKey as WebhookEventKey] = {
                total_triggers: eventData.success_count || 0,
                success_rate: eventData.success_count && eventData.error_count 
                  ? (eventData.success_count / (eventData.success_count + eventData.error_count)) * 100
                  : 100,
                last_triggered: eventData.last_triggered,
              };
            }
          });
        }
      });

      const calculatedStats: N8nStats = {
        total_workflows: activeConfigs.reduce((sum, config) => sum + (config.workflow_count || 0), 0),
        active_workflows: activeConfigs.length,
        total_executions_today: totalExecutionsToday,
        success_rate_today: successRate,
        avg_execution_time_ms: avgExecutionTime,
        last_execution: lastExecution,
        webhook_events: webhookEvents,
      };

      setStats(calculatedStats);
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas n8n:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  return {
    stats,
    loading,
    refetch: fetchStats,
  };
}