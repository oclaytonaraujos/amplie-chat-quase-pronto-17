import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, User, Tag } from 'lucide-react';
import { useAtendimentoReal } from '@/hooks/useAtendimentoReal';

interface Conversa {
  id: string;
  agente_id: string | null;
  canal: string | null;
  contato_id: string | null;
  created_at: string | null;
  empresa_id: string | null;
  prioridade: string | null;
  setor: string | null;
  status: string | null;
  tags: string[] | null;
  updated_at: string | null;
  contatos?: {
    id: string;
    nome: string;
    telefone: string | null;
    email: string | null;
  } | null;
  profiles?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

interface AtendimentosListRealProps {
  onSelectAtendimento: (conversa: Conversa) => void;
  selectedAtendimento?: Conversa | null;
  isMobile?: boolean;
}

export function AtendimentosListReal({ 
  onSelectAtendimento, 
  selectedAtendimento,
  isMobile = false 
}: AtendimentosListRealProps) {
  const { conversas, loading } = useAtendimentoReal();

  // Filtrar apenas conversas não finalizadas
  const conversasAtivas = conversas.filter(conversa => conversa.status !== 'finalizado');

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800';
      case 'em-atendimento':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'finalizado':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'ativo':
        return 'Novo';
      case 'em-atendimento':
        return 'Em Atendimento';
      case 'pendente':
        return 'Aguardando Cliente';
      case 'finalizado':
        return 'Finalizado';
      default:
        return 'Desconhecido';
    }
  };

  const getPriorityColor = (prioridade: string | null) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baixa':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatarTempo = (dataString: string | null) => {
    if (!dataString) return 'Agora';
    
    const agora = new Date();
    const data = new Date(dataString);
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (conversasAtivas.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">Nenhuma conversa encontrada</h3>
          <p className="text-sm text-gray-500">As novas conversas aparecerão aqui</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversasAtivas.map((conversa) => (
        <div
          key={conversa.id}
          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md m-2 ${
            selectedAtendimento?.id === conversa.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => onSelectAtendimento(conversa)}
        >
          {/* Header com nome do cliente e status */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <h3 className="font-medium text-gray-900 truncate">
                  {conversa.contatos?.nome || 'Cliente Desconhecido'}
                </h3>
              </div>
              
              {conversa.contatos?.telefone && (
                <p className="text-sm text-gray-500 truncate">
                  {conversa.contatos.telefone}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end space-y-1">
              <Badge className={getStatusColor(conversa.status)}>
                {getStatusText(conversa.status)}
              </Badge>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatarTempo(conversa.updated_at)}
              </div>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {conversa.canal && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {conversa.canal.toUpperCase()}
                </span>
              )}
              
              {conversa.prioridade && (
                <Badge variant="outline" className={getPriorityColor(conversa.prioridade)}>
                  {conversa.prioridade.charAt(0).toUpperCase() + conversa.prioridade.slice(1)}
                </Badge>
              )}
            </div>

            {conversa.profiles && (
              <div className="text-xs text-gray-500">
                Agente: {conversa.profiles.nome}
              </div>
            )}
          </div>

          {/* Tags */}
          {conversa.tags && conversa.tags.length > 0 && (
            <div className="flex items-center mt-2 space-x-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {conversa.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
                {conversa.tags.length > 3 && (
                  <span className="text-xs text-gray-500">+{conversa.tags.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}