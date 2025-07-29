
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface FiltrosContatosProps {
  onFiltrosChange: (filtros: any) => void;
}

const setoresDisponiveis = ['Vendas', 'Suporte', 'Marketing', 'Financeiro', 'RH'];
const statusDisponiveis = ['ativo', 'inativo', 'bloqueado'];
const tagsDisponiveis = ['VIP', 'Interessado', 'Problema Recorrente', 'Novo Contato'];

export function FiltrosContatos({ onFiltrosChange }: FiltrosContatosProps) {
  const [filtros, setFiltros] = useState({
    setor: '',
    status: '',
    tag: ''
  });

  const aplicarFiltro = (campo: string, valor: string) => {
    // Convert "all" values back to empty strings for filtering logic
    const valorFiltro = valor === 'all' ? '' : valor;
    const novosFiltros = {
      ...filtros,
      [campo]: valorFiltro
    };
    setFiltros(novosFiltros);
    onFiltrosChange(novosFiltros);
  };

  const removerFiltro = (campo: string) => {
    const novosFiltros = {
      ...filtros,
      [campo]: ''
    };
    setFiltros(novosFiltros);
    onFiltrosChange(novosFiltros);
  };

  const limparTodosFiltros = () => {
    const filtrosLimpos = {
      setor: '',
      status: '',
      tag: ''
    };
    setFiltros(filtrosLimpos);
    onFiltrosChange(filtrosLimpos);
  };

  const filtrosAtivos = Object.entries(filtros).filter(([_, valor]) => valor !== '');

  return (
    <div className="space-y-6">
      {filtrosAtivos.length > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={limparTodosFiltros}
            className="text-gray-600"
          >
            Limpar Filtros
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {/* Filtro por Setor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Setor
          </label>
          <Select
            value={filtros.setor || 'all'}
            onValueChange={(value) => aplicarFiltro('setor', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os setores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {setoresDisponiveis.map((setor) => (
                <SelectItem key={setor} value={setor}>
                  {setor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <Select
            value={filtros.status || 'all'}
            onValueChange={(value) => aplicarFiltro('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusDisponiveis.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro por Tag */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tag
          </label>
          <Select
            value={filtros.tag || 'all'}
            onValueChange={(value) => aplicarFiltro('tag', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tags</SelectItem>
              {tagsDisponiveis.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros Ativos */}
      {filtrosAtivos.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">Filtros ativos:</span>
          <div className="flex flex-wrap gap-2">
            {filtrosAtivos.map(([campo, valor]) => (
              <Badge 
                key={campo} 
                variant="secondary" 
                className="flex items-center space-x-1"
              >
                <span>{campo}: {valor}</span>
                <button
                  onClick={() => removerFiltro(campo)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
