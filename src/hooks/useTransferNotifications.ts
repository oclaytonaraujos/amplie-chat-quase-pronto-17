
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface TransferNotification {
  id: string;
  tipo: 'transferencia_enviada' | 'transferencia_recebida';
  deUsuario: string;
  paraUsuario: string;
  cliente: string;
  motivo: string;
  timestamp: Date;
  lida: boolean;
}

interface UseTransferNotificationsReturn {
  notifications: TransferNotification[];
  addTransferNotification: (notification: Omit<TransferNotification, 'id' | 'timestamp' | 'lida'>) => void;
  markAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

export function useTransferNotifications(): UseTransferNotificationsReturn {
  const [notifications, setNotifications] = useState<TransferNotification[]>([]);
  const { toast } = useToast();

  const addTransferNotification = useCallback((
    notification: Omit<TransferNotification, 'id' | 'timestamp' | 'lida'>
  ) => {
    const newNotification: TransferNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      lida: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar toast
    const message = notification.tipo === 'transferencia_enviada'
      ? `Atendimento de ${notification.cliente} transferido para ${notification.paraUsuario}`
      : `Atendimento de ${notification.cliente} recebido de ${notification.deUsuario}`;

    toast({
      title: notification.tipo === 'transferencia_enviada' ? 'Transferência enviada' : 'Transferência recebida',
      description: message,
    });
  }, [toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, lida: true }
          : notification
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.lida).length;

  return {
    notifications,
    addTransferNotification,
    markAsRead,
    clearNotifications,
    unreadCount,
  };
}
