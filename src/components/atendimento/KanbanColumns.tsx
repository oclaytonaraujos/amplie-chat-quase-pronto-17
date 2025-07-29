
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Atendimento } from '@/types/atendimento';

interface KanbanColumnsProps {
  atendimentos: Atendimento[];
  onSelectAtendimento: (atendimento: Atendimento) => void;
  usuarioLogado?: string;
}

export function KanbanColumns({ atendimentos, onSelectAtendimento, usuarioLogado = 'Ana Silva' }: KanbanColumnsProps) {
  return (
    <KanbanBoard
      atendimentos={atendimentos}
      onSelectAtendimento={onSelectAtendimento}
      usuarioLogado={usuarioLogado}
      isAdmin={false}
    />
  );
}
