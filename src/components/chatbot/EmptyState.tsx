
import { Bot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateNew: () => void;
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-amplie p-12 text-center">
      <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fluxo encontrado</h3>
      <p className="text-gray-500 mb-6">Não encontramos fluxos de chatbot com os critérios de busca.</p>
      <Button 
        className="bg-amplie-primary hover:bg-amplie-primary-light"
        onClick={onCreateNew}
      >
        <Plus className="w-4 h-4 mr-2" />
        Criar Primeiro Fluxo
      </Button>
    </div>
  );
}
