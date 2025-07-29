
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePresence } from '@/contexts/PresenceContext';
import { useConversationRealtime } from '@/hooks/useConversationRealtime';
import { useMessageManager } from '@/hooks/useMessageManager';
import { useEvolutionApiSender } from '@/hooks/useEvolutionApiSender';
import { useEvolutionApiValidation } from '@/hooks/useEvolutionApiValidation';

interface Conversa {
  id: string;
  agente_id: string | null;
  canal: string | null;
  contato_id: string | null;
  created_at: string | null;
  empresa_id: string | null;
  prioridade: string | null;
  setor: string | null;
  status: string | null;
  tags: string[] | null;
  updated_at: string | null;
  contatos?: {
    id: string;
    nome: string;
    telefone: string | null;
    email: string | null;
  } | null;
  profiles?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  mensagens?: {
    id: string;
    conteudo: string;
    created_at: string | null;
    remetente_tipo: string;
    remetente_nome: string | null;
  }[];
}

interface Mensagem {
  id: string;
  conteudo: string;
  conversa_id: string | null;
  created_at: string | null;
  lida: boolean | null;
  metadata: any;
  remetente_id: string | null;
  remetente_nome: string | null;
  remetente_tipo: string;
  tipo_mensagem: string | null;
}

// URLs de webhook são obtidas dinamicamente das conexões WhatsApp

