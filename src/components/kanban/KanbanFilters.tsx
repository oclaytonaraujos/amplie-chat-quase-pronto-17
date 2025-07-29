
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Users } from 'lucide-react';

interface KanbanFiltersProps {
  departamentoSelecionado: string;
  onDepartamentoChange: (departamento: string) => void;
  departamentos: string[];
  totalAtendimentos: number;
}

export function KanbanFilters({ 
  departamentoSelecionado, 
  onDepartamentoChange, 
  departamentos,
  totalAtendimentos 
}: KanbanFiltersProps) {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrar por Departamento:</span>
        </div>
        
        <Select value={departamentoSelecionado} onValueChange={onDepartamentoChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos os departamentos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os departamentos</SelectItem>
            {departamentos.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Users className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-600">Total de atendimentos:</span>
        <Badge variant="secondary">{totalAtendimentos}</Badge>
      </div>
    </div>
  );
}
