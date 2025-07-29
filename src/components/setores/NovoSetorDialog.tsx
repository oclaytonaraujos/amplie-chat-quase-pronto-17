
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateSetorMutation } from '@/hooks/useSetoresQuery';

const coresDisponiveis = [
  { valor: '#3B82F6', nome: 'Azul' },
  { valor: '#10B981', nome: 'Verde' },
  { valor: '#F59E0B', nome: 'Amarelo' },
  { valor: '#8B5CF6', nome: 'Roxo' },
  { valor: '#EF4444', nome: 'Vermelho' },
  { valor: '#6366F1', nome: 'Índigo' },
  { valor: '#EC4899', nome: 'Rosa' },
  { valor: '#14B8A6', nome: 'Verde-azulado' },
  { valor: '#F97316', nome: 'Laranja' },
  { valor: '#6B7280', nome: 'Cinza' }
];

export function NovoSetorDialog() {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3B82F6');
  const [capacidadeMaxima, setCapacidadeMaxima] = useState('10');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);

  const createSetorMutation = useCreateSetorMutation();

  const resetForm = () => {
    setNome('');
    setCor('#3B82F6');
    setCapacidadeMaxima('10');
    setDescricao('');
    setAtivo(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim() || !cor) {
      return;
    }

    createSetorMutation.mutate({
      nome: nome.trim(),
      cor,
      capacidade_maxima: parseInt(capacidadeMaxima) || 10,
      descricao: descricao.trim() || undefined,
      ativo
    }, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amplie-primary hover:bg-amplie-primary-light">
          <Plus className="w-4 h-4 mr-2" />
          Novo Setor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Setor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Setor</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vendas, Suporte..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cor">Cor do Setor</Label>
            <Select value={cor} onValueChange={setCor} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma cor" />
              </SelectTrigger>
              <SelectContent>
                {coresDisponiveis.map((corOption) => (
                  <SelectItem key={corOption.valor} value={corOption.valor}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: corOption.valor }}
                      ></div>
                      <span>{corOption.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacidade">Capacidade Máxima</Label>
            <Input
              id="capacidade"
              type="number"
              value={capacidadeMaxima}
              onChange={(e) => setCapacidadeMaxima(e.target.value)}
              min="1"
              max="100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição do setor..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="ativo"
              checked={ativo}
              onCheckedChange={setAtivo}
            />
            <Label htmlFor="ativo">Setor ativo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={createSetorMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="bg-amplie-primary hover:bg-amplie-primary-light"
              disabled={createSetorMutation.isPending}
            >
              {createSetorMutation.isPending ? 'Criando...' : 'Criar Setor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
