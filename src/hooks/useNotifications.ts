import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CreateNotificationProps {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  data?: any;
  userId?: string;
  empresaId?: string;
}

export function useNotifications() {
  const { user } = useAuth();
  
  // Simular profile para funcionar com o sistema atual
  const profile = { empresa_id: 'empresa-1' };

  const createNotification = useCallback(async ({
    title,
    message,
    type = 'info',
    data = {},
    userId,
    empresaId
  }: CreateNotificationProps) => {
    if (!user || !profile) return;

    try {
      const targetUserId = userId || user.id;
      const targetEmpresaId = empresaId || profile.empresa_id;

      const { data: result, error } = await supabase.rpc('create_notification', {
        p_user_id: targetUserId,
        p_empresa_id: targetEmpresaId,
        p_title: title,
        p_message: message,
        p_type: type,
        p_data: data
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }, [user, profile]);

  const notifyNewMessage = useCallback(async (
    conversaId: string,
    senderName: string,
    targetUserId: string
  ) => {
    return createNotification({
      title: 'Nova mensagem',
      message: `${senderName} enviou uma nova mensagem`,
      type: 'info',
      data: { conversaId, type: 'new_message' },
      userId: targetUserId
    });
  }, [createNotification]);

  const notifyConversationTransfer = useCallback(async (
    conversaId: string,
    fromAgent: string,
    toAgentId: string,
    clientName: string
  ) => {
    return createNotification({
      title: 'Conversa transferida',
      message: `${fromAgent} transferiu a conversa com ${clientName} para você`,
      type: 'info',
      data: { conversaId, type: 'transfer' },
      userId: toAgentId
    });
  }, [createNotification]);

  const notifyConversationAssigned = useCallback(async (
    conversaId: string,
    clientName: string,
    agentId: string
  ) => {
    return createNotification({
      title: 'Nova conversa atribuída',
      message: `Você foi atribuído à conversa com ${clientName}`,
      type: 'info',
      data: { conversaId, type: 'assignment' },
      userId: agentId
    });
  }, [createNotification]);

  const notifySystemAlert = useCallback(async (
    title: string,
    message: string,
    userIds: string[]
  ) => {
    const promises = userIds.map(userId => 
      createNotification({
        title,
        message,
        type: 'warning',
        data: { type: 'system_alert' },
        userId
      })
    );

    return Promise.all(promises);
  }, [createNotification]);

  return {
    createNotification,
    notifyNewMessage,
    notifyConversationTransfer,
    notifyConversationAssigned,
    notifySystemAlert
  };
}