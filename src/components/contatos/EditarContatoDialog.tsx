
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { Contato, useContatos } from '@/hooks/useContatos';


interface EditarContatoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contato: Contato | null;
  onContatoEditado: (contato: Contato) => void;
}

const tagsDisponiveis = ['VIP', 'Interessado', 'Problema Recorrente', 'Novo Contato', 'Cliente Premium'];

export function EditarContatoDialog({ open, onOpenChange, contato, onContatoEditado }: EditarContatoDialogProps) {
  const { alterarStatusContato, excluirContato } = useContatos();
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    empresa: '',
    observacoes: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'bloqueado'
  });
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (contato) {
      setFormData({
        nome: contato.nome,
        telefone: contato.telefone || '',
        email: contato.email || '',
        empresa: contato.empresa || '',
        observacoes: contato.observacoes || '',
        status: contato.status || 'ativo'
      });
      setTags(contato.tags || []);
    }
  }, [contato]);

  const toggleTag = (tag: string) => {
    setTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleToggleStatus = async () => {
    if (contato) {
      const novoStatus = formData.status === 'ativo' ? 'inativo' : 'ativo';
      const sucesso = await alterarStatusContato(contato.id, novoStatus);
      if (sucesso) {
        setFormData(prev => ({ ...prev, status: novoStatus }));
      }
    }
  };

  const handleExcluirContato = async () => {
    if (contato) {
      const sucesso = await excluirContato(contato.id);
      if (sucesso) {
        onOpenChange(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (contato) {
      const contatoEditado: Contato = {
        ...contato,
        ...formData,
        tags
      };

      onContatoEditado(contatoEditado);
      onOpenChange(false);
    }
  };

  if (!contato) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Editar Contato</span>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={formData.status === 'ativo' ? 'default' : 'secondary'}
                className={formData.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
              >
                {formData.status === 'ativo' ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Input
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>


          <div>
            <Label>Tags</Label>
            <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {tagsDisponiveis.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={tag}
                    checked={tags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  <Label htmlFor={tag} className="text-sm font-normal cursor-pointer">
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleToggleStatus}
                className="flex items-center space-x-2"
              >
                {formData.status === 'ativo' ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    <span>Inativar Contato</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    <span>Ativar Contato</span>
                  </>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o contato <strong>{formData.nome}</strong>? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleExcluirContato} className="bg-red-600 hover:bg-red-700">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
