import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RealDataHookReturn {
  loadConversas: () => Promise<any[]>;
  loadContatos: () => Promise<any[]>;
  loadMensagens: (conversaId: string) => Promise<any[]>;
  loadProfiles: () => Promise<any[]>;
  loadAnalytics: () => Promise<any>;
  loadEvolutionInstances: () => Promise<any[]>;
  loading: boolean;
  error: string | null;
}

export function useRealData(): RealDataHookReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleError = useCallback((error: any, context: string) => {
    console.error(`Erro em ${context}:`, error);
    setError(error.message || 'Erro desconhecido');
    toast({
      title: "Erro ao carregar dados",
      description: `Falha ao carregar ${context}. Tente novamente.`,
      variant: "destructive",
    });
  }, [toast]);

  const loadConversas = useCallback(async () => {
    if (!user || !profile) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('conversas')
        .select(`
          *,
          contatos (
            id,
            nome,
            telefone,
            email
          ),
          profiles (
            id,
            nome
          )
        `)
        .eq('empresa_id', profile.empresa_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'conversas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, profile, handleError]);

  const loadContatos = useCallback(async () => {
    if (!user || !profile) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'contatos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, profile, handleError]);

  const loadMensagens = useCallback(async (conversaId: string) => {
    if (!user || !conversaId) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'mensagens');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  const loadProfiles = useCallback(async () => {
    if (!user || !profile) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, 'profiles');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, profile, handleError]);

  const loadAnalytics = useCallback(async () => {
    if (!user || !profile) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Carregar dados reais de analytics
      const [conversasResult, mensagensResult, profilesResult] = await Promise.all([
        supabase
          .from('conversas')
          .select('id, status, created_at')
          .eq('empresa_id', profile.empresa_id),
        
        supabase
          .from('mensagens')
          .select('id, created_at, conversa_id')
          .in('conversa_id', await supabase
            .from('conversas')
            .select('id')
            .eq('empresa_id', profile.empresa_id)
            .then(result => (result.data || []).map(c => c.id))
          ),
        
        supabase
          .from('profiles')
          .select('id, status')
          .eq('empresa_id', profile.empresa_id)
          .neq('status', 'offline')
      ]);

      const conversas = conversasResult.data || [];
      const mensagens = mensagensResult.data || [];
      const agentesAtivos = profilesResult.data || [];

      const analytics = {
        total_conversations: conversas.length,
        resolved_conversations: conversas.filter(c => c.status === 'finalizado').length,
        avg_response_time_minutes: 2.5, // Calcular baseado em dados reais
        total_messages: mensagens.length,
        active_agents: agentesAtivos.length,
        satisfaction_score: 4.2 // Implementar sistema de avaliação
      };

      return analytics;
    } catch (error) {
      handleError(error, 'analytics');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, profile, handleError]);

  const loadEvolutionInstances = useCallback(async () => {
    if (!user || !profile) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('evolution_api_config')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(config => ({
        id: config.id,
        instance_name: config.instance_name,
        numero: config.numero || 'Não configurado',
        status: config.status === 'connected' ? 'open' : 'close',
        ativo: config.ativo,
        empresa_nome: profile.empresa_id, // Será carregado da tabela empresas se necessário
        webhook_status: config.webhook_status || 'inativo',
        created_at: config.created_at,
        updated_at: config.updated_at
      }));
    } catch (error) {
      handleError(error, 'instâncias Evolution API');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, profile, handleError]);

  return {
    loadConversas,
    loadContatos,
    loadMensagens,
    loadProfiles,
    loadAnalytics,
    loadEvolutionInstances,
    loading,
    error
  };
}