
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, MessageSquare } from 'lucide-react';
import { Atendimento } from '@/types/atendimento';

interface AccessRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimento: Atendimento | null;
  onConfirm: (motivo: string) => void;
}

export function AccessRequestDialog({ 
  open, 
  onOpenChange, 
  atendimento, 
  onConfirm 
}: AccessRequestDialogProps) {
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (motivo.trim()) {
      onConfirm(motivo);
      setMotivo('');
    }
  };

  const handleClose = () => {
    setMotivo('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Solicitar Acesso ao Atendimento</span>
          </DialogTitle>
        </DialogHeader>
        
        {atendimento && (
          <div className="space-y-4">
            {/* Informações do Atendimento */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{atendimento.cliente}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Responsável:</span> {atendimento.agente}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Departamento:</span> {atendimento.setor}
              </div>
            </div>

            {/* Campo de Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da solicitação *</Label>
              <Textarea
                id="motivo"
                placeholder="Ex: Cliente solicitou transferência, expertise necessária..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="text-xs text-gray-500">
              * Uma solicitação será enviada para {atendimento.agente}. Se aceita, o atendimento será transferido automaticamente.
            </div>
          </div>
        )}

        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!motivo.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Enviar Solicitação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
