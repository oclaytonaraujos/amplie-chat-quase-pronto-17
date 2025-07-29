import { Building2 } from 'lucide-react';
import { NovoSetorDialog } from './NovoSetorDialog';

interface EmptyStateProps {
  type: 'initial' | 'search';
  searchTerm?: string;
}

export function EmptyState({ type, searchTerm }: EmptyStateProps) {
  if (type === 'search') {
    return (
      <div className="bg-card rounded-xl shadow-amplie p-8 md:p-12 text-center">
        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-base md:text-lg font-medium text-card-foreground mb-2 break-words">
          Nenhum setor encontrado
        </h3>
        <p className="text-sm md:text-base text-muted-foreground mb-6 break-words">
          Não encontramos setores com os critérios de busca.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-amplie p-8 md:p-12 text-center">
      <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-base md:text-lg font-medium text-card-foreground mb-2 break-words">
        Nenhum setor cadastrado
      </h3>
      <p className="text-sm md:text-base text-muted-foreground mb-6 break-words">
        Comece criando o primeiro setor da sua empresa.
      </p>
      <NovoSetorDialog />
    </div>
  );
}