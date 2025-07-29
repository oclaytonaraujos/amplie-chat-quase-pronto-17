/**
 * Hook simplificado para notificações do sistema
 */
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export function useSimpleNotifications() {
  const { toast } = useToast();
  
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: 'Notification' in window
  });

  // Verificar permissão atual
  useEffect(() => {
    if (!state.isSupported) return;

    setState(prev => ({
      ...prev,
      permission: Notification.permission
    }));
  }, [state.isSupported]);

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações",
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
          description: "Você receberá notificações de novos atendimentos",
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
      return false;
    }
  }, [state.isSupported, toast]);

  // Mostrar notificação simples
  const showNotification = useCallback((title: string, body?: string) => {
    if (!state.isSupported || state.permission !== 'granted') {
      // Fallback para toast
      toast({
        title,
        description: body,
        variant: "default"
      });
      return;
    }

    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
      toast({
        title,
        description: body,
        variant: "default"
      });
    }
  }, [state.isSupported, state.permission, toast]);

  return {
    ...state,
    requestPermission,
    showNotification
  };
}