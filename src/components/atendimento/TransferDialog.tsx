
import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const agentesDisponiveis = [
  { id: 'ana', nome: 'Ana Silva', setor: 'Suporte', status: 'online', mensagensAbertas: 3 },
  { id: 'carlos', nome: 'Carlos Santos', setor: 'Vendas', status: 'online', mensagensAbertas: 2 },
  { id: 'maria', nome: 'Maria Costa', setor: 'Suporte', status: 'ausente', mensagensAbertas: 4 },
  { id: 'joao', nome: 'João Oliveira', setor: 'Administração', status: 'online', mensagensAbertas: 1 },
];

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (agente: string, motivo: string) => void;
}

export function TransferDialog({ open, onOpenChange, onConfirm }: TransferDialogProps) {
  const [selectedAgente, setSelectedAgente] = useState('');
  const [motivo, setMotivo] = useState('');

  const handleConfirm = () => {
    if (!selectedAgente || !motivo.trim()) return;
    
    const agente = agentesDisponiveis.find(a => a.id === selectedAgente);
    onConfirm(agente?.nome || '', motivo);
    
    // Reset do form
    setSelectedAgente('');
    setMotivo('');
  };

  const handleClose = () => {
    setSelectedAgente('');
    setMotivo('');
    onOpenChange(false);
  };

  const isFormValid = selectedAgente && motivo.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ArrowRight className="w-5 h-5 text-blue-500" />
            <span>Transferir Atendimento</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seleção do agente */}
          <div className="space-y-2">
            <Label htmlFor="agente">Transferir para:</Label>
            <Select value={selectedAgente} onValueChange={setSelectedAgente}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um agente" />
              </SelectTrigger>
              <SelectContent>
                {agentesDisponiveis.map((agente) => (
                  <SelectItem key={agente.id} value={agente.id}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{agente.nome}</p>
                          <p className="text-xs text-gray-500">{agente.setor}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-xs ${
                          agente.status === 'online' 
                            ? 'text-green-700 bg-green-50 border-green-200' 
                            : 'text-yellow-700 bg-yellow-50 border-yellow-200'
                        }`}>
                          {agente.status === 'online' ? 'Online' : 'Ausente'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {agente.mensagensAbertas}/5
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo da transferência */}
          <div className="space-y-2">
            <Label htmlFor="motivo">
              Motivo da transferência <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da transferência..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-gray-500">
              Este motivo será registrado no chat interno e visível para o agente que receber o atendimento.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isFormValid}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
