
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { User, Phone } from 'lucide-react';

interface ConfirmSaveContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  clienteNome: string;
  clienteTelefone: string;
  contact?: any;
}

export function ConfirmSaveContactDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  onCancel, 
  clienteNome, 
  clienteTelefone,
  contact
}: ConfirmSaveContactDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-500" />
            <span>Salvar Novo Contato?</span>
          </DialogTitle>
          <DialogDescription className="text-left">
            O atendimento foi finalizado com um número que não está na sua base de contatos.
            Deseja salvar essas informações como um novo contato?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{clienteNome}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">{clienteTelefone}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Não, obrigado
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-500 hover:bg-blue-600">
            Sim, salvar contato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
