import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useChatInternoNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unreadCounts, setUnreadCounts] = useState<{ [conversaId: string]: number }>({});

  // Marcar mensagem como lida
  const marcarMensagemComoLida = async (mensagemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('mensagens_internas')
        .update({ lida: true })
        .eq('id', mensagemId)
        .neq('remetente_id', user.id); // Não é o remetente

      if (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
      }
    } catch (error) {
      console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  // Marcar todas as mensagens de uma conversa como lidas
  const marcarConversaComoLida = async (conversaId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('mensagens_internas')
        .update({ lida: true })
        .eq('conversa_interna_id', conversaId)
        .neq('remetente_id', user.id);

      if (error) {
        console.error('Erro ao marcar conversa como lida:', error);
      } else {
        // Atualizar contador local
        setUnreadCounts(prev => ({ ...prev, [conversaId]: 0 }));
      }
    } catch (error) {
      console.error('Erro ao marcar conversa como lida:', error);
    }
  };

  // Carregar contadores de mensagens não lidas
  const loadUnreadCounts = async () => {
    if (!user) return;

    try {
      const { data: conversas } = await supabase
        .from('conversas_internas')
        .select('id')
        .or(`participante_1_id.eq.${user.id},participante_2_id.eq.${user.id}`);

      if (!conversas) return;

      const counts: { [conversaId: string]: number } = {};

      for (const conversa of conversas) {
        const { count } = await supabase
          .from('mensagens_internas')
          .select('id', { count: 'exact' })
          .eq('conversa_interna_id', conversa.id)
          .eq('lida', false)
          .neq('remetente_id', user.id);

        counts[conversa.id] = count || 0;
      }

      setUnreadCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar contadores:', error);
    }
  };

  // Setup realtime para notificações
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('chat-interno-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_internas'
        },
        (payload) => {
          const novaMensagem = payload.new as any;
          
          // Se a mensagem não é do usuário atual, mostrar notificação
          if (novaMensagem.remetente_id !== user.id) {
            toast({
              title: "Nova mensagem",
              description: "Você recebeu uma nova mensagem no chat interno.",
            });

            // Atualizar contador
            setUnreadCounts(prev => ({
              ...prev,
              [novaMensagem.conversa_interna_id]: (prev[novaMensagem.conversa_interna_id] || 0) + 1
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens_internas'
        },
        (payload) => {
          const mensagemAtualizada = payload.new as any;
          
          // Se foi marcada como lida, atualizar contador
          if (mensagemAtualizada.lida && mensagemAtualizada.remetente_id === user.id) {
            loadUnreadCounts(); // Recarregar contadores
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, toast]);

  // Carregar contadores iniciais
  useEffect(() => {
    if (user) {
      loadUnreadCounts();
    }
  }, [user]);

  return {
    unreadCounts,
    marcarMensagemComoLida,
    marcarConversaComoLida,
    loadUnreadCounts
  };
}