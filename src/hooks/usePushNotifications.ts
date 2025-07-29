/**
 * Hook para gerenciar notificações push
 */
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  subscription: PushSubscription | null;
  isSubscribed: boolean;
}

interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  silent?: boolean;
  requireInteraction?: boolean;
}

export function usePushNotifications() {
  const { toast } = useToast();
  
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    subscription: null,
    isSubscribed: false
  });

  // Verificar permissão e subscription atual
  useEffect(() => {
    if (!state.isSupported) return;

    setState(prev => ({
      ...prev,
      permission: Notification.permission
    }));

    // Verificar subscription existente
    navigator.serviceWorker.ready.then(registration => {
      registration.pushManager.getSubscription().then(subscription => {
        setState(prev => ({
          ...prev,
          subscription,
          isSubscribed: !!subscription
        }));
      });
    });
  }, [state.isSupported]);

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações push",
        variant: "destructive"
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setState(prev => ({ ...prev, permission }));

      if (permission === 'granted') {
        toast({
          title: "Notificações ativadas",
          description: "Você receberá notificações de novas mensagens",
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "Permissão negada",
          description: "Ative as notificações nas configurações do navegador",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast({
        title: "Erro nas notificações",
        description: "Não foi possível ativar as notificações",
        variant: "destructive"
      });
      return false;
    }
  }, [state.isSupported, toast]);

  // Inscrever para push notifications
  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!state.isSupported || state.permission !== 'granted') {
      const hasPermission = await requestPermission();
      if (!hasPermission) return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Chave pública VAPID (deve ser configurada no backend)
      const vapidPublicKey = 'BMGjK_HQzN-7OTl2oQN5WJO-E8Hc_1G9mJEBKE4_QI9zXjzF2mP_8J7L3R5N8K9P';
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      setState(prev => ({
        ...prev,
        subscription,
        isSubscribed: true
      }));

      // Enviar subscription para o backend
      await sendSubscriptionToServer(subscription);

      toast({
        title: "Notificações configuradas",
        description: "Você receberá notificações em tempo real",
        variant: "default"
      });

      return subscription;
    } catch (error) {
      console.error('Erro ao inscrever para push notifications:', error);
      toast({
        title: "Erro na configuração",
        description: "Não foi possível configurar as notificações",
        variant: "destructive"
      });
      return null;
    }
  }, [state.isSupported, state.permission, requestPermission, toast]);

  // Cancelar inscrição
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) return true;

    try {
      await state.subscription.unsubscribe();
      
      setState(prev => ({
        ...prev,
        subscription: null,
        isSubscribed: false
      }));

      toast({
        title: "Notificações desativadas",
        description: "Você não receberá mais notificações push",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      toast({
        title: "Erro ao desativar",
        description: "Não foi possível desativar as notificações",
        variant: "destructive"
      });
      return false;
    }
  }, [state.subscription, toast]);

  // Enviar subscription para o servidor
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      // Aqui você enviaria a subscription para seu backend
      console.log('Subscription a ser enviada:', subscription);
      
      // Exemplo de como enviar para Supabase
      // await supabase
      //   .from('push_subscriptions')
      //   .upsert({
      //     user_id: user.id,
      //     subscription: subscription.toJSON(),
      //     created_at: new Date().toISOString()
      //   });
    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
    }
  };

  // Mostrar notificação local
  const showNotification = useCallback((options: NotificationOptions) => {
    if (!state.isSupported || state.permission !== 'granted') {
      return;
    }

    const {
      title,
      body,
      icon = '/manifest-icon-192.png',
      badge = '/manifest-icon-96.png',
      tag,
      data,
      actions = [],
      silent = false,
      requireInteraction = false,
      image
    } = options;

    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body,
        icon,
        badge,
        tag,
        data,
        silent,
        requireInteraction
      });
    });
  }, [state.isSupported, state.permission]);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification
  };
}