import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Search, Star, Clock, Edit, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  variables: string[];
  is_favorite: boolean;
  usage_count: number;
  last_used: string | null;
  created_at: string;
}

interface QuickResponseTemplatesProps {
  onSelectTemplate: (content: string) => void;
  className?: string;
}

const defaultCategories = [
  'Saudação',
  'Informações',
  'Suporte Técnico',
  'Vendas',
  'Transferência',
  'Despedida',
  'Procedimentos',
  'FAQ'
];

export function QuickResponseTemplates({ onSelectTemplate, className }: QuickResponseTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MessageTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Simular profile para funcionar com o sistema atual
  const profile = { empresa_id: 'empresa-1' };

  // Carregar templates
  useEffect(() => {
    if (profile) {
      loadTemplates();
    }
  }, [profile]);

  // Filtrar templates
  useEffect(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Ordenar por favoritos primeiro, depois por uso
    filtered.sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return b.usage_count - a.usage_count;
    });

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('is_favorite', { ascending: false })
        .order('usage_count', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: MessageTemplate) => {
    const variables: Record<string, string> = {};
    
    // Solicitar valores para variáveis
    for (const variable of template.variables) {
      const value = prompt(`Digite o valor para ${variable}:`);
      if (value) variables[variable] = value;
    }

    // Substituir variáveis no conteúdo
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    // Incrementar contador de uso
    try {
      await supabase
        .from('message_templates')
        .update({ 
          usage_count: template.usage_count + 1,
          last_used: new Date().toISOString()
        })
        .eq('id', template.id);

      // Atualizar estado local
      setTemplates(prev => prev.map(t => 
        t.id === template.id 
          ? { ...t, usage_count: t.usage_count + 1, last_used: new Date().toISOString() }
          : t
      ));
    } catch (error) {
      console.error('Erro ao atualizar contador de uso:', error);
    }

    onSelectTemplate(content);
  };

  const toggleFavorite = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      await supabase
        .from('message_templates')
        .update({ is_favorite: !template.is_favorite })
        .eq('id', templateId);

      setTemplates(prev => prev.map(t => 
        t.id === templateId 
          ? { ...t, is_favorite: !t.is_favorite }
          : t
      ));
    } catch (error) {
      console.error('Erro ao atualizar favorito:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: 'Template excluído',
        description: 'Template removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o template',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Nunca usado';
    
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('pt-BR').format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <MessageSquare className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header e Filtros */}
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
            {defaultCategories.map(category => (
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
              onSubmit={(templateData) => {
                createTemplate(templateData);
                setShowCreateDialog(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Templates */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template encontrado</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro template
              </Button>
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
                formatTime={formatTime}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Dialog de Edição */}
      {editingTemplate && (
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Template</DialogTitle>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSubmit={(templateData) => {
                updateTemplate(editingTemplate.id, templateData);
                setEditingTemplate(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // Funções auxiliares para CRUD
  async function createTemplate(templateData: any) {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('message_templates')
        .insert({
          ...templateData,
          empresa_id: profile.empresa_id,
          created_by: user.id
        });

      if (error) throw error;

      await loadTemplates();
      
      toast({
        title: 'Template criado',
        description: 'Template criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o template',
        variant: 'destructive'
      });
    }
  }

  async function updateTemplate(templateId: string, templateData: any) {
    try {
      const { error } = await supabase
        .from('message_templates')
        .update(templateData)
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
      
      toast({
        title: 'Template atualizado',
        description: 'Template atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o template',
        variant: 'destructive'
      });
    }
  }
}

// Componente do Card do Template
interface TemplateCardProps {
  template: MessageTemplate;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  formatTime: (date: string | null) => string;
}

function TemplateCard({ 
  template, 
  onSelect, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  formatTime 
}: TemplateCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{template.name}</h3>
            {template.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
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
            <Star className={`h-4 w-4 ${
              template.is_favorite ? 'text-yellow-500 fill-current' : 'text-muted-foreground'
            }`} />
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
            {template.usage_count} usos
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(template.last_used)}
          </span>
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

// Formulário de Template
interface TemplateFormProps {
  template?: MessageTemplate;
  onSubmit: (templateData: any) => void;
}

function TemplateForm({ template, onSubmit }: TemplateFormProps) {
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
      is_favorite: template?.is_favorite || false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Template</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Saudação inicial"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Categoria</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {defaultCategories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="content">Conteúdo do Template</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite o conteúdo do template. Use {{variavel}} para variáveis."
          className="min-h-24"
          required
        />
        {variables.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Variáveis detectadas: {variables.join(', ')}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Ex: saudação, boas-vindas, início"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">
          {template ? 'Atualizar' : 'Criar'} Template
        </Button>
      </div>
    </form>
  );
}