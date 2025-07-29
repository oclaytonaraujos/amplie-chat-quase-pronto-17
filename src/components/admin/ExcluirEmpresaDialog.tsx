
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Empresa {
  id: string;
  nome: string;
  email: string;
}

interface ExcluirEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: Empresa;
  onEmpresaDeleted: () => void;
}

export default function ExcluirEmpresaDialog({ 
  open, 
  onOpenChange, 
  empresa, 
  onEmpresaDeleted 
}: ExcluirEmpresaDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);

    try {
      // Verificar se há usuários associados
      const { data: usuarios, error: usuariosError } = await supabase
        .from('profiles')
        .select('id')
        .eq('empresa_id', empresa.id);

      if (usuariosError) throw usuariosError;

      if (usuarios && usuarios.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir empresa com usuários associados. Primeiro remova ou transfira os usuários.",
          variant: "destructive",
        });
        return;
      }

      // Excluir a empresa
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresa.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa excluída com sucesso",
      });

      onEmpresaDeleted();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>Confirmar Exclusão</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Tem certeza que deseja excluir a empresa <strong>{empresa.nome}</strong>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados da empresa serão permanentemente removidos.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Excluindo...' : 'Excluir Empresa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
