
import { supabase } from '@/integrations/supabase/client';

export interface SetorData {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  empresa_id: string;
  capacidade_maxima: number;
  agentes_ativos: number;
  atendimentos_ativos: number;
  created_at: string;
}

export interface CreateSetorData {
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  capacidade_maxima: number;
}

export interface UpdateSetorData {
  nome?: string;
  descricao?: string;
  cor?: string;
  ativo?: boolean;
  capacidade_maxima?: number;
}

export class SetoresService {
  static async getSetores(): Promise<SetorData[]> {
    // Primeiro, obter a empresa_id do usuário atual
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (profileError || !currentProfile?.empresa_id) {
      throw new Error('Usuário não está associado a uma empresa');
    }

    const { data, error } = await supabase
      .from('setores')
      .select('*')
      .eq('empresa_id', currentProfile.empresa_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao carregar setores: ${error.message}`);
    }

    return data || [];
  }

  static async createSetor(setor: CreateSetorData): Promise<SetorData> {
    // Obter a empresa_id do usuário atual
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('empresa_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (profileError || !currentProfile?.empresa_id) {
      throw new Error('Usuário não está associado a uma empresa');
    }

    const { data, error } = await supabase
      .from('setores')
      .insert([{
        ...setor,
        empresa_id: currentProfile.empresa_id,
        agentes_ativos: 0,
        atendimentos_ativos: 0
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar setor: ${error.message}`);
    }

    return data;
  }

  static async updateSetor(id: string, updates: UpdateSetorData): Promise<SetorData> {
    const { data, error } = await supabase
      .from('setores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar setor: ${error.message}`);
    }

    return data;
  }

  static async deleteSetor(id: string): Promise<void> {
    const { error } = await supabase
      .from('setores')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao excluir setor: ${error.message}`);
    }
  }
}
