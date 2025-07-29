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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Shield, Clock, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PerfilPermissao {
  id: string;
  nome: string;
  descricao: string;
  permissoes: string[];
  ativo: boolean;
  created_at: string;
}

interface LogAuditoria {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  usuario_nome?: string;
  usuario_email?: string;
}

const PERMISSOES_DISPONIVEIS = [
  { id: 'atendimento', label: 'Gestão de Atendimento', grupo: 'Operacional' },
  { id: 'contatos', label: 'Gestão de Contatos', grupo: 'Operacional' },
  { id: 'chatbot', label: 'Configuração de ChatBot', grupo: 'Configuração' },
  { id: 'automacao', label: 'Automações', grupo: 'Configuração' },
  { id: 'relatorios', label: 'Relatórios', grupo: 'Análise' },
  { id: 'usuarios', label: 'Gestão de Usuários', grupo: 'Administrativo' },
  { id: 'setores', label: 'Gestão de Setores', grupo: 'Administrativo' },
  { id: 'whatsapp', label: 'Configurações WhatsApp', grupo: 'Integrações' },
  { id: 'evolution', label: 'Configurações Evolution API', grupo: 'Integrações' },
  { id: 'n8n', label: 'Configurações N8N', grupo: 'Integrações' },
  { id: 'chat_interno', label: 'Chat Interno', grupo: 'Operacional' },
  { id: 'kanban', label: 'Kanban', grupo: 'Operacional' },
  { id: 'api', label: 'Acesso à API', grupo: 'Técnico' },
  { id: 'logs', label: 'Visualizar Logs', grupo: 'Administrativo' },
  { id: 'super_admin', label: 'Super Administrador', grupo: 'Sistema' }
];

