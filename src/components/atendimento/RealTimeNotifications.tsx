import React, { useEffect, useState } from 'react';
import { Bell, MessageCircle, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'new_message' | 'user_joined' | 'user_left' | 'system_alert' | 'transfer_request';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  conversaId?: string;
  userId?: string;
}

interface RealTimeNotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  maxVisible?: number;
  className?: string;
}

export function RealTimeNotifications({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick,
  maxVisible = 5,
  className
}: RealTimeNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Filtrar notificações não lidas
  const unreadNotifications = notifications.filter(n => !n.read);
  const visibleNotifications = notifications.slice(0, maxVisible);

  // Som de notificação para notificações de alta prioridade
  useEffect(() => {
    const latestNotification = notifications[0];
    if (latestNotification && !latestNotification.read && latestNotification.priority === 'high') {
      // Reproduzir som de notificação (se permitido pelo navegador)
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Falha silenciosa se não conseguir reproduzir
        });
      } catch (error) {
        // Ignore audio errors
      }

      // Mostrar toast para notificações urgentes
      toast({
        title: latestNotification.title,
        description: latestNotification.message,
        variant: latestNotification.priority === 'high' ? 'destructive' : 'default',
      });
    }
  }, [notifications, toast]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new_message':
        return <MessageCircle className="w-4 h-4" />;
      case 'user_joined':
        return <UserPlus className="w-4 h-4" />;
      case 'user_left':
        return <UserMinus className="w-4 h-4" />;
      case 'system_alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'transfer_request':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes === 0) return 'Agora';
    if (diffInMinutes === 1) return '1 min atrás';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hora atrás';
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 dia atrás';
    return `${diffInDays} dias atrás`;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Botão de notificações */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadNotifications.length > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center text-xs p-0"
          >
            {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
          </Badge>
        )}
      </Button>

      {/* Painel de notificações */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden shadow-lg z-50 border">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notificações</h3>
              {unreadNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs h-auto p-1"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            {unreadNotifications.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {unreadNotifications.length} não {unreadNotifications.length === 1 ? 'lida' : 'lidas'}
              </p>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y">
                {visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50 dark:bg-blue-950/20"
                    )}
                    onClick={() => {
                      onNotificationClick(notification);
                      if (!notification.read) {
                        onMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 p-1 rounded-full",
                        getPriorityColor(notification.priority)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > maxVisible && (
            <div className="p-3 border-t text-center">
              <Button variant="ghost" size="sm" className="text-xs">
                Ver todas as notificações
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Overlay para fechar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Hook para gerenciar notificações em tempo real
export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Manter apenas as 50 mais recentes
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
}