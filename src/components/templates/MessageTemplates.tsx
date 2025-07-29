/**
 * Sistema de templates personalizáveis
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Search, Plus, Edit, Trash2, Copy, Star, Clock, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  variables: string[];
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateContextType {
  templates: MessageTemplate[];
  categories: string[];
  addTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  updateTemplate: (id: string, template: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  toggleFavorite: (id: string) => void;
  useTemplate: (id: string, variables?: Record<string, string>) => string;
  searchTemplates: (query: string, category?: string) => MessageTemplate[];
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function useMessageTemplates() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useMessageTemplates must be used within TemplateProvider');
  }
  return context;
}

// Dados iniciais de exemplo
const defaultTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'Boas-vindas',
    content: 'Olá {{nome}}! Bem-vindo(a) ao nosso atendimento. Como posso ajudá-lo(a) hoje?',
    category: 'Saudação',
    tags: ['boas-vindas', 'início'],
    variables: ['nome'],
    isDefault: true,
    isFavorite: true,
    usageCount: 45,
    lastUsed: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Solicitação de Informações',
    content: 'Para prosseguir com seu atendimento, preciso de algumas informações:\n\n- Nome completo\n- E-mail\n- Telefone\n\nPoderia me fornecer esses dados?',
    category: 'Coleta de Dados',
    tags: ['informações', 'dados'],
    variables: [],
    isDefault: true,
    isFavorite: false,
    usageCount: 32,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Transferência para Setor',
    content: 'Vou transferir você para nosso setor de {{setor}}. Eles estão melhor preparados para ajudá-lo(a) com {{assunto}}. Por favor, aguarde um momento.',
    category: 'Transferência',
    tags: ['transferência', 'setor'],
    variables: ['setor', 'assunto'],
    isDefault: true,
    isFavorite: false,
    usageCount: 28,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const defaultCategories = ['Saudação', 'Coleta de Dados', 'Transferência', 'Despedida', 'Suporte', 'Vendas'];

interface TemplateProviderProps {
  children: React.ReactNode;
}

export function TemplateProvider({ children }: TemplateProviderProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>(defaultTemplates);
  const [categories] = useState<string[]>(defaultCategories);
  const { toast } = useToast();

  const addTemplate = useCallback((templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newTemplate: MessageTemplate = {
      ...templateData,
      id: Math.random().toString(36).substring(2, 15),
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTemplates(prev => [...prev, newTemplate]);
    
    toast({
      title: "Template criado",
      description: `Template "${newTemplate.name}" foi criado com sucesso`,
    });
  }, [toast]);

  const updateTemplate = useCallback((id: string, updates: Partial<MessageTemplate>) => {
    setTemplates(prev => prev.map(template => 
      template.id === id 
        ? { ...template, ...updates, updatedAt: new Date() }
        : template
    ));

    toast({
      title: "Template atualizado",
      description: "As alterações foram salvas com sucesso",
    });
  }, [toast]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
    
    toast({
      title: "Template excluído",
      description: "O template foi removido com sucesso",
    });
  }, [toast]);

  const toggleFavorite = useCallback((id: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === id 
        ? { ...template, isFavorite: !template.isFavorite, updatedAt: new Date() }
        : template
    ));
  }, []);

  const useTemplate = useCallback((id: string, variables?: Record<string, string>) => {
    const template = templates.find(t => t.id === id);
    if (!template) return '';

    // Incrementar contador de uso
    setTemplates(prev => prev.map(t => 
      t.id === id 
        ? { ...t, usageCount: t.usageCount + 1, lastUsed: new Date(), updatedAt: new Date() }
        : t
    ));

    // Substituir variáveis
    let content = template.content;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      });
    }

    return content;
  }, [templates]);

  const searchTemplates = useCallback((query: string, category?: string) => {
    return templates.filter(template => {
      const matchesQuery = !query || 
        template.name.toLowerCase().includes(query.toLowerCase()) ||
        template.content.toLowerCase().includes(query.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesCategory = !category || template.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [templates]);

  const value = {
    templates,
    categories,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleFavorite,
    useTemplate,
    searchTemplates
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

// Componente principal para gerenciar templates
interface TemplateManagerProps {
  onSelectTemplate?: (content: string) => void;
  className?: string;
}

export function TemplateManager({ onSelectTemplate, className }: TemplateManagerProps) {
  const { 
    templates, 
    categories, 
    addTemplate, 
    updateTemplate, 
    deleteTemplate, 
    toggleFavorite, 
    useTemplate, 
    searchTemplates 
  } = useMessageTemplates();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const filteredTemplates = searchTemplates(searchQuery, selectedCategory);

  const handleSelectTemplate = (template: MessageTemplate) => {
    const variables: Record<string, string> = {};
    
    // Solicitar valores para variáveis
    template.variables.forEach(variable => {
      const value = prompt(`Digite o valor para ${variable}:`);
      if (value) variables[variable] = value;
    });

    const content = useTemplate(template.id, variables);
    onSelectTemplate?.(content);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Template</DialogTitle>
            </DialogHeader>
            <TemplateForm 
              onSubmit={(template) => {
                addTemplate(template);
                setShowCreateDialog(false);
              }}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de templates */}
      <div className="space-y-3">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum template encontrado</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => handleSelectTemplate(template)}
              onEdit={() => setEditingTemplate(template)}
              onDelete={() => deleteTemplate(template.id)}
              onToggleFavorite={() => toggleFavorite(template.id)}
            />
          ))
        )}
      </div>

      {/* Dialog de edição */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSubmit={(template) => {
                updateTemplate(editingTemplate.id, template);
                setEditingTemplate(null);
              }}
              categories={categories}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Card do template
interface TemplateCardProps {
  template: MessageTemplate;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

function TemplateCard({ template, onSelect, onEdit, onDelete, onToggleFavorite }: TemplateCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.RelativeTimeFormat('pt-BR').format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{template.name}</h3>
            {template.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.content}
          </p>
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFavorite}
            className="h-8 w-8 p-0"
          >
            <Star className={cn(
              "h-4 w-4",
              template.isFavorite ? "text-yellow-500 fill-current" : "text-muted-foreground"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Copy className="h-3 w-3" />
            {template.usageCount} usos
          </span>
          {template.lastUsed && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(template.lastUsed)}
            </span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onSelect}
          className="h-7 text-xs"
        >
          Usar Template
        </Button>
      </div>
      
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Formulário de template
interface TemplateFormProps {
  template?: MessageTemplate;
  onSubmit: (template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  categories: string[];
}

function TemplateForm({ template, onSubmit, categories }: TemplateFormProps) {
  const [name, setName] = useState(template?.name || '');
  const [content, setContent] = useState(template?.content || '');
  const [category, setCategory] = useState(template?.category || '');
  const [tags, setTags] = useState(template?.tags.join(', ') || '');

  // Detectar variáveis no conteúdo
  const detectVariables = (text: string): string[] => {
    const matches = text.match(/{{(\w+)}}/g);
    return matches ? matches.map(match => match.slice(2, -2)) : [];
  };

  const variables = detectVariables(content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      name,
      content,
      category,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      variables,
      isDefault: false,
      isFavorite: template?.isFavorite || false,
      lastUsed: template?.lastUsed
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nome do Template</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Saudação inicial"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Categoria</label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium">Conteúdo</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite o conteúdo do template. Use {{variavel}} para campos dinâmicos."
          rows={4}
          required
        />
        {variables.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Variáveis detectadas: {variables.join(', ')}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Tags</label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Ex: saudação, início, boas-vindas"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separe as tags por vírgula
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          {template ? 'Atualizar' : 'Criar'} Template
        </Button>
      </div>
    </form>
  );
}