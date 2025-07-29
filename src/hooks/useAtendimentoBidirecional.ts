import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresenceSystem } from '@/hooks/usePresenceSystem';
import { useConversationRealtime } from '@/hooks/useConversationRealtime';
import { useConnectionNotification } from '@/contexts/ConnectionNotificationContext';

interface BidirectionalConfig {
  empresaId: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  conversaId?: string;
  userId?: string;
}

export function useAtendimentoBidirecional(config: BidirectionalConfig) {
  const { user } = useAuth();
  const { notifyConnectionError, notifyConnectionSuccess, notifyConnectionRestored } = useConnectionNotification();
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const presenceSystem = usePresenceSystem(config.empresaId);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const conversationRealtime = useConversationRealtime(activeConversation || '');

  const maxReconnectAttempts = config.reconnectAttempts || 5;

  const connect = useCallback(async () => {
    if (!user || wsRef.current) return;

    try {
      // Check if the realtime-gateway function exists first
      const wsUrl = `wss://obtpghqvrygzcukdaiej.supabase.co/functions/v1/realtime-gateway`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Authenticate with the gateway
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Only attempt to reconnect for certain close codes and if explicitly enabled
        const shouldReconnect = 
          config.autoConnect !== false && 
          reconnectAttempts < maxReconnectAttempts &&
          (event.code === 1006 || event.code === 1000); // Abnormal closure or normal closure
        
        if (shouldReconnect) {
          const delay = Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000);
          console.log(`Attempting reconnect ${reconnectAttempts + 1}/${maxReconnectAttempts} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.log('WebSocket reconnection disabled or max attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Only show error notification if this is not an initial connection attempt
        if (reconnectAttempts > 0) {
          notifyConnectionError("Falha na comunicação em tempo real. Tentando reconectar...");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      
      // If WebSocket creation fails, don't retry immediately
      if (reconnectAttempts < maxReconnectAttempts && config.autoConnect !== false) {
        const delay = Math.min(5000 * Math.pow(2, reconnectAttempts), 60000);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      }
    }
  }, [user, reconnectAttempts, maxReconnectAttempts, config.autoConnect, notifyConnectionError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);

  const joinConversation = useCallback((conversaId: string) => {
    setActiveConversation(conversaId);
    sendMessage({
      type: 'join_conversation',
      conversaId
    });
  }, [sendMessage]);

  const leaveConversation = useCallback(() => {
    if (activeConversation) {
      sendMessage({
        type: 'leave_conversation',
        conversaId: activeConversation
      });
      setActiveConversation(null);
    }
  }, [sendMessage, activeConversation]);

  const startTyping = useCallback((conversaId: string) => {
    sendMessage({
      type: 'typing_start',
      conversaId
    });
    
    // Also use conversation realtime hook
    conversationRealtime.sendTypingIndicator(true);
  }, [sendMessage, conversationRealtime]);

  const stopTyping = useCallback((conversaId: string) => {
    sendMessage({
      type: 'typing_stop',
      conversaId
    });
    
    // Also use conversation realtime hook
    conversationRealtime.sendTypingIndicator(false);
  }, [sendMessage, conversationRealtime]);

  const updatePresence = useCallback((status: 'online' | 'offline' | 'typing', conversaId?: string) => {
    sendMessage({
      type: 'presence_update',
      data: { status, conversaId }
    });
    
    // Also update through presence system
    presenceSystem.updatePresence(status, conversaId);
  }, [sendMessage, presenceSystem]);

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'auth_success':
        console.log('Authentication successful:', message.data);
        notifyConnectionSuccess("Comunicação em tempo real ativada");
        break;

      case 'auth_error':
        console.error('Authentication failed:', message.data);
        notifyConnectionError("Falha ao autenticar para tempo real");
        break;

      case 'notification':
        // Handle direct notifications to this user
        console.log('Direct notification:', message.data);
        break;

      case 'global_notification':
        // Handle global company notifications
        console.log('Global notification:', message.data);
        break;

      case 'presence_sync':
      case 'presence_join':
      case 'presence_leave':
        // These are handled by the presence system
        break;

      case 'conversation_joined':
        console.log('Joined conversation:', message.data);
        break;

      case 'conversation_left':
        console.log('Left conversation:', message.data);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [notifyConnectionError, notifyConnectionSuccess]);

  // Auto-connect on mount if enabled and user is available
  useEffect(() => {
    if (config.autoConnect !== false && user && config.empresaId) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        connect();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, config.autoConnect, config.empresaId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    reconnectAttempts,
    activeConversation,
    connect,
    disconnect,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    updatePresence,
    presenceSystem,
    conversationRealtime
  };
}