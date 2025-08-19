/**
 * Hook para gerenciar integração N8N
 * Intercepta mensagens e eventos do sistema para enviar para N8N
 */
import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { n8nWebhookService } from '@/services/n8nWebhookService';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';

export function useN8nIntegration() {
  const { user } = useAuth();

  // Função para interceptar mensagens enviadas
  const interceptOutgoingMessage = useCallback(async (messageData: any) => {
    try {
      // Buscar empresa_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (profile?.empresa_id) {
        await n8nWebhookService.processOutgoingMessage(profile.empresa_id, messageData);
      }
    } catch (error) {
      logger.error('Erro ao interceptar mensagem enviada para N8N', { component: 'useN8nIntegration' }, error as Error);
    }
  }, [user?.id]);

  // Função para interceptar mensagens recebidas
  const interceptIncomingMessage = useCallback(async (messageData: any) => {
    try {
      // Buscar empresa_id através da conversa
      if (messageData.conversa_id) {
        const { data: conversa } = await supabase
          .from('conversas')
          .select('empresa_id')
          .eq('id', messageData.conversa_id)
          .maybeSingle();

        if (conversa?.empresa_id) {
          await n8nWebhookService.processIncomingMessage(conversa.empresa_id, messageData);
        }
      }
    } catch (error) {
      logger.error('Erro ao interceptar mensagem recebida para N8N', { component: 'useN8nIntegration' }, error as Error);
    }
  }, []);

  // Função para interceptar mudanças de status de instância
  const interceptInstanceStatusChange = useCallback(async (instanceData: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user?.id)
        .maybeSingle();

      if (profile?.empresa_id) {
        await n8nWebhookService.processInstanceStatusChange(profile.empresa_id, instanceData);
      }
    } catch (error) {
      logger.error('Erro ao interceptar mudança de status para N8N', { component: 'useN8nIntegration' }, error as Error);
    }
  }, [user?.id]);

  // Configurar listeners para tempo real (Realtime)
  useEffect(() => {
    if (!user?.id) return;

    let messageChannel: any;
    let conversaChannel: any;

    const setupRealtimeListeners = async () => {
      try {
        // Buscar empresa_id do usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile?.empresa_id) return;

        // Listener para novas mensagens
        messageChannel = supabase
          .channel('n8n-messages')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'mensagens',
              filter: `conversa_id=in.(select id from conversas where empresa_id=eq.${profile.empresa_id})`
            },
            (payload) => {
              logger.info('Nova mensagem detectada para N8N', { component: 'useN8nIntegration' });
              interceptIncomingMessage(payload.new);
            }
          )
          .subscribe();

        // Listener para mudanças em conversas (status, agente, etc.)
        conversaChannel = supabase
          .channel('n8n-conversas')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'conversas',
              filter: `empresa_id=eq.${profile.empresa_id}`
            },
            (payload) => {
              logger.info('Conversa atualizada - enviando para N8N', { component: 'useN8nIntegration' });
              // Enviar atualização de conversa como evento de instância
              interceptInstanceStatusChange({
                instance_name: 'conversation_update',
                status: payload.new.status,
                conversa_data: payload.new
              });
            }
          )
          .subscribe();

        logger.info('Listeners N8N configurados com sucesso', { component: 'useN8nIntegration' });
      } catch (error) {
        logger.error('Erro ao configurar listeners N8N', {}, error as Error);
      }
    };

    setupRealtimeListeners();

    // Cleanup
    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
      if (conversaChannel) {
        supabase.removeChannel(conversaChannel);
      }
    };
  }, [user?.id, interceptIncomingMessage, interceptInstanceStatusChange]);

  return {
    interceptOutgoingMessage,
    interceptIncomingMessage,
    interceptInstanceStatusChange,
  };
}