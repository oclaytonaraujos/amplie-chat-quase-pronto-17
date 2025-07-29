import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/structured-logger';

interface NotificationPayload {
  type: 'system_alert' | 'user_message' | 'transfer_request' | 'performance_warning';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  metadata?: any;
}

export function useRealTimeNotifications() {
  const { user } = useAuth();

  const handleNotification = useCallback((payload: NotificationPayload) => {
    // Log da notificação
    logger.info(`Real-time notification received: ${payload.type}`, {
      component: 'RealTimeNotifications',
      userId: user?.id,
      metadata: payload
    });

    // Configurar toast baseado na severidade
    const toastConfig = {
      title: payload.title,
      description: payload.message,
      duration: payload.severity === 'critical' ? 0 : 5000,
      variant: (payload.severity === 'critical' || payload.severity === 'high') ? 'destructive' as const : 'default' as const
    };

    toast(toastConfig);

    // Para alertas críticos, considerar notificação do browser
    if (payload.severity === 'critical' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.message,
        icon: '/favicon.ico',
        tag: payload.type
      });
    }
  }, [user]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      logger.info(`Notification permission: ${permission}`, {
        component: 'RealTimeNotifications',
        userId: user?.id
      });
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Solicitar permissão para notificações
    requestNotificationPermission();

    // Configurar canal de notificações em tempo real
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        handleNotification(payload.payload as NotificationPayload);
      })
      .subscribe((status) => {
        logger.info(`Notifications channel status: ${status}`, {
          component: 'RealTimeNotifications',
          userId: user.id
        });
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, handleNotification, requestNotificationPermission]);

  const sendNotification = useCallback(async (
    targetUserId: string,
    notification: Omit<NotificationPayload, 'userId'>
  ) => {
    if (!user) return;

    try {
      const channel = supabase.channel(`notifications:${targetUserId}`);
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: { ...notification, userId: targetUserId }
      });

      logger.info(`Notification sent to user ${targetUserId}`, {
        component: 'RealTimeNotifications',
        userId: user.id,
        metadata: notification
      });
    } catch (error) {
      logger.error('Failed to send notification', {
        component: 'RealTimeNotifications',
        userId: user.id,
        metadata: { targetUserId, notification }
      }, error as Error);
    }
  }, [user]);

  const broadcastSystemNotification = useCallback(async (
    notification: Omit<NotificationPayload, 'userId'>
  ) => {
    if (!user) return;

    try {
      // Broadcast para todos os usuários conectados
      const channel = supabase.channel('system_notifications');
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      });

      logger.info('System notification broadcasted', {
        component: 'RealTimeNotifications',
        userId: user.id,
        metadata: notification
      });
    } catch (error) {
      logger.error('Failed to broadcast system notification', {
        component: 'RealTimeNotifications',
        userId: user.id,
        metadata: notification
      }, error as Error);
    }
  }, [user]);

  return {
    sendNotification,
    broadcastSystemNotification,
    requestNotificationPermission
  };
}