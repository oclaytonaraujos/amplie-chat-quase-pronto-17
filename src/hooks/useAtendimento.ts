
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Conversa {
  id: string;
  contato_id: string;
  agente_id?: string;
  status: string;
  canal: string;
  prioridade: string;
  setor?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  empresa_id: string;
  contatos?: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  };
  profiles?: {
    id: string;
    nome: string;
  };
}

interface Mensagem {
  id: string;
  conversa_id: string;
  remetente_tipo: string;
  remetente_id?: string;
  conteudo: string;
  tipo_mensagem: string;
  metadata?: any;
  lida: boolean;
  created_at: string;
}

export function useAtendimento() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [mensagens, setMensagens] = useState<{ [conversaId: string]: Mensagem[] }>({});
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState<{ [conversaId: string]: boolean }>({});

  // Carregar conversas
  const loadConversas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Primeiro, obter a empresa_id do usuário atual
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!currentProfile?.empresa_id) {
        console.error('Usuário não está associado a uma empresa');
        return;
      }

      const { data, error } = await supabase
        .from('conversas')
        .select(`
          *,
          contatos(id, nome, telefone, email),
          profiles(id, nome)
        `)
        .eq('empresa_id', currentProfile.empresa_id)
        .neq('canal', 'chat-interno') // Excluir conversas de chat interno
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        toast({
          title: "Erro ao carregar conversas",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setConversas(data || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao carregar conversas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMensagens = async (conversaId: string) => {
    if (!user) return;
    
    try {
      setLoadingMensagens(prev => ({ ...prev, [conversaId]: true }));
      
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens:', error);
        toast({
          title: "Erro ao carregar mensagens",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setMensagens(prev => ({ ...prev, [conversaId]: data || [] }));
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoadingMensagens(prev => ({ ...prev, [conversaId]: false }));
    }
  };

  // Enviar mensagem
  const enviarMensagem = async (conversaId: string, conteudo: string, tipo: string = 'texto') => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversaId,
          remetente_tipo: 'agente',
          remetente_id: user.id,
          conteudo,
          tipo_mensagem: tipo,
          lida: false
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast({
          title: "Erro ao enviar mensagem",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Atualizar updated_at da conversa
      await supabase
        .from('conversas')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversaId);

      // Atualizar mensagens localmente
      setMensagens(prev => ({
        ...prev,
        [conversaId]: [...(prev[conversaId] || []), data]
      }));

      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return null;
    }
  };

  // Atualizar status da conversa
  const atualizarStatusConversa = async (conversaId: string, novoStatus: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('conversas')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversaId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast({
          title: "Erro ao atualizar status",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Atualizar conversa localmente
      setConversas(prev => 
        prev.map(conv => 
          conv.id === conversaId 
            ? { ...conv, status: novoStatus, updated_at: new Date().toISOString() }
            : conv
        )
      );

      toast({
        title: "Status atualizado",
        description: "Status da conversa foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Assumir conversa
  const assumirConversa = async (conversaId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('conversas')
        .update({ 
          agente_id: user.id,
          status: 'em-atendimento',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversaId);

      if (error) {
        console.error('Erro ao assumir conversa:', error);
        toast({
          title: "Erro ao assumir conversa",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Recarregar conversas para refletir a mudança
      await loadConversas();

      toast({
        title: "Conversa assumida",
        description: "Você assumiu esta conversa com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao assumir conversa:', error);
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to conversas changes
    const conversasSubscription = supabase
      .channel('conversas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas'
        },
        () => {
          console.log('Conversa atualizada, recarregando...');
          loadConversas();
        }
      )
      .subscribe();

    // Subscribe to mensagens changes
    const mensagensSubscription = supabase
      .channel('mensagens-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens'
        },
        (payload) => {
          const novaMensagem = payload.new as Mensagem;
          console.log('Nova mensagem recebida:', novaMensagem);
          
          setMensagens(prev => ({
            ...prev,
            [novaMensagem.conversa_id]: [
              ...(prev[novaMensagem.conversa_id] || []),
              novaMensagem
            ]
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversasSubscription);
      supabase.removeChannel(mensagensSubscription);
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadConversas();
    }
  }, [user]);

  return {
    conversas,
    mensagens,
    loading,
    loadingMensagens,
    loadConversas,
    loadMensagens,
    enviarMensagem,
    atualizarStatusConversa,
    assumirConversa
  };
}
