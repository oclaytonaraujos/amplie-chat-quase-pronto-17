import { useState } from 'react';
import { Send, Paperclip, Smile, Menu, MoreVertical, Users, User, X, Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'ausente';
  cargo: string;
}

interface Conversa {
  id: number;
  tipo: 'individual' | 'grupo';
  nome: string;
  participantes: Usuario[];
  ultimaMensagem?: {
    texto: string;
    autor: string;
    tempo: string;
  };
  mensagensNaoLidas: number;
  avatar?: string;
}

interface Mensagem {
  id: number;
  texto: string;
  autor: Usuario;
  tempo: string;
  tipo: 'texto' | 'imagem' | 'documento' | 'audio';
  anexo?: {
    nome: string;
    url: string;
    tamanho?: string;
  };
}

interface ChatAreaProps {
  conversa: Conversa | null;
  mensagens: Mensagem[];
  onSendMessage: (texto: string) => void;
  onOpenSidebar?: () => void;
  onCloseConversa?: () => void;
  onDeleteConversa?: (conversaId: number) => void;
  onStartCall?: (conversaId: number) => void;
  showMenuButton?: boolean;
}

export function ChatArea({
  conversa,
  mensagens,
  onSendMessage,
  onOpenSidebar,
  onCloseConversa,
  onDeleteConversa,
  onStartCall,
  showMenuButton = false
}: ChatAreaProps) {
  const [novaMensagem, setNovaMensagem] = useState('');

  const handleEnviarMensagem = () => {
    if (!novaMensagem.trim()) return;
    onSendMessage(novaMensagem);
    setNovaMensagem('');
  };

  const handleDeleteConversa = () => {
    if (conversa && onDeleteConversa) {
      onDeleteConversa(conversa.id);
      if (onCloseConversa) {
        onCloseConversa();
      }
    }
  };

  const handleStartCall = () => {
    if (conversa && onStartCall) {
      onStartCall(conversa.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'ausente': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'ausente': return 'Ausente';
      case 'offline': return 'Offline';
      default: return 'Offline';
    }
  };

  if (!conversa) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white p-4">
        <div className="text-center text-gray-500 max-w-sm">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
          </div>
          <h3 className="text-base md:text-lg font-medium mb-2 break-words">Selecione uma conversa</h3>
          <p className="text-xs md:text-sm break-words">
            {showMenuButton ? 'Toque no menu para ver as conversas' : 'Escolha uma conversa existente ou inicie uma nova para começar a conversar'}
          </p>
          {showMenuButton && (
            <Button 
              onClick={onOpenSidebar}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Menu className="w-4 h-4 mr-2" />
              Ver conversas
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header da conversa */}
      <div className="bg-white p-3 md:p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
            {showMenuButton && (
              <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0">
                <Menu className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            )}
            
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                {conversa.tipo === 'grupo' ? (
                  <Users className="w-3 h-3 md:w-5 md:h-5 text-white" />
                ) : (
                  <User className="w-3 h-3 md:w-5 md:h-5 text-white" />
                )}
              </div>
              
              {/* Status indicator para conversas individuais */}
              {conversa.tipo === 'individual' && conversa.participantes[0] && (
                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white ${getStatusColor(conversa.participantes[0].status)}`} />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-base font-medium text-gray-900 truncate break-words">{conversa.nome}</h3>
              {conversa.tipo === 'individual' && conversa.participantes[0] ? (
                <div className="flex items-center space-x-1 md:space-x-2">
                  <Badge variant="outline" className={`text-xs ${
                    conversa.participantes[0].status === 'online' ? 'text-green-700 bg-green-50 border-green-200' :
                    conversa.participantes[0].status === 'ausente' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                    'text-gray-600 bg-gray-50 border-gray-200'
                  }`}>
                    {getStatusText(conversa.participantes[0].status)}
                  </Badge>
                  <span className="text-xs text-gray-500 hidden md:inline break-words">{conversa.participantes[0].cargo}</span>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {conversa.participantes.length} participantes
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Botão de ligação - apenas para conversas individuais */}
            {conversa.tipo === 'individual' && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleStartCall}
                title="Iniciar chamada"
                className="h-8 w-8"
              >
                <Phone className="w-4 h-4 text-green-600" />
              </Button>
            )}

            {/* Menu de opções */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCloseConversa && (
                  <DropdownMenuItem onClick={onCloseConversa}>
                    <X className="w-4 h-4 mr-2" />
                    Sair da conversa
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                      <span className="text-red-500">Apagar conversa</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apagar conversa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja apagar esta conversa? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteConversa}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Apagar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>

            {onCloseConversa && showMenuButton && (
              <Button variant="ghost" size="icon" onClick={onCloseConversa} title="Voltar" className="h-8 w-8 md:hidden">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Área de mensagens com altura fixa e rolagem interna */}
      <div className="flex-grow min-h-0 bg-gray-100">
        <ScrollArea className="h-full p-3 md:p-4">
          <div className="space-y-3 md:space-y-4">
            {mensagens.map((mensagem) => {
              const isOwnMessage = mensagem.autor.nome === 'Você';
              
              return (
                <div key={mensagem.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {/* Avatar e nome (apenas para mensagens de outros) */}
                    {!isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-2 h-2 md:w-3 md:h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-600 break-words">{mensagem.autor.nome}</span>
                      </div>
                    )}
                    
                    {/* Balão da mensagem */}
                    <div className={`px-3 py-2 md:px-4 md:py-2 rounded-lg break-words ${
                      isOwnMessage 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm break-words">{mensagem.texto}</p>
                      <p className={`text-xs mt-1 ${
                        isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {mensagem.tempo}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Input de mensagem */}
      <div className="bg-white p-3 md:p-4 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-end space-x-2">
          <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 flex-shrink-0">
            <Paperclip className="w-4 h-4 text-gray-500" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              placeholder="Digite sua mensagem..."
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEnviarMensagem();
                }
              }}
              className="pr-10 min-h-[40px] text-sm"
              style={{ fontSize: '16px' }} // Evita zoom no iOS
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 hidden md:flex h-8 w-8"
            >
              <Smile className="w-4 h-4 text-gray-500" />
            </Button>
          </div>
          
          <Button
            onClick={handleEnviarMensagem}
            disabled={!novaMensagem.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white h-10 w-10 p-0 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
