
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Contato {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  tags?: string[];
  observacoes?: string;
  empresa_id?: string;
  status?: 'ativo' | 'inativo' | 'bloqueado';
  created_at: string;
  updated_at: string;
}

// Interface expandida para UI com dados simulados
export interface ContatoExpandido extends Contato {
  ultimoAtendente: string;
  setorUltimoAtendimento: string;
  dataUltimaInteracao: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  totalAtendimentos: number;
  atendentesAssociados: {
    setor: string;
    atendente: string;
  }[];
}

export function useContatos() {
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadContatos = async () => {
    try {
      setLoading(true);
      
      // Primeiro, obter a empresa_id do usuário atual
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user?.id)
        .single();

      if (!currentProfile?.empresa_id) {
        console.error('Usuário não está associado a uma empresa');
        return;
      }

      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .eq('empresa_id', currentProfile.empresa_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar contatos:', error);
        toast({
          title: "Erro ao carregar contatos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setContatos((data || []) as Contato[]);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarContato = async (contato: Omit<Contato, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>) => {
    try {
      // Obter a empresa_id do usuário atual
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user?.id)
        .single();

      if (!currentProfile?.empresa_id) {
        toast({
          title: "Erro",
          description: "Usuário não está associado a uma empresa.",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('contatos')
        .insert([{
          ...contato,
          empresa_id: currentProfile.empresa_id
        }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar contato",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      setContatos(prev => [data as Contato, ...prev]);
      toast({
        title: "Contato criado",
        description: `${contato.nome} foi adicionado com sucesso.`,
      });
      return data;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      return null;
    }
  };

  const editarContato = async (contato: Contato) => {
    try {
      const { data, error } = await supabase
        .from('contatos')
        .update({
          nome: contato.nome,
          telefone: contato.telefone,
          email: contato.email,
          empresa: contato.empresa,
          tags: contato.tags,
          observacoes: contato.observacoes,
          status: contato.status,
        })
        .eq('id', contato.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao editar contato",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setContatos(prev => prev.map(c => c.id === contato.id ? data as Contato : c));
      toast({
        title: "Contato atualizado",
        description: `As informações de ${contato.nome} foram atualizadas.`,
      });
      return true;
    } catch (error) {
      console.error('Erro ao editar contato:', error);
      return false;
    }
  };

  const excluirContato = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contatos')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao excluir contato",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      const contato = contatos.find(c => c.id === id);
      setContatos(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Contato excluído",
        description: `${contato?.nome} foi removido do sistema.`,
        variant: "destructive"
      });
      return true;
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadContatos();
    }
  }, [user]);

  const alterarStatusContato = async (id: string, novoStatus: 'ativo' | 'inativo' | 'bloqueado') => {
    try {
      const { data, error } = await supabase
        .from('contatos')
        .update({ status: novoStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao alterar status",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      setContatos(prev => prev.map(c => c.id === id ? data as Contato : c));
      toast({
        title: "Status alterado",
        description: `Contato ${novoStatus === 'ativo' ? 'ativado' : 'inativado'} com sucesso.`,
      });
      return true;
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      return false;
    }
  };

  // Função para converter Contato para ContatoExpandido (dados simulados para UI)
  const expandirContato = (contato: Contato): ContatoExpandido => ({
    ...contato,
    ultimoAtendente: 'Ana Silva',
    setorUltimoAtendimento: 'Vendas',
    dataUltimaInteracao: contato.updated_at,
    status: contato.status || 'ativo' as const,
    totalAtendimentos: 0,
    atendentesAssociados: [
      {
        setor: 'Vendas',
        atendente: 'Ana Silva'
      }
    ]
  });

  return {
    contatos,
    loading,
    criarContato,
    editarContato,
    excluirContato,
    alterarStatusContato,
    loadContatos,
    expandirContato,
  };
}
