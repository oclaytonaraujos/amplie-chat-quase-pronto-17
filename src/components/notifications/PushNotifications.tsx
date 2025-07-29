/**
 * Sistema de Notificações Push em tempo real
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Bell, X, Check, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface PushNotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isSupported: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const PushNotificationContext = createContext<PushNotificationContextType | undefined>(undefined);

export function usePushNotifications() {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotifications must be used within PushNotificationProvider');
  }
  return context;
}

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSupported] = useState('Notification' in window);
  const [hasPermission, setHasPermission] = useState(
    isSupported ? Notification.permission === 'granted' : false
  );

  // Solicitar permissão para notificações
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setHasPermission(granted);
    
    if (granted) {
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações push",
      });
    }
    
    return granted;
  };

  // Adicionar nova notificação
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Mostrar notificação nativa se permitido
    if (hasPermission && document.hidden) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });
    }

    // Mostrar toast para feedback imediato
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default'
    });
  };

  // Marcar como lida
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Remover notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Limpar todas
  const clearAll = () => {
    setNotifications([]);
  };

  // Salvar notificações no localStorage
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);

  // Carregar notificações do localStorage
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`notifications-${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          })));
        } catch (error) {
          console.error('Erro ao carregar notificações:', error);
        }
      }
    }
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    isSupported,
    hasPermission,
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
}

// Componente de display das notificações
interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead, onRemove }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <Check className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <X className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className={cn(
      'p-4 border rounded-lg transition-colors',
      notification.read ? 'bg-muted/50' : 'bg-card border-primary/20'
    )}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <time className="text-xs text-muted-foreground mt-2 block">
            {notification.timestamp.toLocaleString()}
          </time>
          
          {notification.actions && (
            <div className="flex gap-2 mt-3">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={cn(
                    'px-3 py-1 text-xs rounded transition-colors',
                    action.variant === 'primary' 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-1">
          {!notification.read && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="p-1 hover:bg-muted rounded"
              title="Marcar como lida"
            >
              <Check className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onRemove(notification.id)}
            className="p-1 hover:bg-muted rounded text-muted-foreground"
            title="Remover"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Indicador de notificações para o header
export function NotificationBadge() {
  const { unreadCount } = usePushNotifications();

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}