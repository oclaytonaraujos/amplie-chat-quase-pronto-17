/**
 * Hook para comunicação bidirecional em tempo real
 * Gerencia conexão WebSocket e presença de usuários
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useConnectionNotification } from '@/contexts/ConnectionNotificationContext';
import { logger } from '@/utils/logger';

interface BidirectionalConfig {
  empresaId: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface PresenceUser {
  userId: string;
  nome: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

interface UseAtendimentoBidirecionalReturn {
  isConnected: boolean;
  presenceUsers: PresenceUser[];
  sendMessage: (message: any) => void;
  updatePresence: (status: 'online' | 'offline' | 'away') => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useAtendimentoBidirecional(
  config: BidirectionalConfig
): UseAtendimentoBidirecionalReturn {
  const { user } = useAuth();
  const { notifyConnectionError, notifyConnectionRestored } = useConnectionNotification();
  
  const [isConnected, setIsConnected] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const maxReconnectAttempts = config.reconnectAttempts || 5;
  const heartbeatInterval = config.heartbeatInterval || 30000;

  // Conectar ao canal de presença
  const connect = useCallback(async () => {
    if (!config.empresaId || !user) return;

    try {
      logger.info('Iniciando conexão bidirecional', {
        component: 'AtendimentoBidirecional',
        metadata: { empresaId: config.empresaId, userId: user.id }
      });

      // Desconectar canal anterior se existir
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
      }

      // Criar novo canal de presença
      const channel = supabase.channel(`empresa-${config.empresaId}`, {
        config: {
          presence: {
            key: user.id
          }
        }
      });

      // Configurar eventos de presença
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const users: PresenceUser[] = [];
          
          Object.entries(state).forEach(([userId, presences]: [string, any]) => {
            const presence = presences[0];
            if (presence) {
              users.push({
                userId,
                nome: presence.nome,
                status: presence.status,
                lastSeen: new Date(presence.lastSeen)
              });
            }
          });
          
          setPresenceUsers(users);
          logger.debug('Presença sincronizada', {
            component: 'AtendimentoBidirecional',
            metadata: { usersOnline: users.length }
          });
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          logger.info('Usuário entrou na presença', {
            component: 'AtendimentoBidirecional',
            metadata: { userId: key, presences: newPresences }
          });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          logger.info('Usuário saiu da presença', {
            component: 'AtendimentoBidirecional',
            metadata: { userId: key, presences: leftPresences }
          });
        });

      // Configurar eventos de mensagens
      channel.on('broadcast', { event: 'message' }, (payload) => {
        logger.debug('Mensagem recebida via broadcast', {
          component: 'AtendimentoBidirecional',
          metadata: { payload }
        });
      });

      // Configurar callback de sucesso
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          
          // Atualizar presença inicial
          await channel.track({
            nome: user.email || 'Usuário',
            status: 'online',
            lastSeen: new Date().toISOString()
          });

          // Iniciar heartbeat
          startHeartbeat(channel);
          
          notifyConnectionRestored();
          logger.info('Conexão bidirecional estabelecida', {
            component: 'AtendimentoBidirecional'
          });
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          stopHeartbeat();
          logger.warn('Conexão bidirecional fechada', {
            component: 'AtendimentoBidirecional'
          });
          
          // Tentar reconectar
          handleReconnect();
        }
      });

      channelRef.current = channel;
      
    } catch (error) {
      logger.error('Erro ao conectar canal bidirecional', {
        component: 'AtendimentoBidirecional'
      }, error as Error);
      
      setIsConnected(false);
      notifyConnectionError('Erro na comunicação em tempo real');
      
      // Tentar reconectar em caso de erro
      handleReconnect();
    }
  }, [config.empresaId, user, notifyConnectionError, notifyConnectionRestored]);

  // Iniciar heartbeat para manter conexão viva
  const startHeartbeat = (channel: any) => {
    stopHeartbeat(); // Limpar intervalo anterior
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (channel && isConnected) {
        channel.track({
          nome: user?.email || 'Usuário',
          status: 'online',
          lastSeen: new Date().toISOString()
        });
      }
    }, heartbeatInterval);
  };

  // Parar heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  };

  // Gerenciar reconexão automática
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      logger.error('Máximo de tentativas de reconexão atingido', {
        component: 'AtendimentoBidirecional',
        metadata: { attempts: reconnectAttemptsRef.current }
      });
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    reconnectAttemptsRef.current++;

    logger.info(`Tentativa de reconexão ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`, {
      component: 'AtendimentoBidirecional',
      metadata: { delay }
    });

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, maxReconnectAttempts]);

  // Enviar mensagem via broadcast
  const sendMessage = useCallback((message: any) => {
    if (!channelRef.current || !isConnected) {
      logger.warn('Tentativa de enviar mensagem sem conexão ativa', {
        component: 'AtendimentoBidirecional'
      });
      return;
    }

    channelRef.current.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });

    logger.debug('Mensagem enviada via broadcast', {
      component: 'AtendimentoBidirecional',
      metadata: { message }
    });
  }, [isConnected]);

  // Atualizar status de presença
  const updatePresence = useCallback(async (status: 'online' | 'offline' | 'away') => {
    if (!channelRef.current || !user) return;

    try {
      await channelRef.current.track({
        nome: user.email || 'Usuário',
        status,
        lastSeen: new Date().toISOString()
      });

      logger.debug('Presença atualizada', {
        component: 'AtendimentoBidirecional',
        metadata: { status }
      });
    } catch (error) {
      logger.error('Erro ao atualizar presença', {
        component: 'AtendimentoBidirecional'
      }, error as Error);
    }
  }, [user]);

  // Reconectar manualmente
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Desconectar
  const disconnect = useCallback(async () => {
    stopHeartbeat();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsConnected(false);
    setPresenceUsers([]);
    
    logger.info('Conexão bidirecional desconectada', {
      component: 'AtendimentoBidirecional'
    });
  }, []);

  // Conectar automaticamente se configurado
  useEffect(() => {
    if (config.autoConnect && config.empresaId && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [config.autoConnect, config.empresaId, user, connect, disconnect]);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    presenceUsers,
    sendMessage,
    updatePresence,
    reconnect,
    disconnect
  };
}