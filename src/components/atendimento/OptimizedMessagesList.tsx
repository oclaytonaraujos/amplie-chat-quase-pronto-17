import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { WhatsAppMessage } from './whatsapp/WhatsAppMessage';
import { MessageStatusIndicator, MessageRetryButton } from './MessageStatusIndicator';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { SyncLoaderInline } from '@/components/ui/sync-loader';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  conteudo: string;
  remetente_tipo: 'cliente' | 'agente' | 'sistema';
  remetente_nome: string;
  created_at: string;
  tipo_mensagem: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'figurinha' | 'botoes' | 'lista';
  metadata?: any;
  status?: 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';
  lida?: boolean;
}

interface OptimizedMessagesListProps {
  messages: Message[];
  onLoadMore?: () => void;
  onRetryMessage?: (messageId: string) => void;
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  isOwnMessage?: (message: Message) => boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  onDownload?: (url: string, fileName: string) => void;
  className?: string;
}

const VIRTUAL_ITEM_HEIGHT = 80; // Altura estimada por mensagem
const MESSAGES_PER_PAGE = 50;

export function OptimizedMessagesList({
  messages,
  onLoadMore,
  onRetryMessage,
  hasMoreMessages = false,
  isLoadingMore = false,
  isOwnMessage = (msg) => msg.remetente_tipo === 'agente',
  onReply,
  onForward,
  onDelete,
  onStar,
  onDownload,
  className
}: OptimizedMessagesListProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: MESSAGES_PER_PAGE });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Memoizar mensagens visíveis para otimizar renderização
  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.start, visibleRange.end);
  }, [messages, visibleRange]);

  // Scroll para o final quando novas mensagens chegam
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Detectar se usuário está no final da conversa
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollToBottom(!isNearBottom);
    
    // Carregar mais mensagens se o usuário scrollar para o topo
    if (scrollTop === 0 && hasMoreMessages && !isLoadingMore && onLoadMore) {
      const previousScrollHeight = scrollHeight;
      onLoadMore();
      
      // Manter posição após carregar mensagens antigas
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        }
      }, 100);
    }

    lastScrollTop.current = scrollTop;
  }, [hasMoreMessages, isLoadingMore, onLoadMore]);

  // Auto scroll para novas mensagens se usuário estiver no final
  useEffect(() => {
    if (messages.length > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        if (isNearBottom) {
          setTimeout(() => scrollToBottom(true), 100);
        }
      }
    }
  }, [messages.length, scrollToBottom]);

  // Handler para retry de mensagem
  const handleRetryMessage = useCallback((messageId: string) => {
    if (onRetryMessage) {
      onRetryMessage(messageId);
    }
  }, [onRetryMessage]);

  // Renderizar mensagem individual
  const renderMessage = useCallback((message: Message) => {
    const isOwn = isOwnMessage(message);
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex flex-col gap-1 mb-3",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <WhatsAppMessage
          message={message}
          isOwnMessage={isOwn}
          onReply={onReply}
          onForward={onForward}
          onDelete={onDelete}
          onStar={onStar}
          onDownload={onDownload}
        />
        
        {/* Indicador de status para mensagens próprias */}
        {isOwn && message.status && (
          <div className="flex items-center gap-2">
            {message.status === 'erro' ? (
              <MessageRetryButton
                onRetry={() => handleRetryMessage(message.id)}
                className="text-xs"
              />
            ) : (
              <MessageStatusIndicator
                status={message.status}
                className="text-xs"
              />
            )}
          </div>
        )}
      </div>
    );
  }, [isOwnMessage, onReply, onForward, onDelete, onStar, onDownload, handleRetryMessage]);

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      {/* Indicador de carregamento no topo */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-2 border-b">
          <SyncLoaderInline />
          <span className="text-sm text-muted-foreground">
            Carregando mensagens antigas...
          </span>
        </div>
      )}

      {/* Lista de mensagens com scroll otimizado */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 scroll-smooth"
        onScroll={handleScroll}
        style={{
          scrollBehavior: 'smooth'
        }}
      >
        {/* Indicador para carregar mais mensagens */}
        {hasMoreMessages && !isLoadingMore && (
          <div className="text-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              className="text-sm"
            >
              Carregar mensagens anteriores
            </Button>
          </div>
        )}

        {/* Lista de mensagens */}
        <div className="space-y-2">
          {visibleMessages.map(renderMessage)}
        </div>

        {/* Marcador para final da lista */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Botão para scroll to bottom */}
      {showScrollToBottom && (
        <Button
          onClick={() => scrollToBottom()}
          size="sm"
          className="absolute bottom-20 right-4 rounded-full shadow-lg z-10"
          variant="secondary"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}