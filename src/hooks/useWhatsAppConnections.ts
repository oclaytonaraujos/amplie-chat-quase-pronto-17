
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WhatsAppConnection {
  id: string;
  nome: string;
  numero: string;
  status: string;
  qr_code?: string | null;
  ultimo_ping?: string | null;
  ativo: boolean;
  empresa_id: string;
  send_webhook_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useWhatsAppConnections() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar conexões WhatsApp:', error);
        return;
      }

      setConnections(data || []);
    } catch (error) {
      console.error('Erro ao buscar conexões WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConnection = async (id: string, updates: Partial<WhatsAppConnection>) => {
    try {
      const { error } = await supabase
        .from('whatsapp_connections')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar conexão WhatsApp:', error);
        return false;
      }

      // Atualizar estado local
      setConnections(prev => prev.map(conn => 
        conn.id === id ? { ...conn, ...updates } : conn
      ));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar conexão WhatsApp:', error);
      return false;
    }
  };

  const createConnection = async (connectionData: Omit<WhatsAppConnection, 'id' | 'empresa_id'>) => {
    if (!user) return null;

    try {
      // Buscar empresa do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) return null;

      const { data, error } = await supabase
        .from('whatsapp_connections')
        .insert({
          ...connectionData,
          empresa_id: profile.empresa_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar conexão WhatsApp:', error);
        return null;
      }

      setConnections(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar conexão WhatsApp:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchConnections();

    // Configurar subscription para mudanças em tempo real
    const channel = supabase
      .channel('whatsapp_connections_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_connections'
        },
        (payload) => {
          console.log('WhatsApp connections change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setConnections(prev => [payload.new as WhatsAppConnection, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setConnections(prev => prev.map(conn => 
              conn.id === payload.new.id ? payload.new as WhatsAppConnection : conn
            ));
          } else if (payload.eventType === 'DELETE') {
            setConnections(prev => prev.filter(conn => conn.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    connections,
    loading,
    connectedConnections: connections.filter(conn => conn.status === 'conectado'),
    hasConnectedWhatsApp: connections.some(conn => conn.status === 'conectado'),
    updateConnection,
    createConnection,
    refreshConnections: fetchConnections,
  };
}
