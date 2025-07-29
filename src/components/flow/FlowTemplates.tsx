import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Layout, 
  Search, 
  Download, 
  Eye, 
  Star, 
  Clock, 
  MessageSquare,
  Users,
  ShoppingCart,
  Headphones,
  Calendar,
  FileText,
  Zap,
  X
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'atendimento' | 'vendas' | 'suporte' | 'agendamento' | 'pesquisa' | 'outros';
  tags: string[];
  nodes: Node[];
  edges: Edge[];
  estimatedTime: number; // em minutos
  complexity: 'simples' | 'medio' | 'avancado';
  author: {
    name: string;
    avatar?: string;
  };
  rating: number;
  usageCount: number;
  lastUpdated: Date;
  preview?: string; // URL da imagem de preview
  features: string[];
  isCustom?: boolean;
  isPremium?: boolean;
}

interface FlowTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: FlowTemplate) => void;
  onSaveAsTemplate: (nodes: Node[], edges: Edge[], flowName: string) => void;
  customTemplates: FlowTemplate[];
}

const categoryIcons = {
  atendimento: MessageSquare,
  vendas: ShoppingCart,
  suporte: Headphones,
  agendamento: Calendar,
  pesquisa: FileText,
  outros: Zap
};

const categoryColors = {
  atendimento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20',
  vendas: 'bg-green-100 text-green-800 dark:bg-green-900/20',
  suporte: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20',
  agendamento: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20',
  pesquisa: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20',
  outros: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20'
};

const predefinedTemplates: FlowTemplate[] = [
  {
    id: 'welcome_basic',
    name: 'Atendimento Básico',
    description: 'Fluxo simples de boas-vindas com opções principais de atendimento',
    category: 'atendimento',
    tags: ['boas-vindas', 'menu', 'básico'],
    nodes: [],
    edges: [],
    estimatedTime: 5,
    complexity: 'simples',
    author: { name: 'Amplie Chat' },
    rating: 4.8,
    usageCount: 1250,
    lastUpdated: new Date('2024-01-15'),
    features: ['Menu principal', 'Transferência para humano', 'Horário de funcionamento'],
    isPremium: false
  },
  {
    id: 'sales_funnel',
    name: 'Funil de Vendas Completo',
    description: 'Fluxo avançado para qualificação de leads e conversão em vendas',
    category: 'vendas',
    tags: ['vendas', 'qualificação', 'lead', 'conversão'],
    nodes: [],
    edges: [],
    estimatedTime: 15,
    complexity: 'avancado',
    author: { name: 'Amplie Chat' },
    rating: 4.9,
    usageCount: 890,
    lastUpdated: new Date('2024-01-10'),
    features: ['Qualificação de leads', 'Cálculo de orçamento', 'Integração CRM', 'Follow-up automatizado'],
    isPremium: true
  },
  {
    id: 'support_ticket',
    name: 'Abertura de Chamados',
    description: 'Sistema automatizado para criação e gestão de tickets de suporte',
    category: 'suporte',
    tags: ['suporte', 'ticket', 'problema', 'solução'],
    nodes: [],
    edges: [],
    estimatedTime: 8,
    complexity: 'medio',
    author: { name: 'Amplie Chat' },
    rating: 4.7,
    usageCount: 645,
    lastUpdated: new Date('2024-01-12'),
    features: ['Categorização de problemas', 'Priorização automática', 'Base de conhecimento', 'Escalação'],
    isPremium: false
  },
  {
    id: 'appointment_booking',
    name: 'Agendamento de Consultas',
    description: 'Sistema completo de agendamento com integração de calendário',
    category: 'agendamento',
    tags: ['agendamento', 'calendário', 'consulta', 'disponibilidade'],
    nodes: [],
    edges: [],
    estimatedTime: 12,
    complexity: 'avancado',
    author: { name: 'Amplie Chat' },
    rating: 4.6,
    usageCount: 423,
    lastUpdated: new Date('2024-01-08'),
    features: ['Verificação de disponibilidade', 'Confirmação por email', 'Lembretes automáticos', 'Reagendamento'],
    isPremium: true
  },
  {
    id: 'feedback_survey',
    name: 'Pesquisa de Satisfação',
    description: 'Coleta feedback dos clientes de forma automatizada e estruturada',
    category: 'pesquisa',
    tags: ['feedback', 'satisfação', 'pesquisa', 'avaliação'],
    nodes: [],
    edges: [],
    estimatedTime: 6,
    complexity: 'simples',
    author: { name: 'Amplie Chat' },
    rating: 4.5,
    usageCount: 778,
    lastUpdated: new Date('2024-01-14'),
    features: ['Escala de satisfação', 'Comentários livres', 'Análise de sentimento', 'Relatórios automáticos'],
    isPremium: false
  }
];

