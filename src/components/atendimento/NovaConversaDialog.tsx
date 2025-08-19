import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, MessageSquare } from 'lucide-react';
import { SyncLoaderInline } from '@/components/ui/sync-loader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NovaConversaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversaCriada: (conversa: any) => void;
}

export function NovaConversaDialog({ open, onOpenChange, onConversaCriada }: NovaConversaDialogProps) {
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const formatarTelefone = (value: string) => {
    // Remove tudo que não é número
    const numeroLimpo = value.replace(/\D/g, '');
    
    // Aplica formatação brasileira
    if (numeroLimpo.length <= 11) {
      if (numeroLimpo.length <= 2) {
        return numeroLimpo;
      } else if (numeroLimpo.length <= 7) {
        return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2)}`;
      } else if (numeroLimpo.length <= 10) {
        return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 6)}-${numeroLimpo.slice(6)}`;
      } else {
        return `(${numeroLimpo.slice(0, 2)}) ${numeroLimpo.slice(2, 7)}-${numeroLimpo.slice(7, 11)}`;
      }
    }
    return value;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarTelefone(e.target.value);
    setTelefone(formatted);
  };

  const criarNovaConversa = async () => {
    if (!telefone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Por favor, informe o número de telefone.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    setLoading(true);

    try {
      // Obter empresa_id do usuário atual
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (!profile?.empresa_id) {
        throw new Error('Usuário não está associado a uma empresa');
      }

      // Obter dados do perfil completo para usar o nome
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // Buscar ou criar contato
      const telefoneNumeros = telefone.replace(/\D/g, '');
      
      let contato;
      const { data: contatoExistente } = await supabase
        .from('contatos')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('telefone', telefoneNumeros)
        .single();

      if (contatoExistente) {
        contato = contatoExistente;
      } else {
        // Criar novo contato
        const { data: novoContato, error: errorContato } = await supabase
          .from('contatos')
          .insert({
            nome: `Contato ${telefoneNumeros}`,
            telefone: telefoneNumeros,
            empresa_id: profile.empresa_id,
            status: 'ativo'
          })
          .select()
          .single();

        if (errorContato) throw errorContato;
        contato = novoContato;
      }

      // Verificar se já existe conversa ativa para este contato
      const { data: conversaExistente } = await supabase
        .from('conversas')
        .select('*')
        .eq('contato_id', contato.id)
        .eq('empresa_id', profile.empresa_id)
        .in('status', ['ativo', 'em-atendimento', 'pendente'])
        .single();

      if (conversaExistente) {
        // Se existe conversa ativa, redirecionar para ela
        onConversaCriada(conversaExistente);
        toast({
          title: "Conversa encontrada",
          description: "Redirecionando para conversa existente com este contato.",
        });
      } else {
        // Criar nova conversa
        const { data: novaConversa, error: errorConversa } = await supabase
          .from('conversas')
          .insert({
            contato_id: contato.id,
            empresa_id: profile.empresa_id,
            agente_id: user.id,
            status: 'ativo',
            canal: 'whatsapp',
            prioridade: 'normal',
            setor: 'Geral'
          })
          .select(`
            *,
            contatos(id, nome, telefone, email),
            profiles(id, nome)
          `)
          .single();

        if (errorConversa) throw errorConversa;

        onConversaCriada(novaConversa);
        toast({
          title: "Conversa criada",
          description: "Nova conversa iniciada com sucesso.",
        });
      }

      // Limpar formulário
      setTelefone('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: "Erro ao criar conversa",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      criarNovaConversa();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-sm font-medium">
              Número de Telefone *
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="telefone"
                value={telefone}
                onChange={handleTelefoneChange}
                placeholder="(11) 99999-9999"
                className="pl-10"
                maxLength={15}
                onKeyPress={handleKeyPress}
              />
            </div>
            <p className="text-xs text-gray-500">
              Informe o número com DDD
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={criarNovaConversa}
              disabled={loading || !telefone.trim()}
            >
              {loading ? (
                <>
                  <SyncLoaderInline />
                  Criando...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Iniciar Conversa
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}