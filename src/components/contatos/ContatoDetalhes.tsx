
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContatoExpandido } from '@/hooks/useContatos';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  User, 
  Building2, 
  Tag, 
  FileText,
  Plus,
  X,
  Eye,
  Edit,
  Save
} from 'lucide-react';

interface ContatoDetalhesProps {
  contato: ContatoExpandido;
  onClose: () => void;
}

interface AtendimentoHistorico {
  id: number;
  data: string;
  agente: string;
  setor: string;
  status: 'finalizado' | 'transferido' | 'em-andamento';
  resumo: string;
  duracao: string;
}


// Mock de histórico de atendimentos
const historicoMock: AtendimentoHistorico[] = [
  {
    id: 1,
    data: '2024-06-12 14:30',
    agente: 'Ana Silva',
    setor: 'Vendas',
    status: 'finalizado',
    resumo: 'Contato interessado em produtos premium',
    duracao: '15 min'
  },
  {
    id: 2,
    data: '2024-06-10 09:15',
    agente: 'Carlos Santos',
    setor: 'Suporte',
    status: 'finalizado',
    resumo: 'Resolução de problema técnico com produto',
    duracao: '25 min'
  },
  {
    id: 3,
    data: '2024-06-08 16:45',
    agente: 'Ana Silva',
    setor: 'Vendas',
    status: 'finalizado',
    resumo: 'Primeira consulta sobre serviços',
    duracao: '10 min'
  }
];

export function ContatoDetalhes({ contato, onClose }: ContatoDetalhesProps) {
  const navigate = useNavigate();
  const [modoEdicao, setModoEdicao] = useState(false);
  const [notas, setNotas] = useState('Contato muito interessado em produtos premium. Já demonstrou interesse em compras recorrentes.');
  const [novaTag, setNovaTag] = useState('');
  const [tags, setTags] = useState(contato.tags);
  const [conversaSelecionada, setConversaSelecionada] = useState<number | null>(null);
  const [dadosContato, setDadosContato] = useState({
    nome: contato.nome,
    telefone: contato.telefone,
    email: contato.email || '',
    status: contato.status
  });

  const adicionarTag = () => {
    if (novaTag.trim() && !tags.includes(novaTag.trim())) {
      setTags([...tags, novaTag.trim()]);
      setNovaTag('');
    }
  };

  const removerTag = (tagRemover: string) => {
    setTags(tags.filter(tag => tag !== tagRemover));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finalizado':
        return <Badge className="bg-green-100 text-green-800">Finalizado</Badge>;
      case 'transferido':
        return <Badge className="bg-blue-100 text-blue-800">Transferido</Badge>;
      case 'em-andamento':
        return <Badge className="bg-yellow-100 text-yellow-800">Em Andamento</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const iniciarConversa = () => {
    console.log('Iniciando conversa com contato:', contato.nome);
    const conversaId = `conversa-${contato.id}-${Date.now()}`;
    navigate(`/atendimento?contato=${contato.id}&conversa=${conversaId}`, {
      state: { 
        contato: {
          id: contato.id,
          nome: contato.nome,
          telefone: contato.telefone,
          email: contato.email
        }
      }
    });
    onClose();
  };

  const visualizarConversa = (atendimentoId: number) => {
    setConversaSelecionada(atendimentoId);
    console.log('Visualizando conversa:', atendimentoId);
    // Implementar visualização do transcript
  };

  const salvarAlteracoes = () => {
    console.log('Salvando alterações:', dadosContato, tags);
    setModoEdicao(false);
    // Implementar salvamento
  };

  return (
    <div className="space-y-6">
      {/* Header com informações básicas */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-2xl">{dadosContato.nome}</CardTitle>
                {modoEdicao ? (
                  <Button onClick={salvarAlteracoes} size="sm" className="flex items-center space-x-1">
                    <Save className="w-4 h-4" />
                    <span>Salvar</span>
                  </Button>
                ) : (
                  <Button onClick={() => setModoEdicao(true)} size="sm" variant="outline" className="flex items-center space-x-1">
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{dadosContato.telefone}</span>
                </div>
                {dadosContato.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{dadosContato.email}</span>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={iniciarConversa} className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Nova Mensagem</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Último Atendente</p>
                    <p className="text-sm text-gray-600">{contato.ultimoAtendente}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Último Setor</p>
                    <p className="text-sm text-gray-600">{contato.setorUltimoAtendimento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Total de Atendimentos</p>
                    <p className="text-sm text-gray-600">{contato.totalAtendimentos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="associacoes">Associações</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="informacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input 
                    id="nome" 
                    value={dadosContato.nome} 
                    onChange={(e) => setDadosContato(prev => ({ ...prev, nome: e.target.value }))}
                    readOnly={!modoEdicao} 
                    className={!modoEdicao ? "bg-gray-100" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    value={dadosContato.telefone} 
                    onChange={(e) => setDadosContato(prev => ({ ...prev, telefone: e.target.value }))}
                    readOnly={!modoEdicao} 
                    className={!modoEdicao ? "bg-gray-100" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    value={dadosContato.email} 
                    onChange={(e) => setDadosContato(prev => ({ ...prev, email: e.target.value }))}
                    readOnly={!modoEdicao} 
                    className={!modoEdicao ? "bg-gray-100" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  {modoEdicao ? (
                    <Select value={dadosContato.status} onValueChange={(value) => setDadosContato(prev => ({ ...prev, status: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="bloqueado">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="status" value={dadosContato.status} readOnly className="bg-gray-100" />
                  )}
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      {modoEdicao && (
                        <button onClick={() => removerTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
                {modoEdicao && (
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Nova tag"
                      value={novaTag}
                      onChange={(e) => setNovaTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && adicionarTag()}
                    />
                    <Button onClick={adicionarTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historicoMock.map((atendimento) => (
                  <Card key={atendimento.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{atendimento.agente}</span>
                            <Badge variant="outline">{atendimento.setor}</Badge>
                            {getStatusBadge(atendimento.status)}
                          </div>
                          <p className="text-sm text-gray-600">{atendimento.resumo}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{new Date(atendimento.data).toLocaleString()}</span>
                            <span>Duração: {atendimento.duracao}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => visualizarConversa(atendimento.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="associacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atendentes Associados por Setor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contato.atendentesAssociados.map((associacao, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="font-medium">{associacao.setor}</p>
                            <p className="text-sm text-gray-600">{associacao.atendente}</p>
                          </div>
                        </div>
                        <Badge variant="outline">Associado</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Notas Internas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Adicione notas sobre o contato..."
                  rows={6}
                />
                <Button>Salvar Notas</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
