import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Shield,
  Zap,
  Building2,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApiKey {
  id: string;
  nome: string;
  servico: 'openai' | 'anthropic' | 'gemini' | 'whatsapp' | 'n8n' | 'stripe' | 'custom';
  chave_mascarada: string;
  ativo: boolean;
  empresa_id?: string;
  empresa_nome?: string;
  created_at: string;
  last_used?: string;
  uso_count: number;
}

interface NovaApiKey {
  nome: string;
  servico: string;
  chave: string;
  empresa_id: string;
  escopo: 'global' | 'empresa';
}

const SERVICOS_DISPONIVEIS = [
  { value: 'openai', label: 'OpenAI / ChatGPT', icon: '🤖', color: 'bg-green-100 text-green-800' },
  { value: 'anthropic', label: 'Anthropic / Claude', icon: '🧠', color: 'bg-orange-100 text-orange-800' },
  { value: 'gemini', label: 'Google Gemini', icon: '✨', color: 'bg-blue-100 text-blue-800' },
  { value: 'whatsapp', label: 'WhatsApp Business API', icon: '📱', color: 'bg-green-100 text-green-800' },
  { value: 'n8n', label: 'n8n Automation', icon: '⚡', color: 'bg-purple-100 text-purple-800' },
  { value: 'stripe', label: 'Stripe Payments', icon: '💳', color: 'bg-blue-100 text-blue-800' },
  { value: 'custom', label: 'API Customizada', icon: '🔧', color: 'bg-gray-100 text-gray-800' }
];

