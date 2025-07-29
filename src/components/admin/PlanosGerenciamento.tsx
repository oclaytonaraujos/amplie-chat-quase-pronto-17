import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Users, Database, MessageCircle, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco_mensal: number;
  limite_usuarios: number;
  limite_armazenamento_gb: number;
  limite_contatos: number;
  pode_usar_chatbot: boolean;
  pode_usar_kanban: boolean;
  pode_usar_api: boolean;
  pode_usar_chat_interno: boolean;
  pode_usar_automacao: boolean;
  pode_usar_relatorios: boolean;
  ativo: boolean;
  created_at: string;
}

interface EmpresaConsumo {
  id: string;
  nome: string;
  plano_nome: string;
  usuarios_usados: number;
  usuarios_limite: number;
  contatos_usados: number;
  contatos_limite: number;
  armazenamento_usado: number;
  armazenamento_limite: number;
  ativo: boolean;
}

export default function PlanosGerenciamento() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [empresasConsumo, setEmpresasConsumo] = useState<EmpresaConsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoPlanoOpen, setNovoPlanoOpen] = useState(false);
  const [editarPlanoOpen, setEditarPlanoOpen] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco_mensal: 0,
    limite_usuarios: 10,
    limite_armazenamento_gb: 5,
    limite_contatos: 1000,
    pode_usar_chatbot: false,
    pode_usar_kanban: true,
    pode_usar_api: false,
    pode_usar_chat_interno: true,
    pode_usar_automacao: false,
    pode_usar_relatorios: false,
    ativo: true
  });

  useEffect(() => {
    loadPlanos();
    loadEmpresasConsumo();
  }, []);

  const loadPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('preco_mensal');

      if (error) throw error;
      setPlanos(data || []);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmpresasConsumo = async () => {
    try {
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select(`
          id, nome, ativo,
          limite_usuarios, limite_contatos, limite_armazenamento_gb,
          planos(nome),
          profiles(count),
          contatos(count)
        `);

      if (error) throw error;

      const empresasFormatadas: EmpresaConsumo[] = empresas?.map(empresa => ({
        id: empresa.id,
        nome: empresa.nome,
        plano_nome: empresa.planos?.nome || 'Sem plano',
        usuarios_usados: empresa.profiles?.length || 0,
        usuarios_limite: empresa.limite_usuarios || 0,
        contatos_usados: empresa.contatos?.length || 0,
        contatos_limite: empresa.limite_contatos || 0,
        armazenamento_usado: Math.round(Math.random() * empresa.limite_armazenamento_gb), // Placeholder
        armazenamento_limite: empresa.limite_armazenamento_gb || 0,
        ativo: empresa.ativo || false
      })) || [];

      setEmpresasConsumo(empresasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar consumo das empresas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (planoSelecionado) {
        // Atualizar plano existente
        const { error } = await supabase
          .from('planos')
          .update(formData)
          .eq('id', planoSelecionado.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Plano atualizado com sucesso",
        });
      } else {
        // Criar novo plano
        const { error } = await supabase
          .from('planos')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Plano criado com sucesso",
        });
      }

      await loadPlanos();
      setNovoPlanoOpen(false);
      setEditarPlanoOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar plano",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plano: Plano) => {
    setPlanoSelecionado(plano);
    setFormData({
      nome: plano.nome,
      descricao: plano.descricao || '',
      preco_mensal: plano.preco_mensal,
      limite_usuarios: plano.limite_usuarios,
      limite_armazenamento_gb: plano.limite_armazenamento_gb,
      limite_contatos: plano.limite_contatos,
      pode_usar_chatbot: plano.pode_usar_chatbot,
      pode_usar_kanban: plano.pode_usar_kanban,
      pode_usar_api: plano.pode_usar_api,
      pode_usar_chat_interno: plano.pode_usar_chat_interno,
      pode_usar_automacao: plano.pode_usar_automacao,
      pode_usar_relatorios: plano.pode_usar_relatorios,
      ativo: plano.ativo
    });
    setEditarPlanoOpen(true);
  };

  const handleDelete = async (planoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const { error } = await supabase
        .from('planos')
        .delete()
        .eq('id', planoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano excluído com sucesso",
      });

      await loadPlanos();
    } catch (error) {
      console.error('Erro ao excluir plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir plano",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco_mensal: 0,
      limite_usuarios: 10,
      limite_armazenamento_gb: 5,
      limite_contatos: 1000,
      pode_usar_chatbot: false,
      pode_usar_kanban: true,
      pode_usar_api: false,
      pode_usar_chat_interno: true,
      pode_usar_automacao: false,
      pode_usar_relatorios: false,
      ativo: true
    });
    setPlanoSelecionado(null);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  const PlanForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome">Nome do Plano</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="preco">Preço Mensal (R$)</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            value={formData.preco_mensal}
            onChange={(e) => setFormData({ ...formData, preco_mensal: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="usuarios">Limite de Usuários</Label>
          <Input
            id="usuarios"
            type="number"
            value={formData.limite_usuarios}
            onChange={(e) => setFormData({ ...formData, limite_usuarios: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="contatos">Limite de Contatos</Label>
          <Input
            id="contatos"
            type="number"
            value={formData.limite_contatos}
            onChange={(e) => setFormData({ ...formData, limite_contatos: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="armazenamento">Armazenamento (GB)</Label>
          <Input
            id="armazenamento"
            type="number"
            value={formData.limite_armazenamento_gb}
            onChange={(e) => setFormData({ ...formData, limite_armazenamento_gb: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label>Funcionalidades Incluídas</Label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'pode_usar_chatbot', label: 'ChatBot' },
            { key: 'pode_usar_kanban', label: 'Kanban' },
            { key: 'pode_usar_api', label: 'API' },
            { key: 'pode_usar_chat_interno', label: 'Chat Interno' },
            { key: 'pode_usar_automacao', label: 'Automação' },
            { key: 'pode_usar_relatorios', label: 'Relatórios' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Switch
                id={key}
                checked={formData[key as keyof typeof formData] as boolean}
                onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked })}
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="ativo"
          checked={formData.ativo}
          onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
        />
        <Label htmlFor="ativo">Plano Ativo</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => {
          setNovoPlanoOpen(false);
          setEditarPlanoOpen(false);
          resetForm();
        }}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {planoSelecionado ? 'Atualizar' : 'Criar'} Plano
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="planos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="planos">Gerenciar Planos</TabsTrigger>
          <TabsTrigger value="consumo">Consumo por Empresa</TabsTrigger>
        </TabsList>

        <TabsContent value="planos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Planos Disponíveis</CardTitle>
                  <CardDescription>Gerencie os planos e suas funcionalidades</CardDescription>
                </div>
                <Dialog open={novoPlanoOpen} onOpenChange={setNovoPlanoOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Plano
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Plano</DialogTitle>
                      <DialogDescription>
                        Configure um novo plano com limites e funcionalidades específicas
                      </DialogDescription>
                    </DialogHeader>
                    <PlanForm />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {planos.map((plano) => (
                  <Card key={plano.id} className={`relative ${!plano.ativo ? 'opacity-60' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plano.nome}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(plano)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(plano.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-primary">
                        R$ {plano.preco_mensal.toFixed(2)}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </div>
                      {plano.descricao && (
                        <CardDescription>{plano.descricao}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{plano.limite_usuarios} usuários</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{plano.limite_contatos.toLocaleString()} contatos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{plano.limite_armazenamento_gb} GB</span>
                        </div>
                        
                        <div className="pt-2 space-y-1">
                          {[
                            { key: 'pode_usar_chatbot', label: 'ChatBot' },
                            { key: 'pode_usar_api', label: 'API' },
                            { key: 'pode_usar_automacao', label: 'Automação' },
                            { key: 'pode_usar_relatorios', label: 'Relatórios' }
                          ].map(({ key, label }) => (
                            plano[key as keyof Plano] && (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {label}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    {!plano.ativo && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">Inativo</Badge>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consumo">
          <Card>
            <CardHeader>
              <CardTitle>Consumo de Recursos por Empresa</CardTitle>
              <CardDescription>
                Monitore o uso de recursos de cada empresa em relação aos limites do plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Contatos</TableHead>
                    <TableHead>Armazenamento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresasConsumo.map((empresa) => {
                    const usuariosPct = (empresa.usuarios_usados / empresa.usuarios_limite) * 100;
                    const contatosPct = (empresa.contatos_usados / empresa.contatos_limite) * 100;
                    const armazenamentoPct = (empresa.armazenamento_usado / empresa.armazenamento_limite) * 100;

                    return (
                      <TableRow key={empresa.id}>
                        <TableCell className="font-medium">{empresa.nome}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{empresa.plano_nome}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{empresa.usuarios_usados}/{empresa.usuarios_limite}</span>
                              <span>{Math.round(usuariosPct)}%</span>
                            </div>
                            <Progress value={usuariosPct} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{empresa.contatos_usados.toLocaleString()}/{empresa.contatos_limite.toLocaleString()}</span>
                              <span>{Math.round(contatosPct)}%</span>
                            </div>
                            <Progress value={contatosPct} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{empresa.armazenamento_usado}GB/{empresa.armazenamento_limite}GB</span>
                              <span>{Math.round(armazenamentoPct)}%</span>
                            </div>
                            <Progress value={armazenamentoPct} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={empresa.ativo ? "default" : "secondary"}>
                            {empresa.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editarPlanoOpen} onOpenChange={setEditarPlanoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Modifique os limites e funcionalidades do plano
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}