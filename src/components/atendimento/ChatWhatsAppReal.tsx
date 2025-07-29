
import React, { useState, useEffect } from 'react';
import { WhatsAppChatContainer } from './whatsapp/WhatsAppChatContainer';
import { useAtendimentoReal } from '@/hooks/useAtendimentoReal';
import { useConversationRealtime } from '@/hooks/useConversationRealtime';
import { useEvolutionApiSender } from '@/hooks/useEvolutionApiSender';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { EvolutionApiStatus } from './EvolutionApiStatus';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';

interface ChatWhatsAppRealProps {
  conversaId: string;
  nomeCliente: string;
  telefoneCliente: string;
  clienteInfo?: {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    dataCadastro: string;
    tags: string[];
    historico: any[];
  } | null;
  onReturnToList?: () => void;
  onSairConversa?: () => void;
  onTransferir?: () => void;
  onFinalizar?: (resumo?: string) => Promise<void>;
}

export function ChatWhatsAppReal({ 
  conversaId, 
  nomeCliente, 
  telefoneCliente,
  clienteInfo,
  onReturnToList,
  onSairConversa,
  onTransferir,
  onFinalizar
}: ChatWhatsAppRealProps) {
  const { toast } = useToast();
  const { 
    mensagensConversa, 
    loadMensagensConversa, 
    atualizarStatusConversa,
    enviarMensagem,
    enviarMensagemComAnexo 
  } = useAtendimentoReal();
  
  const conversationRealtime = useConversationRealtime(conversaId);
  const { sendMessage, uploadFile, isLoading } = useEvolutionApiSender();
  
  // Get real messages from the hook and map them to the expected format
  const mensagens = (mensagensConversa[conversaId] || []).map(msg => ({
    id: msg.id,
    conteudo: msg.conteudo,
    remetente_tipo: msg.remetente_tipo as 'cliente' | 'agente' | 'sistema',
    remetente_nome: msg.remetente_nome || 'Usuário',
    created_at: msg.created_at || new Date().toISOString(),
    tipo_mensagem: msg.tipo_mensagem as 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'figurinha' | 'botoes' | 'lista',
    metadata: msg.metadata,
    status: 'enviado' as const,
    lida: msg.lida || false
  }));
  
  const contato = {
    id: conversaId,
    nome: nomeCliente,
    telefone: telefoneCliente
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (conversaId) {
      loadMensagensConversa(conversaId);
    }
  }, [conversaId, loadMensagensConversa]);

  // Handle new messages from realtime updates
  useEffect(() => {
    if (conversationRealtime.lastUpdate?.type === 'nova_mensagem') {
      // Reload messages to get the latest ones
      loadMensagensConversa(conversaId);
    }
  }, [conversationRealtime.lastUpdate, loadMensagensConversa, conversaId]);

  const handleSendMessage = async (messageData: {
    type: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'botoes' | 'lista';
    content: string;
    file?: File;
    metadata?: any;
  }) => {
    try {
      // Send typing indicator
      await conversationRealtime.sendTypingIndicator(true);
      
      if (messageData.type === 'texto') {
        // Use the hook's enviarMensagem for text messages
        const success = await enviarMensagem(conversaId, telefoneCliente, messageData.content);
        
        if (success) {
          // Notify realtime system about new message
          await conversationRealtime.notifyNewMessage({
            conversaId,
            content: messageData.content,
            type: 'texto'
          });
        } else {
          throw new Error('Falha ao enviar mensagem de texto');
        }
      } else if (messageData.file && ['imagem', 'documento', 'audio', 'video'].includes(messageData.type)) {
        // Use the hook's enviarMensagemComAnexo for file messages
        const success = await enviarMensagemComAnexo(
          conversaId, 
          telefoneCliente, 
          messageData.file, 
          messageData.content
        );
        
        if (success) {
          // Notify realtime system about new message
          await conversationRealtime.notifyNewMessage({
            conversaId,
            content: messageData.content,
            type: messageData.type,
            file: messageData.file.name
          });
        } else {
          throw new Error('Falha ao enviar mensagem com anexo');
        }
      } else {
        // For other message types, use Evolution API sender as fallback
        await sendMessage({
          telefone: telefoneCliente,
          mensagem: messageData.content,
          tipo: messageData.type as any,
          conversaId,
          opcoes: messageData.metadata
        });
        
        // Reload messages to show the new one
        setTimeout(() => loadMensagensConversa(conversaId), 1000);
      }
      
      toast({
        title: "Mensagem enviada",
        description: "Mensagem enviada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar",
        description: error instanceof Error ? error.message : "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      // Stop typing indicator
      await conversationRealtime.sendTypingIndicator(false);
    }
  };

  const handleUpdateMessageStatus = (messageId: string, status: string) => {
    // This would typically update message status in the database
    console.log('Atualizar status da mensagem:', messageId, status);
  };

  const handleStatusChange = async (novoStatus: string) => {
    try {
      await atualizarStatusConversa(conversaId, novoStatus);
      
      // Notify realtime system about status change
      await conversationRealtime.notifyStatusChange(novoStatus);
      
      toast({
        title: "Status atualizado",
        description: `Status da conversa alterado para: ${novoStatus}`,
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da conversa.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Indicador de status da conexão */}
      <div className="border-b p-2 bg-muted/20">
        <ConnectionStatusIndicator
          evolutionApiStatus="connected" // TODO: obter status real da Evolution API
          whatsappConnectionStatus="connected" // TODO: obter status real do WhatsApp
          showDetails={false}
          className="w-fit"
        />
      </div>
      
      <div className="flex-1">
        <WhatsAppChatContainer
          conversaId={conversaId}
          contato={contato}
          mensagens={mensagens}
          clienteInfo={clienteInfo}
          onSendMessage={handleSendMessage}
          onUpdateMessageStatus={handleUpdateMessageStatus}
          onReturnToList={onReturnToList}
          onSairConversa={onSairConversa}
          onTransferir={onTransferir}
          onFinalizar={onFinalizar}
          onMudarStatus={handleStatusChange}
          statusAtendimento="em-atendimento"
          disabled={isLoading}
        />
      </div>
    </div>
  );
}
