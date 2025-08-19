
import { useState } from 'react';
import { UserCheck, Search, Filter, MessageSquare, Edit, Plus, Tag, Phone, Mail, Clock, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ContatoDetalhes } from '@/components/contatos/ContatoDetalhes';
import { NovoContatoDialog } from '@/components/contatos/NovoContatoDialog';
import { EditarContatoDialog } from '@/components/contatos/EditarContatoDialog';
import { FiltrosContatos } from '@/components/contatos/FiltrosContatos';
import { useContatos } from '@/hooks/useContatos';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { SyncLoaderSection } from '@/components/ui/sync-loader';

export default function Contatos() {
  const { contatos, loading, criarContato, editarContato, excluirContato, expandirContato } = useContatos();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'meus'>('todos');
  const [pesquisa, setPesquisa] = useState('');
  const [filtros, setFiltros] = useState({
    setor: '',
    status: '',
    tag: ''
  });
  const [contatoSelecionado, setContatoSelecionado] = useState<any>(null);
  const [showNovoContato, setShowNovoContato] = useState(false);
  const [editarContatoOpen, setEditarContatoOpen] = useState(false);
  const [contatoParaEdicao, setContatoParaEdicao] = useState<any>(null);
  const { toast } = useToast();

  // Filtrar contatos baseado nos critérios
  const contatosFiltrados = contatos.filter(contato => {
    // Filtro "Todos" vs "Meus Contatos"
    if (filtroTipo === 'meus') {
      // Para "Meus Contatos", implementar lógica de atribuição se necessário
      // Por enquanto, mostra todos da empresa (pode ser expandido futuramente)
      // TODO: Implementar campo atendente_id nos contatos se necessário
    }
    
    // Filtro de pesquisa
    if (pesquisa) {
      const termoPesquisa = pesquisa.toLowerCase();
      if (!contato.nome.toLowerCase().includes(termoPesquisa) && 
          !contato.telefone?.includes(termoPesquisa) && 
          !contato.email?.toLowerCase().includes(termoPesquisa)) {
        return false;
      }
    }

    return true;
  });

  const handleIniciarConversa = (contato: any) => {
    console.log('Iniciando conversa com:', contato.nome);
    // Redirecionar para a página de atendimento
    navigate('/atendimento');
    toast({
      title: "Redirecionando para atendimento",
      description: `Abrindo conversa com ${contato.nome}`,
    });
  };

  const abrirEdicao = (contato: any) => {
    setContatoParaEdicao(contato);
    setEditarContatoOpen(true);
  };

  const handleEditarContato = async (contatoEditado: any) => {
    const sucesso = await editarContato(contatoEditado);
    if (sucesso) {
      setEditarContatoOpen(false);
      setContatoParaEdicao(null);
    }
  };

  const abrirCadastroContato = (contato: any) => {
    const contatoExpandido = expandirContato(contato);
    setContatoSelecionado(contatoExpandido);
  };

  if (loading) {
    return (
      <div className="p-6 min-h-[400px]">
        <SyncLoaderSection text="Carregando contatos..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contatos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Contatos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contatosFiltrados.filter(() => filtroTipo === 'meus').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contatos.filter(c => c.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos VIP</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Implementar lógica para "Contatos VIP" se aplicável */}
              0
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button className="bg-amplie-primary hover:bg-amplie-primary-light" onClick={() => setShowNovoContato(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {/* Filtros principais e pesquisa */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Filtro Todos/Meus Contatos */}
            <div className="flex space-x-2">
              <Button 
                variant={filtroTipo === 'todos' ? 'default' : 'outline'} 
                onClick={() => setFiltroTipo('todos')} 
                className="flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Todos os Contatos</span>
              </Button>
              <Button 
                variant={filtroTipo === 'meus' ? 'default' : 'outline'} 
                onClick={() => setFiltroTipo('meus')} 
                className="flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Meus Contatos</span>
              </Button>
            </div>

            {/* Barra de pesquisa com filtro */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Pesquisar por nome, telefone ou email..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltrosContatos onFiltrosChange={setFiltros} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de contatos */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Informações</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contatosFiltrados.map(contato => (
                <TableRow key={contato.id} className="cursor-pointer hover:bg-muted/50" onClick={() => abrirCadastroContato(contato)}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{contato.nome}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(contato.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {contato.telefone && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Phone className="w-3 h-3" />
                          <span>{contato.telefone}</span>
                        </div>
                      )}
                      {contato.email && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{contato.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contato.empresa && (
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{contato.empresa}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={contato.status === 'ativo' ? 'default' : 'secondary'}
                      className={`text-xs ${
                        contato.status === 'ativo' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {contato.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contato.tags?.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => handleIniciarConversa(contato)}>
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => abrirEdicao(contato)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {contatosFiltrados.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum contato encontrado com os filtros aplicados.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes do contato */}
      {contatoSelecionado && (
        <Dialog open={!!contatoSelecionado} onOpenChange={() => setContatoSelecionado(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastro do Contato</DialogTitle>
            </DialogHeader>
            <ContatoDetalhes contato={contatoSelecionado} onClose={() => setContatoSelecionado(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de novo contato */}
      <NovoContatoDialog 
        open={showNovoContato} 
        onOpenChange={setShowNovoContato} 
        onContatoAdicionado={async (novoContato) => {
          const resultado = await criarContato(novoContato);
          if (resultado) {
            setShowNovoContato(false);
          }
        }} 
      />

      {/* Dialog de edição */}
      <EditarContatoDialog 
        open={editarContatoOpen} 
        onOpenChange={setEditarContatoOpen} 
        contato={contatoParaEdicao} 
        onContatoEditado={handleEditarContato} 
      />
    </div>
  );
}
