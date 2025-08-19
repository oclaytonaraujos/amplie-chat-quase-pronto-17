
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
        // Primeiro tenta buscar o cargo diretamente com timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        );

        const profilePromise = supabase
          .from('profiles')
          .select('cargo')
          .eq('id', user.id)
          .single();

        const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

        if (error) {
          // Se erro de timeout ou não encontrado, usar função RPC
          if (error.message === 'timeout' || error.code === 'PGRST116') {
            const { data: isSuperAdmin, error: rpcError } = await supabase
              .rpc('is_user_super_admin');

            if (!rpcError && isSuperAdmin) {
              setRole('super_admin');
            } else {
              // Aguardar um pouco e tentar novamente
              setTimeout(fetchUserRole, 1000);
              return;
            }
          } else {
            console.error('Erro ao buscar cargo do usuário:', error);
            setRole(null);
          }
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
