
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  cargo?: string;
  setor?: string;
  status: string;
  avatar_url?: string;
  empresa_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Contato {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  tags?: string[];
  observacoes?: string;
  empresa_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversa {
  id: string;
  contato_id?: string;
  agente_id?: string;
  status: string;
  canal: string;
  prioridade: string;
  setor?: string;
  tags?: string[];
  empresa_id?: string;
  created_at: string;
  updated_at: string;
  contatos?: Contato;
  profiles?: Profile;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  remetente_tipo: string;
  remetente_id?: string;
  conteudo: string;
  tipo_mensagem: string;
  metadata?: any;
  lida: boolean;
  created_at: string;
}

export function useSupabaseData() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar perfil do usuário
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao carregar perfil:', error);
          return;
        }

        setProfile(data as Profile);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    };

    loadProfile();
  }, [user]);

  // Carregar contatos
  const loadContatos = async () => {
    try {
      const { data, error } = await supabase
        .from('contatos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar contatos:', error);
        return;
      }

      setContatos(data || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  // Carregar conversas
  const loadConversas = async () => {
    try {
      const { data, error } = await supabase
        .from('conversas')
        .select(`
          *,
          contatos(*),
          profiles(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar conversas:', error);
        return;
      }

      setConversas(data as Conversa[] || []);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar contato
  const createContato = async (contato: Omit<Contato, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Buscar empresa_id do usuário se não foi fornecido
      let empresaId = contato.empresa_id;
      if (!empresaId && profile?.empresa_id) {
        empresaId = profile.empresa_id;
      }

      const { data, error } = await supabase
        .from('contatos')
        .insert([{ ...contato, empresa_id: empresaId }])
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

      setContatos(prev => [data, ...prev]);
      toast({
        title: "Contato criado",
        description: "O contato foi criado com sucesso.",
      });
      return data;
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      return null;
    }
  };

  // Criar conversa
  const createConversa = async (conversa: Omit<Conversa, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Buscar empresa_id do usuário se não foi fornecido
      let empresaId = conversa.empresa_id;
      if (!empresaId && profile?.empresa_id) {
        empresaId = profile.empresa_id;
      }

      const { data, error } = await supabase
        .from('conversas')
        .insert([{
          ...conversa,
          agente_id: user?.id,
          empresa_id: empresaId
        }])
        .select(`
          *,
          contatos(*),
          profiles(*)
        `)
        .single();

      if (error) {
        toast({
          title: "Erro ao criar conversa",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      setConversas(prev => [data as Conversa, ...prev]);
      return data;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      loadContatos();
      loadConversas();
    }
  }, [user, profile]);

  return {
    profile,
    contatos,
    conversas,
    loading,
    createContato,
    createConversa,
    loadContatos,
    loadConversas,
  };
}
