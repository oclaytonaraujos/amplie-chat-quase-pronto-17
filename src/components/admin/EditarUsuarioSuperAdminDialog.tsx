
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  status: string;
  empresa_id: string;
  permissoes?: any;
}

interface Empresa {
  id: string;
  nome: string;
}

interface EditarUsuarioSuperAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
  onUsuarioUpdated: () => void;
  empresas: Empresa[];
}

const setoresDisponiveis = ['Vendas', 'Suporte', 'Marketing', 'Financeiro', 'RH', 'Administração', 'TI'];

const permissoesDisponiveis = [
  { id: 'dashboard', label: 'Visualizar Dashboard' },
  { id: 'atendimento', label: 'Acesso ao Atendimento' },
  { id: 'contatos', label: 'Gerenciar Contatos' },
  { id: 'usuarios', label: 'Gerenciar Usuários' },
  { id: 'setores', label: 'Gerenciar Setores' },
  { id: 'configuracoes', label: 'Configurações do Sistema' },
  { id: 'relatorios', label: 'Visualizar Relatórios' },
  { id: 'whatsapp', label: 'Gerenciar WhatsApp' },
  { id: 'chatbot', label: 'Gerenciar Chatbot' },
  { id: 'kanban', label: 'Acesso ao Kanban' },
  { id: 'chat_interno', label: 'Chat Interno' },
  { id: 'super_admin', label: 'Super Administrador' }
];

export default function EditarUsuarioSuperAdminDialog({ 
  open, 
  onOpenChange, 
  usuario, 
  onUsuarioUpdated, 
  empresas 
}: EditarUsuarioSuperAdminDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    novaSenha: '',
    empresa_id: '',
    cargo: 'usuario',
    setor: '',
    status: 'online',
    permissoes: [] as string[]
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (usuario) {
      // Parse permissoes do usuário (pode vir como string JSON ou array)
      let permissoesUsuario: string[] = [];
      if (usuario.permissoes) {
        if (typeof usuario.permissoes === 'string') {
          try {
            permissoesUsuario = JSON.parse(usuario.permissoes);
          } catch {
            permissoesUsuario = [];
          }
        } else if (Array.isArray(usuario.permissoes)) {
          permissoesUsuario = usuario.permissoes;
        }
      }

      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        novaSenha: '',
        empresa_id: usuario.empresa_id,
        cargo: usuario.cargo,
        setor: usuario.setor || '',
        status: usuario.status,
        permissoes: permissoesUsuario
      });
    }
  }, [usuario]);

  const handlePermissaoChange = (permissaoId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissoes: checked 
        ? [...prev.permissoes, permissaoId]
        : prev.permissoes.filter(p => p !== permissaoId)
    }));
  };

  const getPermissoesPorCargo = (cargo: string): string[] => {
    switch (cargo) {
      case 'super_admin':
        return permissoesDisponiveis.map(p => p.id);
      case 'admin':
        return permissoesDisponiveis.filter(p => p.id !== 'super_admin').map(p => p.id);
      case 'supervisor':
        return ['dashboard', 'atendimento', 'contatos', 'usuarios', 'relatorios', 'kanban', 'chat_interno'];
      case 'agente':
        return ['dashboard', 'atendimento', 'contatos', 'kanban', 'chat_interno'];
      case 'usuario':
      default:
        return ['dashboard', 'atendimento', 'chat_interno'];
    }
  };

  const handleCargoChange = (cargo: string) => {
    const permissoesPadrao = getPermissoesPorCargo(cargo);
    setFormData(prev => ({
      ...prev,
      cargo,
      permissoes: permissoesPadrao
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: formData.nome,
          email: formData.email,
          empresa_id: formData.empresa_id,
          cargo: formData.cargo,
          setor: formData.setor,
          status: formData.status,
          permissoes: formData.permissoes
        })
        .eq('id', usuario.id);

      if (error) throw error;

      let toastMessage = "Usuário atualizado com sucesso";
      if (formData.novaSenha.trim() !== '') {
        toastMessage += `. Nova senha: ${formData.novaSenha}`;
      }

      toast({
        title: "Sucesso",
        description: toastMessage,
      });

      onUsuarioUpdated();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="novaSenha">Nova Senha</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={showPassword ? "text" : "password"}
                value={formData.novaSenha}
                onChange={(e) => setFormData({ ...formData, novaSenha: e.target.value })}
                className="pr-10"
                placeholder="Deixe em branco para manter a senha atual"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco se não quiser alterar a senha
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Select
                value={formData.empresa_id}
                onValueChange={(value) => setFormData({ ...formData, empresa_id: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={handleCargoChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="agente">Agente</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setor">Setor</Label>
              <Select
                value={formData.setor}
                onValueChange={(value) => setFormData({ ...formData, setor: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {setoresDisponiveis.map(setor => (
                    <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="ausente">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Permissões de Acesso</Label>
            <p className="text-sm text-gray-600 mb-3">
              Selecione as permissões que este usuário terá no sistema
            </p>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded p-3">
              {permissoesDisponiveis.map((permissao) => (
                <div key={permissao.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={permissao.id}
                    checked={formData.permissoes.includes(permissao.id)}
                    onCheckedChange={(checked) => handlePermissaoChange(permissao.id, !!checked)}
                  />
                  <Label htmlFor={permissao.id} className="text-sm font-normal">
                    {permissao.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
