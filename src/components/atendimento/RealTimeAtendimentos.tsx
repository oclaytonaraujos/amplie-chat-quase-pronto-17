/**
 * Componente para gerenciar atendimentos em tempo real
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Wifi, WifiOff } from 'lucide-react';

interface RealTimeStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  unreadCount: number;
}

export function RealTimeAtendimentos() {
  const { user } = useAuth();
  const { permission, requestPermission, showNotification } = useSimpleNotifications();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<RealTimeStatus>({
    isConnected: false,
    lastUpdate: null,
    unreadCount: 0
  });

  const [subscription, setSubscription] = useState<any>(null);

  // Conectar ao realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('atendimentos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'atendimentos'
        },
        (payload) => {
          setStatus(prev => ({
            ...prev,
            lastUpdate: new Date()
          }));

          if (payload.eventType === 'INSERT') {
            const novoAtendimento = payload.new as any;
            
            setStatus(prev => ({
              ...prev,
              unreadCount: prev.unreadCount + 1
            }));

            // Mostrar notificação
            showNotification(
              'Novo Atendimento',
              `Atendimento de ${novoAtendimento.cliente_nome || 'Cliente'}`
            );

            toast({
              title: "Novo atendimento",
              description: `Atendimento de ${novoAtendimento.cliente_nome || 'Cliente'}`,
              variant: "default"
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Status da subscription:', status);
        
        setStatus(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED'
        }));

        if (status === 'SUBSCRIBED') {
          toast({
            title: "Conectado",
            description: "Sistema de tempo real ativo",
            variant: "default"
          });
        }
      });

    setSubscription(channel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, showNotification, toast]);

  // Marcar como lido
  const markAllAsRead = () => {
    setStatus(prev => ({
      ...prev,
      unreadCount: 0
    }));
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center gap-2">
        {status.isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm font-medium">
          {status.isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      {status.unreadCount > 0 && (
        <Badge variant="destructive" onClick={markAllAsRead} className="cursor-pointer">
          {status.unreadCount} novos
        </Badge>
      )}

      <div className="flex items-center gap-2">
        {permission === 'granted' ? (
          <Bell className="h-4 w-4 text-green-500" />
        ) : (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={requestPermission}
            className="flex items-center gap-2"
          >
            <BellOff className="h-4 w-4" />
            Ativar Notificações
          </Button>
        )}
      </div>

      {status.lastUpdate && (
        <span className="text-xs text-muted-foreground">
          Última atualização: {status.lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}