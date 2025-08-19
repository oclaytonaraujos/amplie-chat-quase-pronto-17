
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      // Aguardar até que a autenticação esteja completa
      if (authLoading) {
        return;
      }

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Use the non-recursive is_user_super_admin function
        const { data: isSuperAdmin, error: superAdminError } = await supabase
          .rpc('is_user_super_admin');

        if (superAdminError) {
          console.error('Erro ao verificar super admin:', superAdminError);
        } else if (isSuperAdmin) {
          setRole('super_admin');
          setLoading(false);
          return;
        }

        // If not super admin, try to get role directly
        const { data, error } = await supabase
          .from('profiles')
          .select('cargo')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar cargo do usuário:', error);
          
          // Se não encontrou o perfil, aguardar um pouco e tentar novamente
          if (error.code === 'PGRST116') {
            setTimeout(fetchUserRole, 1000);
            return;
          }
          
          setRole(null);
        } else {
          setRole(data?.cargo || null);
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar cargo:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, authLoading]);

  return {
    role, 
    loading: authLoading || loading,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin' || role === 'super_admin'
  };
}
