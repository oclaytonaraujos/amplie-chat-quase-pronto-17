import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MessageData {
  id: string;
  conteudo: string;
  conversa_id: string | null;
  created_at: string | null;
  lida: boolean | null;
  metadata: any;
  remetente_id: string | null;
  remetente_nome: string | null;
  remetente_tipo: string;
  tipo_mensagem: string | null;
}

export function useMessageManager() {
  const [messagesCache, setMessagesCache] = useState<Record<string, MessageData[]>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const { toast } = useToast();

  const loadMessages = useCallback(async (conversaId: string, forceRefresh = false) => {
    // Return cached messages if available and not forcing refresh
    if (!forceRefresh && messagesCache[conversaId]) {
      return messagesCache[conversaId];
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(conversaId)) {
      console.log('ID da conversa não é um UUID válido:', conversaId);
      const emptyMessages: MessageData[] = [];
      setMessagesCache(prev => ({ ...prev, [conversaId]: emptyMessages }));
      return emptyMessages;
    }

    setLoadingStates(prev => ({ ...prev, [conversaId]: true }));
    setErrors(prev => ({ ...prev, [conversaId]: null }));

    try {
      console.log('Carregando mensagens para conversa:', conversaId);
      
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      const messages = data || [];
      console.log(`Carregadas ${messages.length} mensagens para conversa ${conversaId}`);

      // Cache the messages
      setMessagesCache(prev => ({ ...prev, [conversaId]: messages }));
      
      return messages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro ao carregar mensagens:', error);
      
      setErrors(prev => ({ ...prev, [conversaId]: errorMessage }));
      
      toast({
        title: "Erro ao carregar mensagens",
        description: errorMessage,
        variant: "destructive",
      });

      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, [conversaId]: false }));
    }
  }, [messagesCache, toast]);

  const addMessage = useCallback((conversaId: string, message: MessageData) => {
    setMessagesCache(prev => ({
      ...prev,
      [conversaId]: [...(prev[conversaId] || []), message]
    }));
  }, []);

  const updateMessage = useCallback((conversaId: string, messageId: string, updates: Partial<MessageData>) => {
    setMessagesCache(prev => ({
      ...prev,
      [conversaId]: (prev[conversaId] || []).map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }));
  }, []);

  const clearCache = useCallback((conversaId?: string) => {
    if (conversaId) {
      setMessagesCache(prev => {
        const { [conversaId]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setMessagesCache({});
    }
  }, []);

  // Setup realtime subscription for message updates
  useEffect(() => {
    const channel = supabase
      .channel('mensagens-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens'
        },
        (payload) => {
          const newMessage = payload.new as MessageData;
          if (newMessage.conversa_id) {
            addMessage(newMessage.conversa_id, newMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens'
        },
        (payload) => {
          const updatedMessage = payload.new as MessageData;
          if (updatedMessage.conversa_id) {
            updateMessage(updatedMessage.conversa_id, updatedMessage.id, updatedMessage);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addMessage, updateMessage]);

  return {
    messagesCache,
    loadingStates,
    errors,
    loadMessages,
    addMessage,
    updateMessage,
    clearCache,
    getMessages: (conversaId: string) => messagesCache[conversaId] || [],
    isLoading: (conversaId: string) => loadingStates[conversaId] || false,
    getError: (conversaId: string) => errors[conversaId] || null
  };
}