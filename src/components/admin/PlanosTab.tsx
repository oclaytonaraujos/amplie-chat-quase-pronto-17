
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco_mensal: number;
  limite_usuarios: number;
  limite_armazenamento_gb: number;
  limite_contatos: number;
  pode_usar_chatbot: boolean;
  pode_usar_kanban: boolean;
  pode_usar_api: boolean;
  pode_usar_chat_interno: boolean;
  pode_usar_automacao: boolean;
  pode_usar_relatorios: boolean;
  ativo: boolean;
}

export default function PlanosTab() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlano, setEditingPlano] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    try {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('preco_mensal', { ascending: true });

      if (error) throw error;
      setPlanos(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlano = async (planoId: string, updates: Partial<Plano>) => {
    try {
      const { error } = await supabase
        .from('planos')
        .update(updates)
        .eq('id', planoId);

      if (error) throw error;

      setPlanos(prev => prev.map(plano => 
        plano.id === planoId ? { ...plano, ...updates } : plano
      ));

      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar plano:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar plano",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (planoId: string, permission: keyof Plano, value: boolean) => {
    updatePlano(planoId, { [permission]: value });
  };

  const handleLimitChange = (planoId: string, field: keyof Plano, value: number) => {
    updatePlano(planoId, { [field]: value });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-64 animate-pulse"></div>
        <div className="border rounded-lg overflow-x-auto">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuração de Planos e Permissões</h3>
      
      <div className="border rounded-2xl overflow-hidden shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Preço/Mês</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Armazenamento</TableHead>
              <TableHead>Contatos</TableHead>
              <TableHead>ChatBot</TableHead>
              <TableHead>Kanban</TableHead>
              <TableHead>API</TableHead>
              <TableHead>Chat Interno</TableHead>
              <TableHead>Automação</TableHead>
              <TableHead>Relatórios</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planos.map((plano) => (
              <TableRow key={plano.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{plano.nome}</div>
                    <div className="text-sm text-gray-500">{plano.descricao}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={plano.preco_mensal}
                    onChange={(e) => handleLimitChange(plano.id, 'preco_mensal', parseFloat(e.target.value) || 0)}
                    className="w-20 rounded-xl"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={plano.limite_usuarios}
                    onChange={(e) => handleLimitChange(plano.id, 'limite_usuarios', parseInt(e.target.value) || 0)}
                    className="w-16 rounded-xl"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={plano.limite_armazenamento_gb}
                    onChange={(e) => handleLimitChange(plano.id, 'limite_armazenamento_gb', parseInt(e.target.value) || 0)}
                    className="w-16 rounded-xl"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={plano.limite_contatos}
                    onChange={(e) => handleLimitChange(plano.id, 'limite_contatos', parseInt(e.target.value) || 0)}
                    className="w-20 rounded-xl"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={plano.pode_usar_chatbot}
                    onCheckedChange={(checked) => handlePermissionChange(plano.id, 'pode_usar_chatbot', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={plano.pode_usar_kanban}
                    onCheckedChange={(checked) => handlePermissionChange(plano.id, 'pode_usar_kanban', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={plano.pode_usar_api}
                    onCheckedChange={(checked) => handlePermissionChange(plano.id, 'pode_usar_api', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={plano.pode_usar_chat_interno}
                    onCheckedChange={(checked) => handlePermissionChange(plano.id, 'pode_usar_chat_interno', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={plano.pode_usar_automacao}
                    onCheckedChange={(checked) => handlePermissionChange(plano.id, 'pode_usar_automacao', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={plano.pode_usar_relatorios}
                    onCheckedChange={(checked) => handlePermissionChange(plano.id, 'pode_usar_relatorios', checked)}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={plano.ativo ? "default" : "secondary"}>
                    {plano.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
