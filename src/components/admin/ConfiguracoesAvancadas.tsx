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
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  Plus, 
  Edit, 
  History, 
  Building2, 
  Globe, 
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConfiguracaoSistema {
  id: string;
  chave: string;
  valor: any;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  categoria: string;
  descricao: string;
  valor_padrao: any;
  empresa_id?: string;
  empresa_nome?: string;
  created_at: string;
  updated_at: string;
}

interface HistoricoAlteracao {
  id: string;
  configuracao_id: string;
  configuracao_chave: string;
  valor_anterior: any;
  valor_novo: any;
  usuario_id: string;
  usuario_nome: string;
  empresa_id?: string;
  empresa_nome?: string;
  timestamp: string;
  motivo?: string;
}

interface ConfiguracaoPadrao {
  chave: string;
  valor: any;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  categoria: string;
  descricao: string;
}

const CONFIGURACOES_PADRAO: ConfiguracaoPadrao[] = [
  // Configurações Gerais
  {
    chave: 'sistema.timeout_sessao',
    valor: 3600,
    tipo: 'number',
    categoria: 'Geral',
    descricao: 'Tempo limite de sessão em segundos'
  },
  {
    chave: 'sistema.max_usuarios_simultaneos',
    valor: 50,
    tipo: 'number',
    categoria: 'Geral',
    descricao: 'Máximo de usuários simultâneos por empresa'
  },
  {
    chave: 'sistema.modo_manutencao',
    valor: false,
    tipo: 'boolean',
    categoria: 'Geral',
    descricao: 'Ativar modo de manutenção'
  },
  
  // Atendimento
  {
    chave: 'atendimento.auto_distribuicao',
    valor: true,
    tipo: 'boolean',
    categoria: 'Atendimento',
    descricao: 'Distribuição automática de conversas'
  },
  {
    chave: 'atendimento.tempo_resposta_sla',
    valor: 300,
    tipo: 'number',
    categoria: 'Atendimento',
    descricao: 'SLA de tempo de resposta em segundos'
  },
  {
    chave: 'atendimento.max_conversas_agente',
    valor: 5,
    tipo: 'number',
    categoria: 'Atendimento',
    descricao: 'Máximo de conversas simultâneas por agente'
  },
  
  // WhatsApp
  {
    chave: 'whatsapp.webhook_retry_tentativas',
    valor: 3,
    tipo: 'number',
    categoria: 'WhatsApp',
    descricao: 'Número de tentativas para webhooks'
  },
  {
    chave: 'whatsapp.webhook_timeout',
    valor: 30,
    tipo: 'number',
    categoria: 'WhatsApp',
    descricao: 'Timeout para webhooks em segundos'
  },
  
  // ChatBot
  {
    chave: 'chatbot.timeout_resposta',
    valor: 30,
    tipo: 'number',
    categoria: 'ChatBot',
    descricao: 'Timeout para respostas do chatbot em segundos'
  },
  {
    chave: 'chatbot.fallback_humano',
    valor: true,
    tipo: 'boolean',
    categoria: 'ChatBot',
    descricao: 'Transferir para humano quando chatbot falha'
  },
  
  // Notificações
  {
    chave: 'notificacoes.email_admin',
    valor: 'admin@empresa.com',
    tipo: 'string',
    categoria: 'Notificações',
    descricao: 'Email do administrador para notificações'
  },
  {
    chave: 'notificacoes.alertas_sistema',
    valor: true,
    tipo: 'boolean',
    categoria: 'Notificações',
    descricao: 'Enviar alertas de sistema por email'
  }
];

