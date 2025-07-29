import { User, Phone, Clock, Tag, ArrowRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TransferenciaInfo {
  de: string;
  motivo: string;
  dataTransferencia: string;
}

interface ClienteInfoProps {
  cliente: {
    id: string; // Changed from number to string
    nome: string;
    telefone: string;
    email?: string;
    dataCadastro?: string;
    tags?: string[];
    historico?: {
      id: string; // Changed from number to string
      data: string;
      assunto: string;
      status: string;
    }[];
  };
  transferencia?: TransferenciaInfo;
}

export function ClienteInfo({ cliente, transferencia }: ClienteInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Alerta de transferência no topo */}
      {transferencia && (
        <div className="p-3 border-b border-gray-200">
          <Alert className="border-orange-200 bg-orange-50">
            <ArrowRight className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Transferido</strong> por {transferencia.de}
                  <div className="text-sm mt-1">
                    <strong>Motivo:</strong> {transferencia.motivo}
                  </div>
                </div>
                <div className="flex items-center text-xs text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  {transferencia.dataTransferencia}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header com info do cliente */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          
          <div>
            <h3 className="font-medium text-lg text-gray-900">{cliente.nome}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Phone className="w-3.5 h-3.5" />
              <span>{cliente.telefone}</span>
            </div>
            
            {cliente.email && (
              <p className="text-sm text-gray-500 mt-1">{cliente.email}</p>
            )}
          </div>
        </div>
        
        {cliente.dataCadastro && (
          <div className="flex items-center mt-3 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 mr-2" />
            Cliente desde {cliente.dataCadastro}
          </div>
        )}
        
        {cliente.tags && cliente.tags.length > 0 && (
          <div className="flex items-center mt-3 space-x-2">
            <Tag className="w-3.5 h-3.5 text-gray-500" />
            <div className="flex flex-wrap gap-1">
              {cliente.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Histórico de Atendimentos */}
      {cliente.historico && cliente.historico.length > 0 && (
        <div>
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">Histórico de Atendimentos</h4>
          </div>
          
          <ScrollArea className={transferencia ? "h-[220px]" : "h-[280px]"}>
            <div className="divide-y divide-gray-100">
              {cliente.historico.map((item) => (
                <div key={item.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{item.assunto}</span>
                    <Badge 
                      variant="outline" 
                      className={
                        item.status === 'Resolvido' ? 'bg-green-50 text-green-700 border-green-100' :
                        item.status === 'Pendente' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        'bg-blue-50 text-blue-700 border-blue-100'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.data}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
