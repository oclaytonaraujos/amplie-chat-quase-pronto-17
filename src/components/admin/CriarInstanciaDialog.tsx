import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
}

interface CriarInstanciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CriarInstanciaDialog({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CriarInstanciaDialogProps) {
  const [instanceName, setInstanceName] = useState('');
  const [empresaId, setEmpresaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const { toast } = useToast();

  // Carregar empresas
  useEffect(() => {
    const loadEmpresas = async () => {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('id, nome')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        setEmpresas(data || []);
      } catch (error) {
        console.error('Erro ao carregar empresas:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as empresas",
          variant: "destructive",
        });
      } finally {
        setLoadingEmpresas(false);
      }
    };

    if (open) {
      loadEmpresas();
    }
  }, [open, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instanceName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite um nome para a instância",
        variant: "destructive",
      });
      return;
    }

    if (!empresaId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma empresa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar configuração global ativa
      const { data: globalConfig, error: configError } = await supabase
        .from('evolution_api_global_config')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (configError) {
        console.error('Erro ao buscar configuração:', configError);
        throw new Error('Erro ao buscar configuração da Evolution API');
      }

      if (!globalConfig || globalConfig.length === 0) {
        throw new Error('Configuração global da Evolution API não encontrada. Configure primeiro na Central de Integrações.');
      }

      const config = globalConfig[0];

      // Garantir que a URL tenha protocolo https://
      const serverUrl = config.server_url.startsWith('http') 
        ? config.server_url 
        : `https://${config.server_url}`;

      // Criar instância na Evolution API
      const response = await fetch(`${serverUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': config.api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instanceName.trim(),
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na Evolution API:', errorText);
        throw new Error(`Erro ao criar instância na Evolution API: ${response.status}`);
      }

      const result = await response.json();
      console.log('Instância criada na API:', result);

      // Salvar configuração da instância no banco
      const { error: insertError } = await supabase
        .from('evolution_api_config')
        .insert({
          empresa_id: empresaId,
          instance_name: instanceName.trim(),
          descricao: descricao.trim() || null,
          status: 'disconnected',
          ativo: true
        });

      if (insertError) {
        console.error('Erro ao inserir no banco:', insertError);
        throw new Error(`Erro ao salvar instância no banco: ${insertError.message}`);
      }

      toast({
        title: "Instância criada",
        description: `Instância ${instanceName} criada e associada à empresa com sucesso!`,
      });

      // Limpar formulário e fechar dialog
      setInstanceName('');
      setEmpresaId('');
      setDescricao('');
      onOpenChange(false);
      onSuccess();

    } catch (error: any) {
      console.error('Erro detalhado ao criar instância:', error);
      toast({
        title: "Erro ao criar instância",
        description: error.message || "Não foi possível criar a instância",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setInstanceName('');
    setEmpresaId('');
    setDescricao('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Instância</DialogTitle>
          <DialogDescription>
            Crie uma nova instância WhatsApp e associe a uma empresa
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância</Label>
            <Input
              id="instanceName"
              placeholder="Ex: empresa-principal"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa</Label>
            {loadingEmpresas ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando empresas...</span>
              </div>
            ) : (
              <Select value={empresaId} onValueChange={setEmpresaId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição da instância..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !instanceName.trim() || !empresaId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Instância'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}