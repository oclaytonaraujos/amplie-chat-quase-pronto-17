
import { useState } from 'react';
import { User, Clock, Shield, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AccessRequestDialog } from './AccessRequestDialog';
import { Atendimento } from '@/types/atendimento';

interface KanbanBoardProps {
  atendimentos: Atendimento[];
  onSelectAtendimento: (atendimento: Atendimento) => void;
  usuarioLogado?: string;
  isAdmin?: boolean;
  departamentoSelecionado?: string;
}

export function KanbanBoard({ 
  atendimentos, 
  onSelectAtendimento, 
  usuarioLogado = 'Ana Silva',
  isAdmin = false,
  departamentoSelecionado
}: KanbanBoardProps) {
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const { toast } = useToast();

  // Filtrar atendimentos por departamento se selecionado
  const atendimentosFiltrados = departamentoSelecionado 
    ? atendimentos.filter(a => a.setor === departamentoSelecionado)
    : atendimentos;

  // Mapear status do Supabase para status do Kanban
  const mapStatus = (status: string) => {
    switch (status) {
      case 'ativo': return 'novos';
      case 'em-atendimento': return 'em-atendimento';
      case 'pendente': return 'aguardando-cliente';
      case 'finalizado': return 'finalizados';
      default: return 'novos';
    }
  };

  const colunas = [
    { 
      id: 'novos', 
      titulo: 'Novos', 
      cor: 'bg-blue-500',
      acessoLivre: true,
      atendimentos: atendimentosFiltrados.filter(a => mapStatus(a.status) === 'novos')
    },
    { 
      id: 'em-atendimento', 
      titulo: 'Em Atendimento', 
      cor: 'bg-yellow-500',
      acessoLivre: false,
      atendimentos: atendimentosFiltrados.filter(a => mapStatus(a.status) === 'em-atendimento')
    },
    { 
      id: 'aguardando-cliente', 
      titulo: 'Aguardando Cliente', 
      cor: 'bg-orange-500',
      acessoLivre: false,
      atendimentos: atendimentosFiltrados.filter(a => mapStatus(a.status) === 'aguardando-cliente')
    },
    { 
      id: 'finalizados', 
      titulo: 'Finalizados', 
      cor: 'bg-green-500',
      acessoLivre: true,
      atendimentos: atendimentosFiltrados.filter(a => mapStatus(a.status) === 'finalizados')
    }
  ];

  const handleCardClick = (atendimento: Atendimento, coluna: any) => {
    // Admin tem acesso total
    if (isAdmin) {
      onSelectAtendimento(atendimento);
      return;
    }

    // Colunas de acesso livre
    if (coluna.acessoLivre) {
      onSelectAtendimento(atendimento);
      return;
    }

    // Verificar se é o responsável
    if (atendimento.agente === usuarioLogado) {
      onSelectAtendimento(atendimento);
      return;
    }

    // Solicitar acesso
    setSelectedAtendimento(atendimento);
    setShowAccessRequest(true);
  };

  const handleAccessRequest = (motivo: string) => {
    if (selectedAtendimento) {
      toast({
        title: "Solicitação enviada",
        description: `Solicitação de acesso enviada para ${selectedAtendimento.agente}`,
      });
      
      // Aqui seria implementada a lógica real de envio da solicitação
      console.log('Solicitação de acesso:', {
        atendimento: selectedAtendimento.id,
        solicitante: usuarioLogado,
        responsavel: selectedAtendimento.agente,
        motivo
      });
    }
    setShowAccessRequest(false);
    setSelectedAtendimento(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {colunas.map(coluna => (
          <div key={coluna.id} className="bg-gray-50 rounded-xl p-4 min-h-[500px]">
            {/* Header da Coluna */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${coluna.cor}`} />
                <h3 className="font-semibold text-gray-900">{coluna.titulo}</h3>
                {!coluna.acessoLivre && !isAdmin && (
                  <Shield className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <Badge variant="secondary" className="bg-white">
                {coluna.atendimentos.length}
              </Badge>
            </div>

            {/* Cards da Coluna */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {coluna.atendimentos.map(atendimento => (
                <div
                  key={atendimento.id}
                  className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer ${
                    coluna.acessoLivre || isAdmin || atendimento.agente === usuarioLogado
                      ? 'hover:shadow-md'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleCardClick(atendimento, coluna)}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{atendimento.cliente}</p>
                        <p className="text-xs text-gray-500">{atendimento.telefone}</p>
                      </div>
                    </div>
                    
                    {/* Indicador de acesso restrito */}
                    {!coluna.acessoLivre && !isAdmin && atendimento.agente !== usuarioLogado && (
                      <Shield className="w-4 h-4 text-orange-500" />
                    )}
                  </div>

                  {/* Última Mensagem */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{atendimento.ultimaMensagem}</p>

                  {/* Informações do Atendimento */}
                  <div className="space-y-2">
                    {/* Responsável */}
                    {atendimento.agente && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{atendimento.agente}</span>
                      </div>
                    )}
                    
                    {/* Tempo em aberto */}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Aberto há {atendimento.tempo}</span>
                    </div>

                    {/* Departamento */}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {atendimento.setor}
                      </Badge>
                      
                      {/* Tags */}
                      <div className="flex gap-1">
                        {atendimento.tags?.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {coluna.atendimentos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhum atendimento</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog de Solicitação de Acesso */}
      <AccessRequestDialog
        open={showAccessRequest}
        onOpenChange={setShowAccessRequest}
        atendimento={selectedAtendimento}
        onConfirm={handleAccessRequest}
      />
    </div>
  );
}
