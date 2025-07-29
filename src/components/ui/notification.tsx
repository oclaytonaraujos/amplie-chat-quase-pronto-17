/**
 * Sistema de notificações avançado com diferentes tipos e animações
 */
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationVariants = cva(
  "group relative flex w-full max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 animate-slide-in-right",
  {
    variants: {
      variant: {
        default: "bg-background border-border text-foreground",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/10 dark:border-green-800 dark:text-green-400",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-400",
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-400",
      },
      size: {
        default: "p-4",
        sm: "p-3 text-sm",
        lg: "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
};

interface NotificationProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof notificationVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function Notification({
  className,
  variant = "default",
  size = "default",
  title,
  description,
  onClose,
  autoClose = true,
  duration = 5000,
  ...props
}: NotificationProps) {
  const [visible, setVisible] = React.useState(true);
  const Icon = icons[variant || 'default'];

  React.useEffect(() => {
    if (autoClose && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, visible, onClose]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        notificationVariants({ variant, size }),
        !visible && "animate-slide-out-right",
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold leading-none tracking-tight mb-1">
            {title}
          </p>
        )}
        {description && (
          <p className="text-sm opacity-90 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {onClose && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Provider para gerenciar notificações globalmente
interface NotificationContextType {
  notify: (notification: Omit<NotificationProps, 'onClose'>) => void;
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Array<NotificationProps & { id: string }>>([]);

  const notify = React.useCallback((notification: Omit<NotificationProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { ...notification, id }]);
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* Container das notificações */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map(({ id, ...notification }) => (
          <Notification
            key={id}
            {...notification}
            onClose={() => removeNotification(id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}