export default function ApiKeysConfig() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [empresas, setEmpresas] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [filtroServico, setFiltroServico] = useState<string>('');
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('');
  const [novaKeyOpen, setNovaKeyOpen] = useState(false);
  const [editandoKey, setEditandoKey] = useState<ApiKey | null>(null);
  
  const { toast } = useToast();

  const [novaKey, setNovaKey] = useState<NovaApiKey>({
    nome: '',
    servico: 'openai',
    chave: '',
    empresa_id: '',
    escopo: 'global'
  });

  useEffect(() => {
    loadEmpresas();
    loadApiKeys();
  }, []);

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

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      
      // Simular dados de API Keys - em produção viria do Supabase
      const keysSimuladas: ApiKey[] = [
        {
          id: '1',
          nome: 'OpenAI ChatGPT - Global',
          servico: 'openai',
          chave_mascarada: 'sk-...v8Pq',
          ativo: true,
          created_at: new Date().toISOString(),
          last_used: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          uso_count: 1520
        },
        {
          id: '2',
          nome: 'WhatsApp Business - Empresa A',
          servico: 'whatsapp',
          chave_mascarada: 'EAAG...Zd3c',
          ativo: true,
          empresa_id: 'emp1',
          empresa_nome: 'Empresa A',
          created_at: new Date().toISOString(),
          last_used: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          uso_count: 2340
        },
        {
          id: '3',
          nome: 'Stripe Pagamentos',
          servico: 'stripe',
          chave_mascarada: 'sk_live_...8xM2',
          ativo: false,
          created_at: new Date().toISOString(),
          uso_count: 450
        },
        {
          id: '4',
          nome: 'N8N Automação - Empresa B',
          servico: 'n8n',
          chave_mascarada: 'n8n_...k9L1',
          ativo: true,
          empresa_id: 'emp2',
          empresa_nome: 'Empresa B',
          created_at: new Date().toISOString(),
          last_used: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          uso_count: 780
        }
      ];

      setApiKeys(keysSimuladas);
    } catch (error) {
      console.error('Erro ao carregar API Keys:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarApiKey = async () => {
    try {
      if (!novaKey.nome || !novaKey.chave) {
        toast({
          title: "Erro",
          description: "Nome e chave da API são obrigatórios",
          variant: "destructive",
        });
        return;
      }

      setSalvando(true);

      // Simular salvamento - em produção salvaria no Supabase de forma segura
      const novaApiKey: ApiKey = {
        id: Date.now().toString(),
        nome: novaKey.nome,
        servico: novaKey.servico as any,
        chave_mascarada: `${novaKey.chave.substring(0, 6)}...${novaKey.chave.slice(-4)}`,
        ativo: true,
        empresa_id: novaKey.escopo === 'empresa' ? novaKey.empresa_id : undefined,
        empresa_nome: novaKey.escopo === 'empresa' 
          ? empresas.find(e => e.id === novaKey.empresa_id)?.nome 
          : undefined,
        created_at: new Date().toISOString(),
        uso_count: 0
      };

      setApiKeys(prev => [novaApiKey, ...prev]);
      setNovaKeyOpen(false);
      setNovaKey({
        nome: '',
        servico: 'openai',
        chave: '',
        empresa_id: '',
        escopo: 'global'
      });

      toast({
        title: "Sucesso",
        description: "API Key configurada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar API Key:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar API Key",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const toggleApiKeyStatus = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, ativo: !key.ativo }
          : key
      ));

      toast({
        title: "Sucesso",
        description: "Status da API Key atualizado",
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da API Key",
        variant: "destructive",
      });
    }
  };

  const excluirApiKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      toast({
        title: "Sucesso",
        description: "API Key removida com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir API Key:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir API Key",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (keyId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const getServicoBadge = (servico: string) => {
    const config = SERVICOS_DISPONIVEIS.find(s => s.value === servico);
    if (!config) return <Badge variant="outline">{servico}</Badge>;

    return (
      <Badge className={config.color}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    );
  };

  const keysFiltered = apiKeys.filter(key => {
    const matchServico = !filtroServico || key.servico === filtroServico;
    const matchEmpresa = !filtroEmpresa || 
      (filtroEmpresa === 'global' ? !key.empresa_id : key.empresa_id === filtroEmpresa);
    
    return matchServico && matchEmpresa;
  });

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
      <Tabs defaultValue="configuracao" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuracao">Configuração de APIs</TabsTrigger>
          <TabsTrigger value="monitoramento">Monitoramento de Uso</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança e Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <div className="space-y-6">
            {/* Header e Controles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      Gerenciamento de API Keys
                    </CardTitle>
                    <CardDescription>
                      Configure e gerencie todas as chaves de API do sistema
                    </CardDescription>
                  </div>
                  <Button onClick={() => setNovaKeyOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova API Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label>Filtrar por Serviço</Label>
                    <select 
                      className="w-full p-2 border rounded-md" 
                      value={filtroServico} 
                      onChange={(e) => setFiltroServico(e.target.value)}
                    >
                      <option value="">Todos os serviços</option>
                      {SERVICOS_DISPONIVEIS.map(servico => (
                        <option key={servico.value} value={servico.value}>
                          {servico.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label>Filtrar por Escopo</Label>
                    <select 
                      className="w-full p-2 border rounded-md" 
                      value={filtroEmpresa} 
                      onChange={(e) => setFiltroEmpresa(e.target.value)}
                    >
                      <option value="">Todos os escopos</option>
                      <option value="global">Global (Todas as empresas)</option>
                      {empresas.map(empresa => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={loadApiKeys} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de API Keys */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Chave</TableHead>
                      <TableHead>Escopo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Uso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keysFiltered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma API Key configurada
                        </TableCell>
                      </TableRow>
                    ) : (
                      keysFiltered.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-medium">{key.nome}</TableCell>
                          <TableCell>{getServicoBadge(key.servico)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {showPasswords[key.id] ? 'sk-1234567890abcdef...' : key.chave_mascarada}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(key.id)}
                              >
                                {showPasswords[key.id] ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {key.empresa_id ? (
                              <Badge variant="outline">
                                <Building2 className="h-3 w-3 mr-1" />
                                {key.empresa_nome}
                              </Badge>
                            ) : (
                              <Badge>
                                <Globe className="h-3 w-3 mr-1" />
                                Global
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={key.ativo}
                                onCheckedChange={() => toggleApiKeyStatus(key.id)}
                              />
                              <Badge variant={key.ativo ? "default" : "secondary"}>
                                {key.ativo ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {key.last_used ? (
                              <div className="text-sm">
                                {format(new Date(key.last_used), 'dd/MM/yy HH:mm', { locale: ptBR })}
                                <div className="text-xs text-muted-foreground">
                                  {key.uso_count} usos
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Nunca usado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditandoKey(key)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => excluirApiKey(key.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoramento">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monitoramento de Uso das APIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {keysFiltered.filter(k => k.ativo).map((key) => (
                  <Card key={key.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{key.nome}</CardTitle>
                        {getServicoBadge(key.servico)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total de Usos:</span>
                          <span className="font-bold">{key.uso_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Último Uso:</span>
                          <span>
                            {key.last_used 
                              ? format(new Date(key.last_used), 'dd/MM HH:mm', { locale: ptBR })
                              : 'Nunca'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Status:</span>
                          <Badge variant={key.ativo ? "default" : "secondary"}>
                            {key.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança e Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-800">Recomendações de Segurança</h4>
                      <ul className="mt-2 text-sm text-amber-700 space-y-1">
                        <li>• Rotacione as API Keys regularmente (recomendado: a cada 90 dias)</li>
                        <li>• Use escopos específicos por empresa quando possível</li>
                        <li>• Monitore o uso das keys para detectar atividades suspeitas</li>
                        <li>• Desative imediatamente keys comprometidas</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Keys por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Ativas:</span>
                          <Badge>{apiKeys.filter(k => k.ativo).length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Inativas:</span>
                          <Badge variant="secondary">{apiKeys.filter(k => !k.ativo).length}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Keys por Escopo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Globais:</span>
                          <Badge>{apiKeys.filter(k => !k.empresa_id).length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Por Empresa:</span>
                          <Badge variant="outline">{apiKeys.filter(k => k.empresa_id).length}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nova API Key */}
      <Dialog open={novaKeyOpen} onOpenChange={setNovaKeyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova API Key</DialogTitle>
            <DialogDescription>
              Configure uma nova chave de API para integração
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome da Configuração</Label>
              <Input
                id="nome"
                value={novaKey.nome}
                onChange={(e) => setNovaKey(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: OpenAI ChatGPT - Produção"
              />
            </div>

            <div>
              <Label htmlFor="servico">Serviço</Label>
              <select 
                id="servico"
                className="w-full p-2 border rounded-md" 
                value={novaKey.servico} 
                onChange={(e) => setNovaKey(prev => ({ ...prev, servico: e.target.value }))}
              >
                {SERVICOS_DISPONIVEIS.map(servico => (
                  <option key={servico.value} value={servico.value}>
                    {servico.icon} {servico.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="chave">Chave da API</Label>
              <Input
                id="chave"
                type="password"
                value={novaKey.chave}
                onChange={(e) => setNovaKey(prev => ({ ...prev, chave: e.target.value }))}
                placeholder="Cole aqui a chave da API"
              />
            </div>

            <div>
              <Label htmlFor="escopo">Escopo de Uso</Label>
              <select 
                id="escopo"
                className="w-full p-2 border rounded-md" 
                value={novaKey.escopo} 
                onChange={(e) => setNovaKey(prev => ({ ...prev, escopo: e.target.value as 'global' | 'empresa' }))}
              >
                <option value="global">Global - Todas as empresas</option>
                <option value="empresa">Específica - Uma empresa</option>
              </select>
            </div>

            {novaKey.escopo === 'empresa' && (
              <div>
                <Label htmlFor="empresa">Empresa</Label>
                <select 
                  id="empresa"
                  className="w-full p-2 border rounded-md" 
                  value={novaKey.empresa_id} 
                  onChange={(e) => setNovaKey(prev => ({ ...prev, empresa_id: e.target.value }))}
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={salvarApiKey} disabled={salvando} className="flex-1">
                {salvando ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setNovaKeyOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}