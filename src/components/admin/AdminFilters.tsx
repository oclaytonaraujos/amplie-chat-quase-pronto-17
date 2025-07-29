import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FilterOption {
  label: string;
  value: string;
}

interface AdminFiltersProps {
  onSearch: (term: string) => void;
  onFilterChange: (filters: Record<string, string>) => void;
  searchPlaceholder?: string;
  filterOptions?: {
    status?: FilterOption[];
    empresa?: FilterOption[];
    cargo?: FilterOption[];
    plano?: FilterOption[];
  };
}

export function AdminFilters({ 
  onSearch, 
  onFilterChange, 
  searchPlaceholder = "Buscar...",
  filterOptions = {}
}: AdminFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === 'all' || !value) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({});
    onSearch('');
    onFilterChange({});
  };

  const activeFiltersCount = Object.keys(filters).length + (searchTerm ? 1 : 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-4 w-4" />
            Busca e Filtros
          </CardTitle>
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activeFiltersCount} filtro(s) ativo(s)</Badge>
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca Principal */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.status && (
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filterOptions.status.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filterOptions.empresa && (
            <Select value={filters.empresa || 'all'} onValueChange={(value) => handleFilterChange('empresa', value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {filterOptions.empresa.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Botão para Filtros Avançados */}
          {(filterOptions.cargo || filterOptions.plano) && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros Avançados
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/20">
                  {filterOptions.cargo && (
                    <Select value={filters.cargo || 'all'} onValueChange={(value) => handleFilterChange('cargo', value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {filterOptions.cargo.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {filterOptions.plano && (
                    <Select value={filters.plano || 'all'} onValueChange={(value) => handleFilterChange('plano', value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {filterOptions.plano.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Filtros Ativos */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(filters).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key}: {value}
                <button
                  onClick={() => handleFilterChange(key, '')}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}