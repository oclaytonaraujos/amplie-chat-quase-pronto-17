
import { useState } from 'react';
import { Search, ArrowLeft, User, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Contato {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  status: 'online' | 'offline';
  ultimoContato?: string;
}

interface ContactsListProps {
  contatos: Contato[];
  onSelectContact: (contato: Contato) => void;
  onBack: () => void;
  onReturnToList?: () => void;
  onAdicionarContato?: (contato: any) => void;
  onNovoNumero?: () => void;
}

export function ContactsList({ contatos, onSelectContact, onBack, onReturnToList, onAdicionarContato, onNovoNumero }: ContactsListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const contatosFiltrados = contatos.filter(contato =>
    contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contato.telefone.includes(searchTerm) ||
    (contato.email && contato.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full bg-white rounded-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">Nova Conversa</h2>
        </div>
        
        {/* Barra de pesquisa */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar contatos..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Botão para inserir novo número */}
          <Button 
            onClick={onNovoNumero}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            size="sm"
          >
            <Phone className="w-4 h-4 mr-2" />
            Inserir novo número
          </Button>
        </div>
      </div>

      {/* Lista de contatos */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {contatosFiltrados.length > 0 ? (
            <div className="space-y-1">
              {contatosFiltrados.map((contato) => (
                <div
                  key={contato.id}
                  onClick={() => onSelectContact(contato)}
                  className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        contato.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>

                    {/* Informações do contato */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {contato.nome}
                      </h3>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{contato.telefone}</span>
                      </div>
                      {contato.email && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {contato.email}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${
                          contato.status === 'online' 
                            ? 'text-green-700 bg-green-50 border-green-200' 
                            : 'text-gray-600 bg-gray-50 border-gray-200'
                        }`}>
                          {contato.status === 'online' ? 'Online' : 'Offline'}
                        </Badge>
                        {contato.ultimoContato && (
                          <span className="text-xs text-gray-400">
                            Último contato: {contato.ultimoContato}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
