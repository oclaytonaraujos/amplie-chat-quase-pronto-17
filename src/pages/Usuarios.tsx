import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Shield, UserPlus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NovoUsuarioDialog } from '@/components/usuarios/NovoUsuarioDialog';
import { EditarUsuarioDialog } from '@/components/usuarios/EditarUsuarioDialog';
import { ExcluirUsuarioDialog } from '@/components/usuarios/ExcluirUsuarioDialog';
import { FiltrosUsuarios } from '@/components/usuarios/FiltrosUsuarios';
import { useUsuarios } from '@/hooks/useUsuarios';
import { Loader2 } from 'lucide-react';

export default function Usuarios() {
  const { usuarios, loading, criarUsuario, editarUsuario, excluirUsuario } = useUsuarios();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({ setor: '', papel: '', status: '' });
  const [novoUsuarioOpen, setNovoUsuarioOpen] = useState(false);
  const [editarUsuarioOpen, setEditarUsuarioOpen] = useState(false);
  const [excluirUsuarioOpen, setExcluirUsuarioOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<any>(null);
  const [filtroSheetOpen, setFiltroSheetOpen] = useState(false);

  const filteredUsers = usuarios.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSetor = filtros.setor === '' || user.setor === filtros.setor;
    const matchesPapel = filtros.papel === '' || user.cargo === filtros.papel;
    const matchesStatus = filtros.status === '' || user.status === filtros.status;

    return matchesSearch && matchesSetor && matchesPapel && matchesStatus;
  });

  const handleNovoUsuario = async (novoUsuario: any) => {
    const resultado = await criarUsuario(novoUsuario);
    if (resultado) {
      setNovoUsuarioOpen(false);
    }
  };

  const handleEditarUsuario = async (usuarioEditado: any) => {
    const sucesso = await editarUsuario(usuarioEditado);
    if (sucesso) {
      setEditarUsuarioOpen(false);
      setUsuarioSelecionado(null);
    }
  };

  const handleExcluirUsuario = async (id: string) => {
    const sucesso = await excluirUsuario(id);
    if (sucesso) {
      setExcluirUsuarioOpen(false);
      setUsuarioSelecionado(null);
    }
  };

  const abrirEdicao = (usuario: any) => {
    setUsuarioSelecionado(usuario);
    setEditarUsuarioOpen(true);
  };

  const abrirExclusao = (usuario: any) => {
    setUsuarioSelecionado(usuario);
    setExcluirUsuarioOpen(true);
  };

  const filtrosAtivos = Object.entries(filtros).filter(([_, valor]) => valor !== '');

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
            </div>
            <UserPlus className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-green-600">{usuarios.filter(u => u.status === 'online').length}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Inativos</p>
              <p className="text-2xl font-bold text-red-600">{usuarios.filter(u => u.status === 'offline').length}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Supervisores</p>
              <p className="text-2xl font-bold text-purple-600">{usuarios.filter(u => u.cargo === 'supervisor').length}</p>
            </div>
            <Shield className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => setNovoUsuarioOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Search with Filter */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Pesquisar usuários por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Sheet open={filtroSheetOpen} onOpenChange={setFiltroSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Filter className="w-4 h-4" />
                {filtrosAtivos.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {filtrosAtivos.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
              </SheetHeader>
              <FiltrosUsuarios onFiltrosChange={setFiltros} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Filtros Ativos */}
        {filtrosAtivos.length > 0 && (
          <div className="mt-4 space-y-2">
            <span className="text-sm font-medium text-gray-700">Filtros ativos:</span>
            <div className="flex flex-wrap gap-2">
              {filtrosAtivos.map(([campo, valor]) => (
                <Badge key={campo} variant="secondary" className="flex items-center space-x-1">
                  <span>{campo}: {valor}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Usuário</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Setor</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Cargo</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {user.nome.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.nome}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{user.setor || 'Não definido'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{user.cargo || 'Não definido'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={user.status === 'online' ? 'default' : 'secondary'}
                      className={user.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => abrirEdicao(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => abrirExclusao(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum usuário encontrado com os filtros aplicados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <NovoUsuarioDialog
        open={novoUsuarioOpen}
        onOpenChange={setNovoUsuarioOpen}
        onUsuarioAdicionado={handleNovoUsuario}
      />

      <EditarUsuarioDialog
        open={editarUsuarioOpen}
        onOpenChange={setEditarUsuarioOpen}
        usuario={usuarioSelecionado}
        onUsuarioEditado={handleEditarUsuario}
      />

      <ExcluirUsuarioDialog
        open={excluirUsuarioOpen}
        onOpenChange={setExcluirUsuarioOpen}
        usuario={usuarioSelecionado}
        onUsuarioExcluido={handleExcluirUsuario}
      />
    </div>
  );
}
