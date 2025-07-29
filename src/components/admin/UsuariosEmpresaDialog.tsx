
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Empresa {
  id: string;
  nome: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  status: string;
  created_at: string;
}

interface UsuariosEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: Empresa;
}

export default function UsuariosEmpresaDialog({ 
  open, 
  onOpenChange, 
  empresa 
}: UsuariosEmpresaDialogProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && empresa) {
      fetchUsuarios();
    }
  }, [open, empresa]);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('empresa_id', empresa.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários da empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Usuários da Empresa: {empresa.nome}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">Carregando usuários...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Nenhum usuário encontrado para esta empresa
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.nome}</TableCell>
                      <TableCell>{usuario.email}</TableCell>
                      <TableCell>{getCargoBadge(usuario.cargo)}</TableCell>
                      <TableCell>{usuario.setor || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                      <TableCell>
                        {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
