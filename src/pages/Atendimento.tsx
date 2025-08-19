import { useState } from 'react';
import { MessageSquare, User, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedAtendimentosList } from '@/components/atendimento/OptimizedAtendimentosList';
// ChatWhatsAppReal removed - now using n8n integration
import { ClienteInfo } from '@/components/atendimento/ClienteInfo';
import { ContactsList } from '@/components/atendimento/ContactsList';
import { TransferDialog } from '@/components/atendimento/TransferDialog';
import { ConfirmSaveContactDialog } from '@/components/contatos/ConfirmSaveContactDialog';
import { NovoContatoDialog } from '@/components/contatos/NovoContatoDialog';
import { NovaConversaDialog } from '@/components/atendimento/NovaConversaDialog';
import { useContactCheck } from '@/hooks/useContactCheck';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAtendimentoReal } from '@/hooks/useAtendimentoReal';
import { useContatos } from '@/hooks/useContatos';
import { useNavigate } from 'react-router-dom';

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
}

export default function Atendimento() {
  const [selectedAtendimento, setSelectedAtendimento] = useState<Conversa | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showNovaConversaDialog, setShowNovaConversaDialog] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { atualizarStatusConversa } = useAtendimentoReal();
  const { contatos: contatosEmpresa } = useContatos();

  // Hook para gerenciar verificação e salvamento de contatos
  const {
    pendingContact,
    showConfirmDialog,
    showNovoContatoDialog,
    setShowConfirmDialog,
    setShowNovoContatoDialog,
    handleFinalizarWithContactCheck,
    handleConfirmSave,
    handleCancelSave,
    handleContactSaved
  } = useContactCheck();

  const handleSelectAtendimento = async (conversa: Conversa) => {
    setSelectedAtendimento(conversa);
    setShowContacts(false);
    
    // Automaticamente atualizar status quando atendente abre o chat
    if (conversa.status === 'ativo') {
      // Novo atendimento: atendente humano abriu o chat
      await atualizarStatusConversa(conversa.id, 'em-atendimento');
      // Atualizar localmente o status
      setSelectedAtendimento({...conversa, status: 'em-atendimento'});
    }
    
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleReturnToList = () => {
    setShowChat(false);
    setShowContacts(false);
  };

  const handleSairConversa = () => {
    setSelectedAtendimento(null);
    if (isMobile) {
      setShowChat(false);
    }
  };

  const handleTransferir = () => {
    setShowTransferDialog(true);
  };

  const handleFinalizar = async (resumo?: string) => {
    if (!selectedAtendimento) {
      console.log('❌ Nenhum atendimento selecionado para finalizar');
      return;
    }

    console.log('🚀 Iniciando finalização do atendimento:', {
      conversaId: selectedAtendimento.id,
      clienteNome: selectedAtendimento.contatos?.nome || 'Cliente',
      resumo: resumo
    });

    try {
      // Atualizar status da conversa para finalizado com resumo opcional
      const resultado = await atualizarStatusConversa(selectedAtendimento.id, 'finalizado', resumo);
      console.log('📊 Resultado da finalização:', resultado);
      
      // Verificar se a operação foi bem-sucedida
      if (resultado && typeof resultado === 'object' && resultado.success) {
        console.log('✅ Atendimento finalizado com sucesso, fechando chat');
        
        // Fechar o chat e limpar a seleção
        setSelectedAtendimento(null);
        
        // Fechar chat no mobile
        if (isMobile) {
          setShowChat(false);
        }
        
        console.log('🔚 Chat fechado e atendimento removido da lista');
        
        // O toast de sucesso já é exibido no hook useAtendimentoReal
        
      } else {
        console.error('❌ Erro na finalização:', resultado);
        // O toast de erro já é exibido no hook useAtendimentoReal
      }
      
    } catch (error) {
      console.error('💥 Erro inesperado ao finalizar atendimento:', error);
      toast({
        title: "Erro inesperado",
        description: "Não foi possível finalizar o atendimento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleNovaConversa = () => {
    setShowContacts(true);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleSelectContact = (contato: any) => {
    // Criar nova conversa ou redirecionar para conversa existente
    const conversaId = `conversa-${contato.id}-${Date.now()}`;
    
    // Navegar para atendimento com o contato selecionado
    navigate(`/atendimento?contato=${contato.id}&conversa=${conversaId}`, {
      state: { 
        contato: {
          id: contato.id,
          nome: contato.nome,
          telefone: contato.telefone,
          email: contato.email
        }
      }
    });
    
    setShowContacts(false);
    if (isMobile) {
      setShowChat(false);
    }
  };

  const handleConfirmTransfer = async (agente: string, motivo: string) => {
    if (!selectedAtendimento) return;

    console.log('Transferir para:', agente, 'Motivo:', motivo);
    
    // Atualizar status para pendente (aguardando novo agente)
    await atualizarStatusConversa(selectedAtendimento.id, 'pendente');
    
    toast({
      title: "Atendimento transferido",
      description: `Atendimento transferido para ${agente} com sucesso.`,
    });
    
    setShowTransferDialog(false);
    setSelectedAtendimento(null);
    if (isMobile) {
      setShowChat(false);
    }
  };

  const handleContatoAdicionado = (novoContato: any) => {
    handleContactSaved();
    toast({
      title: "Contato salvo",
      description: `${novoContato.nome} foi adicionado aos contatos com sucesso.`
    });
  };

  const handleConversaCriada = (conversa: any) => {
    setSelectedAtendimento(conversa);
    setShowNovaConversaDialog(false);
    setShowContacts(false);
    if (isMobile) {
      setShowChat(true);
    }
  };

  // Cliente simulado para informações detalhadas
  const clienteInfo = selectedAtendimento?.contatos ? {
    id: selectedAtendimento.contatos.id,
    nome: selectedAtendimento.contatos.nome,
    telefone: selectedAtendimento.contatos.telefone || '',
    email: selectedAtendimento.contatos.email || '',
    dataCadastro: '15/03/2023',
    tags: selectedAtendimento.tags || [],
    historico: []
  } : null;

  // Layout mobile: mostra lista, contatos ou chat baseado no estado
  if (isMobile) {
    return (
      <div className="min-h-screen">
        {!showChat ? (
          // Mostra lista de atendimentos
          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Atendimentos</h2>
              <Button 
                onClick={handleNovaConversa}
                className="bg-green-500 hover:bg-green-600 text-white ml-2 w-10 h-10 p-0"
                size="icon"
                title="Nova conversa"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <OptimizedAtendimentosList 
                onSelectAtendimento={handleSelectAtendimento}
                selectedAtendimento={selectedAtendimento}
                isMobile={isMobile}
              />
            </div>
          </div>
        ) : showContacts ? (
          // Mostra lista de contatos
          <ContactsList
            contatos={contatosEmpresa.filter(c => c.status === 'ativo').map(c => ({
              id: parseInt(c.id),
              nome: c.nome,
              telefone: c.telefone || '',
              email: c.email,
              status: 'online' as const,
              ultimoContato: 'Agora'
            }))}
            onSelectContact={handleSelectContact}
            onBack={handleReturnToList}
            onReturnToList={handleReturnToList}
            onAdicionarContato={handleContatoAdicionado}
            onNovoNumero={() => setShowNovaConversaDialog(true)}
          />
        ) : (
          // Mostra chat com container otimizado para mobile
          <div className="h-screen overflow-hidden">
          <div className="text-center py-4 text-muted-foreground">
            <p>Chat integrado via n8n</p>
          </div>
          </div>
        )}
      </div>
    );
  }

  // Layout desktop: duas colunas
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Coluna esquerda: Lista de atendimentos */}
        <div className={`${leftPanelCollapsed ? 'w-12' : 'w-80'} border-r border-gray-200 bg-white flex flex-col transition-all duration-300 relative`}>
          {!leftPanelCollapsed && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Atendimentos</h2>
                <Button 
                  onClick={handleNovaConversa}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova conversa
                </Button>
              </div>
            </div>
          )}
          
          {/* Botão de colapsar painel esquerdo */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-3 top-4 z-10 bg-white border border-gray-200 rounded-full w-6 h-6 p-0 shadow-sm"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          >
            {leftPanelCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </Button>
          {!leftPanelCollapsed && (
            <div className="flex-1 overflow-hidden">
              <OptimizedAtendimentosList 
                onSelectAtendimento={handleSelectAtendimento}
                selectedAtendimento={selectedAtendimento}
                isMobile={false}
              />
            </div>
          )}
        </div>

        {/* Coluna direita: Chat */}
        <div className="flex-1 flex flex-col">
          {showContacts ? (
            <ContactsList
              contatos={contatosEmpresa.filter(c => c.status === 'ativo').map(c => ({
                id: parseInt(c.id),
                nome: c.nome,
                telefone: c.telefone || '',
                email: c.email,
                status: 'online' as const,
                ultimoContato: 'Agora'
              }))}
              onSelectContact={handleSelectContact}
              onBack={handleReturnToList}
              onReturnToList={handleReturnToList}
              onAdicionarContato={handleContatoAdicionado}
              onNovoNumero={() => setShowNovaConversaDialog(true)}
            />
          ) : selectedAtendimento ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>Chat integrado via n8n</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um atendimento
                </h3>
                <p className="text-gray-500">
                  Escolha uma conversa para começar o atendimento
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diálogos */}
      <TransferDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        onConfirm={handleConfirmTransfer}
      />

      <ConfirmSaveContactDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        clienteNome={pendingContact?.nome || ''}
        clienteTelefone={pendingContact?.telefone || ''}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />

      <NovoContatoDialog
        open={showNovoContatoDialog}
        onOpenChange={setShowNovoContatoDialog}
        onContatoAdicionado={handleContatoAdicionado}
        dadosIniciais={pendingContact}
      />

      <NovaConversaDialog
        open={showNovaConversaDialog}
        onOpenChange={setShowNovaConversaDialog}
        onConversaCriada={handleConversaCriada}
      />
    </div>
  );
}
