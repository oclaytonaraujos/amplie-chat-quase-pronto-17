import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWhatsAppEvolution } from '@/hooks/useWhatsAppEvolution';
import { Loader2 } from 'lucide-react';

interface CreateInstanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstanceCreated: () => void;
}

export function CreateInstanceDialog({
  open,
  onOpenChange,
  onInstanceCreated
}: CreateInstanceDialogProps) {
  const [instanceName, setInstanceName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { createInstance } = useWhatsAppEvolution();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instanceName.trim()) return;

    setIsCreating(true);
    try {
      const result = await createInstance({
        instanceName: instanceName.trim(),
        description: description.trim() || undefined
      });

      if (result) {
        onInstanceCreated();
        setInstanceName('');
        setDescription('');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setInstanceName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Instância WhatsApp</DialogTitle>
          <DialogDescription>
            Crie uma nova instância para conectar com o WhatsApp via Evolution API
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName">Nome da Instância *</Label>
            <Input
              id="instanceName"
              type="text"
              placeholder="Ex: whatsapp-vendas"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              required
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Use apenas letras, números e hífens. Sem espaços.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Ex: WhatsApp para equipe de vendas"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!instanceName.trim() || isCreating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
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