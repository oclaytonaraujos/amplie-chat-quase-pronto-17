
import { Bot, Edit, Trash2, Power, PowerOff, MessageCircle, ArrowRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatbotFlow } from '@/hooks/useChatbotFlows';
import { format } from 'date-fns';

interface ChatbotTableProps {
  chatbots: ChatbotFlow[];
  onEdit: (chatbot: ChatbotFlow) => void;
  onDuplicate: (chatbotId: string) => void;
  onToggleStatus: (chatbotId: string, currentStatus: string) => void;
  onDelete: (chatbotId: string) => void;
}

export function ChatbotTable({ chatbots, onEdit, onDuplicate, onToggleStatus, onDelete }: ChatbotTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-amplie overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Fluxo</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Última Edição</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Padrão</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chatbots.map((chatbot) => (
              <tr key={chatbot.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{chatbot.nome}</p>
                      <p className="text-sm text-gray-500">
                        {chatbot.mensagem_inicial.length > 50 
                          ? `${chatbot.mensagem_inicial.substring(0, 50)}...` 
                          : chatbot.mensagem_inicial}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={chatbot.status === 'ativo' ? 'default' : 'secondary'}
                    className={chatbot.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {chatbot.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-900">
                    {chatbot.updated_at ? format(new Date(chatbot.updated_at), 'dd/MM/yyyy HH:mm') : '-'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {chatbot.is_default && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Padrão
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onToggleStatus(chatbot.id!, chatbot.status)}
                      className={chatbot.status === 'ativo' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {chatbot.status === 'ativo' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(chatbot)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(chatbot.id!)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => onDelete(chatbot.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
