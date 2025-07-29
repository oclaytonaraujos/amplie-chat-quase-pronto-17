
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
        console.log('Usuário não autenticado, limpando role');
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log('Buscando role para usuário:', user.email);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('cargo')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erro ao buscar cargo do usuário:', error);
          
          // Se não encontrou o perfil, aguardar um pouco e tentar novamente
          if (error.code === 'PGRST116') {
            console.log('Perfil não encontrado, tentando novamente em 1 segundo...');
            setTimeout(fetchUserRole, 1000);
            return;
          }
          
          setRole(null);
        } else {
          console.log('Cargo encontrado:', data?.cargo);
          setRole(data?.cargo || null);
          
          // Log especial para super admin
          if (data?.cargo === 'super_admin') {
            console.log('✅ Confirmado: Usuário é Super Admin -', user.email);
          }
        }
      } catch (error) {
        console.error('Erro inesperado ao buscar cargo:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    console.log('useUserRole: fetchUserRole executando', { user: !!user, authLoading });
    fetchUserRole();
  }, [user, authLoading]);

  console.log('useUserRole: retornando', { role, loading: authLoading || loading, isSuperAdmin: role === 'super_admin' });
  
  return { 
    role, 
    loading: authLoading || loading,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin' || role === 'super_admin'
  };
}
