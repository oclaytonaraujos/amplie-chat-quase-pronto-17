
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ToggleLeft, ToggleRight, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import NovaEmpresaDialog from './NovaEmpresaDialog';
import EditarEmpresaDialog from './EditarEmpresaDialog';
import ExcluirEmpresaDialog from './ExcluirEmpresaDialog';
import UsuariosEmpresaDialog from './UsuariosEmpresaDialog';

interface Empresa {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cnpj?: string;
  plano_id: string;
  limite_usuarios: number;
  limite_armazenamento_gb: number;
  limite_contatos: number;
  limite_whatsapp_conexoes: number;
  ativo: boolean;
  created_at: string;
  planos?: {
    nome: string;
  };
}

export default function EmpresasTab() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [excluirEmpresaOpen, setExcluirEmpresaOpen] = useState(false);
  const [usuariosEmpresaOpen, setUsuariosEmpresaOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          planos (nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleEmpresaStatus = async (empresa: Empresa) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .update({ ativo: !empresa.ativo })
        .eq('id', empresa.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Empresa ${empresa.ativo ? 'desativada' : 'ativada'} com sucesso`,
      });

      fetchEmpresas();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da empresa",
        variant: "destructive",
      });
    }
  };

  const empresasFiltradas = empresas.filter(empresa =>
    empresa.nome.toLowerCase().includes(busca.toLowerCase()) ||
    empresa.email.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
        <div className="border rounded-lg">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Empresas Cadastradas</h3>
        <NovaEmpresaDialog onEmpresaCreated={fetchEmpresas} />
      </div>

      <Input
        placeholder="Buscar empresas..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="max-w-sm"
      />

      <div className="border border-border/50 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm bg-card/95">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border/50">
              <TableHead className="min-w-[150px] font-semibold text-foreground">Nome</TableHead>
              <TableHead className="min-w-[200px] font-semibold text-foreground">Email</TableHead>
              <TableHead className="min-w-[120px] font-semibold text-foreground">Plano</TableHead>
              <TableHead className="min-w-[150px] font-semibold text-foreground">Limites</TableHead>
              <TableHead className="min-w-[100px] font-semibold text-foreground">Status</TableHead>
              <TableHead className="min-w-[120px] font-semibold text-foreground">Data Cadastro</TableHead>
              <TableHead className="min-w-[200px] font-semibold text-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {empresasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-lg font-medium">
                      {busca ? 'Nenhuma empresa encontrada com este filtro' : 'Nenhuma empresa cadastrada'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              empresasFiltradas.map((empresa) => (
              <TableRow key={empresa.id} className="admin-table-row hover:bg-primary/5">
                <TableCell className="font-semibold text-foreground">{empresa.nome}</TableCell>
                <TableCell className="text-muted-foreground">{empresa.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-secondary/20 border-primary/30 text-primary">
                    {empresa.planos?.nome || 'Sem plano'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>Usuários: <span className="font-semibold">{empresa.limite_usuarios}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span>WhatsApp: <span className="font-semibold">{empresa.limite_whatsapp_conexoes}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-secondary rounded-full"></div>
                      <span>Storage: <span className="font-semibold">{empresa.limite_armazenamento_gb}GB</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                      <span>Contatos: <span className="font-semibold">{empresa.limite_contatos}</span></span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={empresa.ativo ? "default" : "secondary"} 
                    className={empresa.ativo 
                      ? "bg-accent text-accent-foreground border-none shadow-md" 
                      : "bg-muted text-muted-foreground border-none"
                    }
                  >
                    {empresa.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground font-medium">
                  {new Date(empresa.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmpresa(empresa);
                        setUsuariosEmpresaOpen(true);
                      }}
                      title="Ver usuários"
                      className="hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-200 hover:scale-105"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                    <EditarEmpresaDialog 
                      empresa={empresa} 
                      onEmpresaUpdated={fetchEmpresas} 
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleEmpresaStatus(empresa)}
                      title={empresa.ativo ? 'Desativar' : 'Ativar'}
                      className="hover:bg-secondary/20 hover:border-secondary/50 hover:text-secondary-foreground transition-all duration-200 hover:scale-105"
                    >
                      {empresa.ativo ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedEmpresa(empresa);
                        setExcluirEmpresaOpen(true);
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-200 hover:scale-105"
                      title="Excluir empresa"
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
      {selectedEmpresa && (
        <>
          <ExcluirEmpresaDialog
            open={excluirEmpresaOpen}
            onOpenChange={setExcluirEmpresaOpen}
            empresa={selectedEmpresa}
            onEmpresaDeleted={() => {
              fetchEmpresas();
              setSelectedEmpresa(null);
            }}
          />
          <UsuariosEmpresaDialog
            open={usuariosEmpresaOpen}
            onOpenChange={setUsuariosEmpresaOpen}
            empresa={selectedEmpresa}
          />
        </>
      )}
    </div>
  );
}
