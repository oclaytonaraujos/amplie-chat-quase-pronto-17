import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Play, 
  Clock, 
  CheckCircle, 
  UserX,
  ArrowRight
} from 'lucide-react';

interface StatusAtendimentoActionsProps {
  statusAtual: string;
  onMudarStatus: (novoStatus: string, resumo?: string) => void;
  onFinalizar: () => void;
  onTransferir: () => void;
  onSairConversa: () => void;
}

export function StatusAtendimentoActions({ 
  statusAtual, 
  onMudarStatus, 
  onFinalizar,
  onTransferir,
  onSairConversa
}: StatusAtendimentoActionsProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ativo':
        return { label: 'Novo', color: 'bg-green-500', icon: Play };
      case 'em-atendimento':
        return { label: 'Em Atendimento', color: 'bg-blue-500', icon: Play };
      case 'pendente':
        return { label: 'Aguardando Cliente', color: 'bg-orange-500', icon: Clock };
      case 'finalizado':
        return { label: 'Finalizado', color: 'bg-gray-500', icon: CheckCircle };
      default:
        return { label: 'Novo', color: 'bg-green-500', icon: Play };
    }
  };

  const statusInfo = getStatusInfo(statusAtual);
  const StatusIcon = statusInfo.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
          <StatusIcon className="w-4 h-4" />
          {statusInfo.label}
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {statusAtual !== 'em-atendimento' && (
          <DropdownMenuItem onClick={() => onMudarStatus('em-atendimento')}>
            <Play className="w-4 h-4 mr-2 text-yellow-600" />
            Iniciar Atendimento
          </DropdownMenuItem>
        )}
        
        {statusAtual === 'em-atendimento' && (
          <DropdownMenuItem onClick={() => onMudarStatus('pendente')}>
            <Clock className="w-4 h-4 mr-2 text-orange-600" />
            Aguardando Cliente
          </DropdownMenuItem>
        )}
        
        {statusAtual === 'pendente' && (
          <DropdownMenuItem onClick={() => onMudarStatus('em-atendimento')}>
            <Play className="w-4 h-4 mr-2 text-yellow-600" />
            Retomar Atendimento
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onTransferir}>
          <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
          Transferir
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onSairConversa}>
          <UserX className="w-4 h-4 mr-2 text-gray-600" />
          Sair da Conversa
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onFinalizar}
          className="text-green-600 focus:text-green-600"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Finalizar Atendimento
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}