export default function ConfiguracoesAvancadas() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoSistema[]>([]);
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('padrao');
  const [categoria, setCategoria] = useState<string>('all');
  const [novaConfigOpen, setNovaConfigOpen] = useState(false);
  
  const { toast } = useToast();

  const [novaConfig, setNovaConfig] = useState({
    chave: '',
    valor: '',
    tipo: 'string' as const,
    categoria: '',
    descricao: ''
  });

  useEffect(() => {
    loadEmpresas();
    loadConfiguracoes();
    loadHistorico();
  }, [empresaSelecionada]);

  const loadEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadConfiguracoes = async () => {
    try {
      setLoading(true);
      
      // Simular configurações do sistema
      const configsSimuladas: ConfiguracaoSistema[] = CONFIGURACOES_PADRAO.map((config, index) => ({
        id: `config_${index}`,
        chave: config.chave,
        valor: config.valor,
        tipo: config.tipo,
        categoria: config.categoria,
        descricao: config.descricao,
        valor_padrao: config.valor,
        empresa_id: empresaSelecionada === 'padrao' ? undefined : empresaSelecionada,
        empresa_nome: empresaSelecionada === 'padrao' ? undefined : 
          empresas.find(e => e.id === empresaSelecionada)?.nome,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      setConfiguracoes(configsSimuladas);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistorico = async () => {
    try {
      // Simular histórico de alterações
      const historicoSimulado: HistoricoAlteracao[] = [
        {
          id: '1',
          configuracao_id: 'config_0',
          configuracao_chave: 'sistema.timeout_sessao',
          valor_anterior: 1800,
          valor_novo: 3600,
          usuario_id: 'user1',
          usuario_nome: 'Admin Sistema',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          motivo: 'Aumentar tempo de sessão conforme solicitação dos usuários'
        },
        {
          id: '2',
          configuracao_id: 'config_3',
          configuracao_chave: 'atendimento.auto_distribuicao',
          valor_anterior: false,
          valor_novo: true,
          usuario_id: 'user2',
          usuario_nome: 'Gerente TI',
          empresa_id: 'emp1',
          empresa_nome: 'Empresa A',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          motivo: 'Habilitar distribuição automática para melhorar eficiência'
        }
      ];

      setHistorico(historicoSimulado);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const salvarConfiguracao = async (configId: string, novoValor: any, motivo?: string) => {
    try {
      setSalvando(true);
      
      const config = configuracoes.find(c => c.id === configId);
      if (!config) return;

      // Adicionar ao histórico
      const novaAlteracao: HistoricoAlteracao = {
        id: Date.now().toString(),
        configuracao_id: configId,
        configuracao_chave: config.chave,
        valor_anterior: config.valor,
        valor_novo: novoValor,
        usuario_id: 'current_user',
        usuario_nome: 'Usuário Atual',
        empresa_id: config.empresa_id,
        empresa_nome: config.empresa_nome,
        timestamp: new Date().toISOString(),
        motivo
      };

      setHistorico(prev => [novaAlteracao, ...prev]);

      // Atualizar configuração
      setConfiguracoes(prev => prev.map(c => 
        c.id === configId 
          ? { ...c, valor: novoValor, updated_at: new Date().toISOString() }
          : c
      ));

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const criarConfiguracaoPadrao = async () => {
    try {
      if (!novaConfig.chave || !novaConfig.descricao) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      const novaConfigCompleta: ConfiguracaoSistema = {
        id: `config_new_${Date.now()}`,
        chave: novaConfig.chave,
        valor: converterValor(novaConfig.valor, novaConfig.tipo),
        tipo: novaConfig.tipo,
        categoria: novaConfig.categoria,
        descricao: novaConfig.descricao,
        valor_padrao: converterValor(novaConfig.valor, novaConfig.tipo),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setConfiguracoes(prev => [...prev, novaConfigCompleta]);
      setNovaConfigOpen(false);
      setNovaConfig({
        chave: '',
        valor: '',
        tipo: 'string',
        categoria: '',
        descricao: ''
      });

      toast({
        title: "Sucesso",
        description: "Nova configuração padrão criada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar nova configuração",
        variant: "destructive",
      });
    }
  };

  const converterValor = (valor: string, tipo: string) => {
    switch (tipo) {
      case 'number':
        return Number(valor) || 0;
      case 'boolean':
        return valor === 'true';
      case 'json':
        try {
          return JSON.parse(valor);
        } catch {
          return {};
        }
      default:
        return valor;
    }
  };

  const formatarValor = (valor: any, tipo: string) => {
    switch (tipo) {
      case 'boolean':
        return valor.toString();
      case 'json':
        return JSON.stringify(valor, null, 2);
      default:
        return String(valor);
    }
  };

  const configsFiltered = configuracoes.filter(config => {
    const matchCategoria = !categoria || categoria === 'all' || config.categoria === categoria;
    const matchEmpresa = empresaSelecionada === 'padrao' 
      ? !config.empresa_id 
      : config.empresa_id === empresaSelecionada;
    
    return matchCategoria && matchEmpresa;
  });

  const categorias = [...new Set(configuracoes.map(c => c.categoria))];

  const ConfigField = ({ config }: { config: ConfiguracaoSistema }) => {
    const [valor, setValor] = useState(formatarValor(config.valor, config.tipo));
    const [editando, setEditando] = useState(false);

    const handleSave = () => {
      const novoValor = converterValor(valor, config.tipo);
      salvarConfiguracao(config.id, novoValor);
      setEditando(false);
    };

    const handleCancel = () => {
      setValor(formatarValor(config.valor, config.tipo));
      setEditando(false);
    };

    if (config.tipo === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.valor}
            onCheckedChange={(checked) => salvarConfiguracao(config.id, checked)}
          />
          <Label>{config.valor ? 'Ativado' : 'Desativado'}</Label>
        </div>
      );
    }

    if (editando) {
      return (
        <div className="space-y-2">
          {config.tipo === 'json' ? (
            <Textarea
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="font-mono text-sm"
              rows={4}
            />
          ) : (
            <Input
              type={config.tipo === 'number' ? 'number' : 'text'}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={salvando}>
              <Save className="w-3 h-3 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {config.tipo === 'json' ? (
            <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(config.valor, null, 2)}
            </pre>
          ) : (
            <span className="font-medium">{String(config.valor)}</span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
          <Edit className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="configuracoes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuracoes">Configurações do Sistema</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Alterações</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracoes">
          <div className="space-y-6">
            {/* Filtros e Controles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Configurações Avançadas do Sistema</CardTitle>
                    <CardDescription>
                      Gerencie configurações padrão e específicas por empresa
                    </CardDescription>
                  </div>
                  <Dialog open={novaConfigOpen} onOpenChange={setNovaConfigOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Configuração
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Nova Configuração Padrão</DialogTitle>
                        <DialogDescription>
                          Adicione uma nova configuração que será aplicada por padrão a todas as empresas
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Chave da Configuração</Label>
                          <Input
                            value={novaConfig.chave}
                            onChange={(e) => setNovaConfig({...novaConfig, chave: e.target.value})}
                            placeholder="categoria.nome_configuracao"
                          />
                        </div>
                        <div>
                          <Label>Categoria</Label>
                          <Input
                            value={novaConfig.categoria}
                            onChange={(e) => setNovaConfig({...novaConfig, categoria: e.target.value})}
                            placeholder="Geral"
                          />
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Select 
                            value={novaConfig.tipo} 
                            onValueChange={(value: any) => setNovaConfig({...novaConfig, tipo: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="string">Texto</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="boolean">Verdadeiro/Falso</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Valor Padrão</Label>
                          <Input
                            value={novaConfig.valor}
                            onChange={(e) => setNovaConfig({...novaConfig, valor: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Descrição</Label>
                          <Textarea
                            value={novaConfig.descricao}
                            onChange={(e) => setNovaConfig({...novaConfig, descricao: e.target.value})}
                            placeholder="Descreva o que esta configuração controla"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setNovaConfigOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={criarConfiguracaoPadrao}>
                            Criar Configuração
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Empresa</Label>
                    <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="padrao">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Configurações Padrão
                          </div>
                        </SelectItem>
                        {empresas.map(empresa => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {empresa.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label>Categoria</Label>
                    <Select value={categoria} onValueChange={setCategoria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        {categorias.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadConfiguracoes} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações por Categoria */}
            <div className="space-y-6">
              {categorias
                .filter(cat => !categoria || categoria === 'all' || cat === categoria)
                .map(cat => {
                  const configsCategoria = configsFiltered.filter(c => c.categoria === cat);
                  if (configsCategoria.length === 0) return null;

                  return (
                    <Card key={cat}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          {cat}
                        </CardTitle>
                        <CardDescription>
                          Configurações da categoria {cat}
                          {empresaSelecionada !== 'padrao' && (
                            <Badge variant="outline" className="ml-2">
                              Específico para {empresas.find(e => e.id === empresaSelecionada)?.nome}
                            </Badge>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {configsCategoria.map(config => (
                            <div key={config.id} className="border rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label className="font-medium">{config.chave}</Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {config.descricao}
                                  </p>
                                  <Badge variant="secondary" className="mt-2">
                                    {config.tipo}
                                  </Badge>
                                </div>
                                <div className="md:col-span-2">
                                  <ConfigField config={config} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Alterações
              </CardTitle>
              <CardDescription>
                Registro completo de todas as modificações nas configurações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Configuração</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Alteração</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 rounded">
                          {item.configuracao_chave}
                        </code>
                      </TableCell>
                      <TableCell>
                        {item.empresa_nome ? (
                          <Badge variant="outline">{item.empresa_nome}</Badge>
                        ) : (
                          <Badge variant="secondary">Padrão</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.usuario_nome}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-600">De:</span>
                            <code className="bg-red-50 px-1 rounded text-xs">
                              {String(item.valor_anterior)}
                            </code>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">Para:</span>
                            <code className="bg-green-50 px-1 rounded text-xs">
                              {String(item.valor_novo)}
                            </code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.motivo ? (
                          <p className="text-sm text-muted-foreground">{item.motivo}</p>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}