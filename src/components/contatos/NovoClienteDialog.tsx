
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface NovoClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClienteAdicionado: (cliente: any) => void;
}

const setores = ['Vendas', 'Suporte', 'Financeiro', 'Técnico'];
const tagsDisponiveis = ['VIP', 'Interessado', 'Problema Recorrente', 'Novo Cliente'];

export function NovoClienteDialog({ open, onOpenChange, onClienteAdicionado }: NovoClienteDialogProps) {
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    setor: '',
    atendente: '',
    status: 'ativo' as 'ativo' | 'inativo' | 'bloqueado'
  });
  const [tags, setTags] = useState<string[]>([]);
  const [novaTag, setNovaTag] = useState('');

  const adicionarTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removerTag = (tagRemover: string) => {
    setTags(tags.filter(tag => tag !== tagRemover));
  };

  const adicionarTagPersonalizada = () => {
    if (novaTag.trim() && !tags.includes(novaTag.trim())) {
      setTags([...tags, novaTag.trim()]);
      setNovaTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const novoCliente = {
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email || undefined,
      ultimoAtendente: formData.atendente,
      setorUltimoAtendimento: formData.setor,
      dataUltimaInteracao: new Date().toISOString(),
      tags,
      status: formData.status,
      totalAtendimentos: 0,
      atendentesAssociados: [
        {
          setor: formData.setor,
          atendente: formData.atendente
        }
      ]
    };

    onClienteAdicionado(novoCliente);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      setor: '',
      atendente: '',
      status: 'ativo'
    });
    setTags([]);
    setNovaTag('');
  };

  const isFormValid = formData.nome && formData.telefone && formData.setor && formData.atendente;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo do cliente"
                required
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="+55 11 99999-9999"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>

          {/* Setor e atendente */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="setor">Setor *</Label>
              <Select value={formData.setor} onValueChange={(value) => setFormData({ ...formData, setor: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(setor => (
                    <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="atendente">Atendente Responsável *</Label>
              <Input
                id="atendente"
                value={formData.atendente}
                onChange={(e) => setFormData({ ...formData, atendente: e.target.value })}
                placeholder="Nome do atendente"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="space-y-3">
              {/* Tags pré-definidas */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Tags disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {tagsDisponiveis.map(tag => (
                    <Button
                      key={tag}
                      type="button"
                      variant={tags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => tags.includes(tag) ? removerTag(tag) : adicionarTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tags selecionadas */}
              {tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Tags selecionadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button type="button" onClick={() => removerTag(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar tag personalizada */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Adicionar tag personalizada:</p>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Nova tag"
                    value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), adicionarTagPersonalizada())}
                  />
                  <Button type="button" onClick={adicionarTagPersonalizada} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Adicionar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
