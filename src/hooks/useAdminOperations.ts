import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export function useAdminOperations() {
  const { executeOperation } = useAdminAuth();

  // Operações de Empresas
  const empresaOperations = {
    create: useCallback(async (data: any) => {
      return executeOperation(
        async () => {
          const { data: result, error } = await supabase.from('empresas').insert(data).select().single();
          if (error) throw error;
          return result;
        },
        { successMessage: 'Empresa criada com sucesso' }
      );
    }, [executeOperation]),

    update: useCallback(async (id: string, data: any) => {
      return executeOperation(
        async () => {
          const { data: result, error } = await supabase.from('empresas').update(data).eq('id', id).select().single();
          if (error) throw error;
          return result;
        },
        { successMessage: 'Empresa atualizada com sucesso' }
      );
    }, [executeOperation]),

    delete: useCallback(async (id: string) => {
      return executeOperation(
        async () => {
          const { error } = await supabase.from('empresas').delete().eq('id', id);
          if (error) throw error;
          return true;
        },
        { successMessage: 'Empresa excluída com sucesso' }
      );
    }, [executeOperation]),

    fetch: useCallback(async () => {
      return executeOperation(
        async () => {
          const { data, error } = await supabase
            .from('empresas')
            .select(`*, planos(nome)`)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
        { errorMessage: 'Erro ao carregar empresas', successMessage: '' }
      );
    }, [executeOperation]),

    toggleStatus: useCallback(async (id: string, currentStatus: boolean) => {
      return executeOperation(
        async () => {
          const { error } = await supabase.from('empresas').update({ ativo: !currentStatus }).eq('id', id);
          if (error) throw error;
          return true;
        },
        { successMessage: `Empresa ${!currentStatus ? 'ativada' : 'desativada'} com sucesso` }
      );
    }, [executeOperation])
  };

  // Operações de Usuários
  const userOperations = {
    create: useCallback(async (userData: any) => {
      return executeOperation(
        async () => {
          // Criar usuário na autenticação
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              nome: userData.nome,
              cargo: userData.cargo,
              setor: userData.setor,
              empresa_id: userData.empresa_id
            }
          });

          if (authError) throw authError;

          // Criar perfil
          const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            nome: userData.nome,
            email: userData.email,
            empresa_id: userData.empresa_id,
            cargo: userData.cargo,
            setor: userData.setor,
            permissoes: userData.permissoes || []
          });

          if (profileError) throw profileError;

          return authData.user;
        },
        { successMessage: 'Usuário criado com sucesso' }
      );
    }, [executeOperation]),

    delete: useCallback(async (userId: string) => {
      return executeOperation(
        async () => {
          const { error } = await supabase.auth.admin.deleteUser(userId);
          if (error) throw error;
          return true;
        },
        { successMessage: 'Usuário excluído com sucesso' }
      );
    }, [executeOperation])
  };

  // Operações de Planos
  const planOperations = {
    create: useCallback(async (data: any) => {
      return executeOperation(
        async () => {
          const { data: result, error } = await supabase.from('planos').insert(data).select().single();
          if (error) throw error;
          return result;
        },
        { successMessage: 'Plano criado com sucesso' }
      );
    }, [executeOperation]),

    update: useCallback(async (id: string, data: any) => {
      return executeOperation(
        async () => {
          const { data: result, error } = await supabase.from('planos').update(data).eq('id', id).select().single();
          if (error) throw error;
          return result;
        },
        { successMessage: 'Plano atualizado com sucesso' }
      );
    }, [executeOperation]),

    fetch: useCallback(async () => {
      return executeOperation(
        async () => {
          const { data, error } = await supabase.from('planos').select('*').order('created_at');
          if (error) throw error;
          return data;
        },
        { errorMessage: 'Erro ao carregar planos', successMessage: '' }
      );
    }, [executeOperation])
  };

  return {
    empresas: empresaOperations,
    usuarios: userOperations,
    planos: planOperations
  };
}