export function FlowTemplates({ 
  isOpen, 
  onClose, 
  onUseTemplate, 
  onSaveAsTemplate,
  customTemplates 
}: FlowTemplatesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [previewTemplate, setPreviewTemplate] = useState<FlowTemplate | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const allTemplates = [...predefinedTemplates, ...customTemplates];
  
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'todos' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'todos', name: 'Todos', count: allTemplates.length },
    { id: 'atendimento', name: 'Atendimento', count: allTemplates.filter(t => t.category === 'atendimento').length },
    { id: 'vendas', name: 'Vendas', count: allTemplates.filter(t => t.category === 'vendas').length },
    { id: 'suporte', name: 'Suporte', count: allTemplates.filter(t => t.category === 'suporte').length },
    { id: 'agendamento', name: 'Agendamento', count: allTemplates.filter(t => t.category === 'agendamento').length },
    { id: 'pesquisa', name: 'Pesquisa', count: allTemplates.filter(t => t.category === 'pesquisa').length }
  ];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simples': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'avancado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Biblioteca de Templates
                </CardTitle>
                <CardDescription>
                  Acelere seu trabalho com fluxos pré-construídos e testados
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSaveDialog(true)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Salvar como Template
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="px-6 pb-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar templates por nome, descrição ou tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-6">
                  {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.id} className="text-xs">
                      {category.name} ({category.count})
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map(template => {
                    const CategoryIcon = categoryIcons[template.category];
                    
                    return (
                      <Card key={template.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${categoryColors[template.category]}`}>
                                  <CategoryIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-sm">{template.name}</h3>
                                  {template.isPremium && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {template.estimatedTime}min
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {template.usageCount}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {template.rating}
                              </div>
                            </div>

                            {/* Complexity */}
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${getComplexityColor(template.complexity)}`}
                              >
                                {template.complexity}
                              </Badge>
                              {template.isCustom && (
                                <Badge variant="outline" className="text-xs">
                                  Personalizado
                                </Badge>
                              )}
                            </div>

                            {/* Features */}
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Recursos:</p>
                              <div className="flex flex-wrap gap-1">
                                {template.features.slice(0, 3).map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                                {template.features.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{template.features.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPreviewTemplate(template)}
                                className="gap-1 flex-1"
                              >
                                <Eye className="h-3 w-3" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => onUseTemplate(template)}
                                className="gap-1 flex-1"
                              >
                                <Download className="h-3 w-3" />
                                Usar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Nenhum template encontrado</h3>
                    <p className="text-muted-foreground text-sm">
                      Tente ajustar os filtros ou termos de busca
                    </p>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewTemplate.name}</DialogTitle>
              <DialogDescription>{previewTemplate.description}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Recursos Inclusos:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {previewTemplate.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Informações:</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Categoria:</strong> {previewTemplate.category}</p>
                    <p><strong>Complexidade:</strong> {previewTemplate.complexity}</p>
                    <p><strong>Tempo estimado:</strong> {previewTemplate.estimatedTime} minutos</p>
                    <p><strong>Autor:</strong> {previewTemplate.author.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  onUseTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}>
                  Usar Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}