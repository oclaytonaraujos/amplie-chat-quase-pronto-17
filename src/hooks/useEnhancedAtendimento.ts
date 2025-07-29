/**
 * Hook unificado para atendimento com todas as melhorias implementadas
 */
import { useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useIntelligentCache } from './useIntelligentCache';
import { useMessagePagination } from './useMessagePagination';
import { useRealTimeSync } from './useRealTimeSync';
import { usePerformanceMonitor } from './usePerformanceMonitor';
import { useLogger } from '@/utils/structured-logger';
import { withSupabaseRetry, withNetworkRetry } from '@/utils/retry-handler';
import { handleError } from '@/utils/error-handler';
import { optimizeConversaPayload, optimizeMessagePayload } from '@/utils/compression';
import { supabase } from '@/integrations/supabase/client';
import type { Conversa, Mensagem, ConversaFilters } from '@/types/unified-types';

interface UseEnhancedAtendimentoOptions {
  enableRealTime?: boolean;
  enableCache?: boolean;
  enablePerformanceMonitoring?: boolean;
  pageSize?: number;
}

export function useEnhancedAtendimento(options: UseEnhancedAtendimentoOptions = {}) {
  const {
    enableRealTime = true,
    enableCache = true,
    enablePerformanceMonitoring = true,
    pageSize = 20
  } = options;

  const { user } = useAuth();
  // Temporariamente usando dados mockados até ter o profile
  const profile = { empresa_id: 'temp-empresa-id', nome: 'Usuário Teste' };
  const logger = useLogger({
    component: 'EnhancedAtendimento',
    userId: user?.id,
    empresaId: profile?.empresa_id
  });

  const { measureAsync } = usePerformanceMonitor();

  // Cache inteligente para conversas
  const conversasCache = useIntelligentCache<Conversa[]>(
    `conversas_${profile?.empresa_id}`,
    async () => {
      if (!profile?.empresa_id) return [];
      
      const { data, error } = await supabase
        .from('conversas')
        .select(`
          *,
          contato:contatos(nome, telefone, email),
          agente:profiles(nome, avatar_url)
        `)
        .eq('empresa_id', profile.empresa_id)
        .order('updated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      // Mapear dados para o tipo Conversa unificado
      return (data || []).map(item => ({
        ...item,
        status: item.status as Conversa['status'],
        canal: item.canal as Conversa['canal'],
        prioridade: item.prioridade as Conversa['prioridade'],
        contato: item.contato ? {
          ...item.contato,
          id: 'temp-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'ativo' as const,
          empresa_id: profile.empresa_id
        } : undefined
      })) as any;
    },
    { ttl: enableCache ? 2 * 60 * 1000 : 0 } // 2 minutos de cache
  );

  // Sincronização real-time para conversas
  const conversasSync = useRealTimeSync('conversas', profile.empresa_id);

  // Paginação de mensagens
  const messagesPagination = useMessagePagination({ conversaId: 'default' });

  // Carregar conversas com performance monitoring
  const loadConversas = useCallback(async (filters?: ConversaFilters) => {
    if (!enablePerformanceMonitoring) {
      return conversasCache.refetch();
    }

    return measureAsync('load_conversas', async () => {
      logger.info('Carregando conversas', { 
        action: 'load_conversas',
        metadata: { filters }
      });

      const result = await conversasCache.refetch();
      
      logger.info('Conversas carregadas com sucesso', {
        action: 'conversas_loaded',
        metadata: { 
          count: result?.length || 0,
          cached: conversasCache.isStale
        }
      });

      return result;
    });
  }, [conversasCache, measureAsync, logger, enablePerformanceMonitoring]);

  // Carregar mensagens de uma conversa
  const loadMessages = useCallback(async (conversaId: string, page: number = 1) => {
    if (!enablePerformanceMonitoring) {
      return messagesPagination.loadMessages();
    }

    return measureAsync('load_messages', async () => {
      logger.messageAction('load_messages', '', conversaId, {
        metadata: { page, pageSize }
      });

      const result = await messagesPagination.loadMessages();
      
      logger.messageAction('messages_loaded', '', conversaId, {
        metadata: { 
          count: result.data.length,
          hasMore: result.hasMore,
          page
        }
      });

      return result;
    });
  }, [messagesPagination, measureAsync, logger, pageSize, enablePerformanceMonitoring]);

  // Enviar mensagem com otimização
  const sendMessage = useCallback(async (
    conversaId: string,
    conteudo: string,
    tipo: Mensagem['tipo_mensagem'] = 'texto',
    metadata?: any
  ) => {
    if (!user?.id || !profile.empresa_id) {
      throw new Error('Usuário não autenticado');
    }

    const messagePayload = optimizeMessagePayload({
      conversa_id: conversaId,
      conteudo,
      remetente_id: user.id,
      remetente_nome: profile.nome || user?.email || 'Usuário',
      remetente_tipo: 'agente' as const,
      tipo_mensagem: tipo,
      status: 'enviando' as const,
      lida: false,
      metadata
    });

    const operation = enablePerformanceMonitoring
      ? () => measureAsync('send_message', async () => {
          const { data, error } = await supabase
            .from('mensagens')
            .insert(messagePayload as any)
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      : async () => {
          const { data, error } = await supabase
            .from('mensagens')
            .insert(messagePayload as any)
            .select()
            .single();

          if (error) throw error;
          return data;
        };

    try {
      logger.messageAction('send_message_start', '', conversaId, {
        metadata: { tipo, contentLength: conteudo.length }
      });

      const result = await operation();

      // Adicionar operação pendente para sincronização
      if (enableRealTime) {
        conversasSync.addPendingOperation('insert', result);
      }

      logger.messageAction('send_message_success', result.id, conversaId);

      return result;
    } catch (error) {
      logger.error('Erro ao enviar mensagem', {
        conversaId,
        action: 'send_message_error'
      }, error as Error);
      
      throw error;
    }
  }, [user, profile, measureAsync, logger, conversasSync, enablePerformanceMonitoring, enableRealTime]);

  // Atualizar status da conversa
  const updateConversaStatus = useCallback(async (
    conversaId: string,
    status: Conversa['status'],
    additionalData?: Partial<Conversa>
  ) => {
    if (!profile.empresa_id) {
      throw new Error('Empresa não identificada');
    }

    const updatePayload = optimizeConversaPayload({
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    });

    const operation = enablePerformanceMonitoring
      ? () => measureAsync('update_conversa_status', async () => {
          const { data, error } = await supabase
            .from('conversas')
            .update(updatePayload)
            .eq('id', conversaId)
            .eq('empresa_id', profile.empresa_id)
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      : async () => {
          const { data, error } = await supabase
            .from('conversas')
            .update(updatePayload)
            .eq('id', conversaId)
            .eq('empresa_id', profile.empresa_id)
            .select()
            .single();

          if (error) throw error;
          return data;
        };

    try {
      logger.conversaAction('update_status_start', conversaId, {
        metadata: { newStatus: status, previousData: additionalData }
      });

      const result = await operation();

      // Invalidar cache das conversas
      if (enableCache) {
        conversasCache.invalidate();
      }

      // Adicionar operação pendente para sincronização
      if (enableRealTime) {
        conversasSync.addPendingOperation('update', result);
      }

      logger.conversaAction('update_status_success', conversaId, {
        metadata: { newStatus: status }
      });

      return result;
    } catch (error) {
      logger.error('Erro ao atualizar status da conversa', {
        conversaId,
        action: 'update_status_error'
      }, error as Error);
      
      throw error;
    }
  }, [profile, measureAsync, logger, conversasCache, conversasSync, enablePerformanceMonitoring, enableCache, enableRealTime]);

  // Verificar saúde do sistema
  const systemHealth = useMemo(() => {
    return {
      cache: enableCache ? (conversasCache.error ? 'error' : 'optimal') : 'disabled',
      realtime: enableRealTime ? (conversasSync.syncState.isConnected ? 'connected' : 'disconnected') : 'disabled',
      performance: enablePerformanceMonitoring ? 'monitoring' : 'disabled'
    };
  }, [
    enableCache,
    enableRealTime,
    enablePerformanceMonitoring,
    conversasCache.error,
    conversasSync.syncState.isConnected
  ]);

  // Log inicial do sistema
  useEffect(() => {
    if (profile.empresa_id) {
      logger.info('Sistema de atendimento inicializado', {
        action: 'system_initialized',
        metadata: {
          enableRealTime,
          enableCache,
          enablePerformanceMonitoring,
          pageSize,
          systemHealth
        }
      });
    }
  }, [profile.empresa_id, logger, enableRealTime, enableCache, enablePerformanceMonitoring, pageSize, systemHealth]);

  return {
    // Dados
    conversas: conversasCache.data || [],
    conversasLoading: conversasCache.loading,
    conversasError: conversasCache.error,
    
    messages: [], // messagesPagination não tem messages, usar estado separado
    messagesLoading: messagesPagination.loading,
    messagesError: messagesPagination.error,
    hasMoreMessages: messagesPagination.hasMore,
    
    // Ações
    loadConversas,
    loadMessages,
    loadMoreMessages: messagesPagination.loadNextPage,
    sendMessage,
    updateConversaStatus,
    
    // Cache e sincronização
    invalidateCache: conversasCache.invalidate,
    forceSync: conversasSync.forceSync,
    
    // Status do sistema
    systemHealth,
    syncState: conversasSync.syncState,
    cacheStats: conversasCache.cacheStats,
    
    // Utilitários
    isStale: conversasCache.isStale,
    refetch: conversasCache.refetch
  };
}