
import { SyncLoader } from '@/components/ui/sync-loader';
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Check, 
  CheckCheck, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  FileText, 
  Image as ImageIcon,
  Video,
  MapPin,
  Phone,
  User,
  Calendar,
  Reply,
  Forward,
  Star,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WhatsAppMessageProps {
  message: {
    id: string;
    conteudo: string;
    remetente_tipo: 'cliente' | 'agente' | 'sistema';
    remetente_nome: string;
    created_at: string;
    tipo_mensagem: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'figurinha' | 'botoes' | 'lista';
    metadata?: {
      mediaUrl?: string;
      thumbnailUrl?: string;
      mimeType?: string;
      fileName?: string;
      duration?: number;
      size?: number;
      latitude?: number;
      longitude?: number;
      address?: string;
      contactName?: string;
      contactPhone?: string;
      contactVcard?: string;
      buttons?: Array<{ id: string; text: string }>;
      selectedButtonId?: string;
      listOptions?: {
        title: string;
        sections: Array<{
          title: string;
          rows: Array<{ id: string; title: string; description?: string }>;
        }>;
      };
      selectedListId?: string;
      isForwarded?: boolean;
      quotedMessage?: {
        id: string;
        content: string;
        sender: string;
        type: string;
      };
    };
    status?: 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';
    lida?: boolean;
  };
  isOwnMessage: boolean;
  onReply?: (message: any) => void;
  onForward?: (message: any) => void;
  onDelete?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  onDownload?: (url: string, fileName: string) => void;
}

