
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  setor?: string;
  cargo?: string;
  status: string;
}

interface ExcluirUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onUsuarioExcluido: (id: string) => void;
}

export function ExcluirUsuarioDialog({ open, onOpenChange, usuario, onUsuarioExcluido }: ExcluirUsuarioDialogProps) {
  const handleConfirm = () => {
    if (usuario) {
      onUsuarioExcluido(usuario.id);
    }
  };

  if (!usuario) return null;

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Excluir Usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
