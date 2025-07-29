import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Variable, Type, Calendar, Hash, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export interface FlowVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'object';
  description?: string;
  defaultValue?: any;
  scope: 'global' | 'conversation' | 'temporary';
  category?: string;
  required?: boolean;
}

interface VariableManagerProps {
  variables: FlowVariable[];
  onVariablesChange: (variables: FlowVariable[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const systemVariables: FlowVariable[] = [
  {
    id: 'system_phone',
    name: 'telefone_usuario',
    type: 'text',
    description: 'Número de telefone do usuário',
    scope: 'conversation',
    category: 'Sistema',
    required: false
  },
  {
    id: 'system_name',
    name: 'nome_usuario',
    type: 'text',
    description: 'Nome do usuário quando disponível',
    scope: 'conversation',
    category: 'Sistema',
    required: false
  },
  {
    id: 'system_last_message',
    name: 'ultima_resposta',
    type: 'text',
    description: 'Última mensagem enviada pelo usuário',
    scope: 'temporary',
    category: 'Sistema',
    required: false
  },
  {
    id: 'system_timestamp',
    name: 'timestamp_atual',
    type: 'date',
    description: 'Data e hora atual',
    scope: 'temporary',
    category: 'Sistema',
    required: false
  }
];

const typeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  boolean: Variable,
  object: Globe
};

const scopeColors = {
  global: 'bg-blue-100 text-blue-800',
  conversation: 'bg-green-100 text-green-800',
  temporary: 'bg-orange-100 text-orange-800'
};

export function VariableManager({ variables, onVariablesChange, isOpen, onClose }: VariableManagerProps) {
  const [editingVariable, setEditingVariable] = useState<FlowVariable | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleCreateVariable = useCallback((variable: Omit<FlowVariable, 'id'>) => {
    const newVariable: FlowVariable = {
      ...variable,
      id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    onVariablesChange([...variables, newVariable]);
    setIsCreateDialogOpen(false);
  }, [variables, onVariablesChange]);

  const handleUpdateVariable = useCallback((updatedVariable: FlowVariable) => {
    onVariablesChange(variables.map(v => v.id === updatedVariable.id ? updatedVariable : v));
    setEditingVariable(null);
  }, [variables, onVariablesChange]);

  const handleDeleteVariable = useCallback((variableId: string) => {
    onVariablesChange(variables.filter(v => v.id !== variableId));
  }, [variables, onVariablesChange]);

  const allVariables = [...systemVariables, ...variables];
  const groupedVariables = allVariables.reduce((acc, variable) => {
    const category = variable.category || 'Personalizadas';
    if (!acc[category]) acc[category] = [];
    acc[category].push(variable);
    return acc;
  }, {} as Record<string, FlowVariable[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Variable className="h-5 w-5" />
                Gerenciador de Variáveis
              </CardTitle>
              <CardDescription>
                Gerencie variáveis globais e do fluxo para personalização avançada
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Variável
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Variável</DialogTitle>
                  </DialogHeader>
                  <VariableForm onSubmit={handleCreateVariable} onCancel={() => setIsCreateDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {Object.entries(groupedVariables).map(([category, vars]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {category}
                  </h3>
                  <Separator className="flex-1" />
                  <Badge variant="secondary" className="text-xs">
                    {vars.length} variável{vars.length !== 1 ? 'is' : ''}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {vars.map((variable) => {
                    const TypeIcon = typeIcons[variable.type];
                    const isSystemVariable = category === 'Sistema';
                    
                    return (
                      <Card key={variable.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-muted rounded-lg">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {`{{${variable.name}}}`}
                                </code>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${scopeColors[variable.scope]}`}
                                >
                                  {variable.scope}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {variable.type}
                                </Badge>
                              </div>
                              
                              {variable.description && (
                                <p className="text-sm text-muted-foreground">
                                  {variable.description}
                                </p>
                              )}
                              
                              {variable.defaultValue && (
                                <div className="mt-2">
                                  <Label className="text-xs text-muted-foreground">Valor padrão:</Label>
                                  <code className="text-xs bg-muted px-2 py-1 rounded ml-2">
                                    {String(variable.defaultValue)}
                                  </code>
                                </div>
                              )}
                            </div>
                          </div>

                          {!isSystemVariable && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingVariable(variable)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVariable(variable.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Variable Dialog */}
      {editingVariable && (
        <Dialog open={!!editingVariable} onOpenChange={() => setEditingVariable(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Variável</DialogTitle>
            </DialogHeader>
            <VariableForm
              initialVariable={editingVariable}
              onSubmit={handleUpdateVariable}
              onCancel={() => setEditingVariable(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface VariableFormProps {
  initialVariable?: FlowVariable;
  onSubmit: (variable: FlowVariable | Omit<FlowVariable, 'id'>) => void;
  onCancel: () => void;
}

function VariableForm({ initialVariable, onSubmit, onCancel }: VariableFormProps) {
  const [formData, setFormData] = useState<Omit<FlowVariable, 'id'>>({
    name: initialVariable?.name || '',
    type: initialVariable?.type || 'text',
    description: initialVariable?.description || '',
    defaultValue: initialVariable?.defaultValue || '',
    scope: initialVariable?.scope || 'conversation',
    category: initialVariable?.category || 'Personalizadas',
    required: initialVariable?.required || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initialVariable) {
      onSubmit({ ...formData, id: initialVariable.id });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Variável</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="ex: nome_cliente"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
              <SelectItem value="object">Objeto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o propósito desta variável..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scope">Escopo</Label>
          <Select value={formData.scope} onValueChange={(value: any) => setFormData(prev => ({ ...prev, scope: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="conversation">Conversa</SelectItem>
              <SelectItem value="temporary">Temporária</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultValue">Valor Padrão</Label>
          <Input
            id="defaultValue"
            value={formData.defaultValue}
            onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
            placeholder="Valor inicial (opcional)"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialVariable ? 'Atualizar' : 'Criar'} Variável
        </Button>
      </div>
    </form>
  );
}