export default function PermissoesAvancadas() {
  const [perfis, setPerfis] = useState<PerfilPermissao[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoPerfilOpen, setNovoPerfilOpen] = useState(false);
  const [editarPerfilOpen, setEditarPerfilOpen] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilPermissao | null>(null);
  
  // Filtros para logs
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [filtroTabela, setFiltroTabela] = useState('');
  const [usuarios, setUsuarios] = useState<Array<{ id: string; nome: string; email: string }>>([]);

  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    permissoes: [] as string[],
    ativo: true
  });

  useEffect(() => {
    loadPerfis();
    loadLogs();
    loadUsuarios();
  }, []);

  const loadPerfis = async () => {
    try {
      // Por enquanto, vamos simular os perfis já que não temos a tabela criada
      const perfisSimulados: PerfilPermissao[] = [
        {
          id: '1',
          nome: 'Supervisor Atendimento',
          descricao: 'Pode gerenciar atendimentos e visualizar relatórios',
          permissoes: ['atendimento', 'contatos', 'relatorios', 'chat_interno'],
          ativo: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          nome: 'Técnico Integrações',
          descricao: 'Responsável por configurar integrações e APIs',
          permissoes: ['whatsapp', 'evolution', 'n8n', 'api', 'automacao'],
          ativo: true,
          created_at: new Date().toISOString()
        }
      ];
      
      setPerfis(perfisSimulados);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Buscar informações dos usuários para os logs
      const userIds = [...new Set(data?.map(log => log.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', userIds);

        const logsComUsuarios = data?.map(log => {
          const usuario = usuarios?.find(u => u.id === log.user_id);
          return {
            ...log,
            ip_address: String(log.ip_address || ''),
            usuario_nome: usuario?.nome,
            usuario_email: usuario?.email
          };
        }) || [];

        setLogs(logsComUsuarios);
      } else {
        setLogs(data?.map(log => ({ ...log, ip_address: String(log.ip_address || '') })) || []);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSubmitPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulação - em um caso real, salvaria no banco
    const novoPerfil: PerfilPermissao = {
      id: Date.now().toString(),
      ...formData,
      created_at: new Date().toISOString()
    };

    if (perfilSelecionado) {
      setPerfis(prev => prev.map(p => p.id === perfilSelecionado.id ? { ...novoPerfil, id: perfilSelecionado.id } : p));
      toast({
        title: "Sucesso",
        description: "Perfil de permissão atualizado com sucesso",
      });
    } else {
      setPerfis(prev => [...prev, novoPerfil]);
      toast({
        title: "Sucesso",
        description: "Perfil de permissão criado com sucesso",
      });
    }

    setNovoPerfilOpen(false);
    setEditarPerfilOpen(false);
    resetForm();
  };

  const handleEditPerfil = (perfil: PerfilPermissao) => {
    setPerfilSelecionado(perfil);
    setFormData({
      nome: perfil.nome,
      descricao: perfil.descricao,
      permissoes: perfil.permissoes,
      ativo: perfil.ativo
    });
    setEditarPerfilOpen(true);
  };

  const handleDeletePerfil = (perfilId: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil?')) return;
    
    setPerfis(prev => prev.filter(p => p.id !== perfilId));
    toast({
      title: "Sucesso",
      description: "Perfil de permissão excluído com sucesso",
    });
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      permissoes: [],
      ativo: true
    });
    setPerfilSelecionado(null);
  };

  const formatLogValue = (value: any) => {
    if (!value) return '-';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getAcaoBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'insert': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      default: return 'outline';
    }
  };

  const logsFilterados = logs.filter(log => {
    const matchUsuario = !filtroUsuario || 
      log.usuario_nome?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
      log.usuario_email?.toLowerCase().includes(filtroUsuario.toLowerCase());
    
    const matchAcao = !filtroAcao || log.action.toLowerCase().includes(filtroAcao.toLowerCase());
    const matchTabela = !filtroTabela || log.table_name.toLowerCase().includes(filtroTabela.toLowerCase());
    
    return matchUsuario && matchAcao && matchTabela;
  });

  const PerfilForm = () => (
    <form onSubmit={handleSubmitPerfil} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome">Nome do Perfil</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="ativo"
            checked={formData.ativo}
            onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
          />
          <Label htmlFor="ativo">Perfil Ativo</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Descreva as responsabilidades deste perfil"
        />
      </div>

      <div className="space-y-4">
        <Label>Permissões</Label>
        <div className="space-y-4">
          {Object.entries(
            PERMISSOES_DISPONIVEIS.reduce((grupos, permissao) => {
              if (!grupos[permissao.grupo]) {
                grupos[permissao.grupo] = [];
              }
              grupos[permissao.grupo].push(permissao);
              return grupos;
            }, {} as Record<string, typeof PERMISSOES_DISPONIVEIS>)
          ).map(([grupo, permissoes]) => (
            <div key={grupo} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">{grupo}</h4>
              <div className="grid grid-cols-2 gap-2">
                {permissoes.map((permissao) => (
                  <div key={permissao.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permissao.id}
                      checked={formData.permissoes.includes(permissao.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ 
                            ...formData, 
                            permissoes: [...formData.permissoes, permissao.id] 
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            permissoes: formData.permissoes.filter(p => p !== permissao.id) 
                          });
                        }
                      }}
                    />
                    <Label htmlFor={permissao.id} className="text-sm">
                      {permissao.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => {
          setNovoPerfilOpen(false);
          setEditarPerfilOpen(false);
          resetForm();
        }}>
          Cancelar
        </Button>
        <Button type="submit">
          {perfilSelecionado ? 'Atualizar' : 'Criar'} Perfil
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="perfis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="perfis">Perfis de Permissão</TabsTrigger>
          <TabsTrigger value="logs">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="perfis">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Perfis de Permissão Customizáveis</CardTitle>
                  <CardDescription>
                    Crie perfis personalizados com combinações específicas de permissões
                  </CardDescription>
                </div>
                <Dialog open={novoPerfilOpen} onOpenChange={setNovoPerfilOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Perfil
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Perfil de Permissão</DialogTitle>
                      <DialogDescription>
                        Configure um perfil customizado com permissões específicas
                      </DialogDescription>
                    </DialogHeader>
                    <PerfilForm />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {perfis.map((perfil) => (
                  <Card key={perfil.id} className={`${!perfil.ativo ? 'opacity-60' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{perfil.nome}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditPerfil(perfil)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeletePerfil(perfil.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {perfil.descricao && (
                        <CardDescription>{perfil.descricao}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{perfil.permissoes.length} permissões</span>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Permissões incluídas:</h5>
                          <div className="flex flex-wrap gap-1">
                            {perfil.permissoes.slice(0, 4).map(permissaoId => {
                              const permissao = PERMISSOES_DISPONIVEIS.find(p => p.id === permissaoId);
                              return permissao ? (
                                <Badge key={permissaoId} variant="secondary" className="text-xs">
                                  {permissao.label}
                                </Badge>
                              ) : null;
                            })}
                            {perfil.permissoes.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{perfil.permissoes.length - 4} mais
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 text-xs text-muted-foreground">
                          Criado em {format(new Date(perfil.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                Histórico completo de ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="filtro-usuario">Usuário</Label>
                  <Input
                    id="filtro-usuario"
                    placeholder="Filtrar por nome ou email..."
                    value={filtroUsuario}
                    onChange={(e) => setFiltroUsuario(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="filtro-acao">Ação</Label>
                  <Select value={filtroAcao} onValueChange={setFiltroAcao}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as ações</SelectItem>
                      <SelectItem value="INSERT">Inserção</SelectItem>
                      <SelectItem value="UPDATE">Atualização</SelectItem>
                      <SelectItem value="DELETE">Exclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="filtro-tabela">Tabela</Label>
                  <Input
                    id="filtro-tabela"
                    placeholder="Filtrar por tabela..."
                    value={filtroTabela}
                    onChange={(e) => setFiltroTabela(e.target.value)}
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsFilterados.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.usuario_nome || 'Sistema'}</div>
                          <div className="text-sm text-muted-foreground">{log.usuario_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAcaoBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 rounded">{log.table_name}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">{log.record_id.slice(0, 8)}...</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{log.ip_address || '-'}</code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {logsFilterados.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado com os filtros aplicados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editarPerfilOpen} onOpenChange={setEditarPerfilOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Perfil de Permissão</DialogTitle>
            <DialogDescription>
              Modifique as permissões do perfil selecionado
            </DialogDescription>
          </DialogHeader>
          <PerfilForm />
        </DialogContent>
      </Dialog>
    </div>
  );
}