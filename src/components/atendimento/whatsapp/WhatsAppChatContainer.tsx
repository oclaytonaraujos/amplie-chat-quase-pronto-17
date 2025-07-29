import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { WhatsAppMessage } from './WhatsAppMessage';
import { WhatsAppInputArea } from './WhatsAppInputArea';
import { WhatsAppHeader } from './WhatsAppHeader';
import { useEvolutionApiSender } from '@/hooks/useEvolutionApiSender';
import { useToast } from '@/hooks/use-toast';
import { TypingIndicator } from '../TypingIndicator';
import { OptimizedMessagesList } from '../OptimizedMessagesList';
import { useEvolutionApiValidation } from '@/hooks/useEvolutionApiValidation';

interface WhatsAppChatContainerProps {
  conversaId: string;
  contato: {
    id: string;
    nome: string;
    telefone: string;
    email?: string;
  };
  mensagens: Array<{
    id: string;
    conteudo: string;
    remetente_tipo: 'cliente' | 'agente' | 'sistema';
    remetente_nome: string;
    created_at: string;
    tipo_mensagem: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'figurinha' | 'botoes' | 'lista';
    metadata?: any;
    status?: 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';
    lida?: boolean;
  }>;
  clienteInfo?: {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    dataCadastro: string;
    tags: string[];
    historico: any[];
  } | null;
  onSendMessage?: (messageData: {
    type: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'botoes' | 'lista';
    content: string;
    file?: File;
    metadata?: any;
  }) => void;
  onLoadMoreMessages?: () => void;
  onUpdateMessageStatus?: (messageId: string, status: string) => void;
  onReturnToList?: () => void;
  onSairConversa?: () => void;
  onTransferir?: () => void;
  onFinalizar?: (resumo?: string) => Promise<void>;
  onMudarStatus?: (novoStatus: string) => void;
  statusAtendimento?: string;
  disabled?: boolean;
}