export function useAtendimentoReal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { bidirecional } = usePresence();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  
  // Use Evolution API sender for message sending
  const evolutionSender = useEvolutionApiSender();
  
  // Use validation to check if system is properly configured
  const validation = useEvolutionApiValidation();
  
  // Use message manager for better message handling
  const messageManager = useMessageManager();
  
  // Use conversation realtime for active conversation
  const conversationRealtime = useConversationRealtime(activeConversation || '');
  
  // Get messages from message manager
  const mensagensConversa = messageManager.messagesCache;

  // Carregar conversas do Supabase
  const loadConversas = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        console.error('Empresa não encontrada para o usuário');
        return;
      }

      const { data, error } = await supabase
        .from('conversas')
        .select(`
          *,
          contatos (
            id,
            nome,
            telefone,
            email
          ),
          profiles (
            id,
            nome,
            email
          )
        `)
        .eq('empresa_id', profile.empresa_id)
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

      // Ordenar conversas: primeiro as do usuário logado que estão em atendimento, depois as outras
      const conversasOrdenadas = (data || []).sort((a, b) => {
        const aIsUserConversation = a.agente_id === user.id && a.status === 'em-atendimento';
        const bIsUserConversation = b.agente_id === user.id && b.status === 'em-atendimento';
        
        if (aIsUserConversation && !bIsUserConversation) return -1;
        if (!aIsUserConversation && bIsUserConversation) return 1;
        
        // Se ambas são do usuário ou nenhuma é, ordenar por data de atualização
        return new Date(b.updated_at || '').getTime() - new Date(a.updated_at || '').getTime();
      });

      setConversas(conversasOrdenadas);

    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar mensagens de uma conversa específica
  const loadMensagensConversa = async (conversaId: string, forceRefresh = false) => {
    return await messageManager.loadMessages(conversaId, forceRefresh);
  };


  // Enviar mensagem de texto usando Evolution API Sender
  const enviarMensagem = async (
    conversaId: string,
    telefone: string, 
    conteudo: string, 
    whatsappConnectionId?: string
  ) => {
    if (!user) return false;

    // Verificar se o sistema está configurado para enviar mensagens
    if (!validation.isValid) {
      toast({
        title: "Sistema não configurado",
        description: validation.error || "Configure a Evolution API para enviar mensagens",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Buscar empresa do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id, nome')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        toast({
          title: "Erro de configuração",
          description: "Empresa não encontrada para o usuário",
          variant: "destructive",
        });
        return false;
      }

      // Inserir mensagem no banco local primeiro
      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversaId,
          conteudo,
          remetente_id: user.id,
          remetente_nome: profile?.nome || 'Agente',
          remetente_tipo: 'agente',
          tipo_mensagem: 'texto'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir mensagem:', error);
        toast({
          title: "Erro ao salvar mensagem",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Notify via realtime
      if (conversationRealtime && conversaId === activeConversation) {
        await conversationRealtime.notifyNewMessage(data);
      }

      // Enviar via Evolution API usando Edge Function
      try {
        await evolutionSender.sendMessage({
          telefone: telefone,
          mensagem: conteudo,
          tipo: 'texto',
          conversaId: conversaId
        });
        
        // Recarregar mensagens para mostrar a nova mensagem
        loadMensagensConversa(conversaId);
        
        return true;
      } catch (sendError) {
        console.error('Erro ao enviar via Evolution API:', sendError);
        toast({
          title: "Erro ao enviar mensagem",
          description: "A mensagem foi salva mas não pôde ser enviada via WhatsApp",
          variant: "destructive",
        });
        return false;
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar a mensagem",
        variant: "destructive",
      });
      return false;
    }
  };

  // Enviar mensagem com anexo usando Evolution API Sender
  const enviarMensagemComAnexo = async (
    conversaId: string, 
    telefone: string, 
    arquivo: File, 
    legenda?: string,
    whatsappConnectionId?: string
  ) => {
    if (!user) return false;

    try {
      // Buscar dados do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id, nome')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        toast({
          title: "Erro de configuração",
          description: "Empresa não encontrada para o usuário",
          variant: "destructive",
        });
        return false;
      }

      // Determinar tipo de mensagem
      const isImage = arquivo.type.startsWith('image/');
      const tipoMensagem = isImage ? 'imagem' : 'documento';

      // Inserir mensagem no banco local primeiro
      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversaId,
          conteudo: legenda || arquivo.name,
          remetente_id: user.id,
          remetente_nome: profile?.nome || 'Agente',
          remetente_tipo: 'agente',
          tipo_mensagem: tipoMensagem,
          metadata: {
            attachment: {
              type: isImage ? 'image' : 'document',
              fileName: arquivo.name,
              mimeType: arquivo.type
            }
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir mensagem:', error);
        toast({
          title: "Erro ao salvar mensagem",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      // Notify via realtime
      if (conversationRealtime && conversaId === activeConversation) {
        await conversationRealtime.notifyNewMessage(data);
      }

      // Fazer upload do arquivo primeiro
      try {
        const arquivoUrl = await evolutionSender.uploadFile(arquivo);
        
        // Enviar via Evolution API usando Edge Function
        if (isImage) {
          await evolutionSender.sendMessage({
            telefone: telefone,
            mensagem: legenda || '',
            tipo: 'imagem',
            conversaId: conversaId,
            opcoes: {
              imageUrl: arquivoUrl,
              caption: legenda
            }
          });
        } else {
          await evolutionSender.sendMessage({
            telefone: telefone,
            mensagem: '',
            tipo: 'documento',
            conversaId: conversaId,
            opcoes: {
              documentUrl: arquivoUrl,
              fileName: arquivo.name
            }
          });
        }
        
        // Recarregar mensagens para mostrar a nova mensagem
        loadMensagensConversa(conversaId);
        
        return true;
      } catch (sendError) {
        console.error('Erro ao enviar via Evolution API:', sendError);
        toast({
          title: "Erro ao enviar arquivo",
          description: "O arquivo foi salvo mas não pôde ser enviado via WhatsApp",
          variant: "destructive",
        });
        return false;
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem com anexo:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o arquivo",
        variant: "destructive",
      });
      return false;
    }
  };

  // Atualizar status da conversa
  const atualizarStatusConversa = async (conversaId: string, novoStatus: string, resumo?: string) => {
    try {
      console.log('🔄 Iniciando atualização de status da conversa:', { conversaId, novoStatus, resumo });
      
      // Verificar se é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(conversaId)) {
        console.log('⚠️ ID da conversa não é um UUID válido:', conversaId);
        return { success: false, error: 'ID inválido' };
      }

      const updateData: any = { 
        status: novoStatus,
        updated_at: new Date().toISOString()
      };
      
      // Definir agente_id baseado no status e lógica de negócio
      if (novoStatus === 'em-atendimento') {
        updateData.agente_id = user?.id;
      } else if (novoStatus === 'ativo') {
        updateData.agente_id = null;
      } else if (novoStatus === 'pendente') {
        updateData.agente_id = user?.id;
      } else if (novoStatus === 'finalizado') {
        updateData.agente_id = user?.id;
        updateData.finished_at = new Date().toISOString();
        
        // Adicionar resumo se fornecido
        if (resumo && resumo.trim()) {
          updateData.resumo_atendimento = resumo.trim();
        }
      }

      console.log('📤 Enviando dados para o Supabase:', updateData);

      const { data, error } = await supabase
        .from('conversas')
        .update(updateData)
        .eq('id', conversaId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar status no banco:', error);
        toast({
          title: "Erro ao atualizar status",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      console.log('✅ Status atualizado no banco com sucesso:', data);

      // Se finalizado, remover da lista local e mostrar feedback
      if (novoStatus === 'finalizado') {
        console.log('🗑️ Removendo conversa finalizada da lista local:', conversaId);
        
        setConversas(prev => {
          const conversaAnterior = prev.find(c => c.id === conversaId);
          const novaLista = prev.filter(c => c.id !== conversaId);
          
          console.log('📊 Conversa removida:', conversaAnterior?.contatos?.nome);
          console.log('📊 Conversas restantes na lista:', novaLista.length);
          
          return novaLista;
        });
        
        // Limpar mensagens da conversa finalizada
        messageManager.clearCache(conversaId);
        
        // Se era a conversa ativa, desativar
        if (activeConversation === conversaId) {
          console.log('🔚 Desativando conversa ativa finalizada');
          desativarConversa();
        }

        // Mostrar toast de sucesso
        toast({
          title: "Atendimento finalizado",
          description: "O atendimento foi finalizado com sucesso e removido da lista.",
        });
        
      } else {
        // Para outros status, atualizar a conversa na lista
        console.log('🔄 Atualizando status na lista local');
        setConversas(prev => prev.map(conversa => 
          conversa.id === conversaId 
            ? { ...conversa, ...updateData }
            : conversa
        ));
      }

      // Notify via realtime
      if (conversationRealtime && conversaId === activeConversation) {
        await conversationRealtime.notifyStatusChange(novoStatus);
      }

      return { success: true, data };
      
    } catch (error) {
      console.error('💥 Erro inesperado ao atualizar status:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao finalizar o atendimento. Tente novamente.",
        variant: "destructive",
      });
      return { success: false, error: 'Erro inesperado' };
    }
  };

  // Ativar conversa (join)
  const ativarConversa = async (conversaId: string) => {
    setActiveConversation(conversaId);
    if (bidirecional) {
      bidirecional.joinConversation(conversaId);
    }
  };

  // Desativar conversa (leave)
  const desativarConversa = () => {
    if (bidirecional && activeConversation) {
      bidirecional.leaveConversation();
    }
    setActiveConversation(null);
  };

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscription para conversas - mais específico para otimizar
    const conversasChannel = supabase
      .channel('conversas-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversas'
        },
        (payload) => {
          console.log('🔄 Conversa atualizada via realtime:', payload);
          const updatedConversa = payload.new as Conversa;
          
          // Atualizar conversa específica na lista local
          setConversas(prev => {
            const updated = prev.map(conversa => 
              conversa.id === updatedConversa.id 
                ? { ...conversa, ...updatedConversa }
                : conversa
            );
            
            // Se a conversa foi finalizada, removê-la da lista
            if (updatedConversa.status === 'finalizado') {
              return updated.filter(c => c.id !== updatedConversa.id);
            }
            
            return updated;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversas'
        },
        (payload) => {
          console.log('🆕 Nova conversa via realtime:', payload);
          // Recarregar lista completa para novas conversas
          loadConversas();
        }
      )
      .subscribe();

    // Subscription para mensagens
    const mensagensChannel = supabase
      .channel('mensagens-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens'
        },
        (payload) => {
          console.log('Nova mensagem:', payload);
          const novaMensagem = payload.new as Mensagem;
          if (novaMensagem.conversa_id) {
            messageManager.addMessage(novaMensagem.conversa_id, novaMensagem);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversasChannel);
      supabase.removeChannel(mensagensChannel);
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
    loading,
    mensagensConversa: messageManager.messagesCache,
    activeConversation,
    validation, // Adicionar validação ao retorno
    loadMensagensConversa,
    enviarMensagem,
    enviarMensagemComAnexo,
    atualizarStatusConversa,
    loadConversas,
    ativarConversa,
    desativarConversa,
    conversationRealtime,
    bidirecional,
    messageManager
  };
}
