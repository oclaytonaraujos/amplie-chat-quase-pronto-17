import React, { useState, useEffect } from 'react';
import { User, Clock, Shield, MessageSquare, AlertCircle, Phone, Mail, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AccessRequestDialog } from './AccessRequestDialog';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
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

interface EnhancedKanbanBoardProps {
  onSelectAtendimento: (conversa: Conversa) => void;
  usuarioLogado?: string;
  isAdmin?: boolean;
}

export function EnhancedKanbanBoard({ 
  onSelectAtendimento, 
  usuarioLogado = 'Ana Silva',
  isAdmin = false
}: EnhancedKanbanBoardProps) {
  const [selectedAtendimento, setSelectedAtendimento] = useState<Conversa | null>(null);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [filterBy, setFilterBy] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const { toast } = useToast();
  const { conversas, loading } = useAtendimentoReal();

  const refreshConversas = () => {
    // Função para recarregar conversas
    window.location.reload();
  };

  // Setup real-time updates
  useRealTimeUpdates({
    table: 'conversas',
    onInsert: () => {
      setLastUpdate(new Date());
      refreshConversas();
    },
    onUpdate: () => {
      setLastUpdate(new Date());
      refreshConversas();
    },
    onDelete: () => {
      setLastUpdate(new Date());
      refreshConversas();
    }
  });

  // Filtrar conversas
  const filteredConversas = conversas.filter(conversa => {
    // Filtro por agente
    if (filterBy === 'my' && conversa.profiles?.nome !== usuarioLogado) return false;
    if (filterBy === 'unassigned' && conversa.agente_id) return false;
    
    // Filtro por prioridade
    if (priorityFilter !== 'all' && conversa.prioridade !== priorityFilter) return false;
    
    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesName = conversa.contatos?.nome?.toLowerCase().includes(searchLower);
      const matchesPhone = conversa.contatos?.telefone?.includes(searchTerm);
      const matchesAgent = conversa.profiles?.nome?.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesPhone && !matchesAgent) return false;
    }
    
    return true;
  });

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
      conversas: filteredConversas.filter(c => mapStatus(c.status || '') === 'novos')
    },
    { 
      id: 'em-atendimento', 
      titulo: 'Em Atendimento', 
      cor: 'bg-yellow-500',
      acessoLivre: false,
      conversas: filteredConversas.filter(c => mapStatus(c.status || '') === 'em-atendimento')
    },
    { 
      id: 'aguardando-cliente', 
      titulo: 'Aguardando Cliente', 
      cor: 'bg-orange-500',
      acessoLivre: false,
      conversas: filteredConversas.filter(c => mapStatus(c.status || '') === 'aguardando-cliente')
    },
    { 
      id: 'finalizados', 
      titulo: 'Finalizados', 
      cor: 'bg-green-500',
      acessoLivre: true,
      conversas: filteredConversas.filter(c => mapStatus(c.status || '') === 'finalizados')
    }
  ];

  const handleCardClick = (conversa: Conversa, coluna: any) => {
    // Admin tem acesso total
    if (isAdmin) {
      onSelectAtendimento(conversa);
      return;
    }

    // Colunas de acesso livre
    if (coluna.acessoLivre) {
      onSelectAtendimento(conversa);
      return;
    }

    // Verificar se é o responsável
    if (conversa.profiles?.nome === usuarioLogado) {
      onSelectAtendimento(conversa);
      return;
    }

    // Solicitar acesso
    setSelectedAtendimento(conversa);
    setShowAccessRequest(true);
  };

  const handleAccessRequest = (motivo: string) => {
    if (selectedAtendimento) {
      toast({
        title: "Solicitação enviada",
        description: `Solicitação de acesso enviada para ${selectedAtendimento.profiles?.nome}`,
      });
    }
    setShowAccessRequest(false);
    setSelectedAtendimento(null);
  };

  const getPriorityColor = (prioridade: string | null) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-500 text-white';
      case 'media':
        return 'bg-yellow-500 text-white';
      case 'baixa':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Agora';
    
    const agora = new Date();
    const data = new Date(dateString);
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
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando conversas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por agente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="my">Meus atendimentos</SelectItem>
              <SelectItem value="unassigned">Não atribuídos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Buscar cliente, telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={refreshConversas}
            className="flex items-center space-x-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Última atualização: {formatTime(lastUpdate.toISOString())}
        </span>
        <span>
          {filteredConversas.length} conversas encontradas
        </span>
      </div>

      {/* Kanban Board */}
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
                {coluna.conversas.length}
              </Badge>
            </div>

            {/* Cards da Coluna */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {coluna.conversas.map(conversa => (
                <div
                  key={conversa.id}
                  className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer ${
                    coluna.acessoLivre || isAdmin || conversa.profiles?.nome === usuarioLogado
                      ? 'hover:shadow-md hover:border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleCardClick(conversa, coluna)}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {conversa.contatos?.nome || 'Cliente sem nome'}
                        </p>
                        <div className="flex items-center space-x-2">
                          {conversa.contatos?.telefone && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {conversa.contatos.telefone}
                            </span>
                          )}
                          {conversa.contatos?.email && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {conversa.contatos.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Indicadores */}
                    <div className="flex flex-col items-end space-y-1">
                      {!coluna.acessoLivre && !isAdmin && conversa.profiles?.nome !== usuarioLogado && (
                        <Shield className="w-4 h-4 text-orange-500" />
                      )}
                      {conversa.prioridade && (
                        <Badge className={`text-xs px-1 py-0 ${getPriorityColor(conversa.prioridade)}`}>
                          {conversa.prioridade}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Informações do Atendimento */}
                  <div className="space-y-2">
                    {/* Canal */}
                    {conversa.canal && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <MessageSquare className="w-3 h-3" />
                        <span className="font-medium">{conversa.canal.toUpperCase()}</span>
                      </div>
                    )}
                    
                    {/* Responsável */}
                    {conversa.profiles?.nome && (
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{conversa.profiles.nome}</span>
                      </div>
                    )}
                    
                    {/* Tempo */}
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>Atualizado há {formatTime(conversa.updated_at)}</span>
                    </div>

                    {/* Setor e Tags */}
                    <div className="flex items-center justify-between">
                      {conversa.setor && (
                        <Badge variant="outline" className="text-xs">
                          {conversa.setor}
                        </Badge>
                      )}
                      
                      {/* Tags */}
                      <div className="flex gap-1">
                        {conversa.tags?.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {(conversa.tags?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            +{(conversa.tags?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {coluna.conversas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Nenhuma conversa</p>
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
        atendimento={selectedAtendimento ? {
          id: selectedAtendimento.id,
          cliente: selectedAtendimento.contatos?.nome || 'Cliente',
          telefone: selectedAtendimento.contatos?.telefone || '',
          ultimaMensagem: '',
          tempo: '',
          setor: selectedAtendimento.setor || '',
          agente: selectedAtendimento.profiles?.nome || '',
          tags: selectedAtendimento.tags || [],
          status: (selectedAtendimento.status as any) || 'ativo'
        } : null}
        onConfirm={handleAccessRequest}
      />
    </div>
  );
}