export function WhatsAppMessage({
  message,
  isOwnMessage,
  onReply,
  onForward,
  onDelete,
  onStar,
  onDownload
}: WhatsAppMessageProps) {
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: false, 
      locale: ptBR 
    });
  };

  const getStatusIcon = (status?: string) => {
    if (!isOwnMessage) return null;
    
    switch (status) {
      case 'enviando':
        return <SyncLoader size="sm" />;
      case 'enviado':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'entregue':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'lido':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'erro':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderTextMessage = () => (
    <div className="space-y-1">
      {message.metadata?.isForwarded && (
        <div className="flex items-center text-xs text-gray-500 mb-1">
          <Forward className="w-3 h-3 mr-1" />
          Encaminhada
        </div>
      )}
      
      {message.metadata?.quotedMessage && (
        <div className="border-l-4 border-blue-500 pl-2 mb-2 bg-gray-50 p-2 rounded">
          <div className="text-xs text-blue-600 font-medium">
            {message.metadata.quotedMessage.sender}
          </div>
          <div className="text-sm text-gray-700 truncate">
            {message.metadata.quotedMessage.content}
          </div>
        </div>
      )}
      
      <p className="text-sm whitespace-pre-wrap break-words">
        {message.conteudo}
      </p>
    </div>
  );

  const renderImageMessage = () => (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden max-w-sm">
        <img 
          src={message.metadata?.mediaUrl} 
          alt="Imagem"
          className="w-full h-auto max-h-64 object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 rounded px-2 py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDownload?.(message.metadata?.mediaUrl!, 'imagem.jpg')}
            className="text-white p-0 h-auto"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {message.conteudo && (
        <p className="text-sm">{message.conteudo}</p>
      )}
    </div>
  );

  const renderAudioMessage = () => (
    <div className="flex items-center space-x-3 bg-gray-100 p-3 rounded-lg max-w-sm">
      <Button variant="ghost" size="sm" className="p-0">
        <Play className="w-5 h-5" />
      </Button>
      <div className="flex-1">
        <div className="h-6 bg-gray-300 rounded-full"></div>
      </div>
      <div className="text-xs text-gray-500">
        {message.metadata?.duration ? `${Math.floor(message.metadata.duration / 60)}:${(message.metadata.duration % 60).toString().padStart(2, '0')}` : '0:00'}
      </div>
    </div>
  );

  const renderVideoMessage = () => (
    <div className="space-y-2">
      <div className="relative rounded-lg overflow-hidden max-w-sm">
        <video 
          src={message.metadata?.mediaUrl}
          poster={message.metadata?.thumbnailUrl}
          className="w-full h-auto max-h-64 object-cover"
          controls
        />
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 rounded px-2 py-1">
          <Video className="w-4 h-4 text-white" />
        </div>
      </div>
      {message.conteudo && (
        <p className="text-sm">{message.conteudo}</p>
      )}
    </div>
  );

  const renderDocumentMessage = () => (
    <div className="flex items-center space-x-3 bg-gray-100 p-3 rounded-lg max-w-sm">
      <FileText className="w-8 h-8 text-blue-500" />
      <div className="flex-1">
        <div className="text-sm font-medium">
          {message.metadata?.fileName || 'Documento'}
        </div>
        <div className="text-xs text-gray-500">
          {message.metadata?.size ? `${(message.metadata.size / 1024).toFixed(1)} KB` : ''}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDownload?.(message.metadata?.mediaUrl!, message.metadata?.fileName || 'documento')}
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderLocationMessage = () => (
    <div className="space-y-2">
      <div className="bg-gray-100 p-3 rounded-lg max-w-sm">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium">Localização</span>
        </div>
        <div className="text-sm text-gray-600">
          {message.metadata?.address || `${message.metadata?.latitude}, ${message.metadata?.longitude}`}
        </div>
        <Button variant="outline" size="sm" className="mt-2">
          Ver no mapa
        </Button>
      </div>
    </div>
  );

  const renderContactMessage = () => (
    <div className="bg-gray-100 p-3 rounded-lg max-w-sm">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <div className="text-sm font-medium">
            {message.metadata?.contactName || 'Contato'}
          </div>
          <div className="text-xs text-gray-500">
            {message.metadata?.contactPhone}
          </div>
        </div>
      </div>
      <div className="mt-2 flex space-x-2">
        <Button variant="outline" size="sm">
          <Phone className="w-4 h-4 mr-1" />
          Ligar
        </Button>
        <Button variant="outline" size="sm">
          Adicionar
        </Button>
      </div>
    </div>
  );

  const renderButtonsMessage = () => (
    <div className="space-y-2">
      <p className="text-sm">{message.conteudo}</p>
      <div className="space-y-1">
        {message.metadata?.buttons?.map((button, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="w-full justify-start"
            disabled={!!message.metadata?.selectedButtonId}
          >
            {button.text}
          </Button>
        ))}
      </div>
      {message.metadata?.selectedButtonId && (
        <Badge variant="secondary" className="mt-2">
          Selecionado: {message.metadata.buttons?.find(b => b.id === message.metadata?.selectedButtonId)?.text}
        </Badge>
      )}
    </div>
  );

  const renderListMessage = () => (
    <div className="space-y-2">
      <p className="text-sm">{message.conteudo}</p>
      <div className="border rounded-lg p-3 max-w-sm">
        <div className="text-sm font-medium mb-2">
          {message.metadata?.listOptions?.title}
        </div>
        <Button variant="outline" size="sm" className="w-full">
          Ver opções
        </Button>
      </div>
      {message.metadata?.selectedListId && (
        <Badge variant="secondary" className="mt-2">
          Selecionado: {message.metadata.selectedListId}
        </Badge>
      )}
    </div>
  );

  const renderMessageContent = () => {
    switch (message.tipo_mensagem) {
      case 'imagem':
        return renderImageMessage();
      case 'audio':
        return renderAudioMessage();
      case 'video':
        return renderVideoMessage();
      case 'documento':
        return renderDocumentMessage();
      case 'localizacao':
        return renderLocationMessage();
      case 'contato':
        return renderContactMessage();
      case 'botoes':
        return renderButtonsMessage();
      case 'lista':
        return renderListMessage();
      default:
        return renderTextMessage();
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage 
          ? 'bg-green-500 text-white' 
          : 'bg-white border border-gray-200 text-gray-900'
      }`}>
        {/* Nome do remetente (apenas para mensagens recebidas) */}
        {!isOwnMessage && (
          <div className="text-xs font-medium text-blue-600 mb-1">
            {message.remetente_nome}
          </div>
        )}

        {/* Conteúdo da mensagem */}
        {renderMessageContent()}

        {/* Footer com hora e status */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${
              isOwnMessage ? 'text-green-100' : 'text-gray-500'
            }`}>
              {formatTime(message.created_at)}
            </span>
            {getStatusIcon(message.status)}
          </div>
          
          {/* Menu de ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`p-0 h-auto ${
                  isOwnMessage ? 'text-green-100 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onReply?.(message)}>
                <Reply className="w-4 h-4 mr-2" />
                Responder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onForward?.(message)}>
                <Forward className="w-4 h-4 mr-2" />
                Encaminhar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStar?.(message.id)}>
                <Star className="w-4 h-4 mr-2" />
                Favoritar
              </DropdownMenuItem>
              {isOwnMessage && (
                <DropdownMenuItem onClick={() => onDelete?.(message.id)}>
                  <span className="text-red-500">Deletar</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
