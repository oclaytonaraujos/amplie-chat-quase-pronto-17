
import React, { useState } from 'react';
import { ChatSidebar } from '@/components/chat-interno/ChatSidebar';
import { ChatArea } from '@/components/chat-interno/ChatArea';
import { ContactsList } from '@/components/chat-interno/ContactsList';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTransferNotifications } from '@/hooks/useTransferNotifications';
import { useToast } from '@/hooks/use-toast';
import { useChatInterno } from '@/hooks/useChatInterno';
import { useChatInternoNotifications } from '@/hooks/useChatInternoNotifications';
import { Usuario, Conversa, Mensagem, ConversaInterna, MensagemInterna } from '@/types/chat-interno';
import { ChatInternoTransferService } from '@/services/chatInternoTransfer';
import { useAuth } from '@/hooks/useAuth';
import { SyncLoaderSection } from '@/components/ui/sync-loader';


export default function ChatInterno() {
  const [conversaSelecionada, setConversaSelecionada] = useState<ConversaInterna | null>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { addTransferNotification } = useTransferNotifications();
  const { toast } = useToast();
  
  // Usar hook real do chat interno
  const {
    conversasInternas,
    mensagensInternas,
    usuarios,
    loading,
    loadMensagensInternas,
    criarConversaInterna,
    enviarMensagemInterna
  } = useChatInterno();

  // Hook para notificações e status
  const {
    unreadCounts,
    marcarConversaComoLida
  } = useChatInternoNotifications();

  // Converter dados do Supabase para componentes (sem conversão de UUID para número)
  const convertToMockConversas = (conversasDb: ConversaInterna[]): Conversa[] => {
    return conversasDb.map(conv => ({
      id: conv.id,
      tipo: 'individual' as const,
      nome: conv.participante?.nome || 'Usuário',
      participantes: [{
        id: conv.participante?.id || '',
        nome: conv.participante?.nome || 'Usuário',
        email: conv.participante?.email || '',
        status: conv.participante?.status as 'online' | 'offline' | 'ausente' || 'offline',
        cargo: conv.participante?.cargo || 'Usuário'
      }],
      mensagensNaoLidas: unreadCounts[conv.id] || 0
    }));
  };

  const convertToMockMensagens = (mensagensDb: MensagemInterna[]): Mensagem[] => {
    return mensagensDb.map(msg => ({
      id: msg.id,
      texto: msg.conteudo,
      autor: {
        id: msg.remetente?.id || msg.remetente_id || '',
        nome: msg.remetente?.nome || (msg.remetente_id === user?.id ? 'Você' : 'Usuário'),
        email: msg.remetente?.email || '',
        status: (msg.remetente?.status as 'online' | 'offline' | 'ausente') || 'offline',
        cargo: msg.remetente?.cargo || 'Usuário'
      },
      tempo: new Date(msg.created_at || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tipo: msg.tipo_mensagem as 'texto' | 'imagem' | 'documento' | 'audio' || 'texto'
    }));
  };

  const handleSelectConversa = (conversa: Conversa) => {
    console.log('Selecionando conversa:', conversa.id);
    
    // Encontrar a conversa original usando o ID
    const conversaOriginal = conversasInternas.find(c => c.id === conversa.id);
    
    if (conversaOriginal) {
      setConversaSelecionada(conversaOriginal);
      // Carregar mensagens da conversa selecionada
      loadMensagensInternas(conversaOriginal.id);
      // Marcar conversa como lida quando selecionada
      marcarConversaComoLida(conversaOriginal.id);
    }
    
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleCloseConversa = () => {
    setConversaSelecionada(null);
    if (isMobile) {
      setSidebarOpen(true);
    }
  };

  const handleDeleteConversa = (conversaId: string) => {
    // Implementar exclusão no banco de dados se necessário
    if (conversaSelecionada?.id === conversaId) {
      setConversaSelecionada(null);
    }

    toast({
      title: "Conversa apagada",
      description: "A conversa foi removida com sucesso.",
    });
  };

  const handleStartCall = (conversaId: string) => {
    const conversa = conversasInternas.find(c => c.id === conversaId);
    if (conversa) {
      toast({
        title: "Chamada iniciada",
        description: `Conectando com ${conversa.participante?.nome}...`,
      });
      // Aqui você implementaria a lógica real de chamada
    }
  };

  const handleSendMessage = async (texto: string) => {
    if (!texto.trim() || !conversaSelecionada) return;

    const result = await enviarMensagemInterna(conversaSelecionada.id, texto);
    if (result) {
      // Mensagem foi enviada com sucesso - atualizada automaticamente via realtime
      console.log('Mensagem enviada:', result);
    }
  };

  const handleNovaConversa = () => {
    setShowContacts(true);
  };

  const handleSelectContact = async (usuario: Usuario) => {
    try {
      console.log('Criando conversa com usuário:', usuario.id);
      
      const novaConversa = await criarConversaInterna(usuario.id);
      if (novaConversa) {
        // Encontrar a conversa completa na lista após recarregar
        await new Promise(resolve => setTimeout(resolve, 100)); // Aguardar atualização
        const conversaCompleta = conversasInternas.find(c => c.id === novaConversa.id);
        if (conversaCompleta) {
          setConversaSelecionada(conversaCompleta);
          loadMensagensInternas(conversaCompleta.id);
          console.log('Nova conversa criada:', conversaCompleta.id);
        }
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: "Erro ao criar conversa",
        description: "Não foi possível iniciar a conversa.",
        variant: "destructive",
      });
    }
    
    setShowContacts(false);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile 
          ? `fixed inset-y-0 left-0 z-50 ${!sidebarOpen ? '-translate-x-full' : 'translate-x-0'} transition-transform duration-300 ease-in-out w-full max-w-sm`
          : 'relative w-80'
        }
      `}>
        {showContacts ? (
          <ContactsList
            usuarios={usuarios.map(u => ({ 
              ...u, 
              status: (u.status as 'online' | 'offline' | 'ausente') || 'offline',
              cargo: u.cargo || 'Usuário'
            }))}
            onSelectContact={handleSelectContact}
            onBack={() => setShowContacts(false)}
          />
        ) : (
          <ChatSidebar
            conversas={convertToMockConversas(conversasInternas)}
            conversaSelecionada={conversaSelecionada}
            onSelectConversa={handleSelectConversa}
            onNovaConversa={handleNovaConversa}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Área principal do chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobile && sidebarOpen ? 'hidden' : ''}`}>
        {loading ? (
          <SyncLoaderSection text="Carregando chat interno..." className="flex-1" />
        ) : (
          <ChatArea
            conversa={conversaSelecionada}
            mensagens={conversaSelecionada ? convertToMockMensagens(mensagensInternas[conversaSelecionada.id] || []) : []}
            onSendMessage={handleSendMessage}
            onOpenSidebar={() => setSidebarOpen(true)}
            onCloseConversa={handleCloseConversa}
            onDeleteConversa={() => handleDeleteConversa(conversaSelecionada?.id)}
            onStartCall={() => handleStartCall(conversaSelecionada?.id)}
            showMenuButton={isMobile}
          />
        )}
      </div>
    </div>
  );
}