export function WhatsAppChatContainer({
  conversaId,
  contato,
  mensagens,
  clienteInfo,
  onSendMessage,
  onLoadMoreMessages,
  onUpdateMessageStatus,
  onReturnToList,
  onSairConversa,
  onTransferir,
  onFinalizar,
  onMudarStatus,
  statusAtendimento = 'ativo',
  disabled = false
}: WhatsAppChatContainerProps) {
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showOptimizedView, setShowOptimizedView] = useState(mensagens.length > 20);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { sendMessage, uploadFile, isLoading } = useEvolutionApiSender();
  const { isValid: isEvolutionApiValid, error: evolutionApiError } = useEvolutionApiValidation();

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.chat-scroll-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [mensagens, scrollToBottom]);

  const handleSendMessage = async (messageData: {
    type: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'botoes' | 'lista';
    content: string;
    file?: File;
    metadata?: any;
  }) => {
    // If custom onSendMessage is provided, use it instead
    if (onSendMessage) {
      onSendMessage(messageData);
      return;
    }

    // Verificar se a Evolution API está configurada
    if (!isEvolutionApiValid) {
      toast({
        title: "Configuração necessária",
        description: evolutionApiError || "A Evolution API não está configurada corretamente.",
        variant: "destructive",
      });
      return;
    }

    // Default behavior using Evolution API
    try {
      let result;
      
      switch (messageData.type) {
        case 'texto':
          result = await sendMessage({
            telefone: contato.telefone,
            mensagem: messageData.content,
            tipo: 'texto',
            conversaId
          });
          break;
          
        case 'imagem':
          if (messageData.file) {
            const fileUrl = await uploadFile(messageData.file);
            result = await sendMessage({
              telefone: contato.telefone,
              mensagem: messageData.content,
              tipo: 'imagem',
              opcoes: {
                imageUrl: fileUrl,
                caption: messageData.content
              },
              conversaId
            });
          }
          break;
          
        case 'audio':
          if (messageData.file) {
            const fileUrl = await uploadFile(messageData.file);
            result = await sendMessage({
              telefone: contato.telefone,
              mensagem: '',
              tipo: 'audio',
              opcoes: {
                audioUrl: fileUrl
              },
              conversaId
            });
          }
          break;
          
        case 'video':
          if (messageData.file) {
            const fileUrl = await uploadFile(messageData.file);
            result = await sendMessage({
              telefone: contato.telefone,
              mensagem: messageData.content,
              tipo: 'video',
              opcoes: {
                videoUrl: fileUrl,
                caption: messageData.content
              },
              conversaId
            });
          }
          break;
          
        case 'documento':
          if (messageData.file) {
            const fileUrl = await uploadFile(messageData.file);
            result = await sendMessage({
              telefone: contato.telefone,
              mensagem: messageData.content,
              tipo: 'documento',
              opcoes: {
                documentUrl: fileUrl,
                fileName: messageData.file.name
              },
              conversaId
            });
          }
          break;
          
        case 'botoes':
          result = await sendMessage({
            telefone: contato.telefone,
            mensagem: messageData.content,
            tipo: 'botoes',
            opcoes: {
              botoes: messageData.metadata?.buttons || [],
            },
            conversaId
          });
          break;
          
        case 'lista':
          result = await sendMessage({
            telefone: contato.telefone,
            mensagem: messageData.content,
            tipo: 'lista',
            opcoes: {
              lista: messageData.metadata?.listOptions
            },
            conversaId
          });
          break;
          
        default:
          // Para tipos não suportados, enviar como texto
          result = await sendMessage({
            telefone: contato.telefone,
            mensagem: messageData.content,
            tipo: 'texto',
            conversaId
          });
          break;
      }
      
      if (result?.success) {
        toast({
          title: "Mensagem enviada",
          description: "Mensagem enviada com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleReply = (message: any) => {
    setReplyingTo({
      id: message.id,
      content: message.conteudo,
      sender: message.remetente_nome,
      type: message.tipo_mensagem
    });
  };

  const handleForward = (message: any) => {
    // Implementar lógica de encaminhamento
    console.log('Encaminhar mensagem:', message);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Encaminhamento de mensagens será implementado em breve.",
    });
  };

  const handleDelete = (messageId: string) => {
    // Implementar lógica de exclusão
    console.log('Deletar mensagem:', messageId);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Exclusão de mensagens será implementada em breve.",
    });
  };

  const handleStar = (messageId: string) => {
    // Implementar lógica de favoritos
    console.log('Favoritar mensagem:', messageId);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Favoritos serão implementados em breve.",
    });
  };

  const handleDownload = (url: string, fileName: string) => {
    // Implementar lógica de download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <WhatsAppHeader
        contato={contato}
        isTyping={isTyping}
        clienteInfo={clienteInfo}
        statusAtendimento={statusAtendimento}
        onReturnToList={onReturnToList}
        onSairConversa={onSairConversa}
        onTransferir={onTransferir}
        onFinalizar={onFinalizar}
        onMudarStatus={onMudarStatus}
      />
      
      {/* Evolution API Status Warning */}
      {!isEvolutionApiValid && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ Evolution API não configurada. Configure a API para enviar mensagens.
          </p>
        </div>
      )}
      
      {/* Área de mensagens - usar visualização otimizada para muitas mensagens */}
      {showOptimizedView ? (
        <OptimizedMessagesList
          messages={mensagens}
          onRetryMessage={(messageId) => console.log('Retry message:', messageId)}
          isOwnMessage={(msg) => msg.remetente_tipo === 'agente'}
          onReply={handleReply}
          onForward={handleForward}
          onDelete={handleDelete}
          onStar={handleStar}
          onDownload={handleDownload}
          className="flex-1"
        />
      ) : (
        <div 
          className="flex-1 min-h-0 overflow-y-auto p-4 chat-scroll-container"
          style={{ 
            height: 'calc(100vh - 120px)', 
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            scrollBehavior: 'smooth'
          }}
        >
          <div className="flex flex-col gap-2">
            {mensagens.map((message) => (
              <WhatsAppMessage
                key={message.id}
                message={message}
                isOwnMessage={message.remetente_tipo === 'agente'}
                onReply={handleReply}
                onForward={handleForward}
                onDelete={handleDelete}
                onStar={handleStar}
                onDownload={handleDownload}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      )}
      
      {/* Indicador de digitação */}
      <div className="px-4 pb-2">
        <TypingIndicator conversaId={conversaId} />
      </div>
      
      <WhatsAppInputArea
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={disabled || isLoading || !isEvolutionApiValid}
      />
    </div>
  );
}
