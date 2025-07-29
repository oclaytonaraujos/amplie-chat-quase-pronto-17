
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import NovoUsuarioSuperAdminDialog from './NovoUsuarioSuperAdminDialog';
import EditarUsuarioSuperAdminDialog from './EditarUsuarioSuperAdminDialog';
import ExcluirUsuarioSuperAdminDialog from './ExcluirUsuarioSuperAdminDialog';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  status: string;
  empresa_id: string;
  created_at: string;
  empresas?: {
    nome: string;
  };
}

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('all');
  const [filtroCargo, setFiltroCargo] = useState('all');
  const [busca, setBusca] = useState('');
  const [empresas, setEmpresas] = useState<{id: string, nome: string}[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [novoUsuarioOpen, setNovoUsuarioOpen] = useState(false);
  const [editarUsuarioOpen, setEditarUsuarioOpen] = useState(false);
  const [excluirUsuarioOpen, setExcluirUsuarioOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsuarios();
    fetchEmpresas();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          empresas (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const handleUsuarioCreated = () => {
    fetchUsuarios();
    setNovoUsuarioOpen(false);
  };

  const handleUsuarioUpdated = () => {
    fetchUsuarios();
    setEditarUsuarioOpen(false);
    setSelectedUsuario(null);
  };

  const handleUsuarioDeleted = () => {
    fetchUsuarios();
    setExcluirUsuarioOpen(false);
    setSelectedUsuario(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'online': { variant: 'default' as const, label: 'Online' },
      'offline': { variant: 'secondary' as const, label: 'Offline' },
      'ausente': { variant: 'outline' as const, label: 'Ausente' },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'secondary' as const, label: status };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getCargoBadge = (cargo: string) => {
    const cargoMap = {
      'super_admin': { variant: 'destructive' as const, label: 'Super Admin' },
      'admin': { variant: 'default' as const, label: 'Administrador' },
      'agente': { variant: 'secondary' as const, label: 'Agente' },
      'usuario': { variant: 'outline' as const, label: 'Usuário' },
    };

    const cargoInfo = cargoMap[cargo as keyof typeof cargoMap] || { variant: 'outline' as const, label: cargo };
    
    return (
      <Badge variant={cargoInfo.variant}>
        {cargoInfo.label}
      </Badge>
    );
  };

  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchEmpresa = filtroEmpresa === 'all' || usuario.empresa_id === filtroEmpresa;
    const matchCargo = filtroCargo === 'all' || usuario.cargo === filtroCargo;
    const matchBusca = !busca || 
      usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busca.toLowerCase());
    
    return matchEmpresa && matchCargo && matchBusca;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-40 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
        </div>
        <div className="border rounded-lg">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
        <Button onClick={() => setNovoUsuarioOpen(true)} className="rounded-xl">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center flex-wrap">
        <Input
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="max-w-sm rounded-xl"
        />
        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {empresas.map((empresa) => (
              <SelectItem key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroCargo} onValueChange={setFiltroCargo}>
          <SelectTrigger className="w-48 rounded-xl">
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cargos</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="agente">Agente</SelectItem>
            <SelectItem value="usuario">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-2xl overflow-hidden shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.empresas?.nome || 'N/A'}</TableCell>
                  <TableCell>{getCargoBadge(usuario.cargo)}</TableCell>
                  <TableCell>{usuario.setor || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                  <TableCell>
                    {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUsuario(usuario);
                          setEditarUsuarioOpen(true);
                        }}
                        className="rounded-xl"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUsuario(usuario);
                          setExcluirUsuarioOpen(true);
                        }}
                        className="text-red-600 hover:text-red-700 rounded-xl"
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
      </div>

      {/* Dialogs */}
      <NovoUsuarioSuperAdminDialog
        open={novoUsuarioOpen}
        onOpenChange={setNovoUsuarioOpen}
        onUsuarioCreated={handleUsuarioCreated}
        empresas={empresas}
      />

      {selectedUsuario && (
        <>
          <EditarUsuarioSuperAdminDialog
            open={editarUsuarioOpen}
            onOpenChange={setEditarUsuarioOpen}
            usuario={selectedUsuario}
            onUsuarioUpdated={handleUsuarioUpdated}
            empresas={empresas}
          />
          <ExcluirUsuarioSuperAdminDialog
            open={excluirUsuarioOpen}
            onOpenChange={setExcluirUsuarioOpen}
            usuario={selectedUsuario}
            onUsuarioDeleted={handleUsuarioDeleted}
          />
        </>
      )}
    </div>
  );
}
