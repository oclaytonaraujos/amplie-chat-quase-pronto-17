
import { Clock, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AtendimentoCardProps {
  id: string; // Changed from number to string
  cliente: string;
  telefone: string;
  ultimaMensagem: string;
  tempo: string;
  setor: string;
  agente?: string;
  tags?: string[];
  avatar?: string;
  onClick: () => void;
}

export function AtendimentoCard({ 
  cliente, 
  telefone, 
  ultimaMensagem, 
  tempo, 
  setor, 
  agente, 
  tags = [], 
  avatar,
  onClick 
}: AtendimentoCardProps) {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt={cliente} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{cliente}</p>
            <p className="text-xs text-gray-500">{telefone}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{tempo}</span>
        </div>
      </div>

      {/* Última Mensagem */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ultimaMensagem}</p>

      {/* Footer do Card */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs px-2 py-1">
            {setor}
          </Badge>
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-1">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {agente && (
            <span className="text-xs text-gray-500">{agente}</span>
          )}
          <Button variant="ghost" size="sm" className="p-1">
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
