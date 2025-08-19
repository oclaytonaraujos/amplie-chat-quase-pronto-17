import React, { memo, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, Tag } from 'lucide-react';
import { VirtualScroll } from '@/components/ui/virtual-scroll';
import { useAtendimentoReal } from '@/hooks/useAtendimentoReal';
import { useIsMobile } from '@/hooks/use-mobile';
import { SyncLoaderSection } from '@/components/ui/sync-loader';

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

interface OptimizedAtendimentosListProps {
  onSelectAtendimento: (conversa: Conversa) => void;
  selectedAtendimento?: Conversa | null;
  isMobile?: boolean;
}

// Componente de item otimizado com React.memo
const ConversaItem = memo(({ 
  conversa, 
  isSelected, 
  onSelect,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  formatarTempo
}: {
  conversa: Conversa;
  isSelected: boolean;
  onSelect: (conversa: Conversa) => void;
  getStatusColor: (status: string | null) => string;
  getStatusText: (status: string | null) => string;
  getPriorityColor: (prioridade: string | null) => string;
  formatarTempo: (dataString: string | null) => string;
}) => {
  const handleClick = useCallback(() => {
    onSelect(conversa);
  }, [conversa, onSelect]);

  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-border/80'
      }`}
      onClick={handleClick}
    >
      {/* Header com nome do cliente e status */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-medium text-foreground truncate">
              {conversa.contatos?.nome || 'Cliente Desconhecido'}
            </h3>
          </div>
          
          {conversa.contatos?.telefone && (
            <p className="text-sm text-muted-foreground truncate">
              {conversa.contatos.telefone}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <Badge className={getStatusColor(conversa.status)}>
            {getStatusText(conversa.status)}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {formatarTempo(conversa.updated_at)}
          </div>
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {conversa.canal && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
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
          <div className="text-xs text-muted-foreground">
            Agente: {conversa.profiles.nome}
          </div>
        )}
      </div>

      {/* Tags */}
      {conversa.tags && conversa.tags.length > 0 && (
        <div className="flex items-center mt-2 space-x-1">
          <Tag className="w-3 h-3 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {conversa.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {conversa.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{conversa.tags.length - 3}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

ConversaItem.displayName = 'ConversaItem';

// Loading skeleton otimizado
const LoadingSkeleton = memo(() => (
  <SyncLoaderSection text="Carregando conversas..." />
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Empty state otimizado
const EmptyState = memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-1">Nenhuma conversa encontrada</h3>
      <p className="text-sm text-muted-foreground">As novas conversas aparecerão aqui</p>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

export const OptimizedAtendimentosList = memo(({ 
  onSelectAtendimento, 
  selectedAtendimento,
  isMobile = false 
}: OptimizedAtendimentosListProps) => {
  const { conversas, loading } = useAtendimentoReal();
  const isMobileDevice = useIsMobile();
  
  // Performance optimizations based on device
  const optimizations = {
    pageSize: isMobileDevice ? 20 : 50,
    shouldLazyLoad: isMobileDevice
  };

  // Memoizar conversas ativas para evitar re-computação desnecessária
  const conversasAtivas = useMemo(() => 
    conversas.filter(conversa => conversa.status !== 'finalizado'),
    [conversas]
  );

  // Memoizar funções utilitárias para evitar re-renders
  const getStatusColor = useCallback((status: string | null) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'em-atendimento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'finalizado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  }, []);

  const getStatusText = useCallback((status: string | null) => {
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
  }, []);

  const getPriorityColor = useCallback((prioridade: string | null) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'baixa':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  }, []);

  const formatarTempo = useCallback((dataString: string | null) => {
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
  }, []);

  // Callback otimizado para seleção
  const handleSelectAtendimento = useCallback((conversa: Conversa) => {
    onSelectAtendimento(conversa);
  }, [onSelectAtendimento]);

  // Render function para virtual scroll
  const renderItem = useCallback((conversa: Conversa, index: number) => (
    <ConversaItem
      key={conversa.id}
      conversa={conversa}
      isSelected={selectedAtendimento?.id === conversa.id}
      onSelect={handleSelectAtendimento}
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
      getPriorityColor={getPriorityColor}
      formatarTempo={formatarTempo}
    />
  ), [selectedAtendimento?.id, handleSelectAtendimento, getStatusColor, getStatusText, getPriorityColor, formatarTempo]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (conversasAtivas.length === 0) {
    return <EmptyState />;
  }

  // Para poucos itens (< limite), renderizar normalmente
  if (conversasAtivas.length < optimizations.pageSize) {
    return (
      <div className="h-full overflow-y-auto space-y-2 p-2">
        {conversasAtivas.map((conversa) => renderItem(conversa, 0))}
      </div>
    );
  }

  // Para muitos itens, usar virtual scroll
  return (
    <div className="h-full">
      <VirtualScroll
        items={conversasAtivas}
        itemHeight={isMobile ? 120 : 140}
        containerHeight={window.innerHeight - 200} // Ajustar baseado no layout
        renderItem={renderItem}
        className="p-2"
        overscan={optimizations.shouldLazyLoad ? 3 : 5}
      />
    </div>
  );
});

OptimizedAtendimentosList.displayName = 'OptimizedAtendimentosList';