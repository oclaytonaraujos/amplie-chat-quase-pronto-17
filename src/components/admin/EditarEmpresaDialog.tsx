
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

interface Plano {
  id: string;
  nome: string;
}

interface EditarEmpresaDialogProps {
  empresa: Empresa;
  onEmpresaUpdated: () => void;
}

export default function EditarEmpresaDialog({ empresa, onEmpresaUpdated }: EditarEmpresaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formData, setFormData] = useState({
    nome: empresa.nome,
    email: empresa.email,
    telefone: empresa.telefone || '',
    endereco: empresa.endereco || '',
    cnpj: empresa.cnpj || '',
    plano_id: empresa.plano_id || '',
    limite_usuarios: empresa.limite_usuarios || 10,
    limite_armazenamento_gb: empresa.limite_armazenamento_gb || 5,
    limite_contatos: empresa.limite_contatos || 1000,
    limite_whatsapp_conexoes: empresa.limite_whatsapp_conexoes || 1,
    ativo: empresa.ativo
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPlanos();
      setFormData({
        nome: empresa.nome,
        email: empresa.email,
        telefone: empresa.telefone || '',
        endereco: empresa.endereco || '',
        cnpj: empresa.cnpj || '',
        plano_id: empresa.plano_id || '',
        limite_usuarios: empresa.limite_usuarios || 10,
        limite_armazenamento_gb: empresa.limite_armazenamento_gb || 5,
        limite_contatos: empresa.limite_contatos || 1000,
        limite_whatsapp_conexoes: empresa.limite_whatsapp_conexoes || 1,
        ativo: empresa.ativo
      });
    }
  }, [open, empresa]);

  const fetchPlanos = async () => {
    const { data } = await supabase.from('planos').select('id, nome').eq('ativo', true);
    setPlanos(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('empresas')
        .update(formData)
        .eq('id', empresa.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });

      setOpen(false);
      onEmpresaUpdated();
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Empresa</Label>
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
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>
          </div>

          <Separator />

          {/* Configurações do Plano */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Plano e Configurações</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plano">Plano Base</Label>
                <Select
                  value={formData.plano_id}
                  onValueChange={(value) => setFormData({ ...formData, plano_id: value })}
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Empresa Ativa</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Limites Personalizados */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Limites Personalizados</h3>
            <p className="text-sm text-muted-foreground">
              Configure limites específicos para esta empresa. Estes valores sobrescrevem as configurações do plano base.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="limite_usuarios">Limite de Usuários</Label>
                <Input
                  id="limite_usuarios"
                  type="number"
                  value={formData.limite_usuarios}
                  onChange={(e) => setFormData({ ...formData, limite_usuarios: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="limite_whatsapp_conexoes">Conexões WhatsApp</Label>
                <Input
                  id="limite_whatsapp_conexoes"
                  type="number"
                  value={formData.limite_whatsapp_conexoes}
                  onChange={(e) => setFormData({ ...formData, limite_whatsapp_conexoes: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="limite_armazenamento_gb">Armazenamento (GB)</Label>
                <Input
                  id="limite_armazenamento_gb"
                  type="number"
                  value={formData.limite_armazenamento_gb}
                  onChange={(e) => setFormData({ ...formData, limite_armazenamento_gb: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="limite_contatos">Limite de Contatos</Label>
                <Input
                  id="limite_contatos"
                  type="number"
                  value={formData.limite_contatos}
                  onChange={(e) => setFormData({ ...formData, limite_contatos: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
