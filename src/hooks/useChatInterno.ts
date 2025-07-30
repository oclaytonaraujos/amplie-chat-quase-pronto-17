
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Usuario, ConversaInterna, MensagemInterna } from '@/types/chat-interno';

export function useChatInterno() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversasInternas, setConversasInternas] = useState<ConversaInterna[]>([]);
  const [mensagensInternas, setMensagensInternas] = useState<{ [conversaId: string]: MensagemInterna[] }>({});
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar usuários da empresa
  const loadUsuarios = async () => {
    if (!user) return;
    
    try {
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
        .from('profiles')
        .select('id, nome, email, avatar_url, status, cargo, setor')
        .eq('empresa_id', currentProfile.empresa_id)
        .neq('id', user.id); // Excluir o próprio usuário

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        return;
      }

      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  // Carregar conversas internas existentes do banco
  const loadConversasInternas = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('conversas_internas')
        .select(`
          *,
          participante_1:profiles!conversas_internas_participante_1_id_fkey(id, nome, email, avatar_url, status, cargo, setor),
          participante_2:profiles!conversas_internas_participante_2_id_fkey(id, nome, email, avatar_url, status, cargo, setor)
        `)
        .or(`participante_1_id.eq.${user.id},participante_2_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas internas:', error);
        return;
      }

      // Mapear conversas com informações do outro participante
      const conversasComParticipantes = data?.map(conversa => {
        const outroParticipante = conversa.participante_1_id === user.id 
          ? conversa.participante_2 
          : conversa.participante_1;
        
        return {
          ...conversa,
          participante: outroParticipante,
          mensagensNaoLidas: 0 // TODO: implementar contagem real
        } as ConversaInterna;
      }) || [];

      setConversasInternas(conversasComParticipantes);
    } catch (error) {
      console.error('Erro ao carregar conversas internas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar mensagens de uma conversa interna
  const loadMensagensInternas = async (conversaId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mensagens_internas')
        .select(`
          *,
          remetente:profiles!mensagens_internas_remetente_id_fkey(id, nome, email, avatar_url, status, cargo, setor)
        `)
        .eq('conversa_interna_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar mensagens internas:', error);
        return;
      }

      setMensagensInternas(prev => ({ ...prev, [conversaId]: data as MensagemInterna[] || [] }));
    } catch (error) {
      console.error('Erro ao carregar mensagens internas:', error);
    }
  };

  // Criar nova conversa interna
  const criarConversaInterna = async (destinatarioId: string) => {
    if (!user) return null;
    
    try {
      // Verificar se já existe uma conversa entre os usuários
      const { data: conversaExistente, error: errorBusca } = await supabase
        .from('conversas_internas')
        .select('*')
        .or(`and(participante_1_id.eq.${user.id},participante_2_id.eq.${destinatarioId}),and(participante_1_id.eq.${destinatarioId},participante_2_id.eq.${user.id})`)
        .single();

      if (conversaExistente && !errorBusca) {
        await loadConversasInternas();
        return conversaExistente;
      }

      // Buscar empresa_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('conversas_internas')
        .insert({
          participante_1_id: user.id,
          participante_2_id: destinatarioId,
          tipo: 'individual',
          empresa_id: profile?.empresa_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar conversa interna:', error);
        toast({
          title: "Erro ao criar conversa",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      await loadConversasInternas();
      return data;
    } catch (error) {
      console.error('Erro ao criar conversa interna:', error);
      return null;
    }
  };

  // Enviar mensagem interna
  const enviarMensagemInterna = async (conversaId: string, conteudo: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('mensagens_internas')
        .insert({
          conversa_interna_id: conversaId,
          remetente_id: user.id,
          conteudo,
          tipo_mensagem: 'texto',
          lida: false
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao enviar mensagem interna:', error);
        toast({
          title: "Erro ao enviar mensagem",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      // Atualizar updated_at da conversa
      await supabase
        .from('conversas_internas')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversaId);

      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem interna:', error);
      return null;
    }
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('chat-interno-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_internas'
        },
        (payload) => {
          const novaMensagem = payload.new as MensagemInterna;
          console.log('Nova mensagem interna recebida:', novaMensagem);
          
          setMensagensInternas(prev => ({
            ...prev,
            [novaMensagem.conversa_interna_id]: [
              ...(prev[novaMensagem.conversa_interna_id] || []),
              novaMensagem
            ]
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadUsuarios();
      loadConversasInternas();
    }
  }, [user]);

  return {
    conversasInternas,
    mensagensInternas,
    usuarios,
    loading,
    loadConversasInternas,
    loadMensagensInternas,
    criarConversaInterna,
    enviarMensagemInterna
  };
}
