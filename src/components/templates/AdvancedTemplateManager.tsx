import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Edit, Trash2, Copy, Share, 
  Tag, Star, Clock, TrendingUp, Zap, 
  MessageSquare, Users, Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  shortcuts: string[];
  priority: number;
  usage_count: number;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'greeting', label: 'Saudações', icon: '👋' },
  { value: 'support', label: 'Suporte', icon: '🛠️' },
  { value: 'sales', label: 'Vendas', icon: '💰' },
  { value: 'closing', label: 'Encerramento', icon: '✅' },
  { value: 'emergency', label: 'Emergência', icon: '🚨' },
  { value: 'general', label: 'Geral', icon: '📝' }
];

const TEMPLATE_VARIABLES = [
  '{{cliente_nome}}',
  '{{agente_nome}}',
  '{{empresa_nome}}',
  '{{data_atual}}',
  '{{hora_atual}}',
  '{{numero_atendimento}}'
];

export function AdvancedTemplateManager() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general',
    tags: '',
    shortcuts: '',
    priority: 0,
    is_shared: false
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const loadTemplates = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Simulate templates for now
      const mockTemplates: MessageTemplate[] = [
        {
          id: '1',
          name: 'Saudação Inicial',
          content: 'Olá {{cliente_nome}}! Como posso ajudá-lo hoje?',
          category: 'greeting',
          tags: ['inicial', 'saudacao'],
          shortcuts: ['/ola', '/inicio'],
          priority: 5,
          usage_count: 45,
          is_shared: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const templateData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        shortcuts: formData.shortcuts.split(',').map(shortcut => shortcut.trim()).filter(Boolean),
        user_id: user.id,
        empresa_id: 'empresa-1' // Replace with actual company ID
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('message_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Template atualizado",
          description: "O template foi atualizado com sucesso.",
        });
      } else {
        // Simulate creation for now
        console.log('Creating template:', templateData);

        toast({
          title: "Template criado",
          description: "O novo template foi criado com sucesso.",
        });
      }

      setFormData({
        name: '',
        content: '',
        category: 'general',
        tags: '',
        shortcuts: '',
        priority: 0,
        is_shared: false
      });
      setEditingTemplate(null);
      setIsCreateDialogOpen(false);
      loadTemplates();

    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o template.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      tags: template.tags.join(', '),
      shortcuts: template.shortcuts.join(', '),
      priority: template.priority,
      is_shared: template.is_shared
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Template excluído",
        description: "O template foi excluído com sucesso.",
      });
      
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o template.",
        variant: "destructive",
      });
    }
  };

  const handleUseTemplate = async (template: MessageTemplate) => {
    try {
      // Increment usage count
      const { error } = await supabase
        .from('message_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id);

      if (error) throw error;

      // Copy to clipboard
      await navigator.clipboard.writeText(template.content);
      
      toast({
        title: "Template copiado",
        description: "O conteúdo do template foi copiado para a área de transferência.",
      });
      
      loadTemplates();
    } catch (error) {
      console.error('Error using template:', error);
    }
  };

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + variable
    }));
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : '📝';
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : 'Geral';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Gerenciador de Templates</h2>
          <p className="text-muted-foreground">
            Crie e gerencie templates de mensagens reutilizáveis
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
              </DialogTitle>
              <DialogDescription>
                Configure um template de mensagem para reutilização rápida
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome descritivo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo da Mensagem</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite o conteúdo do template..."
                  rows={4}
                  required
                />
                
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs text-muted-foreground mr-2">Variáveis:</span>
                  {TEMPLATE_VARIABLES.map(variable => (
                    <Badge 
                      key={variable}
                      variant="outline" 
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => insertVariable(variable)}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="urgente, vendas, suporte"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shortcuts">Atalhos (separados por vírgula)</Label>
                  <Input
                    id="shortcuts"
                    value={formData.shortcuts}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortcuts: e.target.value }))}
                    placeholder="/ola, /suporte, /venda"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_shared"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_shared: e.target.checked }))}
                  />
                  <Label htmlFor="is_shared">Compartilhar com a equipe</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="priority">Prioridade:</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    className="w-20"
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingTemplate(null);
                  setFormData({
                    name: '',
                    content: '',
                    category: 'general',
                    tags: '',
                    shortcuts: '',
                    priority: 0,
                    is_shared: false
                  });
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.icon} {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(template.category)}</span>
                  <div>
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {getCategoryLabel(template.category)}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {template.is_shared && <Share className="h-3 w-3 text-blue-500" />}
                  {template.priority > 5 && <Star className="h-3 w-3 text-yellow-500" />}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {template.content}
              </p>
              
              {template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{template.usage_count} usos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(template.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <Button
                  size="sm"
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 mr-2"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Usar
                </Button>
                
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro template para começar'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}