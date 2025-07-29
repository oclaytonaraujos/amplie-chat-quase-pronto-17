
import { useState } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { KanbanFilters } from '@/components/kanban/KanbanFilters';
import { useAtendimentoReal } from '@/hooks/useAtendimentoReal';
import { Loader2 } from 'lucide-react';
import { Atendimento } from '@/types/atendimento';

export default function Kanban() {
  const { conversas, loading } = useAtendimentoReal();
  const [departamentoSelecionado, setDepartamentoSelecionado] = useState('todos');
  
  // Converter conversas do Supabase para o formato do Kanban
  const atendimentos: Atendimento[] = conversas.map(conversa => ({
    id: conversa.id,
    cliente: conversa.contatos?.nome || 'Cliente sem nome',
    telefone: conversa.contatos?.telefone || '',
    ultimaMensagem: 'Última mensagem...',
    tempo: new Date(conversa.updated_at || '').toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    setor: conversa.setor || 'Geral',
    agente: conversa.profiles?.nome,
    tags: conversa.tags || [],
    status: conversa.status as 'ativo' | 'em-atendimento' | 'pendente' | 'finalizado'
  }));
  
  // Extrair departamentos únicos dos dados reais
  const departamentos = Array.from(new Set(atendimentos.map(a => a.setor).filter(Boolean)));
  
  // Filtrar atendimentos
  const atendimentosFiltrados = departamentoSelecionado === 'todos' 
    ? atendimentos 
    : atendimentos.filter(a => a.setor === departamentoSelecionado);

  const { atualizarStatusConversa } = useAtendimentoReal();

  const handleSelectAtendimento = async (atendimento: Atendimento) => {
    console.log('🎯 Atendimento selecionado no Kanban:', {
      id: atendimento.id,
      cliente: atendimento.cliente,
      status: atendimento.status
    });
    
    // Se o atendimento está com status "ativo" (novo), atualizar para "em-atendimento"
    if (atendimento.status === 'ativo') {
      console.log('📝 Atualizando status para "em-atendimento"');
      const resultado = await atualizarStatusConversa(atendimento.id, 'em-atendimento');
      console.log('✅ Status atualizado:', resultado);
    }
    
    // Implementar navegação para página de atendimento se necessário
    // navigate('/atendimento', { state: { selectedAtendimento: atendimento } });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando atendimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <KanbanFilters
        departamentoSelecionado={departamentoSelecionado}
        onDepartamentoChange={setDepartamentoSelecionado}
        departamentos={departamentos}
        totalAtendimentos={atendimentosFiltrados.length}
      />

      {/* Kanban Board */}
      <KanbanBoard
        atendimentos={atendimentosFiltrados}
        onSelectAtendimento={handleSelectAtendimento}
        usuarioLogado="Ana Silva"
        isAdmin={false}
        departamentoSelecionado={departamentoSelecionado === 'todos' ? undefined : departamentoSelecionado}
      />
    </div>
  );
}
