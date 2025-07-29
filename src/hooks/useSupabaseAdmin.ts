
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { logger } from '@/utils/logger';

interface AdminData {
  empresas: any[];
  usuarios: any[];
  planos: any[];
  whatsappConnections: any[];
}

export function useSupabaseAdmin() {
  const [data, setData] = useState<AdminData>({
    empresas: [],
    usuarios: [],
    planos: [],
    whatsappConnections: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();

  const loadAdminData = async () => {
    if (roleLoading || !isSuperAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.info('Carregando dados administrativos...', {
        component: 'useSupabaseAdmin',
        metadata: { isSuperAdmin }
      });

      // Carregar empresas
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

      if (empresasError) {
        logger.error('Erro ao carregar empresas', {
          component: 'useSupabaseAdmin',
          metadata: { error: empresasError }
        }, empresasError);
        throw empresasError;
      }

      // Carregar usuários com informações da empresa
      const { data: usuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select(`
          *,
          empresas (nome)
        `)
        .order('created_at', { ascending: false });

      if (usuariosError) {
        logger.error('Erro ao carregar usuários', {
          component: 'useSupabaseAdmin',
          metadata: { error: usuariosError }
        }, usuariosError);
        throw usuariosError;
      }

      // Carregar planos
      const { data: planos, error: planosError } = await supabase
        .from('planos')
        .select('*')
        .order('created_at', { ascending: false });

      if (planosError) {
        logger.error('Erro ao carregar planos', {
          component: 'useSupabaseAdmin',
          metadata: { error: planosError }
        }, planosError);
        throw planosError;
      }

      // Carregar conexões WhatsApp
      const { data: whatsappConnections, error: whatsappError } = await supabase
        .from('whatsapp_connections')
        .select(`
          *,
          empresas (nome)
        `)
        .order('created_at', { ascending: false });

      if (whatsappError) {
        logger.error('Erro ao carregar conexões WhatsApp', {
          component: 'useSupabaseAdmin',
          metadata: { error: whatsappError }
        }, whatsappError);
        throw whatsappError;
      }

      setData({
        empresas: empresas || [],
        usuarios: usuarios || [],
        planos: planos || [],
        whatsappConnections: whatsappConnections || []
      });

      logger.info('Dados administrativos carregados com sucesso', {
        component: 'useSupabaseAdmin',
        metadata: {
          empresasCount: empresas?.length || 0,
          usuariosCount: usuarios?.length || 0,
          planosCount: planos?.length || 0,
          whatsappConnectionsCount: whatsappConnections?.length || 0
        }
      });
    } catch (error) {
      logger.error('Erro ao carregar dados administrativos', {
        component: 'useSupabaseAdmin'
      }, error as Error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados administrativos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && isSuperAdmin) {
      loadAdminData();
    }
  }, [isSuperAdmin, roleLoading]);

  return {
    ...data,
    loading,
    isSuperAdmin,
    loadAdminData
  };
}
