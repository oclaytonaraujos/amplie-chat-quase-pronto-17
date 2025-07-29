
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, MoreVertical, Mail, Shield, UserMinus } from 'lucide-react';

export default function GerenciarEquipe() {
  const [busca, setBusca] = useState('');
  const [novoMembro, setNovoMembro] = useState({
    nome: '',
    email: '',
    role: ''
  });

  const membros = [
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao.silva@amplie.com',
      role: 'Administrador',
      status: 'ativo',
      ultimoAcesso: '2024-01-10',
      avatar: 'JS'
    },
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'maria.santos@amplie.com',
      role: 'Operador',
      status: 'ativo',
      ultimoAcesso: '2024-01-09',
      avatar: 'MS'
    },
    {
      id: 3,
      nome: 'Pedro Costa',
      email: 'pedro.costa@amplie.com',
      role: 'Supervisor',
      status: 'inativo',
      ultimoAcesso: '2024-01-05',
      avatar: 'PC'
    },
    {
      id: 4,
      nome: 'Ana Oliveira',
      email: 'ana.oliveira@amplie.com',
      role: 'Operador',
      status: 'pendente',
      ultimoAcesso: 'Nunca',
      avatar: 'AO'
    }
  ];

  const roles = [
    { value: 'administrador', label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: 'supervisor', label: 'Supervisor', description: 'Gerenciar equipe e relatórios' },
    { value: 'operador', label: 'Operador', description: 'Atendimento e contatos' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrador': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      case 'operador': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const membrosFiltrados = membros.filter(membro =>
    membro.nome.toLowerCase().includes(busca.toLowerCase()) ||
    membro.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amplie-primary" />
            Gerenciar Equipe
          </CardTitle>
          <CardDescription>
            Gerencie os membros da sua equipe e suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-amplie-primary hover:bg-amplie-primary-light">
                  <Plus className="w-4 h-4 mr-2" />
                  Convidar Membro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Convidar Novo Membro</DialogTitle>
                  <DialogDescription>
                    Envie um convite para um novo membro da equipe
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      value={novoMembro.nome}
                      onChange={(e) => setNovoMembro({...novoMembro, nome: e.target.value})}
                      placeholder="Nome do novo membro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={novoMembro.email}
                      onChange={(e) => setNovoMembro({...novoMembro, email: e.target.value})}
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select value={novoMembro.role} onValueChange={(value) => setNovoMembro({...novoMembro, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-gray-500">{role.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-amplie-primary hover:bg-amplie-primary-light">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Convite
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe ({membrosFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {membrosFiltrados.map((membro) => (
              <div
                key={membro.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-amplie-primary text-white">
                      {membro.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{membro.nome}</h3>
                    <p className="text-sm text-gray-600">{membro.email}</p>
                    <p className="text-xs text-gray-500">
                      Último acesso: {membro.ultimoAcesso}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getRoleColor(membro.role)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {membro.role}
                  </Badge>
                  <Badge className={getStatusColor(membro.status)}>
                    {membro.status}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" />
                        Alterar Função
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="w-4 h-4 mr-2" />
                        Reenviar Convite
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <UserMinus className="w-4 h-4 mr-2" />
                        Remover da Equipe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Membros</p>
                <p className="text-2xl font-bold">{membros.length}</p>
              </div>
              <Users className="w-8 h-8 text-amplie-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Membros Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {membros.filter(m => m.status === 'ativo').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Convites Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {membros.filter(m => m.status === 'pendente').length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
