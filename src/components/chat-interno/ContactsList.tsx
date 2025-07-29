
import { useState } from 'react';
import { Search, ArrowLeft, User, Users, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'ausente';
  cargo: string;
}

interface ContactsListProps {
  usuarios: Usuario[];
  onSelectContact: (usuario: Usuario) => void;
  onBack: () => void;
}

export function ContactsList({ usuarios, onSelectContact, onBack }: ContactsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'contatos' | 'grupos'>('contatos');

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-3 md:mb-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <h2 className="text-base md:text-lg font-semibold text-gray-900 break-words">Nova Conversa</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-3 md:mb-4">
          <button
            onClick={() => setActiveTab('contatos')}
            className={`flex-1 px-2 py-2 md:px-3 md:py-2 text-xs md:text-sm font-medium rounded-md transition-colors break-words ${
              activeTab === 'contatos'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
            Contatos
          </button>
          <button
            onClick={() => setActiveTab('grupos')}
            className={`flex-1 px-2 py-2 md:px-3 md:py-2 text-xs md:text-sm font-medium rounded-md transition-colors break-words ${
              activeTab === 'grupos'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
            Grupos
          </button>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={activeTab === 'contatos' ? 'Buscar contatos...' : 'Buscar grupos...'}
            className="pl-10 h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ fontSize: '16px' }} // Evita zoom no iOS
          />
        </div>
      </div>

      {/* Conteúdo */}
      <ScrollArea className="flex-1">
        <div className="p-1 md:p-2">
          {activeTab === 'contatos' ? (
            <>
              {usuariosFiltrados.length > 0 ? (
                <div className="space-y-1">
                  {usuariosFiltrados.map((usuario) => (
                    <div
                      key={usuario.id}
                      onClick={() => onSelectContact(usuario)}
                      className="p-2 md:p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-2 md:space-x-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 md:w-5 md:h-5 text-white" />
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 md:w-3 md:h-3 rounded-full border-2 border-white ${getStatusColor(usuario.status)}`} />
                        </div>

                        {/* Informações do usuário */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs md:text-sm font-medium text-gray-900 truncate break-words">
                            {usuario.nome}
                          </h3>
                          <p className="text-xs text-gray-500 truncate break-words">
                            {usuario.email}
                          </p>
                          <div className="flex items-center space-x-1 md:space-x-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${
                              usuario.status === 'online' ? 'text-green-700 bg-green-50 border-green-200' :
                              usuario.status === 'ausente' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                              'text-gray-600 bg-gray-50 border-gray-200'
                            }`}>
                              {getStatusText(usuario.status)}
                            </Badge>
                            <span className="text-xs text-gray-400 truncate break-words">{usuario.cargo}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-gray-500">
                  <User className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs md:text-sm break-words">
                    {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                  </p>
                </div>
              )}
            </>
          ) : (
            // Tab de grupos
            <div className="space-y-3">
              {/* Botão para criar novo grupo */}
              <div
                className="p-2 md:p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-2 border-dashed border-gray-200"
              >
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3 h-3 md:w-5 md:h-5 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs md:text-sm font-medium text-gray-700 break-words">Criar Novo Grupo</h3>
                    <p className="text-xs text-gray-500 break-words">Adicione colegas ao grupo</p>
                  </div>
                </div>
              </div>

              {/* Grupos existentes (mockados) */}
              <div className="p-2 md:p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-3 h-3 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs md:text-sm font-medium text-gray-900 break-words">Equipe Vendas</h3>
                    <p className="text-xs text-gray-500">3 participantes</p>
                  </div>
                </div>
              </div>

              <div className="p-2 md:p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-3 h-3 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs md:text-sm font-medium text-gray-900 break-words">Suporte Técnico</h3>
                    <p className="text-xs text-gray-500">5 participantes</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
