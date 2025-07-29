import { useState } from 'react';
import { Search, Plus, MessageCircle, Users, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Usuario, Conversa } from '@/types/chat-interno';
interface ChatSidebarProps {
  conversas: Conversa[];
  conversaSelecionada: Conversa | null;
  onSelectConversa: (conversa: Conversa) => void;
  onNovaConversa: () => void;
  isMobile?: boolean;
}
export function ChatSidebar({
  conversas,
  conversaSelecionada,
  onSelectConversa,
  onNovaConversa,
  isMobile = false
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const conversasFiltradas = conversas.filter(conversa => conversa.nome.toLowerCase().includes(searchTerm.toLowerCase()) || conversa.ultimaMensagem?.texto.toLowerCase().includes(searchTerm.toLowerCase()));
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'ausente':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };
  return <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          
          <Button size="sm" onClick={onNovaConversa} className="bg-blue-500 hover:bg-blue-600 text-white h-8 w-8 p-0 md:h-9 md:w-auto md:px-3">
            <Plus className="w-4 h-4" />
            {!isMobile && <span className="ml-1 hidden md:inline">Nova</span>}
          </Button>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar conversas..." className="pl-10 h-9 text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Lista de conversas */}
      <ScrollArea className="flex-1">
        <div className="p-1 md:p-2">
          {conversasFiltradas.length > 0 ? <div className="space-y-1">
              {conversasFiltradas.map(conversa => <div key={conversa.id} onClick={() => onSelectConversa(conversa)} className={`p-2 md:p-3 rounded-lg cursor-pointer transition-colors ${conversaSelecionada?.id === conversa.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start space-x-2 md:space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        {conversa.tipo === 'grupo' ? <Users className="w-3 h-3 md:w-5 md:h-5 text-white" /> : <User className="w-3 h-3 md:w-5 md:h-5 text-white" />}
                      </div>
                      
                      {/* Status indicator para conversas individuais */}
                      {conversa.tipo === 'individual' && conversa.participantes[0] && <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white ${getStatusColor(conversa.participantes[0].status)}`} />}
                    </div>

                    {/* Conteúdo da conversa */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs md:text-sm font-medium text-gray-900 truncate break-words">
                          {conversa.nome}
                        </h3>
                        <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                          {conversa.ultimaMensagem && <span className="text-xs text-gray-500">
                              {conversa.ultimaMensagem.tempo}
                            </span>}
                          {conversa.mensagensNaoLidas > 0 && <Badge variant="default" className="bg-blue-500 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                              {conversa.mensagensNaoLidas > 99 ? '99+' : conversa.mensagensNaoLidas}
                            </Badge>}
                        </div>
                      </div>
                      
                      {conversa.ultimaMensagem && <p className="text-xs text-gray-500 truncate mt-1 break-words">
                          {conversa.ultimaMensagem.texto}
                        </p>}
                      
                      {/* Participantes do grupo */}
                      {conversa.tipo === 'grupo' && <p className="text-xs text-gray-400 mt-1">
                          {conversa.participantes.length} participantes
                        </p>}
                    </div>
                  </div>
                </div>)}
            </div> : <div className="text-center py-6 md:py-8 text-gray-500">
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs md:text-sm">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
              </p>
              {!searchTerm && <Button variant="ghost" size="sm" onClick={onNovaConversa} className="mt-2 text-blue-500 hover:text-blue-600 text-xs md:text-sm">
                  Iniciar nova conversa
                </Button>}
            </div>}
        </div>
      </ScrollArea>
    </div>;
}