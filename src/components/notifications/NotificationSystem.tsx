/**
 * Sistema completo de notificações push e in-app
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
  metadata?: Record<string, any>;
}
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  requestPermission: () => Promise<boolean>;
  isPermissionGranted: boolean;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}
export function NotificationProvider({
  children,
  maxNotifications = 10
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const {
    toast
  } = useToast();

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setIsPermissionGranted(Notification.permission === 'granted');
    }
  }, []);
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }
    if (Notification.permission === 'granted') {
      setIsPermissionGranted(true);
      return true;
    }
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setIsPermissionGranted(granted);
    return granted;
  }, []);
  const sendBrowserNotification = useCallback((notification: Notification) => {
    if (!isPermissionGranted || !('Notification' in window)) return;
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.persistent,
      silent: false
    });
    browserNotification.onclick = () => {
      window.focus();
      if (notification.action) {
        notification.action.onClick();
      }
      browserNotification.close();
    };

    // Auto close after 5 seconds if not persistent
    if (!notification.persistent) {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }, [isPermissionGranted]);
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>): string => {
    const id = Math.random().toString(36).substring(2, 15);
    const notification: Notification = {
      ...notificationData,
      id,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => {
      const updated = [notification, ...prev];
      // Keep only the most recent notifications
      return updated.slice(0, maxNotifications);
    });

    // Show browser notification
    sendBrowserNotification(notification);

    // Show toast for immediate feedback
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default'
    });
    return id;
  }, [maxNotifications, sendBrowserNotification, toast]);
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? {
      ...notification,
      read: true
    } : notification));
  }, []);
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  }, []);
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  const unreadCount = notifications.filter(n => !n.read).length;
  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPermission,
    isPermissionGranted
  };
  return <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>;
}

// Notification Bell Icon Component
export function NotificationBell({
  className
}: {
  className?: string;
}) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'agora';
  };
  return <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-auto p-1">
                Marcar todas como lidas
              </Button>}
          </div>
        </div>

        {notifications.length === 0 ? <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Nenhuma notificação</p>
          </div> : <>
            <ScrollArea className="h-96">
              <div className="p-2">
                {notifications.map((notification, index) => <div key={notification.id}>
                    <div className={cn("p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group", !notification.read && "bg-accent/50")} onClick={() => !notification.read && markAsRead(notification.id)}>
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={cn("text-sm font-medium truncate", !notification.read && "font-semibold")}>
                              {notification.title}
                            </p>
                            <div className="flex items-center space-x-1 ml-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTime(notification.timestamp)}
                              </span>
                              <Button variant="ghost" size="sm" onClick={e => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }} className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {notification.action && <Button variant="outline" size="sm" onClick={e => {
                      e.stopPropagation();
                      notification.action!.onClick();
                      markAsRead(notification.id);
                    }} className="mt-2 h-7 text-xs">
                              {notification.action.label}
                            </Button>}
                        </div>
                        
                        {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                      </div>
                    </div>
                    {index < notifications.length - 1 && <Separator className="my-1" />}
                  </div>)}
              </div>
            </ScrollArea>
            
            {notifications.length > 0 && <div className="p-3 border-t">
                <Button variant="ghost" size="sm" onClick={clearAll} className="w-full text-xs">
                  Limpar todas
                </Button>
              </div>}
          </>}
      </PopoverContent>
    </Popover>;
}

// Permission Request Component
export function NotificationPermissionRequest() {
  const { requestPermission, isPermissionGranted } = useNotifications();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isPermissionGranted || isDismissed) return null;

  const handleRequest = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);
    if (!granted) {
      setIsDismissed(true);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm bg-card border rounded-lg shadow-lg p-4">
      <h3 className="font-semibold text-sm mb-2">Ativar Notificações</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Receba notificações instantâneas de novas mensagens e atualizações importantes.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleRequest}
          disabled={isRequesting}
          className="flex-1 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isRequesting ? 'Ativando...' : 'Ativar'}
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="px-3 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted"
        >
          Depois
        </button>
      </div>
    </div>
  );
}

// Função auxiliar para converter VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}