
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
}

interface ExcluirUsuarioSuperAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
  onUsuarioDeleted: () => void;
}

export default function ExcluirUsuarioSuperAdminDialog({ 
  open, 
  onOpenChange, 
  usuario, 
  onUsuarioDeleted 
}: ExcluirUsuarioSuperAdminDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);

    try {
      // Primeiro excluir o perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', usuario.id);

      if (profileError) throw profileError;

      // Depois excluir o usuário da autenticação
      const { error: authError } = await supabase.auth.admin.deleteUser(usuario.id);

      if (authError) {
        console.warn('Erro ao excluir usuário da autenticação:', authError);
        // Não falhar se não conseguir excluir da autenticação
      }

      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso",
      });

      onUsuarioDeleted();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
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
            Tem certeza que deseja excluir o usuário <strong>{usuario.nome}</strong>?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. Todos os dados e histórico do usuário serão permanentemente removidos.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Excluindo...' : 'Excluir Usuário'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
