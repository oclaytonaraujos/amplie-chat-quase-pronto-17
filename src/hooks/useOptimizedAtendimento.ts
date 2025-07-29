/**
 * Hook otimizado para atendimento com cache inteligente e tratamento de erros padronizado
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLogger } from '@/utils/structured-logger';
import { withSupabaseRetry, withNetworkRetry } from '@/utils/retry-handler';


interface Conversa {
  id: string;
  contato_id: string;
  agente_id?: string;
  status: string;
  canal: string;
  prioridade: string;
  setor?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  empresa_id: string;
  contatos?: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  };
  profiles?: {
    id: string;
    nome: string;
  };
}

interface Mensagem {
  id: string;
  conversa_id: string;
  remetente_tipo: string;
  remetente_id?: string;
  conteudo: string;
  tipo_mensagem: string;
  metadata?: any;
  lida: boolean;
  created_at: string;
}

export function useOptimizedAtendimento() {
  const { user } = useAuth();
  const { toast } = useToast();
  const logger = useLogger({
    component: 'OptimizedAtendimento',
    userId: user?.id
  });

  const [mensagens, setMensagens] = useState<{ [conversaId: string]: Mensagem[] }>({});
  const [loadingMensagens, setLoadingMensagens] = useState<{ [conversaId: string]: boolean }>({});

  // Cache simples para conversas (implementação básica para Fase 1)
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversasLoading, setConversasLoading] = useState(false);
  const [conversasError, setConversasError] = useState<Error | null>(null);

  const loadConversasData = useCallback(async () => {
    if (!user) throw new Error('Usuário não autenticado');

    logger.info('Carregando conversas');

    // Primeiro, obter a empresa_id do usuário atual
    const { data: currentProfile } = await withSupabaseRetry(
      async () => {
        const result = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user.id)
          .single();
        return result;
      }
    );

    if (!currentProfile?.empresa_id) {
      throw new Error('Usuário não está associado a uma empresa');
    }

    const { data, error } = await withSupabaseRetry(
      async () => {
        const result = await supabase
          .from('conversas')
          .select(`
            *,
            contatos(id, nome, telefone, email),
            profiles(id, nome)
          `)
          .eq('empresa_id', currentProfile.empresa_id)
          .neq('canal', 'chat-interno')
          .order('updated_at', { ascending: false });
        return result;
      }
    );

    if (error) throw error;

    logger.info('Conversas carregadas com sucesso', {
      metadata: { 
        count: data?.length || 0,
        empresaId: currentProfile.empresa_id
      }
    });

    return data || [];
  }, [user, logger]);

  // Carregar conversas com tratamento de erro padronizado
  const loadConversas = useCallback(async () => {
    try {
      setConversasLoading(true);
      setConversasError(null);
      logger.info('Iniciando carregamento de conversas');
      
      const data = await loadConversasData();
      setConversas(data);
      
      logger.info('Conversas carregadas com sucesso');
    } catch (error) {
      const err = error as Error;
      setConversasError(err);
      logger.error('Erro ao carregar conversas', {}, err);
      toast({
        title: "Erro ao carregar conversas",
        description: "Verifique sua conexão e tente novamente",
        variant: "destructive",
      });
    } finally {
      setConversasLoading(false);
    }
  }, [loadConversasData, logger, toast]);

  // Carregar mensagens com retry automático
  const loadMensagens = useCallback(async (conversaId: string) => {
    if (!user) {
      logger.warn('Tentativa de carregar mensagens sem usuário autenticado');
      return;
    }
    
    try {
      setLoadingMensagens(prev => ({ ...prev, [conversaId]: true }));
      
      logger.messageAction('load_messages_start', '', conversaId);

      const { data, error } = await withSupabaseRetry(
        async () => {
          const result = await supabase
            .from('mensagens')
            .select('*')
            .eq('conversa_id', conversaId)
            .order('created_at', { ascending: true });
          return result;
        }
      );

      if (error) throw error;

      setMensagens(prev => ({ ...prev, [conversaId]: data || [] }));
      
      logger.messageAction('load_messages_success', '', conversaId, {
        metadata: { messageCount: data?.length || 0 }
      });

    } catch (error) {
      logger.error('Erro ao carregar mensagens', { conversaId }, error as Error);
      toast({
        title: "Erro ao carregar mensagens",
        description: "Não foi possível carregar as mensagens desta conversa",
        variant: "destructive",
      });
    } finally {
      setLoadingMensagens(prev => ({ ...prev, [conversaId]: false }));
    }
  }, [user, logger, toast]);

  // Enviar mensagem com retry e otimistic update
  const enviarMensagem = useCallback(async (
    conversaId: string, 
    conteudo: string, 
    tipo: string = 'texto'
  ) => {
    if (!user) {
      logger.warn('Tentativa de enviar mensagem sem usuário autenticado');
      return null;
    }
    
    const tempId = `temp_${Date.now()}`;
    const tempMensagem: Mensagem = {
      id: tempId,
      conversa_id: conversaId,
      remetente_tipo: 'agente',
      remetente_id: user.id,
      conteudo,
      tipo_mensagem: tipo,
      lida: false,
      created_at: new Date().toISOString()
    };

    // Optimistic update
    setMensagens(prev => ({
      ...prev,
      [conversaId]: [...(prev[conversaId] || []), tempMensagem]
    }));

    try {
      logger.messageAction('send_message_start', tempId, conversaId, {
        metadata: { tipo, contentLength: conteudo.length }
      });

      const { data, error } = await withNetworkRetry(
        async () => {
          const result = await supabase
            .from('mensagens')
            .insert({
              conversa_id: conversaId,
              remetente_tipo: 'agente',
              remetente_id: user.id,
              conteudo,
              tipo_mensagem: tipo,
              lida: false
            })
            .select()
            .single();
          return result;
        }
      );

      if (error) throw error;

      // Atualizar updated_at da conversa
      await withSupabaseRetry(
        async () => {
          const result = await supabase
            .from('conversas')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversaId);
          return result;
        }
      );

      // Substituir mensagem temporária pela real
      setMensagens(prev => ({
        ...prev,
        [conversaId]: prev[conversaId]?.map(msg => 
          msg.id === tempId ? data : msg
        ) || [data]
      }));

      // Recarregar conversas para atualizar ordem
      loadConversas();

      logger.messageAction('send_message_success', data.id, conversaId);
      return data;

    } catch (error) {
      // Remover mensagem temporária em caso de erro
      setMensagens(prev => ({
        ...prev,
        [conversaId]: prev[conversaId]?.filter(msg => msg.id !== tempId) || []
      }));

      logger.error('Erro ao enviar mensagem', { conversaId }, error as Error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
      return null;
    }
  }, [user, logger, toast, loadConversas]);

  // Atualizar status da conversa com retry
  const atualizarStatusConversa = useCallback(async (
    conversaId: string, 
    novoStatus: string
  ) => {
    if (!user) {
      logger.warn('Tentativa de atualizar status sem usuário autenticado');
      return;
    }
    
    try {
      logger.conversaAction('update_status_start', conversaId, {
        metadata: { newStatus: novoStatus }
      });

      const { error } = await withSupabaseRetry(
        async () => {
          const result = await supabase
            .from('conversas')
            .update({ 
              status: novoStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversaId);
          return result;
        }
      );

      if (error) throw error;

      // Recarregar conversas para refletir mudanças
      loadConversas();

      logger.conversaAction('update_status_success', conversaId, {
        metadata: { newStatus: novoStatus }
      });

      toast({
        title: "Status atualizado",
        description: "Status da conversa foi atualizado com sucesso.",
      });

    } catch (error) {
      logger.error('Erro ao atualizar status', { conversaId }, error as Error);
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [user, logger, toast, loadConversas]);

  // Assumir conversa com retry
  const assumirConversa = useCallback(async (conversaId: string) => {
    if (!user) {
      logger.warn('Tentativa de assumir conversa sem usuário autenticado');
      return;
    }
    
    try {
      logger.conversaAction('assume_conversation_start', conversaId);

      const { error } = await withSupabaseRetry(
        async () => {
          const result = await supabase
            .from('conversas')
            .update({ 
              agente_id: user.id,
              status: 'em-atendimento',
              updated_at: new Date().toISOString()
            })
            .eq('id', conversaId);
          return result;
        }
      );

      if (error) throw error;

      // Recarregar conversas para refletir mudanças
      loadConversas();

      logger.conversaAction('assume_conversation_success', conversaId);

      toast({
        title: "Conversa assumida",
        description: "Você assumiu esta conversa com sucesso.",
      });

    } catch (error) {
      logger.error('Erro ao assumir conversa', { conversaId }, error as Error);
      toast({
        title: "Erro ao assumir conversa",
        description: "Não foi possível assumir a conversa. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [user, logger, toast, loadConversas]);

  // Setup realtime subscriptions com tratamento de erro
  useEffect(() => {
    if (!user) return;

    logger.info('Configurando subscriptions realtime');

    // Subscribe to conversas changes
    const conversasSubscription = supabase
      .channel('conversas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas'
        },
        () => {
          logger.info('Conversa atualizada via realtime, recarregando');
          loadConversas();
        }
      )
      .subscribe();

    // Subscribe to mensagens changes
    const mensagensSubscription = supabase
      .channel('mensagens-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens'
        },
        (payload) => {
          const novaMensagem = payload.new as Mensagem;
          logger.messageAction('realtime_message_received', novaMensagem.id, novaMensagem.conversa_id);
          
          setMensagens(prev => ({
            ...prev,
            [novaMensagem.conversa_id]: [
              ...(prev[novaMensagem.conversa_id] || []),
              novaMensagem
            ]
          }));
        }
      )
      .subscribe();

    return () => {
      logger.info('Removendo subscriptions realtime');
      supabase.removeChannel(conversasSubscription);
      supabase.removeChannel(mensagensSubscription);
    };
  }, [user, logger, loadConversas]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      logger.info('Usuário autenticado, carregando dados iniciais');
      loadConversas();
    }
  }, [user, loadConversas, logger]);

  return {
    conversas,
    conversasLoading,
    conversasError,
    mensagens,
    loadingMensagens,
    loadConversas,
    loadMensagens,
    enviarMensagem,
    atualizarStatusConversa,
    assumirConversa
  };
}