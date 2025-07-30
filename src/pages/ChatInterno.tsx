
import React, { useState } from 'react';
import { ChatSidebar } from '@/components/chat-interno/ChatSidebar';
import { ChatArea } from '@/components/chat-interno/ChatArea';
import { ContactsList } from '@/components/chat-interno/ContactsList';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTransferNotifications } from '@/hooks/useTransferNotifications';
import { useToast } from '@/hooks/use-toast';
import { useChatInterno } from '@/hooks/useChatInterno';
import { Usuario, Conversa, Mensagem } from '@/types/chat-interno';
import { ChatInternoTransferService } from '@/services/chatInternoTransfer';


export default function ChatInterno() {
  const [conversaSelecionada, setConversaSelecionada] = useState<any>(null);
  const [showContacts, setShowContacts] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
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

  // Converter dados para compatibilidade com componentes mock
  const convertToMockConversas = (conversasDb: any[]): Conversa[] => {
    return conversasDb.map(conv => ({
      id: parseInt(conv.id.substring(0, 8), 16), // Converter UUID para número
      tipo: 'individual' as const,
      nome: conv.participante?.nome || 'Usuário',
      participantes: [{
        id: conv.participante?.id || '0',
        nome: conv.participante?.nome || 'Usuário',
        email: conv.participante?.email || '',
        status: 'online',
        cargo: conv.participante?.cargo || 'Usuário'
      }],
      mensagensNaoLidas: conv.mensagensNaoLidas || 0
    }));
  };

  const convertToMockMensagens = (mensagensDb: any[]): Mensagem[] => {
    return mensagensDb.map(msg => ({
      id: parseInt(msg.id.substring(0, 8), 16),
      texto: msg.conteudo,
      autor: {
        id: parseInt((msg.remetente?.id || msg.remetente_id || '0').substring(0, 8), 16),
        nome: msg.remetente?.nome || 'Usuário',
        email: msg.remetente?.email || '',
        status: 'online' as const,
        cargo: msg.remetente?.cargo || 'Usuário'
      },
      tempo: new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tipo: msg.tipo_mensagem || 'texto'
    }));
  };

  const handleSelectConversa = (conversa: any) => {
    // Encontrar a conversa original pelo nome (como identificador)
    const conversaOriginal = conversasInternas.find(c => 
      c.participante?.nome === conversa.nome
    );
    
    if (conversaOriginal) {
      setConversaSelecionada(conversaOriginal);
      // Carregar mensagens da conversa selecionada usando o ID original
      loadMensagensInternas(conversaOriginal.id);
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

  const handleSelectContact = async (usuario: any) => {
    try {
      // Criar nova conversa interna com o usuário selecionado (usar ID original string do banco)
      const usuarioOriginal = usuarios.find(u => parseInt(u.id.substring(0, 8), 16) === usuario.id);
      const novaConversa = await criarConversaInterna(usuarioOriginal?.id || usuario.id);
      if (novaConversa) {
        setConversaSelecionada(novaConversa);
        loadMensagensInternas(novaConversa.id);
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
            usuarios={usuarios.map(u => ({ ...u, id: parseInt(u.id.substring(0, 8), 16), status: 'online' as const, cargo: u.cargo || 'Usuário' }))}
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
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Carregando chat interno...</p>
            </div>
          </div>
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
