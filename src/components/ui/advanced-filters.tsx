import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Filter, X, Plus, Search, Calendar, Tag, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  label?: string;
}

export interface FilterGroup {
  id: string;
  name: string;
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
}

interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multi-select' | 'boolean';
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  onFiltersChange: (groups: FilterGroup[]) => void;
  savedFilters?: FilterGroup[];
  className?: string;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  fields,
  onFiltersChange,
  savedFilters = [],
  className,
}) => {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    {
      id: 'default',
      name: 'Filtros',
      conditions: [],
      operator: 'AND',
    },
  ]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addCondition = useCallback((groupId: string) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: [
              ...group.conditions,
              {
                id: `condition_${Date.now()}`,
                field: fields[0]?.key || '',
                operator: 'contains',
                value: '',
              },
            ],
          }
        : group
    ));
  }, [fields]);

  const removeCondition = useCallback((groupId: string, conditionId: string) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: group.conditions.filter(c => c.id !== conditionId),
          }
        : group
    ));
  }, []);

  const updateCondition = useCallback((groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
    setFilterGroups(prev => prev.map(group => 
      group.id === groupId 
        ? {
            ...group,
            conditions: group.conditions.map(c => 
              c.id === conditionId ? { ...c, ...updates } : c
            ),
          }
        : group
    ));
  }, []);

  const addGroup = useCallback(() => {
    const newGroup: FilterGroup = {
      id: `group_${Date.now()}`,
      name: `Grupo ${filterGroups.length + 1}`,
      conditions: [],
      operator: 'AND',
    };
    setFilterGroups(prev => [...prev, newGroup]);
  }, [filterGroups.length]);

  const removeGroup = useCallback((groupId: string) => {
    setFilterGroups(prev => prev.filter(g => g.id !== groupId));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterGroups([{
      id: 'default',
      name: 'Filtros',
      conditions: [],
      operator: 'AND',
    }]);
  }, []);

  const applyFilters = useCallback(() => {
    onFiltersChange(filterGroups);
  }, [filterGroups, onFiltersChange]);

  const getOperatorOptions = (fieldType: FilterField['type']) => {
    switch (fieldType) {
      case 'text':
        return [
          { value: 'contains', label: 'Contém' },
          { value: 'equals', label: 'Igual a' },
          { value: 'starts_with', label: 'Começa com' },
          { value: 'ends_with', label: 'Termina com' },
        ];
      case 'number':
      case 'date':
        return [
          { value: 'equals', label: 'Igual a' },
          { value: 'greater_than', label: 'Maior que' },
          { value: 'less_than', label: 'Menor que' },
          { value: 'between', label: 'Entre' },
        ];
      case 'select':
      case 'multi-select':
        return [
          { value: 'equals', label: 'Igual a' },
          { value: 'in', label: 'Está em' },
          { value: 'not_in', label: 'Não está em' },
        ];
      default:
        return [{ value: 'equals', label: 'Igual a' }];
    }
  };

  const renderConditionValue = (condition: FilterCondition, field: FilterField, groupId: string) => {
    const updateValue = (value: any) => {
      updateCondition(groupId, condition.id, { value });
    };

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={condition.value || ''}
            onChange={(e) => updateValue(e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={condition.value || ''}
            onChange={(e) => updateValue(Number(e.target.value))}
            placeholder={field.placeholder}
            className="w-full"
          />
        );
      
      case 'date':
        if (condition.operator === 'between') {
          return (
            <DatePickerWithRange
              value={condition.value}
              onChange={updateValue}
              className="w-full"
            />
          );
        }
        return (
          <Input
            type="date"
            value={condition.value || ''}
            onChange={(e) => updateValue(e.target.value)}
            className="w-full"
          />
        );
      
      case 'select':
        return (
          <Select value={condition.value || ''} onValueChange={updateValue}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'multi-select':
        return (
          <div className="space-y-2">
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={(condition.value || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = condition.value || [];
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: string) => v !== option.value);
                    updateValue(newValues);
                  }}
                />
                <Label htmlFor={option.value}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  const activeFiltersCount = useMemo(() => {
    return filterGroups.reduce((count, group) => count + group.conditions.length, 0);
  }, [filterGroups]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-h-96 overflow-auto" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtros Avançados</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? 'Simples' : 'Avançado'}
                  </Button>
                </div>

                {filterGroups.map((group) => (
                  <Card key={group.id} className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">{group.name}</Label>
                      {filterGroups.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGroup(group.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {group.conditions.map((condition, index) => {
                        const field = fields.find(f => f.key === condition.field);
                        if (!field) return null;

                        return (
                          <div key={condition.id} className="space-y-2 p-2 border rounded">
                            {index > 0 && (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={group.operator}
                                  onValueChange={(value: 'AND' | 'OR') => {
                                    setFilterGroups(prev => prev.map(g => 
                                      g.id === group.id ? { ...g, operator: value } : g
                                    ));
                                  }}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AND">E</SelectItem>
                                    <SelectItem value="OR">OU</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2">
                              <Select
                                value={condition.field}
                                onValueChange={(value) => updateCondition(group.id, condition.id, { field: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fields.map(field => (
                                    <SelectItem key={field.key} value={field.key}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={condition.operator}
                                onValueChange={(value: any) => updateCondition(group.id, condition.id, { operator: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getOperatorOptions(field.type).map(op => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="flex items-center gap-1">
                                <div className="flex-1">
                                  {renderConditionValue(condition, field, group.id)}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCondition(group.id, condition.id)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addCondition(group.id)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Condição
                      </Button>
                    </div>
                  </Card>
                ))}

                {showAdvanced && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addGroup}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Grupo
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button onClick={applyFilters} size="sm" className="flex-1">
                    Aplicar Filtros
                  </Button>
                  <Button variant="outline" onClick={clearAllFilters} size="sm">
                    Limpar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="w-4 h-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {filterGroups.map(group => 
            group.conditions.map(condition => {
              const field = fields.find(f => f.key === condition.field);
              if (!field || !condition.value) return null;

              return (
                <Badge key={condition.id} variant="secondary" className="gap-1">
                  <span className="text-xs">
                    {field.label}: {condition.value}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 w-4 h-4"
                    onClick={() => removeCondition(group.id, condition.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Hook para usar filtros avançados
export const useAdvancedFilters = <T extends Record<string, any>>(
  data: T[],
  filterGroups: FilterGroup[]
) => {
  return useMemo(() => {
    if (!filterGroups.length || !filterGroups.some(g => g.conditions.length > 0)) {
      return data;
    }

    return data.filter(item => {
      return filterGroups.every(group => {
        if (!group.conditions.length) return true;

        const groupResults = group.conditions.map(condition => {
          const value = item[condition.field];
          const conditionValue = condition.value;

          switch (condition.operator) {
            case 'equals':
              return value === conditionValue;
            case 'contains':
              return String(value).toLowerCase().includes(String(conditionValue).toLowerCase());
            case 'starts_with':
              return String(value).toLowerCase().startsWith(String(conditionValue).toLowerCase());
            case 'ends_with':
              return String(value).toLowerCase().endsWith(String(conditionValue).toLowerCase());
            case 'greater_than':
              return Number(value) > Number(conditionValue);
            case 'less_than':
              return Number(value) < Number(conditionValue);
            case 'in':
              return Array.isArray(conditionValue) && conditionValue.includes(value);
            case 'not_in':
              return Array.isArray(conditionValue) && !conditionValue.includes(value);
            case 'between':
              if (Array.isArray(conditionValue) && conditionValue.length === 2) {
                return value >= conditionValue[0] && value <= conditionValue[1];
              }
              return false;
            default:
              return true;
          }
        });

        return group.operator === 'AND' 
          ? groupResults.every(Boolean)
          : groupResults.some(Boolean);
      });
    });
  }, [data, filterGroups]);
};