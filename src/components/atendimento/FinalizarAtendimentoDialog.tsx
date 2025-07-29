import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, CheckCircle } from 'lucide-react';

interface FinalizarAtendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (resumo?: string) => Promise<void>;
  nomeCliente: string;
}

export function FinalizarAtendimentoDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  nomeCliente 
}: FinalizarAtendimentoDialogProps) {
  const [resumo, setResumo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm(resumo.trim() || undefined);
      
      toast({
        title: "Atendimento finalizado",
        description: "O atendimento foi finalizado com sucesso.",
      });
      
      setResumo('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      toast({
        title: "Erro ao finalizar",
        description: "Não foi possível finalizar o atendimento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setResumo('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Finalizar Atendimento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Cliente:</strong> {nomeCliente}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              O atendimento será marcado como finalizado e movido para a coluna "Finalizados" no kanban.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumo" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resumo do Atendimento (Opcional)
            </Label>
            <Textarea
              id="resumo"
              placeholder="Descreva brevemente o que foi discutido no atendimento, soluções apresentadas, próximos passos, etc..."
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {resumo.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Finalizando...' : 'Finalizar Atendimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}