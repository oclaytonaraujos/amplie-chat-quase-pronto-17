import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface WhatsAppConnection {
  id: string;
  nome: string;
  numero: string;
  status: string;
  ativo: boolean;
  qr_code?: string;
  ultimo_ping?: string;
}

interface WhatsAppConfig {
  instance_name: string;
  webhook_url?: string;
  ativo: boolean;
  status?: string;
  qr_code?: string;
  last_connected_at?: string;
  numero?: string;
  descricao?: string;
}

export function useWhatsAppIntegration() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConnections = useCallback(async () => {
    try {
      logger.info('Carregando conexões WhatsApp', {
        component: 'useWhatsAppIntegration'
      });

      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConnections((data || []).map(conn => ({
        id: conn.id,
        nome: conn.evolution_instance_name || conn.nome || 'N/A',
        numero: conn.numero || 'N/A',
        status: conn.evolution_status || conn.status || 'desconectado',
        ativo: conn.ativo,
        qr_code: conn.evolution_qr_code || conn.qr_code,
        ultimo_ping: conn.ultimo_ping
      })));
    } catch (error) {
      logger.error('Erro ao carregar conexões WhatsApp', {
        component: 'useWhatsAppIntegration'
      }, error as Error);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('ativo', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setConfig({
          instance_name: data.instance_name,
          webhook_url: data.webhook_url,
          ativo: data.ativo,
          status: data.status,
          qr_code: data.qr_code,
          last_connected_at: data.last_connected_at,
          numero: data.numero,
          descricao: data.descricao
        });
      }
    } catch (error) {
      logger.error('Erro ao carregar configuração Evolution API', {
        component: 'useWhatsAppIntegration'
      }, error as Error);
    }
  }, []);

  const sincronizarConexoes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Usar EvolutionApiGlobalService para gerenciamento de instâncias
      const { data: globalConfig } = await supabase
        .from('evolution_api_global_config')
        .select('api_key, server_url')
        .eq('ativo', true)
        .single();

      if (!globalConfig) {
        throw new Error('Configuração global Evolution API não encontrada');
      }

      // Importar dinamicamente o serviço global
      const { EvolutionApiGlobalService } = await import('@/services/evolution-api');
      const globalService = new EvolutionApiGlobalService(
        globalConfig.server_url,
        globalConfig.api_key
      );

      // Usar a conexão global para buscar instâncias (CRUD operation)
      const instancesData = await globalService.fetchInstances();

      logger.info('Instâncias sincronizadas via API Global', {
        component: 'useWhatsAppIntegration'
      });

      await loadConnections();
      toast({
        title: "Sincronização concluída",
        description: "Conexões WhatsApp sincronizadas com sucesso",
      });
    } catch (error) {
      logger.error('Erro na sincronização via API Global', {
        component: 'useWhatsAppIntegration'
      }, error as Error);
      
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar as conexões WhatsApp",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [loadConnections, toast]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadConnections(), loadConfig()]);
      setLoading(false);
    };

    loadData();
  }, [loadConnections, loadConfig]);

  return {
    connections,
    config,
    loading,
    sincronizarConexoes
  };
}