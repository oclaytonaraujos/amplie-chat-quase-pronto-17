import { Building2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type SetorData } from '@/services/setoresService';

interface SetorCardProps {
  setor: SetorData;
  onEdit: (setor: SetorData) => void;
  onDelete: (setor: SetorData) => void;
}

export function SetorCard({ setor, onEdit, onDelete }: SetorCardProps) {
  const formatarData = (data: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(data));
  };

  return (
    <div className="bg-card rounded-xl shadow-amplie p-4 md:p-6 hover:shadow-amplie-hover transition-all duration-300 min-w-0 flex flex-col">
      {/* Header do Card */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: setor.cor }}
          >
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-card-foreground break-words text-sm md:text-base leading-tight">
              {setor.nome}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={setor.ativo ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                {setor.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(setor)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(setor)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Capacidade */}
      <div className="mb-4 min-w-0">
        <p className="text-xs text-muted-foreground">Capacidade</p>
        <p className="text-sm font-medium">
          {setor.agentes_ativos}/{setor.capacidade_maxima} agentes
        </p>
      </div>

      {/* Descrição */}
      {setor.descricao && (
        <div className="mb-4 min-w-0">
          <p className="text-xs md:text-sm text-muted-foreground break-words line-clamp-3 leading-relaxed">
            {setor.descricao}
          </p>
        </div>
      )}

      {/* Data de criação */}
      <div className="mt-auto pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground break-words">
          Criado em {formatarData(setor.created_at)}
        </p>
      </div>
    </div>
  );
}