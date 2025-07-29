import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PresenceData {
  userId: string;
  status: 'online' | 'offline' | 'typing';
  conversaId?: string;
  timestamp: string;
}

interface RealtimeMessage {
  type: 'presence_update' | 'typing_start' | 'typing_stop' | 'message_notification' | 'conversation_update';
  data: any;
  target: 'atendente' | 'conversa' | 'global';
  targetId: string;
}

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | null = null;
  let empresaId: string | null = null;
  let activeChannels: string[] = [];

  socket.onopen = () => {
    console.log('WebSocket connection opened');
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'auth':
          // Autenticar usuário e obter empresa
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, empresa_id, nome')
            .eq('id', message.userId)
            .single();
          
          if (profile) {
            userId = profile.id;
            empresaId = profile.empresa_id;
            
            // Configurar canais de realtime
            await setupRealtimeChannels(supabase, userId, empresaId, socket);
            
            socket.send(JSON.stringify({
              type: 'auth_success',
              user: profile
            }));
          } else {
            socket.send(JSON.stringify({
              type: 'auth_error',
              message: 'Invalid user'
            }));
          }
          break;

        case 'presence_update':
          if (userId && empresaId) {
            await handlePresenceUpdate(supabase, userId, empresaId, message.data, socket);
          }
          break;

        case 'typing_start':
          if (userId && message.conversaId) {
            await broadcastToConversation(supabase, message.conversaId, {
              type: 'typing_start',
              userId,
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'typing_stop':
          if (userId && message.conversaId) {
            await broadcastToConversation(supabase, message.conversaId, {
              type: 'typing_stop',
              userId,
              timestamp: new Date().toISOString()
            });
          }
          break;

        case 'join_conversation':
          if (userId && message.conversaId) {
            // Verificar se o usuário tem acesso à conversa
            const { data: conversa } = await supabase
              .from('conversas')
              .select('empresa_id')
              .eq('id', message.conversaId)
              .eq('empresa_id', empresaId)
              .single();
            
            if (conversa) {
              activeChannels.push(`conversa:${message.conversaId}`);
              socket.send(JSON.stringify({
                type: 'conversation_joined',
                conversaId: message.conversaId
              }));
            }
          }
          break;

        case 'leave_conversation':
          if (message.conversaId) {
            activeChannels = activeChannels.filter(ch => ch !== `conversa:${message.conversaId}`);
            socket.send(JSON.stringify({
              type: 'conversation_left',
              conversaId: message.conversaId
            }));
          }
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  };

  socket.onclose = async () => {
    if (userId && empresaId) {
      // Atualizar presença para offline
      await handlePresenceUpdate(supabase, userId, empresaId, { status: 'offline' }, null);
    }
    console.log('WebSocket connection closed');
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  return response;
});

async function setupRealtimeChannels(supabase: any, userId: string, empresaId: string, socket: WebSocket) {
  // Canal para notificações do atendente
  const atendenteChannel = supabase
    .channel(`atendente:${userId}`)
    .on('broadcast', { event: 'message' }, (payload: any) => {
      socket.send(JSON.stringify({
        type: 'notification',
        data: payload
      }));
    })
    .subscribe();

  // Canal para notificações globais da empresa
  const empresaChannel = supabase
    .channel(`empresa:${empresaId}`)
    .on('broadcast', { event: 'global' }, (payload: any) => {
      socket.send(JSON.stringify({
        type: 'global_notification',
        data: payload
      }));
    })
    .subscribe();

  // Canal para presença da empresa
  const presenceChannel = supabase
    .channel(`presence:${empresaId}`)
    .on('presence', { event: 'sync' }, () => {
      const presenceState = presenceChannel.presenceState();
      socket.send(JSON.stringify({
        type: 'presence_sync',
        data: presenceState
      }));
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
      socket.send(JSON.stringify({
        type: 'presence_join',
        data: { key, newPresences }
      }));
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
      socket.send(JSON.stringify({
        type: 'presence_leave',
        data: { key, leftPresences }
      }));
    })
    .subscribe();

  // Registrar presença do usuário
  await presenceChannel.track({
    userId,
    status: 'online',
    timestamp: new Date().toISOString()
  });
}

async function handlePresenceUpdate(supabase: any, userId: string, empresaId: string, data: any, socket: WebSocket | null) {
  const presenceData: PresenceData = {
    userId,
    status: data.status || 'online',
    conversaId: data.conversaId,
    timestamp: new Date().toISOString()
  };

  // Broadcast para canal de presença da empresa
  const presenceChannel = supabase.channel(`presence:${empresaId}`);
  await presenceChannel.track(presenceData);

  if (socket) {
    socket.send(JSON.stringify({
      type: 'presence_updated',
      data: presenceData
    }));
  }
}

async function broadcastToConversation(supabase: any, conversaId: string, data: any) {
  const conversaChannel = supabase.channel(`conversa:${conversaId}`);
  await conversaChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: data
  });
}