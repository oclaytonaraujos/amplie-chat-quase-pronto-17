import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  Hash, 
  Users, 
  Clock,
  Search,
  Filter,
  Save,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: TemplateVariable[];
  isGlobal: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
  tags: string[];
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: string[];
  required: boolean;
}

interface TemplateCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const defaultCategories: TemplateCategory[] = [
  { id: 'boas-vindas', name: 'Boas-vindas', color: 'blue', icon: '👋' },
  { id: 'suporte', name: 'Suporte', color: 'green', icon: '🛟' },
  { id: 'vendas', name: 'Vendas', color: 'purple', icon: '💼' },
  { id: 'despedida', name: 'Despedida', color: 'orange', icon: '👋' },
  { id: 'promocoes', name: 'Promoções', color: 'red', icon: '🎯' },
  { id: 'agendamento', name: 'Agendamento', color: 'yellow', icon: '📅' },
  { id: 'cobranca', name: 'Cobrança', color: 'gray', icon: '💰' },
  { id: 'feedback', name: 'Feedback', color: 'pink', icon: '⭐' }
];

const defaultTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Boas-vindas Personalizada',
    content: 'Olá {{nome}}! 👋\n\nSeja bem-vindo(a) à {{empresa}}!\n\nEm que posso ajudá-lo(a) hoje?',
    category: 'boas-vindas',
    variables: [
      { name: 'nome', type: 'text', placeholder: 'Nome do cliente', required: true },
      { name: 'empresa', type: 'text', placeholder: 'Nome da empresa', required: true }
    ],
    isGlobal: true,
    isFavorite: true,
    usageCount: 245,
    createdBy: 'Sistema',
    createdAt: '2024-01-01',
    tags: ['personalizado', 'cliente-novo']
  },
  {
    id: '2',
    name: 'Agendamento de Consulta',
    content: 'Olá {{nome}}!\n\nPara agendar sua consulta, preciso de algumas informações:\n\n📅 Data preferida: {{data}}\n⏰ Horário: {{horario}}\n📋 Tipo de consulta: {{tipo}}\n\nConfirma essas informações?',
    category: 'agendamento',
    variables: [
      { name: 'nome', type: 'text', placeholder: 'Nome do cliente', required: true },
      { name: 'data', type: 'date', placeholder: 'Data da consulta', required: true },
      { name: 'horario', type: 'select', options: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'], required: true },
      { name: 'tipo', type: 'select', options: ['Consulta geral', 'Retorno', 'Exame', 'Procedimento'], required: true }
    ],
    isGlobal: true,
    isFavorite: false,
    usageCount: 89,
    createdBy: 'Dr. Silva',
    createdAt: '2024-01-15',
    tags: ['agendamento', 'consulta', 'medico']
  }
];

export function AdvancedMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates);
  const [categories] = useState<TemplateCategory[]>(defaultCategories);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<MessageTemplate>>({
    name: '',
    content: '',
    category: 'suporte',
    variables: [],
    isGlobal: false,
    isFavorite: false,
    tags: []
  });
  const [newVariable, setNewVariable] = useState<TemplateVariable>({
    name: '',
    type: 'text',
    placeholder: '',
    required: false
  });
  const { toast } = useToast();

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesFavorites = !showFavoritesOnly || template.isFavorite;
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      content: newTemplate.content || '',
      category: newTemplate.category || 'suporte',
      variables: newTemplate.variables || [],
      isGlobal: newTemplate.isGlobal || false,
      isFavorite: newTemplate.isFavorite || false,
      usageCount: 0,
      createdBy: 'Usuário Atual',
      createdAt: new Date().toISOString(),
      tags: newTemplate.tags || []
    };

    setTemplates(prev => [...prev, template]);
    setNewTemplate({
      name: '',
      content: '',
      category: 'suporte',
      variables: [],
      isGlobal: false,
      isFavorite: false,
      tags: []
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Template criado",
      description: `Template "${template.name}" criado com sucesso`,
      variant: "default"
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Template excluído",
      description: "Template removido com sucesso",
      variant: "default"
    });
  };

  const handleToggleFavorite = (id: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const handleCopyTemplate = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Template copiado",
      description: "Conteúdo copiado para a área de transferência",
      variant: "default"
    });
  };

  const addVariable = () => {
    if (!newVariable.name) return;

    setNewTemplate(prev => ({
      ...prev,
      variables: [...(prev.variables || []), { ...newVariable }]
    }));

    setNewVariable({
      name: '',
      type: 'text',
      placeholder: '',
      required: false
    });
  };

  const removeVariable = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      variables: prev.variables?.filter((_, i) => i !== index) || []
    }));
  };

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id);
  };

  const processTemplateContent = (content: string, variables: Record<string, string>) => {
    let processed = content;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return processed;
  };

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Templates de Mensagem</h2>
            <p className="text-muted-foreground">
              Gerencie templates personalizados com variáveis dinâmicas
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Template</DialogTitle>
                <DialogDescription>
                  Crie um novo template com variáveis dinâmicas
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-name">Nome do Template</Label>
                    <Input
                      id="template-name"
                      value={newTemplate.name || ''}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Boas-vindas VIP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-category">Categoria</Label>
                    <Select 
                      value={newTemplate.category} 
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="template-content">Conteúdo</Label>
                  <Textarea
                    id="template-content"
                    value={newTemplate.content || ''}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite o conteúdo do template. Use {{variavel}} para variáveis dinâmicas"
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{{nome_variavel}}'} para criar variáveis dinâmicas
                  </p>
                </div>

                {/* Variáveis */}
                <div>
                  <Label>Variáveis</Label>
                  <div className="space-y-2">
                    {newTemplate.variables?.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="text-sm font-medium">{variable.name}</span>
                        <Badge variant="outline">{variable.type}</Badge>
                        {variable.required && <Badge variant="secondary">Obrigatório</Badge>}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeVariable(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nome da variável"
                        value={newVariable.name}
                        onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Select 
                        value={newVariable.type} 
                        onValueChange={(value: any) => setNewVariable(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="date">Data</SelectItem>
                          <SelectItem value="select">Seleção</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={addVariable}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-global"
                      checked={newTemplate.isGlobal || false}
                      onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, isGlobal: checked }))}
                    />
                    <Label htmlFor="is-global">Template global</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-favorite"
                      checked={newTemplate.isFavorite || false}
                      onCheckedChange={(checked) => setNewTemplate(prev => ({ ...prev, isFavorite: checked }))}
                    />
                    <Label htmlFor="is-favorite">Favorito</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    <Save className="h-4 w-4 mr-2" />
                    Criar Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch
              id="favorites-only"
              checked={showFavoritesOnly}
              onCheckedChange={setShowFavoritesOnly}
            />
            <Label htmlFor="favorites-only">Apenas favoritos</Label>
          </div>
        </div>
      </div>

      {/* Lista de templates */}
      <div className="grid gap-4">
        {filteredTemplates.map(template => {
          const category = getCategoryById(template.category);
          
          return (
            <Card key={template.id} className="group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{category?.icon}</div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {template.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        {template.isGlobal && <Users className="h-4 w-4 text-blue-500" />}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {category?.name}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {template.usageCount} usos
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Criado em {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleToggleFavorite(template.id)}
                    >
                      <Star className={`h-4 w-4 ${template.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleCopyTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    {template.content}
                  </div>

                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Variáveis:</p>
                      <div className="flex flex-wrap gap-2">
                        {template.variables.map((variable, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {variable.name} ({variable.type})
                            {variable.required && '*'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTemplates.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Crie seu primeiro template ou ajuste os filtros
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}