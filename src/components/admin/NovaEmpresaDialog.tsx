
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Plano {
  id: string;
  nome: string;
  limite_usuarios: number;
  limite_armazenamento_gb: number;
  limite_contatos: number;
}

interface NovaEmpresaDialogProps {
  onEmpresaCreated: () => void;
}

export default function NovaEmpresaDialog({ onEmpresaCreated }: NovaEmpresaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cnpj: '',
    plano_id: '',
    limite_usuarios: 10,
    limite_armazenamento_gb: 5,
    limite_contatos: 1000,
    limite_whatsapp_conexoes: 1
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPlanos();
    }
  }, [open]);

  const fetchPlanos = async () => {
    const { data } = await supabase
      .from('planos')
      .select('id, nome, limite_usuarios, limite_armazenamento_gb, limite_contatos')
      .eq('ativo', true);
    setPlanos(data || []);
  };

  const handlePlanoChange = (planoId: string) => {
    const plano = planos.find(p => p.id === planoId);
    if (plano) {
      setFormData({
        ...formData,
        plano_id: planoId,
        limite_usuarios: plano.limite_usuarios,
        limite_armazenamento_gb: plano.limite_armazenamento_gb,
        limite_contatos: plano.limite_contatos
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome da empresa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "Email é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.plano_id) {
      toast({
        title: "Erro de validação",
        description: "Selecione um plano para a empresa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Criando empresa com dados:', formData);

      const { error } = await supabase.from('empresas').insert([{
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim(),
        endereco: formData.endereco.trim(),
        cnpj: formData.cnpj.trim(),
        plano_id: formData.plano_id,
        limite_usuarios: formData.limite_usuarios,
        limite_armazenamento_gb: formData.limite_armazenamento_gb,
        limite_contatos: formData.limite_contatos,
        limite_whatsapp_conexoes: formData.limite_whatsapp_conexoes,
        ativo: true
      }]);

      if (error) {
        console.error('Erro ao criar empresa:', error);
        if (error.code === '23505') {
          throw new Error('Uma empresa com este email já está cadastrada');
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso",
      });

      setFormData({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        cnpj: '',
        plano_id: '',
        limite_usuarios: 10,
        limite_armazenamento_gb: 5,
        limite_contatos: 1000,
        limite_whatsapp_conexoes: 1
      });
      setOpen(false);
      onEmpresaCreated();
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Empresa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome da Empresa *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="plano">Plano</Label>
            <Select
              value={formData.plano_id}
              onValueChange={handlePlanoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {planos.map((plano) => (
                  <SelectItem key={plano.id} value={plano.id}>
                    {plano.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Limites Personalizados</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="limite_usuarios">Limite de Usuários</Label>
                <Input
                  id="limite_usuarios"
                  type="number"
                  min="1"
                  value={formData.limite_usuarios}
                  onChange={(e) => setFormData({ ...formData, limite_usuarios: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="limite_armazenamento_gb">Armazenamento (GB)</Label>
                <Input
                  id="limite_armazenamento_gb"
                  type="number"
                  min="1"
                  value={formData.limite_armazenamento_gb}
                  onChange={(e) => setFormData({ ...formData, limite_armazenamento_gb: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="limite_contatos">Limite de Contatos</Label>
                <Input
                  id="limite_contatos"
                  type="number"
                  min="1"
                  value={formData.limite_contatos}
                  onChange={(e) => setFormData({ ...formData, limite_contatos: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="limite_whatsapp_conexoes">Conexões WhatsApp</Label>
                <Input
                  id="limite_whatsapp_conexoes"
                  type="number"
                  min="1"
                  value={formData.limite_whatsapp_conexoes}
                  onChange={(e) => setFormData({ ...formData, limite_whatsapp_conexoes: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Empresa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
