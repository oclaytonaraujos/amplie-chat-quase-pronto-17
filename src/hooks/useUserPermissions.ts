import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export function useUserPermissions() {
  const { user, loading: authLoading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (authLoading || roleLoading) {
        return;
      }

      if (!user) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('permissoes, cargo')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar permissões:', error);
          setPermissions([]);
        } else {
          // Super admin tem acesso a tudo
          if (data?.cargo === 'super_admin') {
            setPermissions([
              'dashboard',
              'kanban',
              'atendimento',
              'contatos',
              'chat_interno',
              'chatbot',
              'setores',
              'usuarios',
              'painel'
            ]);
          } else {
            const userPermissions = data?.permissoes;
            if (Array.isArray(userPermissions)) {
              setPermissions(userPermissions as string[]);
            } else {
              setPermissions([]);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [user, authLoading, roleLoading]);

  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };

  const getFirstAvailableRoute = () => {
    const routePermissionMap = [
      { route: '/dashboard', permission: 'dashboard' },
      { route: '/kanban', permission: 'kanban' },
      { route: '/atendimento', permission: 'atendimento' },
      { route: '/contatos', permission: 'contatos' },
      { route: '/chat-interno', permission: 'chat_interno' },
      { route: '/chatbot', permission: 'chatbot' },
      { route: '/setores', permission: 'setores' },
      { route: '/usuarios', permission: 'usuarios' },
      { route: '/painel', permission: 'painel' }
    ];

    for (const { route, permission } of routePermissionMap) {
      if (hasPermission(permission)) {
        return route;
      }
    }

    // Fallback para painel caso não tenha nenhuma permissão específica
    return '/painel';
  };

  return {
    permissions,
    loading: authLoading || roleLoading || loading,
    hasPermission,
    getFirstAvailableRoute
  };
}