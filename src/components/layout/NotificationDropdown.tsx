
import { Bell, ArrowRightLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useTransferNotifications } from '@/hooks/useTransferNotifications';

export function NotificationDropdown() {
  const { notifications: transferNotifications, markAsRead, unreadCount: transferUnreadCount } = useTransferNotifications();

  // Usar apenas notificações de transferência reais (limitado a 5)
  const allNotifications = transferNotifications.slice(0, 5).map(transfer => ({
    id: transfer.id,
    title: transfer.tipo === 'transferencia_enviada' ? 'Transferência enviada' : 'Transferência recebida',
    message: transfer.tipo === 'transferencia_enviada' 
      ? `Atendimento de ${transfer.cliente} transferido para ${transfer.paraUsuario}`
      : `Atendimento de ${transfer.cliente} recebido de ${transfer.deUsuario}`,
    type: 'transfer' as const,
    time: getTimeAgo(transfer.timestamp),
    read: transfer.lida
  }));

  const totalUnreadCount = allNotifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    return <ArrowRightLeft className="w-4 h-4 text-purple-500" />;
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.type === 'transfer' && !notification.read) {
      markAsRead(notification.id);
    }
  };

  function getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-gray-600" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          {totalUnreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-6">
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-96 overflow-y-auto">
          {allNotifications.length > 0 ? (
            allNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-0">
                <div 
                  className={`w-full p-3 border-l-2 ${
                    notification.read ? 'border-l-transparent' : 'border-l-blue-500'
                  } hover:bg-gray-50 cursor-pointer`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          notification.read ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-gray-400 mt-1">
                          {notification.time} atrás
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          )}
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center text-blue-600 hover:text-blue-700">
          Ver todas as notificações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
